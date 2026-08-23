"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import TauiPageBackground from "./components/ui/TauiPageBackground";
import { animalService } from "./services/animal.service";

export default function HomePage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    try {
      setLoading(true);

      const data = await animalService.getPublishedWithPhotos();

      setAnimals(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Erreur chargement animaux :", error);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  const currentAnimal = animals[currentIndex];

  return (
    <TauiPageBackground>
      <div className="relative min-h-[100dvh] w-full">
        <section className="flex min-h-[calc(100dvh-74px)] w-full items-start justify-center p-0 md:px-6 md:py-8">
          {loading && (
            <div className="flex min-h-[calc(100dvh-74px)] w-full items-center justify-center">
              <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-md">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

                <p className="mt-4 font-bold text-[#667568]">
                  Chargement des animaux...
                </p>
              </div>
            </div>
          )}

          {!loading && currentAnimal && (
            <AnimalSwipeCard
              animal={currentAnimal}
              onPass={goNext}
              onFavorite={goNext}
            />
          )}

          {!loading && !currentAnimal && (
            <div className="flex min-h-[calc(100dvh-74px)] w-full items-center justify-center px-5">
              <div className="max-w-md rounded-[32px] bg-white/90 p-8 text-center shadow-xl backdrop-blur-md">
                <div className="text-6xl">🐾</div>

                <h2 className="mt-4 text-2xl font-black text-[#667568]">
                  Aucun autre animal à afficher
                </h2>

                <p className="mt-3 text-gray-600">
                  Revenez prochainement pour découvrir de nouveaux animaux à
                  adopter.
                </p>

                <button
                  type="button"
                  onClick={loadAnimals}
                  className="mt-6 rounded-full bg-[#ef919b] px-6 py-3 font-black text-white shadow-lg transition hover:scale-105"
                >
                  Recommencer
                </button>
              </div>
            </div>
          )}
        </section>

        <BottomMenu />
      </div>
    </TauiPageBackground>
  );
}

function BottomMenu() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-[470px] border-t border-[#eadfd8] bg-[#fffaf7]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(50,40,35,0.10)] backdrop-blur-xl md:bottom-4 md:rounded-[28px] md:border md:shadow-xl">
      <div className="grid grid-cols-4 items-end">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f2ece7]">
            <SearchIcon />
          </div>

          <span className="text-[10px] font-semibold">
            Search
          </span>
        </Link>

        <Link
          href="/signalement"
          className="flex flex-col items-center justify-center gap-1"
        >
          <div className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full border-4 border-[#fffaf7] bg-[#ef919b] text-white shadow-lg">
            <PawIcon />
          </div>

          <span className="-mt-2 text-[10px] font-bold text-[#ef7f8d]">
            Signaler
          </span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center justify-center gap-1 text-[#5d655f]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f2ece7]">
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

function PawIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="currentColor"
    >
      <ellipse cx="7" cy="7" rx="2.2" ry="3" />
      <ellipse cx="17" cy="7" rx="2.2" ry="3" />
      <ellipse cx="4.5" cy="12" rx="2" ry="2.7" />
      <ellipse cx="19.5" cy="12" rx="2" ry="2.7" />
      <path d="M12 10.5c-3.4 0-6 3.1-6 6 0 2.1 1.5 3.5 3.3 3.5 1 0 1.8-.5 2.7-.5s1.7.5 2.7.5c1.8 0 3.3-1.4 3.3-3.5 0-2.9-2.6-6-6-6Z" />
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