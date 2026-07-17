/**
 * Robust department resolver.
 *
 * Maps arbitrary AI category labels OR raw complaint text to one of the
 * canonical municipal departments that actually exist in the database.
 *
 * This exists because the triage LLM emits a wide variety of category strings
 * ("Water", "Water Supply", "streetlight", "sewage", "garbage", "pothole",
 * "power", "solid waste", …). A naive exact/`includes` match against the small
 * set of seeded department names silently collapses most of them to "Other".
 * This resolver normalizes the input (case, whitespace, punctuation, filler
 * words) and matches it against a synonym/keyword map so genuine complaints
 * route to the correct department. It returns `null` only when the input truly
 * does not correspond to a known service department — the caller decides when
 * to fall back to "Other".
 */

// Canonical department names as seeded in the DB (see 001_initial_schema.sql).
export const CANONICAL_DEPARTMENTS = [
  "Water Supply",
  "Electricity",
  "Roads",
  "Sanitation",
] as const;

export type CanonicalDepartment = (typeof CANONICAL_DEPARTMENTS)[number];

// Keyword synonyms for each canonical department. Includes the AI's likely
// category labels, common civic terms, and multi-word phrases.
const DEPARTMENT_SYNONYMS: { dept: CanonicalDepartment; keywords: string[] }[] = [
  {
    dept: "Water Supply",
    keywords: [
      "water", "water supply", "pipe", "pipeline", "pipes", "tap", "taps",
      "leak", "leakage", "leaking", "supply", "tank", "borewell", "bore well",
      "drinking", "drinking water", "plumbing", "hydrant", "waterlogging",
      "water logging", "no water", "low pressure",
    ],
  },
  {
    dept: "Electricity",
    keywords: [
      "electric", "electrical", "electricity", "power", "power cut", "powercut",
      "wire", "wiring", "wires", "transformer", "voltage", "outage", "blackout",
      "meter", "streetlight", "street light", "streetlights", "street lights",
      "lamp", "lamppost", "lamp post", "lighting", "light", "current", "shock",
      "short circuit", "electric pole", "pole",
    ],
  },
  {
    dept: "Roads",
    keywords: [
      "road", "roads", "pothole", "potholes", "highway", "bridge", "footpath",
      "pavement", "sidewalk", "crack", "cracks", "asphalt", "tar",
      "speed breaker", "speedbreaker", "divider", "carriageway",
      "road maintenance", "roadwork", "road work",
    ],
  },
  {
    dept: "Sanitation",
    keywords: [
      "garbage", "trash", "rubbish", "sewage", "sewer", "sewerage", "drain",
      "drainage", "waste", "solid waste", "sanitation", "toilet", "toilets",
      "dump", "dumping", "dumpyard", "smell", "stink", "litter", "manhole",
      "gutter", "clog", "clogged", "overflow", "cleaning", "cleanliness",
      "septic", "open defecation",
    ],
  },
];

// Words that carry no routing signal and should be stripped before matching.
const FILLER_WORDS = new Set([
  "department", "dept", "municipal", "corporation", "management",
  "maintenance", "issue", "issues", "problem", "problems", "complaint",
  "the", "of", "and", "a", "an",
]);

// Explicit "unclassifiable" labels — treated as "no specific department".
const OTHER_LABELS = /^(other|others|misc|miscellaneous|general|unknown|na|none)$/;

/**
 * Lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeText(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve an AI category label or raw complaint text to a canonical department.
 * Returns the canonical department name, or `null` if there is no confident
 * match to a specific service department (caller decides on "Other").
 */
export function resolveSpecificDepartment(input: string): CanonicalDepartment | null {
  const norm = normalizeText(input);
  if (!norm) return null;

  // Explicit "other/misc/general" → no specific department.
  if (OTHER_LABELS.test(norm)) return null;

  // 1. Direct match against a canonical department name.
  for (const dept of CANONICAL_DEPARTMENTS) {
    if (normalizeText(dept) === norm) return dept;
  }

  // 2. Keyword/synonym scoring.
  const tokens = new Set(norm.split(" ").filter((t) => t && !FILLER_WORDS.has(t)));

  let best: { dept: CanonicalDepartment; score: number } | null = null;
  for (const { dept, keywords } of DEPARTMENT_SYNONYMS) {
    let score = 0;
    for (const kw of keywords) {
      if (kw.includes(" ")) {
        // Multi-word phrase — strong signal when present.
        if (norm.includes(kw)) score += 2;
      } else if (tokens.has(kw)) {
        // Exact whole-word token match — strong signal.
        score += 2;
      } else if (norm.includes(kw)) {
        // Substring match (handles plurals like "potholes" ⊇ "pothole").
        score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { dept, score };
    }
  }

  return best ? best.dept : null;
}
