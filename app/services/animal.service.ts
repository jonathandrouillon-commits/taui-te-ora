import { supabase } from "../lib/supabase";

export const animalService = {
  async getAll() {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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

  async togglePublished(id: string, isPublished: boolean) {
    const { data, error } = await supabase
      .from("animals")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    await supabase.from("animal_photos").delete().eq("animal_id", id);
    await supabase.from("animal_videos").delete().eq("animal_id", id);

    const { error } = await supabase.from("animals").delete().eq("id", id);

    if (error) throw error;
  },
};