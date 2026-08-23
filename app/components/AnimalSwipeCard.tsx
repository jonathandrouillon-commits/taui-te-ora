"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [mediaIndex, setMediaIndex] = useState(0);

  if (!animal) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
        <p className="text-lg font-bold text-[#625f5a]">
          Aucun animal disponible.
        </p>
      </div>
    );
  }

  const name =
    animal.animal_name ||
    animal.nom ||
    "Animal";

  const age =
    animal.age_label ||
    animal.age ||
    "Âge non renseigné";

  const sex =
    animal.sex ||
    animal.sexe ||
    "";

  const city =
    animal.city ||
    animal.localisation ||
    "";

  const island =
    animal.island ||
    animal.ile ||
    "";

  const associationName =
    animal.owner_profile?.organization_name ||
    animal.association_name ||
    "Association";

  const mediaItems = useMemo(() => {
    const photos =
      animal.animal_photos?.map((photo: any) => ({
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
          url: animal.photo_url,
          is_cover: true,
        },
      ];
    }

    return [];
  }, [animal]);

  const currentMedia = mediaItems[mediaIndex];

  const isSterilized =
    animal.sterilized ??
    animal.sterilise;

  const isVaccinated =
    animal.vaccinated ??
    animal.vaccine;

  const isMicrochipped =
    animal.microchipped ??
    animal.identifie;

  function nextMedia() {
    if (mediaItems.length <= 1) return;

    setMediaIndex(
      (previousIndex) =>
        (previousIndex + 1) % mediaItems.length
    );
  }

  function handleStart(clientX: number) {
    setStartX(clientX);
  }

  function handleMove(clientX: number) {
    if (startX === null) return;

    const difference = clientX - startX;

    setTranslateX(difference);
  }

  async function handleEnd() {
    if (translateX > 120) {
      await handleFavorite();
    } else if (translateX < -120) {
      handlePass();
    }

    setStartX(null);
    setTranslateX(0);
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
      console.error(error);

      if (error?.message === "LOGIN_REQUIRED") {
        router.push(
          `/login?redirect=/animal/${animal.id}`
        );

        return;
      }

      alert(
        "Impossible d'enregistrer le coup de cœur."
      );
    }
  }

  function handleAdopt() {
    if (!animal?.id) return;

    router.push(
      `/adoption/start/${animal.id}`
    );
  }

  function handleInfo(
    event?: React.MouseEvent<HTMLButtonElement>
  ) {
    event?.stopPropagation();

    if (!animal?.id) return;

    router.push(
      `/animal/${animal.id}`
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[470px] flex-1 flex-col px-3 pb-2 pt-2">

      <article
        onMouseDown={(event) =>
          handleStart(event.clientX)
        }
        onMouseMove={(event) =>
          handleMove(event.clientX)
        }
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (startX !== null) {
            handleEnd();
          }
        }}
        onTouchStart={(event) =>
          handleStart(
            event.touches[0].clientX
          )
        }
        onTouchMove={(event) =>
          handleMove(
            event.touches[0].clientX
          )
        }
        onTouchEnd={handleEnd}
        className="relative min-h-0 flex-1 touch-pan-y overflow-hidden rounded-[28px] bg-[#ddd6cd] shadow-[0_12px_35px_rgba(0,0,0,0.16)]"
        style={{
          transform:
            `translateX(${translateX}px) rotate(${translateX / 25}deg)`,

          transition:
            startX === null
              ? "transform 0.22s ease"
              : "none",
        }}
      >

        <button
          type="button"
          onClick={nextMedia}
          className="absolute inset-0 h-full w-full"
          aria-label="Photo suivante"
        >
          {currentMedia?.url ? (
            <img
              src={currentMedia.url}
              alt={name}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ded8d0] text-lg font-bold text-[#777]">
              Photo
            </div>
          )}
        </button>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />

        {mediaItems.length > 0 && (
          <div className="absolute left-4 top-4 z-20 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            {mediaIndex + 1} / {mediaItems.length}
          </div>
        )}

        <div className="absolute left-3 top-[25%] z-20 flex flex-col gap-2">

          <InfoBox
            icon="🐾"
            text={String(age)}
          />

          {sex && (
            <InfoBox
              icon={
                String(sex)
                  .toLowerCase()
                  .includes("fem")
                  ? "♀"
                  : "♂"
              }
              text={String(sex)}
            />
          )}

          {isSterilized && (
            <InfoBox
              icon="♡"
              text="Stérilisé"
            />
          )}

        </div>

        <div className="absolute bottom-5 left-5 right-5 z-20 text-white">

          <div className="flex items-end justify-between gap-3">

            <div className="min-w-0 flex-1">

              <h2 className="truncate text-[clamp(38px,11vw,54px)] font-semibold leading-[0.95] tracking-tight drop-shadow-md">
                {name}
              </h2>

              <p className="mt-3 truncate text-[15px] font-semibold drop-shadow">
                {associationName}
              </p>

              {(city || island) && (
                <p className="mt-1 truncate text-[14px] font-medium drop-shadow">
                  📍{" "}
                  {[city, island]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">

                {isVaccinated && (
                  <SmallBadge>
                    Vacciné
                  </SmallBadge>
                )}

                {isMicrochipped && (
                  <SmallBadge>
                    Identifié
                  </SmallBadge>
                )}

              </div>
            </div>

            <button
              type="button"
              onClick={handleInfo}
              aria-label="Voir la fiche"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f8f5ef] text-2xl font-bold text-[#67645f] shadow-lg"
            >
              i
            </button>

          </div>
        </div>
      </article>

      <div className="grid shrink-0 grid-cols-3 items-start gap-2 pb-1 pt-3">

        <ActionButton
          icon="×"
          label="Passer"
          buttonClass="bg-[#d9c9e7]"
          onClick={handlePass}
        />

        <ActionButton
          icon="🐾"
          label="Je veux adopter"
          buttonClass="bg-[#ed8298]"
          large
          onClick={handleAdopt}
        />

        <ActionButton
          icon="♡"
          label="Coup de cœur"
          buttonClass="bg-[#72cdbd]"
          onClick={handleFavorite}
        />

      </div>
    </div>
  );
}

function InfoBox({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex h-[64px] w-[60px] flex-col items-center justify-center rounded-[17px] bg-[#fffaf4]/95 px-1 text-center shadow-md backdrop-blur-md">
      <span className="text-[19px] leading-none text-[#dc8fa5]">
        {icon}
      </span>

      <span className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-tight text-[#55514e]">
        {text}
      </span>
    </div>
  );
}

function SmallBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#d8b4df]/90 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
      {children}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  buttonClass,
  onClick,
  large = false,
}: {
  icon: string;
  label: string;
  buttonClass: string;
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center"
    >
      <div
        className={`
          flex items-center justify-center
          rounded-full
          border-2 border-white
          text-white
          shadow-[0_5px_14px_rgba(0,0,0,.18)]
          ${buttonClass}
          ${
            large
              ? "h-[72px] w-[72px] text-[25px]"
              : "h-[62px] w-[62px] text-[34px]"
          }
        `}
      >
        {icon}
      </div>

      <span
        className={`
          mt-1.5
          text-center
          font-semibold
          leading-tight
          text-[#292725]
          ${
            large
              ? "text-[11px]"
              : "text-[10px]"
          }
        `}
      >
        {label}
      </span>
    </button>
  );
}