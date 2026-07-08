"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Signalement = {
  id: string;
  created_at: string;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  situation: string | null;
  description: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  status: string | null;
};

const STATUS_OPTIONS = [
  "Signalement en attente",
  "Sauvetage en cours",
  "Animal Retrouvé",
  "Signalement Cloturé",
];

export default function AdminSignalementsPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadSignalements();
  }, []);

  async function loadSignalements() {
    try {
      setLoading(true);

      let query = supabase
        .from("signalements")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSignalements(data || []);
    } catch (error: any) {
      alert(error.message || "Erreur lors du chargement des signalements.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from("signalements")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setSignalements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error: any) {
      alert(error.message || "Erreur lors de la mise à jour.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-[#064b42]">
          🚨 Gestion des signalements
        </h1>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-2 block font-bold text-[#064b42]">
                Filtrer par statut
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
              >
                <option value="">Tous les signalements</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadSignalements}
              className="rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
            >
              Rechercher
            </button>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow">
              Chargement...
            </div>
          ) : signalements.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow">
              Aucun signalement trouvé.
            </div>
          ) : (
            <div className="grid gap-5">
              {signalements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[2rem] bg-white p-6 shadow-lg"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-[#064b42]">
                        {item.type_signalement || "Signalement"}
                      </h2>

                      <p className="mt-1 text-gray-600">
                        {item.animal_type || "Animal"} —{" "}
                        {item.animal_name || "Nom inconnu"}
                      </p>

                      <p className="mt-2 font-bold text-[#b58b5b]">
                        📍 {item.city || "Commune inconnue"} -{" "}
                        {item.island || "Île inconnue"}
                      </p>

                      {item.address && (
                        <p className="mt-1 text-gray-600">
                          Adresse : {item.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block font-bold text-[#064b42]">
                        Statut
                      </label>

                      <select
                        value={item.status || ""}
                        onChange={(e) =>
                          updateStatus(item.id, e.target.value)
                        }
                        className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
                      >
                        <option value="">Aucun statut</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Info title="Situation" value={item.situation} />
                    <Info title="Description" value={item.description} />
                    <Info title="Nom du déclarant" value={item.reporter_name} />
                    <Info title="Téléphone" value={item.reporter_phone} />
                    <Info title="Email" value={item.reporter_email} />
                    <Info
                      title="Date"
                      value={
                        item.created_at
                          ? new Date(item.created_at).toLocaleString("fr-FR")
                          : ""
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-[#faf7f2] p-4">
      <p className="text-sm font-black uppercase tracking-wide text-[#b58b5b]">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-line text-[#064b42]">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}