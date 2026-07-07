import { supabase } from "../lib/supabase";

async function getAssociationDashboardStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const [
    animalsResult,
    publishedAnimalsResult,
    requestsResult,
    notificationsResult,
    favoritesResult,
  ] = await Promise.all([
    supabase
      .from("animaux")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id),

    supabase
      .from("animaux")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .eq("is_published", true),

    supabase
      .from("demandes_adoption")
      .select("*", { count: "exact", head: true })
      .eq("createur_animal_user_id", user.id),

    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .eq("is_archived", false),

    supabase
      .from("favoris")
      .select("*", { count: "exact", head: true }),
  ]);

  if (animalsResult.error) throw animalsResult.error;
  if (publishedAnimalsResult.error) throw publishedAnimalsResult.error;
  if (requestsResult.error) throw requestsResult.error;
  if (notificationsResult.error) throw notificationsResult.error;
  if (favoritesResult.error) throw favoritesResult.error;

  return {
    animals: animalsResult.count || 0,
    publishedAnimals: publishedAnimalsResult.count || 0,
    requests: requestsResult.count || 0,
    unreadNotifications: notificationsResult.count || 0,
    favorites: favoritesResult.count || 0,
  };
}

async function getRecentAssociationRequests(limit = 5) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const { data, error } = await supabase
    .from("demandes_adoption")
    .select("*")
    .eq("createur_animal_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

async function getRecentNotifications(limit = 5) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

export const dashboardService = {
  getAssociationDashboardStats,
  getRecentAssociationRequests,
  getRecentNotifications,
};