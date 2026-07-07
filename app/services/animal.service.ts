import { supabase } from "../lib/supabase";

export type Animal = {
  id: string;
  created_at?: string;
  updated_at?: string;

  reference_number?: string | null;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  sex: string | null;
  breed: string | null;
  size_label: string | null;
  association_name?: string | null;
  street_duration?: string | null;
  capture_location?: string | null;
  island: string | null;
  description_character?: string | null;
  health_status?: string | null;
  special_needs?: string | null;
  is_published?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  map_address?: string | null;
  map_visibility?: string | null;
  city: string | null;
  weight_kg?: number | null;
  story?: string | null;
  vaccinated?: boolean | null;
  sterilized?: boolean | null;
  microchipped?: boolean | null;
  owner_id?: string | null;

  // Compatibilité avec les anciennes pages
  nom?: string | null;
  type?: string | null;
  sexe?: string | null;
  age?: string | null;
  race?: string | null;
  taille?: string | null;
  poids?: string | null;
  ile?: string | null;
  localisation?: string | null;
  lieu_capture?: string | null;
  temps_rue?: string | null;
  statut?: string | null;
  histoire?: string | null;
  caractere?: string | null;
  sante?: string | null;
  sterilise?: boolean | null;
  vaccine?: boolean | null;
  identifie?: boolean | null;
  photo_url?: string | null;
  association_id?: string | null;
  created_by?: string | null;
};

async function getAll() {
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Animal[];
}

async function getMyAnimals() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Animal[];
}

async function getById(id: string) {
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Animal;
}

async function getPublishedWithPhotos() {
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (*)
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any[];
}

async function getAllWithPhotos() {
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any[];
}

async function create(animal: Partial<Animal>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("animals")
    .insert({
      ...animal,
      owner_id: animal.owner_id || user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Animal;
}

async function update(id: string, animal: Partial<Animal>) {
  const { data, error } = await supabase
    .from("animals")
    .update({
      ...animal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Animal;
}

async function togglePublished(id: string, isPublished: boolean) {
  return update(id, {
    is_published: isPublished,
  });
}

async function remove(id: string) {
  const { error } = await supabase.from("animals").delete().eq("id", id);

  if (error) throw error;
  return true;
}

export const animalService = {
  getAll,
  getMyAnimals,
  getById,
  getPublishedWithPhotos,
  getAllWithPhotos,
  create,
  update,
  togglePublished,
  delete: remove,
};