import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { complaint_id, before_image_url, after_image_url } = await req.json();

        if (!complaint_id || !after_image_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Build the messages depending on whether there's a before photo
        const userContent: Groq.Chat.Completions.ChatCompletionContentPart[] = before_image_url
            ? [
                {
                    type: "text",
                    text: `You are a strict civic infrastructure quality auditor. You are given two field photos:
• BEFORE PHOTO: The original complaint submitted by a citizen showing the problem.
• AFTER PHOTO: The resolution photo submitted by a government officer claiming the issue is fixed.

Your task: Compare both images and decide if the repair or fix is genuinely complete and satisfactory.

Respond with ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "status": "VERIFIED" or "REJECTED",
  "confidence_score": <number 0-100>,
  "reasoning": "<One to two sentences explaining your technical verdict based on visual evidence.>"
}

Be strict: partial fixes, unrelated photos, or obvious mismatches must be REJECTED.`,
                },
                {
                    type: "image_url",
                    image_url: { url: before_image_url, detail: "high" },
                },
                {
                    type: "text",
                    text: "AFTER PHOTO (officer's resolution proof):",
                },
                {
                    type: "image_url",
                    image_url: { url: after_image_url, detail: "high" },
                },
            ]
            : [
                {
                    type: "text",
                    text: `You are a civic infrastructure quality auditor. There was no "before" photo for this complaint (text-only submission). 
Evaluate the officer's resolution photo on its own merits: does it show completed civic work (repair, fix, clearing, etc.)?

Respond with ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "status": "VERIFIED" or "REJECTED",
  "confidence_score": <number 0-100>,
  "reasoning": "<One to two sentences describing what the photo shows and whether it constitutes a valid resolution.>"
}`,
                },
                {
                    type: "image_url",
                    image_url: { url: after_image_url, detail: "high" },
                },
            ];

        const completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: userContent,
                },
            ],
            temperature: 0.1,
            max_tokens: 256,
        });

        const raw = completion.choices[0]?.message?.content?.trim() ?? "";

        // Strip markdown fences if the model adds them
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let result: { status: string; confidence_score: number; reasoning: string };
        try {
            result = JSON.parse(cleaned);
        } catch {
            // Model gave non-JSON — treat as rejected
            return NextResponse.json({
                status: "REJECTED",
                confidence_score: 0,
                reasoning: "AI could not parse the resolution photo. Please upload a clearer, well-lit photo of the completed work.",
            });
        }

        // Normalise
        const status = result.status?.toUpperCase() === "VERIFIED" ? "VERIFIED" : "REJECTED";

        return NextResponse.json({
            status,
            confidence_score: Math.min(100, Math.max(0, Math.round(result.confidence_score ?? 0))),
            reasoning: result.reasoning ?? "No reasoning provided.",
            complaint_id,
        });
    } catch (err) {
        console.error("verify-resolution error:", err);
        return NextResponse.json(
            { error: "Internal server error during verification." },
            { status: 500 }
        );
    }
}
