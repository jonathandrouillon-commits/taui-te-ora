"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  HeartPulse,
  MapPin,
  PawPrint,
  Plus,
  ShieldCheck,
  Users,
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
  is_public: boolean;
  is_deceased: boolean;
  death_date: string | null;
  created_at: string;
};

function formatSpecies(value: string | null) {
  switch (
    String(value || "")
      .trim()
      .toLowerCase()
  ) {
    case "chien":
      return "Chien";

    case "chat":
      return "Chat";

    case "cheval":
      return "Cheval";

    default:
      return value || "Animal";
  }
}

function formatSex(value: string | null) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "male" ||
    normalized === "mâle"
  ) {
    return "Mâle";
  }

  if (
    normalized === "female" ||
    normalized === "femelle"
  ) {
    return "Femelle";
  }

  return "Non renseigné";
}

function calculateAge(
  birthDate: string | null
) {
  if (!birthDate) {
    return "";
  }

  const birth =
    new Date(birthDate);

  const today =
    new Date();

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
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
    return `${years} an${
      years > 1 ? "s" : ""
    }`;
  }

  if (months > 0) {
    return `${months} mois`;
  }

  return "Moins d'un mois";
}

function getSterilizationLabel(
  status: string | null
) {
  if (status === "oui") {
    return "✅ Stérilisé / castré";
  }

  if (
    status === "en_cours"
  ) {
    return "🕒 En cours";
  }

  return "Statut inconnu";
}

export default function MesCompagnonsPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    companions,
    setCompanions,
  ] =
    useState<Companion[]>([]);

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
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
            .from(
              "companions"
            )
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
              is_public,
              is_deceased,
              death_date,
              created_at
            `)
            .eq(
              "owner_id",
              user.id
            )
            .eq(
              "is_deceased",
              false
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
          "Erreur Mes Compagnons :",
          error
        );

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger vos compagnons."
          );
        }
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

  async function toggleVisibility(
    companion: Companion
  ) {
    if (updatingId) {
      return;
    }

    try {
      setUpdatingId(
        companion.id
      );

      const newValue =
        !companion.is_public;

      const {
        error,
      } =
        await supabase
          .from(
            "companions"
          )
          .update({
            is_public:
              newValue,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            companion.id
          );

      if (error) {
        throw error;
      }

      setCompanions(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              companion.id
                ? {
                    ...item,
                    is_public:
                      newValue,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Erreur visibilité compagnon :",
        error
      );

      alert(
        "Impossible de modifier la visibilité de ce compagnon."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }

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

          {/* HEADER */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ef919b] text-white shadow">
                <PawPrint
                  size={24}
                />
              </div>

              <div>
                <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                  Mes Compagnons
                </h1>

                <p className="mt-1 text-sm text-[#6f625a] sm:text-base">
                  Les animaux qui
                  partagent votre vie.
                </p>
              </div>
            </div>

            <Link
              href="/mes-compagnons/ajouter"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-3 text-sm font-black text-white shadow-lg"
            >
              <Plus size={18} />

              Ajouter un compagnon
            </Link>
          </div>

          {/* ONGLETS */}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-3 font-black text-white shadow">
              <PawPrint
                size={18}
              />

              Mes Compagnons
            </div>

            <Link
              href="/communaute-des-sans-voix"
              className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow"
            >
              <Users
                size={18}
              />

              La communauté des Sans Voix
            </Link>
          </div>

          {/* PRESENTATION */}

          <div className="mt-8 rounded-[28px] bg-white p-6 shadow">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                <ShieldCheck
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#064b42]">
                  Le profil de votre animal
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                  Vos compagnons restent
                  rattachés à votre compte.
                  Vous choisissez ensuite
                  individuellement ceux que
                  vous souhaitez partager
                  avec la communauté Taui
                  Te Ora.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoCard
              icon={
                <HeartPulse
                  size={20}
                />
              }
              title="Profil complet"
              text="Photos, histoire, caractère et informations utiles."
            />

            <InfoCard
              icon={
                <MapPin
                  size={20}
                />
              }
              title="Balades & communauté"
              text="Utilisez votre compagnon dans les activités Taui Te Ora."
            />

            <InfoCard
              icon={
                <AlertTriangle
                  size={20}
                />
              }
              title="Disparition"
              text="Créez rapidement un signalement avec ses informations."
            />
          </div>

          {/* ERREUR */}

          {errorMessage && (
            <div className="mt-8 rounded-[24px] bg-red-50 p-5 font-bold text-red-700">
              {
                errorMessage
              }
            </div>
          )}

          {/* VIDE */}

          {!errorMessage &&
            companions.length ===
              0 && (
              <div className="mt-8 rounded-[28px] border-2 border-dashed border-[#dfcdb8] bg-[#faf5ed] px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#ef919b] shadow">
                  <PawPrint
                    size={30}
                  />
                </div>

                <h2 className="mt-5 text-xl font-black text-[#064b42]">
                  Aucun compagnon pour le moment
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-[#6f625a]">
                  Ajoutez votre premier
                  animal pour créer son
                  profil Taui Te Ora.
                </p>

                <Link
                  href="/mes-compagnons/ajouter"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ef919b] px-5 py-3 font-black text-white shadow-lg"
                >
                  <Plus
                    size={18}
                  />

                  Ajouter mon premier compagnon
                </Link>
              </div>
            )}

          {/* LISTE */}

          {!errorMessage &&
            companions.length >
              0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {companions.map(
                  (
                    companion
                  ) => {
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
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#f4eee5]">
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

                          <div className="absolute right-3 top-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black shadow ${
                                companion.is_public
                                  ? "bg-[#eaf5f1] text-[#064b42]"
                                  : "bg-white text-[#756d67]"
                              }`}
                            >
                              {companion.is_public ? (
                                <Eye
                                  size={14}
                                />
                              ) : (
                                <EyeOff
                                  size={14}
                                />
                              )}

                              {companion.is_public
                                ? "Public"
                                : "Privé"}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
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

                          <div className="mt-4 rounded-[18px] bg-[#f8f4ec] px-4 py-3 text-sm font-bold text-[#064b42]">
                            {getSterilizationLabel(
                              companion.sterilization_status
                            )}
                          </div>

                          {companion.identification_number && (
                            <div className="mt-3 rounded-[18px] bg-[#faf7f2] px-4 py-3 text-sm text-[#6f625a]">
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
                            </div>
                          )}

                          {/* VISIBILITE */}

                          <div className="mt-5 rounded-[22px] border border-[#eadfd8] p-4">
                            <p className="font-black text-[#064b42]">
                              Visibilité dans la communauté
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-[#756d67]">
                              Si vous rendez ce
                              compagnon public, sa
                              fiche apparaîtra dans
                              La communauté des Sans
                              Voix. Son numéro
                              d&apos;identification ne
                              sera jamais affiché
                              publiquement.
                            </p>

                            <button
                              type="button"
                              disabled={
                                updatingId ===
                                companion.id
                              }
                              onClick={() =>
                                toggleVisibility(
                                  companion
                                )
                              }
                              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white shadow transition disabled:opacity-50 ${
                                companion.is_public
                                  ? "bg-[#756d67]"
                                  : "bg-[#ef919b]"
                              }`}
                            >
                              {companion.is_public ? (
                                <>
                                  <EyeOff
                                    size={17}
                                  />

                                  Rendre privé
                                </>
                              ) : (
                                <>
                                  <Eye
                                    size={17}
                                  />

                                  Partager avec la communauté
                                </>
                              )}
                            </button>
                          </div>

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

function InfoCard({
  icon,
  title,
  text,
}: {
  icon:
    React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fce8ec] text-[#d76f7e]">
        {icon}
      </div>

      <h3 className="mt-4 font-black text-[#064b42]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
        {text}
      </p>
    </div>
  );
}