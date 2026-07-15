import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { checkDuplicates } from "@/lib/ai/checkDuplicates";

// Admin client for writing complaint_updates
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complaintId, rawText, lat, lng, departmentId, priority } = body;

    if (!complaintId || !rawText || lat == null || lng == null || !departmentId) {
      return NextResponse.json(
        { error: "complaintId, rawText, lat, lng, and departmentId are required." },
        { status: 400 }
      );
    }

    const result = await checkDuplicates({
      complaintId,
      rawText,
      lat,
      lng,
      departmentId,
      priority: priority ?? null,
    });

    // Insert a complaint_updates row recording the cluster outcome
    const note = result.similarCount > 0
      ? `Merged with ${result.similarCount} similar complaint(s) confirmed as the same issue nearby — cluster priority: ${priority ?? "medium"}`
      : "New issue reported — no duplicate complaints found nearby";

    await supabaseAdmin.from("complaint_updates").insert({
      complaint_id: complaintId,
      note,
      status_at_time: "submitted",
      updated_by: null, // system action
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[/api/check-duplicates] Error:", err);
    // Return a safe fallback — never block submission
    return NextResponse.json(
      {
        success: false,
        error: "Duplicate check failed",
        isDuplicate: false,
        clusterId: null,
        similarCount: 0,
        isPrimary: true,
        matchedComplaints: [],
      },
      { status: 500 }
    );
  }
}
