"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { notificationService } from "../../../services/notification.service";

type Demande = {
  id: string;
  animal_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
  message: string | null;
  created_at: string;
};

export default function AssociationDemandeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [demande, setDemande] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadDemande();
  }, []);

  async function loadDemande() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("adoption_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setDemande(data);
    } catch (error) {
      console.error(error);
      alert("Impossible de charger cette demande.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: "accepted" | "refused") {
    if (!demande) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("adoption_requests")
        .update({ status })
        .eq("id", demande.id);

      if (error) throw error;

      await notificationService.create({
        user_id: demande.requester_id,
        type: "reponse_adoption",
        titre:
          status === "accepted"
            ? "Demande d'adoption acceptée"
            : "Demande d'adoption refusée",
        message:
          status === "accepted"
            ? "Bonne nouvelle, votre demande d’adoption a été acceptée."
            : "Votre demande d’adoption a été refusée.",
        animal_id: demande.animal_id,
        adoption_request_id: demande.id,
        lien: `/animal/${demande.animal_id}`,
      });

      setDemande({
        ...demande,
        status,
      });

      alert(
        status === "accepted"
          ? "La demande a été acceptée."
          : "La demande a été refusée."
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de la mise à jour.");
    } finally {
      setUpdating(false);
    }
  }

  function getStatusLabel(status: string) {
    if (status === "pending") return "Nouvelle demande";
    if (status === "accepted") return "Demande acceptée";
    if (status === "refused") return "Demande refusée";
    return status;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement de la demande...</p>
      </main>
    );
  }

  if (!demande) {
    return (
      <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
          <h1 className="text-3xl font-black">Demande introuvable</h1>
          <button
            type="button"
            onClick={() => router.push("/association/demandes")}
            className="mt-6 rounded-2xl bg-[#064b42] px-5 py-3 font-bold text-white"
          >
            Retour aux demandes
          </button>
        </section>
      </main>
    );
  }

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

        <h1 className="mt-2 text-3xl font-black">Détail de la demande</h1>

        <div className="mt-6 rounded-2xl bg-[#f4eee3] p-5">
          <p className="text-sm font-black uppercase text-[#b68b2f]">Statut</p>
          <p className="mt-1 text-xl font-black">
            {getStatusLabel(demande.status)}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <Info label="ID demande" value={demande.id} />
          <Info label="ID animal" value={demande.animal_id} />
          <Info label="ID adoptant" value={demande.requester_id} />
          <Info
            label="Date"
            value={new Date(demande.created_at).toLocaleString("fr-FR")}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 p-5">
          <p className="mb-3 text-sm font-black uppercase text-[#b68b2f]">
            Réponses au questionnaire
          </p>

          <pre className="whitespace-pre-wrap rounded-2xl bg-[#f4eee3] p-4 text-sm text-gray-700">
            {demande.message || "Aucun message renseigné."}
          </pre>
        </div>

        {demande.status === "pending" && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus("accepted")}
              className="rounded-2xl bg-[#064b42] px-5 py-4 text-lg font-black text-white shadow disabled:opacity-60"
            >
              Accepter
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus("refused")}
              className="rounded-2xl bg-red-600 px-5 py-4 text-lg font-black text-white shadow disabled:opacity-60"
            >
              Refuser
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-xs font-black uppercase text-[#b68b2f]">{label}</p>
      <p className="mt-1 break-all font-bold text-[#064b42]">{value}</p>
    </div>
  );
}