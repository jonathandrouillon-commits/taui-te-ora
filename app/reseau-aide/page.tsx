"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  Search,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Helper = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  island: string | null;
  city: string | null;
  help_foster: boolean;
  help_transport: boolean;
  help_capture: boolean;
  help_food_material: boolean;
  help_vet: boolean;
  help_volunteer: boolean;
  help_notes: string | null;
  help_updated_at: string | null;
};

type HelpFilter =
  | "all"
  | "help_foster"
  | "help_transport"
  | "help_capture"
  | "help_food_material"
  | "help_vet"
  | "help_volunteer";

const HELP_FILTERS: Array<{
  key: HelpFilter;
  label: string;
  icon: string;
}> = [
  { key: "all", label: "Tous", icon: "🤝" },
  { key: "help_foster", label: "Famille d’accueil", icon: "🏠" },
  { key: "help_transport", label: "Transport", icon: "🚗" },
  { key: "help_capture", label: "Capture", icon: "🛟" },
  { key: "help_food_material", label: "Nourriture / matériel", icon: "🥣" },
  { key: "help_vet", label: "Vétérinaire", icon: "🩺" },
  { key: "help_volunteer", label: "Bénévolat", icon: "🐾" },
];

function displayName(helper: Helper) {
  const value = [helper.first_name, helper.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return value || "Bénévole";
}

export default function HelpNetworkPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [search, setSearch] = useState("");
  const [island, setIsland] = useState("");
  const [city, setCity] = useState("");
  const [helpFilter, setHelpFilter] = useState<HelpFilter>("all");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/reseau-aide");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const role = String(profile?.role || "")
        .trim()
        .toLowerCase();

      if (!["admin", "administrateur", "association", "refuge", "fourriere", "benevole"].includes(role)) {
        router.replace("/");
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "get_help_network"
      );

      if (rpcError) throw rpcError;

      setHelpers((data || []) as Helper[]);
    } catch (caught) {
      console.error("Chargement réseau d’aide :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger le réseau d’aide."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void load();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [load]);

  const islands = useMemo(
    () =>
      Array.from(
        new Set(
          helpers
            .map((item) => String(item.island || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [helpers]
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          helpers
            .filter(
              (item) =>
                !island ||
                String(item.island || "").trim() === island
            )
            .map((item) => String(item.city || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [helpers, island]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return helpers.filter((helper) => {
      if (
        island &&
        String(helper.island || "").trim() !== island
      ) {
        return false;
      }

      if (
        city &&
        String(helper.city || "").trim() !== city
      ) {
        return false;
      }

      if (
        helpFilter !== "all" &&
        !helper[helpFilter]
      ) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        helper.first_name,
        helper.last_name,
        helper.island,
        helper.city,
        helper.help_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [helpers, search, island, city, helpFilter]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">
          Chargement du réseau d’aide...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-28 pt-24 sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[30px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e7f3ef] text-[#064b42]">
                <HeartHandshake size={30} />
              </div>

              <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
                TAUI TE ORA
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#064b42] sm:text-4xl">
                Réseau d’aide
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d67]">
                Retrouvez les personnes qui ont choisi de se rendre disponibles pour aider les animaux.
                Les coordonnées sont réservées aux associations et à l’administration.
              </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/sos-aide")}
              className="flex items-center justify-center gap-2 rounded-full bg-[#df8995] px-6 py-3 font-black text-white shadow-md"
            >
              🚨 Créer / gérer un SOS
            </button>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un nom, une commune..."
                className="w-full rounded-2xl border border-[#e5ddd5] bg-white py-3 pl-11 pr-4 outline-none focus:border-[#064b42]"
              />
            </div>

            <select
              value={island}
              onChange={(event) => {
                setIsland(event.target.value);
                setCity("");
              }}
              className="rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
            >
              <option value="">Toutes les îles</option>
              {islands.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
            >
              <option value="">Toutes les communes</option>
              {cities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {HELP_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setHelpFilter(filter.key)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  helpFilter === filter.key
                    ? "bg-[#064b42] text-white"
                    : "bg-[#f8f4ec] text-[#064b42]"
                }`}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="font-black text-[#064b42]">
            {filtered.length} personne{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
          </p>

          <div className="flex items-center gap-2 text-xs font-bold text-[#756d67]">
            <ShieldCheck size={16} />
            Accès privé
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-5 rounded-[26px] bg-white p-8 text-center shadow-sm">
            <p className="font-black text-[#064b42]">
              Aucun bénévole ne correspond à ces filtres.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((helper) => {
              const badges = HELP_FILTERS
                .filter(
                  (filter) =>
                    filter.key !== "all" &&
                    helper[filter.key]
                );

              return (
                <article
                  key={helper.id}
                  className="rounded-[26px] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-[#064b42]">
                        {displayName(helper)}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#756d67]">
                        <MapPin size={16} />
                        <span>
                          {[helper.city, helper.island]
                            .filter(Boolean)
                            .join(" · ") || "Localisation non renseignée"}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-xs font-black text-[#064b42]">
                      Disponible
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <span
                        key={badge.key}
                        className="rounded-full bg-[#f8f4ec] px-3 py-2 text-xs font-black text-[#5f554d]"
                      >
                        {badge.icon} {badge.label}
                      </span>
                    ))}
                  </div>

                  {helper.help_notes ? (
                    <p className="mt-4 rounded-2xl bg-[#fffaf5] p-4 text-sm leading-6 text-[#6f665f]">
                      {helper.help_notes}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {helper.phone ? (
                      <a
                        href={`tel:${helper.phone}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 text-sm font-black text-white"
                      >
                        <Phone size={16} />
                        Appeler
                      </a>
                    ) : null}

                    {helper.email ? (
                      <a
                        href={`mailto:${helper.email}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42]"
                      >
                        <Mail size={16} />
                        Email
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
