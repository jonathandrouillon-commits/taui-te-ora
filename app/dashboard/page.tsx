"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardProfile from "../components/dashboard/DashboardProfile";
import DashboardQuestionnaire from "../components/dashboard/DashboardQuestionnaire";
import DashboardLikes from "../components/dashboard/DashboardLikes";
import DashboardAdoptions from "../components/dashboard/DashboardAdoptions";
import DashboardNotifications from "../components/dashboard/DashboardNotifications";
import DashboardSettings from "../components/dashboard/DashboardSettings";

import {
  getDashboardData,
  getFullName,
  isQuestionnaireFilled,
  logoutUser,
  type Profile,
  type Like,
  type AdoptionRequest,
  type Notification,
} from "../lib/dashboard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardData();

      if (!data) {
        window.location.href = "/login";
        return;
      }

      setProfile(data.profile);
      setLikes(data.likes);
      setAdoptionRequests(data.adoptionRequests);
      setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Impossible de se déconnecter.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[#3b2f24]">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {error && (
          <div className="rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <DashboardHeader
          fullName={getFullName(profile)}
          email={profile?.email}
          role={profile?.role}
          island={profile?.island}
          avatarUrl={profile?.avatar_url}
          onLogout={handleLogout}
        />

        <DashboardStats
          likesCount={likes.length}
          questionnaireFilled={isQuestionnaireFilled(profile)}
          adoptionRequestsCount={adoptionRequests.length}
          notificationsCount={notifications.filter((item) => !item.is_read).length}
        />

        <section className="grid gap-6 md:grid-cols-2">
          <DashboardProfile profile={profile} />
          <DashboardQuestionnaire profile={profile} />
        </section>

        <DashboardLikes likes={likes} />
        <DashboardAdoptions adoptionRequests={adoptionRequests} />
        <DashboardNotifications notifications={notifications} />
        <DashboardSettings onLogout={handleLogout} />
      </div>
    </main>
  );
}