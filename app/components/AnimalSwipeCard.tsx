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
  onOpenFilter?: () => void;
  filterCount?: number;
};

type SwipeFeedback =
  | "favorite"
  | "pass"
  | null;

export default function AnimalSwipeCard({
  animal,
  onPass,
  onFavorite,
  onOpenFilter,
  filterCount = 0,
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

  useEffect(() => {
    setStartX(null);
    setTranslateX(0);
    setDragging(false);
    setActionLoading(false);
    setSwipeFeedback(null);
  }, [animal?.id]);

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

  const creatorName =
    animal?.owner_profile
      ?.organization_name ||
    animal?.association_name ||
    "";

  const creatorLogo =
    animal?.owner_profile
      ?.avatar_url ||
    "";

  const creatorId =
    animal?.owner_profile?.id ||
    animal?.owner_id ||
    animal?.created_by ||
    animal?.association_id ||
    "";

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

      await favoriteService.add(
        animal.id
      );

      setSwipeFeedback("favorite");

      await wait(480);

      setSwipeFeedback(null);
      setTranslateX(0);

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

  function handleAdopt() {
    if (!animal?.id) return;

    router.push(
      `/adoption/start/${animal.id}`
    );
  }

  function handleInformation() {
    if (!animal?.id) return;

    router.push(
      `/animal/${animal.id}`
    );
  }

  function handleStructure() {
    if (!creatorId) return;

    router.push(
      `/structure/${creatorId}`
    );
  }

  function handlePointerDown(
    event: PointerEvent<HTMLElement>
  ) {
    if (actionLoading) return;

    const target =
      event.target as HTMLElement;

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
      event.currentTarget.setPointerCapture(
        event.pointerId
      );
    } catch {
      // rien
    }
  }

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

    if (translateX >= 90) {
      await handleFavorite();
      return;
    }

    if (translateX <= -90) {
      await handlePass();
      return;
    }

    setTranslateX(0);
  }

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

  return (
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        px-0
        pb-[76px]
        pt-0
        sm:px-4
        sm:pb-[122px]
        sm:pt-2
        md:px-6
        lg:px-8
      "
    >
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
          h-[calc(100dvh-188px)]
          min-h-[540px]
          max-h-none
          w-full
          max-w-[455px]
          select-none
          overflow-hidden
          rounded-none
          sm:h-[calc(100dvh-285px)]
          sm:min-h-[560px]
          sm:max-h-[700px]
          sm:max-w-[520px]
          sm:rounded-[28px]
          md:h-[680px]
          md:max-h-[680px]
          md:max-w-[560px]
          md:rounded-[32px]
          lg:h-[720px]
          lg:max-h-[720px]
          lg:max-w-[620px]
          lg:rounded-[34px]
          bg-[#d9d4cf]
          shadow-[0_18px_45px_rgba(40,30,25,.22)]
        "
      >
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
              h-[70px]
              w-[70px]
              object-contain
              sm:h-[82px]
              sm:w-[82px]
              md:h-[90px]
              md:w-[90px]
              lg:h-[96px]
              lg:w-[96px]
              drop-shadow-[0_3px_8px_rgba(0,0,0,.20)]
            "
          />
        </div>

        {/* FILTRE RAPIDE */}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenFilter?.();
          }}
          aria-label="Filtrer les animaux"
          title="Filtrer"
          className="
            absolute
            right-3
            top-3
            z-50
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-white/70
            bg-white/85
            text-[#5d655f]
            shadow-lg
            backdrop-blur-xl
            transition
            active:scale-95
            sm:right-4
            sm:top-4
            sm:h-11
            sm:w-11
          "
        >
          <FilterIcon />

          {filterCount > 0 && (
            <span
              className="
                absolute
                -right-1
                -top-1
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-[#ef8196]
                px-1
                text-[9px]
                font-black
                text-white
                shadow
              "
            >
              {filterCount}
            </span>
          )}
        </button>

        {/* INFOS GAUCHE - REPOSITIONNÉES */}

        <div
          className="
            absolute
            left-2
            top-[27%]
            bottom-[165px]
            sm:left-3
            sm:top-[30%]
            sm:bottom-[190px]
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

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            z-40
            px-4
            pb-4
            text-white
            sm:px-5
            sm:pb-6
          "
        >
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
                text-[30px]
                font-black
                leading-none
                tracking-tight
                drop-shadow-lg
                sm:text-[38px]
                md:text-[42px]
                lg:text-[46px]
              "
            >
              {animalName}
            </h2>

            <button
              type="button"
              onClick={
                handleInformation
              }
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

        {creatorLogo && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleStructure();
            }}
            aria-label={
              creatorName
                ? `Voir ${creatorName}`
                : "Voir la structure"
            }
            className="
              absolute
              bottom-4
              right-3
              z-50
              flex
              h-[52px]
              w-[52px]
              items-center
              justify-center
              overflow-hidden
              rounded-full
              border-[3px]
              border-white
              bg-white
              shadow-xl
              transition
              active:scale-95
              sm:bottom-5
              sm:right-4
              sm:h-[58px]
              sm:w-[58px]
              md:h-[62px]
              md:w-[62px]
            "
          >
            <img
              src={creatorLogo}
              alt={creatorName || "Structure"}
              draggable={false}
              className="
                h-full
                w-full
                object-cover
              "
            />
          </button>
        )}
      </article>

      {/* BOUTONS SOUS LA CARTE */}

      <div
        className="
          relative
          z-[70]
          -mt-[104px]
          grid
          w-full
          max-w-[455px]
          grid-cols-3
          items-start
          gap-2
          px-3
          pb-2

          sm:mt-3
          sm:max-w-[520px]
          sm:gap-3
          sm:px-4
          sm:pb-0

          md:max-w-[560px]
          lg:max-w-[620px]
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"
            disabled={actionLoading}
            onClick={handlePass}
            aria-label="Passer"
            className="
              flex
              h-[58px]
              w-[58px]
              sm:h-[66px]
              sm:w-[66px]
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
              text-white
              drop-shadow-[0_2px_4px_rgba(0,0,0,.75)]
              sm:text-[#3e3a37]
              sm:drop-shadow-none
            "
          >
            Passer
          </span>
        </div>

        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleAdopt}
            aria-label="Je veux adopter"
            style={{
              backgroundColor:
                genderColor,
            }}
            className="
              flex
              h-[68px]
              w-[68px]
              sm:h-[78px]
              sm:w-[78px]
              md:h-[82px]
              md:w-[82px]
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
              text-white
              drop-shadow-[0_2px_4px_rgba(0,0,0,.75)]
              sm:text-[#3e3a37]
              sm:drop-shadow-none
            "
          >
            Je veux adopter
          </span>
        </div>

        <div
          className="
            flex
            flex-col
            items-center
          "
        >
          <button
            type="button"
            disabled={actionLoading}
            onClick={
              handleFavorite
            }
            aria-label="Coup de cœur"
            className="
              flex
              h-[58px]
              w-[58px]
              sm:h-[66px]
              sm:w-[66px]
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
              text-white
              drop-shadow-[0_2px_4px_rgba(0,0,0,.75)]
              sm:text-[#3e3a37]
              sm:drop-shadow-none
            "
          >
            Coup de cœur
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 sm:h-6 sm:w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 7h14" />
      <path d="M7 12h10" />
      <path d="M9 17h6" />
    </svg>
  );
}

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
        h-[44px]
        w-[56px]
        sm:h-[50px]
        sm:w-[64px]
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
          text-[14px]
          font-black
          sm:text-[16px]
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
          text-[8px]
          font-semibold
          sm:text-[9px]
          leading-none
          text-[#52504d]
        "
      >
        {value}
      </span>
    </div>
  );
}

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