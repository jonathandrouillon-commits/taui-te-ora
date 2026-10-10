
"use client";

import { useCallback, useEffect, useState } from "react";
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
  match_score: number | null;
  match_level: string | null;
  conditions_accepted_at: string | null;
  signature_signer_name: string | null;
  signature_signed_at: string | null;
};

export default function AssociationDemandeDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id || "");

  const [demande, setDemande] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDemande = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("adoption_requests")
        .select(
          "id, animal_id, requester_id, owner_id, status, message, created_at, match_score, match_level, conditions_accepted_at, signature_signer_name, signature_signed_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMessage("Demande introuvable ou accès non autorisé.");
        return;
      }

      setDemande(data as Demande);
    } catch (error: unknown) {
      console.error("Erreur chargement demande :", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger cette demande."
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    queueMicrotask(() => void loadDemande());
  }, [loadDemande]);

  async function updateStatus(status: "meeting" | "rejected") {
    if (!demande || updating) return;

    const confirmation =
      status === "meeting"
        ? "Confirmer que la demande passe à l'étape de rencontre ?"
        : "Confirmer le refus de cette candidature ?";

    if (!window.confirm(confirmation)) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("adoption_requests")
        .update({ status })
        .eq("id", demande.id);

      if (error) throw error;

      setDemande((previous) =>
        previous ? { ...previous, status } : previous
      );

      try {
        await notificationService.create({
          recipient_id: demande.requester_id,
          type: "reponse_adoption",
          title:
            status === "meeting"
              ? "Rencontre proposée"
              : "Demande d'adoption refusée",
          message:
            status === "meeting"
              ? "Votre candidature avance ! L'association souhaite organiser une rencontre. Consultez vos échanges pour convenir des modalités."
              : "Votre demande d'adoption n'a pas été retenue.",
          animal_id: demande.animal_id,
          adoption_request_id: demande.id,
        });
      } catch (notificationError) {
        console.error(
          "Notification non envoyée :",
          notificationError
        );
      }
    } catch (error: unknown) {
      console.error("Erreur mise à jour demande :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour la demande."
      );
    } finally {
      setUpdating(false);
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending":
        return "Nouvelle candidature";
      case "meeting":
        return "Rencontre à organiser";
      case "accepted":
        return "Adoption validée";
      case "rejected":
      case "refused":
        return "Candidature refusée";
      case "cancelled":
        return "Candidature annulée";
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] p-6 text-[#064b42]">
        <p className="text-lg font-black">
          Chargement de la candidature...
        </p>
      </main>
    );
  }

  if (!demande) {
    return (
      <main className="min-h-screen bg-[#f4eee3] px-4 py-8">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
          <h1 className="text-2xl font-black text-[#064b42]">
            Candidature indisponible
          </h1>

          <p className="mt-3 text-gray-600">
            {errorMessage || "Demande introuvable."}
          </p>

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

  const questionnaireUrl =
    `/adoptant/${encodeURIComponent(demande.requester_id)}` +
    `?request=${encodeURIComponent(demande.id)}`;

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 pb-24 text-[#064b42]">
      <section className="mx-auto max-w-3xl rounded-[30px] bg-white p-5 shadow-lg sm:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-full bg-[#f4eee3] px-5 py-3 font-bold"
        >
          ← Retour
        </button>

        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
          TAUI TE ORA · Adoption
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Fiche de candidature
        </h1>

        <div className="mt-6 rounded-[24px] bg-[#f4eee3] p-5">
          <p className="text-xs font-black uppercase tracking-wide text-[#b68b2f]">
            Avancement
          </p>

          <p className="mt-2 text-xl font-black">
            {getStatusLabel(demande.status)}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-[#e8ded2] p-5">
            <p className="text-xs font-black uppercase text-[#b68b2f]">
              Compatibilité
            </p>

            <p className="mt-2 text-3xl font-black text-[#064b42]">
              {typeof demande.match_score === "number"
                ? `${demande.match_score}%`
                : "Non calculée"}
            </p>

            {demande.match_level && (
              <p className="mt-1 text-sm text-gray-600">
                {demande.match_level}
              </p>
            )}
          </div>

          <div className="rounded-[22px] border border-[#e8ded2] p-5">
            <p className="text-xs font-black uppercase text-[#b68b2f]">
              Date de candidature
            </p>

            <p className="mt-2 font-bold">
              {new Date(demande.created_at).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-[24px] border border-[#e8ded2] p-5">
          <h2 className="text-xl font-black">
            Profil et questionnaire
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Consultez les informations du candidat, ses réponses
            au questionnaire et son pourcentage de compatibilité
            avec l'animal concerné.
          </p>

          <button
            type="button"
            onClick={() => router.push(questionnaireUrl)}
            className="mt-5 w-full rounded-2xl bg-[#064b42] px-5 py-4 font-black text-white"
          >
            Voir la fiche complète du candidat →
          </button>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#e8ded2] p-5">
          <h2 className="text-xl font-black">
            Conditions d'adoption
          </h2>

          <div className="mt-4 space-y-3">
            <Info
              label="Conditions acceptées"
              value={
                demande.conditions_accepted_at
                  ? new Date(
                      demande.conditions_accepted_at
                    ).toLocaleString("fr-FR")
                  : "Non renseigné"
              }
            />

            <Info
              label="Signature"
              value={
                demande.signature_signed_at
                  ? "Signé le " +
                    new Date(
                      demande.signature_signed_at
                    ).toLocaleString("fr-FR")
                  : "Signature non enregistrée"
              }
            />

            {demande.signature_signer_name && (
              <Info
                label="Signataire"
                value={demande.signature_signer_name}
              />
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#e8ded2] p-5">
          <h2 className="text-xl font-black">
            Message du candidat
          </h2>

          <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f4eee3] p-4 text-sm leading-relaxed text-gray-700">
            {demande.message || "Aucun message renseigné."}
          </p>
        </section>

        {demande.status === "pending" && (
          <section className="mt-8">
            <h2 className="text-xl font-black">
              Suite de la candidature
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Après avoir échangé avec le candidat, vous pouvez
              faire avancer sa candidature vers une rencontre.
              Cette étape ne finalise pas l'adoption.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => updateStatus("meeting")}
                className="rounded-2xl bg-[#064b42] px-5 py-4 font-black text-white disabled:opacity-60"
              >
                Proposer une rencontre
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => updateStatus("rejected")}
                className="rounded-2xl bg-[#fff0f2] px-5 py-4 font-black text-[#b44758] disabled:opacity-60"
              >
                Refuser la candidature
              </button>
            </div>
          </section>
        )}

        {demande.status === "meeting" && (
          <div className="mt-8 rounded-[24px] bg-[#e8f5f1] p-5">
            <h2 className="text-lg font-black">
              Rencontre en cours d'organisation
            </h2>

            <p className="mt-2 text-sm text-[#315e56]">
              La candidature est passée à l'étape de rencontre.
              L'adoption n'est pas encore finalisée.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#faf7f2] p-4">
      <p className="text-xs font-black uppercase text-[#b68b2f]">
        {label}
      </p>

      <p className="mt-2 font-bold text-[#064b42]">
        {value}
      </p>
    </div>
  );
}
