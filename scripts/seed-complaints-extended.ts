/**
 * Extended Demo Seed Script — Geographic Heatmap Coverage across Mumbai & Suburbs
 * ==============================================================================
 * Inserts ~20 additional complaints spread across Mumbai and metropolitan suburbs
 * (Andheri, Bandra, Dadar, Thane, Vashi, Borivali, Mulund, Kalyan) to enrich the
 * admin heatmap and root-cause clustering features.
 *
 * Usage:
 *   npx tsx scripts/seed-complaints-extended.ts
 *
 * Behavior:
 *   1. Inserts each complaint with NULL category, department_id, and priority.
 *   2. Runs each complaint through Groq AI classification to assign department and priority.
 *   3. Runs each classified complaint through checkDuplicates() in insertion order.
 *   4. Logs progress and outputs a comprehensive summary table at the end.
 */

import * as fs from "fs";
import * as path from "path";

// ── Env loading must happen BEFORE any module importing @supabase/supabase-js or groqClient ──
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found. Run from the project root.");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      let val = rest.join("=").trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key.trim()] = val;
    }
  }
}

loadEnv();

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Service role client to bypass RLS during demo seeding
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Returns a random float in [base - jitter, base + jitter] rounded to 5 decimal places */
function jitter(base: number, amount = 0.0025): number {
  return Math.round((base + (Math.random() * 2 - 1) * amount) * 100000) / 100000;
}

/** Returns an ISO timestamp between minDaysAgo and maxDaysAgo */
function randomPastTimestamp(minDaysAgo: number, maxDaysAgo: number): string {
  const days = minDaysAgo + Math.random() * (maxDaysAgo - minDaysAgo);
  const ms = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Dataset definition ───────────────────────────────────────────────────────
interface ComplaintSeedDef {
  area: string;
  baseLat: number;
  baseLng: number;
  locationText: string;
  rawText: string;
  status: "submitted" | "in_review" | "resolved";
  daysAgoMin: number;
  daysAgoMax: number;
}

const EXTENDED_COMPLAINTS: ComplaintSeedDef[] = [
  // ── Andheri (~19.1197, 72.8468) — 3 complaints (Scattered) ─────────────────
  {
    area: "Andheri",
    baseLat: 19.1197,
    baseLng: 72.8468,
    locationText: "Veera Desai Road, Andheri West, Mumbai, Maharashtra 400053",
    rawText: "Massive potholes on Veera Desai Road near the metro station construction site. Two-wheelers are skidding daily during rush hours.",
    status: "submitted",
    daysAgoMin: 2,
    daysAgoMax: 8,
  },
  {
    area: "Andheri",
    baseLat: 19.1215,
    baseLng: 72.8440,
    locationText: "SV Road, Andheri West, Mumbai, Maharashtra 400058",
    rawText: "Andheri West SV Road ke paas dustbins poora overflow ho raha hai. Garbage has not been picked up since Monday, terrible smell everywhere.",
    status: "in_review",
    daysAgoMin: 3,
    daysAgoMax: 10,
  },
  {
    area: "Andheri",
    baseLat: 19.1170,
    baseLng: 72.8510,
    locationText: "Near Railway Station, Andheri East, Mumbai, Maharashtra 400069",
    rawText: "अंधेरी ईस्ट स्टेशन के बाहर बिजली की तारें बहुत नीचे लटक रही हैं। बारिश के मौसम में कभी भी शार्ट सर्किट हो सकता है। तुरंत ठीक करें।",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 6,
  },

  // ── Bandra (~19.0596, 72.8295) — 3 complaints (Scattered) ──────────────────
  {
    area: "Bandra",
    baseLat: 19.0596,
    baseLng: 72.8295,
    locationText: "Pali Hill, Bandra West, Mumbai, Maharashtra 400050",
    rawText: "Pali Hill area me pani ka pressure bohot low aa raha hai last 4 days se. Even first floor flats me tap se barabar pani nahi aa raha.",
    status: "in_review",
    daysAgoMin: 2,
    daysAgoMax: 7,
  },
  {
    area: "Bandra",
    baseLat: 19.0620,
    baseLng: 72.8330,
    locationText: "Linking Road, Bandra West, Mumbai, Maharashtra 400052",
    rawText: "बांद्रा पश्चिम लिंकिंग रोड पर फुटपाथ की टाइल्स टूट गई हैं और कई जगह गहरे गड्ढे हो गए हैं। बुजुर्गों और पैदल चलने वालों को बहुत परेशानी हो रही है।",
    status: "submitted",
    daysAgoMin: 4,
    daysAgoMax: 11,
  },
  {
    area: "Bandra",
    baseLat: 19.0570,
    baseLng: 72.8260,
    locationText: "Carter Road Promenade, Bandra West, Mumbai, Maharashtra 400050",
    rawText: "Streetlights on Carter Road promenade near the amphitheatre have been out for over a week. It gets pitch black after 8 PM and feels unsafe.",
    status: "resolved",
    daysAgoMin: 8,
    daysAgoMax: 13,
  },

  // ── Dadar (~19.0178, 72.8478) — 2 complaints (Scattered) ───────────────────
  {
    area: "Dadar",
    baseLat: 19.0178,
    baseLng: 72.8478,
    locationText: "Flower Market, Dadar West, Mumbai, Maharashtra 400028",
    rawText: "Severe sewage overflow from a choked manhole near Dadar West flower market. Filthy water is spreading across the entire vegetable vending area.",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 5,
  },
  {
    area: "Dadar",
    baseLat: 19.0195,
    baseLng: 72.8510,
    locationText: "TT Circle, Dadar East, Mumbai, Maharashtra 400014",
    rawText: "दादर टीटी सर्कल के पास पानी के पाइप से गंदा और मटमैला पानी आ रहा है। पीने के पानी में बदबू है और बच्चे बीमार पड़ सकते हैं, तुरंत जांच करें।",
    status: "in_review",
    daysAgoMin: 3,
    daysAgoMax: 9,
  },

  // ── Thane (~19.2183, 72.9781) — 3 complaints (Natural Cluster) ─────────────
  // These 3 are kept tight geographically (±0.001 deg) and describe the exact same
  // irregular water supply issue so the AI deduplication pipeline naturally clusters them.
  {
    area: "Thane",
    baseLat: 19.2183,
    baseLng: 72.9781,
    locationText: "Naupada, Thane West, Thane, Maharashtra 400602",
    rawText: "Water supply has been completely irregular and severely low in pressure near Naupada, Thane West for the past three days. We get barely 20 minutes of water in the morning.",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 4,
  },
  {
    area: "Thane",
    baseLat: 19.2188,
    baseLng: 72.9786,
    locationText: "Gokhale Road, Naupada, Thane West, Maharashtra 400602",
    rawText: "Thane West Naupada area me 3 din se drinking water barabar nahi aa raha. Pressure ekdam kam hai aur subah bas 15 minute pani aata hai, tank fill nahi ho raha.",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 4,
  },
  {
    area: "Thane",
    baseLat: 19.2179,
    baseLng: 72.9776,
    locationText: "Ram Maruti Road, Naupada, Thane West, Maharashtra 400602",
    rawText: "नौपाड़ा ठाणे वेस्ट में पिछले तीन दिनों से पानी की सप्लाई बहुत अनियमित है और प्रेशर बिल्कुल नहीं है। पूरी सोसाइटी पानी की भारी किल्लत झेल रही है, कृपया तुरंत ध्यान दें।",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 4,
  },

  // ── Navi Mumbai / Vashi (~19.0771, 73.0169) — 3 complaints (Scattered) ─────
  {
    area: "Navi Mumbai / Vashi",
    baseLat: 19.0771,
    baseLng: 73.0169,
    locationText: "Sector 17, Vashi, Navi Mumbai, Maharashtra 400703",
    rawText: "Garbage not collected for over a week near Sector 17, Vashi. Stray dogs have torn open the bags and litter is scattered across the road causing unhygienic conditions.",
    status: "submitted",
    daysAgoMin: 2,
    daysAgoMax: 7,
  },
  {
    area: "Navi Mumbai / Vashi",
    baseLat: 19.0795,
    baseLng: 73.0140,
    locationText: "Sector 9, Vashi, Navi Mumbai, Maharashtra 400703",
    rawText: "Vashi Sector 9 me transformer se continuously sparking ho raha hai aur ajeeb awaz aa rahi hai. Please check before major breakdown or fire incident.",
    status: "in_review",
    daysAgoMin: 1,
    daysAgoMax: 6,
  },
  {
    area: "Navi Mumbai / Vashi",
    baseLat: 19.0740,
    baseLng: 73.0200,
    locationText: "Palm Beach Road Service Lane, Vashi, Navi Mumbai, Maharashtra 400705",
    rawText: "वाशी पाम बीच रोड सर्विस लेन में बहुत बड़ा गड्ढा हो गया है। रात के समय गाड़ियां इसमें गिर रही हैं और कई बाइक चालक चोटिल हुए हैं।",
    status: "resolved",
    daysAgoMin: 9,
    daysAgoMax: 14,
  },

  // ── Borivali (~19.2307, 72.8567) — 2 complaints (Scattered) ────────────────
  {
    area: "Borivali",
    baseLat: 19.2307,
    baseLng: 72.8567,
    locationText: "Shimpoli Road, Borivali West, Mumbai, Maharashtra 400092",
    rawText: "Borivali West Shimpoli road pe drainage pipeline ka kaam hone ke baad rasta waise hi khoda hua chhod diya hai. Traffic jam ho raha hai daily aur mitti ud rahi hai.",
    status: "submitted",
    daysAgoMin: 3,
    daysAgoMax: 8,
  },
  {
    area: "Borivali",
    baseLat: 19.2330,
    baseLng: 72.8595,
    locationText: "Near Station East, Borivali East, Mumbai, Maharashtra 400066",
    rawText: "बोरीवली पूर्व स्टेशन के पास सार्वजनिक शौचालय की हालत बहुत खराब है। पानी की व्यवस्था नहीं है, गंदगी भरी हुई है और नियमित सफाई नहीं होती।",
    status: "in_review",
    daysAgoMin: 5,
    daysAgoMax: 12,
  },

  // ── Mulund (~19.1726, 72.9425) — 2 complaints (Scattered) ──────────────────
  {
    area: "Mulund",
    baseLat: 19.1726,
    baseLng: 72.9425,
    locationText: "LBS Marg, Mulund West, Mumbai, Maharashtra 400080",
    rawText: "Frequent power cuts and severe voltage fluctuations in Mulund West near LBS Marg. Three household appliances got damaged yesterday due to voltage spikes.",
    status: "submitted",
    daysAgoMin: 2,
    daysAgoMax: 7,
  },
  {
    area: "Mulund",
    baseLat: 19.1745,
    baseLng: 72.9455,
    locationText: "Deshmukh Garden, Mulund East, Mumbai, Maharashtra 400081",
    rawText: "Mulund East me drinking water pipeline me leakage hai near Deshmukh Garden. Clean water road pe bah raha hai subah se, wastage of gallons of water.",
    status: "submitted",
    daysAgoMin: 1,
    daysAgoMax: 5,
  },

  // ── Kalyan (~19.2437, 73.1355) — 2 complaints (Scattered) ──────────────────
  {
    area: "Kalyan",
    baseLat: 19.2437,
    baseLng: 73.1355,
    locationText: "Railway Station Skywalk Entrance, Kalyan West, Maharashtra 421301",
    rawText: "Streetlight not working near Kalyan West railway station skywalk entrance. It is extremely dark after evening and unsafe for women and commuters walking home.",
    status: "in_review",
    daysAgoMin: 3,
    daysAgoMax: 10,
  },
  {
    area: "Kalyan",
    baseLat: 19.2455,
    baseLng: 73.1380,
    locationText: "Kolsewadi, Kalyan East, Maharashtra 421306",
    rawText: "कल्याण पूर्व कोलसेवाड़ी में कचरा गाड़ी हफ्ते में सिर्फ एक बार आ रही है। सोसायटियों के बाहर कचरे के बड़े ढेर लग गए हैं और भारी बदबू फैल रही है।",
    status: "submitted",
    daysAgoMin: 4,
    daysAgoMax: 11,
  },
];

// ── Classification Helper ────────────────────────────────────────────────────
async function classifyWithGroq(
  rawText: string,
  groqInstance: any,
  groqModel: string
): Promise<{
  category: string;
  priority: string;
  summary: string;
}> {
  let category = "Other";
  let priority = "medium";
  let summary = "Civic grievance submitted";

  try {
    const response = await Promise.race([
      groqInstance.chat.completions.create({
        model: groqModel,
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
        setTimeout(() => reject(new Error("Groq classification timed out")), 8000)
      ),
    ]);

    const resultText = response.choices[0]?.message?.content;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      if (parsed.category) category = parsed.category;
      if (parsed.priority) priority = parsed.priority;
      if (parsed.summary) summary = parsed.summary;
    }
  } catch (err) {
    console.warn(`      ⚠️ Groq classification error, using fallbacks (${category}/${priority}):`, err instanceof Error ? err.message : err);
  }

  return { category, priority, summary };
}

// ── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  // Dynamically import AFTER loadEnv() has populated process.env
  const { groq, GROQ_MODEL } = await import("@/lib/ai/groqClient");
  const { checkDuplicates } = await import("@/lib/ai/checkDuplicates");

  console.log("================================================================================");
  console.log("🏙️  STARTING EXTENDED COMPLAINT SEEDING (MUMBAI METROPOLITAN AREA)");
  console.log("================================================================================\n");

  // 1. Fetch citizen users to distribute complaints across
  const { data: profiles, error: profError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "citizen");

  if (profError || !profiles || profiles.length === 0) {
    console.error("❌ Failed to fetch citizen profiles:", profError?.message);
    process.exit(1);
  }
  console.log(`✔ Found ${profiles.length} citizen profile(s) for complaint ownership.`);

  // 2. Fetch departments mapping
  const { data: departments, error: deptError } = await supabaseAdmin
    .from("departments")
    .select("id, name");

  if (deptError || !departments) {
    console.error("❌ Failed to fetch departments:", deptError?.message);
    process.exit(1);
  }
  const deptMap = new Map<string, string>();
  departments.forEach((d) => deptMap.set(d.name, d.id));
  const fallbackDeptId = deptMap.get("Other") || departments[0].id;
  console.log(`✔ Loaded ${departments.length} departments (${Array.from(deptMap.keys()).join(", ")}).\n`);

  // 3. Process and insert complaints sequentially
  const summaryResults: Array<{
    Area: string;
    Department: string;
    Priority: string;
    Status: string;
    ClusterOutcome: string;
    Summary: string;
  }> = [];

  const areaCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  let totalDuplicatesOrClusters = 0;

  for (let i = 0; i < EXTENDED_COMPLAINTS.length; i++) {
    const item = EXTENDED_COMPLAINTS[i];
    const citizen = profiles[i % profiles.length]; // Round-robin across citizen users

    // Jitter coordinates so points aren't exactly on top of each other
    const lat = jitter(item.baseLat, 0.002);
    const lng = jitter(item.baseLng, 0.002);
    const createdAt = randomPastTimestamp(item.daysAgoMin, item.daysAgoMax);

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[{${i + 1}/${EXTENDED_COMPLAINTS.length}}] Area: ${item.area} | User: ${citizen.full_name}`);
    console.log(`      Text: "${item.rawText.slice(0, 75)}..."`);

    // Step A: Insert raw complaint with NULL category, department_id, and priority
    const { data: insertedComplaint, error: insertErr } = await supabaseAdmin
      .from("complaints")
      .insert({
        user_id: citizen.id,
        raw_text: item.rawText,
        category: null,
        department_id: null,
        priority: null,
        location_text: item.locationText,
        latitude: lat,
        longitude: lng,
        status: item.status,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .select("id")
      .single();

    if (insertErr || !insertedComplaint) {
      console.error(`      ❌ Insert failed: ${insertErr?.message}`);
      continue;
    }

    const complaintId = insertedComplaint.id;
    console.log(`      ✔ Inserted raw complaint ID: ${complaintId}`);

    // Step B: Run through AI Classification logic
    console.log(`      🤖 Classifying via Groq AI...`);
    const { category, priority, summary } = await classifyWithGroq(item.rawText, groq, GROQ_MODEL);
    const departmentId = deptMap.get(category) || fallbackDeptId;

    // Update DB with AI-assigned fields
    const { error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update({
        category,
        department_id: departmentId,
        priority,
      })
      .eq("id", complaintId);

    if (updateErr) {
      console.error(`      ❌ Failed to update classification: ${updateErr.message}`);
    } else {
      console.log(`      ✔ AI Assigned -> Category: [${category}], Priority: [${priority}], Summary: "${summary}"`);
    }

    // Insert audit log rows into complaint_updates
    await supabaseAdmin.from("complaint_updates").insert([
      {
        complaint_id: complaintId,
        note: "Complaint submitted",
        status_at_time: item.status,
        updated_by: citizen.id,
        created_at: createdAt,
      },
      {
        complaint_id: complaintId,
        note: `Classified by AI: ${category}, Priority: ${priority}`,
        status_at_time: item.status,
        updated_by: citizen.id,
        created_at: createdAt,
      },
    ]);

    // Short delay before duplicate check to respect Groq rate limits
    await delay(1200);

    // Step C: Run through existing duplicate-check logic
    console.log(`      🔍 Running AI Duplicate/Proximity Check...`);
    let clusterOutcome = "Unique issue";
    try {
      const dupResult = await checkDuplicates({
        complaintId,
        rawText: item.rawText,
        lat,
        lng,
        departmentId,
        priority,
      });

      const note =
        dupResult.similarCount > 0
          ? `Merged with ${dupResult.similarCount} similar complaint(s) confirmed as the same issue nearby — cluster priority: ${priority}`
          : "New issue reported — no duplicate complaints found nearby";

      await supabaseAdmin.from("complaint_updates").insert({
        complaint_id: complaintId,
        note,
        status_at_time: item.status,
        updated_by: null,
        created_at: createdAt,
      });

      if (dupResult.similarCount > 0 || dupResult.clusterId) {
        if (dupResult.isDuplicate) {
          clusterOutcome = `Duplicate of cluster (${dupResult.similarCount} matches)`;
          totalDuplicatesOrClusters++;
        } else if (dupResult.similarCount > 0) {
          clusterOutcome = `Primary of cluster (+${dupResult.similarCount} merged)`;
          totalDuplicatesOrClusters++;
        }
      }
      console.log(`      ✔ Duplicate Check Outcome: ${clusterOutcome}`);
    } catch (dupErr) {
      console.warn(`      ⚠️ Duplicate check failed, treating as unique:`, dupErr instanceof Error ? dupErr.message : dupErr);
    }

    // Record for summary table
    summaryResults.push({
      Area: item.area,
      Department: category,
      Priority: priority,
      Status: item.status,
      ClusterOutcome: clusterOutcome,
      Summary: summary,
    });

    areaCounts[item.area] = (areaCounts[item.area] || 0) + 1;
    deptCounts[category] = (deptCounts[category] || 0) + 1;

    // Delay before next complaint to prevent API rate limiting
    if (i < EXTENDED_COMPLAINTS.length - 1) {
      await delay(1500);
    }
  }

  // 4. Print final comprehensive summary
  console.log("\n================================================================================");
  console.log("✅ EXTENDED SEEDING COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  console.log("── Individual Complaints Summary ──");
  console.table(summaryResults);

  console.log("\n── Geographic Distribution (by Area) ──");
  console.table(
    Object.entries(areaCounts).map(([Area, Count]) => ({ Area, Count }))
  );

  console.log("\n── Department Breakdown ──");
  console.table(
    Object.entries(deptCounts).map(([Department, Count]) => ({ Department, Count }))
  );

  console.log(`\n📊 Total complaints added: ${summaryResults.length}`);
  console.log(`🔗 Complaints involved in clusters / duplicate merges: ${totalDuplicatesOrClusters}`);
  console.log(`\n💡 Tip: Open the Admin Dashboard (http://localhost:3000/admin) to view the enriched heatmap spanning across Mumbai, Thane, Navi Mumbai, and Kalyan.\n`);
}

main().catch((err) => {
  console.error("❌ Fatal script error:", err);
  process.exit(1);
});
