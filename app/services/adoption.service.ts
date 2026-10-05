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

type PushPayload = {
  recipientId: string;
  title: string;
  body: string;
  url: string;
  type: string;
  tag: string;
  animalId?: string;
  adoptionRequestId?: string;
};

async function sendPersonalPush(payload: PushPayload) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token || "";

    if (!accessToken) {
      return;
    }

    const response = await fetch("/api/push/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);

      console.error(
        "Erreur PUSH adoption :",
        details || response.statusText
      );
    }
  } catch (error) {
    console.error("Erreur PUSH adoption :", error);
  }
}

function getStatusLabel(statut: string) {
  const normalized = String(statut || "")
    .trim()
    .toLowerCase();

  const labels: Record<string, string> = {
    nouvelle: "Nouvelle",
    nouveau: "Nouveau",
    en_attente: "En attente",
    attente: "En attente",
    en_cours: "En cours",
    acceptee: "Acceptée",
    accepte: "Acceptée",
    validee: "Validée",
    valide: "Validée",
    refusee: "Refusée",
    refuse: "Refusée",
    rejetee: "Refusée",
    rejete: "Refusée",
    annulee: "Annulée",
    annule: "Annulée",
    adopte: "Adopté",
    adoptee: "Adoptée",
    terminee: "Terminée",
    termine: "Terminée",
  };

  return labels[normalized] || statut;
}

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

  const recipientId = String(
    data.createur_animal_user_id ||
      demande.createur_animal_user_id ||
      ""
  ).trim();

  if (
    recipientId &&
    recipientId !== demande.demandeur_user_id
  ) {
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        animal_id: data.animal_id || demande.animal_id,
        adoption_request_id: data.id,
        type: "adoption_request",
        title: "Nouvelle demande d’adoption",
        message:
          "Une nouvelle demande d’adoption vient d’être envoyée.",
        is_read: false,
      });

    if (notificationError) {
      console.error(
        "Erreur notification demande adoption :",
        notificationError
      );
    } else {
      await sendPersonalPush({
        recipientId,
        title: "Nouvelle demande d’adoption 🐾",
        body:
          "Une nouvelle demande d’adoption vient d’être envoyée.",
        url: "/association/demandes",
        type: "adoption_request",
        tag: `adoption-request-${data.id}`,
        animalId: data.animal_id || demande.animal_id,
        adoptionRequestId: data.id,
      });
    }
  }

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

  const recipientId = String(
    data.demandeur_user_id || ""
  ).trim();

  if (recipientId) {
    const statusLabel = getStatusLabel(statut);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        animal_id: data.animal_id || null,
        adoption_request_id: data.id,
        type: "adoption_status",
        title: "Mise à jour de votre demande d’adoption",
        message: `Statut de votre demande : ${statusLabel}.`,
        is_read: false,
      });

    if (notificationError) {
      console.error(
        "Erreur notification statut adoption :",
        notificationError
      );
    } else {
      await sendPersonalPush({
        recipientId,
        title: "Votre demande d’adoption évolue 🐾",
        body: `Nouveau statut : ${statusLabel}.`,
        url: "/mes-demandes",
        type: "adoption_status",
        tag: `adoption-status-${data.id}`,
        animalId: data.animal_id || undefined,
        adoptionRequestId: data.id,
      });
    }
  }

  return data;
}

export const adoptionService = {
  create,
  getMyRequests,
  getAssociationRequests,
  updateStatus,
};
