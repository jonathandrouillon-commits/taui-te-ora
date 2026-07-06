import { supabase } from "../lib/supabase";

export const profileService = {
  async getCurrentProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) throw error;

    return data || [];
  },

  async approveProfile(id: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        is_verified: true,
        is_active: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async rejectProfile(id: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        is_verified: false,
        is_active: false,
      })
      .eq("id", id);

    if (error) throw error;
  },

  getDisplayName(profile: any) {
    return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  },
};