"use client";

import { useRouter } from "next/navigation";
import { Heart, X, Star, Info, Calendar, Venus, Mars } from "lucide-react";

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

const FALLBACK_IMAGE = "https://placehold.co/600x800?text=TAUI+TE+ORA";

function getImageUrl(url?: string) {
  if (!url || url.trim() === "") return FALLBACK_IMAGE;
  return url;
}

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

  const name = animal.animal_name || "Animal";
  const age = animal.age_label || "Âge inconnu";
  const sex = animal.sex || "Sexe inconnu";
  const isFemale = sex.toLowerCase().includes("femelle");

  return (
    <section className="relative mx-auto mt-6 max-w-7xl pb-40">
      {nextAnimal && (
        <div className="absolute right-10 top-28 hidden h-[620px] w-[390px] rotate-6 overflow-hidden rounded-[40px] bg-[#0f5d52] opacity-60 md:block">
          <img
            src={getImageUrl(nextAnimal.photo_url)}
            alt={nextAnimal.animal_name || "Animal"}
            className="h-full w-full object-cover opacity-35"
          />
        </div>
      )}

      <div
        className="relative mx-auto h-[720px] w-[90vw] max-w-[430px] cursor-grab overflow-hidden rounded-[42px] bg-black shadow-2xl"
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
          src={getImageUrl(animal.photo_url)}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        <div className="absolute left-6 top-6 z-20 rounded-2xl bg-white px-5 py-3 text-xl font-black text-[#064b42] shadow">
          {index + 1} / {total}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/animal/${animal.id}`)}
          className="absolute right-6 top-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#064b42] shadow-lg"
          aria-label="Voir les informations complètes"
        >
          <Info size={30} />
        </button>

        <div
          className="absolute right-8 top-36 rotate-12 rounded-2xl border-4 border-[#33d6c5] px-6 py-3 text-4xl font-black text-[#33d6c5]"
          style={{ opacity: drag > 60 ? Math.min(drag / 160, 1) : 0 }}
        >
          ADOPTER
        </div>

        <div
          className="absolute left-8 top-36 -rotate-12 rounded-2xl border-4 border-red-400 px-6 py-3 text-4xl font-black text-red-300"
          style={{
            opacity: drag < -60 ? Math.min(Math.abs(drag) / 160, 1) : 0,
          }}
        >
          PASSER
        </div>

        <div className="absolute bottom-10 left-7 right-7 z-20 text-white">
          <h2 className="mb-6 flex items-center gap-3 text-6xl font-black drop-shadow-lg">
            {name}
            <span className="text-red-400">♥</span>
          </h2>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#fff2cf] px-5 py-4 text-lg font-black uppercase text-[#6b4a16] shadow-md">
              <Calendar size={22} />
              {age}
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#ffe1e1] px-5 py-4 text-lg font-black uppercase text-[#9b2f2f] shadow-md">
              {isFemale ? <Venus size={24} /> : <Mars size={24} />}
              {sex}
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
          className="mt-4 flex items-center justify-center rounded-full bg-white p-5 text-[#c89a44] shadow-xl"
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