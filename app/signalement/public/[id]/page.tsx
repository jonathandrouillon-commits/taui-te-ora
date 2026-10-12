"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type PublicSignalement = {
  id: string;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  sex: string | null;
  age_label: string | null;
  color: string | null;
  breed: string | null;
  collar_color: string | null;
  distinctive_features: string | null;
  island: string | null;
  city: string | null;
  disappearance_at: string | null;
  found_at: string | null;
  situation: string | null;
  status: string | null;
};

type MediaRow = Record<string, unknown>;

function safePhotoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Pacific/Tahiti",
  }).format(date);
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-2xl bg-[#f8f4ec] p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-[#846f63]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#064b42]">{value}</dd>
    </div>
  );
}

export default function PublicSignalementPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [report, setReport] = useState<PublicSignalement | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setReport(null);
      setPhotos([]);
      if (!id) {
        setError("Lien de signalement invalide.");
        setLoading(false);
        return;
      }
      try {
        // Liste blanche : aucune coordonnée, adresse précise, position GPS,
        // identification, information de profil ou preuve d'upload n'est demandée.
        const { data, error: queryError } = await supabase
          .from("signalements")
          .select("id,type_signalement,animal_type,animal_name,sex,age_label,color,breed,collar_color,distinctive_features,island,city,disappearance_at,found_at,situation,status")
          .eq("id", id)
          .maybeSingle();
        if (queryError) throw queryError;
        if (!active) return;
        if (!data) {
          setError("Ce signalement est introuvable ou n'est pas accessible publiquement.");
          return;
        }
        setReport(data as PublicSignalement);

        // Les photos sont facultatives. Une politique RLS peut limiter leur lecture.
        const { data: media, error: mediaError } = await supabase
          .from("signalement_medias")
          .select("*")
          .eq("signalement_id", id);
        if (!active || mediaError || !media) return;
        const urls = (media as MediaRow[])
          .map((row) =>
            safePhotoUrl(row.file_url) ||
            safePhotoUrl(row.public_url) ||
            safePhotoUrl(row.media_url) ||
            safePhotoUrl(row.url) ||
            safePhotoUrl(row.file_url)
          )
          .filter((url): url is string => Boolean(url));
        setPhotos([...new Set(urls)]);
      } catch (caught) {
        console.error("Chargement du signalement public :", caught);
        if (active) setError("Impossible de charger ce signalement pour le moment.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const publicUrl = `https://www.taui-te-ora.com/signalement/public/${encodeURIComponent(id)}`;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Signalement TAUI TE ORA : ${report?.type_signalement || "Animal signalé"} - ${report?.animal_name || report?.animal_type || "Animal"} - ${[report?.city, report?.island].filter(Boolean).join(", ")}\n${publicUrl}`)}`;
  const messengerUrl = `fb-messenger://share/?link=${encodeURIComponent(publicUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setShareMessage("Lien copié !");
    } catch {
      window.prompt("Copiez le lien du signalement :", publicUrl);
    }
  }

  async function nativeShare() {
    const shareData = {
      title: `TAUI TE ORA - ${report?.type_signalement || "Signalement"}`,
      text: [report?.animal_name, report?.animal_type, report?.city, report?.island].filter(Boolean).join(" · "),
      url: publicUrl,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setShareMessage("Partage indisponible sur cet appareil. Utilisez Copier le lien.");
        }
      }
    } else {
      await copyLink();
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-24 pt-20 text-[#064b42] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/signalements" className="rounded-full bg-white px-5 py-3 text-sm font-bold shadow-sm">← Tous les signalements</Link>
          <Link href="/" className="rounded-full bg-white px-5 py-3 text-sm font-bold shadow-sm">Accueil TAUI TE ORA</Link>
        </div>
        {loading ? (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">Chargement du signalement…</section>
        ) : error || !report ? (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black">Signalement indisponible</h1>
            <p className="mt-3 text-[#756d67]">{error || "Ce signalement est indisponible."}</p>
            <Link href="/signalements" className="mt-6 inline-block rounded-full bg-[#064b42] px-6 py-3 font-bold text-white">Voir les signalements</Link>
          </section>
        ) : (
          <article className="overflow-hidden rounded-[2rem] bg-white shadow-lg">
            <header className="bg-[#064b42] px-6 py-8 text-white sm:px-9">
              <p className="text-sm font-bold uppercase tracking-widest text-[#f3b0b8]">🚨 TAUI TE ORA · Signalement</p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">{report.type_signalement || "Signalement animal"}</h1>
              <p className="mt-2 text-lg">{[report.animal_name, report.animal_type, report.city, report.island].filter(Boolean).join(" · ")}</p>
            </header>
            <div className="space-y-7 p-6 sm:p-9">
              {photos.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {photos.map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt={`Photo de l'animal ${index + 1}`} className="h-64 w-full rounded-2xl bg-[#f8f4ec] object-cover" />
                  ))}
                </div>
              )}
              <section>
                <h2 className="mb-4 text-xl font-black">Informations sur l'animal</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Nom" value={report.animal_name} />
                  <Detail label="Animal" value={report.animal_type} />
                  <Detail label="Sexe" value={report.sex} />
                  <Detail label="Âge estimé" value={report.age_label} />
                  <Detail label="Race" value={report.breed} />
                  <Detail label="Couleur" value={report.color} />
                  <Detail label="Collier" value={report.collar_color} />
                  <Detail label="Île" value={report.island} />
                  <Detail label="Commune" value={report.city} />
                  <Detail label="Disparu le" value={formatDate(report.disappearance_at)} />
                  <Detail label="Trouvé le" value={formatDate(report.found_at)} />
                  <Detail label="Statut" value={report.status} />
                </dl>
              </section>
              {report.distinctive_features && (
                <section><h2 className="text-xl font-black">Signes particuliers</h2><p className="mt-2 whitespace-pre-wrap text-[#6f5a47]">{report.distinctive_features}</p></section>
              )}
              {report.situation && (
                <section><h2 className="text-xl font-black">Situation</h2><p className="mt-2 whitespace-pre-wrap text-[#6f5a47]">{report.situation}</p></section>
              )}
              <section className="rounded-2xl bg-[#eaf5f1] p-5">
                <h2 className="text-lg font-black">Vous avez des informations ?</h2>
                <p className="mt-2 text-sm text-[#42695f]">Consultez les signalements sur TAUI TE ORA pour aider la communauté. Les coordonnées privées du déclarant ne sont pas affichées ici.</p>
              </section>
              <section className="rounded-2xl border border-[#d5ebe4] bg-[#f5faf8] p-5">
                <h2 className="text-lg font-black">Partager ce signalement</h2>
                <p className="mt-2 text-sm text-[#42695f]">Aidez la communauté à retrouver cet animal. Seules les informations publiques de cette fiche sont partagées.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1877f2] px-5 py-3 text-sm font-bold text-white">Facebook</a>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#178f59] px-5 py-3 text-sm font-bold text-white">WhatsApp</a>
                  <a href={messengerUrl} className="rounded-full bg-[#7360db] px-5 py-3 text-sm font-bold text-white">Messenger</a>
                  <button type="button" onClick={() => void nativeShare()} className="rounded-full bg-[#ef8998] px-5 py-3 text-sm font-bold text-white">Autres applications</button>
                  <button type="button" onClick={() => void copyLink()} className="rounded-full bg-[#064b42] px-5 py-3 text-sm font-bold text-white">Copier le lien</button>
                </div>
                <p className="mt-3 break-all text-xs text-[#42695f]">{publicUrl}</p>
                {shareMessage && <p role="status" className="mt-2 text-sm font-semibold text-[#064b42]">{shareMessage}</p>}
              </section>
              <Link href="/signalements" className="inline-flex rounded-full border border-[#064b42] px-5 py-3 text-sm font-bold">Autres signalements</Link>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
