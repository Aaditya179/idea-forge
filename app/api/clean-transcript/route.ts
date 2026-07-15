import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

export async function POST(request: NextRequest) {
  let rawText = "";
  try {
    const body = await request.json();
    rawText = body.rawText || "";

    if (!rawText.trim()) {
      return NextResponse.json({ correctedText: "" });
    }

    // 8-second timeout for transcript cleanup
    const response = await Promise.race([
      groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `The following is a voice-transcribed citizen complaint about a civic issue (water, electricity, roads, or sanitation). It may contain speech-recognition errors, especially for technical or civic terms (e.g. 'pot hold' should be 'pothole', also common terms like 'transformer', 'sewage', 'manhole', 'leakage'), and may mix English with Hindi or Marathi. Correct obvious transcription errors while preserving the original meaning, language, and intent. Return ONLY the corrected text, no explanation, no extra formatting.`,
          },
          {
            role: "user",
            content: rawText,
          },
        ],
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Groq transcript cleanup request timed out")), 8000)
      ),
    ]);

    const correctedText = response.choices[0]?.message?.content?.trim() || rawText;
    return NextResponse.json({ correctedText });
  } catch (err) {
    console.error("[CleanTranscript API] Failed, returning original text:", err);
    // If the Groq call fails or times out, return the original raw text unchanged
    return NextResponse.json({ correctedText: rawText });
  }
}
