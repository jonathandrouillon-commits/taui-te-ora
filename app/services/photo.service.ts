import { supabase } from "../lib/supabase";

function cleanFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export const photoService = {
  async getByAnimal(animalId: string) {
    const { data, error } = await supabase
      .from("animal_photos")
      .select("*")
      .eq("animal_id", animalId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async upload(file: File, animalId: string) {
    const safeName = cleanFileName(file.name);

    const path = `${animalId}/photos/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("animals")
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("animals")
      .getPublicUrl(path);

    const { data: existingPhotos } = await supabase
      .from("animal_photos")
      .select("*")
      .eq("animal_id", animalId);

    const isFirstPhoto =
      !existingPhotos || existingPhotos.length === 0;

    const { error: insertError } = await supabase
      .from("animal_photos")
      .insert({
        animal_id: animalId,
        photo_url: data.publicUrl,
        is_cover: isFirstPhoto,
        sort_order: existingPhotos?.length || 0,
      });

    if (insertError) throw insertError;

    return data.publicUrl;
  },

  async setCover(photoId: string, animalId: string) {
    await supabase
      .from("animal_photos")
      .update({
        is_cover: false,
      })
      .eq("animal_id", animalId);

    const { error } = await supabase
      .from("animal_photos")
      .update({
        is_cover: true,
      })
      .eq("id", photoId);

    if (error) throw error;
  },

  async delete(photoId: string) {
    const { error } = await supabase
      .from("animal_photos")
      .delete()
      .eq("id", photoId);

    if (error) throw error;
  },
};