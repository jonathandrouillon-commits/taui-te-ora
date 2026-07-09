"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const [mediaIndex, setMediaIndex] = useState(0);

  if (!animal) {
    return (
      <div className="flex h-[560px] w-full max-w-sm items-center justify-center rounded-[36px] bg-white p-8 text-center shadow-2xl">
        <p className="text-xl font-black text-[#4B5A3D]">
          Aucun animal disponible.
        </p>
      </div>
    );
  }

  const name = animal.animal_name || animal.nom || "Animal";
  const age = animal.age_label || animal.age || "Âge non renseigné";
  const sex = animal.sex || animal.sexe || "Sexe non renseigné";
  const city = animal.city || animal.localisation || "Localisation";
  const island = animal.island || animal.ile || "Île";

  const associationName =
    animal.owner_profile?.organization_name ||
    animal.association_name ||
    "Association";

  const associationLogo = animal.owner_profile?.avatar_url || "";

  const mediaItems = useMemo(() => {
    const photos =
      animal.animal_photos?.map((photo: any) => ({
        type: "photo",
        url: photo.photo_url,
        is_cover: photo.is_cover,
      })) || [];

    const sortedPhotos = [
      ...photos.filter((p: any) => p.is_cover),
      ...photos.filter((p: any) => !p.is_cover),
    ];

    if (sortedPhotos.length > 0) return sortedPhotos;

    if (animal.photo_url) {
      return [{ type: "photo", url: animal.photo_url, is_cover: true }];
    }

    return [];
  }, [animal]);

  const currentMedia = mediaItems[mediaIndex];

  const isSterilized = animal.sterilized ?? animal.sterilise;
  const isVaccinated = animal.vaccinated ?? animal.vaccine;
  const isMicrochipped = animal.microchipped ?? animal.identifie;

  function nextMedia() {
    if (mediaItems.length <= 1) return;
    setMediaIndex((prev) => (prev + 1) % mediaItems.length);
  }

  function handleStart(clientX: number) {
    setStartX(clientX);
    setActionLabel("");
  }

  function handleMove(clientX: number) {
    if (startX === null) return;

    const diff = clientX - startX;
    setTranslateX(diff);

    if (diff > 70) setActionLabel("❤️ COUP DE CŒUR");
    else if (diff < -70) setActionLabel("PASSER");
    else setActionLabel("");
  }

  async function handleEnd() {
    if (translateX > 120) await handleFavorite();
    if (translateX < -120) handlePass();

    setStartX(null);
    setTranslateX(0);
    setActionLabel("");
  }

  function handlePass() {
    onPass?.();
  }

  async function handleFavorite() {
    try {
      if (!animal?.id) return;

      await favoriteService.add(animal.id);
      onFavorite?.();
    } catch (error: any) {
      if (error?.message === "LOGIN_REQUIRED") {
        router.push(`/login?redirect=/animal/${animal.id}`);
        return;
      }

      alert("Impossible d'enregistrer le coup de cœur.");
    }
  }

  function handleAdopt() {
    if (!animal?.id) return;
    router.push(`/login?redirect=/animal/${animal.id}`);
  }

  function handleInfo() {
    if (animal?.id) router.push(`/animal/${animal.id}`);
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {actionLabel && (
        <div className="absolute left-1/2 top-10 z-40 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-lg font-black text-[#4B5A3D] shadow-2xl">
          {actionLabel}
        </div>
      )}

      <div className="absolute left-5 top-6 h-[520px] w-[92%] rotate-[-5deg] rounded-[36px] bg-[#D67B52] opacity-80 shadow-xl" />
      <div className="absolute left-2 top-3 h-[530px] w-[96%] rotate-[-2deg] rounded-[36px] bg-[#6E7E5D] opacity-90 shadow-xl" />

      <article
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (startX !== null) handleEnd();
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        className="relative z-10 h-[560px] cursor-grab overflow-hidden rounded-[36px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px) rotate(${translateX / 18}deg)`,
          transition: startX === null ? "transform 0.25s ease" : "none",
        }}
      >
        <div className="absolute left-5 right-5 top-5 z-20 flex gap-2">
          {Array.from({ length: Math.max(mediaItems.length, 1) }).map(
            (_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index === mediaIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            )
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={nextMedia}
          onKeyDown={(e) => {
            if (e.key === "Enter") nextMedia();
          }}
          className="absolute inset-0 z-0"
        >
          {currentMedia?.url ? (
            <img
              src={currentMedia.url}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#E6DDCF] text-2xl font-black text-[#4B5A3D]">
              Photo
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {mediaItems.length > 1 && (
          <div className="absolute right-5 top-24 z-20 rounded-full bg-black/40 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {mediaIndex + 1}/{mediaItems.length}
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-28 z-20 text-white">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-5xl font-black leading-none drop-shadow">
              {name}
            </h2>

            <button
              type="button"
              onClick={handleInfo}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl font-black text-[#064b42] shadow-xl"
            >
              i
            </button>
          </div>

          <p className="mt-3 text-lg font-bold">{age}</p>

          <p className="mt-2 text-sm font-black uppercase tracking-wide">
            📍 {city} · {island}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {isSterilized && <SmallBadge label="Stérilisé" />}
            {isVaccinated && <SmallBadge label="Vacciné" />}
            {isMicrochipped && <SmallBadge label="Identifié" />}
          </div>
        </div>

        <div className="absolute bottom-6 right-5 z-30 flex max-w-[96px] flex-col items-center">
          {associationLogo ? (
            <img
              src={associationLogo}
              alt={associationName}
              className="h-20 w-20 rounded-full border-4 border-white bg-white object-cover shadow-2xl"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#064b42] text-3xl shadow-2xl">
              🐾
            </div>
          )}

          <span className="mt-2 max-w-[96px] truncate rounded-full bg-black/45 px-3 py-1 text-center text-[10px] font-black uppercase text-white backdrop-blur">
            {associationName}
          </span>
        </div>
      </article>

      <div className="mt-8 flex justify-between gap-5">
        <ActionButton label="PASSER" color="cream" onClick={handlePass} />

        <ActionButton
          label="COUP DE CŒUR"
          color="orange"
          onClick={handleFavorite}
        />

        <ActionButton label="ADOPTER" color="green" onClick={handleAdopt} />
      </div>
    </div>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
      {label}
    </span>
  );
}

function ActionButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: "cream" | "orange" | "green";
  onClick: () => void;
}) {
  const colors = {
    cream: "bg-[#F6EEDC] text-[#6E7E5D]",
    orange: "bg-[#D67B52] text-white",
    green: "bg-[#87966F] text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 flex-col items-center"
    >
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition group-hover:scale-105 group-active:scale-95 ${colors[color]}`}
      >
        <span className="text-[46px] leading-none">🐾</span>
      </div>

      <span className="mt-3 text-center text-[11px] font-black uppercase leading-4 tracking-wide text-[#6E7E5D]">
        {label}
      </span>
    </button>
  );
}