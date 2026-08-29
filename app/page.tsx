"use client";

import Link from "next/link";
import {
  useCallback,
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

type AnimalFilter =
  | "chien"
  | "chat"
  | "cheval"
  | "autre";

type Ad = {
  id: string;
  advertiser_name: string;
  title: string;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  button_text: string | null;
  target_url: string | null;
  placement: string;
  priority: number;
};

type SwipeItem =
  | {
      kind: "animal";
      id: string;
      animal: any;
    }
  | {
      kind: "ad";
      id: string;
      ad: Ad;
    };

const FILTER_STORAGE_KEY =
  "taui-selected-animal-types";

const WELCOME_STORAGE_KEY =
  "taui-welcome-seen";

export default function HomePage() {
  const router = useRouter();

  const [animals, setAnimals] =
    useState<any[]>([]);

  const [ads, setAds] =
    useState<Ad[]>([]);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

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

  const loadWelcomePreferences = useCallback(async () => {
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
  }, []);

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

  const restoreFavoriteAfterLogin = useCallback(async () => {
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
  }, [router]);

  const loadAnimals = useCallback(async () => {
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
  }, []);

  const loadAds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(
          `
            id,
            advertiser_name,
            title,
            description,
            image_url,
            logo_url,
            button_text,
            target_url,
            placement,
            priority
          `
        )
        .eq("placement", "swipe")
        .order("priority", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setAds(
        (data || []) as Ad[]
      );
    } catch (error) {
      console.error(
        "Erreur chargement publicités :",
        error
      );

      setAds([]);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAnimals();
      void loadAds();
      void loadWelcomePreferences();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAnimals, loadAds, loadWelcomePreferences]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void restoreFavoriteAfterLogin();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [restoreFavoriteAfterLogin]);

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

  const swipeItems =
    useMemo<SwipeItem[]>(() => {
      const items: SwipeItem[] = [];

      let adIndex = 0;

      filteredAnimals.forEach(
        (animal, index) => {
          items.push({
            kind: "animal",
            id: `animal-${animal.id}`,
            animal,
          });

          const shouldInsertAd =
            ads.length > 0 &&
            (
              index === 0 ||
              (
                index > 0 &&
                index % 3 === 0
              )
            ) &&
            index <
              filteredAnimals.length - 1;

          if (shouldInsertAd) {
            const ad =
              ads[
                adIndex %
                  ads.length
              ];

            items.push({
              kind: "ad",
              id: `ad-${ad.id}-${index}`,
              ad,
            });

            adIndex += 1;
          }
        }
      );

      return items;
    }, [
      filteredAnimals,
      ads,
    ]);

  function goNext() {
    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );
  }

  const currentItem =
    swipeItems[
      currentIndex
    ];

  const currentAnimal =
    currentItem?.kind ===
    "animal"
      ? currentItem.animal
      : null;

  const currentAd =
    currentItem?.kind ===
    "ad"
      ? currentItem.ad
      : null;

  const filterCount =
    selectedTypes.length;

  return (
    <TauiPageBackground>
      <div className="relative min-h-[100dvh] w-full">

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
                onOpenFilter={() =>
                  setWelcomeOpen(
                    true
                  )
                }
                filterCount={
                  filterCount
                }
              />
            )}

          {!loading &&
            currentAd && (
              <SwipeAdCard
                ad={currentAd}
                onNext={goNext}
                onOpenFilter={() =>
                  setWelcomeOpen(
                    true
                  )
                }
                filterCount={
                  filterCount
                }
              />
            )}

          {!loading &&
            !currentItem && (
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

                  <p className="mt-3 text-gray-600">
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

        <BottomMenu />

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

function SwipeAdCard({
  ad,
  onNext,
  onOpenFilter,
  filterCount,
}: {
  ad: Ad;
  onNext: () => void;
  onOpenFilter: () => void;
  filterCount: number;
}) {
  const [
    impressionSent,
    setImpressionSent,
  ] = useState(false);

  useEffect(() => {
    if (impressionSent) {
      return;
    }

    window.setTimeout(
      () => setImpressionSent(true),
      0
    );

    void supabase.rpc(
      "track_ad_impression",
      {
        p_ad_id: ad.id,
      }
    );
  }, [ad.id, impressionSent]);

  async function handleClick() {
    try {
      await supabase.rpc(
        "track_ad_click",
        {
          p_ad_id: ad.id,
        }
      );
    } catch (error) {
      console.error(
        "Erreur tracking clic publicité :",
        error
      );
    }

    if (ad.target_url) {
      window.open(
        ad.target_url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  return (
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        px-0
        pb-0
        pt-0
        sm:px-4
        sm:pb-[122px]
        sm:pt-2
        md:px-6
        lg:px-8
      "
    >
      <article
        className="
          relative
          isolate
          h-[calc(100dvh-64px)]
          min-h-[620px]
          max-h-none
          w-full
          max-w-[455px]
          overflow-hidden
          rounded-none
          bg-[#d9d4cf]
          shadow-[0_18px_45px_rgba(40,30,25,.22)]
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
        "
      >
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-[#064b42]
              to-[#0a796b]
              px-10
              text-center
              text-white
            "
          >
            <div>
              <div className="text-7xl">✨</div>
              <h2 className="mt-5 text-4xl font-black">
                {ad.title}
              </h2>
            </div>
          </div>
        )}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-[58%]
            bg-gradient-to-t
            from-black/90
            via-black/45
            to-transparent
          "
        />

        <div
          className="
            absolute
            left-4
            top-4
            z-40
            rounded-full
            border
            border-white/80
            bg-white/95
            px-4
            py-2
            text-[11px]
            font-black
            uppercase
            tracking-[0.12em]
            text-[#064b42]
            shadow-lg
            backdrop-blur-xl
          "
        >
          Sponsorisé
        </div>

        <div
          className="
            absolute
            inset-x-0
            bottom-[118px]
            z-40
            px-5
            text-white
            sm:bottom-0
            sm:px-6
            sm:pb-7
          "
        >
          <div className="flex items-center gap-3">
            {ad.logo_url ? (
              <img
                src={ad.logo_url}
                alt={ad.advertiser_name}
                draggable={false}
                className="h-14 w-14 rounded-full border-[3px] border-white bg-white object-contain p-1 shadow-xl"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-white/95 text-2xl shadow-xl">
                ✨
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
                Sponsorisé
              </p>

              <p className="mt-0.5 truncate text-sm font-black uppercase">
                {ad.advertiser_name}
              </p>
            </div>
          </div>

          <h2
            className="
              mt-4
              max-w-[88%]
              break-words
              text-[34px]
              font-black
              leading-[0.95]
              tracking-tight
              drop-shadow-lg
              sm:text-[40px]
              md:text-[44px]
            "
          >
            {ad.title}
          </h2>

          {ad.description && (
            <p className="mt-3 max-w-[92%] text-sm leading-5 text-white/90 sm:text-base sm:leading-6">
              {ad.description}
            </p>
          )}

          {ad.target_url && (
            <button
              type="button"
              onClick={handleClick}
              className="
                mt-4
                inline-flex
                min-h-[44px]
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-white/95
                px-5
                py-3
                text-sm
                font-black
                text-[#064b42]
                shadow-xl
                backdrop-blur
                transition
                active:scale-95
              "
            >
              {ad.button_text || "Découvrir"}
            </button>
          )}
        </div>
      </article>

      <div
        className="
          relative
          z-[70]
          -mt-[108px]
          grid
          w-full
          max-w-[455px]
          grid-cols-2
          gap-3
          px-4
          sm:mt-3
          sm:max-w-[520px]
          sm:px-4
          md:max-w-[560px]
          lg:max-w-[620px]
        "
      >
        <button
          type="button"
          onClick={onNext}
          className="
            min-h-[52px]
            rounded-full
            border-2
            border-white
            bg-white/95
            px-5
            py-3
            text-base
            font-black
            text-[#746c66]
            shadow-xl
            backdrop-blur
            transition
            active:scale-95
          "
        >
          ← Next time
        </button>

        <button
          type="button"
          onClick={onOpenFilter}
          className="
            min-h-[52px]
            rounded-full
            border-2
            border-white
            bg-[#f3e7df]/95
            px-5
            py-3
            text-base
            font-black
            text-[#064b42]
            shadow-xl
            backdrop-blur
            transition
            active:scale-95
          "
        >
          Filtres
          {filterCount > 0
            ? ` (${filterCount})`
            : ""}
        </button>
      </div>
    </div>
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
        min-h-[100dvh]
        items-center
        justify-center
        overflow-y-auto
        bg-[#332c29]/40
        px-3
        py-3
        backdrop-blur-[7px]
        sm:px-4
        sm:py-5
      "
    >
      <div
        className="
          relative
          my-auto
          w-full
          max-w-[430px]
          max-h-[calc(100dvh-24px)]
          overflow-y-auto
          rounded-[30px]
          border
          border-white/70
          bg-[#fffaf7]/95
          shadow-[0_30px_100px_rgba(38,30,27,.30)]
          backdrop-blur-2xl
          sm:rounded-[36px]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-40
            w-40
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
            h-48
            w-48
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
            right-3
            top-3
            z-20
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-white/80
            text-base
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
            px-4
            pb-4
            pt-3
            sm:px-6
            sm:pb-6
            sm:pt-5
          "
        >
          <div className="text-center">
            <img
              src="/logo-taui-te-ora.png"
              alt="Taui Te Ora"
              className="
                mx-auto
                h-[66px]
                w-[66px]
                object-contain
                sm:h-20
                sm:w-20
              "
            />

            <p
              className="
                mt-0.5
                text-[8px]
                font-black
                uppercase
                tracking-[0.22em]
                text-[#df8995]
                sm:text-[10px]
              "
            >
              Une rencontre peut tout changer
            </p>

            <h1
              className="
                mx-auto
                mt-2
                max-w-[330px]
                text-[22px]
                font-black
                leading-[1.08]
                tracking-tight
                text-[#064b42]
                sm:text-[26px]
              "
            >
              Et si quelqu&apos;un
              vous attendait déjà ?
            </h1>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-[320px]
                text-[12px]
                leading-snug
                text-[#746c66]
                sm:text-[13px]
              "
            >
              Dites-nous simplement qui
              vous aimeriez rencontrer.
            </p>
          </div>

          <div className="mt-4 sm:mt-5">
            <p
              className="
                text-center
                text-[13px]
                font-black
                text-[#064b42]
                sm:text-sm
              "
            >
              Je veux adopter…
            </p>

            <div
              className="
                mt-2.5
                grid
                grid-cols-2
                gap-2
                sm:gap-3
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
                      key={option.type}
                      type="button"
                      onClick={() =>
                        toggleAnimalType(
                          option.type
                        )
                      }
                      className={`
                        relative
                        flex
                        min-h-[66px]
                        flex-col
                        items-center
                        justify-center
                        rounded-[19px]
                        border-2
                        px-2
                        py-2
                        transition
                        active:scale-[.98]
                        sm:min-h-[78px]
                        ${
                          selected
                            ? "border-[#ef8196] bg-[#fff0f2]"
                            : "border-[#eee3dd] bg-white/80"
                        }
                      `}
                    >
                      {selected && (
                        <span
                          className="
                            absolute
                            right-2
                            top-2
                            flex
                            h-4
                            w-4
                            items-center
                            justify-center
                            rounded-full
                            bg-[#ef8196]
                            text-[8px]
                            font-black
                            text-white
                          "
                        >
                          ✓
                        </span>
                      )}

                      <span className="text-[27px] leading-none">
                        {option.icon}
                      </span>

                      <span
                        className={`
                          mt-1
                          text-[11px]
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
                mt-2
                text-center
                text-[9px]
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
              mt-3
              w-full
              rounded-full
              bg-[#ef8196]
              px-5
              py-3
              text-[14px]
              font-black
              text-white
              shadow-lg
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
                mt-1
                w-full
                py-1
                text-[9px]
                font-bold
                text-[#8b817a]
                underline
              "
            >
              Voir tous les animaux
            </button>
          )}

          <div
            className="
              mt-2.5
              flex
              items-center
              justify-center
              gap-3
              rounded-[16px]
              bg-[#f7f1ec]
              px-3
              py-2
            "
          >
            <span
              className="
                text-[9px]
                font-bold
                text-[#df687c]
              "
            >
              → ❤️ Coup de cœur
            </span>

            <span
              className="
                h-3
                w-px
                bg-[#dcd1ca]
              "
            />

            <span
              className="
                text-[9px]
                font-bold
                text-[#746c66]
              "
            >
              ← Next time
            </span>
          </div>

          <div
            className="
              mt-3
              border-t
              border-[#eadfd8]
              pt-3
              text-center
            "
          >
            <p
              className="
                text-[10px]
                font-bold
                text-[#756d67]
              "
            >
              Association, refuge, SIGFA,
              bénévole ou fourrière ?
            </p>

            <p
              className="
                mt-0.5
                text-[9px]
                text-[#9a918a]
              "
            >
              Accédez directement à votre espace.
            </p>

            <div
              className="
                mt-2.5
                grid
                grid-cols-2
                gap-2
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
                  px-3
                  py-2.5
                  text-[10px]
                  font-black
                  text-[#064b42]
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
                  px-3
                  py-2.5
                  text-[10px]
                  font-black
                  text-white
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
   MENU BAS
========================================================= */

function getProfileDestination(role: unknown) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  switch (normalizedRole) {
    case "admin":
    case "administrateur":
      return "/admin/dashboard";

    case "association":
      return "/association/dashboard";

    case "refuge":
      return "/refuge/dashboard";

    case "fourriere":
    case "sigfa":
      return "/fourriere/dashboard";

    case "benevole":
    case "famille_accueil":
    case "famille_d_accueil":
      return "/benevole/dashboard";

    case "adoptant":
    case "utilisateur":
      return "/dashboard";

    default:
      return "/profile";
  }
}

function BottomMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileHref, setProfileHref] =
    useState("/profile");
  const [profilePhoto, setProfilePhoto] =
    useState<string | null>(null);
  const [
    dynamicMenuPages,
    setDynamicMenuPages,
  ] = useState<
    {
      label: string;
      href: string;
      icon: string;
      sortOrder: number;
    }[]
  >([]);

  const systemMenuPages = useMemo(
    () => [
      {
        slug: "arpap",
        label: "ARPAP",
        href: "/arpap",
        icon: "🐾",
        sortOrder: 10,
      },
      {
        slug: "info",
        label: "Info",
        href: "/info",
        icon: "ℹ️",
        sortOrder: 20,
      },
      {
        slug: "associations",
        label: "Associations",
        href: "/associations",
        icon: "🤝",
        sortOrder: 30,
      },
      {
        slug: "les-veilleurs-de-kali",
        label: "Les Veilleurs de Kali",
        href: "/association/lesveilleursdekali",
        icon: "🐾",
        sortOrder: 40,
      },
      {
        slug: "signalements",
        label: "Signalements",
        href: "/signalements",
        icon: "🚨",
        sortOrder: 50,
      },
      {
        slug: "evenements",
        label: "Événements",
        href: "/evenements",
        icon: "📅",
        sortOrder: 60,
      },
      {
        slug: "balades",
        label: "Balades & Copains",
        href: "/balades",
        icon: "🐕",
        sortOrder: 70,
      },
      {
        slug: "dons",
        label: "Dons",
        href: "/dons",
        icon: "💝",
        sortOrder: 80,
      },
      {
        slug: "boutique",
        label: "Boutique",
        href: "/boutique",
        icon: "🛍️",
        sortOrder: 90,
      },
      {
        slug: "veterinaires",
        label: "Vétérinaires",
        href: "/veterinaires",
        icon: "🩺",
        sortOrder: 100,
      },
      {
        slug: "conseils-sante",
        label: "Conseils santé",
        href: "/conseils-sante",
        icon: "❤️‍🩹",
        sortOrder: 110,
      },
      {
        slug: "alimentation",
        label: "Alimentation",
        href: "/alimentation",
        icon: "🥣",
        sortOrder: 120,
      },
      {
        slug: "education",
        label: "Éducation",
        href: "/education",
        icon: "🎓",
        sortOrder: 130,
      },
      {
        slug: "toilettage",
        label: "Toilettage",
        href: "/toilettage",
        icon: "✂️",
        sortOrder: 140,
      },
      {
        slug: "gardiennage",
        label: "Gardiennage",
        href: "/gardiennage",
        icon: "🏡",
        sortOrder: 150,
      },
      {
        slug: "pension",
        label: "Pension",
        href: "/pension",
        icon: "🛏️",
        sortOrder: 160,
      },
      {
        slug: "hommage",
        label: "Hommage",
        href: "/hommage",
        icon: "🕯️",
        sortOrder: 170,
      },
    ],
    []
  );

  useEffect(() => {
    let active = true;

    async function loadProfileDestination() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active || !user) {
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Erreur chargement destination profil :",
            error
          );
        }

        if (active) {
          setProfileHref(
            getProfileDestination(
              data?.role ?? user.user_metadata?.role
            )
          );

          const avatar =
            data?.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          setProfilePhoto(
            typeof avatar === "string" && avatar.trim()
              ? avatar.trim()
              : null
          );
        }
      } catch (error) {
        console.error(
          "Erreur destination profil :",
          error
        );
      }
    }

    void loadProfileDestination();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDynamicMenuPages() {
      const { data, error } = await supabase
        .from("site_pages")
        .select(
          "slug, menu_label, menu_icon, sort_order"
        )
        .eq("is_published", true)
        .eq("show_in_menu", true)
        .order("sort_order", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Erreur chargement menu dynamique :",
          error
        );
        return;
      }

      if (!active) {
        return;
      }

      const systemSlugs = new Set(
        systemMenuPages.map(
          (page) => page.slug
        )
      );

      const pages = (data || [])
        .filter(
          (page) =>
            page.slug &&
            !systemSlugs.has(
              String(page.slug)
                .trim()
                .toLowerCase()
            )
        )
        .map((page) => ({
          label:
            String(
              page.menu_label ||
                page.slug
            ).trim(),
          href:
            `/pages/${encodeURIComponent(
              String(page.slug).trim()
            )}`,
          icon:
            String(
              page.menu_icon || "📄"
            ).trim() || "📄",
          sortOrder:
            Number(page.sort_order) ||
            1000,
        }));

      setDynamicMenuPages(pages);
    }

    void loadDynamicMenuPages();

    return () => {
      active = false;
    };
  }, [systemMenuPages]);

  const menuPages = [
    ...systemMenuPages.map(
      ({
        slug: _slug,
        ...page
      }) => page
    ),
    ...dynamicMenuPages,
  ].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder
  );

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[400] bg-black/35 backdrop-blur-[4px]">
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Fermer le menu"
            className="absolute inset-0 h-full w-full"
          />

          <div className="absolute bottom-[82px] left-3 right-3 z-10 mx-auto max-h-[75dvh] max-w-[440px] overflow-y-auto rounded-[30px] border border-white/70 bg-[#fffaf7]/98 p-5 shadow-[0_25px_70px_rgba(0,0,0,.25)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#df8995]">
                  Taui Te Ora
                </p>

                <h2 className="mt-1 text-xl font-black text-[#064b42]">
                  Menu
                </h2>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-[#6f665f] shadow-sm"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {menuPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={closeMenu}
                  className="flex min-h-[92px] flex-col items-center justify-center rounded-[22px] border border-[#eadfd8] bg-white px-3 py-4 text-center shadow-sm transition active:scale-[.98]"
                >
                  <span className="text-3xl leading-none">
                    {page.icon}
                  </span>

                  <span className="mt-2 text-[12px] font-black text-[#064b42]">
                    {page.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-[470px] border-t border-[#eadfd8] bg-[#fffaf7]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(50,40,35,0.10)] backdrop-blur-xl md:bottom-4 md:rounded-[28px] md:border">
        <div className="grid grid-cols-5 items-end">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 text-[#ee8f9b]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fde7e9]">
              <HomeIcon />
            </div>

            <span className="text-[10px] font-bold">
              Accueil
            </span>
          </Link>

          <Link
            href="/search"
            className="flex flex-col items-center justify-center gap-1 text-[#5d655f]"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <SearchIcon />
            </div>

            <span className="text-[10px] font-semibold">
              Recherche
            </span>
          </Link>

          <Link
            href="/signalement"
            aria-label="S.O.S Animal"
            className="flex flex-col items-center justify-center"
          >
            <div className="flex h-[60px] w-[60px] -translate-y-2 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#fffaf7] bg-white shadow-xl">
              <img
                src="/sos-paw.png"
                alt="S.O.S Animal"
                draggable={false}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (previous) =>
                  !previous
              )
            }
            aria-label="Ouvrir le menu"
            className={`flex flex-col items-center justify-center gap-1 ${
              menuOpen
                ? "text-[#ee8f9b]"
                : "text-[#5d655f]"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                menuOpen
                  ? "bg-[#fde7e9]"
                  : ""
              }`}
            >
              <MenuIcon />
            </div>

            <span className="text-[10px] font-semibold">
              Menu
            </span>
          </button>

          <Link
            href={profileHref}
            className="flex flex-col items-center justify-center gap-1 text-[#5d655f]"
          >
            {profilePhoto ? (
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#eadfd8] bg-white shadow-sm">
                <img
                  src={profilePhoto}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center">
                <ProfileIcon />
              </div>
            )}

            <span className="text-[10px] font-semibold">
              Profil
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
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
      <circle cx="11" cy="11" r="7" />
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
      <circle cx="12" cy="12" r="9" />
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-4.1 3.5-6.5 7.5-6.5s6.7 2.4 7.5 6.5" />
    </svg>
  );
}
