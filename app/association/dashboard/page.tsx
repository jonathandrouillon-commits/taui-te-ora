"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import RecentRequests from "../../components/dashboard/RecentRequests";
import RecentNotifications from "../../components/dashboard/RecentNotifications";
import { dashboardService } from "../../services/dashboard.service";

type Stats = {
  animals: number;
  publishedAnimals: number;
  requests: number;
  unreadNotifications: number;
  favorites: number;
};

export default function AssociationDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    animals: 0,
    publishedAnimals: 0,
    requests: 0,
    unreadNotifications: 0,
    favorites: 0,
  });

  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [statsData, requestsData, notificationsData] = await Promise.all([
        dashboardService.getAssociationDashboardStats(),
        dashboardService.getRecentAssociationRequests(5),
        dashboardService.getRecentNotifications(5),
      ]);

      setStats(statsData);
      setRequests(requestsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Tableau de bord"
      subtitle="Vue d’ensemble de votre activité sur TAUI TE ORA."
    >
      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <p className="text-xl font-black text-[#064b42]">
            Chargement du dashboard...
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Animaux" value={stats.animals} icon="🐶" />
            <StatCard
              label="Publiés"
              value={stats.publishedAnimals}
              icon="🟢"
            />
            <StatCard label="Demandes" value={stats.requests} icon="📥" />
            <StatCard
              label="Notifications"
              value={stats.unreadNotifications}
              icon="🔔"
            />
            <StatCard label="Coups de cœur" value={stats.favorites} icon="❤️" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <RecentRequests requests={requests} />
            <RecentNotifications notifications={notifications} />
          </section>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow">
            <h2 className="text-xl font-black text-[#064b42]">
              Actions rapides
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QuickAction href="/association/add-animal" label="Ajouter un animal" />
              <QuickAction href="/association/animals" label="Mes animaux" />
              <QuickAction href="/association/demandes" label="Demandes" />
              <QuickAction href="/notifications" label="Notifications" />
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-[#f4eee3] px-5 py-4 text-center font-bold text-[#064b42] transition hover:bg-[#eadfcf]"
    >
      {label}
    </a>
  );
}