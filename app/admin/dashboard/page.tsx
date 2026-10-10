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


  BarChart3,


  Eye,

  MousePointerClick,

  Activity,


  HeartHandshake,

  Bell,
  ChevronDown,

} from "lucide-react";



import Card from "../../components/ui/Card";


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
  const [activeAdminSection, setActiveAdminSection] = useState<string | null>(null);



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

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    email: "",
    avatar_url: "",
    island: "",
    city: "",
    address: "",
    postal_code: "",
    organization_name: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);



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

      setProfileForm({
        first_name: currentProfile.first_name || "",
        last_name: currentProfile.last_name || "",
        birth_date: currentProfile.birth_date || "",
        phone: currentProfile.phone || "",
        email: currentProfile.email || "",
        avatar_url: currentProfile.avatar_url || "",
        island: currentProfile.island || "",
        city: currentProfile.city || "",
        address: currentProfile.address || "",
        postal_code: currentProfile.postal_code || "",
        organization_name: currentProfile.organization_name || "",
      });



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



  function updateProfileField(
    field: keyof typeof profileForm,
    value: string
  ) {
    setProfileSaved(false);
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveAdminProfile() {
    if (!profile?.id || savingProfile) {
      return;
    }

    try {
      setSavingProfile(true);
      setProfileSaved(false);

      const payload = {
        first_name: profileForm.first_name.trim() || null,
        last_name: profileForm.last_name.trim() || null,
        birth_date: profileForm.birth_date || null,
        phone: profileForm.phone.trim() || null,
        island: profileForm.island.trim() || null,
        city: profileForm.city.trim() || null,
        address: profileForm.address.trim() || null,
        postal_code: profileForm.postal_code.trim() || null,
        organization_name: profileForm.organization_name.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      setProfile((current: any) => ({
        ...current,
        ...payload,
      }));

      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2500);
    } catch (error: any) {
      console.error("Erreur sauvegarde profil admin :", error);
      alert(
        error?.message ||
          "Impossible d'enregistrer le profil administrateur."
      );
    } finally {
      setSavingProfile(false);
    }
  }

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


  const adoptedAnimals = animals.filter((animal) => {
    const status = String(
      animal?.status ||
      ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return (
      animal?.is_adopted === true ||
      status === "adopted" ||
      status === "adopte" ||
      status === "adoptee"
    );
  });



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

        bg-[linear-gradient(180deg,#f7f1e8_0%,#fbf8f2_48%,#f3eee7_100%)]

        px-3

        py-4

        text-[#064b42]

        sm:px-6

        sm:py-6

      "

    >

      <section

        className="

          mx-auto

          max-w-[1500px]

        "

      >

        {/* =====================================================
            HEADER - CENTRE DE PILOTAGE
        ====================================================== */}

        <div className="overflow-hidden rounded-[34px] border border-[#0f675d]/10 bg-[#07594f] shadow-[0_24px_70px_rgba(7,89,79,.16)]">
          <div className="relative flex flex-col gap-5 overflow-hidden bg-[radial-gradient(circle_at_88%_15%,rgba(255,255,255,.08),transparent_24%),linear-gradient(135deg,#07594f_0%,#0b6c5f_100%)] px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">
                TAUI TE ORA
              </p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                {tr("Centre de pilotage", "Control center")}
              </h1>
              <p className="mt-1 truncate text-sm font-semibold text-white/75">
                {tr("Bonjour", "Hello")} {profileService.getDisplayName(profile)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/admin/communications")}
                className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#ef8f7c] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e67f6b]"
              >
                💬 {tr("Messages", "Messages")}
              </button>

              <button
                type="button"
                onClick={() => router.push("/notifications")}
                className="relative flex min-h-[42px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {tr("Notifications", "Notifications")}
                {unreadNotifications > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-[#df8995] px-1.5 py-0.5 text-[10px] font-black text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation unique : les fonctions restent sur leurs pages existantes. */}
        <nav aria-label="Navigation administration" className="mt-5 rounded-[26px] border border-[#e8ddd2] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#064b42]">Accès rapides administrateur</h2>
            <span className="text-xs font-bold text-[#81756c]">Toutes les fonctions au même endroit</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { title: "Mon profil", icon: "👤", section: "profile", description: "Coordonnées et préférences" },
              { title: "Vue d’ensemble", icon: "📊", section: "overview", description: "Chiffres et signalements" },
              { title: "Adoptions & traçabilité", icon: "🐾", section: "adoptions", description: "Signatures et attestations" },
              { title: "Statistiques du site", icon: "📈", section: "analytics", description: "Visites et publicités" },
              { title: "Activité & entraide", icon: "🤝", section: "activity", description: "Messages et réseau d’aide" },
              { title: "Compagnons", icon: "🐕", href: "/admin/companions", description: "Animaux enregistrés" },
              { title: "Animaux à adopter", icon: "🐈", href: "/admin/animals", description: "Annonces d’adoption" },
              { title: "Créer un animal", icon: "➕", href: "/admin/animals/create", description: "Pour un profil" },
              { title: "Utilisateurs", icon: "👥", href: "/admin/users", description: "Comptes et validations" },
              { title: "Créer un profil", icon: "👤", href: "/admin/users", description: "Depuis la gestion des utilisateurs" },
              { title: "Signalements", icon: "🚨", href: "/admin/signalements", description: "Alertes et suivi" },
              { title: "SOS animal", icon: "🆘", href: "/sos-aide", description: "Demandes d’aide" },
              { title: "Réseau d’aide", icon: "🤲", href: "/reseau-aide", description: "Bénévoles et accueil" },
              { title: "Communication", icon: "💬", href: "/admin/communications", description: "Messages et e-mails" },
              { title: "Publicités", icon: "📣", href: "/admin/publicites", description: "Campagnes et partenaires" },
              { title: "TAUI Auto Post", icon: "📱", href: "/admin/facebook", description: "Publications Facebook automatiques et programmées" },
              { title: "Pages", icon: "📝", href: "/admin/pages", description: "Textes du site" },
              { title: "Vétérinaires", icon: "🩺", href: "/admin/veterinaires", description: "Professionnels" },
              { title: "Associations officielles", icon: "🏛️", href: "/admin/associations", description: "Rattachements et validations" },
              { title: "Associations", icon: "🏠", href: "/associations", description: "Structures partenaires" },
              { title: "Mes données", icon: "🔒", href: "/profile/mes-donnees", description: "Confidentialité" },
            ].map((item) => {
              const tileClass = `group flex min-h-[108px] flex-col justify-center rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 sm:p-4 ${item.section && activeAdminSection === item.section ? "border-[#07594f] bg-[#e7f3ee]" : "border-[#e8eee9] bg-[#fbf8f2] hover:border-[#9ac9b9] hover:bg-[#eaf5ef]"}`;
              const content = <>
                <span aria-hidden="true" className="text-2xl">{item.icon}</span>
                <span className="mt-2 text-sm font-black leading-tight text-[#064b42]">{item.title}</span>
                <span className="mt-1 text-xs leading-tight text-[#81756c]">{item.description}</span>
              </>;
              return item.section ? (
                <button key={item.section} type="button" aria-pressed={activeAdminSection === item.section}
                  onClick={() => setActiveAdminSection(activeAdminSection === item.section ? null : item.section)}
                  className={tileClass}>{content}</button>
              ) : (
                <Link key={`${item.title}-${item.href}`} href={item.href!} className={tileClass}>{content}</Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <details open className={`group ${activeAdminSection === "profile" ? "col-span-full" : "hidden"}  overflow-hidden rounded-[24px] border border-[#e8ddd2] bg-[#fffaf4] shadow-[0_10px_30px_rgba(73,58,43,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(6,75,66,0.10)] open:col-span-full open:hover:translate-y-0`}>
          <summary className="flex min-h-[116px] cursor-pointer list-none flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:min-h-[124px] sm:px-5">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ee] text-xl shadow-sm">
                👤
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight text-[#064b42] sm:text-base">
                  {tr("Mon profil administrateur", "My administrator profile")}
                </h2>
                <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">
                  {tr("Vos coordonnées, votre identité et vos préférences sans quitter le dashboard.", "Your contact details, identity and preferences without leaving the dashboard.")}
                </p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className="mt-1 shrink-0 text-[#9a8d82] transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-[#eee3d8] px-4 pb-5 sm:px-5">
            <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="rounded-2xl bg-[#f4eee6] p-5 text-center">
                {profileForm.avatar_url ? (
                  <img
                    src={profileForm.avatar_url}
                    alt={tr("Photo de profil", "Profile picture")}
                    className="mx-auto h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e8f5f1] text-4xl">
                    👤
                  </div>
                )}
                <p className="mt-4 font-black text-[#064b42]">
                  {profileService.getDisplayName(profile)}
                </p>
                <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">
                  {profileForm.email || "—"}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[#064b42] px-3 py-1 text-xs font-black uppercase text-white">
                  Admin
                </span>
              </div>

              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Prénom", "First name")}
                    <input
                      value={profileForm.first_name}
                      onChange={(e) => updateProfileField("first_name", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Nom", "Last name")}
                    <input
                      value={profileForm.last_name}
                      onChange={(e) => updateProfileField("last_name", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Téléphone", "Phone")}
                    <input
                      value={profileForm.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    Email
                    <input
                      value={profileForm.email}
                      readOnly
                      className="mt-2 w-full rounded-xl border border-[#d8e9e3] bg-gray-50 px-4 py-3 font-semibold text-[#81756c]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Date de naissance", "Birth date")}
                    <input
                      type="date"
                      value={profileForm.birth_date}
                      onChange={(e) => updateProfileField("birth_date", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Organisation", "Organization")}
                    <input
                      value={profileForm.organization_name}
                      onChange={(e) => updateProfileField("organization_name", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Île", "Island")}
                    <input
                      value={profileForm.island}
                      onChange={(e) => updateProfileField("island", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Commune", "City")}
                    <input
                      value={profileForm.city}
                      onChange={(e) => updateProfileField("city", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42] sm:col-span-2">
                    {tr("Adresse", "Address")}
                    <input
                      value={profileForm.address}
                      onChange={(e) => updateProfileField("address", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Code postal", "Postal code")}
                    <input
                      value={profileForm.postal_code}
                      onChange={(e) => updateProfileField("postal_code", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-semibold outline-none focus:border-[#064b42]"
                    />
                  </label>

                  <label className="text-sm font-black text-[#064b42]">
                    {tr("Langue", "Language")}
                    <select
                      value={preferredLanguage}
                      onChange={(event) => {
                        setPreferredLanguage(event.target.value === "en" ? "en" : "fr");
                        setLanguageSaved(false);
                      }}
                      className="mt-2 w-full rounded-xl border border-[#dfd3c8] bg-[#fffdf9] px-4 py-3 font-bold outline-none focus:border-[#064b42]"
                    >
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void saveAdminProfile()}
                    disabled={savingProfile}
                    className="min-h-[48px] rounded-xl bg-[#064b42] px-6 py-3 font-black text-white transition hover:bg-[#08695d] disabled:opacity-60"
                  >
                    {savingProfile
                      ? tr("Enregistrement...", "Saving...")
                      : tr("Enregistrer mon profil", "Save my profile")}
                  </button>

                  <button
                    type="button"
                    onClick={() => void savePreferredLanguage()}
                    disabled={savingLanguage}
                    className="min-h-[48px] rounded-xl border border-[#064b42] bg-white px-6 py-3 font-black text-[#064b42] transition hover:bg-[#e8f5f1] disabled:opacity-60"
                  >
                    {savingLanguage
                      ? tr("Enregistrement...", "Saving...")
                      : tr("Enregistrer la langue", "Save language")}
                  </button>
                </div>

                {(profileSaved || languageSaved) && (
                  <p className="mt-3 text-sm font-black text-green-700">
                    ✓ {tr("Modifications enregistrées", "Changes saved")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </details>
        <details open className={`group ${activeAdminSection === "overview" ? "col-span-full" : "hidden"}  col-span-full overflow-hidden rounded-[24px] border border-[#e8ddd2] bg-[#fffaf4] shadow-[0_12px_34px_rgba(73,58,43,.07)]`}>
          <summary className="flex min-h-[116px] cursor-pointer list-none flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:min-h-[124px] sm:px-5">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ee] text-xl shadow-sm">
                📊
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight text-[#064b42] sm:text-base">
                  {tr("Vue d’ensemble", "Overview")}
                </h2>
                <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">
                  {tr("Les chiffres essentiels et l’état actuel de la plateforme.", "Key figures and the current state of the platform.")}
                </p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className="mt-1 shrink-0 text-[#9a8d82] transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-[#eee3d8] px-4 pb-5 sm:px-5">
        {/* =====================================================

            STATISTIQUES

        ====================================================== */}



        <div

          className="

            mt-10

            grid

            gap-3

            grid-cols-2

            md:grid-cols-3

            xl:grid-cols-5

          "

        >

          <Card

            className="

              rounded-2xl
              border
              border-[#e5eee9]
              bg-white
              p-4
              text-center
              shadow-sm

            "

          >

            <Users

              className="

                mx-auto

                text-blue-600

              "

              size={30}

            />



            <h2

              className="

                mt-3

                text-3xl

                font-black

              "

            >

              {

                users.length

              }

            </h2>



            <p

              className="

                text-[#81756c]

              "

            >

              {tr("Utilisateurs", "Users")}

            </p>

          </Card>



          <Card

            className="

              rounded-2xl
              border
              border-[#e5eee9]
              bg-white
              p-4
              text-center
              shadow-sm

            "

          >

            <ShieldCheck

              className="

                mx-auto

                text-orange-500

              "

              size={30}

            />



            <h2

              className="

                mt-3

                text-3xl

                font-black

              "

            >

              {

                pendingUsers.length

              }

            </h2>



            <p

              className="

                text-[#81756c]

              "

            >

              {tr("En attente", "Pending")}

            </p>

          </Card>



          <Card

            className="

              rounded-2xl
              border
              border-[#e5eee9]
              bg-white
              p-4
              text-center
              shadow-sm

            "

          >

            <PawPrint

              className="

                mx-auto

                text-green-600

              "

              size={30}

            />



            <h2

              className="

                mt-3

                text-3xl

                font-black

              "

            >

              {

                animals.length

              }

            </h2>



            <p

              className="

                text-[#81756c]

              "

            >

              {tr("Animaux", "Animals")}

            </p>

          </Card>



          <Card

            className="

              rounded-2xl
              border
              border-[#e5eee9]
              bg-white
              p-4
              text-center
              shadow-sm

            "

          >

            <HeartHandshake

              className="

                mx-auto

                text-pink-600

              "

              size={30}

            />



            <h2

              className="

                mt-3

                text-3xl

                font-black

              "

            >

              {adoptedAnimals.length}

            </h2>



            <p

              className="

                text-[#81756c]

              "

            >

              {tr("Animaux adoptés", "Animals adopted")}

            </p>



            <p className="mt-1 text-xs font-bold text-[#a0958c]">
              {tr("Via Taui Te Ora", "Via Taui Te Ora")}
            </p>

          </Card>



          <Card

            className="

              rounded-2xl
              border
              border-[#e5eee9]
              bg-white
              p-4
              text-center
              shadow-sm

            "

          >

            <Siren

              className="

                mx-auto

                text-red-600

              "

              size={30}

            />



            <h2

              className="

                mt-3

                text-3xl

                font-black

              "

            >

              {

                signalements.length

              }

            </h2>



            <p

              className="

                text-[#81756c]

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

              <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">

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

              <p className="mt-1 text-[#81756c]">{tr("Aujourd’hui", "Today")}</p>

            </Card>



            <Card className="text-center">

              <h3 className="text-4xl font-black text-orange-600">{signalementsWeek}</h3>

              <p className="mt-1 text-[#81756c]">{tr("Cette semaine", "This week")}</p>

            </Card>



            <Card className="text-center">

              <h3 className="text-4xl font-black text-[#064b42]">{signalementsMonth}</h3>

              <p className="mt-1 text-[#81756c]">{tr("Ce mois", "This month")}</p>

            </Card>



            <Card className="text-center">

              <h3 className="text-4xl font-black text-[#064b42]">{signalements.length}</h3>

              <p className="mt-1 text-[#81756c]">{tr("Cumulé", "Total")}</p>

            </Card>

          </div>



          <Card className="mt-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h3 className="text-2xl font-black">{tr("Signalements par commune", "Reports by municipality")}</h3>

                <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">

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

              <p className="mt-5 text-[#81756c]">{tr("Aucun signalement enregistré.", "No reports recorded.")}</p>

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



                      <p className="mt-2 text-xs font-bold text-[#81756c]">

                        {percentage}% {tr("du total", "of total")}

                      </p>

                    </div>

                  );

                })}

              </div>

            )}

          </Card>

        </div>





          </div>
        </details>
        <details open className={`group ${activeAdminSection === "adoptions" ? "col-span-full" : "hidden"}  overflow-hidden rounded-[24px] border border-[#e8ddd2] bg-[#fffaf4] shadow-[0_10px_30px_rgba(73,58,43,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(6,75,66,0.10)] open:col-span-full open:hover:translate-y-0`}>
          <summary className="flex min-h-[116px] cursor-pointer list-none flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:min-h-[124px] sm:px-5">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ee] text-xl shadow-sm">
                🐾
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight text-[#064b42] sm:text-base">
                  {tr("Adoptions & traçabilité", "Adoptions & traceability")}
                </h2>
                <p className="hidden max-w-[220px] text-[11px] leading-4 text-[#81756c] lg:block">
                  {tr("Demandes signées, conditions acceptées et attestations.", "Signed requests, accepted conditions and certificates.")}
                </p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className="mt-1 shrink-0 text-[#9a8d82] transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-[#eee3d8] px-4 pb-5 sm:px-5">
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



            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#81756c]">

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

              <div className="py-6 text-center text-[#81756c]">

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



                          <p className="mt-0.5 text-xs text-[#81756c]">

                            {tr("Adoptant", "Adopter")} :{" "}

                            <strong className="text-[#2f241c]">

                              {adopterName}

                            </strong>

                          </p>



                          <p className="mt-0.5 text-xs text-[#81756c]">

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



                      <div className="grid gap-3 rounded-2xl bg-[#f4eee6] p-4 sm:grid-cols-2">

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



          </div>
        </details>
        <details open className={`group ${activeAdminSection === "analytics" ? "col-span-full" : "hidden"}  overflow-hidden rounded-[24px] border border-[#e8ddd2] bg-[#fffaf4] shadow-[0_10px_30px_rgba(73,58,43,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(6,75,66,0.10)] open:col-span-full open:hover:translate-y-0`}>
          <summary className="flex min-h-[116px] cursor-pointer list-none flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:min-h-[124px] sm:px-5">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ee] text-xl shadow-sm">
                📈
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight text-[#064b42] sm:text-base">
                  {tr("Statistiques du site", "Site statistics")}
                </h2>
                <p className="mt-0.5 text-xs text-[#81756c]">
                  {tr("Visites, pages vues et performances publicitaires.", "Visits, page views and advertising performance.")}
                </p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className="mt-1 shrink-0 text-[#9a8d82] transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-[#eee3d8] px-4 pb-5 sm:px-5">
        {/* =====================================================

            ANALYTICS

        ====================================================== */}



        <div className="mt-10">

          <div className="mb-5">

            <h2 className="text-3xl font-black">

              {tr("Statistiques du site", "Site statistics")}

            </h2>



            <p className="mt-0.5 text-xs text-[#81756c]">

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

              <p className="text-[#81756c]">{tr("Visiteurs aujourd’hui", "Visitors today")}</p>

            </Card>



            <Card className="text-center">

              <Users className="mx-auto text-[#064b42]" size={38} />

              <h3 className="mt-3 text-4xl font-black">

                {analytics.visitors_total.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}

              </h3>

              <p className="text-[#81756c]">{tr("Visiteurs cumulés", "Total visitors")}</p>

            </Card>



            <Card className="text-center">

              <Eye className="mx-auto text-violet-600" size={38} />

              <h3 className="mt-3 text-4xl font-black">

                {analytics.page_views_today.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}

              </h3>

              <p className="text-[#81756c]">{tr("Pages vues aujourd’hui", "Page views today")}</p>

            </Card>



            <Card className="text-center">

              <Activity className="mx-auto text-indigo-600" size={38} />

              <h3 className="mt-3 text-4xl font-black">

                {analytics.page_views_total.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}

              </h3>

              <p className="text-[#81756c]">{tr("Pages vues cumulées", "Total page views")}</p>

            </Card>

          </div>



          <div className="mt-6 grid gap-6 md:grid-cols-3">

            <Card className="text-center">

              <Eye className="mx-auto text-[#c76d7b]" size={38} />

              <h3 className="mt-3 text-4xl font-black">

                {analytics.ad_impressions.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}

              </h3>

              <p className="text-[#81756c]">{tr("Affichages publicitaires", "Ad impressions")}</p>

            </Card>



            <Card className="text-center">

              <MousePointerClick

                className="mx-auto text-[#c76d7b]"

                size={38}

              />

              <h3 className="mt-3 text-4xl font-black">

                {analytics.ad_clicks.toLocaleString(preferredLanguage === "en" ? "en-GB" : "fr-FR")}

              </h3>

              <p className="text-[#81756c]">{tr("Clics publicitaires", "Ad clicks")}</p>

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

              <p className="text-[#81756c]">{tr("CTR publicitaire global", "Overall ad CTR")}</p>

            </Card>

          </div>

            </>

          )}

        </div>



          </div>
        </details>
        <details open className={`group ${activeAdminSection === "activity" ? "col-span-full" : "hidden"}  overflow-hidden rounded-[24px] border border-[#e8ddd2] bg-[#fffaf4] shadow-[0_10px_30px_rgba(73,58,43,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(6,75,66,0.10)] open:col-span-full open:hover:translate-y-0`}>
          <summary className="flex min-h-[116px] cursor-pointer list-none flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:min-h-[124px] sm:px-5">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ee] text-xl shadow-sm">
                🤝
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight text-[#064b42] sm:text-base">
                  {tr("Activité & entraide", "Activity & community help")}
                </h2>
                <p className="mt-0.5 text-xs text-[#81756c]">
                  {tr("Messages, réseau d’aide et gestion des SOS.", "Messages, help network and SOS management.")}
                </p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className="mt-1 shrink-0 text-[#9a8d82] transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-[#eee3d8] px-4 pb-5 sm:px-5">
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



              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#81756c]">

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



          </div>
        </details>
        <div className="col-span-full flex flex-wrap justify-end gap-3 py-3">
          <Link href="/" className="rounded-xl border border-[#d8e9e3] bg-white px-5 py-3 text-sm font-black text-[#064b42]">
            {tr("Retour au site", "Back to site")}
          </Link>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 disabled:opacity-60">
            <LogOut size={18} />
            {loggingOut ? tr("Déconnexion...", "Signing out...") : tr("Déconnexion", "Sign out")}
          </button>
        </div>
        </div>

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




