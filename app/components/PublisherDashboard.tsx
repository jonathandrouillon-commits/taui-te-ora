"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type PublisherRole =
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere";

type Stats = {
  animals: number;
  adoptionRequests: number;
  notifications: number;
  likes: number;
};

type PublisherDashboardProps = {
  role: PublisherRole;
  title: string;
  description: string;
};

export default function PublisherDashboard({
  role,
  title,
  description,
}: PublisherDashboardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [stats, setStats] = useState<Stats>({
    animals: 0,
    adoptionRequests: 0,
    notifications: 0,
    likes: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`
        );
        return;
      }

      const userRole =
        user.user_metadata?.role || "";

      /*
       * Protection simple :
       * empêche par exemple un Adoptant
       * d'ouvrir directement ce dashboard.
       */
      if (
        role !== "refuge" &&
        userRole &&
        userRole !== role
      ) {
        router.push("/");
        return;
      }

      if (
        role === "refuge" &&
        userRole &&
        userRole !== "refuge"
      ) {
        router.push("/");
        return;
      }

      const organizationName =
        user.user_metadata
          ?.organization_name || "";

      const fullName =
        user.user_metadata?.full_name ||
        [
          user.user_metadata?.first_name,
          user.user_metadata?.last_name,
        ]
          .filter(Boolean)
          .join(" ");

      setProfileName(
        organizationName ||
          fullName ||
          user.email ||
          ""
      );

      /*
       * Pour l'instant on conserve les mêmes
       * requêtes que ton dashboard existant.
       *
       * Ensuite nous les filtrerons par créateur
       * dès que nous aurons vérifié le nom exact
       * de la colonne owner/created_by dans animals.
       */

      const [
        animalsResult,
        requestsResult,
        notificationsResult,
        likesResult,
      ] = await Promise.all([
        supabase
          .from("animals")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("adoption_requests")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("notifications")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("likes")
          .select("*", {
            count: "exact",
            head: true,
          }),
      ]);

      setStats({
        animals:
          animalsResult.count || 0,

        adoptionRequests:
          requestsResult.count || 0,

        notifications:
          notificationsResult.count || 0,

        likes:
          likesResult.count || 0,
      });
    } catch (error) {
      console.error(
        "Erreur dashboard :",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: "Animaux",
      value: stats.animals,
      href: "/association/animals",
      icon: "🐾",
    },
    {
      title: "Demandes d’adoption",
      value: stats.adoptionRequests,
      href: "/association/demandes",
      icon: "💌",
    },
    {
      title: "Notifications",
      value: stats.notifications,
      href: "/notifications",
      icon: "🔔",
    },
    {
      title: "Coups de cœur",
      value: stats.likes,
      href: "/association/animals",
      icon: "♥",
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 rounded-[30px] bg-white p-6 shadow-md">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#df8995]">
                Taui Te Ora
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#064b42]">
                {title}
              </h1>

              {profileName && (
                <p className="mt-2 font-bold text-[#716a63]">
                  {profileName}
                </p>
              )}

              <p className="mt-3 max-w-2xl text-[#6f6257]">
                {description}
              </p>
            </div>

            <Link
              href="/association/add-animal"
              className="shrink-0 rounded-full bg-[#ef8196] px-6 py-4 text-center font-black text-white shadow-lg"
            >
              + Ajouter un animal
            </Link>

          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-[#6f6257] shadow-md">
            Chargement du dashboard...
          </div>
        ) : (
          <>
            {/* STATISTIQUES */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {cards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="rounded-[24px] bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl">
                    {card.icon}
                  </div>

                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-[#a68c73]">
                    {card.title}
                  </p>

                  <p className="mt-2 text-4xl font-black text-[#064b42]">
                    {card.value}
                  </p>
                </Link>
              ))}
            </section>

            {/* ACTIONS */}
            <section className="mt-6 grid gap-5 lg:grid-cols-2">

              <div className="rounded-[28px] bg-white p-6 shadow-md">
                <h2 className="text-xl font-black text-[#064b42]">
                  Gestion des animaux
                </h2>

                <p className="mt-2 text-sm text-[#746c64]">
                  Publiez un nouvel animal ou gérez les fiches déjà créées.
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/association/add-animal"
                    className="rounded-2xl bg-[#064b42] px-5 py-4 text-center font-bold text-white"
                  >
                    Ajouter un animal
                  </Link>

                  <Link
                    href="/association/animals"
                    className="rounded-2xl border border-[#e5d6c5] px-5 py-4 text-center font-bold text-[#064b42]"
                  >
                    Mes animaux
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-md">
                <h2 className="text-xl font-black text-[#064b42]">
                  Adoptions
                </h2>

                <p className="mt-2 text-sm text-[#746c64]">
                  Consultez les personnes intéressées et les nouvelles demandes d'adoption.
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/association/demandes"
                    className="rounded-2xl bg-[#ef8196] px-5 py-4 text-center font-bold text-white"
                  >
                    Voir les demandes
                  </Link>

                  <Link
                    href="/notifications"
                    className="rounded-2xl border border-[#e5d6c5] px-5 py-4 text-center font-bold text-[#064b42]"
                  >
                    Notifications
                  </Link>
                </div>
              </div>

            </section>

            {/* RETOUR SWIPE */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-block rounded-full bg-white px-6 py-3 font-bold text-[#064b42] shadow"
              >
                ← Retour aux animaux
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
