"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AnimalSwipeCard from "./components/AnimalSwipeCard";
import TauiPageBackground from "./components/ui/TauiPageBackground";

import { animalService } from "./services/animal.service";
import { favoriteService } from "./services/favorite.service";

import { supabase } from "./lib/supabase";

/* =========================================================
   TYPES FILTRE
========================================================= */

type AnimalFilter =
  | "chien"
  | "chat"
  | "cheval"
  | "autre";

const FILTER_STORAGE_KEY =
  "taui-selected-animal-types";

const WELCOME_STORAGE_KEY =
  "taui-welcome-seen";

/* =========================================================
   PAGE
========================================================= */

export default function HomePage() {
  const router = useRouter();

  const [animals, setAnimals] =
    useState<any[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [
    favoriteRestored,
    setFavoriteRestored,
  ] = useState(false);

  const [
    welcomeOpen,
    setWelcomeOpen,
  ] = useState(false);

  const [
    welcomeReady,
    setWelcomeReady,
  ] = useState(false);

  const [
    selectedTypes,
    setSelectedTypes,
  ] = useState<AnimalFilter[]>([]);

  /* =========================================================
     CHARGEMENT INITIAL
  ========================================================= */

  useEffect(() => {
    loadAnimals();
    loadWelcomePreferences();
  }, []);

  /* =========================================================
     RETOUR APRES LOGIN FAVORI
  ========================================================= */

  useEffect(() => {
    restoreFavoriteAfterLogin();
  }, []);

  /* =========================================================
     PREFERENCES ACCUEIL
  ========================================================= */

  async function loadWelcomePreferences() {
    try {
      const alreadySeen =
        sessionStorage.getItem(
          WELCOME_STORAGE_KEY
        );

      const savedFilters =
        sessionStorage.getItem(
          FILTER_STORAGE_KEY
        );

      if (savedFilters) {
        const parsed =
          JSON.parse(savedFilters);

        if (Array.isArray(parsed)) {
          setSelectedTypes(
            parsed.filter(
              (
                value
              ): value is AnimalFilter =>
                [
                  "chien",
                  "chat",
                  "cheval",
                  "autre",
                ].includes(value)
            )
          );
        }
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        setWelcomeOpen(false);

        sessionStorage.setItem(
          WELCOME_STORAGE_KEY,
          "yes"
        );

        return;
      }

      setWelcomeOpen(
        alreadySeen !== "yes"
      );
    } catch (error) {
      console.error(
        "Erreur préférence accueil :",
        error
      );

      setWelcomeOpen(true);
    } finally {
      setWelcomeReady(true);
    }
  }

  /* =========================================================
     FILTRES
  ========================================================= */

  function toggleAnimalType(
    type: AnimalFilter
  ) {
    setSelectedTypes(
      (previous) => {
        if (
          previous.includes(type)
        ) {
          return previous.filter(
            (item) =>
              item !== type
          );
        }

        return [
          ...previous,
          type,
        ];
      }
    );
  }

  /* =========================================================
     COMMENCER DECOUVERTE
  ========================================================= */

  function startDiscovery() {
    try {
      sessionStorage.setItem(
        WELCOME_STORAGE_KEY,
        "yes"
      );

      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(
          selectedTypes
        )
      );
    } catch {
      // rien
    }

    setCurrentIndex(0);
    setWelcomeOpen(false);
  }

  /* =========================================================
     VOIR TOUS LES ANIMAUX
  ========================================================= */

  function showAllAnimals() {
    setSelectedTypes([]);

    try {
      sessionStorage.setItem(
        WELCOME_STORAGE_KEY,
        "yes"
      );

      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify([])
      );
    } catch {
      // rien
    }

    setCurrentIndex(0);
    setWelcomeOpen(false);
  }

  /* =========================================================
     RESTAURER FAVORI APRES LOGIN
  ========================================================= */

  async function restoreFavoriteAfterLogin() {
    try {
      const params =
        new URLSearchParams(
          window.location.search
        );

      const favoriteAnimalId =
        params.get("favorite");

      if (!favoriteAnimalId) {
        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await favoriteService.add(
        favoriteAnimalId
      );

      setFavoriteRestored(true);

      router.replace("/");

      window.setTimeout(() => {
        setFavoriteRestored(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Erreur restauration coup de cœur :",
        error
      );
    }
  }

  /* =========================================================
     CHARGER LES ANIMAUX
  ========================================================= */

  async function loadAnimals() {
    try {
      setLoading(true);

      const data =
        await animalService.getPublishedWithPhotos();

      setAnimals(
        data || []
      );

      setCurrentIndex(0);
    } catch (error) {
      console.error(
        "Erreur chargement animaux :",
        error
      );

      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FILTRAGE DES ANIMAUX
  ========================================================= */

  const filteredAnimals =
    useMemo(() => {
      if (
        selectedTypes.length === 0
      ) {
        return animals;
      }

      return animals.filter(
        (animal) => {
          const type =
            String(
              animal?.animal_type ||
                animal?.type ||
                ""
            )
              .trim()
              .toLowerCase();

          const isDog =
            type.includes("chien") ||
            type.includes("dog");

          const isCat =
            type.includes("chat") ||
            type.includes("cat");

          const isHorse =
            type.includes("cheval") ||
            type.includes("horse");

          return selectedTypes.some(
            (selected) => {
              if (
                selected === "chien"
              ) {
                return isDog;
              }

              if (
                selected === "chat"
              ) {
                return isCat;
              }

              if (
                selected === "cheval"
              ) {
                return isHorse;
              }

              if (
                selected === "autre"
              ) {
                return (
                  !isDog &&
                  !isCat &&
                  !isHorse
                );
              }

              return false;
            }
          );
        }
      );
    }, [
      animals,
      selectedTypes,
    ]);

  /* =========================================================
     ANIMAL SUIVANT
  ========================================================= */

  function goNext() {
    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );
  }

  const currentAnimal =
    filteredAnimals[
      currentIndex
    ];

  const filterCount =
    selectedTypes.length;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <TauiPageBackground>
      <div className="relative min-h-[100dvh] w-full">

        {/* FAVORI RESTAURE */}

        {favoriteRestored && (
          <div
            className="
              fixed
              left-1/2
              top-5
              z-[300]
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-white/95
              px-5
              py-3
              font-black
              text-[#df687c]
              shadow-xl
              backdrop-blur
            "
          >
            ❤️ Coup de cœur enregistré
          </div>
        )}

        {/* ===================================================
            BOUTON FILTRE
        ==================================================== */}

        {welcomeReady &&
          !welcomeOpen &&
          !loading && (
            <button
              type="button"
              onClick={() =>
                setWelcomeOpen(true)
              }
              aria-label="Filtrer les animaux"
              title="Filtrer"
              className="
                fixed
                right-4
                top-4
                z-[120]
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-white/70
                bg-white/80
                text-[#5d655f]
                shadow-lg
                backdrop-blur-xl
                transition
                hover:bg-white
                active:scale-95
              "
            >
              <FilterIcon />
            </button>
          )}

        {/* ===================================================
            SWIPE
        ==================================================== */}

        <section
          className="
            flex
            min-h-[calc(100dvh-74px)]
            w-full
            items-start
            justify-center
            p-0
            md:px-6
            md:py-8
          "
        >
          {loading && (
            <div
              className="
                flex
                min-h-[calc(100dvh-74px)]
                w-full
                items-center
                justify-center
              "
            >
              <div
                className="
                  rounded-3xl
                  bg-white/90
                  px-8
                  py-6
                  text-center
                  shadow-xl
                  backdrop-blur-md
                "
              >
                <div
                  className="
                    mx-auto
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-[#efd5d7]
                    border-t-[#df8995]
                  "
                />

                <p
                  className="
                    mt-4
                    font-bold
                    text-[#667568]
                  "
                >
                  Chargement des animaux...
                </p>
              </div>
            </div>
          )}

          {!loading &&
            currentAnimal && (
              <AnimalSwipeCard
                animal={
                  currentAnimal
                }
                onPass={
                  goNext
                }
                onFavorite={
                  goNext
                }
              />
            )}

          {!loading &&
            !currentAnimal && (
              <div
                className="
                  flex
                  min-h-[calc(100dvh-74px)]
                  w-full
                  items-center
                  justify-center
                  px-5
                "
              >
                <div
                  className="
                    max-w-md
                    rounded-[32px]
                    bg-white/90
                    p-8
                    text-center
                    shadow-xl
                    backdrop-blur-md
                  "
                >
                  <div className="text-6xl">
                    🐾
                  </div>

                  <h2
                    className="
                      mt-4
                      text-2xl
                      font-black
                      text-[#667568]
                    "
                  >
                    {filterCount > 0
                      ? "Pas d'autre rencontre pour ce filtre"
                      : "Aucun autre animal à afficher"}
                  </h2>

                  <p
                    className="
                      mt-3
                      text-gray-600
                    "
                  >
                    {filterCount > 0
                      ? "Essayez d'élargir votre sélection pour découvrir d'autres animaux."
                      : "Vous avez parcouru tous les animaux disponibles pour le moment."}
                  </p>

                  {filterCount > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setWelcomeOpen(
                          true
                        )
                      }
                      className="
                        mt-6
                        rounded-full
                        bg-[#ef919b]
                        px-6
                        py-3
                        font-black
                        text-white
                        shadow-lg
                      "
                    >
                      Modifier mes choix
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        loadAnimals
                      }
                      className="
                        mt-6
                        rounded-full
                        bg-[#ef919b]
                        px-6
                        py-3
                        font-black
                        text-white
                        shadow-lg
                      "
                    >
                      Recommencer
                    </button>
                  )}
                </div>
              </div>
            )}
        </section>

        {/* ===================================================
            MENU BAS
        ==================================================== */}

        <BottomMenu />

        {/* ===================================================
            FENETRE ACCUEIL / FILTRE
        ==================================================== */}

        {welcomeReady &&
          welcomeOpen && (
            <WelcomeModal
              selectedTypes={
                selectedTypes
              }
              toggleAnimalType={
                toggleAnimalType
              }
              onStart={
                startDiscovery
              }
              onShowAll={
                showAllAnimals
              }
              onClose={() => {
                const alreadySeen =
                  sessionStorage.getItem(
                    WELCOME_STORAGE_KEY
                  );

                if (
                  alreadySeen === "yes"
                ) {
                  setWelcomeOpen(
                    false
                  );
                }
              }}
              router={router}
            />
          )}
      </div>
    </TauiPageBackground>
  );
}

/* =========================================================
   FENETRE ACCUEIL / FILTRE
========================================================= */

function WelcomeModal({
  selectedTypes,
  toggleAnimalType,
  onStart,
  onShowAll,
  onClose,
  router,
}: {
  selectedTypes: AnimalFilter[];

  toggleAnimalType: (
    type: AnimalFilter
  ) => void;

  onStart: () => void;

  onShowAll: () => void;

  onClose: () => void;

  router: ReturnType<
    typeof useRouter
  >;
}) {
  const options: {
    type: AnimalFilter;
    icon: string;
    title: string;
  }[] = [
    {
      type: "chien",
      icon: "🐶",
      title: "Chien",
    },
    {
      type: "chat",
      icon: "🐱",
      title: "Chat",
    },
    {
      type: "cheval",
      icon: "🐴",
      title: "Cheval",
    },
    {
      type: "autre",
      icon: "🐾",
      title: "Autre",
    },
  ];

  return (
    <div
      className="
        fixed
        inset-0
        z-[500]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-[#332c29]/40
        px-4
        py-6
        backdrop-blur-[7px]
      "
    >
      <div
        className="
          relative
          w-full
          max-w-[430px]
          overflow-hidden
          rounded-[36px]
          border
          border-white/70
          bg-[#fffaf7]/95
          shadow-[0_30px_100px_rgba(38,30,27,.30)]
          backdrop-blur-2xl
        "
      >

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-44
            w-44
            rounded-full
            bg-[#f8ccd3]/45
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-12
            h-52
            w-52
            rounded-full
            bg-[#bfe4da]/40
            blur-3xl
          "
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/75
            text-lg
            text-[#716963]
            shadow-sm
          "
        >
          ×
        </button>

        <div
          className="
            relative
            z-10
            px-5
            pb-6
            pt-6
            sm:px-7
          "
        >

          <div className="text-center">

            <img
              src="/logo-taui-te-ora.png"
              alt="Taui Te Ora"
              className="
                mx-auto
                h-24
                w-24
                object-contain
                drop-shadow-sm
              "
            />

            <p
              className="
                mt-1
                text-[11px]
                font-black
                uppercase
                tracking-[0.27em]
                text-[#df8995]
              "
            >
              Une rencontre peut tout changer
            </p>

            <h1
              className="
                mx-auto
                mt-4
                max-w-[340px]
                text-[29px]
                font-black
                leading-[1.08]
                tracking-tight
                text-[#064b42]
              "
            >
              Et si quelqu&apos;un
              vous attendait déjà ?
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-[330px]
                text-sm
                leading-relaxed
                text-[#746c66]
              "
            >
              Dites-nous simplement qui
              vous aimeriez rencontrer.
            </p>

          </div>

          <div className="mt-7">

            <p
              className="
                text-center
                text-sm
                font-black
                text-[#064b42]
              "
            >
              Je veux adopter…
            </p>

            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-3
              "
            >

              {options.map(
                (option) => {
                  const selected =
                    selectedTypes.includes(
                      option.type
                    );

                  return (
                    <button
                      key={
                        option.type
                      }
                      type="button"
                      onClick={() =>
                        toggleAnimalType(
                          option.type
                        )
                      }
                      className={`
                        relative
                        flex
                        min-h-[92px]
                        flex-col
                        items-center
                        justify-center
                        rounded-[24px]
                        border-2
                        px-3
                        py-3
                        transition
                        active:scale-[.98]
                        ${
                          selected
                            ? "border-[#ef8196] bg-[#fff0f2] shadow-[0_8px_24px_rgba(239,129,150,.17)]"
                            : "border-[#eee3dd] bg-white/80 shadow-sm"
                        }
                      `}
                    >

                      {selected && (
                        <span
                          className="
                            absolute
                            right-2.5
                            top-2.5
                            flex
                            h-5
                            w-5
                            items-center
                            justify-center
                            rounded-full
                            bg-[#ef8196]
                            text-[10px]
                            font-black
                            text-white
                          "
                        >
                          ✓
                        </span>
                      )}

                      <span
                        className="
                          text-[35px]
                          leading-none
                        "
                      >
                        {option.icon}
                      </span>

                      <span
                        className={`
                          mt-2
                          text-[13px]
                          font-black
                          ${
                            selected
                              ? "text-[#d96f81]"
                              : "text-[#5d5955]"
                          }
                        `}
                      >
                        {option.title}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

            <p
              className="
                mt-3
                text-center
                text-[11px]
                text-[#978e87]
              "
            >
              Vous pouvez en choisir plusieurs.
            </p>

          </div>

          <button
            type="button"
            onClick={onStart}
            className="
              mt-6
              w-full
              rounded-full
              bg-[#ef8196]
              px-6
              py-4
              text-[16px]
              font-black
              text-white
              shadow-[0_12px_28px_rgba(239,129,150,.32)]
              transition
              active:scale-[.99]
            "
          >
            {selectedTypes.length > 0
              ? "Voir qui m’attend"
              : "Découvrir tous les animaux"}
          </button>

          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={onShowAll}
              className="
                mt-2
                w-full
                py-2
                text-xs
                font-bold
                text-[#8b817a]
                underline
                underline-offset-4
              "
            >
              Voir tous les animaux
            </button>
          )}

          <div
            className="
              mt-5
              flex
              items-center
              justify-center
              gap-4
              rounded-[20px]
              bg-[#f7f1ec]
              px-4
              py-3
            "
          >
            <span
              className="
                text-[11px]
                font-bold
                text-[#df687c]
              "
            >
              → ❤️ Coup de cœur
            </span>

            <span
              className="
                h-4
                w-px
                bg-[#dcd1ca]
              "
            />

            <span
              className="
                text-[11px]
                font-bold
                text-[#746c66]
              "
            >
              ← Next time
            </span>
          </div>

          <div
            className="
              mt-6
              border-t
              border-[#eadfd8]
              pt-5
              text-center
            "
          >

            <p
              className="
                text-xs
                font-bold
                text-[#756d67]
              "
            >
              Association, refuge,
              SIGFA, bénévole ou
              fourrière ?
            </p>

            <p
              className="
                mt-1
                text-[11px]
                text-[#9a918a]
              "
            >
              Accédez directement à
              votre espace.
            </p>

            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-3
              "
            >

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/login"
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#d9cec7]
                  bg-white
                  px-4
                  py-3
                  text-xs
                  font-black
                  text-[#064b42]
                  shadow-sm
                "
              >
                Se connecter
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/choose-role"
                  )
                }
                className="
                  rounded-full
                  bg-[#064b42]
                  px-4
                  py-3
                  text-xs
                  font-black
                  text-white
                  shadow-sm
                "
              >
                Créer un compte
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NAVIGATION BASSE
========================================================= */

function BottomMenu() {
  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-[100]
        mx-auto
        w-full
        max-w-[470px]
        border-t
        border-[#eadfd8]
        bg-[#fffaf7]/95
        px-2
        pb-[max(8px,env(safe-area-inset-bottom))]
        pt-2
        shadow-[0_-8px_30px_rgba(50,40,35,0.10)]
        backdrop-blur-xl
        md:bottom-4
        md:rounded-[28px]
        md:border
        md:shadow-xl
      "
    >
      <div className="grid grid-cols-5 items-end">

        {/* ACCUEIL */}

        <Link
          href="/"
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
            text-[#ee8f9b]
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-[#fde7e9]
            "
          >
            <HomeIcon />
          </div>

          <span className="text-[10px] font-bold">
            Accueil
          </span>
        </Link>

        {/* RECHERCHE */}

        <Link
          href="/search"
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
            text-[#5d655f]
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
            "
          >
            <SearchIcon />
          </div>

          <span className="text-[10px] font-semibold">
            Recherche
          </span>
        </Link>

        {/* =================================================
            S.O.S ANIMAL
            LOGO : /public/sos-paw.png
        ================================================== */}

        <Link
          href="/signalement"
          aria-label="S.O.S Animal"
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
          "
        >
          <div
            className="
              flex
              h-[60px]
              w-[60px]
              -translate-y-2
              items-center
              justify-center
              overflow-hidden
              rounded-full
              border-[3px]
              border-[#fffaf7]
              bg-white
              shadow-xl
              transition
              active:scale-95
            "
          >
            <img
              src="/sos-paw.png"
              alt="S.O.S Animal"
              draggable={false}
              className="
                h-full
                w-full
                rounded-full
                object-cover
              "
            />
          </div>
        </Link>

        {/* INFOS */}

        <Link
          href="/informations"
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
            text-[#5d655f]
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
            "
          >
            <InfoIcon />
          </div>

          <span className="text-[10px] font-semibold">
            Infos
          </span>
        </Link>

        {/* PROFIL */}

        <Link
          href="/profile"
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
            text-[#5d655f]
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
            "
          >
            <ProfileIcon />
          </div>

          <span className="text-[10px] font-semibold">
            Profil
          </span>
        </Link>

      </div>
    </nav>
  );
}

/* =========================================================
   ICONES
========================================================= */

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M5 7h14" />
      <path d="M7 12h10" />
      <path d="M9 17h6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v6" />

      <path d="M12 7h.01" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4.5 21c.8-4.1 3.5-6.5 7.5-6.5s6.7 2.4 7.5 6.5" />
    </svg>
  );
}