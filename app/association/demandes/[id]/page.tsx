"use client";

import { useParams, useRouter } from "next/navigation";

export default function AssociationDemandeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-2xl bg-[#f4eee3] px-5 py-3 font-bold"
        >
          ← Retour
        </button>

        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
          Demande adoption
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Détail de la demande
        </h1>

        <div className="mt-6 rounded-2xl bg-[#f4eee3] p-4 font-bold">
          ID demande : {id}
        </div>

        <p className="mt-6 text-gray-600">
          La connexion complète aux données de la demande sera ajoutée à l’étape suivante.
        </p>
      </section>
    </main>
  );
}