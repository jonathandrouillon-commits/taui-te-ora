import { supabase } from "../lib/supabase";

export const animalService = {
  async getAll() {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
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

  async delete(id: string) {
    const { error } = await supabase
      .from("animals")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};