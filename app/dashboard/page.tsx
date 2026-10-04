"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardQuestionnaire from "../components/dashboard/DashboardQuestionnaire";
import DashboardLikes from "../components/dashboard/DashboardLikes";
import DashboardAdoptions from "../components/dashboard/DashboardAdoptions";
import DashboardMessages from "../components/dashboard/DashboardMessages";
import DashboardNotifications from "../components/dashboard/DashboardNotifications";
import DashboardPushNotifications from "../components/dashboard/DashboardPushNotifications";
import DashboardHelpVolunteer from "../components/dashboard/DashboardHelpVolunteer";
import DashboardSettings from "../components/dashboard/DashboardSettings";
import CollapsibleDashboardSection from "../components/dashboard/CollapsibleDashboardSection";
import UnifiedProfileSection from "../components/dashboard/UnifiedProfileSection";

import {
  getCurrentUser,
  getProfile,
  getLikes,
  getAdoptionRequests,
  getNotifications,
  getFullName,
  isQuestionnaireFilled,
  logoutUser,
  type Profile,
  type Like,
  type AdoptionRequest,
  type Notification,
} from "../lib/dashboard";

export default function DashboardPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    likes,
    setLikes,
  ] =
    useState<Like[]>([]);

  const [
    adoptionRequests,
    setAdoptionRequests,
  ] =
    useState<
      AdoptionRequest[]
    >([]);

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      Notification[]
    >([]);

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const user =
            await getCurrentUser();

          if (
            !user
          ) {
            window.location.href =
              "/login?redirect=/dashboard";

            return;
          }

          try {
            const profileData =
              await getProfile(
                user.id,
                user.email ||
                  ""
              );

            setProfile(
              profileData
            );
          } catch (
            err:
              unknown
          ) {
            console.error(
              "ERREUR PROFIL:",
              err
            );

            setError(
              "Erreur profil : " +
                getErrorMessage(
                  err
                )
            );
          }

          try {
            const likesData =
              await getLikes(
                user.id
              );

            setLikes(
              likesData
            );
          } catch (
            err:
              unknown
          ) {
            console.error(
              "ERREUR LIKES:",
              err
            );

            setError(
              "Erreur favoris : " +
                getErrorMessage(
                  err
                )
            );
          }

          try {
            const adoptionData =
              await getAdoptionRequests(
                user.id
              );

            setAdoptionRequests(
              adoptionData
            );
          } catch (
            err:
              unknown
          ) {
            console.error(
              "ERREUR DEMANDES:",
              err
            );

            setError(
              "Erreur demandes : " +
                getErrorMessage(
                  err
                )
            );
          }

          try {
            const notificationsData =
              await getNotifications(
                user.id
              );

            setNotifications(
              notificationsData
            );
          } catch (
            err:
              unknown
          ) {
            console.error(
              "ERREUR NOTIFICATIONS:",
              err
            );

            setError(
              "Erreur notifications : " +
                getErrorMessage(
                  err
                )
            );
          }
        } catch (
          err:
            unknown
        ) {
          console.error(
            "ERREUR DASHBOARD COMPLETE:",
            err
          );

          setError(
            "Erreur dashboard : " +
              getErrorMessage(
                err
              )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    queueMicrotask(
      () =>
        void loadDashboard()
    );
  }, [
    loadDashboard,
  ]);

  async function handleLogout() {
    try {
      await logoutUser();

      window.location.href =
        "/login";
    } catch (
      err:
        unknown
    ) {
      console.error(
        "Erreur déconnexion :",
        err
      );

      alert(
        getErrorMessage(
          err
        )
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-bold text-[#3b2f24]">
            Chargement du tableau de bord...
          </p>
        </div>
      </main>
    );
  }

  const unreadCount =
    notifications.filter(
      (
        item
      ) =>
        !item.is_read
    ).length;

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-28 pt-8 sm:px-5">
      <div className="mx-auto max-w-6xl space-y-6">
        {error ? (
          <div className="rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <DashboardHeader
          fullName={
            getFullName(
              profile
            )
          }
          email={
            profile?.email
          }
          role={
            profile?.role
          }
          island={
            profile?.island
          }
          avatarUrl={
            profile?.avatar_url
          }
          onLogout={
            handleLogout
          }
        />

        <CollapsibleDashboardSection
          title="Vue d’ensemble"
          subtitle="Tes informations essentielles en un coup d’œil."
          icon="🏠"
          defaultOpen
        >
          <DashboardStats
            likesCount={
              likes.length
            }
            questionnaireFilled={
              isQuestionnaireFilled(
                profile
              )
            }
            adoptionRequestsCount={
              adoptionRequests.length
            }
            notificationsCount={
              unreadCount
            }
          />
        </CollapsibleDashboardSection>

        <UnifiedProfileSection
          onSaved={() =>
            void loadDashboard()
          }
        />

        <CollapsibleDashboardSection
          title="Mon projet d’adoption"
          subtitle="Questionnaire, favoris et demandes en cours."
          icon="❤️"
        >
          <div className="space-y-6">
            <DashboardQuestionnaire
              profile={
                profile
              }
            />

            <DashboardLikes
              likes={
                likes
              }
            />

            <DashboardAdoptions
              adoptionRequests={
                adoptionRequests
              }
            />
          </div>
        </CollapsibleDashboardSection>

        <CollapsibleDashboardSection
          title="Mes compagnons & entraide"
          subtitle="Accède à tes compagnons et au réseau d’aide."
          icon="🐾"
        >
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="/mes-compagnons"
                className="rounded-2xl bg-[#064b42] px-5 py-4 text-center font-black text-white"
              >
                Mes compagnons
              </a>

              <a
                href="/mes-compagnons/ajouter"
                className="rounded-2xl bg-[#df8995] px-5 py-4 text-center font-black text-white"
              >
                Ajouter un compagnon
              </a>
            </div>

            <DashboardHelpVolunteer />
          </div>
        </CollapsibleDashboardSection>

        <CollapsibleDashboardSection
          title="Messages & notifications"
          subtitle="Conversations, alertes et notifications push."
          icon="💬"
        >
          <div className="space-y-6">
            <DashboardMessages />

            <DashboardNotifications
              notifications={
                notifications
              }
            />

            <DashboardPushNotifications />
          </div>
        </CollapsibleDashboardSection>

        <CollapsibleDashboardSection
          title="Réglages"
          subtitle="Confidentialité, données et déconnexion."
          icon="⚙️"
        >
          <DashboardSettings
            onLogout={
              handleLogout
            }
          />
        </CollapsibleDashboardSection>
      </div>
    </main>
  );
}

function getErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return "Erreur inconnue";
}
