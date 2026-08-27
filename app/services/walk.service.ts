import { supabase } from "../lib/supabase";

export type Walk = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  duration_minutes: number;
  max_dogs: number;
  pace: "calme" | "moderee" | "sportive";
  audience: string;
  status: "open" | "cancelled" | "completed";
};

export async function listWalks() {
  return supabase
    .from("community_walks")
    .select("*")
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
}

export async function createWalk(
  input: Omit<Walk, "id" | "organizer_id" | "status">
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Connecte-toi pour organiser une balade.");
  }

  return supabase
    .from("community_walks")
    .insert({
      ...input,
      organizer_id: user.id,
    })
    .select()
    .single();
}

export async function requestToJoin(
  walkId: string,
  dogName: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Connecte-toi pour participer.");
  }

  return supabase.from("walk_participants").insert({
    walk_id: walkId,
    user_id: user.id,
    dog_name: dogName,
  });
}