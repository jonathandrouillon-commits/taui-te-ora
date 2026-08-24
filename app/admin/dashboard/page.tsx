"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Users,
  PawPrint,
  ShieldCheck,
  Siren,
  LogOut,
  Stethoscope,
} from "lucide-react";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import {
  profileService,
} from "../../services/profile.service";

import {
  animalService,
} from "../../services/animal.service";

import {
  supabase,
} from "../../lib/supabase";

export default function AdminDashboardPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const [
    profile,
    setProfile,
  ] =
    useState<any>(
      null
    );

  const [
    users,
    setUsers,
  ] =
    useState<any[]>(
      []
    );

  const [
    animals,
    setAnimals,
  ] =
    useState<any[]>(
      []
    );

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const currentProfile =
        await profileService
          .getCurrentProfile();

      if (
        !currentProfile ||
        currentProfile.role !==
          "admin"
      ) {
        router.replace(
          "/"
        );

        return;
      }

      setProfile(
        currentProfile
      );

      setUsers(
        await profileService
          .getAllProfiles()
      );

      setAnimals(
        await animalService
          .getAllWithPhotos()
      );
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Erreur chargement administration."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(
        true
      );

      const {
        error,
      } =
        await supabase.auth
          .signOut();

      if (error) {
        throw error;
      }

      router.replace(
        "/login"
      );

      router.refresh();
    } catch (
      error: any
    ) {
      console.error(
        "Erreur déconnexion admin :",
        error
      );

      alert(
        error?.message ||
          "Impossible de vous déconnecter."
      );

      setLoggingOut(
        false
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  const pendingUsers =
    users.filter(
      (
        user
      ) =>
        (
          user.approval_status ||
          "pending"
        ) ===
        "pending"
    );

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-5 text-[#064b42] sm:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black sm:text-5xl">
              Administration
            </h1>

            <p className="mt-2 text-gray-500">
              Bonjour{" "}
              {profileService.getDisplayName(
                profile
              )}
            </p>
          </div>

          <Button
            onClick={() =>
              router.push(
                "/admin/users"
              )
            }
          >
            Gérer les utilisateurs
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          <Card className="text-center">
            <Users
              className="mx-auto text-blue-600"
              size={42}
            />

            <h2 className="mt-3 text-4xl font-black">
              {users.length}
            </h2>

            <p className="text-gray-500">
              Utilisateurs
            </p>
          </Card>

          <Card className="text-center">
            <ShieldCheck
              className="mx-auto text-orange-500"
              size={42}
            />

            <h2 className="mt-3 text-4xl font-black">
              {
                pendingUsers.length
              }
            </h2>

            <p className="text-gray-500">
              En attente
            </p>
          </Card>

          <Card className="text-center">
            <PawPrint
              className="mx-auto text-green-600"
              size={42}
            />

            <h2 className="mt-3 text-4xl font-black">
              {animals.length}
            </h2>

            <p className="text-gray-500">
              Animaux
            </p>
          </Card>

          <Card className="text-center">
            <Siren
              className="mx-auto text-red-600"
              size={42}
            />

            <h2 className="mt-3 text-4xl font-black">
              🚨
            </h2>

            <p className="text-gray-500">
              Signalements
            </p>
          </Card>
        </div>

        <Card className="mt-10">
          <h2 className="text-3xl font-black">
            Actions rapides
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Button
              onClick={() =>
                router.push(
                  "/admin/users"
                )
              }
            >
              Valider les comptes
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/association/animals"
                )
              }
            >
              Voir les animaux
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/admin/signalements"
                )
              }
            >
              Voir les signalements
            </Button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/veterinaires"
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-[#e7f3ef] px-4 py-3 font-black text-[#064b42] transition hover:bg-[#d7eae4]"
            >
              <Stethoscope
                size={19}
              />

              Vétérinaires
            </button>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  router.push(
                    "/"
                  )
                }
              >
                Retour au site
              </Button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut
                  size={19}
                />

                {loggingOut
                  ? "Déconnexion..."
                  : "Déconnexion"}
              </button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}