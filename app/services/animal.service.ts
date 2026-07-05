import { supabase } from "../lib/supabase";

async function attachCoverPhotos(animals: any[]) {
  if (!animals || animals.length === 0) return [];

  const { data: photos, error } = await supabase
    .from("animal_photos")
    .select("*");

  if (error) throw error;

  return animals.map((animal) => {
    const cover =
      photos?.find(
        (photo) =>
          photo.animal_id === animal.id &&
          photo.is_cover === true
      ) ||
      photos?.find(
        (photo) =>
          photo.animal_id === animal.id
      );

    return {
      ...animal,
      photo_url: cover?.photo_url || "",
    };
  });
}

export const animalService = {
  async getAllWithPhotos() {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return await attachCoverPhotos(data || []);
  },

  async getPublishedWithPhotos() {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("is_published", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return await attachCoverPhotos(data || []);
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  },

  async create(animal: any) {
    const { data, error } = await supabase
      .from("animals")
      .insert(animal)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async update(id: string, animal: any) {
    const { data, error } = await supabase
      .from("animals")
      .update(animal)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async togglePublished(id: string, value: boolean) {
    const { error } = await supabase
      .from("animals")
      .update({
        is_published: value,
      })
      .eq("id", id);

    if (error) throw error;
  },

  async delete(id: string) {
    await supabase
      .from("animal_photos")
      .delete()
      .eq("animal_id", id);

    await supabase
      .from("animal_videos")
      .delete()
      .eq("animal_id", id);

    const { error } = await supabase
      .from("animals")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};