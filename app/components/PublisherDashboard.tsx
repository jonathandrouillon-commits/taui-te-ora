"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { animalService } from "../services/animal.service";
import SupportButton from "./SupportButton";
import DashboardMessages from "./dashboard/DashboardMessages";
export type PublisherRole =
  | "association"
  | "refuge"
  | "fourriere"
  | "sigfa"
  | "benevole";
type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  organization_name?: string | null;
  avatar_url?: string | null;
  island?: string | null;
  city?: string | null;
};
type AnimalPhoto = {
  id?: string;
  photo_url?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};
type Animal = {
  id: string;
  animal_name?: string | null;
  animal_type?: string | null;
  age_label?: string | null;
  sex?: string | null;
  city?: string | null;
  island?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  is_adopted?: boolean | null;
  animal_photos?: AnimalPhoto[] | null;
  owner_id?: string | null;
  official_association_id?: string | null;
};
type AdoptionRequest = {
  id: string;
  created_at?: string | null;
  animal_id?: string | null;
  requester_id?: string | null;
  owner_id?: string | null;
  status?: string | null;
  match_score?: number | null;
  match_level?: string | null;
  animals?: Animal | null;
  requester?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
};
type Conversation = {
  id: string;
  animal_id?: string | null;
  requester_id?: string | null;
  owner_id?: string | null;
  adoption_request_id?: string | null;
  updated_at?: string | null;
};
type Favorite = {
  id: string;
  animal_id: string;
  profile_id?: string | null;
};
type OfficialMembership = {
  association_id: string;
  member_role: "responsable" | "gestionnaire" | "benevole";
  status: string;
};

type OfficialAssociation = {
  id: string;
  name: string;
};

type SharedAnimal = Animal & {
  associationLabel: string;
  membershipRole: OfficialMembership["member_role"];
};

type DashboardData = {
  profile: Profile;
  animals: Animal[];
  sharedAnimals: SharedAnimal[];
  favorites: Favorite[];
  adoptionRequests: AdoptionRequest[];
  conversations: Conversation[];
};
const ROLE_LABELS: Record<PublisherRole, string> = {
  association: "Association",
  refuge: "Refuge / SIGFA",
  fourriere: "Fourrière",
  sigfa: "SIGFA",
  benevole: "Bénévole indépendant",
};
function getAddAnimalPath(_role: PublisherRole) {
  return "/association/add-animal";
}
function getAnimalsManagementPath(_role: PublisherRole) {
  return "/association/animals";
}
function getEditAnimalPath(
  _role: PublisherRole,
  animalId: string
) {
  return `/association/edit-animal/${animalId}`;
}
type DashboardSectionKey =
  | "stats"
  | "animals"
  | "adoptions"
  | "messages"
  | "help"
  | "support";
const DEFAULT_SECTION_VISIBILITY: Record<DashboardSectionKey, boolean> = {
  stats: true,
  animals: true,
  adoptions: true,
  messages: true,
  help: true,
  support: true,
};
type PublisherDashboardProps = {
  expectedRole: PublisherRole;
};
export default function PublisherDashboard({
  expectedRole,
}: PublisherDashboardProps) {
  const router = useRouter();
  const [data, setData] =
    useState<DashboardData | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [actionId, setActionId] =
    useState<string | null>(null);
  const [canViewAssociationHistory, setCanViewAssociationHistory] = useState(false);
  const [sectionVisibility, setSectionVisibility] = useState<
    Record<DashboardSectionKey, boolean>
  >(DEFAULT_SECTION_VISIBILITY);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        `taui-publisher-dashboard-sections-${expectedRole}`
      );
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<
        Record<DashboardSectionKey, boolean>
      >;
      setSectionVisibility({
        ...DEFAULT_SECTION_VISIBILITY,
        ...parsed,
      });
    } catch (error) {
      console.warn("Impossible de charger l’affichage du dashboard :", error);
    }
  }, [expectedRole]);
  function setSectionVisible(
    key: DashboardSectionKey,
    visible: boolean
  ) {
    setSectionVisibility((current) => {
      const next = { ...current, [key]: visible };
      try {
        window.localStorage.setItem(
          `taui-publisher-dashboard-sections-${expectedRole}`,
          JSON.stringify(next)
        );
      } catch (error) {
        console.warn("Impossible de mémoriser l’affichage du dashboard :", error);
      }
      return next;
    });
  }
  function setAllSections(visible: boolean) {
    const next = Object.fromEntries(
      Object.keys(DEFAULT_SECTION_VISIBILITY).map((key) => [key, visible])
    ) as Record<DashboardSectionKey, boolean>;
    setSectionVisibility(next);
    try {
      window.localStorage.setItem(
        `taui-publisher-dashboard-sections-${expectedRole}`,
        JSON.stringify(next)
      );
    } catch (error) {
      console.warn("Impossible de mémoriser l’affichage du dashboard :", error);
    }
  }
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.replace(
          "/login?redirect=" +
            encodeURIComponent(
              `/${expectedRole}/dashboard`
            )
        );
        return;
      }
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, role, first_name, last_name, organization_name, avatar_url, island, city"
          )
          .eq("id", user.id)
          .maybeSingle();
      if (profileError) throw profileError;
      const access =
        await animalService.getCurrentUserAccess();
      const role =
        access.role || "";
      if (!access.role) {
        router.replace("/choose-role");
        return;
      }
      if (!access.isActive) {
        router.replace("/");
        return;
      }
      if (
        access.approvalStatus === "rejected" ||
        access.approvalStatus === "suspended"
      ) {
        router.replace("/");
        return;
      }
      if (role === "adoptant") {
        router.replace("/dashboard");
        return;
      }
      if (
        role !== "admin" &&
        role !== expectedRole
      ) {
        router.replace(
          getPublisherDestination(role)
        );
        return;
      }
      /*
       * IMPORTANT :
       * tous les comptes non-adoptants qui publient
       * ont le même fonctionnement.
       * On ne force donc pas un questionnaire adoptant.
       */
      const { data: animals, error: animalsError } =
        await supabase
          .from("animals")
          .select(`
            id,
            animal_name,
            animal_type,
            age_label,
            sex,
            city,
            island,
            status,
            is_published,
            is_adopted,
            animal_photos (
              id,
              photo_url,
              is_cover,
              sort_order
            )
          `)
          .eq("owner_id", access.userId)
          .order("created_at", {
            ascending: false,
          });
        if (animalsError) throw animalsError;

        // Les rattachements approuvés sont propres à chaque association.
        // Les droits sont aussi vérifiés par les politiques RLS de Supabase.
        const { data: memberships, error: membershipsError } = await supabase
          .from("association_members")
          .select("association_id, member_role, status")
          .eq("profile_id", access.userId)
          .eq("status", "approved");
        if (membershipsError) throw membershipsError;

        const approvedMemberships = (memberships || []) as OfficialMembership[];
        setCanViewAssociationHistory(
          role === "admin" ||
          (access.approvalStatus === "approved" &&
            approvedMemberships.some((membership) => membership.member_role === "responsable"))
        );
        let sharedAnimals: SharedAnimal[] = [];
        if (approvedMemberships.length > 0) {
          const associationIds = approvedMemberships.map((m) => m.association_id);
          const { data: officialAssociations, error: officialError } = await supabase
            .from("animal_associations")
            .select("id, name")
            .in("id", associationIds)
            .eq("is_active", true);
          if (officialError) throw officialError;

          const activeAssociations = (officialAssociations || []) as OfficialAssociation[];
          const activeIds = activeAssociations.map((a) => a.id);
          if (activeIds.length > 0) {
            const { data: sharedRows, error: sharedError } = await supabase
              .from("animals")
              .select(`
                id, owner_id, official_association_id,
                animal_name, animal_type, age_label, sex, city, island,
                status, is_published, is_adopted,
                animal_photos (id, photo_url, is_cover, sort_order)
              `)
              .in("official_association_id", activeIds)
              .neq("owner_id", access.userId)
              .order("created_at", { ascending: false });
            if (sharedError) throw sharedError;

            const membershipByAssociation = new Map(
              approvedMemberships.map((m) => [m.association_id, m])
            );
            const associationById = new Map(
              activeAssociations.map((a) => [a.id, a.name])
            );
            sharedAnimals = ((sharedRows || []) as Animal[]).flatMap((animal) => {
              const associationId = animal.official_association_id;
              const membership = associationId
                ? membershipByAssociation.get(associationId)
                : undefined;
              if (!membership || !associationId) return [];
              return [{
                ...animal,
                associationLabel: associationById.get(associationId) || "Association",
                membershipRole: membership.member_role,
              }];
            });
          }
        }
      const animalIds =
        (animals || []).map((animal) => animal.id);
      let favorites: Favorite[] = [];
      if (animalIds.length > 0) {
        const { data: favoriteRows, error: favoriteError } =
          await supabase
            .from("favorites")
            .select("id, animal_id, profile_id")
            .in("animal_id", animalIds);
        if (favoriteError) throw favoriteError;
        favorites =
          (favoriteRows || []) as Favorite[];
      }
      const {
        data: requests,
        error: requestsError,
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
          match_level
        `)
        .eq("owner_id", access.userId)
        .order("created_at", {
          ascending: false,
        });
      if (requestsError) throw requestsError;
      const requesterIds = Array.from(
        new Set(
          (requests || [])
            .map((request) => request.requester_id)
            .filter(Boolean)
        )
      ) as string[];
      let requesterProfiles: any[] = [];
      if (requesterIds.length > 0) {
        const {
          data: profileRows,
          error: requesterError,
        } = await supabase
          .from("profiles")
          .select(
            "id, first_name, last_name, avatar_url"
          )
          .in("id", requesterIds);
        if (requesterError) throw requesterError;
        requesterProfiles = profileRows || [];
      }
      const animalsById =
        new Map(
          (animals || []).map((animal) => [
            animal.id,
            animal,
          ])
        );
      const requestersById =
        new Map(
          requesterProfiles.map((profile) => [
            profile.id,
            profile,
          ])
        );
      const enrichedRequests =
        (requests || []).map((request) => ({
          ...request,
          animals:
            request.animal_id
              ? animalsById.get(
                  request.animal_id
                ) || null
              : null,
          requester:
            request.requester_id
              ? requestersById.get(
                  request.requester_id
                ) || null
              : null,
        })) as AdoptionRequest[];
      const {
        data: conversations,
        error: conversationsError,
      } = await supabase
        .from("conversations")
        .select(
          "id, animal_id, requester_id, owner_id, adoption_request_id, updated_at"
        )
        .eq("owner_id", access.userId)
        .order("updated_at", {
          ascending: false,
        });
      if (conversationsError) {
        throw conversationsError;
      }
      setData({
        profile: {
          id: access.userId,
          role,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          organization_name:
            profile?.organization_name || "",
          avatar_url: profile?.avatar_url || "",
          island: profile?.island || "",
          city: profile?.city || "",
        },
        animals: (animals || []) as Animal[],
          sharedAnimals,
        favorites,
        adoptionRequests: enrichedRequests,
        conversations:
          (conversations || []) as Conversation[],
      });
    } catch (error) {
      console.error(
        "Erreur dashboard déposant :",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [expectedRole, router]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);
  async function handleLogout() {
    try {
      const { error } =
        await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      router.replace("/login");
      router.refresh();
    } catch (error: any) {
      console.error(
        "Erreur déconnexion :",
        error
      );
      alert(
        error?.message ||
          "Impossible de se déconnecter."
      );
    }
  }
  async function archiveAnimal(animalId: string) {
    const confirmed = window.confirm(
      "Retirer cet animal de l’adoption ? Sa fiche, ses photos, ses vidéos et son historique seront conservés."
    );
    if (!confirmed) return;
    try {
      setActionId(animalId);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        throw new Error("Utilisateur non connecté.");
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      let query = supabase
        .from("animals")
        .update({
          is_published: false,
          status: "archive",
        })
        .eq("id", animalId);
      // Une association, un refuge, une fourrière ou un bénévole
      // ne peut retirer que ses propres animaux.
      // Un administrateur peut retirer n’importe quel animal.
      if (String(profile?.role || "").trim().toLowerCase() !== "admin") {
        query = query.eq("owner_id", user.id);
      }
      const { data: updatedAnimal, error } = await query
        .select("id, is_published, status")
        .maybeSingle();
      if (error) throw error;
      if (!updatedAnimal) {
        throw new Error(
          "Impossible de retirer cet animal : vous n’êtes pas son propriétaire ou vous n’avez pas les droits nécessaires."
        );
      }
      await loadDashboard();
    } catch (error: any) {
      console.error("Erreur retrait animal :", error);
      alert(
        error?.message ||
          "Impossible de retirer cet animal de l’adoption."
      );
    } finally {
      setActionId(null);
    }
  }
  async function updateAdoptionStatus(
    request: AdoptionRequest,
    nextStatus:
      | "rejected"
      | "meeting"
      | "accepted"
  ) {
    if (!request?.id) return;
    const labels = {
      rejected:
        "refuser cette demande d'adoption",
      meeting:
        "passer cette demande à l'étape Rencontre",
      accepted:
        "valider définitivement cette adoption",
    };
    const confirmed =
      window.confirm(
        `Confirmer : ${labels[nextStatus]} ?`
      );
    if (!confirmed) return;
    try {
      setActionId(request.id);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      if (!user) {
        throw new Error(
          "Utilisateur non connecté."
        );
      }
      const {
        error: requestError,
      } = await supabase
        .from("adoption_requests")
        .update({
          status: nextStatus,
        })
        .eq(
          "id",
          request.id
        )
        .eq(
          "owner_id",
          user.id
        );
      if (requestError) {
        throw requestError;
      }
      /*
       * Lorsqu'une adoption est validée,
       * on marque aussi l'animal comme adopté.
       */
      if (
        nextStatus === "accepted" &&
        request.animal_id
      ) {
        const {
          error: animalError,
        } = await supabase
          .from("animals")
          .update({
            is_adopted: true,
            is_published: false,
            status: "adopted",
          })
          .eq(
            "id",
            request.animal_id
          )
          .eq(
            "owner_id",
            user.id
          );
        if (animalError) {
          throw animalError;
        }
      }
      await loadDashboard();
    } catch (error: any) {
      console.error(
        "Erreur changement statut adoption :",
        error
      );
      alert(
        error?.message ||
          "Impossible de modifier le statut de cette demande."
      );
    } finally {
      setActionId(null);
    }
  }
  const favoriteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const favorite of data?.favorites || []) {
      counts.set(
        favorite.animal_id,
        (counts.get(favorite.animal_id) || 0) + 1
      );
    }
    return counts;
  }, [data?.favorites]);
  const requestCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of data?.adoptionRequests || []) {
      if (!request.animal_id) continue;
      counts.set(
        request.animal_id,
        (counts.get(request.animal_id) || 0) + 1
      );
    }
    return counts;
  }, [data?.adoptionRequests]);
  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[#f4eee3] p-8 text-center text-[#064b42]">
        Chargement du dashboard...
      </main>
    );
  }
  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-[#f4eee3] p-8 text-center text-[#064b42]">
        Impossible de charger le dashboard.
      </main>
    );
  }
  const profileName =
    data.profile.organization_name ||
    `${data.profile.first_name || ""} ${
      data.profile.last_name || ""
    }`.trim() ||
    "Mon espace";
  const published =
    data.animals.filter(
      (animal) =>
        animal.is_published !== false &&
        !animal.is_adopted
    ).length;
  const adopted =
    data.animals.filter(
      (animal) => animal.is_adopted
    ).length;
  const pendingRequests =
    data.adoptionRequests.filter(
      (request) =>
        !request.status ||
        request.status === "pending"
    ).length;
  return (
    <main className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-[#f4eee3] px-3 py-8 pb-28 text-[#064b42] sm:px-6">
      <section className="mx-auto w-full min-w-0 max-w-7xl">
        <header className="overflow-hidden rounded-[30px] bg-white shadow-md">
          <div className="bg-[#064b42] px-6 py-7 text-white sm:px-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f1b4be]">
              TAUI TE ORA · {ROLE_LABELS[expectedRole]}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {data.profile.avatar_url ? (
                <img src={data.profile.avatar_url} alt={profileName} className="h-16 w-16 rounded-full border-2 border-white/60 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">🐾</div>
              )}
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-black sm:text-3xl">{profileName}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {[data.profile.city, data.profile.island].filter(Boolean).join(" · ") || "Votre espace de gestion"}
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-6 sm:px-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">Tableau de bord</p>
                <h2 className="mt-1 text-xl font-black text-[#064b42]">Accès rapides</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setAllSections(true)} className="rounded-full border border-[#064b42] px-3 py-2 text-xs font-bold text-[#064b42]">Tout ouvrir</button>
                <button type="button" onClick={() => setAllSections(false)} className="rounded-full border border-[#d6ccc0] px-3 py-2 text-xs font-bold text-[#6f5a47]">Tout fermer</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <QuickAccessLink href={getAddAnimalPath(expectedRole)} icon="➕" label="Déposer un animal" />
              <QuickAccessLink href={getAnimalsManagementPath(expectedRole)} icon="🐕" label="Gérer mes animaux" />
              <QuickAccessToggle icon="📊" label="Statistiques" active={sectionVisibility.stats} onClick={() => setSectionVisible("stats", !sectionVisibility.stats)} />
              <QuickAccessToggle icon="🐾" label="Mes animaux" active={sectionVisibility.animals} onClick={() => setSectionVisible("animals", !sectionVisibility.animals)} />
              <QuickAccessToggle icon="💌" label="Demandes d’adoption" active={sectionVisibility.adoptions} count={pendingRequests} onClick={() => setSectionVisible("adoptions", !sectionVisibility.adoptions)} />
              <QuickAccessToggle icon="💬" label="Messagerie" active={sectionVisibility.messages} onClick={() => setSectionVisible("messages", !sectionVisibility.messages)} />
              <QuickAccessLink href="/messages" icon="✉️" label="Toutes les conversations" />
              <QuickAccessToggle icon="🤝" label="Réseau d’aide" active={sectionVisibility.help} onClick={() => setSectionVisible("help", !sectionVisibility.help)} />
              <QuickAccessLink href="/sos-aide" icon="🚨" label="SOS animal" />
              <QuickAccessToggle icon="🛟" label="Assistance" active={sectionVisibility.support} onClick={() => setSectionVisible("support", !sectionVisibility.support)} />
              {canViewAssociationHistory && (
                <QuickAccessLink href="/association/historique" icon="📋" label="Historique des modifications" />
              )}
              <QuickAccessLink href="/profile" icon="👤" label="Modifier mon profil" />
              <button type="button" onClick={handleLogout} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-4 text-center text-sm font-black text-red-700 transition hover:bg-red-100">
                <span className="text-2xl" aria-hidden="true">🚪</span>Déconnexion
              </button>
            </div>
            <p className="mt-4 text-xs text-[#6f5a47]">Sélectionnez une rubrique pour afficher ou masquer son contenu. Vos préférences sont conservées sur cet appareil.</p>
          </div>
        </header>
        {sectionVisibility.stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Stat label="Animaux" value={data.animals.length} icon="🐾" />
          <Stat label="Publiés" value={published} icon="✅" />
          <Stat label="Adoptés" value={adopted} icon="🏡" />
          <Stat label="Coups de cœur" value={data.favorites.length} icon="❤️" />
          <Stat label="Demandes en attente" value={pendingRequests} icon="📩" />
          <Link href="/messages" className="block">
            <Stat label="Messages" value={data.conversations.length} icon="💬" />
          </Link>
        </div>
        )}
        {sectionVisibility.animals && (
        <section className="mt-7 min-w-0 rounded-[30px] bg-white p-4 shadow-md sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                Mes animaux
              </h2>
              <p className="mt-1 text-sm text-[#6f5a47]">
                Uniquement les animaux déposés par ce compte.
              </p>
            </div>
            <Link
              href={getAddAnimalPath(expectedRole)}
              className="rounded-full bg-[#ef8196] px-5 py-2.5 text-sm font-black text-white"
            >
              + Ajouter
            </Link>
          </div>
          {data.animals.length === 0 ? (
            <div className="rounded-3xl bg-[#f8f4ec] p-8 text-center">
              Aucun animal déposé pour le moment.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.animals.map((animal) => {
                const photo =
                  getCoverPhoto(animal);
                return (
                  <article
                    key={animal.id}
                    className="overflow-hidden rounded-[26px] border border-[#eadfce] bg-[#f8f4ec]"
                  >
                    <div className="aspect-[4/3] bg-[#eadfce]">
                      {photo ? (
                        <img
                          src={photo}
                          alt={animal.animal_name || "Animal"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          🐾
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-[#2f241c]">
                            {animal.animal_name || "Animal"}
                          </h3>
                          <p className="mt-1 text-sm text-[#6f5a47]">
                            {[
                              animal.animal_type,
                              animal.age_label,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                          {animal.is_adopted
                            ? "Adopté"
                            : animal.is_published === false
                              ? "Non publié"
                              : "Publié"}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2 text-sm font-bold">
                        <span className="rounded-full bg-white px-3 py-2">
                          ❤️ {favoriteCounts.get(animal.id) || 0}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2">
                          📩 {requestCounts.get(animal.id) || 0}
                        </span>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Link
                          href={`/animal/${animal.id}`}
                          className="rounded-full bg-[#2f241c] px-4 py-2.5 text-center text-sm font-black text-white"
                        >
                          Voir
                        </Link>
                        <Link
                          href={getEditAnimalPath(expectedRole, animal.id)}
                          className="rounded-full bg-[#9c7b54] px-4 py-2.5 text-center text-sm font-black text-white"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          disabled={actionId === animal.id}
                          onClick={() => archiveAnimal(animal.id)}
                          className="col-span-2 rounded-full border border-[#df8995] bg-white px-4 py-2.5 text-sm font-black text-[#d96f81] disabled:opacity-50"
                        >
                          {actionId === animal.id
                            ? "Traitement..."
                            : "Retirer de l'adoption"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        )}
        {sectionVisibility.animals && data.sharedAnimals.length > 0 && (
          <section className="mt-7 min-w-0 rounded-[30px] bg-white p-4 shadow-md sm:p-6">
            <h2 className="text-2xl font-black">Animaux de mes associations</h2>
            <p className="mt-1 text-sm text-[#6f5a47]">
              Fiches créées par d'autres membres des associations auxquelles vous êtes rattaché.
              Les demandes d'adoption et les conversations restent pour le moment gérées par le créateur.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.sharedAnimals.map((animal) => {
                const photo = getCoverPhoto(animal);
                const canEdit = animal.membershipRole === "responsable" ||
                  animal.membershipRole === "gestionnaire";
                return (
                  <article key={animal.id} className="overflow-hidden rounded-[26px] border border-[#eadfce] bg-[#f8f4ec]">
                    <div className="aspect-[4/3] bg-[#eadfce]">
                      {photo ? (
                        <img src={photo} alt={animal.animal_name || "Animal"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">🐾</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-[#9c7b54]">{animal.associationLabel}</p>
                      <h3 className="mt-1 text-xl font-black text-[#2f241c]">{animal.animal_name || "Animal"}</h3>
                      <p className="mt-1 text-sm text-[#6f5a47]">
                        {animal.membershipRole === "responsable" ? "Responsable" :
                          animal.membershipRole === "gestionnaire" ? "Gestionnaire" : "Bénévole"}
                        {" · "}{animal.is_adopted ? "Adopté" : animal.is_published ? "Publié" : "Non publié"}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link href={`/animal/${animal.id}`} className="rounded-full bg-[#2f241c] px-4 py-2.5 text-center text-sm font-black text-white">
                          Voir
                        </Link>
                        {canEdit ? (
                          <Link href={getEditAnimalPath(expectedRole, animal.id)} className="rounded-full bg-[#9c7b54] px-4 py-2.5 text-center text-sm font-black text-white">
                            Modifier
                          </Link>
                        ) : (
                          <span className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-[#6f5a47]">Lecture seule</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {sectionVisibility.adoptions && (
        <section className="mt-7 min-w-0 rounded-[30px] bg-white p-4 shadow-md sm:p-6">
          <h2 className="text-2xl font-black">
            Demandes d'adoption
          </h2>
          <p className="mt-1 text-sm text-[#6f5a47]">
            Retrouvez l'utilisateur, l'animal concerné, le taux de compatibilité et gérez chaque étape de l'adoption.
          </p>
          <div className="mt-5 space-y-4">
            {data.adoptionRequests.length === 0 ? (
              <div className="rounded-3xl bg-[#f8f4ec] p-6 text-center">
                Aucune demande pour le moment.
              </div>
            ) : (
              data.adoptionRequests.map((request) => {
                const conversation =
                  data.conversations.find(
                    (item) =>
                      item.adoption_request_id ===
                      request.id
                  );
                const requesterName =
                  `${request.requester?.first_name || ""} ${
                    request.requester?.last_name || ""
                  }`.trim() ||
                  "Utilisateur";
                const animalPhoto =
                  request.animals
                    ? getCoverPhoto(
                        request.animals
                      )
                    : "";
                const currentStatus =
                  String(
                    request.status ||
                      "pending"
                  )
                    .trim()
                    .toLowerCase();
                const isClosed =
                  currentStatus ===
                    "accepted" ||
                  currentStatus ===
                    "rejected" ||
                  currentStatus ===
                    "refused" ||
                  currentStatus ===
                    "cancelled";
                return (
                  <article
                    key={request.id}
                    className="
                      min-w-0 w-full overflow-hidden rounded-[28px] border
                      border-[#eadfce]
                      bg-[#f8f4ec]
                      p-4
                      sm:p-5
                    "
                  >
                    <div
                      className="
                        grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto]
                        lg:items-center
                      "
                    >
                      <div
                        className="
                          grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2
                        "
                      >
                        {/* ADOPTANT */}
                        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                          {request.requester
                            ?.avatar_url ? (
                            <img
                              src={
                                request
                                  .requester
                                  .avatar_url
                              }
                              alt={
                                requesterName
                              }
                              className="
                                h-20
                                w-20
                                shrink-0
                                rounded-full
                                border-4
                                border-white
                                object-cover
                                shadow
                              "
                            />
                          ) : (
                            <div
                              className="
                                flex
                                h-20
                                w-20
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-white
                                text-3xl
                                shadow
                              "
                            >
                              👤
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              className="
                                text-[11px]
                                font-black
                                uppercase
                                tracking-[0.14em]
                                text-[#9c7b54]
                              "
                            >
                              Utilisateur
                            </p>
                            <h3
                              className="
                                mt-1 break-words text-base leading-snug sm:text-xl
                                font-black
                                text-[#2f241c]
                              "
                            >
                              {requesterName}
                            </h3>
                            <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                              {typeof request.match_score ===
                                "number" && (
                                <span
                                  className="
                                    rounded-full
                                    bg-[#e8f5f1]
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-black
                                    text-[#064b42]
                                  "
                                >
                                  ❤️ Match{" "}
                                  {
                                    request.match_score
                                  }
                                  %
                                </span>
                              )}
                              <span
                                className={`
                                  rounded-full
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-black
                                  ${getRequestStatusStyle(
                                    currentStatus
                                  )}
                                `}
                              >
                                {getRequestStatusLabel(
                                  currentStatus
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* ANIMAL */}
                        <div
                          className="
                            flex min-w-0 items-start gap-3 sm:items-center sm:gap-4
                            rounded-[22px]
                            bg-white
                            p-3
                          "
                        >
                          {animalPhoto ? (
                            <img
                              src={
                                animalPhoto
                              }
                              alt={
                                request
                                  .animals
                                  ?.animal_name ||
                                "Animal"
                              }
                              className="
                                h-20
                                w-20
                                shrink-0
                                rounded-[18px]
                                object-cover
                              "
                            />
                          ) : (
                            <div
                              className="
                                flex
                                h-20
                                w-20
                                shrink-0
                                items-center
                                justify-center
                                rounded-[18px]
                                bg-[#eadfce]
                                text-3xl
                              "
                            >
                              🐾
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              className="
                                text-[11px]
                                font-black
                                uppercase
                                tracking-[0.14em]
                                text-[#9c7b54]
                              "
                            >
                              Animal souhaité
                            </p>
                            <h4
                              className="
                                mt-1 break-words text-lg
                                font-black
                                text-[#2f241c]
                              "
                            >
                              {request.animals
                                ?.animal_name ||
                                "Animal"}
                            </h4>
                            <p
                              className="
                                mt-1
                                text-sm
                                text-[#6f5a47]
                              "
                            >
                              {[
                                request
                                  .animals
                                  ?.animal_type,
                                request
                                  .animals
                                  ?.age_label,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* ACTIONS RAPIDES */}
                      <div
                        className="
                          grid min-w-0 w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:max-w-[300px] xl:justify-end
                        "
                      >
                        {request.requester_id && (
                          <Link
                            href={`/adoptant/${request.requester_id}?request=${request.id}`}
                            className="
                              flex min-w-0 items-center justify-center rounded-full bg-[#ef8196] px-2 text-center leading-tight sm:px-4
                              py-2.5
                              text-sm
                              font-black
                              text-white
                            "
                          >
                            👤 Voir le profil
                          </Link>
                        )}
                        {request.animal_id && (
                          <Link
                            href={`/animal/${request.animal_id}`}
                            className="
                              flex min-w-0 items-center justify-center rounded-full bg-[#9c7b54] px-2 text-center leading-tight sm:px-4
                              py-2.5
                              text-sm
                              font-black
                              text-white
                            "
                          >
                            Voir l'animal
                          </Link>
                        )}
                        {conversation?.id ? (
                          <Link
                            href={`/messages/${conversation.id}`}
                            className="col-span-2 sm:col-auto 
                              flex min-w-0 items-center justify-center rounded-full bg-[#064b42] px-2 text-center leading-tight sm:px-4
                              py-2.5
                              text-sm
                              font-black
                              text-white
                            "
                          >
                            💬 Messages
                          </Link>
                        ) : (
                          <span
                            className="col-span-2 sm:col-auto 
                              flex min-w-0 items-center justify-center rounded-full bg-white px-2 text-center sm:px-4
                              py-2.5
                              text-sm
                              font-bold
                              text-[#8a837b]
                            "
                          >
                            Aucun message
                          </span>
                        )}
                      </div>
                    </div>
                    {/* WORKFLOW ADOPTION */}
                    {!isClosed && (
                      <div
                        className="
                          mt-5
                          border-t
                          border-[#eadfce]
                          pt-4
                        "
                      >
                        <p
                          className="
                            mb-3
                            text-xs
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-[#6f5a47]
                          "
                        >
                          Suivi de la demande
                        </p>
                        <div
                          className="
                            grid
                            gap-2
                            sm:grid-cols-3
                          "
                        >
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              request.id
                            }
                            onClick={() =>
                              updateAdoptionStatus(
                                request,
                                "rejected"
                              )
                            }
                            className="
                              rounded-full
                              border
                              border-[#df8995]
                              bg-white
                              px-4
                              py-3
                              text-sm
                              font-black
                              text-[#d96f81]
                              transition
                              hover:bg-[#fff0f2]
                              disabled:opacity-50
                            "
                          >
                            Refuser l'adoption
                          </button>
                          <button
                            type="button"
                            disabled={
                              actionId ===
                                request.id ||
                              currentStatus ===
                                "meeting"
                            }
                            onClick={() =>
                              updateAdoptionStatus(
                                request,
                                "meeting"
                              )
                            }
                            className="
                              rounded-full
                              bg-[#e6a85c]
                              px-4
                              py-3
                              text-sm
                              font-black
                              text-white
                              transition
                              hover:opacity-90
                              disabled:opacity-50
                            "
                          >
                            {currentStatus ===
                            "meeting"
                              ? "✓ Rencontre prévue"
                              : "Passer à la rencontre"}
                          </button>
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              request.id
                            }
                            onClick={() =>
                              updateAdoptionStatus(
                                request,
                                "accepted"
                              )
                            }
                            className="
                              rounded-full
                              bg-[#2f8f6b]
                              px-4
                              py-3
                              text-sm
                              font-black
                              text-white
                              transition
                              hover:opacity-90
                              disabled:opacity-50
                            "
                          >
                            Valider l'adoption
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
        )}
        {sectionVisibility.messages && (
          <div className="mt-7">
            <DashboardMessages />
          </div>
        )}
        {sectionVisibility.help && (
          <section className="mt-7 min-w-0 rounded-[30px] bg-white p-4 shadow-md sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">
                  Entraide
                </p>
                <h2 className="mt-1 text-2xl font-black">🤝 Réseau d’aide</h2>
                <p className="mt-1 text-sm text-[#6f5a47]">
                  Consultez le réseau d’entraide et les SOS actifs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/reseau-aide" className="rounded-full bg-[#064b42] px-5 py-2.5 text-sm font-black text-white">
                  Voir le réseau
                </Link>
                <Link href="/sos-aide" className="rounded-full bg-[#df8995] px-5 py-2.5 text-sm font-black text-white">
                  🚨 SOS
                </Link>
              </div>
            </div>
          </section>
        )}
        {sectionVisibility.support && (
        <section className="mt-7 min-w-0 rounded-[30px] bg-white p-4 shadow-md sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">
                Assistance
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Signaler un problème
              </h2>
              <p className="mt-1 text-sm text-[#6f5a47]">
                Une erreur, un bug ou un problème avec votre compte ? Contactez directement l'administration.
              </p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[240px]">
              <SupportButton />
            </div>
          </div>
        </section>
        )}
      </section>
    </main>
  );
}
function getPublisherDestination(
  role: string
) {
  switch (role) {
    case "association":
      return "/association/dashboard";
    case "refuge":
      return "/refuge/dashboard";
    case "fourriere":
      return "/fourriere/dashboard";
    case "sigfa":
      return "/sigfa/dashboard";
    case "benevole":
      return "/benevole/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "adoptant":
      return "/profile";
    default:
      return "/";
  }
}
function getRequestStatusLabel(
  status: string
) {
  switch (status) {
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
function getRequestStatusStyle(
  status: string
) {
  switch (status) {
    case "meeting":
      return "bg-[#fff1d9] text-[#9b641e]";
    case "accepted":
      return "bg-green-100 text-green-700";
    case "rejected":
    case "refused":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-gray-200 text-gray-600";
    case "pending":
    default:
      return "bg-orange-100 text-orange-700";
  }
}
function getCoverPhoto(animal: Animal) {
  const photos =
    Array.isArray(animal.animal_photos)
      ? animal.animal_photos
      : [];
  const cover =
    photos.find((photo) => photo.is_cover) ||
    photos
      .slice()
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      )[0];
  return cover?.photo_url || "";
}
function QuickAccessLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#e9e0d5] bg-[#f8f4ec] px-3 py-4 text-center text-sm font-black text-[#064b42] transition hover:border-[#064b42] hover:bg-[#e8f5f1]">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
function QuickAccessToggle({ icon, label, active, count, onClick }: { icon: string; label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button type="button" aria-expanded={active} onClick={onClick} className={`relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center text-sm font-black transition ${active ? "border-[#064b42] bg-[#e8f5f1] text-[#064b42]" : "border-[#e9e0d5] bg-[#f8f4ec] text-[#064b42] hover:border-[#064b42]"}`}>
      {typeof count === "number" && count > 0 && <span className="absolute right-2 top-2 rounded-full bg-[#ef8196] px-2 py-0.5 text-xs text-white">{count}</span>}
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      <span className="text-[10px] font-medium text-[#6f5a47]">{active ? "Masquer ▲" : "Afficher ▼"}</span>
    </button>
  );
}
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-5 text-center shadow-md">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-3xl font-black text-[#2f241c]">
        {value}
      </div>
      <div className="mt-1 text-xs font-bold text-[#6f5a47]">
        {label}
      </div>
    </div>
  );
}
