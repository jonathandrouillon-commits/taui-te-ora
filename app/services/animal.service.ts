import { supabase } from "../lib/supabase";

export type Animal = {
  id: string;
  created_at?: string;

  nom: string | null;
  type: string | null;
  sexe: string | null;
  age: string | null;
  race: string | null;
  taille: string | null;
  poids: string | null;

  ile: string | null;
  localisation: string | null;
  lieu_capture: string | null;
  temps_rue: string | null;

  statut: string | null;
  histoire: string | null;
  caractere: string | null;
  sante: string | null;

  sterilise: boolean | null;
  vaccine: boolean | null;
  identifie: boolean | null;

  compatible_chiens: boolean | null;
  compatible_chats: boolean | null;
  compatible_enfants: boolean | null;

  photo_url: string | null;
  association_id: string | null;

  weight_kg?: number | null;
  is_published?: boolean | null;
};

async function getAll() {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Animal[];
}

async function getById(id: string) {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Animal;
}

async function getPublishedWithPhotos() {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Animal[];
}

async function getAllWithPhotos() {
  const { data, error } = await supabase
    .from("animaux")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Animal[];
}

async function create(animal: Partial<Animal>) {
  const { data, error } = await supabase
    .from("animaux")
    .insert(animal)
    .select()
    .single();

  if (error) throw error;
  return data as Animal;
}

async function update(id: string, animal: Partial<Animal>) {
  const { data, error } = await supabase
    .from("animaux")
    .update(animal)
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
  const { error } = await supabase
    .from("animaux")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export const animalService = {
  getAll,
  getById,
  getPublishedWithPhotos,
  getAllWithPhotos,
  create,
  update,
  togglePublished,
  delete: remove,
};