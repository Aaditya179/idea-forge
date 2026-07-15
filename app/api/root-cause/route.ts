import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClusterSummaries } from "@/lib/queries/complaints";
import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";

export async function GET() {
    const supabase = await createClient();
    const clusters = await getClusterSummaries(supabase);

    // Only send clusters with 2+ complaints — those are the "real" patterns
    const significant = clusters.filter((c) => c.count >= 2).slice(0, 15);

    if (significant.length === 0) {
        return NextResponse.json({ rootCauses: [], totalClustered: 0 });
    }

    const prompt = `You are a civic infrastructure analyst. Below are clusters of citizen complaints grouped by department, category, and rough location. For each cluster, identify a likely root cause and suggest one concrete, high-impact fix.

Clusters:
${significant
            .map(
                (c, i) =>
                    `${i + 1}. Department: ${c.department_name}, Category: ${c.category || "Uncategorized"}, Area: ${c.location_key}, Count: ${c.count}\nSample complaints: ${c.sample_texts.join(" | ")}`
            )
            .join("\n\n")}

Respond ONLY with a JSON array, no markdown, no preamble, in this exact shape:
[{"cluster_index": 1, "root_cause": "short phrase", "suggested_fix": "one concrete action", "department": "dept name", "count": number}]`;

    try {
        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        const raw = completion.choices[0]?.message?.content || "[]";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const rootCauses = JSON.parse(cleaned);

        const totalClustered = significant.reduce((sum, c) => sum + c.count, 0);

        return NextResponse.json({ rootCauses, totalClustered });
    } catch (err) {
        console.error("Root cause analysis error:", err);
        return NextResponse.json({ rootCauses: [], totalClustered: 0 }, { status: 500 });
    }
}