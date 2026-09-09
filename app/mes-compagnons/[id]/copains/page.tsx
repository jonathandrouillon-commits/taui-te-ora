"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  PawPrint,
  Sparkles,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

type SourceCompanion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  photo_url: string | null;
  social_enabled: boolean;
};

type Match = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  photo_url: string | null;
  character_text: string | null;
  social_energy: string | null;
  social_dogs: string | null;
  social_cats: string | null;
  social_play: string | null;
  social_size: string | null;
  social_preferred_sizes: string[];
  social_temperaments: string[];
  social_meeting_types: string[];
  social_notes: string | null;
  compatibility_score: number;
};

const LABELS: Record<string, string> = {
  calme: "Calme",
  modere: "Modéré",
  sportif: "Sportif",
  petit: "Petit",
  moyen: "Moyen",
  grand: "Grand",
  oui: "Oui",
  a_tester: "À tester",
  non: "Non",
  parfois: "Parfois",
  joueur: "Joueur",
  sociable: "Sociable",
  timide: "Timide",
  independant: "Indépendant",
  energique: "Énergique",
  reactif: "Réactif",
  balade: "Balade",
  jeu: "Jeu",
  sociabilisation: "Sociabilisation",
  compagnie: "Compagnie",
};

function label(value: string | null | undefined) {
  if (!value) return "";
  return LABELS[value] || value;
}

function ageFromBirthDate(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return months <= 1 ? "Moins de 2 mois" : `${months} mois`;
  }

  return years === 1 ? "1 an" : `${years} ans`;
}

function scoreText(score: number) {
  if (score >= 85) return "Très belle compatibilité";
  if (score >= 70) return "Belle compatibilité";
  if (score >= 55) return "Compatibilité intéressante";
  return "À découvrir avec prudence";
}

export default function CompanionMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const companionId = String(params?.id || "");

  const [source, setSource] = useState<SourceCompanion | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
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

        const { data: companionData, error: companionError } = await supabase
          .from("companions")
          .select("id, owner_id, name, species, photo_url, social_enabled")
          .eq("id", companionId)
          .maybeSingle();

        if (companionError) throw companionError;

        if (!companionData) {
          throw new Error("Compagnon introuvable.");
        }

        if (companionData.owner_id !== user.id) {
          throw new Error(
            "Vous ne pouvez rechercher des copains que pour vos propres compagnons."
          );
        }

        if (!companionData.social_enabled) {
          router.replace(`/mes-compagnons/${companionId}/profil-social`);
          return;
        }

        const { data: matchData, error: matchError } = await supabase.rpc(
          "get_companion_matches",
          {
            p_companion_id: companionId,
          }
        );

        if (matchError) throw matchError;
        if (!active) return;

        setSource(companionData as SourceCompanion);
        setMatches((matchData || []) as Match[]);
      } catch (error) {
        console.error("Erreur recherche copains :", error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de rechercher des copains."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (companionId) void load();

    return () => {
      active = false;
    };
  }, [companionId, router]);

  const bestScore = useMemo(
    () =>
      matches.length
        ? Math.max(...matches.map((item) => item.compatibility_score))
        : null,
    [matches]
  );

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />
          <p className="mt-4 font-black text-[#064b42]">
            Recherche des copains compatibles...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !source) {
    return (
      <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8">
        <section className="mx-auto max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl">
          <div className="text-6xl">🐾</div>
          <h1 className="mt-4 text-2xl font-black text-[#064b42]">
            Recherche indisponible
          </h1>
          <p className="mt-3 text-[#756d67]">
            {errorMessage || "Impossible de charger les résultats."}
          </p>
          <Link
            href={`/mes-compagnons/${companionId}`}
            className="mt-6 inline-flex rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour à la fiche
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <div className="overflow-hidden rounded-[32px] bg-[#064b42] text-white shadow-xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4">
              {source.photo_url ? (
                <img
                  src={source.photo_url}
                  alt={source.name}
                  className="h-20 w-20 rounded-full border-4 border-white/25 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl">
                  🐾
                </div>
              )}

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c2c8]">
                  Balades & Copains
                </p>
                <h1 className="mt-1 text-3xl font-black">
                  Les copains de {source.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                  Taui Te Ora compare les profils sociaux pour proposer des
                  rencontres qui semblent compatibles.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                <Users className="mr-2 inline" size={16} />
                {matches.length} profil{matches.length > 1 ? "s" : ""}
              </div>

              {bestScore !== null && (
                <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                  <Sparkles className="mr-2 inline" size={16} />
                  meilleur match : {bestScore}%
                </div>
              )}
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="mt-6 rounded-[30px] bg-white p-8 text-center shadow-sm">
            <div className="text-6xl">🐾</div>
            <h2 className="mt-4 text-2xl font-black text-[#064b42]">
              Pas encore de copain compatible
            </h2>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-[#756d67]">
              Aucun autre compagnon public de la même espèce avec un profil
              social actif n'est disponible pour le moment.
            </p>
            <Link
              href={`/mes-compagnons/${source.id}/profil-social`}
              className="mt-6 inline-flex rounded-full border border-[#064b42] px-5 py-3 font-black text-[#064b42]"
            >
              Modifier le profil social
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {matches.map((match) => {
              const age = ageFromBirthDate(match.birth_date);

              return (
                <article
                  key={match.id}
                  className="overflow-hidden rounded-[30px] bg-white shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-[#eadfce]">
                    {match.photo_url ? (
                      <img
                        src={match.photo_url}
                        alt={match.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-7xl">
                        🐾
                      </div>
                    )}

                    <div className="absolute right-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-white bg-[#064b42] text-white shadow-lg">
                      <span className="text-2xl font-black">
                        {match.compatibility_score}%
                      </span>
                      <span className="text-[9px] font-black uppercase">
                        match
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-[#064b42]">
                          {match.name}
                        </h2>
                        <p className="mt-1 text-sm text-[#756d67]">
                          {[match.breed, age, match.sex]
                            .filter(Boolean)
                            .join(" • ") || label(match.species)}
                        </p>
                      </div>

                      <Heart
                        className="shrink-0 text-[#df8995]"
                        fill="currentColor"
                        size={24}
                      />
                    </div>

                    <div className="mt-4 rounded-[18px] bg-[#fce8ec] px-4 py-3">
                      <p className="font-black text-[#a64f5d]">
                        ✨ {scoreText(match.compatibility_score)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {match.social_energy && (
                        <Badge>
                          ⚡ {label(match.social_energy)}
                        </Badge>
                      )}

                      {match.social_size && (
                        <Badge>
                          🐾 {label(match.social_size)}
                        </Badge>
                      )}

                      {match.social_play && (
                        <Badge>
                          🎾 Jeu : {label(match.social_play)}
                        </Badge>
                      )}
                    </div>

                    {match.social_temperaments?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-[#9a8c82]">
                          Tempérament
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.social_temperaments.map((item) => (
                            <Badge key={item}>{label(item)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.social_meeting_types?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-[#9a8c82]">
                          Recherche
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.social_meeting_types.map((item) => (
                            <Badge key={item}>{label(item)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.character_text && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#756d67]">
                        {match.character_text}
                      </p>
                    )}

                    {match.social_notes && (
                      <div className="mt-4 rounded-[18px] bg-[#f7f2eb] p-4 text-sm leading-6 text-[#756d67]">
                        {match.social_notes}
                      </div>
                    )}

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/mes-compagnons/${match.id}`}
                        className="flex items-center justify-center rounded-full border border-[#064b42] px-4 py-3 text-sm font-black text-[#064b42]"
                      >
                        Voir le profil
                      </Link>

                      <Link
                        href={`/balades/creer?companion=${source.id}&invite=${match.id}`}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#df8995] px-4 py-3 text-sm font-black text-white"
                      >
                        <PawPrint size={17} />
                        Proposer une balade
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-[24px] bg-[#eaf5f1] p-5 text-sm leading-6 text-[#49685f]">
          🐾 Le pourcentage est une aide à la mise en relation, pas une garantie
          de bonne entente. Les premières rencontres doivent rester progressives
          et sous la responsabilité des propriétaires.
        </div>
      </section>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f7f2eb] px-3 py-1.5 text-xs font-bold text-[#6f625a]">
      {children}
    </span>
  );
}
