import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

// Create a Supabase admin client using the service role key to bypass RLS policies
// since citizens do not have SQL-level UPDATE access on the complaints table.
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { complaintId, rawText } = await request.json();

    if (!complaintId || !rawText) {
      return NextResponse.json(
        { error: "complaintId and rawText are required." },
        { status: 400 }
      );
    }

    // Default fallbacks in case classification fails or times out
    let category = "Other";
    let priority = "medium";
    let summary = "Civic grievance submitted";

    try {
      // 8-second timeout for the Groq API call
      const response = await Promise.race([
        groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an AI Civic Assistant. Analyze the user's grievance (which may be in English, Hindi, Marathi, Hinglish, or code-mixed) and classify it.
You MUST respond with a JSON object in this exact shape:
{
  "category": "Water Supply" | "Electricity" | "Roads" | "Sanitation" | "Other",
  "priority": "low" | "medium" | "high",
  "summary": "Short 5-8 word summary of the issue"
}
Do not return any other text, explanations, or markdown. Only valid JSON.`,
            },
            {
              role: "user",
              content: rawText,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Groq request timed out")), 8000)
        ),
      ]);

      const resultText = response.choices[0]?.message?.content;
      if (resultText) {
        const parsed = JSON.parse(resultText);
        if (parsed.category) category = parsed.category;
        if (parsed.priority) priority = parsed.priority;
        if (parsed.summary) summary = parsed.summary;
      }
    } catch (apiErr) {
      console.error("[Classifier API] Groq processing failed, using fallbacks:", apiErr);
    }

    // Resolve department ID from category name
    let { data: department } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("name", category)
      .single();

    // Fallback to "Other" department if the returned category wasn't found
    if (!department) {
      const { data: fallbackDept } = await supabaseAdmin
        .from("departments")
        .select("id")
        .eq("name", "Other")
        .single();
      department = fallbackDept;
      category = "Other";
    }

    // Update complaint category, department_id, and priority
    const { error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update({
        category,
        department_id: department?.id || null,
        priority,
      })
      .eq("id", complaintId);

    if (updateErr) {
      throw updateErr;
    }

    // Retrieve the user ID of the complaint to set updated_by (optional, but good practice)
    const { data: complaintData } = await supabaseAdmin
      .from("complaints")
      .select("user_id")
      .eq("id", complaintId)
      .single();

    // Insert complaint_updates row indicating classification success
    await supabaseAdmin.from("complaint_updates").insert({
      complaint_id: complaintId,
      note: `Classified by AI: ${category}, Priority: ${priority}`,
      status_at_time: "submitted",
      updated_by: complaintData?.user_id || null,
    });

    return NextResponse.json({
      success: true,
      category,
      priority,
      summary,
    });
  } catch (err) {
    console.error("[Classifier API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
