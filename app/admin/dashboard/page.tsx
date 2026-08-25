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
  BarChart3,
  FileText,
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
  const router = useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    profile,
    setProfile,
  ] = useState<any>(null);

  const [
    users,
    setUsers,
  ] = useState<any[]>([]);

  const [
    animals,
    setAnimals,
  ] = useState<any[]>([]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const currentProfile =
        await profileService.getCurrentProfile();

      if (
        !currentProfile ||
        currentProfile.role !== "admin"
      ) {
        router.replace("/");
        return;
      }

      setProfile(
        currentProfile
      );

      const allUsers =
        await profileService.getAllProfiles();

      setUsers(
        allUsers
      );

      const allAnimals =
        await animalService.getAllWithPhotos();

      setAnimals(
        allAnimals
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur dashboard admin :",
        error
      );

      alert(
        error?.message ||
          "Impossible de charger le dashboard."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleLogout() {
    if (
      loggingOut
    ) {
      return;
    }

    try {
      setLoggingOut(
        true
      );

      const {
        error,
      } =
        await supabase.auth.signOut();

      if (
        error
      ) {
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

  if (
    loading
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#fbf7ef]
          font-black
          text-[#064b42]
        "
      >
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
    <main
      className="
        min-h-screen
        bg-[#fbf7ef]
        p-5
        text-[#064b42]
        sm:p-8
      "
    >
      <section
        className="
          mx-auto
          max-w-7xl
        "
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-4xl
                font-black
                sm:text-5xl
              "
            >
              Administration
            </h1>

            <p
              className="
                mt-2
                text-gray-500
              "
            >
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

        {/* =====================================================
            STATISTIQUES
        ====================================================== */}

        <div
          className="
            mt-10
            grid
            gap-6
            md:grid-cols-2
            lg:grid-cols-4
          "
        >
          <Card
            className="
              text-center
            "
          >
            <Users
              className="
                mx-auto
                text-blue-600
              "
              size={42}
            />

            <h2
              className="
                mt-3
                text-4xl
                font-black
              "
            >
              {
                users.length
              }
            </h2>

            <p
              className="
                text-gray-500
              "
            >
              Utilisateurs
            </p>
          </Card>

          <Card
            className="
              text-center
            "
          >
            <ShieldCheck
              className="
                mx-auto
                text-orange-500
              "
              size={42}
            />

            <h2
              className="
                mt-3
                text-4xl
                font-black
              "
            >
              {
                pendingUsers.length
              }
            </h2>

            <p
              className="
                text-gray-500
              "
            >
              En attente
            </p>
          </Card>

          <Card
            className="
              text-center
            "
          >
            <PawPrint
              className="
                mx-auto
                text-green-600
              "
              size={42}
            />

            <h2
              className="
                mt-3
                text-4xl
                font-black
              "
            >
              {
                animals.length
              }
            </h2>

            <p
              className="
                text-gray-500
              "
            >
              Animaux
            </p>
          </Card>

          <Card
            className="
              text-center
            "
          >
            <Siren
              className="
                mx-auto
                text-red-600
              "
              size={42}
            />

            <h2
              className="
                mt-3
                text-4xl
                font-black
              "
            >
              🚨
            </h2>

            <p
              className="
                text-gray-500
              "
            >
              Signalements
            </p>
          </Card>
        </div>

        {/* =====================================================
            ACTIONS RAPIDES
        ====================================================== */}

        <Card
          className="
            mt-10
          "
        >
          <h2
            className="
              text-3xl
              font-black
            "
          >
            Actions rapides
          </h2>

          <div
            className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-6
            "
          >
            {/* UTILISATEURS */}

            <Button
              onClick={() =>
                router.push(
                  "/admin/users"
                )
              }
            >
              Gérer les utilisateurs
            </Button>

            {/* ANIMAUX */}

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

            {/* SIGNALEMENTS */}

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

            {/* VETERINAIRES */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/veterinaires"
                )
              }
              className="
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#e7f3ef]
                px-4
                py-3
                font-black
                text-[#064b42]
                transition
                hover:bg-[#d7eae4]
                active:scale-[0.98]
              "
            >
              <Stethoscope
                size={20}
              />

              Vétérinaires
            </button>

            {/* PUBLICITES */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/publicites"
                )
              }
              className="
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#f5e7ea]
                px-4
                py-3
                font-black
                text-[#c76d7b]
                transition
                hover:bg-[#efd9de]
                active:scale-[0.98]
              "
            >
              <BarChart3
                size={20}
              />

              Publicités
            </button>

            {/* GESTION DES PAGES */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/pages"
                )
              }
              className="
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#f3ecdf]
                px-4
                py-3
                font-black
                text-[#8b653c]
                transition
                hover:bg-[#eadfcf]
                active:scale-[0.98]
              "
            >
              <FileText
                size={20}
              />

              Gestion des pages
            </button>
          </div>

          {/* ===================================================
              RETOUR SITE / DECONNEXION
          ==================================================== */}

          <div
            className="
              mt-8
              border-t
              border-[#eadfd8]
              pt-6
            "
          >
            <div
              className="
                ml-auto
                flex
                w-full
                max-w-sm
                flex-col
                gap-3
              "
            >
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
                className="
                  flex
                  min-h-[48px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  font-black
                  text-red-600
                  transition
                  hover:bg-red-100
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
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