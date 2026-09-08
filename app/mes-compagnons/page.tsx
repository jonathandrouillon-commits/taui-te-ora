"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  HeartPulse,
  MapPin,
  PawPrint,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";

type Companion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  weight: string | null;
  character: string | null;
  story: string | null;
  photo_url: string | null;
  identification_type: string | null;
  identification_number: string | null;
  sterilization_status: string | null;
  sterilization_date: string | null;
  sterilization_note: string | null;
  created_at: string;
};

function formatSpecies(value: string | null) {
  const species = String(value || "")
    .trim()
    .toLowerCase();

  switch (species) {
    case "chien":
      return "Chien";
    case "chat":
      return "Chat";
    case "cheval":
      return "Cheval";
    case "autre":
      return "Autre";
    default:
      return value || "Animal";
  }
}

function formatSex(value: string | null) {
  const sex = String(value || "")
    .trim()
    .toLowerCase();

  if (sex === "male" || sex === "mâle" || sex === "male") {
    return "Mâle";
  }

  if (
    sex === "female" ||
    sex === "femelle" ||
    sex === "female"
  ) {
    return "Femelle";
  }

  return value || "Non renseigné";
}

function formatSterilizationStatus(value: string | null) {
  switch (value) {
    case "oui":
      return "Stérilisé / castré";
    case "en_cours":
      return "Stérilisation en cours";
    case "non":
      return "Non stérilisé";
    default:
      return "Statut inconnu";
  }
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) {
    return "";
  }

  const birth = new Date(birthDate);
  const today = new Date();

  if (Number.isNaN(birth.getTime())) {
    return "";
  }

  let years =
    today.getFullYear() -
    birth.getFullYear();

  let months =
    today.getMonth() -
    birth.getMonth();

  if (
    today.getDate() <
    birth.getDate()
  ) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return `${years} an${years > 1 ? "s" : ""}`;
  }

  if (months > 0) {
    return `${months} mois`;
  }

  return "Moins d'un mois";
}

export default function MesCompagnonsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [companions, setCompanions] =
    useState<Companion[]>([]);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadCompanions() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          router.replace(
            "/login?redirect=" +
              encodeURIComponent(
                "/mes-compagnons"
              )
          );
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("companions")
            .select(`
              id,
              owner_id,
              name,
              species,
              breed,
              sex,
              birth_date,
              color,
              weight,
              character,
              story,
              photo_url,
              identification_type,
              identification_number,
              sterilization_status,
              sterilization_date,
              sterilization_note,
              created_at
            `)
            .eq(
              "owner_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        setCompanions(
          (data || []) as Companion[]
        );
      } catch (error) {
        console.error(
          "Erreur chargement Mes Compagnons :",
          error
        );

        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger vos compagnons."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCompanions();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement de vos compagnons...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ef919b] text-white shadow">
                  <PawPrint size={24} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                    Mes Compagnons
                  </h1>

                  <p className="mt-1 text-sm text-[#6f625a] sm:text-base">
                    Les animaux qui partagent votre vie.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/mes-compagnons/ajouter"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#0b5e53] active:scale-[0.98]"
            >
              <Plus size={18} />
              Ajouter un compagnon
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] bg-white p-6 shadow">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#064b42]">
                  Pourquoi créer le profil de votre animal ?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                  Une fois votre compagnon enregistré, ses informations
                  principales peuvent être réutilisées dans Taui Te Ora pour
                  les balades, les activités communautaires et surtout pour
                  créer rapidement un signalement en cas de disparition.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fce8ec] text-[#d76f7e]">
                <HeartPulse size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Profil complet
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                Photos, histoire, caractère, identification et informations
                utiles.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                <MapPin size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Balades & communauté
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                Sélectionnez facilement le compagnon qui participe à une
                balade ou à une activité.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2db] text-[#b06e22]">
                <AlertTriangle size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Disparition
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                En cas de perte, créez rapidement un signalement avec les
                informations déjà enregistrées.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-8 rounded-[24px] bg-red-50 p-5 text-sm font-bold text-red-700">
              Impossible de charger vos compagnons.
              <br />
              {errorMessage}
            </div>
          )}

          {!errorMessage &&
            companions.length === 0 && (
              <div className="mt-8 rounded-[28px] border-2 border-dashed border-[#dfcdb8] bg-[#faf5ed] px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#ef919b] shadow">
                  <PawPrint size={30} />
                </div>

                <h2 className="mt-5 text-xl font-black text-[#064b42]">
                  Aucun compagnon pour le moment
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6f625a]">
                  Ajoutez votre premier animal pour créer son profil Taui Te Ora.
                </p>

                <Link
                  href="/mes-compagnons/ajouter"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#ef919b] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:opacity-90 active:scale-[0.98]"
                >
                  <Plus size={18} />
                  Ajouter mon premier compagnon
                </Link>
              </div>
            )}

          {!errorMessage &&
            companions.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {companions.map(
                  (companion) => {
                    const age =
                      calculateAge(
                        companion.birth_date
                      );

                    return (
                      <article
                        key={
                          companion.id
                        }
                        className="overflow-hidden rounded-[28px] bg-white shadow-lg"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#f4eee5]">
                          {companion.photo_url ? (
                            <img
                              src={
                                companion.photo_url
                              }
                              alt={
                                companion.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-7xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-2xl font-black text-[#064b42]">
                                {
                                  companion.name
                                }
                              </h2>

                              <p className="mt-1 text-sm font-bold text-[#756d67]">
                                {formatSpecies(
                                  companion.species
                                )}
                                {" · "}
                                {formatSex(
                                  companion.sex
                                )}
                                {age
                                  ? ` · ${age}`
                                  : ""}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#eaf5f1] px-3 py-1 text-xs font-black text-[#064b42]">
                              {
                                formatSterilizationStatus(
                                  companion.sterilization_status
                                )
                              }
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-[#6f625a]">
                            {companion.breed && (
                              <p>
                                <strong>
                                  Race :
                                </strong>{" "}
                                {
                                  companion.breed
                                }
                              </p>
                            )}

                            {companion.color && (
                              <p>
                                <strong>
                                  Couleur :
                                </strong>{" "}
                                {
                                  companion.color
                                }
                              </p>
                            )}

                            {companion.identification_number && (
                              <p>
                                <strong>
                                  Identification :
                                </strong>{" "}
                                {companion.identification_type ===
                                "tatouage"
                                  ? "Tatouage"
                                  : "Puce"}{" "}
                                {
                                  companion.identification_number
                                }
                              </p>
                            )}
                          </div>

                          {companion.character && (
                            <div className="mt-4 rounded-[20px] bg-[#faf7f2] p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-[#df8995]">
                                Caractère
                              </p>

                              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                                {
                                  companion.character
                                }
                              </p>
                            </div>
                          )}

                          {companion.story && (
                            <div className="mt-4 rounded-[20px] bg-[#faf7f2] p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-[#df8995]">
                                Son histoire
                              </p>

                              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#6f625a]">
                                {
                                  companion.story
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <Link
                              href={`/mes-compagnons/${companion.id}`}
                              className="rounded-full bg-[#f0ebe4] px-4 py-3 text-center text-sm font-black text-[#064b42]"
                            >
                              Voir sa fiche
                            </Link>

                            <Link
                              href={`/signalement?companion=${encodeURIComponent(
                                companion.id
                              )}`}
                              className="rounded-full bg-red-600 px-4 py-3 text-center text-sm font-black text-white shadow"
                            >
                              🚨 Signaler sa disparition
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}