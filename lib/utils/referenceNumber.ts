/**
 * Utility helper to generate a deterministic display-only Complaint Reference Number
 * from the existing complaint UUID.
 *
 * Requirements met:
 * - Always generates the same reference for the same complaint ID.
 * - Short & human-readable (CP-XXXXXX format).
 * - Zero database or schema modifications.
 */
export function getReferenceNumber(complaintId?: string | null): string {
  if (!complaintId) return "CP-000000";
  // Strip dashes to extract raw hex digits deterministically
  const cleanId = complaintId.replace(/-/g, "");
  // Take the first 8 hex digits and parse as an integer
  const num = parseInt(cleanId.slice(0, 8), 16);
  if (isNaN(num)) {
    // Fallback deterministic hash if ID is non-hexadecimal
    let hash = 0;
    for (let i = 0; i < complaintId.length; i++) {
      hash = (hash << 5) - hash + complaintId.charCodeAt(i);
      hash |= 0;
    }
    const safeNum = (Math.abs(hash) % 900000) + 100000;
    return `CP-${safeNum}`;
  }
  // Modulo 900000 + 100000 ensures a clean 6-digit number (100000 - 999999)
  const sixDigit = (num % 900000) + 100000;
  return `CP-${sixDigit}`;
}
