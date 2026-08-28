"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type HelpType =
  | "famille_accueil"
  | "transport"
  | "capture"
  | "nourriture_materiel"
  | "veterinaire"
  | "benevolat";

type Urgency = "normale" | "urgente" | "critique";
type SosStatus = "ouvert" | "en_cours" | "cloture";

type HelpSos = {
  id: string;
  created_by: string;
  title: string;
  help_type: HelpType;
  island: string;
  city: string | null;
  message: string;
  urgency: Urgency;
  status: SosStatus;
  animal_id: string | null;
  animal_type?: string | null;
  animals_count?: number | null;
  push_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type MatchingHelper = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  organization_name?: string | null;
  phone?: string | null;
  email?: string | null;
  island?: string | null;
  city?: string | null;
  help_notes?: string | null;
  foster_capacity?: number | null;
  foster_duration?: string | null;
  foster_accepts_dogs?: boolean | null;
  foster_accepts_cats?: boolean | null;
  help_has_transport?: boolean | null;
};

const HELP_TYPES: Array<{
  value: HelpType;
  label: string;
  icon: string;
}> = [
  { value: "famille_accueil", label: "Famille d’accueil", icon: "🏠" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "capture", label: "Capture / sauvetage", icon: "🛟" },
  { value: "nourriture_materiel", label: "Nourriture / matériel", icon: "🥣" },
  { value: "veterinaire", label: "Accompagnement vétérinaire", icon: "🩺" },
  { value: "benevolat", label: "Bénévolat", icon: "🤝" },
];

const EMPTY_FORM = {
  title: "",
  help_type: "famille_accueil" as HelpType,
  island: "",
  city: "",
  message: "",
  urgency: "urgente" as Urgency,
};

function helpTypeLabel(value: HelpType) {
  return HELP_TYPES.find((item) => item.value === value)?.label || value;
}

function helpTypeIcon(value: HelpType) {
  return HELP_TYPES.find((item) => item.value === value)?.icon || "🤝";
}

function urgencyClasses(value: Urgency) {
  if (value === "critique") return "bg-red-100 text-red-700";
  if (value === "urgente") return "bg-amber-100 text-amber-800";
  return "bg-[#e7f3ef] text-[#064b42]";
}

function statusLabel(value: SosStatus) {
  if (value === "en_cours") return "En cours";
  if (value === "cloture") return "Clôturé";
  return "Ouvert";
}

export default function HelpSosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sosList, setSosList] = useState<HelpSos[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SosStatus>("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchingHelpers, setMatchingHelpers] = useState<Record<string, MatchingHelper[]>>({});
  const [matchingLoading, setMatchingLoading] = useState<Record<string, boolean>>({});
  const [expandedMatching, setExpandedMatching] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<Record<string, boolean>>({});
  const [notificationResults, setNotificationResults] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/sos-aide");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const role = String(profile?.role || "").trim().toLowerCase();

      if (!["admin", "administrateur", "association", "refuge", "fourriere", "benevole"].includes(role)) {
        router.replace("/");
        return;
      }

      setIsAdmin(role === "admin" || role === "administrateur");

      const { data, error: listError } = await supabase
        .from("help_sos")
        .select(
          "id, created_by, title, help_type, island, city, message, urgency, status, animal_id, animal_type, animals_count, push_sent_at, created_at, updated_at, closed_at"
        )
        .order("created_at", { ascending: false });

      if (listError) throw listError;

      setSosList((data || []) as HelpSos[]);
    } catch (caught) {
      console.error("Chargement SOS aide :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger les SOS."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createSos(event: FormEvent) {
    event.preventDefault();

    if (!currentUserId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        throw new Error("Indiquez un titre.");
      }

      if (!form.island.trim()) {
        throw new Error("Indiquez l’île concernée.");
      }

      if (!form.message.trim()) {
        throw new Error("Décrivez le besoin.");
      }

      const { error: insertError } = await supabase
        .from("help_sos")
        .insert({
          created_by: currentUserId,
          title: form.title.trim(),
          help_type: form.help_type,
          island: form.island.trim(),
          city: form.city.trim() || null,
          message: form.message.trim(),
          urgency: form.urgency,
          status: "ouvert",
        });

      if (insertError) throw insertError;

      setForm(EMPTY_FORM);
      setCreating(false);
      setMessage("SOS créé. Il est maintenant visible dans le réseau d’aide.");
      await load();
    } catch (caught) {
      console.error("Création SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de créer le SOS."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: HelpSos, status: SosStatus) {
    try {
      setError("");
      setMessage("");

      const { error: updateError } = await supabase
        .from("help_sos")
        .update({ status })
        .eq("id", item.id);

      if (updateError) throw updateError;

      setMessage(
        status === "cloture"
          ? "SOS clôturé."
          : status === "en_cours"
            ? "SOS passé en cours."
            : "SOS rouvert."
      );

      await load();
    } catch (caught) {
      console.error("Mise à jour SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de mettre à jour le SOS."
      );
    }
  }

  async function loadMatchingHelpers(item: HelpSos) {
    if (expandedMatching === item.id) {
      setExpandedMatching(null);
      return;
    }

    setExpandedMatching(item.id);

    if (matchingHelpers[item.id]) return;

    try {
      setMatchingLoading((current) => ({ ...current, [item.id]: true }));
      setError("");

      const { data, error: matchingError } = await supabase.rpc(
        "get_matching_helpers_for_sos",
        { p_sos_id: item.id }
      );

      if (matchingError) throw matchingError;

      setMatchingHelpers((current) => ({
        ...current,
        [item.id]: (data || []) as MatchingHelper[],
      }));
    } catch (caught) {
      console.error("Matching SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de rechercher les personnes compatibles."
      );
    } finally {
      setMatchingLoading((current) => ({ ...current, [item.id]: false }));
    }
  }

  async function notifyMatchingHelpers(item: HelpSos) {
    try {
      setNotifying((current) => ({ ...current, [item.id]: true }));
      setError("");
      setMessage("");

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Votre session a expiré. Reconnectez-vous.");
      }

      const response = await fetch("/api/push/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sosId: item.id,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible d’envoyer les notifications SOS."
        );
      }

      let resultMessage = "";

      if (result?.alreadySent) {
        resultMessage = "Les personnes compatibles ont déjà été notifiées.";
      } else if (Number(result?.matched || 0) === 0) {
        resultMessage = "Aucune personne compatible à notifier pour le moment.";
      } else {
        const matched = Number(result?.matched || 0);
        const sent = Number(result?.sent || 0);

        resultMessage =
          `${matched} personne${matched > 1 ? "s" : ""} ciblée${
            matched > 1 ? "s" : ""
          } · ${sent} notification${sent > 1 ? "s" : ""} envoyée${
            sent > 1 ? "s" : ""
          }.`;
      }

      setNotificationResults((current) => ({
        ...current,
        [item.id]: resultMessage,
      }));

      setMessage(resultMessage);
      await load();
    } catch (caught) {
      console.error("Notification SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible d’envoyer les notifications SOS."
      );
    } finally {
      setNotifying((current) => ({ ...current, [item.id]: false }));
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sosList.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        item.title,
        item.island,
        item.city,
        item.message,
        helpTypeLabel(item.help_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [sosList, search, statusFilter]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">Chargement des SOS...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-28 pt-24 sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[30px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <ShieldAlert size={30} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
                  TAUI TE ORA
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#064b42] sm:text-4xl">
                  SOS réseau d’aide
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d67]">
                  Créez un besoin ciblé pour une famille d’accueil, un transport,
                  une capture, du matériel, un accompagnement vétérinaire ou du bénévolat.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#df8995] px-6 py-3 font-black text-white shadow-md"
            >
              <Plus size={19} />
              Créer un SOS
            </button>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un SOS..."
                className="w-full rounded-2xl border border-[#e5ddd5] bg-white py-3 pl-11 pr-4 outline-none focus:border-[#064b42]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | SosStatus)
              }
              className="rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
            >
              <option value="all">Tous les statuts</option>
              <option value="ouvert">Ouverts</option>
              <option value="en_cours">En cours</option>
              <option value="cloture">Clôturés</option>
            </select>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 font-semibold text-green-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {creating ? (
          <section className="mt-6 rounded-[30px] bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#064b42]">
                  Nouveau SOS
                </h2>
                <p className="mt-1 text-sm text-[#756d67]">
                  Après publication, TAUI TE ORA pourra rechercher les personnes compatibles avec ce SOS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4ec] text-[#064b42]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createSos} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Titre *
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ex. Famille d’accueil urgente pour 3 chiots"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Type d’aide *
                  </span>
                  <select
                    value={form.help_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        help_type: event.target.value as HelpType,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 font-bold text-[#064b42]"
                  >
                    {HELP_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Île *
                  </span>
                  <input
                    value={form.island}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        island: event.target.value,
                      }))
                    }
                    placeholder="Ex. Tahiti"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Commune
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="Ex. Punaauia"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Niveau d’urgence
                </span>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(["normale", "urgente", "critique"] as Urgency[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            urgency: value,
                          }))
                        }
                        className={`rounded-2xl border-2 px-4 py-4 font-black capitalize ${
                          form.urgency === value
                            ? value === "critique"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : value === "urgente"
                                ? "border-amber-500 bg-amber-50 text-amber-800"
                                : "border-[#064b42] bg-[#eef7f4] text-[#064b42]"
                            : "border-[#eee5dc] bg-white text-[#756d67]"
                        }`}
                      >
                        {value}
                      </button>
                    )
                  )}
                </div>
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Description du besoin *
                </span>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Décrivez précisément la situation et l’aide recherchée..."
                  className="w-full resize-y rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#064b42] px-7 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "Création..." : "Publier le SOS"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="mt-6 grid gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-[26px] bg-white p-8 text-center shadow-sm">
              <p className="font-black text-[#064b42]">
                Aucun SOS pour le moment.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const canManage =
                isAdmin || item.created_by === currentUserId;

              return (
                <article
                  key={item.id}
                  className="rounded-[26px] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${urgencyClasses(
                            item.urgency
                          )}`}
                        >
                          {item.urgency === "critique"
                            ? "🚨 Critique"
                            : item.urgency === "urgente"
                              ? "⚠️ Urgente"
                              : "ℹ️ Normale"}
                        </span>

                        <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-xs font-black text-[#5f554d]">
                          {helpTypeIcon(item.help_type)}{" "}
                          {helpTypeLabel(item.help_type)}
                        </span>

                        <span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-black text-[#064b42]">
                          {statusLabel(item.status)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-black text-[#064b42]">
                        {item.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#756d67]">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          {[item.city, item.island]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 size={16} />
                          {new Date(item.created_at).toLocaleString("fr-FR")}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5f554d]">
                        {item.message}
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-2">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => void loadMatchingHelpers(item)}
                          disabled={matchingLoading[item.id]}
                          className="rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42] disabled:opacity-60"
                        >
                          {matchingLoading[item.id]
                            ? "Recherche..."
                            : matchingHelpers[item.id]
                              ? `${matchingHelpers[item.id].length} personne${
                                  matchingHelpers[item.id].length > 1 ? "s" : ""
                                } compatible${
                                  matchingHelpers[item.id].length > 1 ? "s" : ""
                                }`
                              : "Voir les personnes compatibles"}
                        </button>
                      ) : null}

                      {canManage && item.status !== "cloture" ? (
                        <button
                          type="button"
                          onClick={() => void notifyMatchingHelpers(item)}
                          disabled={notifying[item.id] || Boolean(item.push_sent_at)}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#df8995] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Bell size={17} />
                          {notifying[item.id]
                            ? "Notification..."
                            : item.push_sent_at
                              ? "Personnes déjà notifiées"
                              : "Notifier les personnes compatibles"}
                        </button>
                      ) : null}

                      {notificationResults[item.id] ? (
                        <p className="rounded-xl bg-green-50 px-3 py-2 text-xs font-bold leading-5 text-green-800">
                          {notificationResults[item.id]}
                        </p>
                      ) : null}

                      {canManage ? (
                      <div className="grid gap-2">
                        {item.status !== "en_cours" && item.status !== "cloture" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "en_cours")
                            }
                            className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800"
                          >
                            Prendre en cours
                          </button>
                        ) : null}

                        {item.status !== "cloture" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "cloture")
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 text-sm font-black text-white"
                          >
                            <CheckCircle2 size={17} />
                            Clôturer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "ouvert")
                            }
                            className="rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42]"
                          >
                            Rouvrir
                          </button>
                        )}
                      </div>
                    ) : null}
                    </div>
                  </div>

                  {expandedMatching === item.id ? (
                    <div className="mt-5 border-t border-[#eee5dc] pt-5">
                      <h3 className="text-lg font-black text-[#064b42]">
                        Personnes compatibles
                      </h3>

                      {matchingLoading[item.id] ? (
                        <p className="mt-3 text-sm font-semibold text-[#756d67]">
                          Recherche des personnes disponibles...
                        </p>
                      ) : (matchingHelpers[item.id] || []).length === 0 ? (
                        <div className="mt-3 rounded-2xl bg-[#fbf7ef] p-4 text-sm font-semibold text-[#756d67]">
                          Aucune personne compatible trouvée pour le moment.
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {(matchingHelpers[item.id] || []).map((helper) => {
                            const name =
                              [helper.first_name, helper.last_name]
                                .filter(Boolean)
                                .join(" ") ||
                              helper.organization_name ||
                              "Membre du réseau";

                            return (
                              <div
                                key={helper.id}
                                className="rounded-2xl bg-[#fbf7ef] p-4"
                              >
                                <p className="font-black text-[#064b42]">
                                  {name}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#756d67]">
                                  {[helper.city, helper.island]
                                    .filter(Boolean)
                                    .join(" · ") || "Localisation non renseignée"}
                                </p>

                                {helper.phone ? (
                                  <a
                                    href={`tel:${helper.phone}`}
                                    className="mt-3 block text-sm font-black text-[#064b42]"
                                  >
                                    📞 {helper.phone}
                                  </a>
                                ) : null}

                                {helper.email ? (
                                  <a
                                    href={`mailto:${helper.email}`}
                                    className="mt-1 block break-all text-sm font-black text-[#064b42]"
                                  >
                                    ✉️ {helper.email}
                                  </a>
                                ) : null}

                                {item.help_type === "famille_accueil" ? (
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                                    {helper.foster_capacity ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        Capacité : {helper.foster_capacity}
                                      </span>
                                    ) : null}
                                    {helper.foster_accepts_dogs ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        🐶 Chiens
                                      </span>
                                    ) : null}
                                    {helper.foster_accepts_cats ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        🐱 Chats
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
