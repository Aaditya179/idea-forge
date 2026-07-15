import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

export async function POST(request: NextRequest) {
  try {
    const { 
      complaintText, 
      category, 
      status, 
      location, 
      priority,
      timelineLength,
      daysSinceSubmitted 
    } = await request.json();

    if (!complaintText) {
      return NextResponse.json(
        { error: "Complaint text is required." },
        { status: 400 }
      );
    }

    // Default fallbacks in case AI analysis fails
    let summary = "Civic complaint requiring officer attention";
    let suggestedAction = "Review complaint details and update status accordingly";
    let confidence = "medium";

    try {
      // 10-second timeout for the Groq API call
      const response = await Promise.race([
        groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an AI Assistant for civic officers managing citizen complaints. Analyze the complaint and provide actionable insights.

You MUST respond with a JSON object in this exact shape:
{
  "summary": "2-3 sentence summary highlighting key issues and urgency",
  "suggestedAction": "Specific, actionable recommendation for the officer's next steps",
  "confidence": "high" | "medium" | "low"
}

Consider:
- Complaint urgency and public safety impact
- Required resources or departments
- Citizen communication needs
- Timeline expectations
- Escalation requirements

Do not return any other text, explanations, or markdown. Only valid JSON.`,
            },
            {
              role: "user",
              content: `Complaint Details:
Text: ${complaintText}
Category: ${category || "Not specified"}
Status: ${status}
Location: ${location || "Not specified"}
Priority: ${priority || "Not specified"}
Timeline Updates: ${timelineLength} updates
Days Since Submitted: ${daysSinceSubmitted}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis request timed out")), 10000)
        ),
      ]);

      const resultText = response.choices[0]?.message?.content;
      if (resultText) {
        const parsed = JSON.parse(resultText);
        if (parsed.summary) summary = parsed.summary;
        if (parsed.suggestedAction) suggestedAction = parsed.suggestedAction;
        if (parsed.confidence) confidence = parsed.confidence;
      }
    } catch (apiErr) {
      console.error("[Analyze Complaint API] AI processing failed, using fallbacks:", apiErr);
    }

    return NextResponse.json({
      success: true,
      summary,
      suggestedAction,
      confidence,
    });
  } catch (err) {
    console.error("[Analyze Complaint API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}