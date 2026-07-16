import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { runTriageAgent, TriageResult } from "@/lib/agents/triageAgent";
import { getDepartmentWorkload } from "@/lib/agents/tools";

// Create a Supabase admin client using the service role key to bypass RLS policies
// since citizens do not have SQL-level UPDATE access on the complaints table.
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    let { complaintId, rawText, latitude, longitude } = await request.json();

    if (!complaintId || !rawText) {
      return NextResponse.json(
        { error: "complaintId and rawText are required." },
        { status: 400 }
      );
    }

    // If coordinates weren't supplied in request body, read them from the DB row
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      const { data: cRow } = await supabaseAdmin
        .from("complaints")
        .select("latitude, longitude, raw_text")
        .eq("id", complaintId)
        .single();
      if (cRow) {
        if (typeof latitude !== "number" && typeof cRow.latitude === "number") {
          latitude = cRow.latitude;
        }
        if (typeof longitude !== "number" && typeof cRow.longitude === "number") {
          longitude = cRow.longitude;
        }
        if (!rawText && cRow.raw_text) {
          rawText = cRow.raw_text;
        }
      }
    }

    const lat = typeof latitude === "number" && !isNaN(latitude) ? latitude : 18.5204;
    const lng = typeof longitude === "number" && !isNaN(longitude) ? longitude : 73.8567;

    console.log(`[Classifier API] Running agentic triage for complaint ${complaintId}...`);

    let triageResult: TriageResult;
    try {
      triageResult = await runTriageAgent(complaintId, rawText, lat, lng);
    } catch (agentErr) {
      console.error("[Classifier API] runTriageAgent threw unexpected exception, using direct fallback:", agentErr);
      triageResult = {
        category: "Other",
        department_id: null,
        priority: "medium",
        reasoning: "Classified via emergency fallback after triage agent error.",
        is_duplicate_of: null,
        escalated: false,
      };
      try {
        const deptInfo = await getDepartmentWorkload("Other");
        triageResult.department_id = deptInfo.department_id || null;
      } catch {
        // ignore
      }
    }

    // Update complaint row with triage results
    const fullPayload: Record<string, any> = {
      category: triageResult.category,
      department_id: triageResult.department_id || null,
      priority: triageResult.priority,
      ai_reasoning: triageResult.reasoning || null,
      is_duplicate_of: triageResult.is_duplicate_of || null,
    };

    let { error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update(fullPayload)
      .eq("id", complaintId);

    // If ai_reasoning / is_duplicate_of columns don't exist yet in DB (pre-migration run), retry without them
    if (
      updateErr &&
      updateErr.message &&
      (updateErr.message.includes("column") || updateErr.message.includes("schema")) &&
      (updateErr.message.includes("ai_reasoning") ||
        updateErr.message.includes("is_duplicate_of") ||
        updateErr.message.includes("does not exist"))
    ) {
      console.warn(
        "[Classifier API] Columns ai_reasoning/is_duplicate_of not found in DB schema yet. Updating basic fields without them."
      );
      const basicPayload = {
        category: triageResult.category,
        department_id: triageResult.department_id || null,
        priority: triageResult.priority,
      };
      const retryResult = await supabaseAdmin
        .from("complaints")
        .update(basicPayload)
        .eq("id", complaintId);
      updateErr = retryResult.error;
    }

    if (updateErr) {
      throw updateErr;
    }

    // Retrieve user_id for setting updated_by
    const { data: complaintData } = await supabaseAdmin
      .from("complaints")
      .select("user_id")
      .eq("id", complaintId)
      .single();

    // Insert initial "Complaint submitted" update using admin client if not already present
    await supabaseAdmin.from("complaint_updates").insert({
      complaint_id: complaintId,
      note: "Complaint submitted",
      status_at_time: "submitted",
      updated_by: complaintData?.user_id || null,
    });

    // Insert complaint_updates row indicating classification & triage reasoning
    const updateNote = `Classified by AI: ${triageResult.category}, Priority: ${triageResult.priority}${
      triageResult.reasoning ? ` (${triageResult.reasoning})` : ""
    }`;

    await supabaseAdmin.from("complaint_updates").insert({
      complaint_id: complaintId,
      note: updateNote,
      status_at_time: "submitted",
      updated_by: complaintData?.user_id || null,
    });

    return NextResponse.json({
      success: true,
      category: triageResult.category,
      department_id: triageResult.department_id || null,
      priority: triageResult.priority,
      summary: triageResult.reasoning,
      ai_reasoning: triageResult.reasoning,
      is_duplicate_of: triageResult.is_duplicate_of,
      escalated: triageResult.escalated,
      toolCallsTrace: triageResult.toolCallsTrace,
    });
  } catch (err) {
    console.error("[Classifier API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
