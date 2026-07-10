"use client";

import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import { animalService } from "./services/animal.service";

export default function Home() {
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

      console.log("ANIMAUX PUBLIÉS CHARGÉS :", data);

      setAnimals(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error("ERREUR CHARGEMENT ANIMAUX :", error);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  const currentAnimal = animals[currentIndex];

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f4ec] px-4 pb-28">
        <BackgroundImage />

        <div className="relative z-10 rounded-3xl bg-white/85 px-8 py-6 text-center shadow-xl backdrop-blur">
          <div className="text-5xl">🐾</div>

          <p className="mt-4 text-xl font-black text-[#064b42]">
            Chargement des animaux...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-4 sm:pt-6">
      <BackgroundImage />

      <section className="relative z-10 flex justify-center">
        {currentAnimal ? (
          <AnimalSwipeCard
            key={currentAnimal.id || currentIndex}
            animal={currentAnimal}
            onPass={goNext}
            onFavorite={goNext}
          />
        ) : (
          <div className="flex min-h-[520px] w-full max-w-md flex-col items-center justify-center rounded-[2.5rem] border border-white/60 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-md">
            <div className="text-6xl">🐾</div>

            <h2 className="mt-4 text-2xl font-black text-[#4b5a3d]">
              Plus aucun animal à afficher
            </h2>

            <p className="mt-3 max-w-sm text-gray-600">
              Vous avez consulté tous les profils disponibles. Revenez bientôt
              pour découvrir de nouveaux animaux.
            </p>

            <button
              type="button"
              onClick={loadAnimals}
              className="mt-6 rounded-full bg-[#6e7e5d] px-7 py-3 font-black text-white shadow-lg transition hover:bg-[#5f6f50] active:scale-95"
            >
              Recommencer
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function BackgroundImage() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f8f4ec]">
      <img
        src="/tropical-bg.png"
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-white/10" />

      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5" />
    </div>
  );
}