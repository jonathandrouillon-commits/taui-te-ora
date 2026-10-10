
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Member = {
  association_id: string;
  member_role: string;
  status: string;
};

type Association = {
  id: string;
  name: string;
};

type Log = {
  id: string;
  association_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, unknown> | null;
  created_at: string;
};

type Actor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

const FIELDS: Record<string, string> = {
  animal_name: "Nom de l'animal",
  animal_type: "Type",
  age_label: "Âge",
  sex: "Sexe",
  city: "Commune",
  island: "Île",
  status: "Statut",
  is_published: "Publication",
  is_adopted: "Adoption",
  association_name: "Nom affiché de l'association",
  name: "Nom de l'association",
  description: "Description",
  phone: "Téléphone",
  email: "E-mail",
  website: "Site internet",
  logo_url: "Logo",
  is_active: "Association active",
  photo_url: "Photo",
  media_url: "Média",
  media_type: "Type de média",
  is_cover: "Photo principale",
  sort_order: "Ordre d'affichage",
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  if (typeof value === "string") {
    return value.length > 180
      ? `${value.slice(0, 180)}…`
      : value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "Valeur modifiée";
}

function actionLabel(log: Log): string {
  const kind =
    log.entity_type === "animal"
      ? "Fiche animale"
      : log.entity_type === "media"
        ? "Photo / vidéo"
        : "Association";

  const action =
    log.action === "created"
      ? "créée"
      : log.action === "deleted"
        ? "supprimée"
        : "modifiée";

  return `${kind} ${action}`;
}

export default function AssociationHistoriquePage() {
  const searchParams = useSearchParams();
  const requestedAssociation = searchParams.get("association");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [associations, setAssociations] = useState<Association[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [associationId, setAssociationId] = useState("all");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!auth.user) {
        throw new Error(
          "Connectez-vous pour consulter l'historique."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role, is_active, approval_status")
          .eq("id", auth.user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.is_active) {
        throw new Error("Ce compte n'est pas actif.");
      }

      const admin = profile.role === "admin";
      setIsAdmin(admin);

      let allowedIds: string[] = [];

      if (!admin) {
        if (profile.approval_status !== "approved") {
          throw new Error(
            "Votre profil professionnel doit être approuvé."
          );
        }

        const { data: memberships, error: memberError } =
          await supabase
            .from("association_members")
            .select("association_id, member_role, status")
            .eq("profile_id", auth.user.id)
            .eq("member_role", "responsable")
            .eq("status", "approved");

        if (memberError) throw memberError;

        allowedIds = ((memberships || []) as Member[]).map(
          (member) => member.association_id
        );

        if (allowedIds.length === 0) {
          throw new Error(
            "Vous n'êtes Responsable d'aucune association officielle."
          );
        }
      }

      let associationsQuery = supabase
        .from("animal_associations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (!admin) {
        associationsQuery = associationsQuery.in("id", allowedIds);
      }

      const {
        data: associationRows,
        error: associationsError,
      } = await associationsQuery;

      if (associationsError) throw associationsError;

      const availableAssociations =
        (associationRows || []) as Association[];

      setAssociations(availableAssociations);

      const selectedAssociation =
        requestedAssociation &&
        availableAssociations.some(
          (association) => association.id === requestedAssociation
        )
          ? requestedAssociation
          : "all";

      if (
        requestedAssociation &&
        selectedAssociation === "all"
      ) {
        throw new Error(
          "Cette association n'est pas accessible avec votre compte."
        );
      }

      setAssociationId(selectedAssociation);

      let logsQuery = supabase
        .from("association_activity_logs")
        .select(
          "id, association_id, actor_id, entity_type, entity_id, action, changes, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(501);

      if (selectedAssociation !== "all") {
        logsQuery = logsQuery.eq(
          "association_id",
          selectedAssociation
        );
      } else if (!admin) {
        logsQuery = logsQuery.in(
          "association_id",
          availableAssociations.map((association) => association.id)
        );
      }

      const { data: logRows, error: logsError } =
        await logsQuery;

      if (logsError) throw logsError;

      const result = (logRows || []) as Log[];

      setHasMore(result.length > 500);
      setLogs(result.slice(0, 500));

      const ids = Array.from(
        new Set(
          result
            .map((log) => log.actor_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (ids.length > 0) {
        const { data: actorRows, error: actorError } =
          await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", ids);

        if (actorError) throw actorError;

        const map: Record<string, string> = {};

        for (const actor of (actorRows || []) as Actor[]) {
          map[actor.id] =
            `${actor.first_name || ""} ${actor.last_name || ""}`.trim() ||
            "Membre";
        }

        setActors(map);
      } else {
        setActors({});
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l'historique."
      );
    } finally {
      setLoading(false);
    }
  }, [requestedAssociation]);

  useEffect(() => {
    void load();
  }, [load]);

  const names = useMemo(
    () =>
      Object.fromEntries(
        associations.map((association) => [
          association.id,
          association.name,
        ])
      ),
    [associations]
  );

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        if (
          associationId !== "all" &&
          log.association_id !== associationId
        ) {
          return false;
        }

        if (
          kind !== "all" &&
          log.entity_type !== kind
        ) {
          return false;
        }

        const haystack = `
          ${names[log.association_id] || ""}
          ${actors[log.actor_id || ""] || ""}
          ${actionLabel(log)}
          ${log.entity_id}
        `.toLocaleLowerCase("fr");

        return haystack.includes(
          search.trim().toLocaleLowerCase("fr")
        );
      }),
    [logs, associationId, kind, search, names, actors]
  );

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-3 py-8 pb-24 text-[#064b42] sm:px-6">
      <section className="mx-auto max-w-6xl">
        <Link
          href={
            isAdmin
              ? "/admin/dashboard"
              : "/association/dashboard"
          }
          className="text-sm font-bold underline underline-offset-4"
        >
          ← Retour au tableau de bord
        </Link>

        <header className="mt-5 rounded-[30px] bg-[#064b42] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f1b4be]">
            TAUI TE ORA · Associations officielles
          </p>

          <h1 className="mt-3 text-2xl font-black sm:text-3xl">
            Historique des modifications
          </h1>

          <p className="mt-2 text-sm text-white/80">
            Retrouvez les interventions sur les fiches animales,
            les photos, les vidéos et les informations des associations.
          </p>

          {associationId !== "all" && names[associationId] && (
            <p className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
              {names[associationId]}
            </p>
          )}
        </header>

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-6">
            Chargement de l'historique…
          </div>
        ) : error ? (
          <div
            className="mt-6 rounded-3xl border border-red-200 bg-white p-6 text-red-700"
            role="alert"
          >
            {error}

            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 font-bold underline"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-[28px] bg-white p-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black">
                  Activité des associations
                </h2>

                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-full bg-[#064b42] px-4 py-2 text-sm font-bold text-white"
                >
                  Actualiser
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-bold">
                  Association

                  <select
                    value={associationId}
                    onChange={(event) =>
                      setAssociationId(event.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-[#eadfce] bg-[#f8f4ec] p-3"
                  >
                    <option value="all">
                      Toutes mes associations
                    </option>

                    {associations.map((association) => (
                      <option
                        key={association.id}
                        value={association.id}
                      >
                        {association.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Type de modification

                  <select
                    value={kind}
                    onChange={(event) =>
                      setKind(event.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-[#eadfce] bg-[#f8f4ec] p-3"
                  >
                    <option value="all">
                      Tous les types
                    </option>
                    <option value="animal">
                      Fiches animales
                    </option>
                    <option value="media">
                      Photos et vidéos
                    </option>
                    <option value="association">
                      Associations
                    </option>
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Rechercher

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Association, personne, identifiant…"
                    className="mt-1 w-full rounded-xl border border-[#eadfce] bg-[#f8f4ec] p-3"
                  />
                </label>
              </div>

              <p className="mt-3 text-xs text-[#6f5a47]">
                {filtered.length} événement(s) affiché(s).
                Les événements antérieurs à l'installation
                du journal ne sont pas disponibles.
              </p>

              {hasMore && (
                <p className="mt-2 text-xs font-bold text-[#9b641e]">
                  Affichage limité aux 500 événements les plus
                  récents. Une pagination sera ajoutée si nécessaire.
                </p>
              )}
            </section>

            <div className="mt-5 space-y-4">
              {filtered.length === 0 ? (
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                  Aucune modification à afficher pour ces critères.
                </div>
              ) : (
                filtered.map((log) => {
                  const changes = Object.entries(
                    log.changes || {}
                  ).filter(
                    ([key, value]) =>
                      key !== "animal_id" &&
                      key !== "source_table" &&
                      value !== null &&
                      typeof value === "object" &&
                      !Array.isArray(value)
                  );

                  return (
                    <article
                      key={log.id}
                      className="rounded-[26px] border border-[#eadfce] bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-[#df8995]">
                            {names[log.association_id] ||
                              "Association"}
                          </p>

                          <h3 className="mt-1 text-lg font-black">
                            {actionLabel(log)}
                          </h3>

                          <p className="mt-1 text-sm text-[#6f5a47]">
                            Par{" "}
                            {log.actor_id
                              ? actors[log.actor_id] ||
                                "Auteur non accessible"
                              : "Opération serveur / auteur non identifié"}
                          </p>
                        </div>

                        <time
                          className="text-xs font-bold text-[#6f5a47]"
                          dateTime={log.created_at}
                        >
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Pacific/Tahiti",
                          }).format(new Date(log.created_at))}
                        </time>
                      </div>

                      {log.entity_type === "animal" && (
                        <Link
                          className="mt-2 inline-block text-sm font-bold underline"
                          href={`/animal/${log.entity_id}`}
                        >
                          Voir la fiche animale
                        </Link>
                      )}

                      {changes.length > 0 && (
                        <div className="mt-4 overflow-x-auto rounded-2xl bg-[#f8f4ec] p-3">
                          <table className="w-full min-w-[380px] text-left text-sm">
                            <thead>
                              <tr className="text-[#6f5a47]">
                                <th className="p-2">Champ</th>
                                <th className="p-2">Avant</th>
                                <th className="p-2">Après</th>
                              </tr>
                            </thead>

                            <tbody>
                              {changes.map(([field, value]) => {
                                const diff = value as {
                                  before?: unknown;
                                  after?: unknown;
                                };

                                return (
                                  <tr
                                    key={field}
                                    className="border-t border-[#eadfce]"
                                  >
                                    <td className="p-2 font-bold">
                                      {FIELDS[field] || field}
                                    </td>
                                    <td className="break-all p-2">
                                      {displayValue(diff.before)}
                                    </td>
                                    <td className="break-all p-2">
                                      {displayValue(diff.after)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
