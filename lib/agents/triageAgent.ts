import { groq, GROQ_MODEL } from "@/lib/ai/groqClient";
import {
  triageToolsDefinitions,
  executeToolCall,
  getDepartmentWorkload,
} from "@/lib/agents/tools";

export interface TriageTraceItem {
  toolName: string;
  arguments: any;
  result: any;
  timestamp: string;
}

export interface TriageResult {
  category: "Water" | "Electricity" | "Roads" | "Sanitation" | "Other" | string;
  department_id: string | null;
  priority: "low" | "medium" | "high";
  reasoning: string;
  is_duplicate_of: string | null;
  escalated: boolean;
  toolCallsTrace?: TriageTraceItem[];
}

const TRIAGE_SYSTEM_PROMPT = `You are the triage agent for CivicPulse, an AI civic grievance system used 
by Indian municipal departments. Citizens submit raw complaint text (which 
may be in English, Hindi, Marathi, or Hinglish) along with GPS coordinates. 
Your job is to investigate each complaint properly before finalizing its 
routing — not just classify it in one pass.

## Your objective
For every complaint, you must determine:
1. category — one of: "Water", "Electricity", "Roads", "Sanitation", "Other"
2. department_id — the department this routes to (use get_department_workload 
   to resolve category → department_id if you don't already have it)
3. priority — "low", "medium", or "high"

But you must not guess priority from text alone. Priority should reflect 
real-world signal, not just tone of the complaint. Use your tools to check:
- Is this a duplicate or repeat of an existing unresolved complaint?
- Is there a pattern of similar complaints in the same area recently?
- Is the relevant department already overloaded, which might affect urgency 
  of routing but should NOT be used to artificially deflate priority?

## Tools available to you
- check_duplicates(text, latitude, longitude): Returns any existing 
  unresolved complaints that likely describe the same issue, within ~200m 
  and semantically similar text. ALWAYS call this first for every 
  complaint — never skip it.
- get_department_workload(department_id): Returns current queue size and 
  average resolution time for a department. Use this after you've picked a 
  category, to resolve the actual department_id and to inform (not 
  override) your reasoning about urgency.
- escalate_priority(complaint_id, reason, new_priority): Use ONLY if you 
  discover, via check_duplicates or workload context, that this complaint 
  is part of a recurring pattern (3+ similar complaints in the same area 
  within 14 days) or describes a safety hazard (exposed wiring, open 
  manholes, structural damage, contaminated water supply). Do not call 
  this for routine single complaints, even urgent-sounding ones — reserve 
  it for cases with actual corroborating evidence from your tool calls.

## Reasoning process (follow this order)
1. Read the raw complaint text. Identify likely category and any 
   safety-critical language.
2. Call check_duplicates. If it returns matches, do NOT create a new 
   routing decision from scratch — note the existing complaint_id and 
   pattern.
3. If check_duplicates reveals 3+ similar recent complaints in the same 
   area, or the complaint itself describes an immediate safety hazard, 
   call escalate_priority with a clear, specific reason (cite what you 
   found, not just "seems urgent").
4. Call get_department_workload to confirm the correct department_id for 
   your chosen category.
5. Only after these checks, produce your final decision.

## Output format
Once you have gathered what you need and are ready to finalize (no more 
tool calls needed), respond with ONLY this JSON structure, no other text:

{
  "category": "Water" | "Electricity" | "Roads" | "Sanitation" | "Other",
  "department_id": "<uuid from get_department_workload>",
  "priority": "low" | "medium" | "high",
  "reasoning": "<2-3 sentence explanation citing what your tool calls found>",
  "is_duplicate_of": "<complaint_id or null>",
  "escalated": true | false
}

## Rules
- Never fabricate a department_id — only use ones returned by 
  get_department_workload.
- Never call escalate_priority more than once per complaint.
- If check_duplicates finds an exact/near-exact match, set is_duplicate_of 
  and still classify normally — the frontend will decide whether to merge 
  or create a new linked entry.
- Keep your final "reasoning" field factual and specific — this is shown 
  to officers, not just logged internally. Avoid vague phrases like "this 
  seems important."
- If tools return errors or empty results, proceed with your best judgment 
  from the text alone and note that in reasoning (e.g. "no duplicate-check 
  data available").
- Maximum 4 tool calls total per complaint. If you haven't reached a 
  decision by then, finalize with what you have.`;

/**
 * Strips markdown code fences if present around JSON strings.
 */
function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Fallback classification using a single direct Groq completion (no tools)
 * if the agent loop fails or exhausts without a clean response.
 */
async function fallbackClassify(
  rawText: string,
  complaintId: string,
  trace: TriageTraceItem[]
): Promise<TriageResult> {
  console.log(`[TriageAgent (${complaintId})] Executing fallback classification...`);
  let category = "Other";
  let priority: "low" | "medium" | "high" = "medium";
  let summary = "Civic grievance submitted";

  try {
    const response = await Promise.race([
      groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an AI Civic Assistant. Analyze the user's grievance and classify it.
You MUST respond with a JSON object in this exact shape:
{
  "category": "Water" | "Electricity" | "Roads" | "Sanitation" | "Other",
  "priority": "low" | "medium" | "high",
  "summary": "Short 5-8 word summary of the issue"
}
Do not return any other text, explanations, or markdown. Only valid JSON.`,
          },
          { role: "user", content: rawText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Fallback Groq completion timed out")), 8000)
      ),
    ]);

    const resultText = response.choices[0]?.message?.content;
    if (resultText) {
      const parsed = JSON.parse(stripCodeFences(resultText));
      if (parsed.category) category = parsed.category;
      if (parsed.priority && ["low", "medium", "high"].includes(parsed.priority)) {
        priority = parsed.priority as "low" | "medium" | "high";
      }
      if (parsed.summary) summary = parsed.summary;
    }
  } catch (err) {
    console.error(`[TriageAgent (${complaintId})] Fallback completion error:`, err);
  }

  const deptInfo = await getDepartmentWorkload(category);

  return {
    category,
    department_id: deptInfo.department_id || null,
    priority,
    reasoning: `Classified via fallback: ${summary}.`,
    is_duplicate_of: null,
    escalated: false,
    toolCallsTrace: trace,
  };
}

/**
 * Runs the agentic tool-calling triage loop (max 4 iterations).
 */
export async function runTriageAgent(
  complaintId: string,
  rawText: string,
  latitude: number,
  longitude: number
): Promise<TriageResult> {
  const trace: TriageTraceItem[] = [];
  const messages: any[] = [
    { role: "system", content: TRIAGE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Complaint ID: ${complaintId}\nRaw Text: "${rawText}"\nGPS Coordinates: Latitude ${latitude}, Longitude ${longitude}`,
    },
  ];

  let toolCallsCount = 0;
  const maxIterations = 4;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    try {
      console.log(`[TriageAgent (${complaintId})] Starting loop iteration ${iteration}...`);

      const response = await Promise.race([
        groq.chat.completions.create({
          model: GROQ_MODEL,
          messages,
          tools: triageToolsDefinitions as any,
          tool_choice: "auto",
          temperature: 0.1,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Triage loop iteration ${iteration} timed out`)), 10000)
        ),
      ]);

      const choice = response.choices[0];
      const message = choice?.message;

      if (!message) {
        console.warn(`[TriageAgent (${complaintId})] Iteration ${iteration}: No message returned from Groq.`);
        break;
      }

      // Check for tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          toolCallsCount++;
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, any> = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch (e) {
            fnArgs = {};
          }

          console.log(`[TriageAgent (${complaintId})] Tool Call (${fnName}):`, fnArgs);

          const result = await executeToolCall(fnName, fnArgs, complaintId);
          console.log(`[TriageAgent (${complaintId})] Tool Result (${fnName}):`, result);

          trace.push({
            toolName: fnName,
            arguments: fnArgs,
            result,
            timestamp: new Date().toISOString(),
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // If we hit or exceeded 4 tool calls, let's prompt the model to finalize without tools on the next iteration or finish now if maxIterations reached
        if (toolCallsCount >= 4 || iteration === maxIterations) {
          // If this was the last iteration and we still made tool calls, we need one more completion (without tools) to get the final JSON
          if (iteration === maxIterations || toolCallsCount >= 4) {
            console.log(`[TriageAgent (${complaintId})] Max tool calls/iterations reached. Requesting final JSON decision without tools.`);
            try {
              const finalResp = await Promise.race([
                groq.chat.completions.create({
                  model: GROQ_MODEL,
                  messages,
                  temperature: 0.1,
                  response_format: { type: "json_object" },
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Final answer completion timed out")), 8000)
                ),
              ]);

              const finalContent = finalResp.choices[0]?.message?.content || "";
              const cleanJson = stripCodeFences(finalContent);
              const parsed = JSON.parse(cleanJson);

              let deptId = parsed.department_id || null;
              if (!deptId && parsed.category) {
                const deptInfo = await getDepartmentWorkload(parsed.category);
                deptId = deptInfo.department_id || null;
              }

              return {
                category: parsed.category || "Other",
                department_id: deptId,
                priority: ["low", "medium", "high"].includes(parsed.priority)
                  ? (parsed.priority as "low" | "medium" | "high")
                  : "medium",
                reasoning: parsed.reasoning || "Classified via agent triage after tool exploration.",
                is_duplicate_of: parsed.is_duplicate_of && parsed.is_duplicate_of !== "null" ? parsed.is_duplicate_of : null,
                escalated: Boolean(parsed.escalated),
                toolCallsTrace: trace,
              };
            } catch (finalErr) {
              console.warn(`[TriageAgent (${complaintId})] Failed to parse final answer after tool exhaustion:`, finalErr);
              break;
            }
          }
        }
        continue;
      }

      // No tool calls returned -> the model produced its final JSON decision directly
      const contentText = message.content || "";
      const cleanJsonText = stripCodeFences(contentText);

      try {
        const parsed = JSON.parse(cleanJsonText);
        console.log(`[TriageAgent (${complaintId})] Successfully produced final decision:`, parsed);

        let deptId = parsed.department_id || null;
        if (!deptId && parsed.category) {
          const deptInfo = await getDepartmentWorkload(parsed.category);
          deptId = deptInfo.department_id || null;
        }

        return {
          category: parsed.category || "Other",
          department_id: deptId,
          priority: ["low", "medium", "high"].includes(parsed.priority)
            ? (parsed.priority as "low" | "medium" | "high")
            : "medium",
          reasoning: parsed.reasoning || "Classified via agent triage.",
          is_duplicate_of: parsed.is_duplicate_of && parsed.is_duplicate_of !== "null" ? parsed.is_duplicate_of : null,
          escalated: Boolean(parsed.escalated),
          toolCallsTrace: trace,
        };
      } catch (parseErr) {
        console.warn(`[TriageAgent (${complaintId})] Iteration ${iteration}: Could not parse JSON directly: "${cleanJsonText}". Retrying...`);
        // If not last iteration, prompt model to output clean JSON
        if (iteration < maxIterations) {
          messages.push(message);
          messages.push({
            role: "user",
            content: "Please respond ONLY with the exact JSON output format requested, without any extra text or code fences.",
          });
          continue;
        }
      }
    } catch (iterErr) {
      console.error(`[TriageAgent (${complaintId})] Error during loop iteration ${iteration}:`, iterErr);
      break;
    }
  }

  console.warn(`[TriageAgent (${complaintId})] Exhausted loop iterations without clean final decision. Using fallback.`);
  return await fallbackClassify(rawText, complaintId, trace);
}
