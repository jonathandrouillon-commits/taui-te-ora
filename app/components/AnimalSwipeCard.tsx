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
      <div className="mx-auto flex min-h-[720px] w-full max-w-[430px] items-center justify-center rounded-[3rem] border-[10px] border-black bg-[#f8f4ec] p-8 shadow-2xl">
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
    if (animal.photo_url) return [{ type: "photo", url: animal.photo_url, is_cover: true }];
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
    <div className="relative mx-auto w-full max-w-[430px]">
      {actionLabel && (
        <div className="absolute left-1/2 top-28 z-50 -translate-x-1/2 rounded-full bg-white/95 px-6 py-3 text-lg font-black text-[#064b42] shadow-2xl backdrop-blur">
          {actionLabel}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[3.2rem] border-[10px] border-black bg-[#f8f4ec] px-5 pb-7 pt-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="absolute left-1/2 top-3 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />

        <div className="relative mt-8 flex items-center justify-between">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-lg">
            ☰
          </button>

          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="h-20 w-20 object-contain"
          />

          <button className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-lg">
            🔔
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#dc4f3f] text-xs font-black text-white">
              3
            </span>
          </button>
        </div>

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
          className="relative mt-4 h-[540px] cursor-grab overflow-hidden rounded-[2rem] bg-white shadow-2xl active:cursor-grabbing"
          style={{
            transform: `translateX(${translateX}px) rotate(${translateX / 18}deg)`,
            transition: startX === null ? "transform 0.25s ease" : "none",
          }}
        >
          <div className="absolute left-5 top-5 z-20 rounded-full bg-[#e55745] px-5 py-2 text-sm font-black uppercase text-white shadow-xl">
            ♥ Urgent
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={nextMedia}
            onKeyDown={(e) => {
              if (e.key === "Enter") nextMedia();
            }}
            className="absolute inset-0"
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

          <div className="absolute bottom-6 right-5 z-30 flex flex-col items-center">
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
          </div>

          <button
  type="button"
  onClick={handleInfo}
  className="absolute top-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-2xl font-black text-[#064b42] shadow-2xl backdrop-blur"
>
  i
</button>

          <div className="absolute bottom-3 left-3 right-3 z-20 text-white">
            <h2 className="text-5xl font-black leading-none drop-shadow">
              {name}
            </h2>

            <div className="mt-4 space-y-2 text-lg font-bold">
              <p>♀ {sex} · 🎂 {age}</p>
              <p>📍 {city}, {island}</p>
              <p>🏠 {associationName}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {isVaccinated && <SmallBadge label="Vacciné" />}
              {isMicrochipped && <SmallBadge label="Identifié" />}
              {isSterilized && <SmallBadge label="Stérilisé" />}
            </div>
          </div>
        </article>

        <div className="mt-5 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4B5A3D]" />
          <span className="h-2 w-2 rounded-full bg-[#4B5A3D]/30" />
          <span className="h-2 w-2 rounded-full bg-[#4B5A3D]/30" />
          <span className="h-2 w-2 rounded-full bg-[#4B5A3D]/30" />
        </div>

        <div className="mt-5 flex justify-between gap-4">
          <ActionButton label="NEXT TIME" icon="🐾" color="cream" onClick={handlePass} />
          <ActionButton label="LIKE" icon="♥" color="green" onClick={handleFavorite} />
          <ActionButton label="ADOPTER" icon="🐶" color="cream" onClick={handleAdopt} />
        </div>
      </div>
    </div>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#d8d09a]/90 px-3 py-2 text-xs font-black text-[#1f2b20] shadow backdrop-blur">
      ✓ {label}
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
  color: "cream" | "green";
  onClick: () => void;
}) {
  const colors = {
    cream: "bg-[#fff8e8] text-[#dc6f3d]",
    green: "bg-[#47743f] text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 flex-col items-center"
    >
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full shadow-xl ring-4 ring-white/60 transition group-hover:scale-105 group-active:scale-95 ${colors[color]}`}
      >
        <span className="text-4xl font-black leading-none">{icon}</span>
      </div>

      <span className="mt-3 text-center text-[11px] font-black uppercase leading-4 text-[#064b42]">
        {label}
      </span>
    </button>
  );
}