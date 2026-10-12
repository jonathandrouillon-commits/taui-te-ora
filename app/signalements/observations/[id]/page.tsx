
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Observation = {
  id: string;
  created_at: string | null;
  observed_at: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  island: string | null;
  commune: string | null;
  quartier: string | null;
  location_details: string | null;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  animal_type: string | null;
  color: string | null;
  behavior: string | null;
  certainty: string | null;
  comments: string | null;
  match_score: number | null;
  match_explanation: string | null;
  review_status: string | null;
};

const cardClass =
  "rounded-2xl border border-[#d7e7e0] bg-white p-5 shadow-sm";

function dateLabel(value: string | null) {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";

  return date.toLocaleString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-[#f8f4ec] p-3">
      <p className="text-xs font-bold uppercase text-[#827467]">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold">
        {value === null || value === undefined || value === ""
          ? "Non renseigné"
          : value}
      </p>
    </div>
  );
}

export default function SignalementObservationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [items, setItems] = useState<Observation[]>([]);
  const [observationMedias, setObservationMedias] = useState<Array<{id:string;observation_id:string;media_type:string;url:string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Connectez-vous pour consulter les témoignages.");
    }

    return data.session.access_token;
  }, []);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      const response = await fetch(
        `/api/signalement/observations/manage?signalement_id=${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Chargement impossible.");
      }

      setItems(result?.observations || []);
      const mediaResponse = await fetch(`/api/signalement/observations/media?signalement_id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        setObservationMedias(mediaData.medias || []);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erreur inconnue."
      );
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(
    observationId: string,
    reviewStatus: "pending" | "confirmed" | "rejected"
  ) {
    setBusy(observationId);
    setError("");

    try {
      const token = await getToken();

      const response = await fetch(
        "/api/signalement/observations/manage",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            signalement_id: id,
            observation_id: observationId,
            review_status: reviewStatus,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Modification impossible.");
      }

      setItems((previous) =>
        previous.map((item) =>
          item.id === observationId
            ? { ...item, review_status: reviewStatus }
            : item
        )
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erreur inconnue."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-20 pt-24 text-[#064b42]">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/signalements"
            className="rounded-full bg-white px-5 py-3 font-bold"
          >
            ← Signalements
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white px-5 py-3 font-bold"
          >
            Retour
          </button>
        </div>

        <header>
          <h1 className="text-3xl font-black">
            🐾 Témoignages reçus
          </h1>
          <p className="mt-2 text-[#52736b]">
            Espace privé de suivi des observations concernant
            ce signalement.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-2xl bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className={cardClass}>Chargement des observations…</div>
        ) : items.length === 0 ? (
          <div className={cardClass}>
            Aucun témoignage enregistré pour ce signalement.
          </div>
        ) : (
          <div className="space-y-5">
            <p className="font-bold">
              {items.length} témoignage(s) affiché(s)
            </p>

            {items.map((item) => {
              const status = item.review_status || "pending";

              return (
                <article key={item.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">
                        {item.first_name || "Prénom inconnu"}{" "}
                        {item.last_name || ""}
                      </h2>
                      <p className="mt-1 text-sm text-[#52736b]">
                        Observation : {dateLabel(item.observed_at)}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#eaf5f1] px-4 py-2 text-sm font-bold">
                      {status === "confirmed"
                        ? "Correspondance confirmée"
                        : status === "rejected"
                          ? "Correspondance écartée"
                          : "À vérifier"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Detail label="Prénom" value={item.first_name} />
                    <Detail label="Nom" value={item.last_name} />
                    <Detail label="Téléphone" value={item.phone} />
                    <Detail label="Île" value={item.island} />
                    <Detail label="Commune" value={item.commune} />
                    <Detail label="Quartier" value={item.quartier} />
                    <Detail
                      label="Point de repère"
                      value={item.location_details}
                    />
                    <Detail
                      label="Certitude du témoin"
                      value={item.certainty}
                    />
                    <Detail label="Couleur" value={item.color} />
                    <Detail
                      label="Comportement"
                      value={item.behavior}
                    />
                  </div>

                  {item.phone && (
                    <a
                      href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}
                      className="mt-4 inline-flex rounded-full bg-[#064b42] px-5 py-3 font-bold text-white"
                    >
                      📞 Contacter le témoin
                    </a>
                  )}

                  {item.latitude !== null &&
                    item.longitude !== null && (
                      <div className="mt-4 rounded-xl bg-[#eaf5f1] p-4">
                        <p className="font-bold">
                          📍 Localisation GPS transmise
                        </p>
                        <p className="mt-1 text-sm">
                          {item.latitude.toFixed(6)},{" "}
                          {item.longitude.toFixed(6)}
                        </p>
                        {item.gps_accuracy !== null && (
                          <p className="text-sm">
                            Précision estimée :{" "}
                            {Math.round(item.gps_accuracy)} m
                          </p>
                        )}
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          className="mt-2 inline-block font-bold underline"
                        >
                          Ouvrir la position sur la carte
                        </a>
                      </div>
                    )}

                  {observationMedias.some(m=>m.observation_id===item.id) && (
                    <div className="mt-4 rounded-xl bg-[#eaf5f1] p-4">
                      <h3 className="font-black">Photos et vidéos du témoin (privées)</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {observationMedias.filter(m=>m.observation_id===item.id).map(m=>(
                          <div key={m.id}>
                            {m.media_type==="photo" ? <a href={m.url} target="_blank" rel="noopener noreferrer"><img src={m.url} alt="Photo transmise par le témoin" className="w-full rounded-xl object-cover" /></a> :
                            <video controls preload="metadata" src={m.url} className="w-full rounded-xl" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.comments && (
                    <div className="mt-4 rounded-xl bg-[#f8f4ec] p-4">
                      <h3 className="font-black">
                        Informations complémentaires
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap">
                        {item.comments}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-[#d7e7e0] p-4">
                    <h3 className="font-black">
                      Compatibilité indicative
                    </h3>
                    <p className="mt-1 text-2xl font-black">
                      {item.match_score === null
                        ? "Non calculée"
                        : `${item.match_score} / 95`}
                    </p>
                    <p className="mt-2 text-sm">
                      {item.match_explanation ||
                        "Aucune explication disponible."}
                    </p>
                    <p className="mt-2 text-xs text-[#52736b]">
                      Ce score repose sur des critères simples.
                      Il ne constitue ni une probabilité
                      d'identification ni une analyse IA.
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void updateStatus(item.id, "confirmed")
                      }
                      className="rounded-full bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50"
                    >
                      ✓ Correspond à mon animal
                    </button>

                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void updateStatus(item.id, "rejected")
                      }
                      className="rounded-full border border-red-300 bg-red-50 px-5 py-3 font-bold text-red-800 disabled:opacity-50"
                    >
                      ✕ Ne correspond pas
                    </button>

                    {status !== "pending" && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          void updateStatus(item.id, "pending")
                        }
                        className="rounded-full border px-5 py-3 font-bold disabled:opacity-50"
                      >
                        Remettre à vérifier
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
