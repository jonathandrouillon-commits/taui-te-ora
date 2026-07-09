"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { favoriteService } from "../../services/favorite.service";

interface AnimalActionsProps {
  animalId: string;
  animalName?: string;
  ownerProfileId?: string;
}

export default function AnimalActions({
  animalId,
  animalName = "cet animal",
  ownerProfileId,
}: AnimalActionsProps) {
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loadingAdopt, setLoadingAdopt] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFavorite() {
    try {
      setLoadingFavorite(true);
      setMessage("");

      await favoriteService.add(animalId);

      setMessage("❤️ Coup de cœur enregistré.");
    } catch (error) {
      console.error(error);
      setMessage("Impossible d'enregistrer le coup de cœur.");
    } finally {
      setLoadingFavorite(false);
    }
  }

  async function handleAdopt() {
    try {
      setLoadingAdopt(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/login?redirect=/animal/${animalId}`;
        return;
      }

      const { data: adoptantProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();

      const { data: adoptionRequest, error: requestError } = await supabase
        .from("adoption_requests")
        .insert({
          animal_id: animalId,
          adoptant_id: user.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (requestError) throw requestError;

      const notifications = [];

      if (ownerProfileId) {
        notifications.push({
          user_id: ownerProfileId,
          type: "adoption_request",
          title: "Nouvelle demande d'adoption",
          message: `${adoptantProfile?.full_name || "Un adoptant"} souhaite adopter ${animalName}.`,
          animal_id: animalId,
          adoption_request_id: adoptionRequest.id,
          is_read: false,
        });
      }

      if (adminProfile?.id) {
        notifications.push({
          user_id: adminProfile.id,
          type: "adoption_request",
          title: "Nouvelle demande d'adoption",
          message: `${adoptantProfile?.full_name || "Un adoptant"} souhaite adopter ${animalName}.`,
          animal_id: animalId,
          adoption_request_id: adoptionRequest.id,
          is_read: false,
        });
      }

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notificationError) throw notificationError;
      }

      setMessage("✅ Votre demande d'adoption a été envoyée à l'association.");
    } catch (error) {
      console.error(error);
      setMessage("Impossible d'envoyer la demande d'adoption.");
    } finally {
      setLoadingAdopt(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleFavorite}
          disabled={loadingFavorite}
          className="rounded-2xl bg-[#064b42] px-5 py-3 font-bold text-white shadow disabled:opacity-60"
        >
          {loadingFavorite ? "Enregistrement..." : "❤️ Coup de cœur"}
        </button>

        <button
          type="button"
          onClick={handleAdopt}
          disabled={loadingAdopt}
          className="rounded-2xl bg-[#b68b2f] px-5 py-3 font-black text-white shadow disabled:opacity-60"
        >
          {loadingAdopt ? "Envoi..." : "🐾 Je veux adopter"}
        </button>

        <button
          type="button"
          onClick={() => navigator.share?.({ url: window.location.href })}
          className="rounded-2xl bg-white px-5 py-3 font-bold text-[#064b42] shadow"
        >
          ℹ️ Partager
        </button>
      </div>

      {message && (
        <p className="mt-3 rounded-xl bg-[#f4eee3] px-4 py-3 text-sm font-bold text-[#064b42]">
          {message}
        </p>
      )}
    </div>
  );
}