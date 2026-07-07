import { supabase } from "../lib/supabase";

export type AnimalPhoto = {
  id: string;
  created_at?: string;
  animal_id: string;
  photo_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

async function getByAnimalId(animalId: string) {
  const { data, error } = await supabase
    .from("animal_photos")
    .select("*")
    .eq("animal_id", animalId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data as AnimalPhoto[];
}

async function create(photo: {
  animal_id: string;
  photo_url: string;
  sort_order?: number;
  is_cover?: boolean;
}) {
  const { data, error } = await supabase
    .from("animal_photos")
    .insert({
      animal_id: photo.animal_id,
      photo_url: photo.photo_url,
      sort_order: photo.sort_order || 0,
      is_cover: photo.is_cover || false,
    })
    .select()
    .single();

  if (error) throw error;

  return data as AnimalPhoto;
}

async function upload(file: File, animalId: string) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${animalId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("animal-photos")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("animal-photos")
    .getPublicUrl(fileName);

  const photos = await getByAnimalId(animalId);

  return create({
    animal_id: animalId,
    photo_url: data.publicUrl,
    sort_order: photos.length,
    is_cover: photos.length === 0,
  });
}

async function remove(id: string) {
  const { error } = await supabase
    .from("animal_photos")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

async function setCover(photoId: string, animalId: string) {
  const { error: resetError } = await supabase
    .from("animal_photos")
    .update({ is_cover: false })
    .eq("animal_id", animalId);

  if (resetError) throw resetError;

  const { data, error } = await supabase
    .from("animal_photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .select()
    .single();

  if (error) throw error;

  return data as AnimalPhoto;
}

export const photoService = {
  getByAnimalId,
  getByAnimal: getByAnimalId,
  create,
  upload,
  delete: remove,
  setCover,
};