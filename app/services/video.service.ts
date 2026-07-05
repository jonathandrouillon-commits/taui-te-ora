import { supabase } from "../lib/supabase";

export const videoService = {
  async getByAnimal(animalId: string) {
    const { data, error } = await supabase
      .from("animal_videos")
      .select("*")
      .eq("animal_id", animalId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async upload(file: File, animalId: string) {
    const path = `${animalId}/videos/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("animals")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("animals").getPublicUrl(path);

    const { error: insertError } = await supabase.from("animal_videos").insert({
      animal_id: animalId,
      video_url: data.publicUrl,
      sort_order: 99,
    });

    if (insertError) throw insertError;
  },

  async delete(videoId: string) {
    const { error } = await supabase
      .from("animal_videos")
      .delete()
      .eq("id", videoId);

    if (error) throw error;
  },
};