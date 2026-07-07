"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adoptionService } from "../../services/adoption.service";

type Demande = {
  id: string;
  animal_id: string;
  statut: string;
  motivation: string | null;
  created_at: string;
};

export default function AssociationDemandesPage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemandes();
  }, []);

  async function loadDemandes() {
    try {
      setLoading(true);
      const data = await adoptionService.getAssociationRequests();
      setDemandes(data || []);
    } catch (error) {
      console.error(error);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement des demandes...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
              Association
            </p>
            <h1 className="mt-2 text-4xl font-black">
              Demandes d’adoption
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/association/animals")}
            className="rounded-2xl bg-white px-5 py-3 font-bold shadow"
          >
            Mes animaux
          </button>
        </div>

        {demandes.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow">
            <div className="text-6xl">🐾</div>
            <h2 className="mt-4 text-2xl font-black">
              Aucune demande pour le moment
            </h2>
            <p className="mt-3 text-gray-600">
              Les demandes d’adoption apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <button
                key={demande.id}
                type="button"
                onClick={() =>
                  router.push(`/association/demandes/${demande.id}`)
                }
                className="block w-full rounded-3xl bg-white p-6 text-left shadow transition hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-[#b68b2f]">
                      {demande.statut || "nouvelle"}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Demande d’adoption
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {demande.motivation || "Aucune motivation renseignée."}
                    </p>

                    <p className="mt-3 text-xs font-bold text-gray-400">
                      {new Date(demande.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#f4eee3] px-4 py-2 font-black">
                    Voir
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}