"use client";

import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import { animalService } from "./services/animal.service";

export default function Home() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Tous");

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    filterAnimals();
  }, [category, animals]);

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

  function filterAnimals() {
    if (category === "Tous") {
      setFilteredAnimals(animals);
    } else {
      setFilteredAnimals(
        animals.filter(
          (animal) =>
            animal.animal_type?.toLowerCase() === category.toLowerCase()
        )
      );
    }

    setIndex(0);
  }

  const animal = filteredAnimals[index];
  const nextAnimal =
    filteredAnimals.length > 1
      ? filteredAnimals[(index + 1) % filteredAnimals.length]
      : undefined;

  function goNext(text: string) {
    setMessage(text);

    setTimeout(() => {
      setIndex((prev) =>
        prev + 1 >= filteredAnimals.length ? 0 : prev + 1
      );
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

  const categories = ["Tous", "Chien", "Chat", "Autre"];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement des animaux...
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ef] px-6 py-8 pb-32 text-[#063f38]">
      <section className="mx-auto mb-10 max-w-7xl text-center">
        <h1 className="text-5xl font-black text-[#064b42]">
          On ne sauvera pas le monde, 
          mais on sauvera le leur
        </h1>


        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-6 py-3 font-black transition ${
                category === item
                  ? "bg-[#064b42] text-white shadow-lg"
                  : "bg-white text-[#064b42] shadow"
              }`}
            >
              {item === "Chien" && "🐶 "}
              {item === "Chat" && "🐱 "}
              {item === "Autre" && "🐾 "}
              {item}
            </button>
          ))}
        </div>
      </section>

      {!animal ? (
        <section className="mx-auto max-w-xl rounded-[32px] bg-white p-10 text-center shadow-xl">
          <h2 className="text-4xl font-black text-[#064b42]">
            Aucun animal trouvé
          </h2>

          <p className="mt-4 text-gray-500">
            Aucun animal publié dans cette catégorie pour le moment.
          </p>
        </section>
      ) : (
        <AnimalSwipeCard
          animal={animal}
          nextAnimal={nextAnimal}
          index={index}
          total={filteredAnimals.length}
          drag={drag}
          startX={startX}
          message={message}
          setDrag={setDrag}
          setStartX={setStartX}
          handleEnd={handleEnd}
          goNext={goNext}
        />
      )}
    </main>
  );
}