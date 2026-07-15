import { SupabaseClient } from "@supabase/supabase-js";
import type { Complaint, ComplaintUpdate, ComplaintStatus } from "@/lib/types";

// ============================
// COMPLAINT QUERIES
// ============================

/**
 * Get complaints for a specific citizen (their own complaints)
 */
export async function getCitizenComplaints(
  supabase: SupabaseClient,
  userId: string
): Promise<Complaint[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*, departments(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching citizen complaints:", error);
    return [];
  }

  return data as Complaint[];
}

/**
 * Get complaints for an officer's department, with optional status filter
 */
export async function getOfficerComplaints(
  supabase: SupabaseClient,
  departmentId: string,
  statusFilter?: ComplaintStatus | "all"
): Promise<Complaint[]> {
  let query = supabase
    .from("complaints")
    .select("*, departments(name), profiles(full_name)")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching officer complaints:", error);
    return [];
  }

  return data as Complaint[];
}

/**
 * Get ALL complaints (for admin), with optional filters
 */
export async function getAllComplaints(
  supabase: SupabaseClient,
  filters?: { departmentId?: string; status?: ComplaintStatus | "all" }
): Promise<Complaint[]> {
  let query = supabase
    .from("complaints")
    .select("*, departments(name), profiles(full_name)")
    .order("created_at", { ascending: false });

  if (filters?.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all complaints:", error);
    return [];
  }

  return data as Complaint[];
}

/**
 * Get a single complaint by ID
 */
export async function getComplaintById(
  supabase: SupabaseClient,
  complaintId: string
): Promise<Complaint | null> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*, departments(name), profiles(full_name)")
    .eq("id", complaintId)
    .single();

  if (error) {
    console.error("Error fetching complaint:", error);
    return null;
  }

  return data as Complaint;
}

/**
 * Insert a new complaint
 */
export async function createComplaint(
  supabase: SupabaseClient,
  complaint: {
    user_id: string;
    raw_text: string;
    category: string;
    department_id: string;
    location_text?: string | null;
    image_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }
): Promise<Complaint | null> {
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: complaint.user_id,
      raw_text: complaint.raw_text,
      category: complaint.category,
      department_id: complaint.department_id,
      status: "submitted",
      location_text: complaint.location_text || null,
      image_url: complaint.image_url || null,
      latitude: complaint.latitude || null,
      longitude: complaint.longitude || null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Error creating complaint:",
      error.message,
      error.details,
      error.hint
    );
    return null;
  }

  return data as Complaint;
}

/**
 * Update a complaint's status
 */
export async function updateComplaintStatus(
  supabase: SupabaseClient,
  complaintId: string,
  newStatus: ComplaintStatus
): Promise<boolean> {
  const { error } = await supabase
    .from("complaints")
    .update({ status: newStatus })
    .eq("id", complaintId);

  if (error) {
    console.error("Error updating complaint status:", error);
    return false;
  }

  return true;
}

// ============================
// COMPLAINT UPDATES QUERIES
// ============================

/**
 * Get all updates for a complaint
 */
export async function getComplaintUpdates(
  supabase: SupabaseClient,
  complaintId: string
): Promise<ComplaintUpdate[]> {
  const { data, error } = await supabase
    .from("complaint_updates")
    .select("*, profiles(full_name)")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching complaint updates:", error);
    return [];
  }

  return data as ComplaintUpdate[];
}

/**
 * Insert a new complaint update
 */
export async function createComplaintUpdate(
  supabase: SupabaseClient,
  update: {
    complaint_id: string;
    note: string;
    status_at_time: string;
    updated_by?: string | null;
  }
): Promise<ComplaintUpdate | null> {
  const { data, error } = await supabase
    .from("complaint_updates")
    .insert({
      complaint_id: update.complaint_id,
      note: update.note,
      status_at_time: update.status_at_time,
      updated_by: update.updated_by || null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Error creating complaint update:",
      error.message,
      error.details,
      error.hint
    );
    return null;
  }

  return data as ComplaintUpdate;
}

// ============================
// ADMIN ANALYTICS QUERIES
// ============================

/**
 * Get total complaint count
 */
export async function getTotalComplaintCount(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("complaints")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching complaint count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get complaint counts grouped by department
 * // TODO: Replace with more sophisticated analytics query for AI-powered insights
 */
export async function getComplaintCountByDepartment(
  supabase: SupabaseClient
): Promise<{ department_name: string; count: number }[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("department_id, departments(name)");

  if (error) {
    console.error("Error fetching department counts:", error);
    return [];
  }

  // Aggregate client-side since Supabase doesn't support GROUP BY directly
  const countMap = new Map<string, number>();
  for (const row of data || []) {
    const deptName = (row.departments as unknown as { name: string })?.name || "Unknown";
    countMap.set(deptName, (countMap.get(deptName) || 0) + 1);
  }

  return Array.from(countMap.entries()).map(([department_name, count]) => ({
    department_name,
    count,
  }));
}

/**
 * Get complaint counts grouped by status
 * // TODO: Replace with more sophisticated analytics query for AI-powered insights
 */
export async function getComplaintCountByStatus(
  supabase: SupabaseClient
): Promise<{ status: string; count: number }[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("status");

  if (error) {
    console.error("Error fetching status counts:", error);
    return [];
  }

  const countMap = new Map<string, number>();
  for (const row of data || []) {
    countMap.set(row.status, (countMap.get(row.status) || 0) + 1);
  }

  return Array.from(countMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));
}

/**
 * Upload an image to the complaint-images bucket
 */
export async function uploadComplaintImage(
  supabase: SupabaseClient,
  file: File,
  userId: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("complaint-images")
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading image:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("complaint-images")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Get dynamic duplicate metrics for a specific complaint by category and location keyword matches
 * Calculates real cluster metrics to avoid hardcoding presentation analytics
 */
export async function getDuplicateStats(
  supabase: SupabaseClient,
  category: string,
  locationText: string | null | undefined
): Promise<{ clusterCount: number; hoursSaved: number }> {
  if (!locationText) {
    return { clusterCount: 1, hoursSaved: 0 };
  }

  // Extract the primary street/area keyword by splitting on commas 
  // (e.g., "G, Eastern Express Highway, Majiwada" -> "G" or "Eastern Express Highway")
  // If the first section is too short (like a single letter/room number), we fallback to the second block.
  const locationParts = locationText.split(",");
  let primeAreaKeyword = locationParts[0]?.trim() || "";

  if (primeAreaKeyword.length <= 3 && locationParts[1]) {
    primeAreaKeyword = locationParts[1].trim();
  }

  // Query database matching identical categories in a fuzzy string neighborhood path
  const { data, error } = await supabase
    .from("complaints")
    .select("id")
    .eq("category", category)
    .ilike("location_text", `%${primeAreaKeyword}%`);

  if (error) {
    console.error("Error computing dynamic duplicate clusters:", error);
    return { clusterCount: 1, hoursSaved: 0 };
  }

  const clusterCount = data?.length || 1;

  // Calculate impact hours: Each duplicate case intercepted saves exactly 1 administrative processing hour.
  const hoursSaved = clusterCount > 1 ? clusterCount : 0;

  return {
    clusterCount,
    hoursSaved
  };
}


// ============================
// DEPARTMENT PERFORMANCE (Feature 3 + 5)
// ============================

export interface DepartmentPerformance {
  department_name: string;
  total: number;
  resolved: number;
  resolutionRate: number; // %
  avgResolutionHours: number | null;
  slaPercent: number; // % resolved within SLA_HOURS
}

const SLA_HOURS = 72;

export async function getDepartmentPerformance(
  supabase: SupabaseClient
): Promise<DepartmentPerformance[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("department_id, status, created_at, updated_at, departments(name)");

  if (error) {
    console.error("Error fetching department performance:", error);
    return [];
  }

  type Row = {
    department_id: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    departments: { name: string } | null;
  };

  const grouped = new Map<string, { total: number; resolved: number; resolutionHours: number[]; withinSla: number }>();


  for (const row of (data as unknown as Row[]) || []) {
    const deptName = row.departments?.name || "Unknown";
    if (!grouped.has(deptName)) {
      grouped.set(deptName, { total: 0, resolved: 0, resolutionHours: [], withinSla: 0 });
    }
    const bucket = grouped.get(deptName)!;
    bucket.total += 1;

    if (row.status === "resolved") {
      bucket.resolved += 1;
      const hours =
        (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) /
        (1000 * 60 * 60);
      bucket.resolutionHours.push(hours);
      if (hours <= SLA_HOURS) bucket.withinSla += 1;
    }
  }

  return Array.from(grouped.entries()).map(([department_name, b]) => ({
    department_name,
    total: b.total,
    resolved: b.resolved,
    resolutionRate: b.total > 0 ? Math.round((b.resolved / b.total) * 100) : 0,
    avgResolutionHours:
      b.resolutionHours.length > 0
        ? Math.round(
          (b.resolutionHours.reduce((a, c) => a + c, 0) / b.resolutionHours.length) * 10
        ) / 10
        : null,
    slaPercent: b.resolved > 0 ? Math.round((b.withinSla / b.resolved) * 100) : 0,
  }));
}

// ============================
// MAP DATA (Feature 2)
// ============================

export interface ComplaintMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  category: string | null;
  department_name: string;
  status: string;
}

export async function getComplaintsForMap(
  supabase: SupabaseClient
): Promise<ComplaintMapPoint[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("id, latitude, longitude, category, status, departments(name)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) {
    console.error("Error fetching complaints for map:", error);
    return [];
  }

  type Row = {
    id: string;
    latitude: number;
    longitude: number;
    category: string | null;
    status: string;
    departments: { name: string } | null;
  };

  return ((data as unknown as Row[]) || []).map((row) => ({
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    department_name: row.departments?.name || "Unknown",
    status: row.status,
  }));
}

// ============================
// ROOT CAUSE CLUSTER SUMMARY (Feature 4 — pre-aggregation for Groq)
// ============================

export interface ClusterSummary {
  department_name: string;
  category: string | null;
  location_key: string;
  lat_zone: number | null;
  lng_zone: number | null;
  count: number;
  sample_texts: string[];
}

export async function getClusterSummaries(
  supabase: SupabaseClient
): Promise<ClusterSummary[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("raw_text, category, latitude, longitude, departments(name)");

  if (error) {
    console.error("Error fetching cluster summaries:", error);
    return [];
  }

  type Row = {
    raw_text: string;
    category: string | null;
    latitude: number | null;
    longitude: number | null;
    departments: { name: string } | null;
  };

  // Bucket complaints by department + category + lat/lng grid zone.
  // Rounding to 2 decimal places creates ~1.1 km × ~0.9 km cells at Indian latitudes —
  // fine-grained enough to distinguish wards, coarse enough to merge nearby complaints.
  // Complaints with no coordinates fall into a "no-location" bucket (still useful for analysis).
  const clusters = new Map<
    string,
    {
      department_name: string;
      category: string | null;
      location_key: string;
      lat_zone: number | null;
      lng_zone: number | null;
      texts: string[];
    }
  >();

  for (const row of (data as unknown as Row[]) || []) {
    const deptName = row.departments?.name || "Unknown";
    const hasCoords = row.latitude != null && row.longitude != null;
    const latZone = hasCoords ? Math.round(row.latitude! * 100) / 100 : null;
    const lngZone = hasCoords ? Math.round(row.longitude! * 100) / 100 : null;

    // Human-readable zone label shown in the Groq prompt and UI
    const locationKey = hasCoords
      ? `Zone ${latZone?.toFixed(2)},${lngZone?.toFixed(2)}`
      : "Unknown area";

    const key = `${deptName}|${row.category || "Uncategorized"}|${locationKey}`;

    if (!clusters.has(key)) {
      clusters.set(key, {
        department_name: deptName,
        category: row.category,
        location_key: locationKey,
        lat_zone: latZone,
        lng_zone: lngZone,
        texts: [],
      });
    }
    clusters.get(key)!.texts.push(row.raw_text);
  }

  return Array.from(clusters.values())
    .map((c) => ({
      department_name: c.department_name,
      category: c.category,
      location_key: c.location_key,
      lat_zone: c.lat_zone,
      lng_zone: c.lng_zone,
      count: c.texts.length,
      sample_texts: c.texts.slice(0, 3),
    }))
    .filter((c) => c.count >= 1) // route will filter to >=3 before sending to Groq
    .sort((a, b) => b.count - a.count);
}