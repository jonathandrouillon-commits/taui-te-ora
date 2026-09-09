"use client";

import Link from "next/link";

import {
  useCallback,
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
  Eye,
  MousePointerClick,
  Activity,
  Building2,
  HeartHandshake,
  Bell,
} from "lucide-react";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import DashboardMessages from "../../components/dashboard/DashboardMessages";

import {
  profileService,
} from "../../services/profile.service";

import {
  animalService,
} from "../../services/animal.service";

import {
  supabase,
} from "../../lib/supabase";


type AdminAdoptionRequest = {
  id: string;
  created_at?: string | null;
  animal_id?: string | null;
  requester_id?: string | null;
  owner_id?: string | null;
  status?: string | null;
  match_score?: number | null;
  match_level?: string | null;
  conditions_snapshot?: unknown;
  conditions_accepted_at?: string | null;
  signature_signer_name?: string | null;
  signature_data_url?: string | null;
  signature_signed_at?: string | null;
};

type SignedCondition = {
  id?: string | number;
  text: string;
};

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
    preferredLanguage,
    setPreferredLanguage,
  ] = useState<"fr" | "en">("fr");

  const [
    savingLanguage,
    setSavingLanguage,
  ] = useState(false);

  const [
    languageSaved,
    setLanguageSaved,
  ] = useState(false);

  const tr = (fr: string, en: string) =>
    preferredLanguage === "en" ? en : fr;

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const [
    users,
    setUsers,
  ] = useState<any[]>([]);

  const [
    animals,
    setAnimals,
  ] = useState<any[]>([]);

  const [
    signalements,
    setSignalements,
  ] = useState<any[]>([]);

  const [
    adoptionRequests,
    setAdoptionRequests,
  ] = useState<AdminAdoptionRequest[]>([]);

  const [
    adoptionRequestsError,
    setAdoptionRequestsError,
  ] = useState<string | null>(null);

  const [
    analytics,
    setAnalytics,
  ] = useState({
    visitors_today: 0,
    visitors_total: 0,
    page_views_today: 0,
    page_views_total: 0,
    ad_impressions: 0,
    ad_clicks: 0,
  });

  const [
    analyticsError,
    setAnalyticsError,
  ] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      await Promise.resolve();
      setLoading(true);
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

      setPreferredLanguage(
        currentProfile.preferred_language === "en"
          ? "en"
          : "fr"
      );

      const {
        count: unreadNotificationCount,
        error: unreadNotificationError,
      } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "recipient_id",
          currentProfile.id
        )
        .eq(
          "is_read",
          false
        );

      if (unreadNotificationError) {
        console.error(
          "Erreur chargement notifications admin :",
          unreadNotificationError
        );
      } else {
        setUnreadNotifications(
          unreadNotificationCount || 0
        );
      }

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

      const {
        data: signalementData,
        error: signalementError,
      } = await supabase
        .from("signalements")
        .select("id, created_at, status, type_signalement, animal_type, island, city")
        .order("created_at", { ascending: false });

      if (signalementError) {
        console.error("Erreur chargement signalements :", signalementError);
      } else {
        setSignalements(signalementData || []);
      }


      const {
        data: adoptionRequestData,
        error: adoptionRequestError,
      } = await supabase
        .from("adoption_requests")
        .select(`
          id,
          created_at,
          animal_id,
          requester_id,
          owner_id,
          status,
          match_score,
          match_level,
          conditions_snapshot,
          conditions_accepted_at,
          signature_signer_name,
          signature_data_url,
          signature_signed_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (adoptionRequestError) {
        console.error(
          "Erreur chargement demandes adoption admin :",
          adoptionRequestError
        );

        setAdoptionRequestsError(
          adoptionRequestError.message ||
            "Impossible de charger les demandes d'adoption."
        );
      } else {
        setAdoptionRequestsError(null);
        setAdoptionRequests(
          (adoptionRequestData || []) as AdminAdoptionRequest[]
        );
      }

      const {
        data: analyticsData,
        error: analyticsError,
      } = await supabase.rpc("get_admin_analytics");

      if (analyticsError) {
        console.error(
          "Erreur statistiques analytics :",
          analyticsError
        );

        setAnalyticsError(
          analyticsError.message ||
            "Les statistiques sont temporairement indisponibles."
        );
      } else if (analyticsData) {
        setAnalyticsError(null);

        setAnalytics({
          visitors_today: Number(analyticsData.visitors_today || 0),
          visitors_total: Number(analyticsData.visitors_total || 0),
          page_views_today: Number(analyticsData.page_views_today || 0),
          page_views_total: Number(analyticsData.page_views_total || 0),
          ad_impressions: Number(analyticsData.ad_impressions || 0),
          ad_clicks: Number(analyticsData.ad_clicks || 0),
        });
      } else {
        setAnalyticsError(
          "Les statistiques n'ont retourné aucune donnée."
        );
      }
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
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const channel = supabase
      .channel(
        `admin-dashboard-notifications-${profile.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          setUnreadNotifications(
            (current) => current + 1
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [profile?.id]);

  async function savePreferredLanguage() {
    if (!profile?.id || savingLanguage) {
      return;
    }

    try {
      setSavingLanguage(true);
      setLanguageSaved(false);

      const {
        error: profileLanguageError,
      } = await supabase
        .from("profiles")
        .update({
          preferred_language: preferredLanguage,
        })
        .eq("id", profile.id);

      if (profileLanguageError) {
        throw profileLanguageError;
      }

      const {
        error: authLanguageError,
      } = await supabase.auth.updateUser({
        data: {
          preferred_language: preferredLanguage,
        },
      });

      if (authLanguageError) {
        console.error(
          "Erreur mise à jour langue Auth :",
          authLanguageError
        );
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "taui-te-ora-language",
          preferredLanguage
        );

        window.dispatchEvent(
          new CustomEvent(
            "taui-te-ora-language-change",
            {
              detail: preferredLanguage,
            }
          )
        );
      }

      setProfile((current: any) => ({
        ...current,
        preferred_language: preferredLanguage,
      }));

      setLanguageSaved(true);

      window.setTimeout(() => {
        setLanguageSaved(false);
      }, 2500);
    } catch (error: any) {
      console.error(
        "Erreur sauvegarde langue admin :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'enregistrer la langue."
      );
    } finally {
      setSavingLanguage(false);
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
        {tr("Chargement...", "Loading...")}
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

  function normalizeSignalementStatus(status: string | null | undefined) {
    const value = String(status || "").trim().toLowerCase();

    if (
      value === "en_cours" ||
      value === "sauvetage en cours" ||
      value === "en intervention" ||
      value === "en_intervention" ||
      value === "pris_en_charge"
    ) return "en_cours";

    if (
      value === "animal_retrouve" ||
      value === "animal retrouvé" ||
      value === "animal retrouve"
    ) return "animal_retrouve";

    if (
      value === "cloture" ||
      value === "signalement cloturé" ||
      value === "signalement clôturé" ||
      value === "signalement cloture" ||
      value === "signalement clôture"
    ) return "cloture";

    return "nouveau";
  }

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday);
  startWeek.setDate(startToday.getDate() - ((startToday.getDay() + 6) % 7));
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const newSignalements = signalements.filter(
    (item) => normalizeSignalementStatus(item.status) === "nouveau"
  ).length;

  const signalementsToday = signalements.filter(
    (item) => item.created_at && new Date(item.created_at) >= startToday
  ).length;

  const signalementsWeek = signalements.filter(
    (item) => item.created_at && new Date(item.created_at) >= startWeek
  ).length;

  const signalementsMonth = signalements.filter(
    (item) => item.created_at && new Date(item.created_at) >= startMonth
  ).length;

  const signalementsByCity = Object.entries(
    signalements.reduce((acc: Record<string, number>, item) => {
      const city = String(item.city || "Commune non renseignée").trim() || "Commune non renseignée";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  function exportSignalementsCsv() {
    const headers = ["Date", "Statut", "Type", "Animal", "Ile", "Commune"];
    const rows = signalements.map((item) => [
      item.created_at ? new Date(item.created_at).toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR") : "",
      normalizeSignalementStatus(item.status),
      item.type_signalement || "",
      item.animal_type || "",
      item.island || "",
      item.city || "",
    ]);

    const esc = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(esc).join(";"),
      ...rows.map((row) => row.map(esc).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taui-te-ora-signalements-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  const signedAdoptionRequests =
    adoptionRequests.filter(
      (request) =>
        Boolean(
          request.signature_signed_at ||
            request.conditions_accepted_at ||
            request.signature_data_url
        )
    );

  function getProfileNameById(
    profileId?: string | null
  ) {
    if (!profileId) return tr("Profil inconnu", "Unknown profile");

    const found = users.find(
      (item) => item.id === profileId
    );

    if (!found) return tr("Profil inconnu", "Unknown profile");

    return (
      found.organization_name ||
      `${found.first_name || ""} ${
        found.last_name || ""
      }`.trim() ||
      tr("Profil", "Profile")
    );
  }

  function getAdminRequestStatusLabelLocalized(
    status?: string | null
  ) {
    const value = String(status || "pending")
      .trim()
      .toLowerCase();

    switch (value) {
      case "meeting":
        return tr("Rencontre", "Meeting");
      case "accepted":
        return tr("Adoption validée", "Adoption approved");
      case "rejected":
      case "refused":
        return tr("Refusée", "Rejected");
      case "cancelled":
        return tr("Annulée", "Cancelled");
      case "pending":
      default:
        return tr("En attente", "Pending");
    }
  }

  function getAnimalById(
    animalId?: string | null
  ) {
    if (!animalId) return null;

    return (
      animals.find(
        (item) => item.id === animalId
      ) || null
    );
  }

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
                mt-12
                text-4xl
                font-black
                sm:mt-10
                sm:text-5xl
              "
            >
              {tr("Administration", "Administration")}
            </h1>

            <p
              className="
                mt-2
                text-gray-500
              "
            >
              {tr("Bonjour", "Hello")}{" "}
              {profileService.getDisplayName(
                profile
              )}
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/notifications"
                )
              }
              className="
                relative
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#d8e9e3]
                bg-white
                px-4
                py-3
                font-black
                text-[#064b42]
                shadow-sm
                transition
                hover:bg-[#e8f5f1]
                active:scale-[0.98]
              "
              aria-label="Notifications"
            >
              <Bell size={21} />
              {tr("Notifications", "Notifications")}

              {unreadNotifications > 0 && (
                <span
                  className="
                    flex
                    min-w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-red-600
                    px-1.5
                    py-0.5
                    text-xs
                    font-black
                    text-white
                  "
                >
                  {unreadNotifications > 99
                    ? "99+"
                    : unreadNotifications}
                </span>
              )}
            </button>

            <Button
              onClick={() =>
                router.push(
                  "/admin/users"
                )
              }
            >
              {tr("Gérer les utilisateurs", "Manage users")}
            </Button>
          </div>
        </div>

        {/* =====================================================
            LANGUE DE L'APPLICATION
        ====================================================== */}

        <Card className="mt-10 border border-[#d8e9e3]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
                {tr("Préférences", "Preferences")}
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                🌐 {tr("Langue de l’application", "Application language")}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                {tr("Choisissez la langue utilisée par Taui Te Ora pour votre compte administrateur.", "Choose the language used by Taui Te Ora for your administrator account.")}
              </p>

              <select
                value={preferredLanguage}
                onChange={(event) => {
                  setPreferredLanguage(
                    event.target.value === "en"
                      ? "en"
                      : "fr"
                  );
                  setLanguageSaved(false);
                }}
                className="mt-4 w-full max-w-sm rounded-xl border border-[#d8e9e3] bg-white px-4 py-3 font-bold text-[#064b42] outline-none transition focus:border-[#064b42]"
              >
                <option value="fr">
                  🇫🇷 Français
                </option>
                <option value="en">
                  🇬🇧 English
                </option>
              </select>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => void savePreferredLanguage()}
                disabled={savingLanguage}
                className="min-h-[48px] rounded-xl bg-[#064b42] px-6 py-3 font-black text-white transition hover:bg-[#08695d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingLanguage
                  ? tr("Enregistrement...", "Saving...")
                  : tr("Enregistrer la langue", "Save language")}
              </button>

              {languageSaved && (
                <p className="text-sm font-black text-green-700">
                  ✓ {tr("Langue enregistrée", "Language saved")}
                </p>
              )}
            </div>
          </div>
        </Card>

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
              {tr("Utilisateurs", "Users")}
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
              {tr("En attente", "Pending")}
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
              {tr("Animaux", "Animals")}
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
              {
                signalements.length
              }
            </h2>

            <p
              className="
                text-gray-500
              "
            >
              {tr("Signalements", "Reports")}
            </p>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-red-600">
                  {tr("Nouveau signalement", "New report")}
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700">
                  {newSignalements}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* =====================================================
            RAPPORT DES SIGNALEMENTS
        ====================================================== */}

        <div className="mt-10">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">{tr("Rapport des signalements", "Report overview")}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {tr("Analyse par période et par commune.", "Analysis by period and municipality.")}
              </p>
            </div>

            <button
              type="button"
              onClick={exportSignalementsCsv}
              className="rounded-xl bg-[#064b42] px-5 py-3 font-black text-white transition hover:bg-[#08695d] active:scale-[0.98]"
            >
              {tr("Exporter CSV", "Export CSV")}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <h3 className="text-4xl font-black text-red-600">{signalementsToday}</h3>
              <p className="mt-1 text-gray-500">{tr("Aujourd’hui", "Today")}</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-4xl font-black text-orange-600">{signalementsWeek}</h3>
              <p className="mt-1 text-gray-500">{tr("Cette semaine", "This week")}</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-4xl font-black text-[#064b42]">{signalementsMonth}</h3>
              <p className="mt-1 text-gray-500">{tr("Ce mois", "This month")}</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-4xl font-black text-[#064b42]">{signalements.length}</h3>
              <p className="mt-1 text-gray-500">{tr("Cumulé", "Total")}</p>
            </Card>
          </div>

          <Card className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black">{tr("Signalements par commune", "Reports by municipality")}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {tr("Nombre et part de chaque commune dans les signalements reçus.", "Number and share of reports received for each municipality.")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/admin/signalements")}
                className="rounded-xl bg-[#f3ecdf] px-4 py-2.5 font-black text-[#8b653c]"
              >
                {tr("Voir les signalements", "View reports")}
              </button>
            </div>

            {signalementsByCity.length === 0 ? (
              <p className="mt-5 text-gray-500">{tr("Aucun signalement enregistré.", "No reports recorded.")}</p>
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {signalementsByCity.map(([city, count]) => {
                  const percentage =
                    signalements.length > 0
                      ? Math.round((count / signalements.length) * 100)
                      : 0;

                  return (
                    <div
                      key={city}
                      className="rounded-2xl border border-[#eadfd8] bg-[#fffdf9] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-black text-[#064b42]">{city}</span>
                        <span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-sm font-black text-[#064b42]">
                          {count}
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7de]">
                        <div
                          className="h-full rounded-full bg-[#064b42]"
                          style={{
                            width: `${Math.max(percentage, count > 0 ? 3 : 0)}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs font-bold text-gray-500">
                        {percentage}% {tr("du total", "of total")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>


        {/* =====================================================
            CONDITIONS D'ADOPTION SIGNEES
        ====================================================== */}

        <div className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
              {tr("Traçabilité", "Traceability")}
            </p>

            <h2 className="mt-1 text-3xl font-black">
              {tr("Conditions d’adoption signées", "Signed adoption conditions")}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
              L&apos;administration peut consulter les conditions acceptées,
              la signature enregistrée et l&apos;attestation associée à chaque
              demande d&apos;adoption.
            </p>
          </div>

          {adoptionRequestsError ? (
            <Card className="border border-red-200 bg-red-50">
              <p className="font-black text-red-700">
                {tr("Impossible de charger les demandes signées.", "Unable to load signed requests.")}
              </p>
              <p className="mt-2 text-sm text-red-600">
                {adoptionRequestsError}
              </p>
            </Card>
          ) : signedAdoptionRequests.length === 0 ? (
            <Card>
              <div className="py-6 text-center text-gray-500">
                {tr("Aucune demande avec conditions signées pour le moment.", "No requests with signed conditions yet.")}
              </div>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {signedAdoptionRequests.map((request) => {
                const animal =
                  getAnimalById(request.animal_id);

                const animalName =
                  animal?.animal_name ||
                  "Animal";

                const adopterName =
                  getProfileNameById(
                    request.requester_id
                  );

                const structureName =
                  getProfileNameById(
                    request.owner_id
                  );

                const conditions =
                  normalizeSignedConditions(
                    request.conditions_snapshot
                  );

                const signedAt =
                  request.signature_signed_at ||
                  request.conditions_accepted_at ||
                  request.created_at ||
                  null;

                return (
                  <Card
                    key={request.id}
                    className="border border-[#d8e9e3]"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2f8f6b]">
                            {tr("Demande signée", "Signed request")}
                          </p>

                          <h3 className="mt-1 text-2xl font-black text-[#064b42]">
                            {animalName}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {tr("Adoptant", "Adopter")} :{" "}
                            <strong className="text-[#2f241c]">
                              {adopterName}
                            </strong>
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {tr("Structure", "Organization")} :{" "}
                            <strong className="text-[#2f241c]">
                              {structureName}
                            </strong>
                          </p>
                        </div>

                        <span className="self-start rounded-full bg-[#e8f5f1] px-3 py-1.5 text-sm font-black text-[#064b42]">
                          {typeof request.match_score === "number"
                            ? `Match ${request.match_score}%`
                            : tr("Demande d’adoption", "Adoption request")}
                        </span>
                      </div>

                      <div className="grid gap-3 rounded-2xl bg-[#f8f4ec] p-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
                            {tr("Signataire", "Signer")}
                          </p>
                          <p className="mt-1 font-bold text-[#2f241c]">
                            {request.signature_signer_name ||
                              adopterName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
                            {tr("Date de signature", "Signature date")}
                          </p>
                          <p className="mt-1 font-bold text-[#2f241c]">
                            {new Intl.DateTimeFormat(preferredLanguage === "en" ? "en-GB" : "fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(signedAt || Date.now()))}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
                            {tr("Conditions", "Conditions")}
                          </p>
                          <p className="mt-1 font-bold text-[#2f241c]">
                            {preferredLanguage === "en"
                              ? `${conditions.length} condition${conditions.length > 1 ? "s" : ""} recorded`
                              : `${conditions.length} condition${conditions.length > 1 ? "s" : ""} enregistrée${conditions.length > 1 ? "s" : ""}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
                            {tr("Statut", "Status")}
                          </p>
                          <p className="mt-1 font-bold text-[#2f241c]">
                            {getAdminRequestStatusLabelLocalized(
                              request.status
                            )}
                          </p>
                        </div>
                      </div>

                      {conditions.length > 0 && (
                        <details className="rounded-2xl border border-[#eadfd8] bg-white p-4">
                          <summary className="cursor-pointer font-black text-[#064b42]">
                            {tr("Voir les conditions acceptées", "View accepted conditions")}
                          </summary>

                          <ol className="mt-4 space-y-3">
                            {conditions.map(
                              (
                                condition,
                                index
                              ) => (
                                <li
                                  key={
                                    condition.id ??
                                    index
                                  }
                                  className="flex gap-3 text-sm leading-6 text-gray-600"
                                >
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f5f1] text-xs font-black text-[#064b42]">
                                    ✓
                                  </span>
                                  <span>
                                    {condition.text}
                                  </span>
                                </li>
                              )
                            )}
                          </ol>
                        </details>
                      )}

                      {request.signature_data_url && (
                        <details className="rounded-2xl border border-[#eadfd8] bg-white p-4">
                          <summary className="cursor-pointer font-black text-[#064b42]">
                            {tr("Voir la signature", "View signature")}
                          </summary>

                          <div className="mt-4 rounded-xl border border-[#eadfd8] bg-white p-3">
                            <img
                              src={
                                request.signature_data_url
                              }
                              alt={`Signature de ${
                                request.signature_signer_name ||
                                adopterName
                              }`}
                              className="max-h-44 w-full object-contain"
                            />
                          </div>
                        </details>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={
                            !request.signature_data_url
                          }
                          onClick={() => {
                            if (
                              !request.signature_data_url
                            ) {
                              return;
                            }

                            downloadDataUrl(
                              request.signature_data_url,
                              `signature-${safeFilePart(
                                animalName
                              )}-${safeFilePart(
                                request.signature_signer_name ||
                                  adopterName
                              )}.png`
                            );
                          }}
                          className="rounded-xl border border-[#064b42] bg-white px-4 py-3 font-black text-[#064b42] transition hover:bg-[#e8f5f1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓ {tr("Télécharger la signature", "Download signature")}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAdminSignedCertificate({
                              request,
                              animalName,
                              adopterName,
                              structureName,
                            })
                          }
                          className="rounded-xl bg-[#064b42] px-4 py-3 font-black text-white transition hover:bg-[#08695d]"
                        >
                          📄 {tr("Attestation signée", "Signed certificate")}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            ANALYTICS
        ====================================================== */}

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-3xl font-black">
              {tr("Statistiques du site", "Site statistics")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Suivi des visites et des performances publicitaires depuis
              l’activation des statistiques.
            </p>
          </div>

          {analyticsError ? (
            <Card className="border border-red-200 bg-red-50">
              <div className="text-center">
                <Activity
                  className="mx-auto text-red-600"
                  size={38}
                />
                <h3 className="mt-3 text-xl font-black text-red-700">
                  {tr("Statistiques indisponibles", "Statistics unavailable")}
                </h3>
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {tr("Les données analytics n’ont pas pu être chargées.", "Analytics data could not be loaded.")}
                </p>
                <p className="mt-1 text-xs text-red-500">
                  {analyticsError}
                </p>
              </div>
            </Card>
          ) : (
            <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <Users className="mx-auto text-blue-600" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.visitors_today.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Visiteurs aujourd’hui", "Visitors today")}</p>
            </Card>

            <Card className="text-center">
              <Users className="mx-auto text-[#064b42]" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.visitors_total.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Visiteurs cumulés", "Total visitors")}</p>
            </Card>

            <Card className="text-center">
              <Eye className="mx-auto text-violet-600" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.page_views_today.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Pages vues aujourd’hui", "Page views today")}</p>
            </Card>

            <Card className="text-center">
              <Activity className="mx-auto text-indigo-600" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.page_views_total.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Pages vues cumulées", "Total page views")}</p>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Card className="text-center">
              <Eye className="mx-auto text-[#c76d7b]" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.ad_impressions.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Affichages publicitaires", "Ad impressions")}</p>
            </Card>

            <Card className="text-center">
              <MousePointerClick
                className="mx-auto text-[#c76d7b]"
                size={38}
              />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.ad_clicks.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}
              </h3>
              <p className="text-gray-500">{tr("Clics publicitaires", "Ad clicks")}</p>
            </Card>

            <Card className="text-center">
              <BarChart3 className="mx-auto text-[#c76d7b]" size={38} />
              <h3 className="mt-3 text-4xl font-black">
                {analytics.ad_impressions > 0
                  ? (
                      (analytics.ad_clicks / analytics.ad_impressions) *
                      100
                    ).toFixed(2)
                  : "0.00"}
                %
              </h3>
              <p className="text-gray-500">{tr("CTR publicitaire global", "Overall ad CTR")}</p>
            </Card>
          </div>
            </>
          )}
        </div>

        <div className="mt-10">
          <DashboardMessages />
        </div>

        {/* =====================================================
            RESEAU D'AIDE / SOS
        ====================================================== */}

        <Card className="mt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
                {tr("Entraide", "Community help")}
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#064b42]">
                🤝 {tr("Réseau d’aide", "Help network")}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                {tr("Consultez les bénévoles et familles d’accueil disponibles, puis créez, suivez et clôturez les SOS du réseau TAUI TE ORA.", "View available volunteers and foster families, then create, track and close SOS requests across the TAUI TE ORA network.")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/reseau-aide")}
                className="
                  flex
                  min-h-[48px]
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#064b42]
                  px-6
                  py-3
                  font-black
                  text-white
                  shadow-md
                  transition
                  hover:bg-[#08695d]
                  active:scale-[0.98]
                "
              >
                <HeartHandshake size={20} />
                {tr("Voir le réseau d’aide", "View help network")}
              </button>

              <button
                type="button"
                onClick={() => router.push("/sos-aide")}
                className="
                  flex
                  min-h-[48px]
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#df8995]
                  px-6
                  py-3
                  font-black
                  text-white
                  shadow-md
                  transition
                  hover:bg-[#d87584]
                  active:scale-[0.98]
                "
              >
                <Siren size={20} />
                {tr("Créer / gérer les SOS", "Create / manage SOS")}
              </button>
            </div>
          </div>
        </Card>

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
            {tr("Actions rapides", "Quick actions")}
          </h2>

          <div
            className="
              mt-6
              grid
              gap-4
              md:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-10
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
              {tr("Gérer les utilisateurs", "Manage users")}
            </Button>

            {/* MESSAGES */}

            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/messages"
                )
              }
            >
              {tr("Voir les messages", "View messages")}
            </Button>

            {/* ANIMAUX */}

            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/admin/animals"
                )
              }
            >
              {tr("Gérer les animaux", "Manage animals")}
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

            {/* ASSOCIATIONS */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/associations"
                )
              }
              className="
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#eef1f8]
                px-4
                py-3
                font-black
                text-[#465b8f]
                transition
                hover:bg-[#e1e6f2]
                active:scale-[0.98]
              "
            >
              <Building2
                size={20}
              />

              {tr("Associations", "Associations")}
            </button>

            {/* RESEAU D'AIDE */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/reseau-aide"
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
              <HeartHandshake size={20} />

              {tr("Réseau d’aide", "Help network")}
            </button>

            {/* SOS */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/sos-aide"
                )
              }
              className="
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#fff0f3]
                px-4
                py-3
                font-black
                text-[#c85f72]
                transition
                hover:bg-[#ffe3e9]
                active:scale-[0.98]
              "
            >
              <Siren size={20} />
              SOS
            </button>

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

              {tr("Vétérinaires", "Veterinarians")}
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

              {tr("Publicités", "Advertising")}
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

              {tr("Gestion des pages", "Page management")}
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
                {tr("Retour au site", "Back to site")}
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
                  ? tr("Déconnexion...", "Signing out...")
                  : tr("Déconnexion", "Sign out")}
              </button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function normalizeSignedConditions(
  snapshot: unknown
): SignedCondition[] {
  if (!snapshot) return [];

  let value: unknown = snapshot;

  if (typeof value === "string") {
    const stringValue = value;

    try {
      value = JSON.parse(stringValue);
    } catch {
      return stringValue.trim()
        ? [{ text: stringValue.trim() }]
        : [];
    }
  }

  if (Array.isArray(value)) {
    const normalized: SignedCondition[] = [];

    value.forEach((item, index) => {
      if (typeof item === "string") {
        const itemText = item.trim();

        if (itemText) {
          normalized.push({
            id: index,
            text: itemText,
          });
        }

        return;
      }

      if (
        item &&
        typeof item === "object"
      ) {
        const row =
          item as Record<string, unknown>;

        const rawText =
          row.text ??
          row.label ??
          row.condition ??
          row.content ??
          row.title;

        if (typeof rawText === "string") {
          const itemText =
            rawText.trim();

          if (itemText) {
            normalized.push({
              id:
                typeof row.id === "string" ||
                typeof row.id === "number"
                  ? row.id
                  : index,
              text: itemText,
            });
          }
        }
      }
    });

    return normalized;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const row =
      value as Record<string, unknown>;

    const nested =
      row.conditions ??
      row.items ??
      row.adoption_conditions;

    if (nested) {
      return normalizeSignedConditions(
        nested
      );
    }
  }

  return [];
}

function formatSignedDate(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  ).format(date);
}

function getAdminRequestStatusLabel(
  status?: string | null
) {
  const value = String(
    status || "pending"
  )
    .trim()
    .toLowerCase();

  switch (value) {
    case "meeting":
      return "Rencontre";
    case "accepted":
      return "Adoption validée";
    case "rejected":
    case "refused":
      return "Refusée";
    case "cancelled":
      return "Annulée";
    case "pending":
    default:
      return "En attente";
  }
}

function safeFilePart(
  value: string
) {
  return (
    value
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-"
      )
      .replace(/^-+|-+$/g, "")
      .toLowerCase() ||
    "adoption"
  );
}

function downloadDataUrl(
  dataUrl: string,
  filename: string
) {
  const link =
    document.createElement("a");

  link.href = dataUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openAdminSignedCertificate({
  request,
  animalName,
  adopterName,
  structureName,
}: {
  request: AdminAdoptionRequest;
  animalName: string;
  adopterName: string;
  structureName: string;
}) {
  const conditions =
    normalizeSignedConditions(
      request.conditions_snapshot
    );

  const signerName =
    request.signature_signer_name ||
    adopterName;

  const signedAt =
    request.signature_signed_at ||
    request.conditions_accepted_at ||
    request.created_at ||
    null;

  const conditionsHtml =
    conditions.length > 0
      ? conditions
          .map(
            (condition) =>
              `<li>${escapeHtml(
                condition.text
              )}</li>`
          )
          .join("")
      : "<li>Aucune condition enregistrée dans le snapshot.</li>";

  const signatureHtml =
    request.signature_data_url
      ? `<img src="${request.signature_data_url}" alt="Signature électronique" />`
      : "<p>Signature non disponible.</p>";

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Attestation d'adoption - ${escapeHtml(
    animalName
  )}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #2f241c;
      margin: 40px;
      line-height: 1.55;
    }
    h1, h2 {
      color: #064b42;
    }
    .meta {
      background: #f4eee3;
      border-radius: 16px;
      padding: 18px;
      margin: 20px 0;
    }
    li {
      margin-bottom: 10px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .signature img {
      display: block;
      max-width: 360px;
      max-height: 180px;
      margin-top: 12px;
      border: 1px solid #ddd;
      border-radius: 12px;
      background: white;
    }
    .note {
      margin-top: 28px;
      font-size: 12px;
      color: #6f5a47;
    }
    @media print {
      body {
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <h1>Attestation de conditions d'adoption</h1>

  <div class="meta">
    <strong>Animal :</strong> ${escapeHtml(
      animalName
    )}<br />
    <strong>Adoptant :</strong> ${escapeHtml(
      adopterName
    )}<br />
    <strong>Structure :</strong> ${escapeHtml(
      structureName
    )}<br />
    <strong>Signataire :</strong> ${escapeHtml(
      signerName
    )}<br />
    <strong>Date de signature :</strong> ${escapeHtml(
      formatSignedDate(signedAt)
    )}<br />
    <strong>Statut :</strong> ${escapeHtml(
      getAdminRequestStatusLabel(
        request.status
      )
    )}<br />
    <strong>Référence :</strong> ${escapeHtml(
      request.id
    )}
  </div>

  <h2>Conditions acceptées</h2>
  <ol>${conditionsHtml}</ol>

  <div class="signature">
    <strong>Signature électronique</strong>
    ${signatureHtml}
  </div>

  <p class="note">
    Document généré depuis l'espace administration TAUI TE ORA
    à partir des informations enregistrées au moment de la demande.
  </p>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>`;

  const popup =
    window.open("", "_blank");

  if (!popup) {
    alert(
      "Le navigateur a bloqué l'ouverture de l'attestation. Autorisez les fenêtres pop-up puis réessayez."
    );
    return;
  }

  popup.opener = null;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

