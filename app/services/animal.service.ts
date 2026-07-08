import { supabase } from "../lib/supabase";

async function getPublishedAnimals() {
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

  const user = userData.user;

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const { data, error } = await supabase
    .from("animals")
    .insert({
      ...animal,
      owner_id: user.id,
      profile_id: user.id,
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
  getPublishedAnimals,
  getById,
  create,
  update,
  delete: remove,
};