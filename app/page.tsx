"use client";

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
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 pb-10 pt-8">
        <div className="mb-6 text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto h-24 w-24 object-contain drop-shadow-md md:h-32 md:w-32"
          />

          <h1 className="mt-3 text-4xl font-black text-[#064b42] md:text-6xl">
            TAUI TE ORA
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-[#5f5a52] md:text-lg">
            On ne changera pas le monde, mais on peut changer le leur.
          </p>
        </div>

        {loading && (
          <div className="mt-10 rounded-3xl border border-white/80 bg-white/85 px-8 py-6 text-center shadow-xl backdrop-blur-md">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8c4a8] border-t-[#064b42]" />

            <p className="mt-4 font-bold text-[#064b42]">
              Chargement des animaux...
            </p>
          </div>
        )}

        {!loading && currentAnimal && (
          <div className="w-full max-w-md">
            <AnimalSwipeCard
              animal={currentAnimal}
              onNext={goNext}
              onPass={goNext}
            />
          </div>
        )}

        {!loading && !currentAnimal && (
          <div className="mt-10 max-w-lg rounded-[32px] border border-white/80 bg-white/85 p-8 text-center shadow-xl backdrop-blur-md">
            <div className="text-6xl">🐾</div>

            <h2 className="mt-4 text-2xl font-black text-[#064b42]">
              Aucun autre animal à afficher
            </h2>

            <p className="mt-3 text-gray-600">
              Revenez prochainement pour découvrir de nouveaux animaux à
              adopter.
            </p>

            <button
              type="button"
              onClick={loadAnimals}
              className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white shadow-lg transition hover:scale-105 hover:bg-[#08695d]"
            >
              Recommencer
            </button>
          </div>
        )}
      </section>
    </TauiPageBackground>
  );
}