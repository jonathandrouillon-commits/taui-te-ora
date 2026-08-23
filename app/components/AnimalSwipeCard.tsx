"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { favoriteService } from "../services/favorite.service";

type AnimalSwipeCardProps = {
  animal: any;
  onPass?: () => void;
  onFavorite?: () => void;
  onMenu?: () => void;
};

export default function AnimalSwipeCard({
  animal,
  onPass,
  onFavorite,
  onMenu,
}: AnimalSwipeCardProps) {
  const router = useRouter();

  const [startX, setStartX] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);

  if (!animal) {
    return null;
  }

  const name =
    animal.animal_name ||
    animal.nom ||
    "Animal";

  const age =
    animal.age_label ||
    animal.age ||
    "Âge inconnu";

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

  const isSterilized =
    animal.sterilized ??
    animal.sterilise;

  const isVaccinated =
    animal.vaccinated ??
    animal.vaccine;

  const isMicrochipped =
    animal.microchipped ??
    animal.identifie;

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

    setTranslateX(clientX - startX);
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

  function handleInfo() {
    if (!animal?.id) return;

    router.push(`/animal/${animal.id}`);
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[470px] flex-1 flex-col px-2 pb-2 pt-2">

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
          handleStart(event.touches[0].clientX)
        }
        onTouchMove={(event) =>
          handleMove(event.touches[0].clientX)
        }
        onTouchEnd={handleEnd}
        className="
          relative
          min-h-0
          flex-1
          touch-pan-y
          overflow-hidden
          rounded-[30px]
          bg-[#ddd6cd]
          shadow-[0_12px_35px_rgba(0,0,0,.17)]
        "
        style={{
          transform:
            `translateX(${translateX}px) rotate(${translateX / 25}deg)`,

          transition:
            startX === null
              ? "transform .22s ease"
              : "none",
        }}
      >

        {/* PHOTO */}
        <button
          type="button"
          onClick={nextMedia}
          aria-label="Photo suivante"
          className="absolute inset-0 h-full w-full"
        >
          {currentMedia?.url ? (
            <img
              src={currentMedia.url}
              alt={name}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ded8d0]">
              Photo
            </div>
          )}
        </button>

        {/* DEGRADE */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10" />

        {/* MENU HAUT GAUCHE */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMenu?.();
          }}
          className="
            absolute left-4 top-4 z-40
            flex h-12 w-12
            items-center justify-center
            rounded-full
            bg-black/20
            text-white
            backdrop-blur-md
          "
        >
          <span className="text-3xl leading-none">
            ≡
          </span>
        </button>

        {/* FAVORI HAUT DROITE */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleFavorite();
          }}
          className="
            absolute right-4 top-4 z-40
            flex h-12 w-12
            items-center justify-center
            rounded-full
            bg-black/20
            text-white
            backdrop-blur-md
          "
        >
          <span className="text-[34px] font-light leading-none">
            ♡
          </span>
        </button>

        {/* LOGO TAUI TE ORA PNG TRANSPARENT */}
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-3
            z-30
            -translate-x-1/2
          "
        >
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              h-auto
              w-[105px]
              object-contain
              drop-shadow-[0_3px_5px_rgba(0,0,0,0.22)]
              min-[390px]:w-[115px]
            "
          />
        </div>

        {/* INFOS GAUCHE */}
        <div className="absolute left-3 top-[27%] z-30 flex flex-col gap-2">

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
              icon="✣"
              text="Stérilisé"
            />
          )}

        </div>

        {/* INFOS BAS */}
        <div className="absolute bottom-5 left-5 right-5 z-30 text-white">

          <div className="flex items-end gap-3">

            <div className="min-w-0 flex-1">

              <h1
                className="
                  truncate
                  text-[clamp(42px,12vw,58px)]
                  font-medium
                  leading-none
                  tracking-tight
                  drop-shadow
                "
              >
                {name}
              </h1>

              <p className="mt-3 truncate text-[15px] font-semibold">
                {associationName}
              </p>

              {(city || island) && (
                <p className="mt-1 truncate text-[14px]">
                  📍{" "}
                  {[city, island]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleInfo();
              }}
              className="
                flex h-[52px] w-[52px]
                shrink-0
                items-center justify-center
                rounded-full
                bg-[#fffaf4]
                text-[26px]
                font-bold
                text-[#706d66]
                shadow-lg
              "
            >
              i
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleFavorite();
              }}
              className="
                flex h-[52px] w-[52px]
                shrink-0
                items-center justify-center
                text-[44px]
                font-light
                leading-none
                text-[#f17f98]
              "
            >
              ♡
            </button>

          </div>

          <div className="mt-3 flex flex-wrap gap-2">

            {animal.character_1 && (
              <Tag>{animal.character_1}</Tag>
            )}

            {animal.character_2 && (
              <Tag>{animal.character_2}</Tag>
            )}

            {animal.character_3 && (
              <Tag>{animal.character_3}</Tag>
            )}

            {!animal.character_1 && (
              <>
                {isVaccinated && (
                  <Tag>Vacciné</Tag>
                )}

                {isMicrochipped && (
                  <Tag>Identifié</Tag>
                )}
              </>
            )}

          </div>
        </div>
      </article>

      {/* ACTIONS */}
      <div className="grid shrink-0 grid-cols-3 gap-2 pb-1 pt-3">

        <ActionButton
          icon="×"
          label="Passer"
          color="bg-[#cfc0e1]"
          onClick={handlePass}
        />

        <ActionButton
          icon="🐾"
          label="Je veux adopter"
          color="bg-[#ef8196]"
          large
          onClick={handleAdopt}
        />

        <ActionButton
          icon="♥"
          label="Coup de cœur"
          color="bg-[#6dd5ca]"
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
    <div
      className="
        flex h-[67px] w-[62px]
        flex-col items-center justify-center
        rounded-[18px]
        bg-[#fffaf5]/94
        px-1
        text-center
        shadow-md
        backdrop-blur
      "
    >
      <span className="text-[19px] text-[#e58fa5]">
        {icon}
      </span>

      <span className="mt-1 text-[10px] font-semibold leading-tight text-[#54504c]">
        {text}
      </span>
    </div>
  );
}

function Tag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        rounded-full
        bg-[#cdb4df]/95
        px-4 py-2
        text-[11px]
        font-semibold
        text-white
        backdrop-blur
      "
    >
      {children}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
  large = false,
}: {
  icon: string;
  label: string;
  color: string;
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
          border-[3px] border-white
          text-white
          shadow-[0_5px_15px_rgba(0,0,0,.17)]
          ${color}
          ${
            large
              ? "h-[78px] w-[78px] text-[27px]"
              : "h-[66px] w-[66px] text-[38px]"
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