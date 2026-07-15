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
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating complaint:", error);
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
    console.error("Error creating complaint update:", error);
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
