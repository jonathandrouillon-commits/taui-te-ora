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
}: AnimalSwipeCardProps) {
  const router = useRouter();

  const [startX, setStartX] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);

  const mediaItems = useMemo(() => {
    if (!animal) return [];

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

  const animalType =
    animal.type ||
    animal.animal_type ||
    animal.espece ||
    animal.species ||
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
    animal.creator_name ||
    "Association";

  const associationLogo =
    animal.owner_profile?.avatar_url ||
    animal.owner_profile?.logo_url ||
    animal.association_logo ||
    animal.creator_avatar ||
    "";

  const isSterilized =
    animal.sterilized ??
    animal.sterilise;

  const isVaccinated =
    animal.vaccinated ??
    animal.vaccine;

  const isMicrochipped =
    animal.microchipped ??
    animal.identifie;

  const currentMedia = mediaItems[mediaIndex];

  const adoptionIcon = getAdoptionIcon(
    animalType,
    sex
  );

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

    router.push(
      `/animal/${animal.id}`
    );
  }

  return (
    <div
      className="
        mx-auto
        flex
        min-h-0
        w-full
        max-w-[470px]
        flex-1
        flex-col
        px-2
        pb-4
        pt-2
      "
    >
      {/* =====================================================
          SWIPE CARD
      ====================================================== */}

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
        {/* =====================================================
            PHOTO
        ====================================================== */}

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
              className="
                h-full
                w-full
                select-none
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                bg-[#ded8d0]
                text-[#55514e]
              "
            >
              Photo
            </div>
          )}
        </button>

        {/* =====================================================
            DÉGRADÉ POUR LECTURE
        ====================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-black/85
            via-black/5
            to-black/5
          "
        />

        {/* =====================================================
            LOGO TAUI TE ORA
        ====================================================== */}

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
              drop-shadow-[0_3px_5px_rgba(0,0,0,.22)]
              min-[390px]:w-[115px]
            "
          />
        </div>

        {/* =====================================================
            INFORMATIONS À GAUCHE
            Zone limitée pour ne jamais toucher au prénom
        ====================================================== */}

        <div
          className="
            absolute
            left-3
            top-[23%]
            bottom-[205px]
            z-30
            flex
            flex-col
            justify-center
            gap-2
          "
        >
          <InfoBox
            icon="🐾"
            text={String(age)}
          />

          {sex && (
            <InfoBox
              icon={
                isFemale(sex)
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

        {/* =====================================================
            ZONE INFORMATIONS BAS
        ====================================================== */}

        <div
          className="
            absolute
            bottom-5
            left-5
            right-5
            z-30
            min-h-[165px]
            text-white
          "
        >
          {/* ===================================================
              PRÉNOM + I SUR UNE SEULE LIGNE
          ==================================================== */}

          <div
            className="
              flex
              min-h-[54px]
              items-center
              gap-3
              pr-[76px]
            "
          >
            <h1
              className="
                min-w-0
                truncate
                text-[clamp(38px,10vw,54px)]
                font-medium
                leading-none
                tracking-tight
                drop-shadow
              "
            >
              {name}
            </h1>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleInfo();
              }}
              aria-label="Voir la fiche"
              className="
                flex
                h-[46px]
                w-[46px]
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#fffaf4]
                text-[23px]
                font-bold
                text-[#706d66]
                shadow-lg
              "
            >
              i
            </button>
          </div>

          {/* ===================================================
              ASSOCIATION + LOCALISATION
          ==================================================== */}

          <div className="mt-2 pr-[78px]">
            <p
              className="
                truncate
                text-[15px]
                font-semibold
                drop-shadow
              "
            >
              {associationName}
            </p>

            {(city || island) && (
              <p
                className="
                  mt-1
                  truncate
                  text-[14px]
                  drop-shadow
                "
              >
                📍{" "}
                {[city, island]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {/* =================================================
                SANTÉ / CARACTÈRE
                Vacciné et identifié restent ici
                et non dans la colonne gauche
            ================================================== */}

            <div
              className="
                mt-3
                flex
                max-w-[calc(100%-10px)]
                flex-wrap
                gap-2
              "
            >
              {animal.character_1 && (
                <Tag>
                  {animal.character_1}
                </Tag>
              )}

              {animal.character_2 && (
                <Tag>
                  {animal.character_2}
                </Tag>
              )}

              {animal.character_3 && (
                <Tag>
                  {animal.character_3}
                </Tag>
              )}

              {!animal.character_1 &&
                isVaccinated && (
                  <Tag>
                    Vacciné
                  </Tag>
                )}

              {!animal.character_1 &&
                isMicrochipped && (
                  <Tag>
                    Identifié
                  </Tag>
                )}
            </div>
          </div>

          {/* ===================================================
              LOGO ASSOCIATION / CRÉATEUR
          ==================================================== */}

          <div
            className="
              absolute
              bottom-0
              right-0
              z-40
              flex
              items-center
              justify-center
            "
          >
            {associationLogo ? (
              <img
                src={associationLogo}
                alt={associationName}
                className="
                  h-[62px]
                  w-[62px]
                  rounded-full
                  border-[3px]
                  border-white
                  bg-white
                  object-cover
                  shadow-[0_4px_14px_rgba(0,0,0,.28)]
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-[62px]
                  w-[62px]
                  items-center
                  justify-center
                  rounded-full
                  border-[3px]
                  border-white
                  bg-[#fffaf4]
                  text-[26px]
                  shadow-[0_4px_14px_rgba(0,0,0,.28)]
                "
              >
                🐾
              </div>
            )}
          </div>
        </div>
      </article>

      {/* =====================================================
          ACTIONS SOUS LA CARTE
      ====================================================== */}

      <div
        className="
          grid
          shrink-0
          grid-cols-3
          items-start
          gap-2
          pb-4
          pt-3
        "
      >
        {/* PASSER */}

        <ActionButton
          icon="×"
          label="Passer"
          color="bg-[#cfc0e1]"
          onClick={handlePass}
        />

        {/* ===================================================
            ADOPTER
            Image selon espèce + sexe
        ==================================================== */}

        <button
          type="button"
          onClick={handleAdopt}
          className="
            flex
            min-w-0
            flex-col
            items-center
          "
        >
          <div
            className="
              flex
              h-[78px]
              w-[78px]
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-white
              bg-white
              shadow-[0_5px_15px_rgba(0,0,0,.17)]
            "
          >
            <img
              src={adoptionIcon}
              alt="Je veux adopter"
              draggable={false}
              className="
                h-[62px]
                w-[62px]
                object-contain
              "
            />
          </div>

          <span
            className="
              mt-1.5
              text-center
              text-[11px]
              font-semibold
              leading-tight
              text-[#292725]
            "
          >
            Je veux adopter
          </span>
        </button>

        {/* COUP DE CŒUR */}

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

/* =========================================================
   ICÔNE ADOPTION SELON ESPÈCE + SEXE
========================================================= */

function getAdoptionIcon(
  animalType: string,
  sex: string
) {
  const type = normalizeText(
    String(animalType || "")
  );

  const female = isFemale(sex);

  /* CHIEN */

  if (
    type.includes("chien") ||
    type.includes("dog") ||
    type.includes("canin")
  ) {
    return female
      ? "/adopt-dog-female.png"
      : "/adopt-dog-male.png";
  }

  /* CHAT */

  if (
    type.includes("chat") ||
    type.includes("cat") ||
    type.includes("felin")
  ) {
    return female
      ? "/adopt-cat-female.png"
      : "/adopt-cat-male.png";
  }

  /* CHEVAL */

  if (
    type.includes("cheval") ||
    type.includes("horse") ||
    type.includes("equide") ||
    type.includes("equine")
  ) {
    return "/adopt-horse.png";
  }

  /* PAR DÉFAUT */

  return female
    ? "/adopt-dog-female.png"
    : "/adopt-dog-male.png";
}

/* =========================================================
   DÉTECTION SEXE
========================================================= */

function isFemale(sex: string) {
  const value = normalizeText(
    String(sex || "")
  );

  return (
    value.includes("femelle") ||
    value.includes("female") ||
    value === "f" ||
    value === "♀"
  );
}

/* =========================================================
   NORMALISATION TEXTE
========================================================= */

function normalizeText(
  value: string
) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}

/* =========================================================
   BLOC INFORMATION GAUCHE
========================================================= */

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
        flex
        min-h-[58px]
        w-[60px]
        shrink-0
        flex-col
        items-center
        justify-center
        rounded-[17px]
        bg-[#fffaf5]/94
        px-1
        py-2
        text-center
        shadow-md
        backdrop-blur
      "
    >
      <span
        className="
          text-[18px]
          leading-none
          text-[#e58fa5]
        "
      >
        {icon}
      </span>

      <span
        className="
          mt-1.5
          line-clamp-2
          text-[10px]
          font-semibold
          leading-tight
          text-[#54504c]
        "
      >
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   TAGS
========================================================= */

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
        px-3.5
        py-1.5
        text-[10px]
        font-semibold
        text-white
        backdrop-blur
      "
    >
      {children}
    </span>
  );
}

/* =========================================================
   BOUTONS PASSER / COUP DE CŒUR
========================================================= */

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        min-w-0
        flex-col
        items-center
      "
    >
      <div
        className={`
          flex
          h-[64px]
          w-[64px]
          items-center
          justify-center
          rounded-full
          border-[3px]
          border-white
          text-[36px]
          leading-none
          text-white
          shadow-[0_5px_15px_rgba(0,0,0,.17)]
          ${color}
        `}
      >
        {icon}
      </div>

      <span
        className="
          mt-1.5
          text-center
          text-[10px]
          font-semibold
          leading-tight
          text-[#292725]
        "
      >
        {label}
      </span>
    </button>
  );
}