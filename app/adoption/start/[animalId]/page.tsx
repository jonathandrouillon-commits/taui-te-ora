"use client";

import { useParams, useRouter } from "next/navigation";

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();
  const animalId = String(params.animalId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] px-4 text-[#064b42]">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#b68b2f] text-4xl">
          🐾
        </div>

        <h1 className="text-3xl font-black">Je veux adopter</h1>

        <p className="mt-4 text-gray-600">
          Avant d’envoyer une demande d’adoption, nous allons créer ou compléter
          votre profil adoptant.
        </p>

        <div className="mt-6 rounded-2xl bg-[#f4eee3] p-4 text-sm font-bold">
          Animal concerné : {animalId}
        </div>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => router.push(`/adoptant/profile?animalId=${animalId}`)}
            className="rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white shadow"
          >
            Commencer mon profil adoptant
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl bg-white px-5 py-3 font-bold text-[#064b42] shadow"
          >
            Retour
          </button>
        </div>
      </section>
    </main>
  );
}