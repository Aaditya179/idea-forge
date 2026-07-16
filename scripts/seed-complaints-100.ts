/**
 * scripts/seed-complaints-100.ts
 *
 * Direct database seeding script for Supabase to insert 100 complaints across
 * Mumbai metropolitan area.
 * Bypasses Groq/AI classifiers and duplicate detection APIs to ensure
 * fast, free, rate-limit-independent database seeding.
 *
 * Run:
 *   npx tsx scripts/seed-complaints-100.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ── Load Environment Variables ────────────────────────────────────────────────
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

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Helper to generate UUIDs locally
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Coordinate jitter helper
function jitter(base: number, maxOffset = 0.0025): number {
  return Math.round((base + (Math.random() * 2 - 1) * maxOffset) * 100000) / 100000;
}

// Random past date helper
function randomPastDate(daysAgoLimit = 14): Date {
  const now = new Date();
  const diffMs = Math.random() * daysAgoLimit * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - diffMs);
}

// Template definitions for the 100 complaints grouped by area
interface ComplaintTemplate {
  area: string;
  category: "Roads" | "Water Supply" | "Electricity" | "Sanitation" | "Other";
  priority: "low" | "medium" | "high";
  raw_text: string;
  location_text: string;
  isClusterItem?: boolean;
  clusterIndex?: number; // Identifies which cluster this belongs to
  isPrimary?: boolean;
}

// Pre-define 100 complaints with realistic texts
const COMPLAINT_TEMPLATES: ComplaintTemplate[] = [
  // ── ANDHERI (12 total): 8-item Roads cluster, 4 standalone ──
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "Huge pothole near Andheri subway. It is causing extreme waterlogging and multiple bikes are slipping daily.",
    location_text: "Near Andheri Subway, Andheri East, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
    isPrimary: true,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "Andheri subway ke bahar bohot bada gaddha ho gaya hai. Traffic is completely stuck, please fix immediately.",
    location_text: "Andheri Subway Exit, Andheri West, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "अंधेरी सबवे के पास सड़क पूरी तरह से टूट चुकी है। गाड़ियां बहुत धीरे चल रही हैं और बहुत लंबा जाम लग रहा है।",
    location_text: "Near Western Express Highway Andheri Subway, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "medium",
    raw_text: "Dangerous pothole at Andheri subway crossing. It damages tires, municipal team needs to fill it up.",
    location_text: "Andheri Subway Crossing, Andheri East, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "Major road damage under Andheri subway block. Commuters are facing severe problems during evening peak hours.",
    location_text: "Subway Underpass, Andheri West, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "Gaddha on Andheri subway road is widening day by day. Please repair it before some major accident occurs.",
    location_text: "Andheri Subway Approach Road, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "medium",
    raw_text: "Subway road has completely deteriorated after rains. Please send a crew to do asphalt patching near Andheri subway.",
    location_text: "Andheri Subway, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Roads",
    priority: "high",
    raw_text: "Extreme traffic due to pothole under Andheri subway. Autos and cars are struggling to pass through.",
    location_text: "Andheri Subway Road, Mumbai",
    isClusterItem: true,
    clusterIndex: 1,
  },
  {
    area: "Andheri",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Overflowing garbage bin near Veera Desai Road police station. Waste is spilling on the footpath.",
    location_text: "Veera Desai Road, Andheri West, Mumbai",
  },
  {
    area: "Andheri",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlights are blinking continuously on Marol Pipeline Road, making it very annoying and unsafe.",
    location_text: "Marol Pipeline Road, Andheri East, Mumbai",
  },
  {
    area: "Andheri",
    category: "Water Supply",
    priority: "high",
    raw_text: "Contaminated water supply coming in Seven Bungalows. Smells strongly of sewage water.",
    location_text: "Seven Bungalows, Versova, Andheri West, Mumbai",
  },
  {
    area: "Andheri",
    category: "Sanitation",
    priority: "low",
    raw_text: "Municipal sweeping workers have not cleaned the street for 3 days near Lokhandwala market.",
    location_text: "Lokhandwala Complex Market, Andheri West, Mumbai",
  },

  // ── BANDRA (10 total): 6-item Water Supply cluster, 4 standalone ──
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "high",
    raw_text: "Major drinking water pipeline leakage near Pali Hill. Thousands of gallons of clean water are leaking onto the road.",
    location_text: "Pali Hill Road, Bandra West, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
    isPrimary: true,
  },
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "high",
    raw_text: "Pali Hill area me road pe pipe burst ho gaya hai, fresh drinking water poora waste ho raha hai. Please repair it.",
    location_text: "Near Pali Hill Club, Bandra West, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
  },
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Huge water wastage near Pali Hill water mains. Water has been bubbling out from the asphalt since early morning.",
    location_text: "Pali Hill Main Road, Bandra, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
  },
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "high",
    raw_text: "पाली हिल के पास मुख्य पानी की पाइपलाइन फट गई है। साफ पानी सड़क पर बह रहा है, इसे तुरंत ठीक करें।",
    location_text: "Pali Hill Water Pipeline Point, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
  },
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "high",
    raw_text: "Leakage in municipal water pipe at Pali Hill lane. Road has turned into a small stream. Huge wastage of resources.",
    location_text: "Pali Hill Lane 3, Bandra West, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
  },
  {
    area: "Bandra",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Drinking water leak near Pali Hill gate. Please dispatch water department maintenance engineers.",
    location_text: "Pali Hill Crossing, Bandra West, Mumbai",
    isClusterItem: true,
    clusterIndex: 2,
  },
  {
    area: "Bandra",
    category: "Roads",
    priority: "medium",
    raw_text: "Footpath broken near Bandstand promenade. Senior citizens are tripping while walking.",
    location_text: "Bandstand Promenade, Bandra West, Mumbai",
  },
  {
    area: "Bandra",
    category: "Sanitation",
    priority: "high",
    raw_text: "Public dustbins are completely full on Carter Road near the food stalls. Litter is spreading everywhere.",
    location_text: "Carter Road Promenade, Bandra West, Mumbai",
  },
  {
    area: "Bandra",
    category: "Electricity",
    priority: "high",
    raw_text: "High voltage sparks near Bandra East station autostand. Hanging cables are touching the metal shed.",
    location_text: "Autostand, Bandra East, Mumbai",
  },
  {
    area: "Bandra",
    category: "Roads",
    priority: "low",
    raw_text: "Illegal banner blocking the visibility of traffic signpost at Bandra Reclamation junction.",
    location_text: "Reclamation Highway Junction, Bandra West, Mumbai",
  },

  // ── DADAR (8 total): Standalone ──
  {
    area: "Dadar",
    category: "Sanitation",
    priority: "high",
    raw_text: "Garbage not picked up for 5 days near Dadar flower market. Rotten smell is making it impossible to breathe.",
    location_text: "Dadar Flower Market Lane, Dadar West, Mumbai",
  },
  {
    area: "Dadar",
    category: "Roads",
    priority: "high",
    raw_text: "Massive pothole at Dadar TT Circle right at the tram car junction. Dangerous for buses and cars.",
    location_text: "Dadar TT Circle, Dadar East, Mumbai",
  },
  {
    area: "Dadar",
    category: "Water Supply",
    priority: "high",
    raw_text: "Sewage mixing with drinking water line near Shivaji Park. Taps are yielding brown water with worms.",
    location_text: "Shivaji Park residential block, Dadar, Mumbai",
  },
  {
    area: "Dadar",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlights are off on Gokhale Road between the two signals. Extremely dark during night walk.",
    location_text: "Gokhale Road North, Dadar West, Mumbai",
  },
  {
    area: "Dadar",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Open gutter on Ranade Road. The concrete cover slab has cracked and fallen inside, dangerous for kids.",
    location_text: "Ranade Road, Dadar West, Mumbai",
  },
  {
    area: "Dadar",
    category: "Roads",
    priority: "medium",
    raw_text: "Dadar Plaza cinema lane has uneven paver blocks. Water pools inside the uneven path.",
    location_text: "Plaza Cinema Lane, Dadar, Mumbai",
  },
  {
    area: "Dadar",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Very low municipal water pressure near Portuguese Church area. Building overhead tank cannot fill up.",
    location_text: "Near Portuguese Church, Dadar West, Mumbai",
  },
  {
    area: "Dadar",
    category: "Electricity",
    priority: "low",
    raw_text: "Electricity meter box on the footpath is kept open. Wires are exposed to everyone.",
    location_text: "Senapati Bapat Marg, Dadar West, Mumbai",
  },

  // ── THANE (10 total): 6-item Electricity cluster, 4 standalone ──
  {
    area: "Thane",
    category: "Electricity",
    priority: "high",
    raw_text: "Thane Naupada electricity transformer is constantly sparking and making loud cracking noises.",
    location_text: "Naupada, Thane West, Thane",
    isClusterItem: true,
    clusterIndex: 3,
    isPrimary: true,
  },
  {
    area: "Thane",
    category: "Electricity",
    priority: "high",
    raw_text: "Power transformer near Naupada Thane West has huge sparking. Dangerous for surrounding houses.",
    location_text: "Naupada Substation Lane, Thane West, Thane",
    isClusterItem: true,
    clusterIndex: 3,
  },
  {
    area: "Thane",
    category: "Electricity",
    priority: "high",
    raw_text: "नौपाड़ा ठाणे वेस्ट में बिजली के ट्रांसफार्मर से चिंगारी निकल रही है। भयानक आवाज आ रही है, आग लग सकती है।",
    location_text: "Ram Maruti Road Corner, Naupada, Thane",
    isClusterItem: true,
    clusterIndex: 3,
  },
  {
    area: "Thane",
    category: "Electricity",
    priority: "medium",
    raw_text: "Thane West Naupada DP box transformer sparking since last night. Please send MSEB technician immediately.",
    location_text: "Naupada Circle, Thane West, Thane",
    isClusterItem: true,
    clusterIndex: 3,
  },
  {
    area: "Thane",
    category: "Electricity",
    priority: "high",
    raw_text: "Loud sound and sparks coming out from distribution box in Naupada Thane. Urgent attention required.",
    location_text: "Gokhale Road, Naupada, Thane West",
    isClusterItem: true,
    clusterIndex: 3,
  },
  {
    area: "Thane",
    category: "Electricity",
    priority: "high",
    raw_text: "Thane Naupada area main transformer sparking and causing voltage spikes in homes. Send repairs immediately.",
    location_text: "Naupada, Thane, Maharashtra",
    isClusterItem: true,
    clusterIndex: 3,
  },
  {
    area: "Thane",
    category: "Water Supply",
    priority: "high",
    raw_text: "Irregular water supply in Ghodbunder Road society. Getting water only for 10 minutes at midnight.",
    location_text: "Ghodbunder Road, Thane West, Thane",
  },
  {
    area: "Thane",
    category: "Roads",
    priority: "high",
    raw_text: "Huge craters on Teen Hath Naka bridge. Cars are slamming brakes causing mini rear-end accidents.",
    location_text: "Teen Hath Naka Flyover, Thane, Maharashtra",
  },
  {
    area: "Thane",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Open dumping ground near Majiwada circle. Public throwing all wet waste there, attracting flies.",
    location_text: "Near Majiwada Circle, Thane West, Thane",
  },
  {
    area: "Thane",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Pipe leakage near Hiranandani Estate entrance. Water logging on road due to supply line leak.",
    location_text: "Hiranandani Estate Entrance, Thane West, Thane",
  },

  // ── NAVI MUMBAI / VASHI (8 total): Standalone ──
  {
    area: "Navi Mumbai / Vashi",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Industrial chemical waste dumped along the road near Vashi Sector 19. Toxic fumes coming out.",
    location_text: "Sector 19, Vashi, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Low pressure drinking water supply near Vashi Plaza. Tap water is muddy.",
    location_text: "Sector 17, Vashi, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Roads",
    priority: "high",
    raw_text: "Pothole on Vashi bridge lane toward Chembur. Cars swerve dangerous to avoid it.",
    location_text: "Sion-Panvel Highway Vashi Bridge, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlight column leaning dangerously toward the road near Sector 26 park.",
    location_text: "Sector 26 Park, Vashi, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Sanitation",
    priority: "low",
    raw_text: "Debris of construction left on Vashi Palm Beach highway walking track.",
    location_text: "Palm Beach Road Walking Track, Vashi, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Water Supply",
    priority: "high",
    raw_text: "Water supply line damaged during building excavation near Vashi Sector 5.",
    location_text: "Sector 5, Vashi, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Roads",
    priority: "medium",
    raw_text: "Vashi railway station complex road has multiple broken speedbreakers that damage cars.",
    location_text: "Vashi Station Complex Access Road, Navi Mumbai",
  },
  {
    area: "Navi Mumbai / Vashi",
    category: "Electricity",
    priority: "high",
    raw_text: "Whole of Vashi Sector 14 facing blackouts since morning. No information from staff.",
    location_text: "Sector 14, Vashi, Navi Mumbai",
  },

  // ── BORIVALI (8 total): Standalone ──
  {
    area: "Borivali",
    category: "Roads",
    priority: "high",
    raw_text: "Potholes on Borivali Gorai Road. Vehicles cannot drive faster than 10km/h without damaging suspension.",
    location_text: "Gorai Road, Borivali West, Mumbai",
  },
  {
    area: "Borivali",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Severe garbage heap near Borivali West station market. Bad smell is affecting shopkeepers.",
    location_text: "Station Market Road, Borivali West, Mumbai",
  },
  {
    area: "Borivali",
    category: "Water Supply",
    priority: "high",
    raw_text: "No water supply in IC Colony Borivali for past 48 hours. Water tankers are charging double.",
    location_text: "IC Colony, Borivali West, Mumbai",
  },
  {
    area: "Borivali",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlights are off under the Borivali national park flyover. Very dark and unsafe for pedestrians.",
    location_text: "National Park Flyover, Borivali East, Mumbai",
  },
  {
    area: "Borivali",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Drainage choked near Shimpoli Road. Dirty water is overflowing onto the shop stairs.",
    location_text: "Shimpoli Road, Borivali West, Mumbai",
  },
  {
    area: "Borivali",
    category: "Roads",
    priority: "low",
    raw_text: "Pedestrian footpath tiles cracked and loosely placed near Borivali West garden.",
    location_text: "Borivali West Public Garden, Mumbai",
  },
  {
    area: "Borivali",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Water smells chemical and looks yellowish in Borivali East Kajupada area.",
    location_text: "Kajupada, Borivali East, Mumbai",
  },
  {
    area: "Borivali",
    category: "Electricity",
    priority: "low",
    raw_text: "Electric panel box door broken and swinging loose in wind near Borivali west court.",
    location_text: "Borivali Court Lane, Borivali West, Mumbai",
  },

  // ── KURLA (6 total): 4-item Sanitation cluster, 2 standalone ──
  {
    area: "Kurla",
    category: "Sanitation",
    priority: "high",
    raw_text: "Massive garbage dumping on LBS Road, Kurla West. Public is throwing trash on the road and it has not been cleared.",
    location_text: "LBS Marg, Kurla West, Mumbai",
    isClusterItem: true,
    clusterIndex: 4,
    isPrimary: true,
  },
  {
    area: "Kurla",
    category: "Sanitation",
    priority: "high",
    raw_text: "Kurla West LBS Road me garbage collection truck nahi aa raha hai. Kachra raste pe overflow ho raha hai.",
    location_text: "LBS Road, Near Station Junction, Kurla West, Mumbai",
    isClusterItem: true,
    clusterIndex: 4,
  },
  {
    area: "Kurla",
    category: "Sanitation",
    priority: "high",
    raw_text: "कुर्ला वेस्ट एलबीएस रोड पर भारी कचरा जमा है। दुर्गंध आ रही है और मक्खियां भिनभिना रही हैं।",
    location_text: "LBS Marg opposite Mall, Kurla West, Mumbai",
    isClusterItem: true,
    clusterIndex: 4,
  },
  {
    area: "Kurla",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Overflowing garbage dump point on LBS road Kurla. Please send the BMC waste cleaning vehicle.",
    location_text: "LBS Road, Kurla, Mumbai",
    isClusterItem: true,
    clusterIndex: 4,
  },
  {
    area: "Kurla",
    category: "Water Supply",
    priority: "high",
    raw_text: "Clean drinking water pipe leakage near Kurla East railway track. Water gushing out at force.",
    location_text: "Near Station track, Kurla East, Mumbai",
  },
  {
    area: "Kurla",
    category: "Electricity",
    priority: "medium",
    raw_text: "Frequent power failures in Kurla East Nehru Nagar area. Electricity goes off every evening.",
    location_text: "Nehru Nagar, Kurla East, Mumbai",
  },

  // ── PANVEL (6 total): 4-item Electricity cluster, 2 standalone ──
  {
    area: "Panvel",
    category: "Electricity",
    priority: "medium",
    raw_text: "Entire line of streetlights on Panvel Highway near the bus terminal is out. Extremely dark.",
    location_text: "Panvel Highway, Panvel, Navi Mumbai",
    isClusterItem: true,
    clusterIndex: 5,
    isPrimary: true,
  },
  {
    area: "Panvel",
    category: "Electricity",
    priority: "medium",
    raw_text: "Panvel Bypass road highway streetlights are not working since last Tuesday. Very dark and unsafe for driving.",
    location_text: "Bypass Road, Panvel, Navi Mumbai",
    isClusterItem: true,
    clusterIndex: 5,
  },
  {
    area: "Panvel",
    category: "Electricity",
    priority: "medium",
    raw_text: "पनवेल हाईवे पर रोड लाइट्स बंद हैं। रात में गाड़ियों का एक्सीडेंट होने का खतरा रहता है।",
    location_text: "Highway intersection, Panvel, Navi Mumbai",
    isClusterItem: true,
    clusterIndex: 5,
  },
  {
    area: "Panvel",
    category: "Electricity",
    priority: "low",
    raw_text: "Highway streetlights not working in Panvel near the bus stand area. Commuters walking face issues.",
    location_text: "Near Bus Terminal, Panvel, Navi Mumbai",
    isClusterItem: true,
    clusterIndex: 5,
  },
  {
    area: "Panvel",
    category: "Sanitation",
    priority: "high",
    raw_text: "Choked gutter is overflowing with dark sewage near Panvel market area, dirtying the street.",
    location_text: "Panvel Market Road, Navi Mumbai",
  },
  {
    area: "Panvel",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Irregular water timings in Old Panvel. We are getting water at 2:00 AM instead of evening.",
    location_text: "Old Panvel resident quarters, Navi Mumbai",
  },

  // ── MULUND (7 total): Standalone ──
  {
    area: "Mulund",
    category: "Electricity",
    priority: "high",
    raw_text: "Mulund LBS Marg overhead wires have sparks whenever double decker buses pass below them.",
    location_text: "LBS Marg, Mulund West, Mumbai",
  },
  {
    area: "Mulund",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Chlorine smell in tap water is very high in Mulund East, water looks white.",
    location_text: "Mulund East housing colony, Mumbai",
  },
  {
    area: "Mulund",
    category: "Roads",
    priority: "high",
    raw_text: "Severe potholes on LBS Road near Mulund check naka. Long line of vehicles waiting.",
    location_text: "LBS Marg, Mulund Check Naka, Mumbai",
  },
  {
    area: "Mulund",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Carcass of stray animal lying on Mulund West road near park since yesterday, heavy smell.",
    location_text: "Devidayal Road Park, Mulund West, Mumbai",
  },
  {
    area: "Mulund",
    category: "Roads",
    priority: "low",
    raw_text: "Illegal hawkers encroaching the footpaths near Mulund Station road, blocking movement.",
    location_text: "Mulund Station West Access Road, Mumbai",
  },
  {
    area: "Mulund",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Water leakage in water meter main branch valve outside society in Mulund East.",
    location_text: "Mithagar Road, Mulund East, Mumbai",
  },
  {
    area: "Mulund",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Sanitation workers left sweepings in pile on road and did not pick it up, blowing in wind.",
    location_text: "Lala Devidayal Road, Mulund West, Mumbai",
  },

  // ── KALYAN (7 total): Standalone ──
  {
    area: "Kalyan",
    category: "Roads",
    priority: "high",
    raw_text: "Huge pothole at Kalyan Station road square. Autos are crashing into it every few minutes.",
    location_text: "Kalyan Railway Station Square, Kalyan West",
  },
  {
    area: "Kalyan",
    category: "Electricity",
    priority: "high",
    raw_text: "Live high tension wire snapped and lying on wet ground in Kalyan East. Very dangerous.",
    location_text: "Chinchpada Road, Kalyan East, Maharashtra",
  },
  {
    area: "Kalyan",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Garbage vans do not come in Kalyan Khadegolwali area regularly. Garbage rotting outside.",
    location_text: "Khadegolwali, Kalyan East, Maharashtra",
  },
  {
    area: "Kalyan",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Muddy drinking water supply since last week in Kalyan West Rambaug area.",
    location_text: "Rambaug, Kalyan West, Maharashtra",
  },
  {
    area: "Kalyan",
    category: "Roads",
    priority: "medium",
    raw_text: "Concrete road cracked and splitting open near Birla College road, Kalyan West.",
    location_text: "Birla College Road, Kalyan West, Maharashtra",
  },
  {
    area: "Kalyan",
    category: "Electricity",
    priority: "low",
    raw_text: "Streetlights are on during bright daylight hours near Kalyan D-mart. Power waste.",
    location_text: "D-Mart Lane, Kalyan West, Maharashtra",
  },
  {
    area: "Kalyan",
    category: "Sanitation",
    priority: "low",
    raw_text: "Public toilet door broken and lock not working at Kalyan East chowk.",
    location_text: "Kalyan East Chowk public utility, Maharashtra",
  },

  // ── POWAI (6 total): Standalone ──
  {
    area: "Powai",
    category: "Water Supply",
    priority: "high",
    raw_text: "No water supply in Powai Hiranandani societies since 3 days due to major valve damage.",
    location_text: "Hiranandani Gardens, Powai, Mumbai",
  },
  {
    area: "Powai",
    category: "Roads",
    priority: "medium",
    raw_text: "Road work left half complete at Powai Lake road. Piles of stones blocking lane.",
    location_text: "Powai Lake Road, Powai, Mumbai",
  },
  {
    area: "Powai",
    category: "Sanitation",
    priority: "high",
    raw_text: "Severe plastic waste clogging Powai Lake corner. Dead fish floating, immediate action needed.",
    location_text: "Powai Lake Promenade, Powai, Mumbai",
  },
  {
    area: "Powai",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlights completely off near Powai IIT main gate. Safe walking is hard at night.",
    location_text: "IIT Main Gate Road, Powai, Mumbai",
  },
  {
    area: "Powai",
    category: "Roads",
    priority: "low",
    raw_text: "Defective speedbreaker without paint on Powai Vihar road, vehicles get sudden bumps.",
    location_text: "Powai Vihar Complex road, Powai, Mumbai",
  },
  {
    area: "Powai",
    category: "Sanitation",
    priority: "medium",
    raw_text: "Garbage bins kept on the middle of the road near Powai plaza causing traffic issues.",
    location_text: "Powai Plaza Lane, Powai, Mumbai",
  },

  // ── CHEMBUR (6 total): Standalone ──
  {
    area: "Chembur",
    category: "Sanitation",
    priority: "high",
    raw_text: "Sewer gas leaking from drainage near Chembur station, smell is unbearable and choking residents.",
    location_text: "Chembur Station Road, Chembur, Mumbai",
  },
  {
    area: "Chembur",
    category: "Roads",
    priority: "medium",
    raw_text: "Uneven road surface on Chembur Shell Colony road causing bumpy rides for auto rickshaws.",
    location_text: "Shell Colony, Chembur, Mumbai",
  },
  {
    area: "Chembur",
    category: "Electricity",
    priority: "high",
    raw_text: "Hanging electrical cables outside Chembur Naka residential gate. Sparking when heavy rain falls.",
    location_text: "Chembur Naka, Chembur, Mumbai",
  },
  {
    area: "Chembur",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Water smells rusty and has red particles near Fine Arts Hall Chembur lane.",
    location_text: "Fine Arts Hall Lane, Chembur, Mumbai",
  },
  {
    area: "Chembur",
    category: "Sanitation",
    priority: "low",
    raw_text: "Dry leaves and plastic accumulation inside drainage inlets near Chembur Gymkhana.",
    location_text: "Chembur Gymkhana, Chembur, Mumbai",
  },
  {
    area: "Chembur",
    category: "Roads",
    priority: "medium",
    raw_text: "Paver blocks sinking under weight of heavy vehicles near Chembur colony signal.",
    location_text: "Shell Colony Signal, Chembur, Mumbai",
  },

  // ── MALAD (6 total): Standalone ──
  {
    area: "Malad",
    category: "Roads",
    priority: "high",
    raw_text: "Massive pothole cluster near Malad Link Road junction. Driving is extremely difficult.",
    location_text: "Link Road Junction, Malad West, Mumbai",
  },
  {
    area: "Malad",
    category: "Electricity",
    priority: "medium",
    raw_text: "Streetlights not working near Malad Mindspace back road. Very dark for night runners.",
    location_text: "Mindspace Road, Malad West, Mumbai",
  },
  {
    area: "Malad",
    category: "Sanitation",
    priority: "high",
    raw_text: "Sewage water flooding Malad West station road due to pipeline burst. Heavy traffic jam.",
    location_text: "Station Road West, Malad, Mumbai",
  },
  {
    area: "Malad",
    category: "Water Supply",
    priority: "medium",
    raw_text: "Very low municipal water pressure near Malad East Triveni Nagar. Cannot fill water tanks.",
    location_text: "Triveni Nagar, Malad East, Mumbai",
  },
  {
    area: "Malad",
    category: "Sanitation",
    priority: "low",
    raw_text: "Garbage dump near Malad West school is not cleaned regularly, causing bad smell for students.",
    location_text: "Near Orlem School, Malad West, Mumbai",
  },
  {
    area: "Malad",
    category: "Roads",
    priority: "medium",
    raw_text: "Concrete road divider broken and blocks of cement are lying on Malad West highway lane.",
    location_text: "WEH Malad West stretch, Mumbai",
  },
];

// Coordinate bases for each area
const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Andheri: { lat: 19.1197, lng: 72.8468 },
  Bandra: { lat: 19.0596, lng: 72.8295 },
  Dadar: { lat: 19.0178, lng: 72.8478 },
  Thane: { lat: 19.2183, lng: 72.9781 },
  "Navi Mumbai / Vashi": { lat: 19.0771, lng: 73.0169 },
  Borivali: { lat: 19.2307, lng: 72.8567 },
  Mulund: { lat: 19.1726, lng: 72.9425 },
  Kalyan: { lat: 19.2437, lng: 73.1355 },
  Powai: { lat: 19.1176, lng: 72.9060 },
  Chembur: { lat: 19.0522, lng: 72.9005 },
  Malad: { lat: 19.1864, lng: 72.8489 },
  Kurla: { lat: 19.0728, lng: 72.8826 },
  Panvel: { lat: 18.9894, lng: 73.1175 },
};

async function main() {
  console.log("================================================================================");
  console.log("🏙️  SUPABASE SEED SCRIPT: 100 CIVIC COMPLAINTS");
  console.log("================================================================================");
  console.log(`Target Supabase Project URL: ${SUPABASE_URL}`);
  console.log("================================================================================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirm = await new Promise<string>((resolve) => {
    rl.question(
      `⚠️ WARNING: This will insert 100 mock complaints directly into the Supabase database.
To confirm this action, please type "yes": `,
      (answer) => {
        resolve(answer.trim().toLowerCase());
      }
    );
  });

  rl.close();

  if (confirm !== "yes") {
    console.log("❌ Seeding cancelled by user. Exiting.");
    process.exit(0);
  }

  console.log("\n⏳ Initializing database seeding...");

  // 1. Fetch departments mapping
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
  console.log(`✔ Loaded ${departments.length} departments.`);

  // 2. Fetch citizen profiles
  const { data: profiles, error: profError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "citizen");

  if (profError || !profiles || profiles.length === 0) {
    console.error("❌ Failed to fetch citizen profiles. Make sure users are seeded first.");
    process.exit(1);
  }
  console.log(`✔ Loaded ${profiles.length} citizen profiles.`);

  // 3. Pre-generate UUIDs for clusters to establish relationships cleanly
  const clusterIdMap = new Map<number, string>();
  for (let idx = 1; idx <= 5; idx++) {
    clusterIdMap.set(idx, generateUUID());
  }

  // Pre-generate primary complaint IDs so duplicates can refer to them
  const primaryIdMap = new Map<number, string>();
  COMPLAINT_TEMPLATES.forEach((tpl) => {
    if (tpl.isClusterItem && tpl.clusterIndex && tpl.isPrimary) {
      primaryIdMap.set(tpl.clusterIndex, generateUUID());
    }
  });

  // 4. Construct final rows to insert
  const complaintsToInsert: any[] = [];
  const updatesToInsert: any[] = [];

  const statuses: Array<"submitted" | "in_review" | "assigned" | "resolved"> = [
    "submitted",
    "submitted",
    "in_review",
    "in_review",
    "in_review",
    "assigned",
    "assigned",
    "resolved",
    "resolved",
  ];

  COMPLAINT_TEMPLATES.forEach((tpl, idx) => {
    const coords = AREA_COORDINATES[tpl.area] || { lat: 19.0, lng: 72.8 };
    const lat = jitter(coords.lat, 0.002);
    const lng = jitter(coords.lng, 0.002);
    const citizen = profiles[idx % profiles.length];

    let status: string = statuses[idx % statuses.length];
    const createdAt = randomPastDate(14);
    const diffDays = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 10) {
      status = "resolved";
    } else if (diffDays > 5 && idx % 3 === 0) {
      status = "assigned";
    }

    const deptId = deptMap.get(tpl.category) || fallbackDeptId;
    const complaintId = (tpl.isClusterItem && tpl.clusterIndex && tpl.isPrimary)
      ? primaryIdMap.get(tpl.clusterIndex)!
      : generateUUID();

    let cluster_id: string | null = null;
    let is_duplicate = false;
    let duplicate_of: string | null = null;

    if (tpl.isClusterItem && tpl.clusterIndex) {
      cluster_id = clusterIdMap.get(tpl.clusterIndex) || null;
      if (tpl.isPrimary) {
        is_duplicate = false;
        duplicate_of = null;
      } else {
        is_duplicate = true;
        duplicate_of = primaryIdMap.get(tpl.clusterIndex) || null;
      }
    }

    complaintsToInsert.push({
      id: complaintId,
      user_id: citizen.id,
      raw_text: tpl.raw_text,
      category: tpl.category,
      department_id: deptId,
      status,
      priority: tpl.priority,
      location_text: tpl.location_text,
      latitude: lat,
      longitude: lng,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      cluster_id,
      is_duplicate,
      duplicate_of,
    });

    updatesToInsert.push({
      complaint_id: complaintId,
      note: "Complaint submitted",
      status_at_time: "submitted",
      updated_by: citizen.id,
      created_at: createdAt.toISOString(),
    });

    updatesToInsert.push({
      complaint_id: complaintId,
      note: `Classified by AI: ${tpl.category}, Priority: ${tpl.priority}`,
      status_at_time: "submitted",
      updated_by: citizen.id,
      created_at: new Date(createdAt.getTime() + 2000).toISOString(),
    });

    if (cluster_id) {
      updatesToInsert.push({
        complaint_id: complaintId,
        note: is_duplicate
          ? "Merged into similar issue cluster nearby after duplicate detection"
          : "New issue registered — designated as primary report of local cluster",
        status_at_time: "submitted",
        updated_by: null,
        created_at: new Date(createdAt.getTime() + 4000).toISOString(),
      });
    }

    if (status !== "submitted") {
      updatesToInsert.push({
        complaint_id: complaintId,
        note: status === "assigned"
          ? "Complaint assigned to departmental officer for verification"
          : "Complaint resolved. Issue has been fixed on-site.",
        status_at_time: status,
        updated_by: null,
        created_at: new Date(createdAt.getTime() + 3600000).toISOString(),
      });
    }
  });

  const batchSize = 20;
  console.log(`\n⏳ Seeding ${complaintsToInsert.length} complaints in batches of ${batchSize}...`);

  for (let i = 0; i < complaintsToInsert.length; i += batchSize) {
    const complaintBatch = complaintsToInsert.slice(i, i + batchSize);
    const { error: compErr } = await supabaseAdmin.from("complaints").insert(complaintBatch);
    if (compErr) {
      console.error(`❌ Batch insert complaints failed at index ${i}:`, compErr.message);
      process.exit(1);
    }

    const updateBatch = updatesToInsert.filter((u) =>
      complaintBatch.some((c) => c.id === u.complaint_id)
    );
    const { error: updErr } = await supabaseAdmin.from("complaint_updates").insert(updateBatch);
    if (updErr) {
      console.error(`❌ Batch insert updates failed at index ${i}:`, updErr.message);
      process.exit(1);
    }

    console.log(`✔ Inserted complaints ${i + 1} to ${Math.min(i + batchSize, complaintsToInsert.length)}`);
  }

  const areaCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  complaintsToInsert.forEach((c) => {
    const tpl = COMPLAINT_TEMPLATES.find((t) => t.raw_text === c.raw_text);
    const areaName = tpl ? tpl.area : "Unknown";
    areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;

    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  console.log("\n================================================================================");
  console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  console.log("── Geographic Distribution ──");
  console.table(Object.entries(areaCounts).map(([Area, Count]) => ({ Area, Count })));

  console.log("\n── Department Breakdown ──");
  console.table(Object.entries(categoryCounts).map(([Department, Count]) => ({ Department, Count })));

  console.log("\n── Status Distribution ──");
  console.table(Object.entries(statusCounts).map(([Status, Count]) => ({ Status, Count })));

  console.log(`\n📊 Total complaints added: ${complaintsToInsert.length}`);
  console.log(`📊 Total updates added: ${updatesToInsert.length}`);
  console.log(`🔗 Hardcoded clusters populated: 5 distinct issues (representing 28 complaints total)`);
  console.log("\nAll done! Teammates can immediately see this data on their dashboards.\n");
}

main().catch((err) => {
  console.error("❌ Fatal error in script:", err);
  process.exit(1);
});
