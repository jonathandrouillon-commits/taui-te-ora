"use client";

import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import BottomNavigation from "./components/ui/BottomNavigation";
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
    setCurrentIndex((prev) => prev + 1);
  }

  const currentAnimal = animals[currentIndex];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F2E8] text-[#304032]">
        <p className="text-xl font-black">Chargement des animaux...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7F2E8] via-[#F3EADB] to-[#EDE0CC] px-4 pb-32 pt-4">
      <section className="flex justify-center">
        {currentAnimal ? (
          <AnimalSwipeCard
            animal={currentAnimal}
            onPass={goNext}
            onFavorite={goNext}
          />
        ) : (
          <div className="flex h-[520px] w-full max-w-md flex-col items-center justify-center rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="text-6xl">🐾</div>

            <h2 className="mt-4 text-2xl font-black text-[#4B5A3D]">
              Plus aucun animal à afficher
            </h2>

            <p className="mt-3 text-gray-600">
              Revenez bientôt, de nouveaux profils seront ajoutés.
            </p>

            <button
              type="button"
              onClick={loadAnimals}
              className="mt-6 rounded-2xl bg-[#6E7E5D] px-6 py-3 font-black text-white"
            >
              Recharger
            </button>
          </div>
        )}
      </section>

      <BottomNavigation />
    </main>
  );
}