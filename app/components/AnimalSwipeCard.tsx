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

  const mediaItems = useMemo(() => {
    if (!animal) return [];

    const photos =
      animal.animal_photos?.map((photo: any) => ({
        type: "photo",
        url: photo.photo_url,
        is_cover: photo.is_cover,
      })) || [];

    const sortedPhotos = [
      ...photos.filter((photo: any) => photo.is_cover),
      ...photos.filter((photo: any) => !photo.is_cover),
    ];

    if (sortedPhotos.length > 0) {
      return sortedPhotos;
    }

    if (animal.photo_url) {
      return [
        {
          type: "photo",
          url: animal.photo_url,
          is_cover: true,
        },
      ];
    }

    return [];
  }, [animal]);

  if (!animal) {
    return null;
  }

  const name = animal.animal_name || animal.nom || "Animal";
  const age = animal.age_label || animal.age || "Âge non renseigné";
  const sex = animal.sex || animal.sexe || "Sexe non renseigné";
  const city = animal.city || animal.localisation || "Localisation";
  const island = animal.island || animal.ile || "";

  const associationName =
    animal.owner_profile?.organization_name ||
    animal.association_name ||
    "Association";

  const currentMedia = mediaItems[mediaIndex];

  const isSterilized = animal.sterilized ?? animal.sterilise;

  function nextMedia() {
    if (mediaItems.length <= 1) return;

    setMediaIndex((previousIndex) => {
      return (previousIndex + 1) % mediaItems.length;
    });
  }

  function previousMedia() {
    if (mediaItems.length <= 1) return;

    setMediaIndex((previousIndex) => {
      if (previousIndex === 0) {
        return mediaItems.length - 1;
      }

      return previousIndex - 1;
    });
  }

  function handleStart(clientX: number) {
    setStartX(clientX);
    setActionLabel("");
  }

  function handleMove(clientX: number) {
    if (startX === null) return;

    const difference = clientX - startX;

    setTranslateX(difference);

    if (difference > 70) {
      setActionLabel("COUP DE CŒUR");
    } else if (difference < -70) {
      setActionLabel("PASSER");
    } else {
      setActionLabel("");
    }
  }

  async function handleEnd() {
    if (translateX > 120) {
      await handleFavorite();
    }

    if (translateX < -120) {
      handlePass();
    }

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
    if (!animal?.id) return;

    router.push(`/animal/${animal.id}`);
  }

  return (
    <div className="relative mx-auto h-[calc(100dvh-78px)] w-full max-w-[470px] md:h-[850px] md:overflow-hidden md:rounded-[44px] md:border-[7px] md:border-white/70 md:shadow-[0_30px_90px_rgba(60,45,35,0.35)]">
      <article
        onMouseDown={(event) => handleStart(event.clientX)}
        onMouseMove={(event) => handleMove(event.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (startX !== null) {
            handleEnd();
          }
        }}
        onTouchStart={(event) => handleStart(event.touches[0].clientX)}
        onTouchMove={(event) => handleMove(event.touches[0].clientX)}
        onTouchEnd={handleEnd}
        className="absolute inset-0 cursor-grab overflow-hidden bg-[#eadfd5] active:cursor-grabbing md:rounded-[37px]"
        style={{
          transform: `translateX(${translateX}px) rotate(${translateX / 25}deg)`,
          transition: startX === null ? "transform 0.25s ease" : "none",
        }}
      >
        {currentMedia?.url ? (
          <img
            src={currentMedia.url}
            alt={name}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#eadfd5]">
            <span className="text-8xl">🐾</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

        {mediaItems.length > 1 && (
          <div className="absolute left-4 right-4 top-3 z-40 flex gap-1">
            {mediaItems.map((_: any, index: number) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index === mediaIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {mediaItems.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Photo précédente"
              onClick={(event) => {
                event.stopPropagation();
                previousMedia();
              }}
              className="absolute bottom-32 left-0 top-12 z-20 w-[28%]"
            />

            <button
              type="button"
              aria-label="Photo suivante"
              onClick={(event) => {
                event.stopPropagation();
                nextMedia();
              }}
              className="absolute bottom-32 right-0 top-12 z-20 w-[28%]"
            />
          </>
        )}

        <div className="absolute left-0 right-0 top-5 z-40 flex items-start justify-between px-5">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 text-3xl text-white backdrop-blur-sm"
          >
            ☰
          </button>

          <div className="text-center text-white">
            <div className="text-2xl font-semibold tracking-wide drop-shadow">
              Taui Te Ora 🌺
            </div>

            <div className="mt-1 text-[10px] font-medium leading-tight drop-shadow">
              On ne sauvera pas le monde,
              <br />
              mais on sauvera le leur.
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 text-2xl text-white backdrop-blur-sm">
            ♡
          </div>
        </div>

        <div className="absolute left-4 top-[28%] z-40 flex flex-col gap-2">
          <InfoBox icon="🐾" value={age} />

          <InfoBox
            icon={String(sex).toLowerCase().includes("fem") ? "♀" : "♂"}
            value={sex}
          />

          <InfoBox icon="⌖" value={city} />

          {isSterilized && <InfoBox icon="♡" value="Stérilisé" />}
        </div>

        {actionLabel && (
          <div
            className={`absolute left-1/2 top-28 z-50 -translate-x-1/2 -rotate-6 rounded-xl border-4 px-5 py-2 text-xl font-black ${
              actionLabel === "COUP DE CŒUR"
                ? "border-[#7cc9b0] bg-white/90 text-[#58a98f]"
                : "border-[#c9b3d8] bg-white/90 text-[#9d82b2]"
            }`}
          >
            {actionLabel}
          </div>
        )}

        {/* Informations animal */}
        <div className="absolute bottom-[118px] left-5 right-5 z-40 text-white">
          <div className="flex items-center gap-3">
            <h2 className="text-5xl font-medium leading-none drop-shadow-lg">
              {name}
            </h2>

            {/* Bouton fiche à côté du prénom */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleInfo();
              }}
              aria-label="Voir la fiche"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-lg font-black text-[#555f59] shadow-lg backdrop-blur transition active:scale-95"
            >
              i
            </button>

            <span className="text-4xl text-[#f58c9b]">♡</span>
          </div>

          <p className="mt-3 text-sm font-semibold drop-shadow">
            {associationName}
          </p>

          <p className="mt-1 text-xs font-medium text-white/90">
            📍 {city}
            {island ? ` · ${island}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <CharacterBadge label="Joueur" />
            <CharacterBadge label="Sociable" />
            <CharacterBadge label="Affectueux" />
          </div>
        </div>

        {/* Actions directement sur la photo, sans fond blanc */}
        <div className="absolute bottom-3 left-0 right-0 z-50 px-4">
          <div className="flex items-end justify-around">
            <ActionButton
              icon="×"
              label="Passer"
              styleName="bg-[#d9c9e5] text-white"
              onClick={handlePass}
            />

            <ActionButton
              icon="🐾"
              label="Je veux adopter"
              styleName="bg-[#f2919d] text-white"
              large
              onClick={handleAdopt}
            />

            <ActionButton
              icon="♥"
              label="Coup de cœur"
              styleName="bg-[#76c7b3] text-white"
              onClick={handleFavorite}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

function InfoBox({
  icon,
  value,
}: {
  icon: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[58px] w-[60px] flex-col items-center justify-center rounded-xl bg-[#fffaf2]/90 px-1 py-2 text-center shadow-md backdrop-blur">
      <div className="text-xl text-[#e89aa3]">{icon}</div>

      <div className="mt-1 max-w-full truncate text-[9px] font-semibold text-[#4e514d]">
        {value}
      </div>
    </div>
  );
}

function CharacterBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#d4b9dd]/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow">
      {label}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  styleName,
  large = false,
  onClick,
}: {
  icon: string;
  label: string;
  styleName: string;
  large?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex w-[105px] flex-col items-center"
    >
      <div
        className={`flex items-center justify-center rounded-full border-2 border-white/80 shadow-xl transition active:scale-95 ${
          large ? "h-[68px] w-[68px] text-3xl" : "h-14 w-14 text-3xl"
        } ${styleName}`}
      >
        {icon}
      </div>

      <span className="mt-1.5 rounded-full bg-black/25 px-2 py-1 text-center text-[10px] font-semibold leading-tight text-white backdrop-blur-sm">
        {label}
      </span>
    </button>
  );
}