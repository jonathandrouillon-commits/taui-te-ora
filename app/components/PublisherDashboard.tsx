"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { animalService } from "../services/animal.service";
import SupportButton from "./SupportButton";

export type PublisherRole =
  | "association"
  | "refuge"
  | "fourriere"
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

type DashboardData = {
  profile: Profile;
  animals: Animal[];
  favorites: Favorite[];
  adoptionRequests: AdoptionRequest[];
  conversations: Conversation[];
};

const ROLE_LABELS: Record<PublisherRole, string> = {
  association: "Association",
  refuge: "Refuge / SIGFA",
  fourriere: "Fourrière",
  benevole: "Bénévole indépendant",
};

export default function PublisherDashboard({
  expectedRole,
}: {
  expectedRole: PublisherRole;
}) {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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
        router.replace("/profile");
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
  }

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
    const confirmed =
      window.confirm(
        "Retirer cet animal des animaux visibles ? Sa fiche et son historique seront conservés."
      );

    if (!confirmed) return;

    try {
      setActionId(animalId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("animals")
        .update({
          is_published: false,
          status: "archive",
        })
        .eq("id", animalId)
        .eq("owner_id", user.id);

      if (error) throw error;

      await loadDashboard();
    } catch (error: any) {
      console.error(
        "Erreur retrait animal :",
        error
      );
      alert(
        error?.message ||
          "Impossible de retirer cet animal."
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
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42] sm:px-6">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[30px] bg-white p-6 shadow-md">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {data.profile.avatar_url ? (
                <img
                  src={data.profile.avatar_url}
                  alt={profileName}
                  className="h-20 w-20 rounded-full object-cover shadow"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#efd5d7] text-3xl">
                  🐾
                </div>
              )}

              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#df8995]">
                  {ROLE_LABELS[expectedRole]}
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  {profileName}
                </h1>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  {[data.profile.city, data.profile.island]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/association/add-animal"
                className="rounded-full bg-[#ef8196] px-6 py-3 font-black text-white shadow"
              >
                + Déposer un animal
              </Link>

              <Link
                href="/association/animals"
                className="rounded-full bg-[#064b42] px-6 py-3 font-black text-white shadow"
              >
                Gérer mes animaux
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  rounded-full
                  border-2
                  border-red-200
                  bg-white
                  px-6
                  py-3
                  font-black
                  text-red-600
                  shadow
                  transition
                  hover:bg-red-50
                  active:scale-[0.98]
                "
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Animaux" value={data.animals.length} icon="🐾" />
          <Stat label="Publiés" value={published} icon="✅" />
          <Stat label="Adoptés" value={adopted} icon="🏡" />
          <Stat label="Coups de cœur" value={data.favorites.length} icon="❤️" />
          <Stat label="Demandes en attente" value={pendingRequests} icon="📩" />
        </div>

        <section className="mt-7 rounded-[30px] bg-white p-5 shadow-md sm:p-6">
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
              href="/association/add-animal"
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
                          href={`/association/edit-animal/${animal.id}`}
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

        <section className="mt-7 rounded-[30px] bg-white p-5 shadow-md sm:p-6">
          <h2 className="text-2xl font-black">
            Demandes d&apos;adoption
          </h2>

          <p className="mt-1 text-sm text-[#6f5a47]">
            Retrouvez l&apos;adoptant, l&apos;animal concerné, le taux de compatibilité et gérez chaque étape de l&apos;adoption.
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
                  "Adoptant";

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
                      rounded-[28px]
                      border
                      border-[#eadfce]
                      bg-[#f8f4ec]
                      p-4
                      sm:p-5
                    "
                  >
                    <div
                      className="
                        grid
                        gap-5
                        lg:grid-cols-[1fr_auto]
                        lg:items-center
                      "
                    >
                      <div
                        className="
                          grid
                          gap-5
                          sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
                        "
                      >
                        {/* ADOPTANT */}

                        <div className="flex items-center gap-4">
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
                              Adoptant
                            </p>

                            <h3
                              className="
                                mt-1
                                truncate
                                text-xl
                                font-black
                                text-[#2f241c]
                              "
                            >
                              {requesterName}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2">
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
                            flex
                            items-center
                            gap-4
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
                                mt-1
                                truncate
                                text-lg
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
                          flex
                          flex-wrap
                          gap-2
                          lg:max-w-[240px]
                          lg:justify-end
                        "
                      >
                        {request.requester_id && (
                          <Link
                            href={`/adoptant/${request.requester_id}?request=${request.id}`}
                            className="
                              rounded-full
                              bg-[#ef8196]
                              px-4
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
                              rounded-full
                              bg-[#9c7b54]
                              px-4
                              py-2.5
                              text-sm
                              font-black
                              text-white
                            "
                          >
                            Voir l&apos;animal
                          </Link>
                        )}

                        {conversation?.id ? (
                          <Link
                            href={`/messages/${conversation.id}`}
                            className="
                              rounded-full
                              bg-[#064b42]
                              px-4
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
                            className="
                              rounded-full
                              bg-white
                              px-4
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
                            Refuser l&apos;adoption
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
                            Valider l&apos;adoption
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

        <section className="mt-7 rounded-[30px] bg-white p-5 shadow-md sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Messagerie
              </h2>

              <p className="mt-1 text-sm text-[#6f5a47]">
                Conversations liées uniquement à vos animaux.
              </p>
            </div>

            <span className="rounded-full bg-[#f8f4ec] px-4 py-2 font-black">
              💬 {data.conversations.length}
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {data.conversations.length === 0 ? (
              <div className="rounded-3xl bg-[#f8f4ec] p-6 text-center">
                Aucun message.
              </div>
            ) : (
              data.conversations.slice(0, 10).map((conversation) => {
                const animal =
                  data.animals.find(
                    (item) =>
                      item.id === conversation.animal_id
                  );

                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] px-5 py-4 font-bold text-[#064b42]"
                  >
                    <span>
                      💬 {animal?.animal_name || "Animal"}
                    </span>

                    <span>Ouvrir →</span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-7 rounded-[30px] bg-white p-5 shadow-md sm:p-6">
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