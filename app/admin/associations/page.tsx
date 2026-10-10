
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  Ban,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type Association = {
  id: string;
  name: string;
  island: string;
  city: string | null;
  is_active: boolean;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string | null;
  approval_status: string | null;
  is_active: boolean;
};

type Member = {
  id: string;
  association_id: string;
  profile_id: string;
  member_role: "responsable" | "gestionnaire" | "benevole";
  status: "pending" | "approved" | "rejected" | "revoked";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

type ApiData = {
  associations: Association[];
  profiles: Profile[];
  members: Member[];
};

const ROLE_LABELS = {
  responsable: "Responsable",
  gestionnaire: "Gestionnaire",
  benevole: "Bénévole",
};

const STATUS_LABELS = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  revoked: "Révoqué",
};

function getProfileName(profile?: Profile) {
  if (!profile) return "Compte inconnu";

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.organization_name || profile.id;
}

export default function AdminAssociationsPage() {
  const [data, setData] = useState<ApiData>({
    associations: [],
    profiles: [],
    members: [],
  });

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [associationId, setAssociationId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [memberRole, setMemberRole] =
    useState<Member["member_role"]>("benevole");

  const [filter, setFilter] = useState("all");

  const apiRequest = useCallback(
    async (
      method: "GET" | "POST" | "PATCH",
      body?: Record<string, string>
    ) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Session expirée. Reconnecte-toi.");
      }

      const response = await fetch("/api/admin/associations", {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue.");
      }

      return result;
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = (await apiRequest("GET")) as ApiData;
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chargement impossible."
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const profileMap = useMemo(
    () => new Map(data.profiles.map((p) => [p.id, p])),
    [data.profiles]
  );

  const associationMap = useMemo(
    () => new Map(data.associations.map((a) => [a.id, a])),
    [data.associations]
  );

  const filteredMembers = useMemo(() => {
    return data.members.filter((member) => {
      if (filter === "all") return true;
      return member.status === filter;
    });
  }, [data.members, filter]);

  const pendingCount = data.members.filter(
    (member) => member.status === "pending"
  ).length;

  const approvedCount = data.members.filter(
    (member) => member.status === "approved"
  ).length;

  async function attachMember() {
    setError("");
    setSuccess("");

    if (!associationId || !profileId) {
      setError("Sélectionne une association et un utilisateur.");
      return;
    }

    setProcessing(true);

    try {
      await apiRequest("POST", {
        action: "attach",
        association_id: associationId,
        profile_id: profileId,
        member_role: memberRole,
      });

      setSuccess("Demande de rattachement créée.");
      setProfileId("");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Rattachement impossible."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function updateMember(
    memberId: string,
    action: "approve" | "reject" | "revoke"
  ) {
    const label =
      action === "approve"
        ? "approuver"
        : action === "reject"
          ? "refuser"
          : "révoquer";

    if (!window.confirm(`Confirmer : ${label} ce rattachement ?`)) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("PATCH", {
        member_id: memberId,
        action,
      });

      setSuccess("Rattachement mis à jour.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Modification impossible."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="rounded-3xl bg-[#064b42] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#f0dba7]">
                <ShieldCheck size={19} />
                ADMINISTRATION TAUI TE ORA
              </div>

              <h1 className="text-3xl font-black">
                Associations officielles
              </h1>

              <p className="mt-2 text-sm text-white/80">
                Gestion des membres et validation des rattachements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading || processing}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#064b42] disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Actualiser
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">
            {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Associations",
              value: data.associations.length,
              icon: Building2,
            },
            {
              title: "Membres approuvés",
              value: approvedCount,
              icon: Users,
            },
            {
              title: "Demandes en attente",
              value: pendingCount,
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm"
              >
                <Icon size={23} className="text-[#064b42]" />
                <p className="mt-3 text-xs font-black uppercase tracking-wider text-[#b68b2f]">
                  {item.title}
                </p>
                <p className="mt-2 text-4xl font-black text-[#064b42]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <UserPlus className="text-[#064b42]" size={25} />
            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Rattacher un membre
              </h2>
              <p className="text-sm text-gray-500">
                Le rattachement nécessite une approbation distincte.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase text-gray-500">
                Association officielle
              </span>
              <select
                value={associationId}
                onChange={(event) =>
                  setAssociationId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Choisir une association</option>
                {data.associations
                  .filter((association) => association.is_active)
                  .map((association) => (
                    <option key={association.id} value={association.id}>
                      {association.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-gray-500">
                Compte utilisateur
              </span>
              <select
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Choisir un utilisateur</option>
                {data.profiles
                  .filter((profile) => profile.role !== "admin")
                  .map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {getProfileName(profile)} —{" "}
                      {profile.organization_name || profile.role || "Profil"}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-gray-500">
                Rôle dans l'association
              </span>
              <select
                value={memberRole}
                onChange={(event) =>
                  setMemberRole(
                    event.target.value as Member["member_role"]
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="responsable">Responsable</option>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="benevole">Bénévole</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void attachMember()}
            disabled={processing || loading}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white disabled:opacity-50"
          >
            <UserPlus size={19} />
            Créer le rattachement
          </button>
        </section>

        <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Membres et validations
              </h2>
              <p className="text-sm text-gray-500">
                Chaque association peut avoir plusieurs membres.
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Refusés</option>
              <option value="revoked">Révoqués</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Chargement des rattachements...
            </p>
          ) : filteredMembers.length === 0 ? (
            <p className="rounded-2xl bg-[#f4eee3] p-6 text-center text-gray-600">
              Aucun rattachement pour ce filtre.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => {
                const profile = profileMap.get(member.profile_id);
                const association = associationMap.get(
                  member.association_id
                );

                return (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-[#eadfce] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-black text-[#064b42]">
                          {getProfileName(profile)}
                        </h3>

                        <p className="text-sm text-gray-700">
                          {association?.name || "Association inconnue"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {ROLE_LABELS[member.member_role]} ·{" "}
                          {profile?.approval_status || "Statut inconnu"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-black ${
                            member.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : member.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_LABELS[member.status]}
                        </span>

                        {member.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                void updateMember(member.id, "approve")
                              }
                              className="flex items-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                            >
                              <Check size={17} />
                              Approuver
                            </button>

                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                void updateMember(member.id, "reject")
                              }
                              className="flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-50"
                            >
                              <X size={17} />
                              Refuser
                            </button>
                          </>
                        )}

                        {member.status === "approved" && (
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                              void updateMember(member.id, "revoke")
                            }
                            className="flex items-center gap-2 rounded-xl bg-orange-100 px-4 py-3 text-sm font-bold text-orange-800 disabled:opacity-50"
                          >
                            <Ban size={17} />
                            Révoquer
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-gray-500">
          Les rattachements sont administratifs. Ils ne modifient pas
          automatiquement les droits de publication des animaux.
        </p>
      </div>
    </main>
  );
}
