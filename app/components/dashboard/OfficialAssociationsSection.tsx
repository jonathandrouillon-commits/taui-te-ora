
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import CollapsibleDashboardSection from "./CollapsibleDashboardSection";

type Membership = {
  association_id: string;
  member_role: string;
  status: string;
};

type Association = {
  id: string;
  name: string;
  island: string | null;
  city: string | null;
  is_active: boolean;
};

type AssociationAccess = Association & {
  memberRole: string;
};

const ROLE_LABELS: Record<string, string> = {
  responsable: "Responsable",
  gestionnaire: "Gestionnaire",
  benevole: "Bénévole",
  admin: "Administrateur",
};

export default function OfficialAssociationsSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [associations, setAssociations] = useState<
    AssociationAccess[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (!cancelled) setAssociations([]);
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role, is_active, approval_status")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || profile.is_active !== true) {
          if (!cancelled) setAssociations([]);
          return;
        }

        const isAdmin = profile.role === "admin";

        const approvalStatus = String(
          profile.approval_status || ""
        ).toLowerCase();

        if (
          approvalStatus === "rejected" ||
          approvalStatus === "suspended"
        ) {
          if (!cancelled) setAssociations([]);
          return;
        }

        let membershipRows: Membership[] = [];

        if (!isAdmin) {
          const { data, error: memberError } =
            await supabase
              .from("association_members")
              .select(
                "association_id, member_role, status"
              )
              .eq("profile_id", user.id)
              .eq("status", "approved");

          if (memberError) throw memberError;

          membershipRows = (data || []) as Membership[];

          if (membershipRows.length === 0) {
            if (!cancelled) setAssociations([]);
            return;
          }
        }

        let query = supabase
          .from("animal_associations")
          .select(
            "id, name, island, city, is_active"
          )
          .eq("is_active", true)
          .order("name");

        if (!isAdmin) {
          query = query.in(
            "id",
            membershipRows.map(
              (member) => member.association_id
            )
          );
        }

        const {
          data,
          error: associationError,
        } = await query;

        if (associationError) {
          throw associationError;
        }

        const rows = (data || []) as Association[];

        const result: AssociationAccess[] =
          rows.flatMap((association) => {
            if (isAdmin) {
              return [
                {
                  ...association,
                  memberRole: "admin",
                },
              ];
            }

            const membership = membershipRows.find(
              (member) =>
                member.association_id === association.id
            );

            if (!membership) return [];

            return [
              {
                ...association,
                memberRole: membership.member_role,
              },
            ];
          });

        if (!cancelled) {
          setAssociations(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les associations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (
    !loading &&
    !error &&
    associations.length === 0
  ) {
    return null;
  }

  return (
    <CollapsibleDashboardSection
      title="Mes associations officielles"
      subtitle="Mes rattachements et mes droits de gestion."
      icon="🤝"
      defaultOpen
    >
      {loading ? (
        <p className="text-sm text-[#6f5a47]">
          Chargement des associations...
        </p>
      ) : error ? (
        <p
          role="alert"
          className="text-sm text-red-700"
        >
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {associations.map((association) => {
            const canManage =
              association.memberRole ===
                "responsable" ||
              association.memberRole ===
                "gestionnaire" ||
              association.memberRole === "admin";

            const canViewHistory =
              association.memberRole ===
                "responsable" ||
              association.memberRole === "admin";

            return (
              <article
                key={association.id}
                className="rounded-[24px] border border-[#eadfce] bg-[#f8f4ec] p-5"
              >
                <h3 className="text-lg font-black text-[#064b42]">
                  {association.name}
                </h3>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  {[
                    association.city,
                    association.island,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-[#e8f5f1] px-3 py-1 text-xs font-black text-[#064b42]">
                  {ROLE_LABELS[
                    association.memberRole
                  ] || association.memberRole}
                </span>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/association/animals"
                    className="rounded-full bg-[#064b42] px-4 py-2.5 text-sm font-black text-white"
                  >
                    🐾 Voir les animaux
                  </Link>

                  {canManage && (
                    <Link
                      href="/association/add-animal"
                      className="rounded-full bg-[#df8995] px-4 py-2.5 text-sm font-black text-white"
                    >
                      + Déposer un animal
                    </Link>
                  )}

                  {canViewHistory && (
                    <Link
                      href={`/association/historique?association=${encodeURIComponent(
                        association.id
                      )}`}
                      className="rounded-full border border-[#064b42] bg-white px-4 py-2.5 text-sm font-black text-[#064b42]"
                    >
                      📋 Historique
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CollapsibleDashboardSection>
  );
}
