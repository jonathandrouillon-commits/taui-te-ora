import { supabase } from "../lib/supabase";

async function getAllWithPhotos() {
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (
        id,
        animal_id,
        photo_url,
        sort_order,
        is_cover
      ),
      owner_profile:profiles (
        id,
        organization_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getPublishedWithPhotos() {
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (
        id,
        animal_id,
        photo_url,
        sort_order,
        is_cover
      ),
      owner_profile:profiles (
        id,
        organization_name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getPublishedAnimals() {
  return getPublishedWithPhotos();
}

async function getById(id: string) {
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (
        id,
        animal_id,
        photo_url,
        sort_order,
        is_cover
      ),
      owner_profile:profiles (
        id,
        organization_name,
        avatar_url
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function create(animal: any) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("animals")
    .insert({
      ...animal,
      owner_id: userData.user.id,
      profile_id: userData.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(id: string, animal: any) {
  const { data, error } = await supabase
    .from("animals")
    .update(animal)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function remove(id: string) {
  const { error } = await supabase
    .from("animals")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export const animalService = {
  getAllWithPhotos,
  getPublishedWithPhotos,
  getPublishedAnimals,
  getById,
  create,
  update,
  delete: remove,
};