/**
 * lib/ai/checkDuplicates.ts
 * Server-side only — uses supabaseAdmin (service-role key) and groq.
 * Never import this from a client component.
 *
 * Two-stage duplicate detection:
 *   Stage 1 — SQL: nearby_complaints() finds candidates in the same department,
 *              within 300 m, not resolved/rejected, from the last 7 days.
 *   Stage 2 — LLM: A single batched Groq call confirms which candidates
 *              actually describe the SAME underlying civic issue as the new
 *              complaint (e.g. same pothole, same leak) vs. merely nearby ones.
 *
 * If Stage 2 fails for any reason, we treat the new complaint as unique
 * (no cluster assignment) — a missed cluster is safer than a wrongly merged one.
 */

import { createClient } from "@supabase/supabase-js";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

// Service-role admin client — bypasses RLS for cluster update writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Priority ordering (higher index = higher priority)
const PRIORITY_ORDER: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function priorityValue(p: string | null | undefined): number {
  return PRIORITY_ORDER[p ?? "low"] ?? 0;
}

// Row returned by the nearby_complaints SQL function
interface NearbyRow {
  id: string;
  priority: string | null;
  cluster_id: string | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  raw_text: string;
  created_at: string;
}

export interface DuplicateCheckInput {
  /** The ID of the complaint that was just created */
  complaintId: string;
  /** The raw text of the new complaint (used for LLM similarity check) */
  rawText: string;
  lat: number;
  lng: number;
  departmentId: string;
  /** Priority already assigned by the classifier (may be null if classifier hasn't run yet) */
  priority: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  clusterId: string | null;
  similarCount: number;
  isPrimary: boolean;
  matchedComplaints: Array<{
    id: string;
    raw_text: string;
    created_at: string;
    priority: string | null;
  }>;
}

/** Generates a v4-style UUID */
function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Stage 2: Use a single batched Groq call to filter `candidates` down to only
 * those that describe the SAME underlying civic issue as `newText`.
 *
 * Returns the subset of candidates confirmed as the same issue.
 * On any error, returns an empty array (fail-safe: no clustering).
 */
async function filterBySimilarity(
  newText: string,
  candidates: NearbyRow[]
): Promise<NearbyRow[]> {
  if (candidates.length === 0) return [];

  // Truncate texts to keep the prompt compact (Groq free tier has token limits)
  const truncate = (t: string, max = 200) =>
    t.length > max ? t.slice(0, max) + "…" : t;

  const candidateList = candidates
    .map((c, i) => `  ${i + 1}. ID="${c.id}" — "${truncate(c.raw_text)}"`)
    .join("\n");

  const systemPrompt = `You are a civic grievance deduplication assistant.
You will be given a NEW complaint and a list of NEARBY complaints.
Your job: identify which of the nearby complaints describe the EXACT SAME underlying civic issue as the new complaint — not just a similar type of problem, but the same specific incident (e.g. the same pothole, the same broken streetlight, the same water leak).

Criteria for "same issue":
- Both complaints describe the same physical defect or failure at essentially the same spot.
- Different wording, languages, or level of detail is fine as long as the underlying problem is the same.

Criteria for "different issue":
- Same department, same street, but two different problems (e.g. "pothole" vs "broken streetlight" are NOT the same issue).
- Same type of problem but at clearly different locations.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation:
{ "matching_ids": ["<id>", ...] }

If none match, return: { "matching_ids": [] }`;

  const userMessage = `NEW COMPLAINT: "${truncate(newText, 300)}"

NEARBY COMPLAINTS:
${candidateList}

Which of the nearby complaints describe the same underlying civic issue as the new complaint? Return matching IDs only.`;

  try {
    const response = await Promise.race([
      groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.0, // Deterministic — this is a classification task
        max_tokens: 256,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Groq similarity check timed out")), 8000)
      ),
    ]);

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    const parsed = JSON.parse(content) as { matching_ids?: string[] };
    const matchingIds = new Set(parsed.matching_ids ?? []);

    if (matchingIds.size === 0) return [];

    const confirmed = candidates.filter((c) => matchingIds.has(c.id));
    console.log(
      `[checkDuplicates] Groq confirmed ${confirmed.length}/${candidates.length} nearby complaints as same issue`
    );
    return confirmed;
  } catch (err) {
    // Fail-safe: if Groq errors or times out, treat as no match
    console.warn(
      "[checkDuplicates] Groq similarity check failed — treating complaint as unique (no cluster):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export async function checkDuplicates(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  const { complaintId, rawText, lat, lng, departmentId, priority } = input;

  // ── Stage 1: SQL proximity filter ──────────────────────────────────────────
  const { data: nearby, error: rpcError } = await supabaseAdmin.rpc(
    "nearby_complaints",
    {
      lat,
      lng,
      dept_id: departmentId,
      radius_m: 300,
      days_back: 7,
    }
  );

  if (rpcError) {
    console.error("[checkDuplicates] RPC error:", rpcError.message);
    throw rpcError;
  }

  // Exclude the complaint we just created (it's already in the DB)
  const candidates: NearbyRow[] = (nearby ?? []).filter(
    (r: NearbyRow) => r.id !== complaintId
  );

  if (candidates.length === 0) {
    return {
      isDuplicate: false,
      clusterId: null,
      similarCount: 0,
      isPrimary: true,
      matchedComplaints: [],
    };
  }

  // ── Stage 2: LLM text-similarity filter ────────────────────────────────────
  const confirmed = await filterBySimilarity(rawText, candidates);

  if (confirmed.length === 0) {
    // Nearby complaints exist, but Groq confirmed none describe the same issue
    // (or the check failed) — treat this as a unique complaint
    return {
      isDuplicate: false,
      clusterId: null,
      similarCount: 0,
      isPrimary: true,
      matchedComplaints: [],
    };
  }

  // ── Stage 3: Cluster assignment ────────────────────────────────────────────

  // Reuse an existing cluster_id if any confirmed match already has one
  const existingClusterId =
    confirmed.find((m) => m.cluster_id)?.cluster_id ?? null;
  const clusterId: string = existingClusterId ?? randomUUID();

  // Determine current primary among confirmed matches (is_duplicate=false wins;
  // if none, pick highest priority, tiebreak oldest)
  let currentPrimary: NearbyRow | null =
    confirmed.find((m) => !m.is_duplicate) ?? null;

  if (!currentPrimary) {
    currentPrimary = confirmed.reduce<NearbyRow>((best, m) => {
      const bv = priorityValue(best.priority);
      const mv = priorityValue(m.priority);
      if (mv > bv) return m;
      if (mv === bv && new Date(m.created_at) < new Date(best.created_at))
        return m;
      return best;
    }, confirmed[0]);
  }

  // Decide if the new complaint supersedes the current primary
  const newPriorityVal = priorityValue(priority);
  const existingPrimaryVal = priorityValue(currentPrimary.priority);
  const newIsPrimary = newPriorityVal > existingPrimaryVal;

  const primaryId = newIsPrimary ? complaintId : currentPrimary.id;

  // Bulk-update all confirmed matches: cluster_id, is_duplicate=true, duplicate_of=primaryId
  const matchIds = confirmed.map((m) => m.id);

  const { error: bulkErr } = await supabaseAdmin
    .from("complaints")
    .update({
      cluster_id: clusterId,
      is_duplicate: true,
      duplicate_of: primaryId,
    })
    .in("id", matchIds);

  if (bulkErr) {
    console.error("[checkDuplicates] Bulk update error:", bulkErr.message);
    throw bulkErr;
  }

  // Update the new complaint itself
  const { error: selfErr } = await supabaseAdmin
    .from("complaints")
    .update({
      cluster_id: clusterId,
      is_duplicate: !newIsPrimary,
      duplicate_of: newIsPrimary ? null : primaryId,
    })
    .eq("id", complaintId);

  if (selfErr) {
    console.error("[checkDuplicates] Self-update error:", selfErr.message);
    throw selfErr;
  }

  return {
    isDuplicate: !newIsPrimary,
    clusterId,
    similarCount: confirmed.length,
    isPrimary: newIsPrimary,
    matchedComplaints: confirmed.map((m) => ({
      id: m.id,
      raw_text: m.raw_text,
      created_at: m.created_at,
      priority: m.priority,
    })),
  };
}
