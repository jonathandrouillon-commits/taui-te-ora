import { supabase } from "../lib/supabase";

export type Notification = {
  id: string;
  created_at: string;

  recipient_id: string;

  title: string;
  message: string;
  type: string;

  animal_id?: string | null;
  adoption_request_id?: string | null;
  conversation_id?: string | null;
  signalement_id?: string | null;

  is_read: boolean;
  read_at?: string | null;
};

type CreateNotificationInput = {
  recipient_id: string;
  type: string;
  title: string;
  message: string;

  animal_id?: string | null;
  adoption_request_id?: string | null;
  conversation_id?: string | null;
  signalement_id?: string | null;
};

export const notificationService = {
  async getMyNotifications(
    recipientId: string
  ): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", recipientId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data || []) as Notification[];
  },

  async markAsRead(
    notificationId: string
  ) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) {
      throw error;
    }
  },

  async markAllAsRead(
    recipientId: string
  ) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      throw error;
    }
  },

  async create({
    recipient_id,
    type,
    title,
    message,
    animal_id,
    adoption_request_id,
    conversation_id,
    signalement_id,
  }: CreateNotificationInput) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id,

        type,
        title,
        message,

        animal_id:
          animal_id ?? null,

        adoption_request_id:
          adoption_request_id ?? null,

        conversation_id:
          conversation_id ?? null,

        signalement_id:
          signalement_id ?? null,

        is_read: false,
        read_at: null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Notification;
  },
};