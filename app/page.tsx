"use client";

import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import { animalService } from "./services/animal.service";

export default function Home() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    try {
      const data = await animalService.getPublishedWithPhotos();
      setAnimals(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const animal = animals[index];
  const nextAnimal =
    animals.length > 1 ? animals[(index + 1) % animals.length] : undefined;

  function goNext(text: string) {
    setMessage(text);

    setTimeout(() => {
      setIndex((prev) => (prev + 1 >= animals.length ? 0 : prev + 1));
      setDrag(0);
      setMessage("");
    }, 650);
  }

  function handleEnd() {
    if (drag > 130) goNext("❤️ Coup de cœur ajouté");
    else if (drag < -130) goNext("Profil passé");
    else setDrag(0);

    setStartX(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center text-[#064b42] font-black">
        Chargement des animaux...
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center p-8 text-center">
        <div className="bg-white rounded-[32px] p-10 shadow-xl max-w-xl">
          <h1 className="text-4xl font-black text-[#064b42]">
            Aucun animal publié
          </h1>
          <p className="mt-4 text-gray-500">
            Publie un animal depuis le dashboard association pour le voir ici.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#063f38] px-6 py-8 pb-32 overflow-hidden">
      <section className="mx-auto max-w-7xl mb-8">
        <h1 className="text-5xl font-black text-[#064b42]">
          Découvrir les animaux
        </h1>
        <p className="mt-2 text-gray-500 text-lg">
          Swipe à droite pour un coup de cœur, à gauche pour passer.
        </p>
      </section>

      <AnimalSwipeCard
        animal={animal}
        nextAnimal={nextAnimal}
        index={index}
        total={animals.length}
        drag={drag}
        startX={startX}
        message={message}
        setDrag={setDrag}
        setStartX={setStartX}
        handleEnd={handleEnd}
        goNext={goNext}
      />
    </main>
  );
}