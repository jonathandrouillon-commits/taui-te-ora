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
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] text-[#064b42]">
        <p className="text-xl font-black">Chargement des animaux...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-36 pt-6">
      {/* IMAGE DE FOND */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/tropical-bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      {/* SWIPECARD + BOUTONS */}
      <section className="relative z-10 flex justify-center">
        {currentAnimal ? (
          <AnimalSwipeCard
            animal={currentAnimal}
            onPass={goNext}
            onFavorite={goNext}
          />
        ) : (
          <div className="flex h-[520px] w-full max-w-md flex-col items-center justify-center rounded-[2.5rem] bg-white/90 p-8 text-center shadow-2xl backdrop-blur">
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