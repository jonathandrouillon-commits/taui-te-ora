import { supabase } from "../lib/supabase";

export const authService = {
  async signOut() {
    return supabase.auth.signOut();
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};