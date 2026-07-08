"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Stats = {
  animals: number;
  adoptionRequests: number;
  notifications: number;
  likes: number;
};

export default function AssociationDashboardPage() {
  const [loading, setLoading] = useState(true);
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

      const { count: animalsCount } = await supabase
        .from("animals")
        .select("*", { count: "exact", head: true });

      const { count: requestsCount } = await supabase
        .from("adoption_requests")
        .select("*", { count: "exact", head: true });

      const { count: notificationsCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true });

      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true });

      setStats({
        animals: animalsCount || 0,
        adoptionRequests: requestsCount || 0,
        notifications: notificationsCount || 0,
        likes: likesCount || 0,
      });
    } catch (error) {
      console.error("Erreur dashboard :", error);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: "Animaux publiés",
      value: stats.animals,
      href: "/association/animaux",
    },
    {
      title: "Demandes d’adoption",
      value: stats.adoptionRequests,
      href: "/association/adoptions",
    },
    {
      title: "Notifications",
      value: stats.notifications,
      href: "/association/notifications",
    },
    {
      title: "Likes reçus",
      value: stats.likes,
      href: "/association/likes",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[32px] bg-white p-6 shadow-md">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#b58b5b]">
            TAUI TE ORA
          </p>

          <h1 className="text-3xl font-bold text-[#2f241c]">
            Dashboard Association
          </h1>

          <p className="mt-2 text-[#6f6257]">
            Gérez vos animaux, vos demandes d’adoption, vos notifications et
            vos interactions.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-[#6f6257] shadow-md">
            Chargement du dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="rounded-[28px] bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b58b5b]">
                    {card.title}
                  </p>

                  <p className="mt-4 text-4xl font-bold text-[#2f241c]">
                    {card.value}
                  </p>
                </Link>
              ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#2f241c]">
                  Actions rapides
                </h2>

                <div className="grid gap-3">
                  <Link
                    href="/association/animal/new"
                    className="rounded-2xl bg-[#2f241c] px-5 py-4 text-center font-semibold text-white"
                  >
                    Ajouter un animal
                  </Link>

                  <Link
                    href="/association/adoptions"
                    className="rounded-2xl border border-[#e5d6c5] px-5 py-4 text-center font-semibold text-[#2f241c]"
                  >
                    Voir les demandes
                  </Link>

                  <Link
                    href="/association/notifications"
                    className="rounded-2xl border border-[#e5d6c5] px-5 py-4 text-center font-semibold text-[#2f241c]"
                  >
                    Voir les notifications
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#2f241c]">
                  État du compte
                </h2>

                <p className="text-[#6f6257]">
                  Votre espace association est actif. Les prochaines fonctions
                  pourront afficher ici les derniers animaux ajoutés, les
                  nouvelles demandes et les messages importants.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}