import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClusterSummaries } from "@/lib/queries/complaints";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

// ── In-memory cache ────────────────────────────────────────────────────────────
// A single Groq call is made at most once per TTL window regardless of how many
// admins reload the dashboard — important for demo stability and cost.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  rootCauses: RootCauseResult[];
  totalClustered: number;
  cachedAt: number;
}

interface RootCauseResult {
  cluster_index: number;
  root_cause: string;
  suggested_fix: string;
  estimated_impact: string;
  department: string;
  location_zone: string;
  count: number;
}

let cache: CacheEntry | null = null;

export async function GET() {
  // Return cached result if still fresh
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    const ageSeconds = Math.floor((Date.now() - cache.cachedAt) / 1000);
    const expiresInSeconds = Math.ceil((CACHE_TTL_MS - (Date.now() - cache.cachedAt)) / 1000);

    return NextResponse.json(
      { rootCauses: cache.rootCauses, totalClustered: cache.totalClustered },
      {
        headers: {
          "X-Cache": "HIT",
          "X-Cache-Age": String(ageSeconds),
          "X-Cache-Expires-In": String(expiresInSeconds),
        },
      }
    );
  }

  const supabase = await createClient();
  const clusters = await getClusterSummaries(supabase);

  // Only send clusters with 3+ complaints — these are the real infrastructure patterns
  const significant = clusters.filter((c) => c.count >= 3).slice(0, 12);

  if (significant.length === 0) {
    return NextResponse.json(
      { rootCauses: [], totalClustered: 0 },
      { headers: { "X-Cache": "MISS" } }
    );
  }

  const prompt = `You are a senior civic infrastructure analyst advising a municipal government. Below are clusters of citizen complaints, pre-aggregated by department, complaint category, and geographic zone (~1 km grid cells).

Your task: For each cluster, identify the single most likely underlying root cause and recommend one concrete, high-impact infrastructure fix. Also estimate the preventive impact if the fix is implemented.

Clusters:
${significant
  .map(
    (c, i) =>
      `${i + 1}. Department: ${c.department_name}
   Category: ${c.category || "Uncategorized"}
   Location zone: ${c.location_key}
   Complaint count: ${c.count}
   Sample complaints: ${c.sample_texts.join(" | ")}`
  )
  .join("\n\n")}

Rules:
- Be specific and actionable — name the infrastructure issue, not generic problems
- estimated_impact must be a single punchy sentence like "prevents ~12 complaints/month" or "reduces downtime by 60%"
- location_zone should be a human-readable label derived from the zone coordinates, like "Kurla East" or "Andheri West" — make a reasonable inference from the complaint texts if possible
- Respond ONLY with a valid JSON array, no markdown fences, no preamble

Required JSON shape:
[{
  "cluster_index": 1,
  "root_cause": "short phrase (max 8 words)",
  "suggested_fix": "one concrete action sentence",
  "estimated_impact": "punchy one-line impact estimate",
  "department": "dept name",
  "location_zone": "human-readable area name",
  "count": number
}]`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // low temperature for consistent, structured output
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const rootCauses: RootCauseResult[] = JSON.parse(cleaned);

    const totalClustered = significant.reduce((sum, c) => sum + c.count, 0);

    // Store in cache
    cache = { rootCauses, totalClustered, cachedAt: Date.now() };

    return NextResponse.json(
      { rootCauses, totalClustered },
      {
        headers: {
          "X-Cache": "MISS",
          "X-Cache-Age": "0",
          "X-Cache-Expires-In": String(CACHE_TTL_MS / 1000),
        },
      }
    );
  } catch (err) {
    console.error("Root cause analysis error:", err);
    // On error, return stale cache if available — better than nothing during a demo
    if (cache) {
      return NextResponse.json(
        { rootCauses: cache.rootCauses, totalClustered: cache.totalClustered },
        { headers: { "X-Cache": "STALE" } }
      );
    }
    return NextResponse.json(
      { rootCauses: [], totalClustered: 0 },
      { status: 500, headers: { "X-Cache": "ERROR" } }
    );
  }
}