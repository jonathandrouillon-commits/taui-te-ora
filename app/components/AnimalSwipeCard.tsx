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
        sort_order: photo.sort_order ?? 0,
      })) || [];

    const sortedPhotos = [...photos].sort((a: any, b: any) => {
      if (a.is_cover) return -1;
      if (b.is_cover) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

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

  function previousPhoto() {
    if (mediaItems.length <= 1) return;
    setMediaIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  }

  function nextPhoto() {
    if (mediaItems.length <= 1) return;
    setMediaIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  }

  function handlePhotoClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mediaItems.length <= 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const middle = rect.width / 2;

    if (clickX < middle) previousPhoto();
    else nextPhoto();
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
        <div className="absolute left-5 right-5 top-5 z-30 flex gap-2">
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
          onClick={handlePhotoClick}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") previousPhoto();
            if (e.key === "ArrowRight" || e.key === "Enter") nextPhoto();
          }}
          className="absolute inset-0 z-0 cursor-pointer"
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

          {mediaItems.length > 1 && (
            <>
              <div className="absolute left-0 top-0 h-full w-1/2" />
              <div className="absolute right-0 top-0 h-full w-1/2" />

              <div className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-3xl font-black text-white backdrop-blur">
                ‹
              </div>

              <div className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-3xl font-black text-white backdrop-blur">
                ›
              </div>
            </>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        <div className="absolute left-5 top-10 z-20 flex flex-wrap gap-2">
          <Badge>{animal.is_published ? "À adopter" : "Brouillon"}</Badge>
          <Badge light>{sex}</Badge>
        </div>

        {mediaItems.length > 1 && (
          <div className="absolute right-5 top-10 z-20 rounded-full bg-black/40 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {mediaIndex + 1}/{mediaItems.length}
          </div>
        )}

        <div className="pointer-events-none absolute bottom-6 left-6 right-28 z-20 text-white">
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

        <div className="pointer-events-none absolute bottom-6 right-5 z-30 flex max-w-[96px] flex-col items-center">
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

      <div className="mt-7 flex items-start justify-between gap-3">
        <ActionButton label="PASSER" icon="✕" color="cream" onClick={handlePass} />
        <ActionButton label="LIKE" icon="♥" color="orange" onClick={handleFavorite} />
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
  const styles = {
    cream: {
      fill: "#F7F2E8",
      icon: "#6E7E5D",
    },
    orange: {
      fill: "#D67B52",
      icon: "#FFFFFF",
    },
    green: {
      fill: "#6E7E5D",
      icon: "#FFFFFF",
    },
    gold: {
      fill: "#D8A33A",
      icon: "#FFFFFF",
    },
  };

  const current = styles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 flex-col items-center"
    >
      <div className="relative h-[86px] w-[86px] transition-all duration-200 group-hover:-translate-y-1 group-active:scale-95">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.22)]"
        >
          <ellipse
            cx="28"
            cy="48"
            rx="14"
            ry="21"
            fill={current.fill}
            transform="rotate(-28 28 48)"
          />
          <ellipse
            cx="47"
            cy="25"
            rx="14"
            ry="22"
            fill={current.fill}
            transform="rotate(-8 47 25)"
          />
          <ellipse
            cx="73"
            cy="25"
            rx="14"
            ry="22"
            fill={current.fill}
            transform="rotate(8 73 25)"
          />
          <ellipse
            cx="92"
            cy="48"
            rx="14"
            ry="21"
            fill={current.fill}
            transform="rotate(28 92 48)"
          />

          <path
            d="M34 78
               C34 61 45 49 60 49
               C75 49 86 61 86 78
               C86 97 75 107 60 107
               C45 107 34 97 34 78Z"
            fill={current.fill}
          />
        </svg>

        <div
          className="absolute bottom-[18px] left-1/2 flex h-[34px] w-[44px] -translate-x-1/2 items-center justify-center text-[24px] font-black"
          style={{ color: current.icon }}
        >
          {icon}
        </div>
      </div>

      <span className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#6E7E5D]">
        {label}
      </span>
    </button>
  );
}