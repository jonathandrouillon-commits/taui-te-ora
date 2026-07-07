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

  const mainPhoto =
    animal.animal_photos?.find((photo: any) => photo.is_cover)?.photo_url ||
    animal.animal_photos?.[0]?.photo_url ||
    animal.photo_url ||
    "";

  const isSterilized = animal.sterilized ?? animal.sterilise;
  const isVaccinated = animal.vaccinated ?? animal.vaccine;
  const isMicrochipped = animal.microchipped ?? animal.identifie;

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
      if (animal?.id) await favoriteService.toggle(animal.id);
    } catch (error) {
      console.error(error);
    }

    onFavorite?.();
  }

  function handleAdopt() {
    if (animal?.id) router.push(`/adoption/start/${animal.id}`);
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
          {[0, 1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`h-1.5 flex-1 rounded-full ${
                dot === 0 ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E6DDCF] text-2xl font-black text-[#4B5A3D]">
            Photo
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

        <div className="absolute left-5 top-10 z-20 flex flex-wrap gap-2">
          <Badge>{animal.is_published ? "À adopter" : "Brouillon"}</Badge>
          <Badge light>{sex}</Badge>
        </div>

        <button
          type="button"
          onClick={handleInfo}
          className="absolute right-5 top-10 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-xl font-black text-[#4B5A3D] shadow-xl"
        >
          i
        </button>

        <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
          <h2 className="text-5xl font-black leading-none drop-shadow">
            {name}
            <span className="ml-2 text-3xl text-[#D8A33A]">🐾</span>
          </h2>

          <p className="mt-3 text-lg font-bold">
            {age} • {sex}
          </p>

          <p className="mt-2 text-sm font-black uppercase tracking-wide">
            📍 {city} · {island}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {isSterilized && <SmallBadge label="Stérilisé" />}
            {isVaccinated && <SmallBadge label="Vacciné" />}
            {isMicrochipped && <SmallBadge label="Identifié" />}
          </div>
        </div>
      </article>

      <div className="mt-7 flex items-start justify-between gap-3">
        <ActionButton label="PASSER" icon="✕" color="cream" onClick={handlePass} />
        <ActionButton label="LIKE" icon="❤️" color="orange" onClick={handleFavorite} />
        <ActionButton label="ADOPTER" icon="🐾" color="green" onClick={handleAdopt} />
        <ActionButton label="INFO" icon="i" color="gold" onClick={handleInfo} />
      </div>
    </div>
  );
}

function Badge({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-black uppercase shadow ${
        light ? "bg-white text-[#4B5A3D]" : "bg-[#6E7E5D] text-white"
      }`}
    >
      {children}
    </span>
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
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: string;
  color: "cream" | "orange" | "green" | "gold";
  onClick: () => void;
}) {
  const colors = {
    cream: "bg-[#F7F2E8] text-[#6E7E5D]",
    orange: "bg-[#D67B52] text-white",
    green: "bg-[#6E7E5D] text-white",
    gold: "bg-[#D8A33A] text-white",
  };

  return (
    <button type="button" onClick={onClick} className="flex flex-1 flex-col items-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black shadow-xl ${colors[color]}`}
      >
        {icon}
      </div>

      <span className="mt-2 text-[10px] font-black uppercase tracking-wide text-[#6E7E5D]">
        {label}
      </span>
    </button>
  );
}