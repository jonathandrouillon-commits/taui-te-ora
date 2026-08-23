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
      <div className="mx-auto flex min-h-[620px] w-full max-w-[430px] items-center justify-center rounded-[38px] bg-[#fffaf5]/90 p-8 shadow-xl backdrop-blur">
        <p className="text-xl font-black text-[#50614f]">
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

  const currentMedia = mediaItems[mediaIndex];

  const isSterilized = animal.sterilized ?? animal.sterilise;
  const isVaccinated = animal.vaccinated ?? animal.vaccine;
  const isMicrochipped = animal.microchipped ?? animal.identifie;

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
    <div className="relative mx-auto w-full max-w-[430px]">
      {actionLabel && (
        <div
          className={`absolute left-1/2 top-24 z-[60] -translate-x-1/2 rotate-[-4deg] rounded-2xl border-4 px-5 py-3 text-xl font-black uppercase shadow-xl ${
            actionLabel === "COUP DE CŒUR"
              ? "border-[#ef8fa8] bg-[#fff5f8] text-[#d96887]"
              : "border-[#8bb7a5] bg-[#f3fff9] text-[#527a69]"
          }`}
        >
          {actionLabel}
        </div>
      )}

      <div className="rounded-[42px] border border-white/80 bg-[#fffaf5]/90 p-3 shadow-[0_25px_70px_rgba(88,66,50,0.22)] backdrop-blur-xl">
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
          className="relative h-[590px] cursor-grab overflow-hidden rounded-[34px] bg-[#eadfd5] shadow-lg active:cursor-grabbing sm:h-[620px]"
          style={{
            transform: `translateX(${translateX}px) rotate(${
              translateX / 20
            }deg)`,
            transition:
              startX === null ? "transform 0.25s ease" : "none",
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
              <div className="text-center">
                <div className="text-7xl">🐾</div>

                <p className="mt-3 font-bold text-[#5f695a]">
                  Photo à venir
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />

          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(event) => {
                  event.stopPropagation();
                  previousMedia();
                }}
                className="absolute bottom-0 left-0 top-0 z-20 w-[30%]"
              />

              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(event) => {
                  event.stopPropagation();
                  nextMedia();
                }}
                className="absolute bottom-0 right-0 top-0 z-20 w-[30%]"
              />
            </>
          )}

          {mediaItems.length > 1 && (
            <div className="absolute left-4 right-4 top-4 z-30 flex gap-1.5">
              {mediaItems.map((_: any, index: number) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full shadow ${
                    index === mediaIndex
                      ? "bg-white"
                      : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleInfo();
            }}
            className="absolute right-5 top-8 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/90 text-xl font-black text-[#657462] shadow-lg backdrop-blur"
          >
            i
          </button>

          <div className="absolute left-5 top-8 z-30">
            <span className="rounded-full bg-[#f4a3ad]/90 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg backdrop-blur">
              À adopter
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-30 p-6 pb-7">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-5xl font-black leading-none text-white drop-shadow-lg">
                  {name}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                  <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">
                    {sex}
                  </span>

                  <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">
                    {age}
                  </span>
                </div>
              </div>

              {associationLogo ? (
                <img
                  src={associationLogo}
                  alt={associationName}
                  className="h-16 w-16 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#8db5a2] text-3xl shadow-xl">
                  🐾
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1 text-sm font-semibold text-white/95">
              <p>
                📍 {city}
                {island ? ` · ${island}` : ""}
              </p>

              <p>Association : {associationName}</p>
            </div>

            {(isVaccinated || isMicrochipped || isSterilized) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {isVaccinated && <SmallBadge label="Vacciné" />}

                {isMicrochipped && <SmallBadge label="Identifié" />}

                {isSterilized && <SmallBadge label="Stérilisé" />}
              </div>
            )}
          </div>
        </article>

        <div className="px-3 pb-3 pt-5">
          <div className="flex items-start justify-center gap-5">
            <ActionButton
              label="Passer"
              icon="×"
              variant="pass"
              onClick={handlePass}
            />

            <ActionButton
              label="Coup de cœur"
              icon="♥"
              variant="favorite"
              onClick={handleFavorite}
            />

            <ActionButton
              label="Je veux adopter"
              icon="🐾"
              variant="adopt"
              onClick={handleAdopt}
            />
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-[#8a8178]">
            Glisse à gauche pour passer · à droite pour un coup de cœur
          </p>
        </div>
      </div>
    </div>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
      ✓ {label}
    </span>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string;
  icon: string;
  variant: "pass" | "favorite" | "adopt";
  onClick: () => void;
}) {
  const styles = {
    pass: {
      circle:
        "bg-[#f6d6d9] text-[#c76f78] border-[#fff4f5]",
      size: "h-16 w-16",
    },

    favorite: {
      circle:
        "bg-[#d8c7e8] text-[#875fa7] border-[#f6effc]",
      size: "h-[72px] w-[72px]",
    },

    adopt: {
      circle:
        "bg-[#cce4d7] text-[#4d7967] border-[#f0faf5]",
      size: "h-16 w-16",
    },
  };

  const style = styles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[105px] flex-col items-center"
    >
      <div
        className={`flex ${style.size} items-center justify-center rounded-full border-4 text-3xl font-black shadow-lg transition duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95 ${style.circle}`}
      >
        {icon}
      </div>

      <span className="mt-2 text-center text-[11px] font-black uppercase leading-4 text-[#657462]">
        {label}
      </span>
    </button>
  );
}