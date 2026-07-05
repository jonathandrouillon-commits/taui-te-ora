import { supabase } from "../lib/supabase";

export const favoriteService = {
  async isFavorite(animalId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return false;

    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .eq("animal_id", animalId)
      .maybeSingle();

    return !!data;
  },

  async toggle(animalId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      throw new Error("Tu dois être connecté pour ajouter un coup de cœur.");
    }

    const { data: existing } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);

      if (error) throw error;

      return false;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      animal_id: animalId,
    });

    if (error) throw error;

    return true;
  },
};