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
      setAnimals(data || []);
    } catch (error) {
      console.error(error);
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
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement des animaux...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-6">
      <header className="mx-auto mb-6 max-w-md text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
          Powered by Les Veilleurs de Kali
        </p>

        <h1 className="mt-2 text-4xl font-black text-[#064b42]">
          TAUI TE ORA
        </h1>

        <p className="mt-2 text-sm font-bold text-gray-600">
          Swipe gauche pour passer · Swipe droite pour coup de cœur
        </p>
      </header>

      <section className="flex justify-center">
        {currentAnimal ? (
          <AnimalSwipeCard
            animal={currentAnimal}
            onPass={goNext}
            onFavorite={goNext}
          />
        ) : (
          <div className="flex h-[520px] w-full max-w-md flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow">
            <div className="text-6xl">🐾</div>

            <h2 className="mt-4 text-2xl font-black text-[#064b42]">
              Plus aucun animal à afficher
            </h2>

            <p className="mt-3 text-gray-600">
              Revenez bientôt, de nouveaux profils seront ajoutés.
            </p>

            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                loadAnimals();
              }}
              className="mt-6 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white"
            >
              Recharger
            </button>
          </div>
        )}
      </section>
    </main>
  );
}