/**
 * Keyword-based complaint router.
 *
 * Given the raw text of a complaint, returns the matched category
 * and department name based on simple keyword matching.
 *
 * // TODO: replace with LLM classification agent
 * This entire function is the drop-in replacement point for AI-based
 * classification. The expected contract:
 *   Input:  raw complaint text (string)
 *   Output: { category: string, departmentName: string }
 *
 * When replacing with an LLM agent, maintain the same return signature
 * so the rest of the codebase continues to work unchanged.
 */

interface RoutingResult {
  category: string;
  departmentName: string;
}

// Keyword → department mapping
const KEYWORD_MAP: { keywords: string[]; category: string; departmentName: string }[] = [
  {
    keywords: ["water", "pipe", "tap", "leak", "supply", "tank", "borewell", "drinking"],
    category: "Water Supply",
    departmentName: "Water Supply",
  },
  {
    keywords: ["electric", "power", "wire", "transformer", "voltage", "outage", "blackout", "meter"],
    category: "Electricity",
    departmentName: "Electricity",
  },
  {
    keywords: ["road", "pothole", "highway", "bridge", "footpath", "pavement", "crack", "asphalt"],
    category: "Roads",
    departmentName: "Roads",
  },
  {
    keywords: ["garbage", "trash", "sewage", "drain", "waste", "sanitation", "toilet", "dump", "smell"],
    category: "Sanitation",
    departmentName: "Sanitation",
  },
];

/**
 * Classify a complaint using keyword matching.
 *
 * // TODO: replace with LLM classification agent
 *
 * @param rawText - The raw complaint text from the citizen
 * @returns RoutingResult with category and departmentName
 */
export function classifyComplaint(rawText: string): RoutingResult {
  const lowerText = rawText.toLowerCase();

  for (const mapping of KEYWORD_MAP) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword)) {
        return {
          category: mapping.category,
          departmentName: mapping.departmentName,
        };
      }
    }
  }

  // Default fallback
  return {
    category: "Other",
    departmentName: "Other",
  };
}
