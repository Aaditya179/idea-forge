/**
 * Demo Seed Script — Root-Cause Clustering Hotspots
 * ===================================================
 * Inserts 20 complaints deliberately clustered into 3 geographic hotspots
 * so the Root-Cause Analysis panel has compelling data to display.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-clusters.ts
 *   npx tsx scripts/seed-demo-clusters.ts --user-id <uuid>
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - At least one profile row in public.profiles (the script finds it automatically)
 *   - npx tsx installed (comes with TypeScript projects; otherwise: npm install -D tsx)
 *
 * What it seeds:
 *   Hotspot A — Water Supply / Kurla East    (lat ~19.07, lng ~72.88): 8 complaints
 *   Hotspot B — Roads / Andheri West         (lat ~19.12, lng ~72.83): 7 complaints
 *   Hotspot C — Sanitation / Bandra          (lat ~19.05, lng ~72.82): 5 complaints
 *
 * Each complaint gets jittered coordinates (±0.004°) so they're not identical but
 * stay within the same 2-decimal lat/lng grid cell (~1.1 km zone).
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Env loading ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env.local not found. Run from the project root.");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service role to bypass RLS — only for seeding demo data
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Helpers ────────────────────────────────────────────────────────────────────
/** Returns a random float in [base - jitter, base + jitter] rounded to 5dp */
function jitter(base: number, amount = 0.004): number {
  return Math.round((base + (Math.random() * 2 - 1) * amount) * 100000) / 100000;
}

function randomPast(maxDaysAgo = 30): string {
  const ms = Date.now() - Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

// ── Hotspot definitions ────────────────────────────────────────────────────────
const HOTSPOTS = [
  {
    label: "Hotspot A — Water Supply / Kurla East",
    departmentName: "Water Supply",
    category: "Water Supply",
    baseLat: 19.07,
    baseLng: 72.88,
    complaints: [
      "Water pressure has been extremely low for the past two weeks. We can barely fill a bucket during peak hours.",
      "Dirty brown water is coming from the tap every morning. The whole building is affected. Please investigate.",
      "Pipe burst on the main road near our society. Water is flooding the street and wasting thousands of litres.",
      "No water supply since three days. The municipal tanker hasn't come either. Elderly residents are suffering.",
      "There is a persistent smell from the water pipeline. Residents are afraid of contamination.",
      "The overhead tank in our building has not been cleaned. Water has a foul smell and visible sediment.",
      "Water meter is broken and we're getting inflated bills. Many neighbours have the same problem.",
      "Sewage water is mixing with drinking water supply near the pump house on our lane. Urgent action needed.",
    ],
  },
  {
    label: "Hotspot B — Roads / Andheri West",
    departmentName: "Roads",
    category: "Roads",
    baseLat: 19.12,
    baseLng: 72.83,
    complaints: [
      "There is a massive pothole in the middle of the road near the signal. Three bikes have already fallen. Please repair urgently.",
      "The road has completely broken down after the rains. Vehicles are getting stuck in mud and water.",
      "Pothole on the main arterial road is getting bigger every week. A car's tyre burst today because of it.",
      "The road divider has collapsed into the pothole. The entire stretch is dangerous, especially at night.",
      "Waterlogging on the road due to blocked drainage. The road surface has eroded away in several spots.",
      "Street lights are non-functional and the road is full of craters. It is very dangerous after dark.",
      "The repair done last month has already crumbled. The pothole is back and worse than before.",
    ],
  },
  {
    label: "Hotspot C — Sanitation / Bandra",
    departmentName: "Sanitation",
    category: "Sanitation",
    baseLat: 19.05,
    baseLng: 72.82,
    complaints: [
      "The drain in front of our building is completely blocked. Sewage water is overflowing onto the footpath and road.",
      "Garbage collection has not happened in five days. The dump at the corner is attracting rats and mosquitoes.",
      "The open drain is emitting a terrible smell. Stagnant water is a breeding ground for dengue mosquitoes.",
      "Manhole cover is broken and sewage is openly flowing. Children and elderly people are at risk of falling in.",
      "Garbage bins near the school are overflowing. The smell is unbearable and sanitation workers haven't come.",
    ],
  },
] as const;

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  // --- 1. Resolve user_id ---
  let userId: string | null = null;

  const userIdArg = process.argv.find((a) => a === "--user-id");
  if (userIdArg) {
    userId = process.argv[process.argv.indexOf("--user-id") + 1] ?? null;
  }

  if (!userId) {
    // Find first available profile
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .limit(5);

    if (error || !profiles?.length) {
      console.error("❌  No profiles found. Create at least one user account first.");
      console.error("    Or pass: npx tsx scripts/seed-demo-clusters.ts --user-id <uuid>");
      process.exit(1);
    }

    // Prefer a citizen account; fall back to any
    const citizen = profiles.find((p) => p.role === "citizen") || profiles[0];
    userId = citizen.id;
    console.log(`✔  Using profile: ${citizen.full_name} (${citizen.role}) — ${citizen.id}`);
  }

  // --- 2. Resolve department IDs ---
  const deptNames = [...new Set(HOTSPOTS.map((h) => h.departmentName))];
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, name")
    .in("name", deptNames);

  if (deptError || !departments?.length) {
    console.error("❌  Could not fetch departments:", deptError?.message);
    process.exit(1);
  }

  const deptMap = new Map(departments.map((d) => [d.name, d.id]));
  for (const name of deptNames) {
    if (!deptMap.has(name)) {
      console.warn(`⚠️  Department "${name}" not found in DB — skipping its hotspot.`);
    }
  }

  // --- 3. Build complaint rows ---
  if (!userId) {
    console.error("❌  Could not determine a user_id. Pass --user-id <uuid> explicitly.");
    process.exit(1);
  }

  const rows: {
    user_id: string;
    raw_text: string;
    category: string;
    department_id: string;
    status: string;
    latitude: number;
    longitude: number;
    created_at: string;
  }[] = [];

  for (const hotspot of HOTSPOTS) {
    const deptId = deptMap.get(hotspot.departmentName);
    if (!deptId) continue;

    console.log(`\n📍 ${hotspot.label} — ${hotspot.complaints.length} complaints`);

    for (const text of hotspot.complaints) {
      const lat = jitter(hotspot.baseLat);
      const lng = jitter(hotspot.baseLng);
      rows.push({
        user_id: userId,
        raw_text: text,
        category: hotspot.category,
        department_id: deptId,
        status: "submitted",
        latitude: lat,
        longitude: lng,
        created_at: randomPast(30),
      });
      console.log(`   + lat=${lat.toFixed(5)}, lng=${lng.toFixed(5)} — "${text.slice(0, 60)}..."`);
    }
  }

  if (rows.length === 0) {
    console.error("\n❌  No rows to insert (all departments missing?). Aborting.");
    process.exit(1);
  }

  // --- 4. Insert ---
  console.log(`\n⏳ Inserting ${rows.length} complaints into Supabase...`);
  const { data: inserted, error: insertError } = await supabase
    .from("complaints")
    .insert(rows)
    .select("id");

  if (insertError) {
    console.error("❌  Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`\n✅  Successfully seeded ${inserted?.length ?? rows.length} demo complaints.`);
  console.log("   The Root-Cause Analysis panel will now show 3 cluster cards.");
  console.log("   Open /admin and wait for the panel to load (~5s for Groq).\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
