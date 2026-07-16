import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface QueueItem {
  id: string;
  raw_text: string;
  category: string | null;
  status: string;
  priority: string | null;
  location_text: string | null;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, current_queue, department_name } = await req.json() as {
      messages: ChatMessage[];
      current_queue: QueueItem[];
      department_name: string;
    };

    // Build the queue context string
    const queueContext =
      current_queue.length === 0
        ? "The officer's queue is currently empty. No active complaints."
        : current_queue
            .map(
              (c, i) =>
                `[${i + 1}] ID: ${c.id.slice(0, 8)} | Priority: ${c.priority ?? "unset"} | Status: ${c.status} | Category: ${c.category ?? "General"} | Location: ${c.location_text ?? "N/A"} | Submitted: ${new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} | Complaint: "${c.raw_text}"`
            )
            .join("\n");

    const systemPrompt = `You are the CivicPulse Officer Copilot — an expert operations coordinator embedded in a city municipal engineering platform.

DEPARTMENT: ${department_name || "Municipal Services"}
ACTIVE QUEUE (${current_queue.length} complaint${current_queue.length !== 1 ? "s" : ""}):
${queueContext}

YOUR ROLE & RULES:
- You have read-only access to the officer's current live department queue shown above.
- Assist the officer with operational decision-making, workload analysis, and field execution planning.
- When asked to prioritise, analyse timestamps, risk levels, and complaint categories to suggest a logical execution order.
- When asked for solutions, provide clear, professional, step-by-step field engineering advice appropriate for municipal staff.
- If the queue is empty, respond: "Your queue is clear! No active operational anomalies require remediation plans right now."
- Never reveal internal IDs or raw database fields unless the officer specifically asks.

[LANGUAGE REFLECTION RULE]: You MUST detect the language profile of the incoming user message. You MUST formulate your ENTIRE response in that EXACT SAME language profile framework. Examples: if asked in Hindi, respond entirely in Hindi (Devanagari or Roman script matching the user). If asked in Marathi, respond exclusively in Marathi. If asked in English, respond in formal English. This rule is non-negotiable.

[WHATSAPP HINGLISH EXCEPTION]: If the user's message is written in HINGLISH — Hindi content phonetically spelled using Romanized English characters (e.g., "Yeh task pehle kaise karu?", "kaunsa complaint urgent hai bhai?") — you MUST break from formal administrative structure. Reply exclusively in natural, modern WhatsApp-style Hinglish using Roman script, casual contractions, and expressive emojis that match the tone. Example reply style: "Bhai, pehle Kurla ka pipe repair cover karo 🛠️ — emergency water leakage scenario hai! Baki tasks validation queue mein hold kar sakte ho 👍 Koi aur help chahiye?" Keep bullet points functional where helpful but in the same casual tone.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content ?? "I encountered an issue generating a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Officer chat error:", err);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
