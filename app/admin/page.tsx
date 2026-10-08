"use client";

import Link from "next/link";

import {
  BellRing,
  BookOpenText,
  Dog,
  Heart,
  Megaphone,
  PawPrint,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  supabase,
} from "../lib/supabase";

type AdminCard = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

type CompanionSpeciesRow = {
  species: string | null;
};

type SpeciesCount = {
  key: string;
  label: string;
  emoji: string;
  count: number;
};

function normalizeSpecies(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function getSpeciesInfo(
  species: string
) {
  const normalized =
    normalizeSpecies(
      species
    );

  switch (
    normalized
  ) {
    case "chien":
    case "dog":
      return {
        key: "chien",
        label: "Chiens",
        emoji: "🐕",
      };

    case "chat":
    case "cat":
      return {
        key: "chat",
        label: "Chats",
        emoji: "🐈",
      };

    case "cheval":
    case "horse":
      return {
        key: "cheval",
        label:
          "Chevaux / Poneys",
        emoji: "🐎",
      };

    case "poney":
    case "pony":
      return {
        key: "cheval",
        label:
          "Chevaux / Poneys",
        emoji: "🐎",
      };

    case "oiseau":
    case "bird":
      return {
        key: "oiseau",
        label:
          "Oiseaux / Plumes",
        emoji: "🦜",
      };

    case "tavake":
      return {
        key: "tavake",
        label: "Tavake",
        emoji: "🐦",
      };

    case "lapin":
    case "rabbit":
      return {
        key: "lapin",
        label: "Lapins",
        emoji: "🐇",
      };

    default:
      return {
        key:
          normalized ||
          "autre",
        label:
          species.trim() ||
          "Autres",
        emoji: "🐾",
      };
  }
}

export default function AdminPage() {
  const [
    companionRows,
    setCompanionRows,
  ] = useState<
    CompanionSpeciesRow[]
  >([]);

  const [
    loadingStats,
    setLoadingStats,
  ] = useState(true);

  const [
    statsError,
    setStatsError,
  ] = useState("");

  useEffect(() => {
    let active =
      true;

    async function loadCompanionStats() {
      try {
        setLoadingStats(
          true
        );

        setStatsError(
          ""
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "companions"
            )
            .select(
              "species"
            );

        if (
          error
        ) {
          throw error;
        }

        if (
          !active
        ) {
          return;
        }

        setCompanionRows(
          (
            data ||
            []
          ) as CompanionSpeciesRow[]
        );
      } catch (
        error
      ) {
        console.error(
          "Erreur chargement statistiques compagnons :",
          error
        );

        if (
          active
        ) {
          setStatsError(
            error instanceof
              Error
              ? error.message
              : "Impossible de charger les statistiques."
          );
        }
      } finally {
        if (
          active
        ) {
          setLoadingStats(
            false
          );
        }
      }
    }

    void loadCompanionStats();

    return () => {
      active =
        false;
    };
  }, []);

  const speciesCounts =
    useMemo<
      SpeciesCount[]
    >(() => {
      const map =
        new Map<
          string,
          SpeciesCount
        >();

      companionRows.forEach(
        (
          companion
        ) => {
          const rawSpecies =
            String(
              companion.species ||
                ""
            ).trim();

          const info =
            getSpeciesInfo(
              rawSpecies
            );

          const existing =
            map.get(
              info.key
            );

          if (
            existing
          ) {
            existing.count +=
              1;

            return;
          }

          map.set(
            info.key,
            {
              ...info,
              count:
                1,
            }
          );
        }
      );

      const preferredOrder =
        [
          "chien",
          "chat",
          "cheval",
          "oiseau",
          "tavake",
          "lapin",
        ];

      return Array.from(
        map.values()
      ).sort(
        (
          a,
          b
        ) => {
          const indexA =
            preferredOrder.indexOf(
              a.key
            );

          const indexB =
            preferredOrder.indexOf(
              b.key
            );

          if (
            indexA !==
              -1 &&
            indexB !==
              -1
          ) {
            return (
              indexA -
              indexB
            );
          }

          if (
            indexA !==
            -1
          ) {
            return -1;
          }

          if (
            indexB !==
            -1
          ) {
            return 1;
          }

          return a.label.localeCompare(
            b.label,
            "fr"
          );
        }
      );
    }, [
      companionRows,
    ]);

  const totalCompanions =
    companionRows.length;

  const cards: AdminCard[] =
    [
      {
        title:
          "Animaux à adopter",
        description:
          "Gérer les animaux proposés à l’adoption sur Taui Te Ora.",
        href:
          "/admin/animals",
        icon:
          <Dog
            size={
              30
            }
          />,
      },
      {
        title:
          "Compagnons",
        description:
          "Voir les compagnons enregistrés par les utilisateurs.",
        href:
          "/admin/compagnons",
        icon:
          <PawPrint
            size={
              30
            }
          />,
      },
      {
        title:
          "Utilisateurs",
        description:
          "Gérer les comptes, rôles et validations des utilisateurs.",
        href:
          "/admin/users",
        icon:
          <Users
            size={
              30
            }
          />,
      },
      {
        title:
          "Signalements",
        description:
          "Consulter et gérer les signalements effectués sur la plateforme.",
        href:
          "/admin/signalements",
        icon:
          <BellRing
            size={
              30
            }
          />,
      },
      {
        title:
          "Publicités",
        description:
          "Gérer les publicités et partenaires affichés sur Taui Te Ora.",
        href:
          "/admin/publicites",
        icon:
          <Megaphone
            size={
              30
            }
          />,
      },
      {
        title:
          "Pages",
        description:
          "Modifier les textes et contenus des différentes pages.",
        href:
          "/admin/pages",
        icon:
          <BookOpenText
            size={
              30
            }
          />,
      },
    ];

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#df8995] text-white shadow">
              <Heart
                size={
                  28
                }
              />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#df8995]">
                Taui Te Ora
              </p>

              <h1 className="text-3xl font-black text-[#064b42]">
                Administration
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            Gérez les animaux,
            les compagnons,
            les utilisateurs,
            les signalements
            et les contenus de
            la plateforme.
          </p>
        </section>

        {/* =====================================================
            STATISTIQUES COMPAGNONS
        ===================================================== */}

        <section className="mb-8 rounded-[32px] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
                Base de données
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                Compagnons
                enregistrés
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Animaux référencés
                dans « Mes
                compagnons ».
              </p>
            </div>

            <Link
              href="/admin/compagnons"
              className="flex min-w-[120px] flex-col items-center justify-center rounded-[24px] bg-[#064b42] px-5 py-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-3xl font-black">
                {loadingStats
                  ? "…"
                  : totalCompanions}
              </span>

              <span className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white/70">
                Total
              </span>
            </Link>
          </div>

          {statsError ? (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {statsError}
            </div>
          ) : loadingStats ? (
            <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from(
                {
                  length:
                    6,
                }
              ).map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-[108px] animate-pulse rounded-[22px] bg-[#f5efe8]"
                  />
                )
              )}
            </div>
          ) : speciesCounts.length ===
            0 ? (
            <div className="mt-5 rounded-2xl bg-[#f7f1e8] px-4 py-5 text-center text-sm font-bold text-gray-500">
              Aucun compagnon
              enregistré pour le
              moment.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {speciesCounts.map(
                (
                  species
                ) => (
                  <div
                    key={
                      species.key
                    }
                    className="rounded-[22px] border border-[#eee2d8] bg-[#fffaf5] p-4 text-center"
                  >
                    <div className="text-3xl">
                      {
                        species.emoji
                      }
                    </div>

                    <div className="mt-2 text-2xl font-black text-[#064b42]">
                      {
                        species.count
                      }
                    </div>

                    <div className="mt-1 text-xs font-black text-gray-500">
                      {
                        species.label
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            MENU ADMIN
        ===================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(
            (
              card
            ) => (
              <Link
                key={
                  card.href
                }
                href={
                  card.href
                }
                className="group rounded-[28px] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#df8995] transition group-hover:bg-[#df8995] group-hover:text-white">
                  {
                    card.icon
                  }
                </div>

                <h2 className="mt-5 text-xl font-black text-[#064b42]">
                  {
                    card.title
                  }
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {
                    card.description
                  }
                </p>

                <div className="mt-5 font-black text-[#df8995]">
                  Ouvrir →
                </div>
              </Link>
            )
          )}
        </section>
      </div>
    </main>
  );
}