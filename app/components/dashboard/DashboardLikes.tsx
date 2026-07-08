"use client";

import Link from "next/link";
import type { Like } from "../../lib/dashboard";

type DashboardLikesProps = {
  likes: Like[];
};

export default function DashboardLikes({ likes }: DashboardLikesProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Mes animaux likés ❤️
      </h2>

      {likes.length === 0 ? (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Tu n'as pas encore liké d'animal.
          </p>

          <Link
            href="/adoption"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
          >
            Voir les animaux
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {likes.map((like) => {
            const animal = like.animals;
            const animalName = animal?.animal_name || "Animal";
            const animalSubtitle = `${animal?.animal_type || "Animal"} · ${
              animal?.age_label || "Âge non renseigné"
            } · ${animal?.sex || "Sexe non renseigné"}`;

            return (
              <div
                key={like.id}
                className="overflow-hidden rounded-[1.7rem] border border-[#eadfce] bg-[#f8f4ec]"
              >
                <div className="flex h-56 items-center justify-center bg-[#eadfce] text-5xl">
                  🐶
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#2f241c]">
                    {animalName}
                  </h3>

                  <p className="mt-1 text-sm text-[#6f5a47]">
                    {animalSubtitle}
                  </p>

                  <p className="mt-1 text-sm text-[#9c7b54]">
                    {animal?.association_name || "Association non renseignée"}
                  </p>

                  <p className="mt-1 text-sm text-[#6f5a47]">
                    {animal?.city || "Ville non renseignée"} ·{" "}
                    {animal?.island || "Île non renseignée"}
                  </p>

                  {animal?.id && (
                    <Link
                      href={`/animal/${animal.id}`}
                      className="mt-4 inline-block rounded-full bg-[#2f241c] px-5 py-2 text-sm font-semibold text-white"
                    >
                      Voir le profil
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}