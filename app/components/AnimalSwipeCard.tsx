"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { favoriteService } from "../services/favorite.service";

type AnimalSwipeCardProps = {
  animal: any;
  onPass?: () => void;
  onFavorite?: () => void;
};

export default function AnimalSwipeCard({
  animal,
  onPass,
  onFavorite,
}: AnimalSwipeCardProps) {
  const router = useRouter();

  const [startX, setStartX] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [actionLabel, setActionLabel] = useState("");

  function handleStart(clientX: number) {
    setStartX(clientX);
    setActionLabel("");
  }

  function handleMove(clientX: number) {
    if (startX === null) return;

    const diff = clientX - startX;
    setTranslateX(diff);

    if (diff > 80) {
      setActionLabel("❤️ Coup de cœur");
    } else if (diff < -80) {
      setActionLabel("Passer");
    } else {
      setActionLabel("");
    }
  }

  async function handleEnd() {
    if (translateX > 120) {
      await handleFavorite();
    } else if (translateX < -120) {
      handlePass();
    }

    setStartX(null);
    setTranslateX(0);
    setActionLabel("");
  }

  function handlePass() {
    if (onPass) onPass();
  }

  async function handleFavorite() {
    try {
      if (animal?.id) {
        await favoriteService.toggle(animal.id);
      }
    } catch (error) {
      console.error(error);
    }

    if (onFavorite) onFavorite();
  }

  function handleAdopt() {
    if (!animal?.id) return;
    router.push(`/adoption/start/${animal.id}`);
  }

  function handleInfo() {
    if (!animal?.id) return;
    router.push(`/animal/${animal.id}`);
  }

  if (!animal) {
    return (
      <div className="flex h-[620px] w-full max-w-md items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow">
        <p className="text-xl font-black text-[#064b42]">
          Aucun animal disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      {actionLabel && (
        <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-lg font-black text-[#064b42] shadow">
          {actionLabel}
        </div>
      )}

      <div
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (startX !== null) handleEnd();
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        className="relative h-[620px] cursor-grab overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-transform duration-200 active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px) rotate(${translateX / 18}deg)`,
        }}
      >
        <div className="relative h-[440px] bg-[#d9c7a3]">
          {animal.photo_url ? (
            <img
              src={animal.photo_url}
              alt={animal.nom || "Animal"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#064b42]">
              Photo
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#064b42] shadow">
            {animal.statut || "Disponible"}
          </div>
        </div>

        <div className="p-5 text-[#064b42]">
          <h2 className="text-3xl font-black">
            {animal.nom || "Animal sans nom"}
          </h2>

          <p className="mt-1 text-gray-600">
            {animal.sexe || "Sexe non renseigné"} ·{" "}
            {animal.age || "Âge non renseigné"}
          </p>

          <p className="mt-1 text-gray-600">
            {animal.ile || "Île non renseignée"} ·{" "}
            {animal.localisation || "Localisation non renseignée"}
          </p>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handlePass}
              className="rounded-2xl bg-white py-4 text-2xl font-black shadow"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={handleAdopt}
              className="rounded-2xl bg-[#b68b2f] py-4 text-2xl font-black text-white shadow"
            >
              🐾
            </button>

            <button
              type="button"
              onClick={handleFavorite}
              className="rounded-2xl bg-white py-4 text-2xl font-black shadow"
            >
              ❤️
            </button>

            <button
              type="button"
              onClick={handleInfo}
              className="rounded-2xl bg-white py-4 text-2xl font-black shadow"
            >
              ℹ️
            </button>
          </div>

          <p className="mt-4 text-center text-xs font-bold text-gray-500">
            Swipe gauche pour passer · Swipe droite pour coup de cœur
          </p>
        </div>
      </div>
    </div>
  );
}