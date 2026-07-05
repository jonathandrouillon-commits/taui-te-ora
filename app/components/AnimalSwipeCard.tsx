"use client";

import { useRouter } from "next/navigation";
import {
  Heart,
  X,
  Star,
  Info,
  MapPin,
  Home,
  ShieldCheck,
} from "lucide-react";

type Props = {
  animal: any;
  nextAnimal?: any;
  index: number;
  total: number;
  drag: number;
  startX: number | null;
  message: string;
  setDrag: (value: number) => void;
  setStartX: (value: number | null) => void;
  handleEnd: () => void;
  goNext: (text: string) => void;
};

export default function AnimalSwipeCard({
  animal,
  nextAnimal,
  index,
  total,
  drag,
  startX,
  message,
  setDrag,
  setStartX,
  handleEnd,
  goNext,
}: Props) {
  const router = useRouter();

  return (
    <section className="relative mx-auto mt-6 max-w-7xl pb-40">
      <div className="absolute left-10 top-28 hidden h-[600px] w-[360px] -rotate-6 rounded-[40px] bg-red-300/25 md:block" />

      {nextAnimal && (
        <div className="absolute right-10 top-28 hidden h-[600px] w-[360px] rotate-6 overflow-hidden rounded-[40px] bg-[#0f5d52] opacity-70 md:block">
          <img
            src={nextAnimal.photo_url}
            alt={nextAnimal.animal_name}
            className="h-full w-full object-cover opacity-35"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rotate-12 rounded-2xl border-4 border-[#40e0c8] px-6 py-3 text-4xl font-black text-[#40e0c8]">
              ADOPTER
            </div>
          </div>
        </div>
      )}

      <div
        className="relative mx-auto h-[720px] w-[90vw] max-w-5xl cursor-grab overflow-hidden rounded-[42px] bg-black shadow-2xl"
        style={{
          transform: `translateX(${drag}px) rotate(${drag * 0.045}deg)`,
          transition:
            startX === null ? "0.32s cubic-bezier(.2,.8,.2,1)" : "none",
        }}
        onMouseDown={(e) => setStartX(e.clientX)}
        onMouseMove={(e) => startX !== null && setDrag(e.clientX - startX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => startX !== null && handleEnd()}
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchMove={(e) =>
          startX !== null && setDrag(e.touches[0].clientX - startX)
        }
        onTouchEnd={handleEnd}
      >
        <img
          src={animal.photo_url}
          alt={animal.animal_name}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center", transform: "scale(1.08)" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/90" />

        <div className="absolute left-7 top-6 rounded-full bg-white/90 px-6 py-3 text-xl font-black text-[#064b42] shadow">
          {index + 1} / {total}
        </div>

        <button
          onClick={() => router.push(`/animal/${animal.id}`)}
          className="absolute right-7 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#064b42] shadow-lg"
        >
          <Info size={30} />
        </button>

        <div
          className="absolute right-12 top-36 rotate-12 rounded-2xl border-4 border-[#33d6c5] px-7 py-4 text-5xl font-black text-[#33d6c5]"
          style={{ opacity: drag > 60 ? Math.min(drag / 160, 1) : 0 }}
        >
          ADOPTER
        </div>

        <div
          className="absolute left-12 top-36 -rotate-12 rounded-2xl border-4 border-red-400 px-7 py-4 text-5xl font-black text-red-300"
          style={{
            opacity: drag < -60 ? Math.min(Math.abs(drag) / 160, 1) : 0,
          }}
        >
          PASSER
        </div>

        <div className="absolute bottom-0 w-full p-10 text-white">
          <h2 className="mb-2 text-7xl font-black">
            {animal.animal_name} <span className="text-red-400">♥</span>
          </h2>

          <p className="mb-5 text-2xl font-bold">
            {animal.sex} • {animal.age_label} •{" "}
            {animal.size_label || "Taille moyenne"}
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#fff2cf] px-5 py-2 font-black text-[#6b4a16]">
              🐾 Sociable
            </span>
            <span className="rounded-full bg-[#ffe1e1] px-5 py-2 font-black text-[#9b2f2f]">
              ❤️ Douce
            </span>
            <span className="rounded-full bg-[#daf4ee] px-5 py-2 font-black text-[#064b42]">
              🌿 Calme
            </span>
            <span className="rounded-full bg-[#fff4d8] px-5 py-2 font-black text-[#7b5420]">
              😊 Affectueuse
            </span>
          </div>

          <p className="mb-6 max-w-4xl text-xl font-medium leading-relaxed">
            {animal.description_character}
          </p>

          <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-white/20 bg-black/35 backdrop-blur">
            <div className="flex items-center gap-4 border-r border-white/15 p-5">
              <MapPin size={34} className="text-[#16cabb]" />
              <span className="font-bold">{animal.island || "Tahiti"}</span>
            </div>

            <div className="flex items-center gap-4 border-r border-white/15 p-5">
              <Home size={34} className="text-[#16cabb]" />
              <span className="font-bold">
                {animal.association_name || "Association"}
              </span>
            </div>

            <div className="flex items-center gap-4 p-5">
              <ShieldCheck size={34} className="text-[#16cabb]" />
              <span className="font-bold">
                {animal.health_status || "Santé OK"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mx-auto mt-5 max-w-md rounded-2xl bg-white p-4 text-center font-black shadow-xl">
          {message}
        </div>
      )}

      <p className="mt-6 text-center text-2xl font-semibold italic text-[#064b42]">
        Swipe à droite pour adopter →
      </p>

      <div className="mt-8 flex justify-center gap-12">
        <button
          onClick={() => goNext("Profil passé")}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-red-500 shadow-xl"
        >
          <X size={54} />
        </button>

        <button
          onClick={() => goNext("À voir plus tard")}
          className="mt-4 flex h-18 w-18 items-center justify-center rounded-full bg-white p-5 text-[#c89a44] shadow-xl"
        >
          <Star size={38} fill="currentColor" />
        </button>

        <button
          onClick={() => goNext("❤️ Coup de cœur ajouté")}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#0f9f8d] shadow-xl"
        >
          <Heart size={54} fill="currentColor" />
        </button>
      </div>
    </section>
  );
}