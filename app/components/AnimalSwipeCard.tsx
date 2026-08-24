"use client";

import {
  PointerEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../lib/supabase";

import {
  favoriteService,
} from "../services/favorite.service";

/* =========================================================
   TYPES
========================================================= */

type AnimalSwipeCardProps = {
  animal: any;

  onPass?: () => void;

  onFavorite?: () => void;
};

type SwipeFeedback =
  | "favorite"
  | "pass"
  | null;

/* =========================================================
   COMPONENT
========================================================= */

export default function AnimalSwipeCard({
  animal,
  onPass,
  onFavorite,
}: AnimalSwipeCardProps) {
  const router =
    useRouter();

  const [
    startX,
    setStartX,
  ] = useState<number | null>(
    null
  );

  const [
    translateX,
    setTranslateX,
  ] = useState(0);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    swipeFeedback,
    setSwipeFeedback,
  ] =
    useState<SwipeFeedback>(
      null
    );

  /* =======================================================
     RESET AU CHANGEMENT D'ANIMAL
  ======================================================= */

  useEffect(() => {
    setStartX(null);
    setTranslateX(0);
    setDragging(false);
    setSwipeFeedback(null);
    setActionLoading(false);
  }, [animal?.id]);

  /* =======================================================
     NORMALISATION DES DONNEES
  ======================================================= */

  const animalName =
    animal?.animal_name ||
    animal?.nom ||
    "Animal";

  const animalType =
    String(
      animal?.animal_type ||
        animal?.type ||
        ""
    )
      .trim()
      .toLowerCase();

  const sex =
    String(
      animal?.sex ||
        animal?.sexe ||
        ""
    )
      .trim()
      .toLowerCase();

  const breed =
    animal?.breed ||
    animal?.race ||
    "";

  const age =
    animal?.age_label ||
    animal?.age ||
    "";

  const size =
    animal?.size_label ||
    animal?.taille ||
    "";

  const island =
    animal?.island ||
    animal?.ile ||
    "";

  const city =
    animal?.city ||
    animal?.localisation ||
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

  /* =======================================================
     ASSOCIATION / CREATEUR
  ======================================================= */

  const associationName =
    animal?.owner_profile
      ?.organization_name ||
    animal?.association_name ||
    "";

  const associationLogo =
    animal?.owner_profile
      ?.avatar_url ||
    "";

  /* =======================================================
     PHOTO
  ======================================================= */

  const photoUrl =
    useMemo(() => {
      const photos =
        Array.isArray(
          animal?.animal_photos
        )
          ? animal.animal_photos
          : [];

      const cover =
        photos.find(
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

  /* =======================================================
     COULEUR SELON SEXE
  ======================================================= */

  const genderColor =
    sex.includes("mâle") ||
    sex.includes("male")
      ? "#69a9df"
      : sex.includes(
            "femelle"
          )
        ? "#ef8196"
        : "#e6a85c";

  /* =======================================================
     PETITE PAUSE ANIMATION
  ======================================================= */

  function wait(
    milliseconds: number
  ) {
    return new Promise<void>(
      (resolve) => {
        window.setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  /* =======================================================
     PASSER
     SWIPE DROITE -> GAUCHE
  ======================================================= */

  async function handlePass() {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

      /*
       * Afficher la croix avant
       * de changer d'animal.
       */
      setSwipeFeedback(
        "pass"
      );

      setTranslateX(-80);

      await wait(500);

      setSwipeFeedback(null);
      setTranslateX(0);

      onPass?.();
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     COUP DE COEUR
     SWIPE GAUCHE -> DROITE
  ======================================================= */

  async function handleFavorite() {
    if (
      actionLoading ||
      !animal?.id
    ) {
      return;
    }

    try {
      setActionLoading(true);

      /*
       * Vérifier la connexion.
       */
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      /*
       * Non connecté :
       * direction connexion.
       *
       * On garde l'ID de l'animal
       * dans le redirect.
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
       * Enregistrer dans favorites.
       *
       * favoriteService.add()
       * évite déjà les doublons.
       */
      await favoriteService.add(
        animal.id
      );

      /*
       * Animation cœur.
       */
      setSwipeFeedback(
        "favorite"
      );

      setTranslateX(80);

      await wait(500);

      setSwipeFeedback(null);
      setTranslateX(0);

      /*
       * Passer à l'animal suivant.
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

  /* =======================================================
     ADOPTION
  ======================================================= */

  async function handleAdopt() {
    if (!animal?.id) {
      return;
    }

    /*
     * /adoption/start vérifie
     * ensuite si l'utilisateur
     * est connecté.
     */
    router.push(
      `/adoption/start/${animal.id}`
    );
  }

  /* =======================================================
     INFORMATIONS
  ======================================================= */

  function handleInformation() {
    if (!animal?.id) {
      return;
    }

    router.push(
      `/animal/${animal.id}`
    );
  }

  /* =======================================================
     POINTER DOWN
  ======================================================= */

  function handlePointerDown(
    event: PointerEvent<HTMLElement>
  ) {
    if (actionLoading) {
      return;
    }

    /*
     * Évite de démarrer un swipe
     * quand on touche un bouton.
     */
    const target =
      event.target as HTMLElement;

    if (
      target.closest(
        "button, a"
      )
    ) {
      return;
    }

    setStartX(
      event.clientX
    );

    setDragging(true);

    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // Rien
    }
  }

  /* =======================================================
     POINTER MOVE
  ======================================================= */

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

    /*
     * Limiter le déplacement
     * visuel de la carte.
     */
    const limited =
      Math.max(
        -180,
        Math.min(
          180,
          difference
        )
      );

    setTranslateX(
      limited
    );
  }

  /* =======================================================
     FIN DU SWIPE
  ======================================================= */

  async function handlePointerEnd(
    event: PointerEvent<HTMLElement>
  ) {
    if (
      startX === null ||
      !dragging ||
      actionLoading
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
      // Rien
    }

    /*
     * GAUCHE -> DROITE
     *
     * COUP DE COEUR
     */
    if (translateX >= 90) {
      await handleFavorite();
      return;
    }

    /*
     * DROITE -> GAUCHE
     *
     * NEXT TIME
     */
    if (translateX <= -90) {
      await handlePass();
      return;
    }

    /*
     * Pas assez loin :
     * retour au centre.
     */
    setTranslateX(0);
  }

  /* =======================================================
     ROTATION CARTE
  ======================================================= */

  const rotation =
    translateX / 28;

  /* =======================================================
     INDICATEUR PENDANT LE DRAG
  ======================================================= */

  const dragFavoriteOpacity =
    Math.min(
      Math.max(
        translateX / 110,
        0
      ),
      1
    );

  const dragPassOpacity =
    Math.min(
      Math.max(
        -translateX / 110,
        0
      ),
      1
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        flex
        w-full
        justify-center
        px-0
        pb-28
        sm:px-3
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
          w-full
          max-w-[470px]
          select-none
          overflow-hidden
          rounded-[30px]
          bg-[#ddd]
          shadow-[0_18px_50px_rgba(0,0,0,.22)]
        "
      >
        {/* =================================================
            PHOTO
        ================================================= */}

        <div
          className="
            relative
            h-[calc(100dvh-155px)]
            min-h-[590px]
            max-h-[820px]
            w-full
            overflow-hidden
            bg-[#d8d1c9]
          "
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={animalName}
              draggable={false}
              className="
                h-full
                w-full
                object-cover
                pointer-events-none
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
                bg-[#eee7df]
                text-8xl
              "
            >
              🐾
            </div>
          )}

          {/* ===============================================
              DEGRADE BAS
          =============================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              bottom-0
              h-[58%]
              bg-gradient-to-t
              from-black/85
              via-black/30
              to-transparent
            "
          />

          {/* ===============================================
              LOGO TAUI TE ORA
          =============================================== */}

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
                h-16
                w-16
                object-contain
                drop-shadow-[0_3px_8px_rgba(0,0,0,.35)]
                sm:h-[72px]
                sm:w-[72px]
              "
            />
          </div>

          {/* ===============================================
              FEEDBACK PENDANT LE DRAG DROITE
          =============================================== */}

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
                  top-28
                  z-30
                  -rotate-12
                  rounded-2xl
                  border-4
                  border-red-500
                  px-4
                  py-2
                  text-xl
                  font-black
                  uppercase
                  tracking-wider
                  text-red-500
                  drop-shadow-lg
                "
              >
                ❤️ Coup de cœur
              </div>
            )}

          {/* ===============================================
              FEEDBACK PENDANT LE DRAG GAUCHE
          =============================================== */}

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
                  top-28
                  z-30
                  rotate-12
                  rounded-2xl
                  border-4
                  border-red-500
                  px-4
                  py-2
                  text-xl
                  font-black
                  uppercase
                  tracking-wider
                  text-red-500
                  drop-shadow-lg
                "
              >
                ✕ NEXT TIME
              </div>
            )}

          {/* ===============================================
              ANIMATION COUP DE COEUR
          =============================================== */}

          {swipeFeedback ===
            "favorite" && (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-[80]
                  flex
                  items-center
                  justify-center
                  bg-black/10
                "
              >
                <div
                  className="
                    -rotate-12
                    text-center
                    drop-shadow-[0_6px_15px_rgba(0,0,0,.45)]
                  "
                >
                  <div
                    className="
                      animate-[ping_.45s_ease-out_1]
                      text-[120px]
                      leading-none
                      text-red-500
                    "
                  >
                    ♥
                  </div>

                  <div
                    className="
                      mt-2
                      rounded-full
                      bg-black/30
                      px-5
                      py-2
                      text-2xl
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-white
                      backdrop-blur-sm
                    "
                  >
                    Coup de cœur
                  </div>
                </div>
              </div>
            )}

          {/* ===============================================
              ANIMATION NEXT TIME
          =============================================== */}

          {swipeFeedback ===
            "pass" && (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-[80]
                  flex
                  items-center
                  justify-center
                  bg-black/10
                "
              >
                <div
                  className="
                    rotate-[-10deg]
                    text-center
                    drop-shadow-[0_6px_15px_rgba(0,0,0,.45)]
                  "
                >
                  <div
                    className="
                      text-[135px]
                      font-black
                      leading-[0.7]
                      text-red-500
                    "
                  >
                    ×
                  </div>

                  <div
                    className="
                      mt-5
                      rounded-full
                      bg-black/30
                      px-6
                      py-2
                      text-2xl
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-white
                      backdrop-blur-sm
                    "
                  >
                    NEXT TIME
                  </div>
                </div>
              </div>
            )}

          {/* ===============================================
              INFORMATIONS ANIMAL
          =============================================== */}

          <div
            className="
              absolute
              inset-x-0
              bottom-0
              z-20
              p-5
              pb-6
              text-white
            "
          >
            {/* BADGES SANTE */}

            <div
              className="
                mb-3
                flex
                flex-wrap
                gap-2
              "
            >
              {vaccinated && (
                <span
                  className="
                    rounded-full
                    bg-black/45
                    px-3
                    py-1.5
                    text-[11px]
                    font-bold
                    backdrop-blur-md
                  "
                >
                  ✓ Vacciné
                </span>
              )}

              {microchipped && (
                <span
                  className="
                    rounded-full
                    bg-black/45
                    px-3
                    py-1.5
                    text-[11px]
                    font-bold
                    backdrop-blur-md
                  "
                >
                  ✓ Identifié
                </span>
              )}

              {sterilized && (
                <span
                  className="
                    rounded-full
                    bg-black/45
                    px-3
                    py-1.5
                    text-[11px]
                    font-bold
                    backdrop-blur-md
                  "
                >
                  ✓ Stérilisé
                </span>
              )}
            </div>

            {/* NOM + INFO */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <h2
                className="
                  min-w-0
                  truncate
                  text-[34px]
                  font-black
                  leading-none
                  drop-shadow-lg
                "
              >
                {animalName}
              </h2>

              <button
                type="button"
                onClick={
                  handleInformation
                }
                aria-label="Voir la fiche de l'animal"
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-white
                  bg-black/25
                  text-sm
                  font-black
                  text-white
                  backdrop-blur-md
                "
              >
                i
              </button>
            </div>

            {/* ASSOCIATION */}

            {associationName && (
              <p
                className="
                  mt-2
                  truncate
                  text-sm
                  font-bold
                  text-white/95
                  drop-shadow
                "
              >
                {associationName}
              </p>
            )}

            {/* LOCALISATION */}

            {(city ||
              island) && (
                <p
                  className="
                    mt-1
                    truncate
                    text-sm
                    text-white/85
                  "
                >
                  📍{" "}
                  {[
                    city,
                    island,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

            {/* INFOS */}

            {(breed ||
              age ||
              size) && (
                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {breed && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                      {breed}
                    </span>
                  )}

                  {age && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                      {age}
                    </span>
                  )}

                  {size && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                      {size}
                    </span>
                  )}
                </div>
              )}

            {/* CARACTERE */}

            {character && (
              <p
                className="
                  mt-3
                  line-clamp-2
                  max-w-[88%]
                  text-sm
                  leading-relaxed
                  text-white/90
                "
              >
                {character}
              </p>
            )}

            {/* =============================================
                ACTIONS
            ============================================= */}

            <div
              className="
                mt-5
                flex
                items-center
                justify-center
                gap-4
              "
            >
              {/* PASSER */}

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  handlePass
                }
                aria-label="Passer cet animal"
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-3xl
                  font-light
                  text-red-500
                  shadow-xl
                  transition
                  hover:scale-105
                  active:scale-95
                  disabled:opacity-60
                "
              >
                ×
              </button>

              {/* COUP DE COEUR */}

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  handleFavorite
                }
                aria-label="Ajouter aux coups de cœur"
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-[28px]
                  text-red-500
                  shadow-xl
                  transition
                  hover:scale-105
                  active:scale-95
                  disabled:opacity-60
                "
              >
                ♥
              </button>

              {/* ADOPTER */}

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  handleAdopt
                }
                aria-label="Je veux adopter"
                className="
                  flex
                  h-[62px]
                  w-[62px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border-[3px]
                  border-white
                  shadow-xl
                  transition
                  hover:scale-105
                  active:scale-95
                  disabled:opacity-60
                "
                style={{
                  backgroundColor:
                    genderColor,
                }}
              >
                <AnimalActionIcon
                  animalType={
                    animalType
                  }
                />
              </button>
            </div>
          </div>

          {/* ===============================================
              LOGO ASSOCIATION BAS DROITE
          =============================================== */}

          {associationLogo && (
            <div
              className="
                absolute
                bottom-5
                right-4
                z-30
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
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
                  src={
                    associationLogo
                  }
                  alt={
                    associationName ||
                    "Créateur de la fiche"
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
        </div>
      </article>
    </div>
  );
}

/* =========================================================
   ICONE ADOPTION SELON ANIMAL
========================================================= */

function AnimalActionIcon({
  animalType,
}: {
  animalType: string;
}) {
  /*
   * CHEVAL
   */
  if (
    animalType.includes(
      "cheval"
    ) ||
    animalType.includes(
      "horse"
    )
  ) {
    return (
      <span
        className="
          text-[34px]
          leading-none
          text-white
        "
      >
        ♧
      </span>
    );
  }

  /*
   * CHAT
   */
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

  /*
   * CHIEN PAR DEFAUT
   */
  return <DogPawIcon />;
}

/* =========================================================
   PATTE CHIEN
========================================================= */

function DogPawIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10"
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
      className="h-10 w-10"
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