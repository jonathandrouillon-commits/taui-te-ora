"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cgzsckmuxtieylayzqcc.supabase.co",
  "sb_publishable_H5AJ-SiWgsc2Yk4Fb64ssQ_T_GjoiuI"
);

export default function Home() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAnimals() {
      const { data: animalsData } = await supabase
        .from("animals")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      const { data: photosData } = await supabase.from("animal_photos").select("*");

      const animalsWithPhotos =
        animalsData?.map((animal) => {
          const photo =
            photosData?.find(
              (p) => p.animal_id === animal.id && p.is_cover === true
            ) || photosData?.find((p) => p.animal_id === animal.id);

          return {
            ...animal,
            photo_url:
              photo?.photo_url ||
              "https://cgzsckmuxtieylayzqcc.supabase.co/storage/v1/object/public/animals/dogs/504345865_4147925288771856_2097286045803791142_n.jpg",
          };
        }) || [];

      setAnimals(animalsWithPhotos);
    }

    loadAnimals();
  }, []);

  const animal = animals[index];
  const next = animals[(index + 1) % animals.length];

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

  if (!animal) {
    return (
      <main className="min-h-screen bg-[#f8f1e8] flex items-center justify-center text-[#123f35] font-black">
        Chargement des animaux...
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#d8f4ea_0,#f8f1e8_38%,#f4eadb_100%)] text-[#123f35] px-5 py-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/80 rounded-3xl p-2 shadow-xl">
            <Image src="/logo.png" alt="TAUI TE ORA" width={82} height={82} />
          </div>

          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-wide leading-none">
              TAUI TE ORA
            </h1>
            <p className="text-[#c8944a] font-black tracking-widest text-xs md:text-sm mt-2">
              UN NOUVEL ESPOIR, UNE NOUVELLE FAMILLE
            </p>
          </div>
        </div>

        <button className="bg-[#0f5b4f] text-white px-5 py-3 rounded-full font-black shadow-xl">
          Filtres
        </button>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/85 backdrop-blur rounded-3xl p-5 shadow-xl">
          <p className="text-sm opacity-60 font-bold">Animaux à adopter</p>
          <p className="text-4xl font-black">{animals.length}</p>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-3xl p-5 shadow-xl md:col-span-2">
          <p className="text-lg md:text-xl font-black">
            Chaque swipe peut changer une vie.
          </p>
          <p className="opacity-70 font-semibold mt-1">
            Glisse à droite pour un coup de cœur, à gauche pour passer.
          </p>
        </div>
      </section>

      <section className="max-w-md mx-auto relative">
        {next && (
          <div className="absolute inset-x-4 top-6 h-[68vh] min-h-[560px] max-h-[720px] rounded-[38px] overflow-hidden bg-black shadow-xl scale-[0.94] opacity-45 blur-[1px]">
            <img
              src={next.photo_url}
              alt={next.animal_name}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center", transform: "scale(1.04)" }}
            />
          </div>
        )}

        <div
          className="relative rounded-[38px] overflow-hidden shadow-2xl bg-black h-[68vh] min-h-[560px] max-h-[720px] select-none cursor-grab"
          style={{
            transform: `translateX(${drag}px) rotate(${drag * 0.045}deg) scale(${
              startX !== null ? 1.015 : 1
            })`,
            transition: startX === null ? "0.28s ease" : "none",
          }}
          onMouseDown={(e) => setStartX(e.clientX)}
          onMouseMove={(e) => {
            if (startX !== null) setDrag(e.clientX - startX);
          }}
          onMouseUp={handleEnd}
          onMouseLeave={() => startX !== null && handleEnd()}
          onTouchStart={(e) => setStartX(e.touches[0].clientX)}
          onTouchMove={(e) => {
            if (startX !== null) setDrag(e.touches[0].clientX - startX);
          }}
          onTouchEnd={handleEnd}
        >
          <img
            src={animal.photo_url}
            alt={animal.animal_name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center", transform: "scale(1.05)" }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/90" />

          <div
            className="absolute top-20 right-8 border-4 border-[#31d3bd] text-[#31d3bd] text-3xl font-black px-5 py-3 rounded-2xl rotate-12 bg-black/15 backdrop-blur"
            style={{ opacity: drag > 60 ? Math.min(drag / 160, 1) : 0 }}
          >
            ADOPTER
          </div>

          <div
            className="absolute top-20 left-8 border-4 border-red-400 text-red-300 text-3xl font-black px-5 py-3 rounded-2xl -rotate-12 bg-black/15 backdrop-blur"
            style={{ opacity: drag < -60 ? Math.min(Math.abs(drag) / 160, 1) : 0 }}
          >
            PASSER
          </div>

          <div className="absolute top-5 left-5 bg-white/90 rounded-full px-4 py-2 font-black shadow">
            {index + 1} / {animals.length}
          </div>

          <div className="absolute top-5 right-5 bg-[#0f5b4f]/90 text-white rounded-full px-4 py-2 font-black shadow">
            À ADOPTER
          </div>

          <div className="absolute bottom-0 p-7 text-white">
            <h2 className="text-5xl font-black mb-2">
              {animal.animal_name} ❤️
            </h2>

            <p className="text-lg font-bold mb-4">
              {animal.sex} • {animal.age_label} • {animal.size_label}
            </p>

            <div className="flex gap-2 flex-wrap mb-5">
              <span className="bg-white/90 text-[#123f35] px-3 py-1 rounded-full text-sm font-black">
                🐕 Sociable
              </span>
              <span className="bg-white/90 text-[#123f35] px-3 py-1 rounded-full text-sm font-black">
                💚 Douce
              </span>
              <span className="bg-white/90 text-[#123f35] px-3 py-1 rounded-full text-sm font-black">
                🌿 Calme
              </span>
            </div>

            <p className="leading-relaxed mb-5 line-clamp-4">
              {animal.description_character}
            </p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-black/40 rounded-2xl p-3 backdrop-blur">
                📍<br />
                {animal.island || "Tahiti"}
              </div>
              <div className="bg-black/40 rounded-2xl p-3 backdrop-blur">
                🏠<br />
                {animal.association_name || "Association"}
              </div>
              <div className="bg-black/40 rounded-2xl p-3 backdrop-blur">
                🛡️<br />
                {animal.health_status || "Santé"}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 bg-white rounded-2xl p-4 text-center font-black shadow-xl">
            {message}
          </div>
        )}

        <p className="text-center mt-5 text-lg italic font-semibold text-[#123f35]">
          Swipe à droite pour adopter →
        </p>

        <div className="flex justify-center gap-7 mt-7">
          <button
            onClick={() => goNext("Profil passé")}
            className="w-20 h-20 rounded-full bg-white shadow-xl text-5xl text-red-500 font-black"
          >
            ×
          </button>

          <button
            onClick={() => goNext("À voir plus tard")}
            className="w-16 h-16 rounded-full bg-white shadow-xl text-3xl text-[#c8944a] font-black mt-2"
          >
            ★
          </button>

          <button
            onClick={() => goNext("❤️ Coup de cœur ajouté")}
            className="w-20 h-20 rounded-full bg-white shadow-xl text-5xl text-[#0f8f7b] font-black"
          >
            ♥
          </button>
        </div>
      </section>
    </main>
  );
}