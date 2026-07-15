import { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile;
}

/**
 * Create a new profile after signup
 */
export async function createProfile(
  supabase: SupabaseClient,
  profile: {
    id: string;
    full_name: string;
    role: string;
    department_id?: string | null;
  }
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      department_id: profile.department_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data as Profile;
}
