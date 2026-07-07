"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { favoriteService } from "../../services/favorite.service";

interface AnimalActionsProps {
  animalId: string;
}

export default function AnimalActions({ animalId }: AnimalActionsProps) {
  const router = useRouter();
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFavorite() {
    try {
      setLoadingFavorite(true);
      setMessage("");

      await favoriteService.add(animalId);

      setMessage("Coup de cœur enregistré.");
    } catch (error) {
      console.error(error);
      setMessage("Impossible d’enregistrer le coup de cœur.");
    } finally {
      setLoadingFavorite(false);
    }
  }

  function handleAdopt() {
    router.push(`/adoption/start/${animalId}`);
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
          className="rounded-2xl bg-[#b68b2f] px-5 py-3 font-black text-white shadow"
        >
          🐾 Je veux adopter
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