import { supabase } from "../lib/supabase";

export type NotificationInput = {
  user_id: string;
  type: string;
  titre: string;
  message: string;
  lien?: string | null;
};

async function create(notification: NotificationInput) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      ...notification,
      is_read: false,
      is_archived: false,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function getMyNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

async function markAsRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw error;
}

async function archive(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) throw error;
}

async function unreadCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .eq("is_archived", false);

  if (error) throw error;

  return count || 0;
}

export const notificationService = {
  create,
  getMyNotifications,
  markAsRead,
  archive,
  unreadCount,
};