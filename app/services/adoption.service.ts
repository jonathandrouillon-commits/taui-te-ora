import { supabase } from "../lib/supabase";

export type DemandeAdoptionInput = {
  animal_id: string;
  adoptant_id?: string | null;
  demandeur_user_id: string;
  createur_animal_user_id?: string | null;
  statut?: string;
  motivation: string;
  delai_accueil: string;
  deja_rencontre: string;
  visite_domicile: string;
  commentaire: string;
};

async function create(demande: DemandeAdoptionInput) {
  const { data, error } = await supabase
    .from("demandes_adoption")
    .insert({
      ...demande,
      statut: demande.statut || "nouvelle",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function getMyRequests() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("demandes_adoption")
    .select("*")
    .eq("demandeur_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

async function getAssociationRequests() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from("demandes_adoption")
    .select("*")
    .eq("createur_animal_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

async function updateStatus(id: string, statut: string) {
  const { data, error } = await supabase
    .from("demandes_adoption")
    .update({ statut })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export const adoptionService = {
  create,
  getMyRequests,
  getAssociationRequests,
  updateStatus,
};