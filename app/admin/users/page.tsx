"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CirclePause,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  email: string | null;

  first_name: string | null;
  last_name: string | null;

  organization_name: string | null;

  role: string | null;

  phone: string | null;

  island: string | null;
  city: string | null;

  approval_status: string | null;

  is_verified: boolean | null;
  is_active: boolean | null;

  approved_at?: string | null;
  approved_by?: string | null;

  created_at?: string | null;
};

type UserFilter =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "all";

type EditForm = {
  first_name: string;
  last_name: string;
  organization_name: string;
  role: string;
  phone: string;
  island: string;
  city: string;
};

const ROLE_OPTIONS = [
  {
    value: "adoptant",
    label: "Adoptant",
  },
  {
    value: "association",
    label: "Association",
  },
  {
    value: "refuge",
    label: "Refuge / SIGFA",
  },
  {
    value: "fourriere",
    label: "Fourrière",
  },
  {
    value: "benevole",
    label: "Bénévole indépendant",
  },
  {
    value: "admin",
    label: "Administrateur",
  },
];

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        message?: string;
      };

    if (
      candidate.message
    ) {
      return candidate.message;
    }
  }

  return "Erreur inconnue";
}

export default function AdminUsersPage() {
  const router =
    useRouter();

  const [
    users,
    setUsers,
  ] =
    useState<Profile[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionId,
    setActionId,
  ] =
    useState<string | null>(
      null
    );

  const [
    filter,
    setFilter,
  ] =
    useState<UserFilter>(
      "pending"
    );

  const [
    currentAdminId,
    setCurrentAdminId,
  ] =
    useState<string>("");

  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditForm>({
      first_name: "",
      last_name: "",
      organization_name: "",
      role: "adoptant",
      phone: "",
      island: "",
      city: "",
    });

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(
          true
        );

        const {
          data: {
            user,
          },
          error:
            authError,
        } =
          await supabase
            .auth
            .getUser();

        if (
          authError ||
          !user
        ) {
          router.replace(
            "/login?redirect=/admin/users"
          );

          return;
        }

        setCurrentAdminId(
          user.id
        );

        const {
          data:
            currentProfile,
          error:
            currentError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, role, is_active"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          currentError
        ) {
          throw currentError;
        }

        const currentRole =
          String(
            currentProfile
              ?.role ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          currentRole !==
          "admin"
        ) {
          router.replace(
            "/"
          );

          return;
        }

        if (
          currentProfile
            ?.is_active ===
          false
        ) {
          router.replace(
            "/"
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              `
                id,
                email,
                first_name,
                last_name,
                organization_name,
                role,
                phone,
                island,
                city,
                approval_status,
                is_verified,
                is_active,
                approved_at,
                approved_by,
                created_at
              `
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          error
        ) {
          throw error;
        }

        setUsers(
          (
            data ||
            []
          ) as Profile[]
        );
      } catch (
        error:
          unknown
      ) {
        console.error(
          "Erreur chargement utilisateurs :",
          error
        );

        alert(
          getErrorMessage(
            error
          ) ||
            "Erreur lors du chargement des utilisateurs."
        );
      } finally {
        setLoading(
          false
        );
      }
    }, [
      router,
    ]);

  /* =========================================================
     MODIFICATION PROFIL
  ========================================================= */

  function startEdit(
    user: Profile
  ) {
    setEditingId(
      user.id
    );

    setEditForm({
      first_name:
        user.first_name ||
        "",

      last_name:
        user.last_name ||
        "",

      organization_name:
        user.organization_name ||
        "",

      role:
        String(
          user.role ||
            "adoptant"
        )
          .trim()
          .toLowerCase(),

      phone:
        user.phone ||
        "",

      island:
        user.island ||
        "",

      city:
        user.city ||
        "",
    });
  }

  function cancelEdit() {
    setEditingId(
      null
    );

    setEditForm({
      first_name: "",
      last_name: "",
      organization_name: "",
      role: "adoptant",
      phone: "",
      island: "",
      city: "",
    });
  }

  async function saveEdit(
    id: string
  ) {
    if (
      actionId
    ) {
      return;
    }

    try {
      setActionId(
        id
      );

      const payload = {
        first_name:
          editForm
            .first_name
            .trim() ||
          null,

        last_name:
          editForm
            .last_name
            .trim() ||
          null,

        organization_name:
          editForm
            .organization_name
            .trim() ||
          null,

        role:
          editForm
            .role
            .trim()
            .toLowerCase(),

        phone:
          editForm
            .phone
            .trim() ||
          null,

        island:
          editForm
            .island
            .trim() ||
          null,

        city:
          editForm
            .city
            .trim() ||
          null,
      };

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update(
            payload
          )
          .eq(
            "id",
            id
          );

      if (
        error
      ) {
        throw error;
      }

      setEditingId(
        null
      );

      await loadUsers();

      alert(
        "Profil modifié avec succès."
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Erreur modification utilisateur :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de modifier ce compte."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  async function approveUser(
    id: string
  ) {
    if (
      actionId
    ) {
      return;
    }

    try {
      setActionId(
        id
      );

      const {
        data: {
          user:
            adminUser,
        },
        error:
          authError,
      } =
        await supabase
          .auth
          .getUser();

      if (
        authError ||
        !adminUser
      ) {
        throw new Error(
          "Session administrateur introuvable."
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            approval_status:
              "approved",

            is_verified:
              true,

            is_active:
              true,

            approved_at:
              new Date()
                .toISOString(),

            approved_by:
              adminUser.id,
          })
          .eq(
            "id",
            id
          );

      if (
        error
      ) {
        throw error;
      }

      await loadUsers();
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Erreur validation utilisateur :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de valider ce compte."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =========================================================
     REFUS
  ========================================================= */

  async function rejectUser(
    id: string
  ) {
    if (
      actionId
    ) {
      return;
    }

    const reason =
      window.prompt(
        "Motif du refus ?",
        "Profil incomplet"
      );

    if (
      reason ===
      null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Confirmer le refus de ce compte ?\n\nSes animaux publiés seront retirés et archivés."
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setActionId(
        id
      );

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            approval_status:
              "rejected",

            is_verified:
              false,

            is_active:
              false,

            approved_at:
              null,

            approved_by:
              null,
          })
          .eq(
            "id",
            id
          );

      if (
        error
      ) {
        throw error;
      }

      alert(
        reason
          ? `Compte refusé : ${reason}`
          : "Compte refusé."
      );

      await loadUsers();
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Erreur refus utilisateur :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de refuser ce compte."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =========================================================
     SUSPENSION / DÉSACTIVATION
  ========================================================= */

  async function suspendUser(
    id: string
  ) {
    if (
      actionId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous suspendre ce compte ?\n\nLe compte sera désactivé. Ses animaux publiés seront retirés et archivés. Le compte pourra être réactivé plus tard."
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setActionId(
        id
      );

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            approval_status:
              "suspended",

            is_active:
              false,

            is_verified:
              false,
          })
          .eq(
            "id",
            id
          );

      if (
        error
      ) {
        throw error;
      }

      await loadUsers();
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Erreur suspension utilisateur :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de suspendre ce compte."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =========================================================
     RÉACTIVATION
  ========================================================= */

  async function reactivateUser(
    id: string
  ) {
    if (
      actionId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous réactiver et valider ce compte ?\n\nLes animaux archivés resteront disponibles pour être republiés."
      );

    if (
      !confirmed
    ) {
      return;
    }

    await approveUser(
      id
    );
  }

  /* =========================================================
     SUPPRESSION DÉFINITIVE
  ========================================================= */

  async function deleteUser(
    user: Profile
  ) {
    if (
      actionId
    ) {
      return;
    }

    /*
     * Protection minimale :
     * le compte admin actuellement connecté
     * ne peut pas se supprimer lui-même.
     */

    if (
      user.id ===
      currentAdminId
    ) {
      alert(
        "Vous ne pouvez pas supprimer le compte administrateur avec lequel vous êtes actuellement connecté."
      );

      return;
    }

    const displayName =
      getDisplayName(
        user
      );

    const confirmed =
      window.confirm(
        `Supprimer définitivement le compte de ${displayName} ?\n\nCette action supprimera le compte utilisateur. Les éventuels animaux seront transférés au compte administrateur. Cette action est irréversible.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    const verification =
      window.prompt(
        'Pour confirmer, écrivez exactement : SUPPRIMER'
      );

    if (
      verification !==
      "SUPPRIMER"
    ) {
      alert(
        "Suppression annulée : le mot de confirmation est incorrect."
      );

      return;
    }

    try {
      setActionId(
        user.id
      );

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase
          .auth
          .getSession();

      if (
        sessionError ||
        !session
          ?.access_token
      ) {
        throw new Error(
          "Session administrateur introuvable."
        );
      }

      const response =
        await fetch(
          "/api/admin/users",
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId:
                  user.id,
              }),
          }
        );

      const result =
        (
          await response
            .json()
            .catch(
              () => ({})
            )
        ) as {
          error?: string;
          message?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Impossible de supprimer ce compte."
        );
      }

      alert(
        result.message ||
          "Compte supprimé définitivement."
      );

      await loadUsers();
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Erreur suppression utilisateur :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de supprimer ce compte."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =========================================================
     FILTRES
  ========================================================= */

  const filteredUsers =
    useMemo(() => {
      if (
        filter ===
        "all"
      ) {
        return users;
      }

      return users.filter(
        (
          user
        ) =>
          normalizeStatus(
            user.approval_status
          ) ===
          filter
      );
    }, [
      users,
      filter,
    ]);

  const pendingCount =
    users.filter(
      (
        user
      ) =>
        normalizeStatus(
          user.approval_status
        ) ===
        "pending"
    ).length;

  const approvedCount =
    users.filter(
      (
        user
      ) =>
        normalizeStatus(
          user.approval_status
        ) ===
        "approved"
    ).length;

  const rejectedCount =
    users.filter(
      (
        user
      ) =>
        normalizeStatus(
          user.approval_status
        ) ===
        "rejected"
    ).length;

  const suspendedCount =
    users.filter(
      (
        user
      ) =>
        normalizeStatus(
          user.approval_status
        ) ===
        "suspended"
    ).length;

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalizeStatus(
    status?:
      string |
      null
  ):
    | "pending"
    | "approved"
    | "rejected"
    | "suspended" {
    const value =
      String(
        status ||
          "pending"
      )
        .trim()
        .toLowerCase();

    if (
      value ===
      "approved"
    ) {
      return "approved";
    }

    if (
      value ===
      "rejected"
    ) {
      return "rejected";
    }

    if (
      value ===
      "suspended"
    ) {
      return "suspended";
    }

    return "pending";
  }

  function getDisplayName(
    user: Profile
  ) {
    if (
      user
        .organization_name
    ) {
      return user
        .organization_name;
    }

    const fullName =
      `${user.first_name || ""} ${
        user.last_name || ""
      }`.trim();

    return (
      fullName ||
      user.email ||
      "Sans nom"
    );
  }

  function getRoleLabel(
    role?:
      string |
      null
  ) {
    const value =
      String(
        role ||
          ""
      )
        .trim()
        .toLowerCase();

    const option =
      ROLE_OPTIONS.find(
        (
          item
        ) =>
          item.value ===
          value
      );

    return (
      option?.label ||
      "Adoptant"
    );
  }

  /* =========================================================
     CHARGEMENT INITIAL
  ========================================================= */

  useEffect(() => {
    queueMicrotask(
      () =>
        void loadUsers()
    );
  }, [
    loadUsers,
  ]);

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-16 pt-24 text-[#064b42] sm:px-8">
      <section className="mx-auto max-w-7xl">

        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/dashboard"
            )
          }
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft
            size={20}
          />

          Retour dashboard
        </button>

        {/* HEADER */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <Users
              size={42}
            />

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b68b2f]">
                Administration
              </p>

              <h1 className="mt-1 text-4xl font-black sm:text-5xl">
                Utilisateurs
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Gestion complète de tous les comptes TAUI TE ORA.
              </p>
            </div>
          </div>

          <select
            value={
              filter
            }
            onChange={(
              event
            ) =>
              setFilter(
                event
                  .target
                  .value as UserFilter
              )
            }
            className="rounded-2xl bg-white px-5 py-4 font-bold shadow outline-none"
          >
            <option value="pending">
              En attente
            </option>

            <option value="approved">
              Validés
            </option>

            <option value="rejected">
              Refusés
            </option>

            <option value="suspended">
              Suspendus
            </option>

            <option value="all">
              Tous
            </option>
          </select>
        </div>

        {/* COMPTEURS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <Stat
            label="Total"
            value={
              users.length
            }
          />

          <Stat
            label="En attente"
            value={
              pendingCount
            }
            status="pending"
          />

          <Stat
            label="Validés"
            value={
              approvedCount
            }
            status="approved"
          />

          <Stat
            label="Refusés"
            value={
              rejectedCount
            }
            status="rejected"
          />

          <Stat
            label="Suspendus"
            value={
              suspendedCount
            }
            status="suspended"
          />

        </div>

        {/* UTILISATEURS */}

        <div className="mt-8 space-y-5">

          {filteredUsers.length ===
          0 ? (

            <div className="rounded-3xl bg-white p-10 text-center shadow">

              <ShieldCheck
                className="mx-auto text-[#064b42]"
                size={52}
              />

              <h2 className="mt-4 text-2xl font-black">
                Aucun utilisateur dans cette catégorie
              </h2>

            </div>

          ) : (

            filteredUsers.map(
              (
                user
              ) => {

                const status =
                  normalizeStatus(
                    user.approval_status
                  );

                const isProcessing =
                  actionId ===
                  user.id;

                const isEditing =
                  editingId ===
                  user.id;

                const isCurrentAdmin =
                  user.id ===
                  currentAdminId;

                return (
                  <article
                    key={
                      user.id
                    }
                    className={`rounded-3xl border p-6 shadow-sm transition ${
                      status ===
                      "approved"
                        ? "border-green-200 bg-green-50/70"
                        : status ===
                            "rejected"
                          ? "border-red-200 bg-red-50/70"
                          : status ===
                              "suspended"
                            ? "border-orange-200 bg-orange-50/80"
                            : "border-[#eadfce] bg-white"
                    }`}
                  >

                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                      {/* INFORMATIONS */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-2xl font-black">
                            {getDisplayName(
                              user
                            )}
                          </h2>

                          <StatusBadge
                            status={
                              status
                            }
                          />

                          {isCurrentAdmin && (
                            <span className="rounded-full bg-[#064b42] px-3 py-1 text-xs font-black text-white">
                              Votre compte
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-gray-500">
                          {user.email ||
                            "Email non renseigné"}
                        </p>

                        {!isEditing && (
                          <>
                            <p className="mt-3 font-bold">
                              Rôle :{" "}
                              {getRoleLabel(
                                user.role
                              )}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {user.phone ||
                                "Téléphone non renseigné"}
                              {" — "}
                              {user.city ||
                                "Commune non renseignée"}
                              {" — "}
                              {user.island ||
                                "Île non renseignée"}
                            </p>
                          </>
                        )}

                        {/* FORMULAIRE MODIFICATION */}

                        {isEditing && (
                          <div className="mt-6 grid gap-4 rounded-3xl border border-[#eadfd8] bg-white p-5 sm:grid-cols-2">

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Prénom
                              </span>

                              <input
                                value={
                                  editForm.first_name
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      first_name:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Nom
                              </span>

                              <input
                                value={
                                  editForm.last_name
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      last_name:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                            <label className="block sm:col-span-2">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Structure
                              </span>

                              <input
                                value={
                                  editForm.organization_name
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      organization_name:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Rôle
                              </span>

                              <select
                                value={
                                  editForm.role
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      role:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none"
                              >
                                {ROLE_OPTIONS.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {option.label}
                                    </option>
                                  )
                                )}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Téléphone
                              </span>

                              <input
                                value={
                                  editForm.phone
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      phone:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Île
                              </span>

                              <input
                                value={
                                  editForm.island
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      island:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-black uppercase text-gray-500">
                                Commune
                              </span>

                              <input
                                value={
                                  editForm.city
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      city:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                              />
                            </label>

                          </div>
                        )}

                        {user.created_at && (
                          <p className="mt-3 text-xs text-gray-400">
                            Inscrit le{" "}
                            {new Date(
                              user.created_at
                            ).toLocaleString(
                              "fr-FR"
                            )}
                          </p>
                        )}

                      </div>

                      {/* ACTIONS */}

                      <div className="flex min-w-fit flex-wrap items-center gap-3">

                        {!isEditing ? (
                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              startEdit(
                                user
                              )
                            }
                            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-[#064b42] shadow-sm disabled:opacity-50"
                          >
                            <Pencil
                              size={18}
                            />

                            Modifier
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                saveEdit(
                                  user.id
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              <Save
                                size={18}
                              />

                              Enregistrer
                            </button>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={
                                cancelEdit
                              }
                              className="flex items-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 font-black text-gray-700 disabled:opacity-50"
                            >
                              <X
                                size={18}
                              />

                              Annuler
                            </button>
                          </>
                        )}

                        {status ===
                          "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                approveUser(
                                  user.id
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              <Check
                                size={18}
                              />

                              Valider
                            </button>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                rejectUser(
                                  user.id
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              <X
                                size={18}
                              />

                              Refuser
                            </button>
                          </>
                        )}

                        {status ===
                          "approved" && (
                          <>
                            <div className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-black text-white">
                              <Check
                                size={18}
                              />

                              Compte validé
                            </div>

                            {!isCurrentAdmin && (
                              <button
                                type="button"
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  suspendUser(
                                    user.id
                                  )
                                }
                                className="flex items-center gap-2 rounded-2xl bg-orange-100 px-5 py-3 font-black text-orange-800 disabled:opacity-50"
                              >
                                <CirclePause
                                  size={18}
                                />

                                Suspendre
                              </button>
                            )}
                          </>
                        )}

                        {status ===
                          "rejected" && (
                          <>
                            <div className="rounded-2xl bg-red-100 px-5 py-3 font-black text-red-700">
                              Compte refusé
                            </div>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                reactivateUser(
                                  user.id
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              <RotateCcw
                                size={18}
                              />

                              Réactiver
                            </button>
                          </>
                        )}

                        {status ===
                          "suspended" && (
                          <>
                            <div className="rounded-2xl bg-orange-100 px-5 py-3 font-black text-orange-800">
                              Compte suspendu
                            </div>

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                reactivateUser(
                                  user.id
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              <RotateCcw
                                size={18}
                              />

                              Réactiver
                            </button>
                          </>
                        )}

                        {!isCurrentAdmin && (
                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              deleteUser(
                                user
                              )
                            }
                            className="flex items-center gap-2 rounded-2xl border-2 border-red-600 bg-white px-5 py-3 font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2
                              size={18}
                            />

                            {isProcessing
                              ? "Suppression..."
                              : "Supprimer définitivement"}
                          </button>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )
          )}

        </div>

      </section>
    </main>
  );
}

/* =========================================================
   BADGE STATUT
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
}) {
  if (
    status ===
    "approved"
  ) {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
        ✓ Validé
      </span>
    );
  }

  if (
    status ===
    "rejected"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        ✕ Refusé
      </span>
    );
  }

  if (
    status ===
    "suspended"
  ) {
    return (
      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
        Suspendu
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
      En attente
    </span>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
  status,
}: {
  label:
    string;

  value:
    number;

  status?:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
}) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm ${
        status ===
        "approved"
          ? "border-green-200 bg-green-50"
          : status ===
              "rejected"
            ? "border-red-200 bg-red-50"
            : status ===
                "suspended"
              ? "border-orange-200 bg-orange-50"
              : status ===
                  "pending"
                ? "border-amber-200 bg-amber-50"
                : "border-white bg-white"
      }`}
    >
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b68b2f]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#064b42]">
        {value}
      </p>
    </div>
  );
}