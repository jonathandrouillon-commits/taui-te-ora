"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import { favoriteService } from "../../services/favorite.service";

interface AnimalActionsProps {
  animalId: string;
  animalName?: string;
  ownerProfileId?: string;
  isAdopted?: boolean;
  onAdopted?: () => void;
}

export default function AnimalActions({
  animalId,
  animalName,
  ownerProfileId,
  isAdopted = false,
  onAdopted,
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
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(
          "Erreur vérification utilisateur :",
          error
        );
      }

      if (!user) {
        const destination =
          `/animal/${animalId}`;

        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              destination
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
    if (!animalId || isAdopted) {
      return;
    }

    try {
      setLoadingAdopt(true);
      setMessage("");

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(
          "Erreur vérification utilisateur :",
          error
        );
      }

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
    } finally {
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
            animalName ||
            "Taui Te Ora",
          text: animalName
            ? `Découvrez ${animalName} sur Taui Te Ora`
            : "Découvrez cet animal sur Taui Te Ora",
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );

      setMessage(
        "🔗 Lien copié."
      );
    } catch (error) {
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

  /*
   * Cette fonction reste disponible si,
   * depuis ce composant, on doit un jour
   * confirmer directement le passage
   * d'un animal au statut adopté.
   *
   * Pour le moment le parcours principal
   * d'adoption passe par /adoption/start/[id].
   */
  function notifyAdopted() {
    onAdopted?.();
  }

  void ownerProfileId;
  void notifyAdopted;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleFavorite}
          disabled={loadingFavorite}
          className="rounded-2xl bg-[#064b42] px-5 py-3 font-bold text-white shadow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingFavorite
            ? "Enregistrement..."
            : "❤️ Coup de cœur"}
        </button>

        <button
          type="button"
          onClick={handleAdopt}
          disabled={
            loadingAdopt ||
            isAdopted
          }
          className="rounded-2xl bg-[#b68b2f] px-5 py-3 font-black text-white shadow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAdopted
            ? "❤️ Déjà adopté"
            : loadingAdopt
              ? "Ouverture..."
              : "🐾 Je veux adopter"}
        </button>

        <button
          type="button"
          onClick={() =>
            void handleShare()
          }
          className="rounded-2xl bg-white px-5 py-3 font-bold text-[#064b42] shadow transition active:scale-[0.98]"
        >
          🔗 Partager
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