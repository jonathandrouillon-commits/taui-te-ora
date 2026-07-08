import { supabase } from "../lib/supabase";

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function getMine() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select(`
      *,
      animals (
        *,
        animal_photos (*)
      )
    `)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function isFavorite(animalId: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("profile_id", user.id)
    .eq("animal_id", animalId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

async function add(animalId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("LOGIN_REQUIRED");
  }

  const alreadyFavorite = await isFavorite(animalId);
  if (alreadyFavorite) return true;

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      profile_id: user.id,
      animal_id: animalId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function remove(animalId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("LOGIN_REQUIRED");
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("profile_id", user.id)
    .eq("animal_id", animalId);

  if (error) throw error;
  return true;
}

async function toggle(animalId: string) {
  const exists = await isFavorite(animalId);

  if (exists) {
    await remove(animalId);
    return false;
  }

  await add(animalId);
  return true;
}

export const favoriteService = {
  getMine,
  isFavorite,
  add,
  remove,
  toggle,
};