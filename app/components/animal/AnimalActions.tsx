"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import { favoriteService } from "../../services/favorite.service";

interface AnimalActionsProps {
  animalId: string;
  animalName?: string;
  ownerProfileId?: string;
}

export default function AnimalActions({
  animalId,
}: AnimalActionsProps) {
  const router = useRouter();

  const [
    loadingFavorite,
    setLoadingFavorite,
  ] = useState(false);

  const [
    loadingAdopt,
    setLoadingAdopt,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  async function handleFavorite() {
    try {
      setLoadingFavorite(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              `/animal/${animalId}`
            )
        );
        return;
      }

      await favoriteService.add(
        animalId
      );

      setMessage(
        "❤️ Coup de cœur enregistré."
      );
    } catch (error) {
      console.error(
        "Erreur coup de cœur :",
        error
      );

      setMessage(
        "Impossible d'enregistrer le coup de cœur."
      );
    } finally {
      setLoadingFavorite(false);
    }
  }

  async function handleAdopt() {
    if (!animalId) {
      return;
    }

    try {
      setLoadingAdopt(true);
      setMessage("");

      const {
        data: { user },
        error,
      } =
        await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      /*
       * Si l'utilisateur n'est pas connecté,
       * on l'envoie vers la connexion.
       *
       * Après connexion il reviendra
       * directement sur la fiche animal
       * en mode adoption.
       */
      if (!user) {
        const destination =
          `/animal/${animalId}?adoption=1`;

        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              destination
            )
        );

        return;
      }

      /*
       * IMPORTANT :
       *
       * On ne crée PAS encore la demande.
       *
       * On ouvre la fiche en mode adoption
       * afin d'afficher :
       *
       * - les détails de l'animal
       * - le questionnaire / profil adoptant
       * - le calcul de compatibilité
       * - le bouton de confirmation
       *
       * La vraie création de demande
       * sera faite ensuite par :
       *
       * /adoption/start/[animalId]?confirm=1
       */
      router.push(
        `/animal/${animalId}?adoption=1`
      );
    } catch (error) {
      console.error(
        "Erreur ouverture adoption :",
        error
      );

      setMessage(
        "Impossible d'ouvrir le parcours d'adoption."
      );

      setLoadingAdopt(false);
    }
  }

  async function handleShare() {
    try {
      const shareUrl =
        window.location.href;

      if (
        typeof navigator.share ===
        "function"
      ) {
        await navigator.share({
          title:
            "Taui Te Ora",
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard
        .writeText(
          shareUrl
        );

      setMessage(
        "🔗 Lien copié."
      );
    } catch (error) {
      /*
       * Une fermeture volontaire
       * de la fenêtre de partage
       * ne doit pas afficher une erreur.
       */
      if (
        error instanceof Error &&
        error.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        "Erreur partage :",
        error
      );

      setMessage(
        "Impossible de partager cette fiche."
      );
    }
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* =========================
            COUP DE COEUR
        ========================== */}

        <button
          type="button"
          onClick={
            handleFavorite
          }
          disabled={
            loadingFavorite
          }
          className="rounded-2xl bg-[#064b42] px-5 py-3 font-bold text-white shadow transition active:scale-[0.98] disabled:opacity-60"
        >
          {loadingFavorite
            ? "Enregistrement..."
            : "❤️ Coup de cœur"}
        </button>

        {/* =========================
            JE VEUX ADOPTER
        ========================== */}

        <button
          type="button"
          onClick={
            handleAdopt
          }
          disabled={
            loadingAdopt
          }
          className="rounded-2xl bg-[#b68b2f] px-5 py-3 font-black text-white shadow transition active:scale-[0.98] disabled:opacity-60"
        >
          {loadingAdopt
            ? "Ouverture..."
            : "🐾 Je veux adopter"}
        </button>

        {/* =========================
            PARTAGER
        ========================== */}

        <button
          type="button"
          onClick={() =>
            void handleShare()
          }
          className="rounded-2xl bg-white px-5 py-3 font-bold text-[#064b42] shadow transition active:scale-[0.98]"
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