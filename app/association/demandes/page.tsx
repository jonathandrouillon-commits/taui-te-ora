"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Demande = {
  id: string;
  animal_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
  message: string | null;
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("adoption_requests")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDemandes(data || []);
    } catch (error) {
      console.error(error);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(status: string) {
    if (status === "pending") return "Nouvelle";
    if (status === "accepted") return "Acceptée";
    if (status === "refused") return "Refusée";
    return status || "Nouvelle";
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
                      {getStatusLabel(demande.status)}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Demande d’adoption
                    </h2>

                    <p className="mt-2 line-clamp-3 text-gray-600">
                      {demande.message || "Aucun message renseigné."}
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