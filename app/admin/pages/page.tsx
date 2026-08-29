"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ExternalLink,
  Search,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

type DynamicPage = {
  id: string;
  slug: string;
  menu_label: string;
  menu_icon: string | null;
  title: string;
  is_published: boolean;
  show_in_menu: boolean;
};

type ManagedPage = {
  key: string;
  label: string;
  icon: string;
  href: string;
  type:
    | "system"
    | "dynamic";
};

/*
 * =========================================================
 * TOUTES LES PAGES SYSTEME
 * =========================================================
 */

const SYSTEM_PAGES: ManagedPage[] = [
  {
    key: "accueil",
    label: "Accueil",
    icon: "🏠",
    href: "/",
    type: "system",
  },

  {
    key: "arpap",
    label: "ARPAP",
    icon: "🐾",
    href: "/arpap",
    type: "system",
  },

  {
    key: "info",
    label: "Info",
    icon: "ℹ️",
    href: "/info",
    type: "system",
  },

  {
    key: "associations",
    label: "Associations",
    icon: "🤝",
    href: "/associations",
    type: "system",
  },

  {
    key:
      "les-veilleurs-de-kali",
    label:
      "Les Veilleurs de Kali",
    icon: "🐾",
    href:
      "/association/lesveilleursdekali",
    type: "system",
  },

  {
    key: "signalements",
    label: "Signalements",
    icon: "🚨",
    href: "/signalements",
    type: "system",
  },

  {
    key: "evenements",
    label: "Événements",
    icon: "📅",
    href: "/evenements",
    type: "system",
  },

  {
    key: "balades",
    label: "Balades & Copains",
    icon: "🐕",
    href: "/balades",
    type: "system",
  },

  {
    key: "dons",
    label: "Dons",
    icon: "💝",
    href: "/dons",
    type: "system",
  },

  {
    key: "boutique",
    label: "Boutique",
    icon: "🛍️",
    href: "/boutique",
    type: "system",
  },

  {
    key: "veterinaires",
    label: "Vétérinaires",
    icon: "🩺",
    href: "/veterinaires",
    type: "system",
  },

  {
    key: "conseils-sante",
    label: "Conseils santé",
    icon: "❤️‍🩹",
    href: "/conseils-sante",
    type: "system",
  },

  {
    key: "alimentation",
    label: "Alimentation",
    icon: "🥣",
    href: "/alimentation",
    type: "system",
  },

  {
    key: "education",
    label: "Éducation",
    icon: "🎓",
    href: "/education",
    type: "system",
  },

  {
    key: "toilettage",
    label: "Toilettage",
    icon: "✂️",
    href: "/toilettage",
    type: "system",
  },

  {
    key: "gardiennage",
    label: "Gardiennage",
    icon: "🏡",
    href: "/gardiennage",
    type: "system",
  },

  {
    key: "pension",
    label: "Pension",
    icon: "🛏️",
    href: "/pension",
    type: "system",
  },

  {
    key: "hommage",
    label: "Hommage",
    icon: "🕯️",
    href: "/hommage",
    type: "system",
  },
];

export default function AdminPagesPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    dynamicPages,
    setDynamicPages,
  ] = useState<
    DynamicPage[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const initialize =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          if (!user) {
            router.replace(
              "/login?redirect=/admin/pages"
            );

            return;
          }

          const {
            data:
              profile,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "role"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          const role =
            String(
              profile?.role ||
                ""
            )
              .trim()
              .toLowerCase();

          if (
            ![
              "admin",
              "administrateur",
            ].includes(
              role
            )
          ) {
            router.replace(
              "/"
            );

            return;
          }

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "site_pages"
              )
              .select(
                `
                  id,
                  slug,
                  menu_label,
                  menu_icon,
                  title,
                  is_published,
                  show_in_menu
                `
              )
              .order(
                "menu_label",
                {
                  ascending:
                    true,
                }
              );

          if (error) {
            throw error;
          }

          setDynamicPages(
            (data ||
              []) as DynamicPage[]
          );
        } catch (
          error
        ) {
          console.error(
            "Erreur gestion des pages :",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [router]
    );

  useEffect(() => {
    void initialize();
  }, [initialize]);

  /*
   * Fusion pages système
   * + pages dynamiques.
   */

  const pages =
    useMemo<
      ManagedPage[]
    >(() => {
      const systemSlugs =
        new Set(
          SYSTEM_PAGES.map(
            (page) =>
              page.key
          )
        );

      const dynamic =
        dynamicPages
          .filter(
            (page) =>
              !systemSlugs.has(
                String(
                  page.slug
                )
                  .trim()
                  .toLowerCase()
              )
          )
          .map<
            ManagedPage
          >(
            (page) => ({
              key:
                page.id,

              label:
                page.menu_label ||
                page.title ||
                page.slug,

              icon:
                page.menu_icon ||
                "📄",

              href:
                `/pages/${encodeURIComponent(
                  page.slug
                )}`,

              type:
                "dynamic",
            })
          );

      return [
        ...SYSTEM_PAGES,
        ...dynamic,
      ].sort(
        (
          a,
          b
        ) =>
          a.label.localeCompare(
            b.label,
            "fr",
            {
              sensitivity:
                "base",
              ignorePunctuation:
                true,
            }
          )
      );
    }, [
      dynamicPages,
    ]);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return pages;
      }

      return pages.filter(
        (page) =>
          `${page.label} ${page.href}`
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      pages,
      search,
    ]);

  function editPage(
    page: ManagedPage
  ) {
    router.push(
      `${page.href}?edit=1`
    );
  }

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#fbf7ef]
        "
      >
        <p
          className="
            font-black
            text-[#064b42]
          "
        >
          Chargement des pages...
        </p>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#fbf7ef]
        px-4
        pb-24
        pt-24
        sm:px-6
      "
    >
      <section
        className="
          mx-auto
          max-w-7xl
        "
      >
        <div>
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.25em]
              text-[#df8995]
            "
          >
            TAUI TE ORA
          </p>

          <h1
            className="
              mt-1
              text-4xl
              font-black
              text-[#064b42]
            "
          >
            Gestion des pages
          </h1>

          <p
            className="
              mt-2
              max-w-3xl
              text-sm
              leading-6
              text-[#756d67]
            "
          >
            Ouvre une page telle
            qu&apos;elle apparaît
            dans l&apos;application
            puis modifie directement
            ses textes. Le design
            reste verrouillé.
          </p>
        </div>

        {/* RECHERCHE */}

        <div
          className="
            relative
            mt-7
          "
        >
          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher une page..."
            className="
              w-full
              rounded-[18px]
              border
              bg-white
              py-3
              pl-11
              pr-4
            "
          />
        </div>

        {/* PAGES */}

        <div
          className="
            mt-6
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {filtered.map(
            (page) => (
              <article
                key={`${page.type}-${page.key}`}
                className="
                  rounded-[26px]
                  bg-white
                  p-5
                  shadow-md
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      bg-[#f8f4ec]
                      text-2xl
                    "
                  >
                    {
                      page.icon
                    }
                  </div>

                  <div
                    className="
                      min-w-0
                    "
                  >
                    <h2
                      className="
                        truncate
                        text-xl
                        font-black
                        text-[#064b42]
                      "
                    >
                      {
                        page.label
                      }
                    </h2>

                    <p
                      className="
                        truncate
                        text-sm
                        text-gray-500
                      "
                    >
                      {
                        page.href
                      }
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-5
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      editPage(
                        page
                      )
                    }
                    className="
                      rounded-xl
                      bg-[#064b42]
                      px-4
                      py-3
                      font-black
                      text-white
                    "
                  >
                    Modifier la page
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        page.href
                      )
                    }
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#edf7f4]
                      px-4
                      py-3
                      font-black
                      text-[#064b42]
                    "
                  >
                    <ExternalLink
                      size={
                        16
                      }
                    />

                    Voir
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}