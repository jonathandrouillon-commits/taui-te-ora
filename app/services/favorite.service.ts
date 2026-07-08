import { supabase } from "../lib/supabase";

async function toggle(animalId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData.user;

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const { data: existingLike, error: selectError } = await supabase
    .from("animal_likes")
    .select("id")
    .eq("animal_id", animalId)
    .eq("adoptant_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("animal_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) throw deleteError;

    return {
      liked: false,
    };
  }

  const { data, error: insertError } = await supabase
    .from("animal_likes")
    .insert({
      animal_id: animalId,
      adoptant_id: user.id,
      profile_id: user.id,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return {
    liked: true,
    data,
  };
}

async function getMyLikes() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData.user;

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const { data, error } = await supabase
    .from("animal_likes")
    .select(`
      *,
      animals (
        *,
        animal_photos (
          id,
          photo_url,
          is_cover,
          sort_order
        )
      )
    `)
    .eq("adoptant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

async function isLiked(animalId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData.user;

  if (!user) return false;

  const { data, error } = await supabase
    .from("animal_likes")
    .select("id")
    .eq("animal_id", animalId)
    .eq("adoptant_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export const favoriteService = {
  toggle,
  getMyLikes,
  isLiked,
};