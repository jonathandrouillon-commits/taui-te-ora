import { supabase } from "../lib/supabase";

export type Notification = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  animal_id?: string | null;
  adoption_request_id?: string | null;
  lien?: string | null;
  is_read: boolean;
};

export const notificationService = {
  async getMyNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  },

  async create({
    user_id,
    type,
    titre,
    message,
    animal_id,
    adoption_request_id,
    lien,
  }: {
    user_id: string;
    type: string;
    titre: string;
    message: string;
    animal_id?: string;
    adoption_request_id?: string;
    lien?: string;
  }) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type,
        title: titre,
        message,
        animal_id: animal_id ?? null,
        adoption_request_id: adoption_request_id ?? null,
        lien: lien ?? null,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};