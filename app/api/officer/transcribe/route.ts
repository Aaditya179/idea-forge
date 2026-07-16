import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file received." }, { status: 400 });
    }

    // Guard against silent/empty recordings (< 1 KB is almost certainly silence)
    if (audioFile.size < 1024) {
      return NextResponse.json(
        { error: "Recording too short or silent. Please speak clearly and try again." },
        { status: 422 }
      );
    }

    // Groq Whisper expects a File-like object. Cast it through as-is.
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      // No language hint — let Whisper auto-detect Hindi, Marathi, Hinglish, English
      response_format: "text",
    });

    // groq returns the transcript as a plain string when response_format is "text"
    const text = (transcription as unknown as string).trim();

    if (!text) {
      return NextResponse.json(
        { error: "No speech detected. Please speak closer to the microphone." },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript: text });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
