import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resolveSpecificDepartment, normalizeText } from "@/lib/routing/departmentResolver";

// Service role admin client for queries and updates
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Lightweight bigram-based string similarity (Sorensen-Dice coefficient over 2-char bigrams),
 * equivalent to the `string-similarity` npm package.
 */
function compareTwoStrings(first: string, second: string): number {
  first = first.replace(/\s+/g, " ").toLowerCase().trim();
  second = second.replace(/\s+/g, " ").toLowerCase().trim();
  if (first === second) return 1;
  if (first.length < 2 || second.length < 2) return 0;

  const firstBigrams = new Map<string, number>();
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2);
    firstBigrams.set(bigram, (firstBigrams.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2);
    const count = firstBigrams.get(bigram);
    if (count && count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }
  return (2.0 * intersectionSize) / (first.length + second.length - 2);
}

/**
 * Word-based overlap similarity (Dice coefficient on words).
 */
function wordOverlapSimilarity(first: string, second: string): number {
  const getWords = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 1)
    );

  const words1 = getWords(first);
  const words2 = getWords(second);
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  return (2 * intersection) / (words1.size + words2.size);
}

/**
 * Combined similarity score (takes maximum of bigram similarity and word overlap similarity).
 */
function getTextSimilarity(str1: string, str2: string): number {
  return Math.max(compareTwoStrings(str1, str2), wordOverlapSimilarity(str1, str2));
}

/**
 * Tool 1: checkDuplicates
 * Query complaints for unresolved items created within last 30 days inside ~200m bounding box.
 * Returns top similarity matches.
 */
export async function checkDuplicates(
  text: string,
  latitude: number,
  longitude: number,
  currentComplaintId?: string
) {
  try {
    const latDelta = 200 / 111000; // ~0.0018 degrees lat
    // Adjust longitude delta based on latitude cosine (default roughly 0.002 if invalid lat)
    const cosLat = Math.cos((latitude * Math.PI) / 180);
    const lngDelta = 200 / (111000 * (Math.abs(cosLat) > 0.1 ? cosLat : 0.9));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .from("complaints")
      .select("id, raw_text, category, created_at, latitude, longitude")
      .neq("status", "resolved")
      .gte("created_at", thirtyDaysAgo);

    if (typeof latitude === "number" && !isNaN(latitude) && typeof longitude === "number" && !isNaN(longitude)) {
      query = query
        .gte("latitude", latitude - latDelta)
        .lte("latitude", latitude + latDelta)
        .gte("longitude", longitude - lngDelta)
        .lte("longitude", longitude + lngDelta);
    }

    const { data: candidates, error } = await query;
    if (error) {
      console.error("[checkDuplicates] DB query error:", error);
      return { matches: [] };
    }

    const filteredCandidates = (candidates || []).filter((c) => c.id !== currentComplaintId);

    const matches = filteredCandidates
      .map((c) => {
        const similarity = getTextSimilarity(text, c.raw_text || "");
        return {
          id: c.id,
          raw_text: c.raw_text,
          category: c.category,
          created_at: c.created_at,
          similarity: Math.round(similarity * 100) / 100,
        };
      })
      .filter((c) => c.similarity >= 0.2 || (c.category && text.toLowerCase().includes((c.category || "").toLowerCase())))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return { matches };
  } catch (err) {
    console.error("[checkDuplicates] Unexpected error:", err);
    return { matches: [] };
  }
}

/**
 * Tool 2: getDepartmentWorkload
 * Resolve department_id or category name, compute pending count and average resolution time in days.
 */
export async function getDepartmentWorkload(department_id_or_category: string) {
  try {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      department_id_or_category
    );

    let department: { id: string; name: string } | null = null;

    if (isUuid) {
      const { data } = await supabaseAdmin
        .from("departments")
        .select("id, name")
        .eq("id", department_id_or_category)
        .single();
      department = data;
    } else {
      // Resolve a category label / department name to an actual DB department.
      const { data: allDepts } = await supabaseAdmin.from("departments").select("id, name");
      if (allDepts && allDepts.length > 0) {
        const target = normalizeText(department_id_or_category);

        // 1. Exact normalized match against a real department name
        //    (handles "Other", "Roads", "Water Supply", "Electricity", "Sanitation").
        department = allDepts.find((d) => normalizeText(d.name) === target) || null;

        // 2. Robust synonym/keyword resolution → canonical name → DB department.
        if (!department) {
          const canonical = resolveSpecificDepartment(department_id_or_category);
          if (canonical) {
            const cn = normalizeText(canonical);
            department =
              allDepts.find((d) => normalizeText(d.name) === cn) ||
              allDepts.find((d) => normalizeText(d.name).includes(cn) || cn.includes(normalizeText(d.name))) ||
              null;
          }
        }
        // NOTE: intentionally NOT defaulting to the "Other" department here.
        // Returning null when there is no genuine match lets the caller apply
        // a text-based safety net before deciding to fall back to "Other".
      }

      if (!department) {
        console.warn(
          `[getDepartmentWorkload] No department matched input "${department_id_or_category}" (normalized: "${normalizeText(department_id_or_category)}").`
        );
      }
    }

    if (!department) {
      return {
        department_id: null,
        department_name: department_id_or_category,
        pending_count: 0,
        avg_resolution_days: 0,
      };
    }

    // Count pending complaints
    const { count: pending_count } = await supabaseAdmin
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .eq("department_id", department.id)
      .in("status", ["submitted", "in_review", "assigned"]);

    // Compute avg resolution time in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: resolvedList } = await supabaseAdmin
      .from("complaints")
      .select("created_at, updated_at")
      .eq("department_id", department.id)
      .eq("status", "resolved")
      .gte("updated_at", thirtyDaysAgo);

    let avg_resolution_days = 0;
    if (resolvedList && resolvedList.length > 0) {
      const totalMs = resolvedList.reduce((sum, item) => {
        const start = new Date(item.created_at).getTime();
        const end = new Date(item.updated_at).getTime();
        return sum + Math.max(0, end - start);
      }, 0);
      avg_resolution_days =
        Math.round((totalMs / resolvedList.length / (1000 * 60 * 60 * 24)) * 10) / 10;
    }

    return {
      department_id: department.id,
      department_name: department.name,
      pending_count: pending_count || 0,
      avg_resolution_days,
    };
  } catch (err) {
    console.error("[getDepartmentWorkload] Error:", err);
    return {
      department_id: null,
      department_name: department_id_or_category,
      pending_count: 0,
      avg_resolution_days: 0,
    };
  }
}

/**
 * Tool 3: escalatePriority
 * Update priority on complaints and insert audit note into complaint_updates.
 */
export async function escalatePriority(
  complaint_id: string,
  reason: string,
  new_priority: "medium" | "high"
) {
  try {
    const { data: currentComplaint } = await supabaseAdmin
      .from("complaints")
      .select("status")
      .eq("id", complaint_id)
      .single();

    const status_at_time = currentComplaint?.status || "submitted";

    // Update complaints priority
    const { error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update({ priority: new_priority })
      .eq("id", complaint_id);

    if (updateErr) {
      throw updateErr;
    }

    // Insert audit update (updated_by is nullable in schema)
    await supabaseAdmin.from("complaint_updates").insert({
      complaint_id,
      note: reason,
      status_at_time,
      updated_by: null,
    });

    return {
      success: true,
      complaint_id,
      escalated_to: new_priority,
      reason,
    };
  } catch (err) {
    console.error("[escalatePriority] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tool definitions in OpenAI/Groq function calling format.
 */
export const triageToolsDefinitions = [
  {
    type: "function",
    function: {
      name: "check_duplicates",
      description:
        "Returns any existing unresolved complaints that likely describe the same issue, within ~200m and semantically similar text. ALWAYS call this first for every complaint — never skip it.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The raw text of the complaint being triaged.",
          },
          latitude: {
            type: "number",
            description: "The GPS latitude of the complaint.",
          },
          longitude: {
            type: "number",
            description: "The GPS longitude of the complaint.",
          },
        },
        required: ["text", "latitude", "longitude"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_department_workload",
      description:
        "Returns current queue size and average resolution time for a department. Use this after you've picked a category, to resolve the actual department_id and to inform (not override) your reasoning about urgency.",
      parameters: {
        type: "object",
        properties: {
          department_id: {
            type: "string",
            description:
              "The department UUID or category name (e.g. 'Water', 'Roads', 'Sanitation', 'Electricity', 'Other') to resolve and check workload for.",
          },
        },
        required: ["department_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_priority",
      description:
        "Use ONLY if you discover, via check_duplicates or workload context, that this complaint is part of a recurring pattern (3+ similar complaints in the same area within 14 days) or describes a safety hazard (exposed wiring, open manholes, structural damage, contaminated water supply). Do not call this for routine single complaints, even urgent-sounding ones — reserve it for cases with actual corroborating evidence from your tool calls.",
      parameters: {
        type: "object",
        properties: {
          complaint_id: {
            type: "string",
            description: "The UUID of the complaint being escalated.",
          },
          reason: {
            type: "string",
            description:
              "Clear, specific explanation citing what was found via tool calls (not just 'seems urgent').",
          },
          new_priority: {
            type: "string",
            enum: ["medium", "high"],
            description: "The new escalated priority level.",
          },
        },
        required: ["complaint_id", "reason", "new_priority"],
      },
    },
  },
];

/**
 * Dispatcher function for tool calls.
 */
export async function executeToolCall(
  name: string,
  args: Record<string, any>,
  currentComplaintId: string
) {
  if (name === "check_duplicates") {
    return await checkDuplicates(
      args.text || "",
      Number(args.latitude) || 0,
      Number(args.longitude) || 0,
      currentComplaintId
    );
  } else if (name === "get_department_workload") {
    return await getDepartmentWorkload(String(args.department_id || "Other"));
  } else if (name === "escalate_priority") {
    return await escalatePriority(
      String(args.complaint_id || currentComplaintId),
      String(args.reason || "Safety hazard or recurring pattern identified"),
      args.new_priority === "high" ? "high" : "medium"
    );
  }
  return { error: `Unknown tool name: ${name}` };
}
