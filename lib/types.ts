// ==========================================
// Shared TypeScript types for the application
// ==========================================

export type UserRole = "citizen" | "officer" | "admin";

export type ComplaintStatus =
  | "submitted"
  | "in_review"
  | "assigned"
  | "resolved"
  | "rejected";

export type Priority = "low" | "medium" | "high";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  raw_text: string;
  category: string | null;
  department_id: string | null;
  status: ComplaintStatus;
  priority: Priority | null;
  location_text: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  // Duplicate / cluster detection columns
  cluster_id: string | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (optional, present when queries join)
  departments?: Department;
  profiles?: Profile;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  note: string;
  status_at_time: string;
  updated_by: string | null;
  created_at: string;
  // Joined fields
  profiles?: Profile;
}
