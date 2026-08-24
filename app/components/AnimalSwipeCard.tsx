"use client";

import {
  PointerEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";
import { favoriteService } from "../services/favorite.service";

type AnimalSwipeCardProps = {
  animal: any;
  onPass?: () => void;
  onFavorite?: () => void;
};

type SwipeFeedback =
  | "favorite"
  | "pass"
  | null;

export default function AnimalSwipeCard({
  animal,
  onPass,
  onFavorite,
}: AnimalSwipeCardProps) {
  const router = useRouter();

  const [startX, setStartX] =
    useState<number | null>(null);

  const [translateX, setTranslateX] =
    useState(0);

  const [dragging, setDragging] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [swipeFeedback, setSwipeFeedback] =
    useState<SwipeFeedback>(null);

  /* =========================================================
     RESET ANIMAL
  ========================================================= */

  useEffect(() => {
    setStartX(null);
    setTranslateX(0);
    setDragging(false);
    setActionLoading(false);
    setSwipeFeedback(null);
  }, [animal?.id]);

  /* =========================================================
     DONNEES ANIMAL
  ========================================================= */

  const animalName =
    animal?.animal_name ||
    animal?.nom ||
    "Animal";

  const animalType = String(
    animal?.animal_type ||
      animal?.type ||
      ""
  )
    .trim()
    .toLowerCase();

  const sexRaw =
    animal?.sex ||
    animal?.sexe ||
    "";

  const sex = String(sexRaw)
    .trim()
    .toLowerCase();

  const age =
    animal?.age_label ||
    animal?.age ||
    "";

  const city =
    animal?.city ||
    animal?.localisation ||
    "";

  const island =
    animal?.island ||
    animal?.ile ||
    "";

  const character =
    animal?.description_character ||
    animal?.caractere ||
    "";

  const vaccinated =
    animal?.vaccinated ??
    animal?.vaccine ??
    false;

  const microchipped =
    animal?.microchipped ??
    animal?.identifie ??
    false;

  const sterilized =
    animal?.sterilized ??
    animal?.sterilise ??
    false;

  /* =========================================================
     CREATEUR / ASSOCIATION
  ========================================================= */

  const creatorName =
    animal?.owner_profile
      ?.organization_name ||
    animal?.association_name ||
    "";

  const creatorLogo =
    animal?.owner_profile
      ?.avatar_url ||
    "";

  /* =========================================================
     PHOTO
  ========================================================= */

  const photoUrl = useMemo(() => {
    const photos = Array.isArray(
      animal?.animal_photos
    )
      ? animal.animal_photos
      : [];

    const cover = photos.find(
      (photo: any) =>
        photo?.is_cover
    );

    return (
      cover?.photo_url ||
      photos[0]?.photo_url ||
      animal?.photo_url ||
      ""
    );
  }, [animal]);

  /* =========================================================
     SEXE / COULEUR
  ========================================================= */

  const isMale =
    sex.includes("mâle") ||
    sex.includes("male");

  const isFemale =
    sex.includes("femelle") ||
    sex.includes("female");

  const genderColor = isMale
    ? "#4d9eea"
    : isFemale
      ? "#ef8196"
      : "#e6a85c";

  /* =========================================================
     ATTENTE
  ========================================================= */

  function wait(milliseconds: number) {
    return new Promise<void>(
      (resolve) => {
        window.setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  /* =========================================================
     BLOQUER LE SWIPE SUR LES BOUTONS
  ========================================================= */

  function stopSwipeEvent(
    event: PointerEvent<HTMLElement>
  ) {
    event.stopPropagation();

    /*
     * On annule un éventuel swipe
     * qui aurait commencé juste avant.
     */
    setStartX(null);
    setDragging(false);
    setTranslateX(0);
  }

  /* =========================================================
     PASSER
  ========================================================= */

  async function handlePass() {
    if (actionLoading) return;

    try {
      setActionLoading(true);

      setSwipeFeedback("pass");

      await wait(480);

      setSwipeFeedback(null);
      setTranslateX(0);

      onPass?.();
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     COUP DE COEUR
  ========================================================= */

  async function handleFavorite() {
    if (
      actionLoading ||
      !animal?.id
    ) {
      return;
    }

    try {
      setActionLoading(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      /*
       * PAS CONNECTE
       */

      if (!user) {
        const destination =
          `/?favorite=${encodeURIComponent(
            animal.id
          )}`;

        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              destination
            )
        );

        return;
      }

      /*
       * ENREGISTRER FAVORI
       */

      await favoriteService.add(
        animal.id
      );

      /*
       * FEEDBACK
       */

      setSwipeFeedback("favorite");

      await wait(480);

      setSwipeFeedback(null);
      setTranslateX(0);

      /*
       * ANIMAL SUIVANT
       */

      onFavorite?.();
    } catch (error: any) {
      console.error(
        "Erreur coup de coeur :",
        error
      );

      if (
        error?.message ===
        "LOGIN_REQUIRED"
      ) {
        const destination =
          `/?favorite=${encodeURIComponent(
            animal.id
          )}`;

        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              destination
            )
        );

        return;
      }

      alert(
        "Impossible d'enregistrer ce coup de cœur."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     ADOPTION
  ========================================================= */

  function handleAdopt() {
    if (
      actionLoading ||
      !animal?.id
    ) {
      return;
    }

    setStartX(null);
    setDragging(false);
    setTranslateX(0);

    router.push(
      `/adoption/start/${animal.id}`
    );
  }

  /* =========================================================
     INFORMATIONS
  ========================================================= */

  function handleInformation() {
    if (
      actionLoading ||
      !animal?.id
    ) {
      return;
    }

    setStartX(null);
    setDragging(false);
    setTranslateX(0);

    router.push(
      `/animal/${animal.id}`
    );
  }

  /* =========================================================
     SWIPE START
  ========================================================= */

  function handlePointerDown(
    event: PointerEvent<HTMLElement>
  ) {
    if (actionLoading) return;

    const target =
      event.target as HTMLElement;

    /*
     * Si on touche un bouton ou un lien,
     * NE PAS démarrer le swipe.
     */
    if (
      target.closest(
        "button, a"
      )
    ) {
      return;
    }

    setStartX(event.clientX);
    setDragging(true);

    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // rien
    }
  }

  /* =========================================================
     SWIPE MOVE
  ========================================================= */

  function handlePointerMove(
    event: PointerEvent<HTMLElement>
  ) {
    if (
      startX === null ||
      !dragging ||
      actionLoading
    ) {
      return;
    }

    const difference =
      event.clientX -
      startX;

    const limited =
      Math.max(
        -160,
        Math.min(
          160,
          difference
        )
      );

    setTranslateX(limited);
  }

  /* =========================================================
     SWIPE END
  ========================================================= */

  async function handlePointerEnd(
    event: PointerEvent<HTMLElement>
  ) {
    if (
      startX === null ||
      !dragging
    ) {
      return;
    }

    setDragging(false);
    setStartX(null);

    try {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId
        );
    } catch {
      // rien
    }

    /*
     * GAUCHE → DROITE
     * COUP DE COEUR
     */

    if (translateX >= 90) {
      await handleFavorite();
      return;
    }

    /*
     * DROITE → GAUCHE
     * NEXT TIME
     */

    if (translateX <= -90) {
      await handlePass();
      return;
    }

    setTranslateX(0);
  }

  /* =========================================================
     ROTATION
  ========================================================= */

  const rotation =
    translateX / 32;

  const dragFavoriteOpacity =
    Math.min(
      Math.max(
        translateX / 100,
        0
      ),
      1
    );

  const dragPassOpacity =
    Math.min(
      Math.max(
        -translateX / 100,
        0
      ),
      1
    );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        px-3
        pb-[118px]
        pt-2
        sm:px-4
      "
    >
      {/* =====================================================
          CARTE
      ====================================================== */}

      <article
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerEnd
        }
        onPointerCancel={
          handlePointerEnd
        }
        style={{
          transform:
            `translateX(${translateX}px) rotate(${rotation}deg)`,

          transition:
            dragging
              ? "none"
              : "transform 220ms ease",

          touchAction:
            "pan-y",
        }}
        className="
          relative
          isolate
          h-[calc(100dvh-310px)]
          min-h-[540px]
          max-h-[720px]
          w-full
          max-w-[455px]
          select-none
          overflow-hidden
          rounded-[30px]
          bg-[#d9d4cf]
          shadow-[0_18px_45px_rgba(40,30,25,.22)]
        "
      >
        {/* ===================================================
            PHOTO
        ==================================================== */}

        {photoUrl ? (
          <img
            src={photoUrl}
            alt={animalName}
            draggable={false}
            className="
              pointer-events-none
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-[#ddd7d0]
              text-7xl
            "
          >
            🐾
          </div>
        )}

        {/* ===================================================
            DEGRADE
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-[48%]
            bg-gradient-to-t
            from-black/80
            via-black/30
            to-transparent
          "
        />

        {/* ===================================================
            LOGO TAUI
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-4
            z-20
            -translate-x-1/2
          "
        >
          <img
            src="/logo-taui-te-ora.png"
            alt=""
            draggable={false}
            className="
              h-[86px]
              w-[86px]
              object-contain
              drop-shadow-[0_3px_8px_rgba(0,0,0,.20)]
            "
          />
        </div>

        {/* ===================================================
            INFOS GAUCHE
        ==================================================== */}

        <div
          className="
            absolute
            left-3
            top-[30%]
            bottom-[190px]
            z-30
            flex
            flex-col
            justify-center
            gap-1.5
          "
        >
          {age && (
            <InfoBox
              icon="🐾"
              value={age}
              iconColor="#3988d1"
            />
          )}

          {sexRaw && (
            <InfoBox
              icon={
                isMale
                  ? "♂"
                  : isFemale
                    ? "♀"
                    : "⚥"
              }
              value={sexRaw}
              iconColor={
                genderColor
              }
            />
          )}

          {vaccinated && (
            <InfoBox
              icon="✓"
              value="Vacciné"
              iconColor="#df8995"
            />
          )}

          {microchipped && (
            <InfoBox
              icon="✓"
              value="Identifié"
              iconColor="#df8995"
            />
          )}

          {sterilized && (
            <InfoBox
              icon="✿"
              value="Stérilisé"
              iconColor="#df8995"
            />
          )}
        </div>

        {/* ===================================================
            FEEDBACK DRAG FAVORI
        ==================================================== */}

        {dragFavoriteOpacity >
          0 &&
          !swipeFeedback && (
            <div
              style={{
                opacity:
                  dragFavoriteOpacity,
              }}
              className="
                pointer-events-none
                absolute
                left-5
                top-32
                z-[60]
                -rotate-12
                rounded-xl
                border-4
                border-red-500
                px-4
                py-2
                text-xl
                font-black
                uppercase
                text-red-500
                drop-shadow-lg
              "
            >
              ♥ COUP DE CŒUR
            </div>
          )}

        {/* ===================================================
            FEEDBACK DRAG PASS
        ==================================================== */}

        {dragPassOpacity >
          0 &&
          !swipeFeedback && (
            <div
              style={{
                opacity:
                  dragPassOpacity,
              }}
              className="
                pointer-events-none
                absolute
                right-5
                top-32
                z-[60]
                rotate-12
                rounded-xl
                border-4
                border-red-500
                px-4
                py-2
                text-xl
                font-black
                uppercase
                text-red-500
                drop-shadow-lg
              "
            >
              ✕ NEXT TIME
            </div>
          )}

        {/* ===================================================
            FEEDBACK COUP DE COEUR
        ==================================================== */}

        {swipeFeedback ===
          "favorite" && (
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[90]
                flex
                items-center
                justify-center
                bg-black/5
              "
            >
              <div className="text-center">
                <div
                  className="
                    animate-[ping_.45s_ease-out_1]
                    text-[130px]
                    leading-none
                    text-red-500
                    drop-shadow-[0_6px_15px_rgba(0,0,0,.4)]
                  "
                >
                  ♥
                </div>

                <div
                  className="
                    mt-2
                    rounded-full
                    bg-black/35
                    px-5
                    py-2
                    text-xl
                    font-black
                    uppercase
                    tracking-widest
                    text-white
                    backdrop-blur
                  "
                >
                  Coup de cœur
                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            FEEDBACK NEXT TIME
        ==================================================== */}

        {swipeFeedback ===
          "pass" && (
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[90]
                flex
                items-center
                justify-center
                bg-black/5
              "
            >
              <div className="text-center">
                <div
                  className="
                    text-[140px]
                    font-black
                    leading-none
                    text-red-500
                    drop-shadow-[0_6px_15px_rgba(0,0,0,.4)]
                  "
                >
                  ×
                </div>

                <div
                  className="
                    -mt-2
                    rounded-full
                    bg-black/35
                    px-6
                    py-2
                    text-xl
                    font-black
                    uppercase
                    tracking-widest
                    text-white
                    backdrop-blur
                  "
                >
                  NEXT TIME
                </div>
              </div>
            </div>
          )}

        {/* ===================================================
            INFORMATIONS BAS
        ==================================================== */}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            z-40
            px-5
            pb-6
            text-white
          "
        >
          {/* NOM + INFO */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
              pr-[58px]
            "
          >
            <h2
              className="
                min-w-0
                truncate
                text-[38px]
                font-black
                leading-none
                tracking-tight
                drop-shadow-lg
                sm:text-[42px]
              "
            >
              {animalName}
            </h2>

            <button
              type="button"

              onPointerDown={
                stopSwipeEvent
              }

              onPointerUp={
                stopSwipeEvent
              }

              onPointerCancel={
                stopSwipeEvent
              }

              onClick={(event) => {
                event.stopPropagation();

                handleInformation();
              }}

              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#fffaf7]
                text-lg
                font-black
                text-[#60605d]
                shadow-lg
              "

              aria-label="Informations"
            >
              i
            </button>
          </div>

          {/* CREATEUR */}

          {creatorName && (
            <p
              className="
                mt-3
                max-w-[80%]
                truncate
                text-[15px]
                font-bold
                drop-shadow
              "
            >
              {creatorName}
            </p>
          )}

          {/* LOCALISATION */}

          {(city || island) && (
            <p
              className="
                mt-1
                max-w-[80%]
                truncate
                text-[14px]
                text-white/95
              "
            >
              📍{" "}
              {[city, island]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {/* CARACTERE */}

          {character && (
            <div
              className="
                mt-3
                max-w-[76%]
              "
            >
              <div
                className="
                  inline-flex
                  max-w-full
                  rounded-full
                  bg-[#d8b8df]/95
                  px-4
                  py-2
                  text-[13px]
                  font-bold
                  text-white
                  shadow
                  backdrop-blur
                "
              >
                <span className="truncate">
                  {character}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            LOGO CREATEUR
        ==================================================== */}

        {creatorLogo && (
          <div
            className="
              absolute
              bottom-5
              right-4
              z-50
            "
          >
            <div
              className="
                flex
                h-[58px]
                w-[58px]
                items-center
                justify-center
                overflow-hidden
                rounded-full
                border-[3px]
                border-white
                bg-white
                shadow-xl
              "
            >
              <img
                src={creatorLogo}
                alt={
                  creatorName ||
                  "Créateur"
                }
                draggable={false}
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            </div>
          </div>
        )}
      </article>

      {/* =====================================================
          BOUTONS SOUS CARTE
      ====================================================== */}

      <div
        className="
          mt-3
          grid
          w-full
          max-w-[455px]
          grid-cols-3
          items-start
          gap-3
          px-4
        "
      >
        {/* ===================================================
            PASSER
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"

            disabled={
              actionLoading
            }

            onPointerDown={
              stopSwipeEvent
            }

            onPointerUp={
              stopSwipeEvent
            }

            onPointerCancel={
              stopSwipeEvent
            }

            onClick={(event) => {
              event.stopPropagation();

              handlePass();
            }}

            aria-label="Passer"

            className="
              flex
              h-[66px]
              w-[66px]
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-white
              bg-[#d9c9ec]
              text-[38px]
              font-light
              text-white
              shadow-xl
              transition
              active:scale-95
              disabled:opacity-60
            "
          >
            ×
          </button>

          <span
            className="
              mt-1.5
              text-[11px]
              font-semibold
              text-[#3e3a37]
            "
          >
            Passer
          </span>
        </div>

        {/* ===================================================
            JE VEUX ADOPTER
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"

            disabled={
              actionLoading
            }

            onPointerDown={
              stopSwipeEvent
            }

            onPointerUp={
              stopSwipeEvent
            }

            onPointerCancel={
              stopSwipeEvent
            }

            onClick={(event) => {
              event.stopPropagation();

              handleAdopt();
            }}

            aria-label="Je veux adopter"

            style={{
              backgroundColor:
                genderColor,
            }}

            className="
              flex
              h-[78px]
              w-[78px]
              -translate-y-1
              items-center
              justify-center
              rounded-full
              border-[4px]
              border-white
              shadow-xl
              transition
              active:scale-95
              disabled:opacity-60
            "
          >
            <AnimalActionIcon
              animalType={
                animalType
              }
            />
          </button>

          <span
            className="
              mt-0.5
              whitespace-nowrap
              text-[11px]
              font-semibold
              text-[#3e3a37]
            "
          >
            Je veux adopter
          </span>
        </div>

        {/* ===================================================
            COUP DE COEUR
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"

            disabled={
              actionLoading
            }

            onPointerDown={
              stopSwipeEvent
            }

            onPointerUp={
              stopSwipeEvent
            }

            onPointerCancel={
              stopSwipeEvent
            }

            onClick={(event) => {
              event.stopPropagation();

              handleFavorite();
            }}

            aria-label="Coup de cœur"

            className="
              flex
              h-[66px]
              w-[66px]
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-white
              bg-[#6bd1cc]
              text-[32px]
              text-white
              shadow-xl
              transition
              active:scale-95
              disabled:opacity-60
            "
          >
            ♥
          </button>

          <span
            className="
              mt-1.5
              whitespace-nowrap
              text-[11px]
              font-semibold
              text-[#3e3a37]
            "
          >
            Coup de cœur
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  icon,
  value,
  iconColor,
}: {
  icon: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div
      className="
        flex
        h-[50px]
        w-[64px]
        shrink-0
        flex-col
        items-center
        justify-center
        rounded-[15px]
        bg-[#fffaf7]/95
        px-1
        py-1
        text-center
        shadow-lg
        backdrop-blur
      "
    >
      <span
        style={{
          color: iconColor,
        }}
        className="
          text-[16px]
          font-black
          leading-none
        "
      >
        {icon}
      </span>

      <span
        className="
          mt-1
          max-w-full
          truncate
          text-[9px]
          font-semibold
          leading-none
          text-[#52504d]
        "
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   ICONE ADOPTION
========================================================= */

function AnimalActionIcon({
  animalType,
}: {
  animalType: string;
}) {
  if (
    animalType.includes(
      "cheval"
    ) ||
    animalType.includes(
      "horse"
    )
  ) {
    return (
      <HorseShoeIcon />
    );
  }

  if (
    animalType.includes(
      "chat"
    ) ||
    animalType.includes(
      "cat"
    )
  ) {
    return (
      <CatPawIcon />
    );
  }

  return (
    <DogPawIcon />
  );
}

/* =========================================================
   PATTE CHIEN
========================================================= */

function DogPawIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="white"
      aria-hidden="true"
    >
      <ellipse
        cx="18"
        cy="17"
        rx="6"
        ry="9"
        transform="rotate(-20 18 17)"
      />

      <ellipse
        cx="32"
        cy="13"
        rx="6"
        ry="9"
      />

      <ellipse
        cx="46"
        cy="17"
        rx="6"
        ry="9"
        transform="rotate(20 46 17)"
      />

      <ellipse
        cx="11"
        cy="31"
        rx="5"
        ry="8"
        transform="rotate(-30 11 31)"
      />

      <ellipse
        cx="53"
        cy="31"
        rx="5"
        ry="8"
        transform="rotate(30 53 31)"
      />

      <path
        d="
          M32 26
          C21 26 15 36 16 45
          C17 52 22 55 28 52
          C30 51 31 50 32 50
          C33 50 34 51 36 52
          C42 55 47 52 48 45
          C49 36 43 26 32 26
          Z
        "
      />
    </svg>
  );
}

/* =========================================================
   PATTE CHAT
========================================================= */

function CatPawIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="white"
      aria-hidden="true"
    >
      <ellipse
        cx="19"
        cy="18"
        rx="5"
        ry="8"
        transform="rotate(-18 19 18)"
      />

      <ellipse
        cx="31"
        cy="14"
        rx="5"
        ry="8"
      />

      <ellipse
        cx="43"
        cy="18"
        rx="5"
        ry="8"
        transform="rotate(18 43 18)"
      />

      <ellipse
        cx="12"
        cy="31"
        rx="4.5"
        ry="7"
        transform="rotate(-28 12 31)"
      />

      <ellipse
        cx="50"
        cy="31"
        rx="4.5"
        ry="7"
        transform="rotate(28 50 31)"
      />

      <path
        d="
          M31 27
          C22 27 17 36 18 44
          C19 51 24 54 29 51
          C30 50 31 49 32 49
          C33 49 34 50 35 51
          C40 54 45 51 46 44
          C47 36 40 27 31 27
          Z
        "
      />
    </svg>
  );
}

/* =========================================================
   FER A CHEVAL
========================================================= */

function HorseShoeIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="none"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path
        d="
          M14 13
          C9 25 10 40 18 49
          C25 57 39 57 46 49
          C54 40 55 25 50 13
        "
      />

      <path
        d="
          M20 17
          C17 27 18 38 23 44
          C28 50 36 50 41 44
          C46 38 47 27 44 17
        "
      />
    </svg>
  );
}