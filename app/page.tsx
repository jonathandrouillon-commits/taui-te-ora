"use client";

import { useState } from "react";
import { useAnimals } from "./hooks/useAnimals";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import BottomNavigation from "./components/BottomNavigation";

export default function Home() {
  const { animals, loading } = useAnimals();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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
    if (drag > 130) {
      goNext("❤️ Coup de cœur ajouté");
    } else if (drag < -130) {
      goNext("Profil passé");
    } else {
      setDrag(0);
    }

    setStartX(null);
  }

  if (loading || !animal) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center font-black text-[#064b42]">
        Chargement des animaux...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#063f38] px-6 py-6 pb-32 overflow-hidden">
      <Header />

      <Dashboard totalAnimals={animals.length} />

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

      <BottomNavigation />
    </main>
  );
}