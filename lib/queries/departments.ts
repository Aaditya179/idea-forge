import { SupabaseClient } from "@supabase/supabase-js";
import type { Department } from "@/lib/types";

/**
 * Get all departments
 */
export async function getDepartments(supabase: SupabaseClient): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching departments:", error);
    return [];
  }

  return data as Department[];
}

/**
 * Get a department by name
 */
export async function getDepartmentByName(
  supabase: SupabaseClient,
  name: string
): Promise<Department | null> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("name", name)
    .single();

  if (error) {
    console.error("Error fetching department by name:", error);
    return null;
  }

  return data as Department;
}
