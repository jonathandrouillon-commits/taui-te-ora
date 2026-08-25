"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CirclePause,
  RotateCcw,
  ShieldCheck,
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

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] =
    useState<Profile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<UserFilter>("pending");

  useEffect(() => {
    void loadUsers();
  }, []);

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  async function loadUsers() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !user
      ) {
        router.replace(
          "/login?redirect=/admin/users"
        );

        return;
      }

      const {
        data: currentProfile,
        error: currentError,
      } = await supabase
        .from("profiles")
        .select(
          "id, role, is_active"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      if (
        String(
          currentProfile?.role ||
            ""
        )
          .trim()
          .toLowerCase() !==
        "admin"
      ) {
        router.replace("/");
        return;
      }

      if (
        currentProfile?.is_active ===
        false
      ) {
        router.replace("/");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
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
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      setUsers(
        (data || []) as Profile[]
      );
    } catch (error: any) {
      console.error(
        "Erreur chargement utilisateurs :",
        error
      );

      alert(
        error?.message ||
          "Erreur lors du chargement des utilisateurs."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  async function approveUser(
    id: string
  ) {
    if (actionId) return;

    try {
      setActionId(id);

      const {
        data: {
          user: adminUser,
        },
        error: authError,
      } =
        await supabase.auth.getUser();

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
      } = await supabase
        .from("profiles")
        .update({
          approval_status:
            "approved",

          is_verified:
            true,

          is_active:
            true,

          approved_at:
            new Date().toISOString(),

          approved_by:
            adminUser.id,
        })
        .eq(
          "id",
          id
        );

      if (error) {
        throw error;
      }

      await loadUsers();
    } catch (error: any) {
      console.error(
        "Erreur validation utilisateur :",
        error
      );

      alert(
        error?.message ||
          "Impossible de valider ce compte."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =========================================================
     REFUS
  ========================================================= */

  async function rejectUser(
    id: string
  ) {
    if (actionId) return;

    const reason =
      window.prompt(
        "Motif du refus ?",
        "Profil incomplet"
      );

    if (reason === null) {
      return;
    }

    const confirmed =
      window.confirm(
        "Confirmer le refus de ce compte ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);

      const {
        error,
      } = await supabase
        .from("profiles")
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

      if (error) {
        throw error;
      }

      alert(
        reason
          ? `Compte refusé : ${reason}`
          : "Compte refusé."
      );

      await loadUsers();
    } catch (error: any) {
      console.error(
        "Erreur refus utilisateur :",
        error
      );

      alert(
        error?.message ||
          "Impossible de refuser ce compte."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =========================================================
     SUSPENSION
  ========================================================= */

  async function suspendUser(
    id: string
  ) {
    if (actionId) return;

    const confirmed =
      window.confirm(
        "Voulez-vous suspendre ce compte ?\n\nLe profil ne sera pas supprimé et pourra être réactivé plus tard."
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);

      const {
        error,
      } = await supabase
        .from("profiles")
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

      if (error) {
        throw error;
      }

      await loadUsers();
    } catch (error: any) {
      console.error(
        "Erreur suspension utilisateur :",
        error
      );

      alert(
        error?.message ||
          "Impossible de suspendre ce compte."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =========================================================
     REACTIVATION
  ========================================================= */

  async function reactivateUser(
    id: string
  ) {
    if (actionId) return;

    const confirmed =
      window.confirm(
        "Voulez-vous réactiver et valider ce compte ?"
      );

    if (!confirmed) {
      return;
    }

    await approveUser(id);
  }

  /* =========================================================
     FILTRES
  ========================================================= */

  const filteredUsers =
    useMemo(() => {
      if (
        filter === "all"
      ) {
        return users;
      }

      return users.filter(
        (user) =>
          normalizeStatus(
            user.approval_status
          ) === filter
      );
    }, [
      users,
      filter,
    ]);

  const pendingCount =
    users.filter(
      (user) =>
        normalizeStatus(
          user.approval_status
        ) === "pending"
    ).length;

  const approvedCount =
    users.filter(
      (user) =>
        normalizeStatus(
          user.approval_status
        ) === "approved"
    ).length;

  const rejectedCount =
    users.filter(
      (user) =>
        normalizeStatus(
          user.approval_status
        ) === "rejected"
    ).length;

  const suspendedCount =
    users.filter(
      (user) =>
        normalizeStatus(
          user.approval_status
        ) === "suspended"
    ).length;

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalizeStatus(
    status?: string | null
  ) {
    const value =
      String(
        status || "pending"
      )
        .trim()
        .toLowerCase();

    if (
      value === "approved"
    ) {
      return "approved";
    }

    if (
      value === "rejected"
    ) {
      return "rejected";
    }

    if (
      value === "suspended"
    ) {
      return "suspended";
    }

    return "pending";
  }

  function getDisplayName(
    user: Profile
  ) {
    if (
      user.organization_name
    ) {
      return user.organization_name;
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
    role?: string | null
  ) {
    const value =
      String(role || "")
        .trim()
        .toLowerCase();

    if (
      value === "association"
    ) {
      return "Association";
    }

    if (
      value === "refuge"
    ) {
      return "Refuge / SIGFA";
    }

    if (
      value === "fourriere"
    ) {
      return "Fourrière";
    }

    if (
      value === "benevole"
    ) {
      return "Bénévole indépendant";
    }

    if (
      value === "admin"
    ) {
      return "Administrateur";
    }

    return "Adoptant";
  }

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  if (loading) {
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

        {/* =====================================================
            RETOUR
        ====================================================== */}

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

        {/* =====================================================
            HEADER
        ====================================================== */}

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
            </div>
          </div>

          <select
            value={filter}
            onChange={(
              event
            ) =>
              setFilter(
                event.target
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

        {/* =====================================================
            COMPTEURS
        ====================================================== */}

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

        {/* =====================================================
            UTILISATEURS
        ====================================================== */}

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
              (user) => {
                const status =
                  normalizeStatus(
                    user.approval_status
                  );

                const isProcessing =
                  actionId ===
                  user.id;

                return (
                  <article
                    key={
                      user.id
                    }
                    className={`flex flex-col justify-between gap-6 rounded-3xl border p-6 shadow-sm transition md:flex-row md:items-center ${
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
                    {/* INFORMATIONS */}

                    <div>
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
                      </div>

                      <p className="mt-1 text-gray-500">
                        {user.email ||
                          "Email non renseigné"}
                      </p>

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

                      {status ===
                      "approved" ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-800">
                          <ShieldCheck
                            size={16}
                          />

                          Compte vérifié et actif
                        </div>
                      ) : status ===
                        "suspended" ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-800">
                          <CirclePause
                            size={16}
                          />

                          Compte temporairement suspendu
                        </div>
                      ) : status ===
                        "rejected" ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700">
                          <X
                            size={16}
                          />

                          Compte refusé
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
                          Vérification administrative à effectuer
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
                              size={
                                18
                              }
                            />

                            {isProcessing
                              ? "Traitement..."
                              : "Valider"}
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
                              size={
                                18
                              }
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
                              size={
                                18
                              }
                            />

                            Compte validé
                          </div>

                          {user.role !==
                            "admin" && (
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
                                size={
                                  18
                                }
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
                              size={
                                18
                              }
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
                              size={
                                18
                              }
                            />

                            Réactiver
                          </button>
                        </>
                      )}
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
    status === "approved"
  ) {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
        ✓ Validé
      </span>
    );
  }

  if (
    status === "rejected"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        ✕ Refusé
      </span>
    );
  }

  if (
    status === "suspended"
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
  label: string;
  value: number;

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