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
    throw new Error(
      "Connecte-toi pour organiser une balade."
    );
  }

  return supabase
    .from("community_walks")
    .insert({
      ...input,
      organizer_id: user.id,
      status: "open",
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
    throw new Error(
      "Connecte-toi pour participer."
    );
  }

  return supabase
    .from("walk_participants")
    .insert({
      walk_id: walkId,
      user_id: user.id,
      dog_name: dogName,
    });
}

export function getWalkPublicUrl(
  walkId: string
) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.taui-te-ora.com";

  return `${baseUrl}/balades/${encodeURIComponent(
    walkId
  )}`;
}

export function getWalkFacebookShareUrl(
  walkId: string
) {
  const walkUrl =
    getWalkPublicUrl(
      walkId
    );

  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(
      walkUrl
    )
  );
}

export function getWalkWhatsappShareUrl(
  walkId: string,
  title?: string
) {
  const walkUrl =
    getWalkPublicUrl(
      walkId
    );

  const message =
    `${title || "Balade & Copains"} 🐾\n${walkUrl}`;

  return (
    "https://wa.me/?text=" +
    encodeURIComponent(
      message
    )
  );
}
