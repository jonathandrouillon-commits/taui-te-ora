import { supabase } from "../lib/supabase";

export type Favorite = {
  id: string;
  animal_id: string;
  user_id?: string;
  created_at?: string;
};

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("Utilisateur non connecté.");

  return data.user.id;
}

async function isFavorite(animalId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("favoris")
    .select("id")
    .eq("animal_id", animalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

async function addFavorite(animalId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("favoris")
    .insert({
      animal_id: animalId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Favorite;
}

async function removeFavorite(animalId: string) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("favoris")
    .delete()
    .eq("animal_id", animalId)
    .eq("user_id", userId);

  if (error) throw error;

  return true;
}

async function toggle(animalId: string) {
  const alreadyFavorite = await isFavorite(animalId);

  if (alreadyFavorite) {
    await removeFavorite(animalId);
    return false;
  }

  await addFavorite(animalId);
  return true;
}

async function getMyFavorites() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("favoris")
    .select("*, animaux(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export const favoriteService = {
  isFavorite,
  addFavorite,
  removeFavorite,
  toggle,
  getMyFavorites,
};