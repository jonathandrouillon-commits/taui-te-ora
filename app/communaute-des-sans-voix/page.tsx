"use client";

import Link from "next/link";
import {
  Heart,
  PawPrint,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

type PublicCompanion = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  character: string | null;
  story: string | null;
  photo_url: string | null;
  sterilization_status:
    | string
    | null;
  created_at: string;
};

function calculateAge(
  birthDate: string | null
) {
  if (!birthDate) {
    return "";
  }

  const birth =
    new Date(birthDate);

  const now =
    new Date();

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return "";
  }

  let years =
    now.getFullYear() -
    birth.getFullYear();

  let months =
    now.getMonth() -
    birth.getMonth();

  if (
    now.getDate() <
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

  return "";
}

function formatSpecies(
  value: string
) {
  switch (
    String(value || "")
      .toLowerCase()
  ) {
    case "chien":
      return "🐶 Chien";

    case "chat":
      return "🐱 Chat";

    case "cheval":
      return "🐴 Cheval";

    default:
      return "🐾 Animal";
  }
}

function formatSex(
  value: string | null
) {
  const sex =
    String(value || "")
      .toLowerCase();

  if (
    sex === "male" ||
    sex === "mâle"
  ) {
    return "Mâle";
  }

  if (
    sex === "female" ||
    sex === "femelle"
  ) {
    return "Femelle";
  }

  return "";
}

export default function CommunauteSansVoixPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    companions,
    setCompanions,
  ] =
    useState<
      PublicCompanion[]
    >([]);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadCommunity() {
      try {
        setLoading(true);

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
              name,
              species,
              breed,
              sex,
              birth_date,
              color,
              character,
              story,
              photo_url,
              sterilization_status,
              created_at
            `)
            .eq(
              "is_public",
              true
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        setCompanions(
          (data ||
            []) as PublicCompanion[]
        );
      } catch (error) {
        console.error(
          "Erreur communauté Sans Voix :",
          error
        );

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger la communauté."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCommunity();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-6xl">

        {/* HERO */}

        <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ef919b] text-white shadow-lg">
              <Users
                size={30}
              />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
              Taui Te Ora
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#064b42] sm:text-5xl">
              La communauté
              <br />
              des Sans Voix
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6f625a] sm:text-base">
              Ils ont un nom, une
              histoire, une famille.
              Découvrez les compagnons
              Taui Te Ora que leurs
              humains ont choisi de
              partager avec la
              communauté.
            </p>
          </div>

          {/* ONGLETS */}

          <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Link
              href="/mes-compagnons"
              className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow"
            >
              <PawPrint
                size={18}
              />

              Mes Compagnons
            </Link>

            <div className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-3 font-black text-white shadow">
              <Users
                size={18}
              />

              La communauté
            </div>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mt-8 rounded-[28px] bg-white p-10 text-center shadow">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

            <p className="mt-4 font-black text-[#064b42]">
              Les Sans Voix arrivent...
            </p>
          </div>
        )}

        {/* ERREUR */}

        {!loading &&
          errorMessage && (
            <div className="mt-8 rounded-[28px] bg-red-50 p-6 font-bold text-red-700">
              {
                errorMessage
              }
            </div>
          )}

        {/* VIDE */}

        {!loading &&
          !errorMessage &&
          companions.length ===
            0 && (
            <div className="mt-8 rounded-[28px] bg-white px-6 py-14 text-center shadow">
              <div className="text-6xl">
                🐾
              </div>

              <h2 className="mt-5 text-2xl font-black text-[#064b42]">
                La communauté attend ses premiers compagnons
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#756d67]">
                Rendez l&apos;un de vos
                compagnons public depuis
                Mes Compagnons pour le
                faire rejoindre la
                communauté.
              </p>

              <Link
                href="/mes-compagnons"
                className="mt-6 inline-flex rounded-full bg-[#ef919b] px-6 py-3 font-black text-white shadow"
              >
                Mes Compagnons
              </Link>
            </div>
          )}

        {/* GRILLE */}

        {!loading &&
          !errorMessage &&
          companions.length >
            0 && (
            <>
              <div className="mt-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                    Notre communauté
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                    {
                      companions.length
                    }{" "}
                    compagnon
                    {companions.length >
                    1
                      ? "s"
                      : ""}
                  </h2>
                </div>

                <Heart
                  size={28}
                  className="text-[#ef919b]"
                />
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {companions.map(
                  (
                    companion
                  ) => {
                    const age =
                      calculateAge(
                        companion.birth_date
                      );

                    const sex =
                      formatSex(
                        companion.sex
                      );

                    return (
                      <article
                        key={
                          companion.id
                        }
                        className="overflow-hidden rounded-[28px] bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
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
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-2xl font-black text-[#064b42]">
                                {
                                  companion.name
                                }
                              </h3>

                              <p className="mt-1 text-sm font-bold text-[#756d67]">
                                {formatSpecies(
                                  companion.species
                                )}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#fce8ec] px-3 py-1 text-xs font-black text-[#d76f7e]">
                              🐾 Taui Te Ora
                            </span>
                          </div>

                          {(sex ||
                            age) && (
                            <p className="mt-3 text-sm font-bold text-[#756d67]">
                              {[
                                sex,
                                age,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </p>
                          )}

                          {companion.breed && (
                            <p className="mt-2 text-sm text-[#756d67]">
                              {
                                companion.breed
                              }
                            </p>
                          )}

                          {companion.color && (
                            <p className="mt-1 text-sm text-[#756d67]">
                              Couleur :{" "}
                              {
                                companion.color
                              }
                            </p>
                          )}

                          {companion.character && (
                            <div className="mt-4 rounded-[20px] bg-[#faf7f2] p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-[#df8995]">
                                Son caractère
                              </p>

                              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6f625a]">
                                {
                                  companion.character
                                }
                              </p>
                            </div>
                          )}

                          {companion.story && (
                            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-[#6f625a]">
                              {
                                companion.story
                              }
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}
      </section>
    </main>
  );
}