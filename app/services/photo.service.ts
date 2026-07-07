import { supabase } from "../lib/supabase";

export type AnimalPhoto = {
  id: string;
  created_at?: string;
  animal_id: string;
  photo_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

function cleanFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

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
      sort_order: photo.sort_order ?? 0,
      is_cover: photo.is_cover ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AnimalPhoto;
}

async function upload(file: File, animalId: string, index?: number) {
  const safeName = cleanFileName(file.name);
  const path = `${animalId}/photos/${Date.now()}-${index ?? 0}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("animals")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("animals").getPublicUrl(path);

  const existingPhotos = await getByAnimalId(animalId);
  const order = index ?? existingPhotos.length;

  return create({
    animal_id: animalId,
    photo_url: data.publicUrl,
    sort_order: order,
    is_cover: existingPhotos.length === 0 && order === 0,
  });
}

async function uploadMany(files: File[], animalId: string) {
  const uploaded: AnimalPhoto[] = [];

  for (let i = 0; i < files.length; i++) {
    const photo = await upload(files[i], animalId, i);
    uploaded.push(photo);
  }

  return uploaded;
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

async function reorder(animalId: string, photos: AnimalPhoto[]) {
  for (let i = 0; i < photos.length; i++) {
    const { error } = await supabase
      .from("animal_photos")
      .update({
        sort_order: i,
        is_cover: i === 0,
      })
      .eq("id", photos[i].id)
      .eq("animal_id", animalId);

    if (error) throw error;
  }

  return true;
}

export const photoService = {
  getByAnimalId,
  getByAnimal: getByAnimalId,
  create,
  upload,
  uploadMany,
  delete: remove,
  setCover,
  reorder,
};