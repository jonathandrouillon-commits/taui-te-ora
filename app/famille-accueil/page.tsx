"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock3,
  HeartHandshake,
  Home,
  MapPin,
  PawPrint,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import HelpNetworkPage from "../reseau-aide/page";
import HelpSosPage from "../sos-aide/page";

type FosterProfile = {
  foster_profile_enabled: boolean;
  foster_accepts_dogs: boolean;
  foster_accepts_cats: boolean;
  foster_accepts_other: boolean;
  foster_capacity: number;
  foster_size_small: boolean;
  foster_size_medium: boolean;
  foster_size_large: boolean;
  foster_age_puppy: boolean;
  foster_age_young: boolean;
  foster_age_adult: boolean;
  foster_age_senior: boolean;
  foster_accepts_male: boolean;
  foster_accepts_female: boolean;
  foster_temperament_calm: boolean;
  foster_temperament_social: boolean;
  foster_temperament_shy: boolean;
  foster_temperament_active: boolean;
  foster_accepts_reactive: boolean;
  foster_accepts_medical: boolean;
  foster_accepts_recovery: boolean;
  foster_accepts_disabled: boolean;
  foster_accepts_special_needs: boolean;
  foster_housing_type: string;
  foster_has_garden: boolean;
  foster_garden_fenced: boolean;
  foster_can_isolate: boolean;
  foster_hours_alone: number | "";
  foster_work_schedule: string;
  foster_presence: string;
  foster_has_children: boolean;
  foster_children_details: string;
  foster_has_dogs: boolean;
  foster_has_cats: boolean;
  foster_current_animals_notes: string;
  foster_experience: string;
  foster_can_medicate: boolean;
  foster_duration_emergency: boolean;
  foster_duration_days: boolean;
  foster_duration_week: boolean;
  foster_duration_weeks: boolean;
  foster_duration_months: boolean;
  foster_duration_until_adoption: boolean;
  foster_conditions: string;
  foster_public_notes: string;
  island: string;
  city: string;
  help_radius_km: number | "";
  help_has_transport: boolean;
};

type StructureOption = {
  id: string;
  type: "association" | "refuge" | "fourriere" | "benevole";
  name: string;
};

type PreferenceRow = {
  structure_type: "association" | "refuge" | "fourriere" | "benevole";
  structure_id: string;
};

const EMPTY_PROFILE: FosterProfile = {
  foster_profile_enabled: false,
  foster_accepts_dogs: false,
  foster_accepts_cats: false,
  foster_accepts_other: false,
  foster_capacity: 1,
  foster_size_small: false,
  foster_size_medium: false,
  foster_size_large: false,
  foster_age_puppy: false,
  foster_age_young: false,
  foster_age_adult: false,
  foster_age_senior: false,
  foster_accepts_male: true,
  foster_accepts_female: true,
  foster_temperament_calm: false,
  foster_temperament_social: false,
  foster_temperament_shy: false,
  foster_temperament_active: false,
  foster_accepts_reactive: false,
  foster_accepts_medical: false,
  foster_accepts_recovery: false,
  foster_accepts_disabled: false,
  foster_accepts_special_needs: false,
  foster_housing_type: "",
  foster_has_garden: false,
  foster_garden_fenced: false,
  foster_can_isolate: false,
  foster_hours_alone: "",
  foster_work_schedule: "",
  foster_presence: "",
  foster_has_children: false,
  foster_children_details: "",
  foster_has_dogs: false,
  foster_has_cats: false,
  foster_current_animals_notes: "",
  foster_experience: "",
  foster_can_medicate: false,
  foster_duration_emergency: false,
  foster_duration_days: false,
  foster_duration_week: false,
  foster_duration_weeks: false,
  foster_duration_months: false,
  foster_duration_until_adoption: false,
  foster_conditions: "",
  foster_public_notes: "",
  island: "",
  city: "",
  help_radius_km: 10,
  help_has_transport: false,
};

function nameFromRow(row: Record<string, unknown>, fallback: string) {
  const candidates = [
    row.name,
    row.association_name,
    row.refuge_name,
    row.organization_name,
    row.display_name,
    row.nom,
    row.title,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function prefKey(type: string, id: string) {
  return `${type}:${id}`;
}

function structureTypeLabel(
  type: StructureOption["type"]
) {
  switch (type) {
    case "association":
      return "Association";
    case "refuge":
      return "Refuge";
    case "fourriere":
      return "Fourrière";
    case "benevole":
      return "Bénévole";
    default:
      return type;
  }
}

type HelpWorkspaceTab = "fa" | "network" | "sos";

const HELP_NETWORK_ROLES = [
  "admin",
  "administrateur",
  "association",
  "refuge",
  "fourriere",
  "benevole",
];

export default function FamilleAccueilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FosterProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [structures, setStructures] = useState<StructureOption[]>([]);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [noPreference, setNoPreference] = useState(true);
  const [structureSearch, setStructureSearch] = useState("");
  const [activeTab, setActiveTab] = useState<HelpWorkspaceTab>("fa");
  const [currentRole, setCurrentRole] = useState("");

  useEffect(() => {
    let active = true;

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
          router.replace(
            "/login?redirect=" + encodeURIComponent("/famille-accueil")
          );
          return;
        }

        const [profileResult, prefResult, structureResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select(`
                role,
                foster_profile_enabled,
                foster_accepts_dogs,
                foster_accepts_cats,
                foster_accepts_other,
                foster_capacity,
                foster_size_small,
                foster_size_medium,
                foster_size_large,
                foster_age_puppy,
                foster_age_young,
                foster_age_adult,
                foster_age_senior,
                foster_accepts_male,
                foster_accepts_female,
                foster_temperament_calm,
                foster_temperament_social,
                foster_temperament_shy,
                foster_temperament_active,
                foster_accepts_reactive,
                foster_accepts_medical,
                foster_accepts_recovery,
                foster_accepts_disabled,
                foster_accepts_special_needs,
                foster_housing_type,
                foster_has_garden,
                foster_garden_fenced,
                foster_can_isolate,
                foster_hours_alone,
                foster_work_schedule,
                foster_presence,
                foster_has_children,
                foster_children_details,
                foster_has_dogs,
                foster_has_cats,
                foster_current_animals_notes,
                foster_experience,
                foster_can_medicate,
                foster_duration_emergency,
                foster_duration_days,
                foster_duration_week,
                foster_duration_weeks,
                foster_duration_months,
                foster_duration_until_adoption,
                foster_conditions,
                foster_public_notes,
                island,
                city,
                help_radius_km,
                help_has_transport
              `)
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("foster_structure_preferences")
              .select("structure_type, structure_id")
              .eq("foster_user_id", user.id),

            supabase
              .from("public_structure_profiles")
              .select(`
                id,
                organization_name,
                avatar_url,
                role,
                first_name,
                last_name
              `),
          ]);

        if (profileResult.error) throw profileResult.error;
        if (prefResult.error) throw prefResult.error;
        if (!active) return;

        const d = profileResult.data;

        if (d) {
          setCurrentRole(
            String(d.role || "")
              .trim()
              .toLowerCase()
          );
          setProfile({
            foster_profile_enabled: Boolean(d.foster_profile_enabled),
            foster_accepts_dogs: Boolean(d.foster_accepts_dogs),
            foster_accepts_cats: Boolean(d.foster_accepts_cats),
            foster_accepts_other: Boolean(d.foster_accepts_other),
            foster_capacity: Math.max(1, Number(d.foster_capacity || 1)),
            foster_size_small: Boolean(d.foster_size_small),
            foster_size_medium: Boolean(d.foster_size_medium),
            foster_size_large: Boolean(d.foster_size_large),
            foster_age_puppy: Boolean(d.foster_age_puppy),
            foster_age_young: Boolean(d.foster_age_young),
            foster_age_adult: Boolean(d.foster_age_adult),
            foster_age_senior: Boolean(d.foster_age_senior),
            foster_accepts_male: d.foster_accepts_male ?? true,
            foster_accepts_female: d.foster_accepts_female ?? true,
            foster_temperament_calm: Boolean(d.foster_temperament_calm),
            foster_temperament_social: Boolean(d.foster_temperament_social),
            foster_temperament_shy: Boolean(d.foster_temperament_shy),
            foster_temperament_active: Boolean(d.foster_temperament_active),
            foster_accepts_reactive: Boolean(d.foster_accepts_reactive),
            foster_accepts_medical: Boolean(d.foster_accepts_medical),
            foster_accepts_recovery: Boolean(d.foster_accepts_recovery),
            foster_accepts_disabled: Boolean(d.foster_accepts_disabled),
            foster_accepts_special_needs: Boolean(d.foster_accepts_special_needs),
            foster_housing_type: String(d.foster_housing_type || ""),
            foster_has_garden: Boolean(d.foster_has_garden),
            foster_garden_fenced: Boolean(d.foster_garden_fenced),
            foster_can_isolate: Boolean(d.foster_can_isolate),
            foster_hours_alone:
              d.foster_hours_alone == null ? "" : Number(d.foster_hours_alone),
            foster_work_schedule: String(d.foster_work_schedule || ""),
            foster_presence: String(d.foster_presence || ""),
            foster_has_children: Boolean(d.foster_has_children),
            foster_children_details: String(d.foster_children_details || ""),
            foster_has_dogs: Boolean(d.foster_has_dogs),
            foster_has_cats: Boolean(d.foster_has_cats),
            foster_current_animals_notes: String(d.foster_current_animals_notes || ""),
            foster_experience: String(d.foster_experience || ""),
            foster_can_medicate: Boolean(d.foster_can_medicate),
            foster_duration_emergency: Boolean(d.foster_duration_emergency),
            foster_duration_days: Boolean(d.foster_duration_days),
            foster_duration_week: Boolean(d.foster_duration_week),
            foster_duration_weeks: Boolean(d.foster_duration_weeks),
            foster_duration_months: Boolean(d.foster_duration_months),
            foster_duration_until_adoption: Boolean(d.foster_duration_until_adoption),
            foster_conditions: String(d.foster_conditions || ""),
            foster_public_notes: String(d.foster_public_notes || ""),
            island: String(d.island || ""),
            city: String(d.city || ""),
            help_radius_km:
              d.help_radius_km == null ? "" : Number(d.help_radius_km),
            help_has_transport: Boolean(d.help_has_transport),
          });
        }

        const prefs = (prefResult.data || []) as PreferenceRow[];
        const keys = prefs.map((p) => prefKey(p.structure_type, p.structure_id));
        setSelectedPrefs(keys);
        setNoPreference(keys.length === 0);

        const options: StructureOption[] = [];

        if (structureResult.error) {
          console.error(
            "Chargement des profils structures / bénévoles :",
            structureResult.error
          );
        } else {
          for (const raw of structureResult.data || []) {
            const row = raw as Record<string, unknown>;
            const id = String(row.id || "").trim();
            const role = String(row.role || "")
              .trim()
              .toLowerCase();

            if (!id) continue;

            if (
              role !== "association" &&
              role !== "refuge" &&
              role !== "fourriere" &&
              role !== "benevole"
            ) {
              continue;
            }

            const firstName = String(row.first_name || "").trim();
            const lastName = String(row.last_name || "").trim();
            const personName = [firstName, lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            const organizationName = String(
              row.organization_name || ""
            ).trim();

            const fallbackName =
              role === "association"
                ? "Association"
                : role === "refuge"
                  ? "Refuge"
                  : role === "fourriere"
                    ? "Fourrière"
                    : "Bénévole";

            options.push({
              id,
              type: role as StructureOption["type"],
              name:
                organizationName ||
                personName ||
                nameFromRow(row, fallbackName),
            });
          }
        }

        options.sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
        );
        setStructures(options);
      } catch (cause) {
        console.error("Chargement Famille d'accueil :", cause);
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger votre fiche."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const filteredStructures = useMemo(() => {
    const q = structureSearch.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter((item) =>
      `${item.name} ${structureTypeLabel(item.type)}`.toLowerCase().includes(q)
    );
  }, [structureSearch, structures]);

  function update<K extends keyof FosterProfile>(
    key: K,
    value: FosterProfile[K]
  ) {
    setProfile((previous) => ({ ...previous, [key]: value }));
  }

  function togglePreference(item: StructureOption) {
    const key = prefKey(item.type, item.id);
    setSelectedPrefs((previous) => {
      if (previous.includes(key)) {
        const next = previous.filter((value) => value !== key);
        if (next.length === 0) setNoPreference(true);
        return next;
      }
      setNoPreference(false);
      return [...previous, key];
    });
  }

  function setWithoutPreference() {
    setNoPreference(true);
    setSelectedPrefs([]);
  }

  function legacyDuration() {
    const values: string[] = [];
    if (profile.foster_duration_emergency) values.push("Urgence 24/48h");
    if (profile.foster_duration_days) values.push("Quelques jours");
    if (profile.foster_duration_week) values.push("Une semaine");
    if (profile.foster_duration_weeks) values.push("Plusieurs semaines");
    if (profile.foster_duration_months) values.push("Plusieurs mois");
    if (profile.foster_duration_until_adoption) values.push("Jusqu'à adoption");
    return values.join(", ");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Connexion requise.");

      if (profile.foster_profile_enabled) {
        if (!profile.island.trim()) {
          throw new Error("Indiquez votre île.");
        }

        if (
          !profile.foster_accepts_dogs &&
          !profile.foster_accepts_cats &&
          !profile.foster_accepts_other
        ) {
          throw new Error(
            "Choisissez au moins un type d'animal que vous pouvez accueillir."
          );
        }

        const hasDuration =
          profile.foster_duration_emergency ||
          profile.foster_duration_days ||
          profile.foster_duration_week ||
          profile.foster_duration_weeks ||
          profile.foster_duration_months ||
          profile.foster_duration_until_adoption;

        if (!hasDuration) {
          throw new Error("Choisissez au moins une durée d'accueil.");
        }
      }

      const updatePayload = {
        foster_profile_enabled: profile.foster_profile_enabled,
        help_foster: profile.foster_profile_enabled,
        foster_accepts_dogs: profile.foster_accepts_dogs,
        foster_accepts_cats: profile.foster_accepts_cats,
        foster_accepts_other: profile.foster_accepts_other,
        foster_capacity: Math.max(1, Number(profile.foster_capacity || 1)),
        foster_size_small: profile.foster_size_small,
        foster_size_medium: profile.foster_size_medium,
        foster_size_large: profile.foster_size_large,
        foster_age_puppy: profile.foster_age_puppy,
        foster_age_young: profile.foster_age_young,
        foster_age_adult: profile.foster_age_adult,
        foster_age_senior: profile.foster_age_senior,
        foster_accepts_male: profile.foster_accepts_male,
        foster_accepts_female: profile.foster_accepts_female,
        foster_temperament_calm: profile.foster_temperament_calm,
        foster_temperament_social: profile.foster_temperament_social,
        foster_temperament_shy: profile.foster_temperament_shy,
        foster_temperament_active: profile.foster_temperament_active,
        foster_accepts_reactive: profile.foster_accepts_reactive,
        foster_accepts_medical: profile.foster_accepts_medical,
        foster_accepts_recovery: profile.foster_accepts_recovery,
        foster_accepts_disabled: profile.foster_accepts_disabled,
        foster_accepts_special_needs: profile.foster_accepts_special_needs,
        foster_housing_type: profile.foster_housing_type || null,
        foster_has_garden: profile.foster_has_garden,
        foster_garden_fenced: profile.foster_garden_fenced,
        foster_can_isolate: profile.foster_can_isolate,
        foster_hours_alone:
          profile.foster_hours_alone === ""
            ? null
            : Number(profile.foster_hours_alone),
        foster_work_schedule: profile.foster_work_schedule || null,
        foster_presence: profile.foster_presence || null,
        foster_has_children: profile.foster_has_children,
        foster_children_details: profile.foster_has_children
          ? profile.foster_children_details || null
          : null,
        foster_has_dogs: profile.foster_has_dogs,
        foster_has_cats: profile.foster_has_cats,
        foster_current_animals_notes:
          profile.foster_current_animals_notes || null,
        foster_experience: profile.foster_experience || null,
        foster_can_medicate: profile.foster_can_medicate,
        foster_duration_emergency: profile.foster_duration_emergency,
        foster_duration_days: profile.foster_duration_days,
        foster_duration_week: profile.foster_duration_week,
        foster_duration_weeks: profile.foster_duration_weeks,
        foster_duration_months: profile.foster_duration_months,
        foster_duration_until_adoption: profile.foster_duration_until_adoption,
        foster_duration: legacyDuration(),
        foster_conditions: profile.foster_conditions || null,
        foster_public_notes: profile.foster_public_notes || null,
        island: profile.island || null,
        city: profile.city || null,
        help_radius_km:
          profile.help_radius_km === "" ? null : Number(profile.help_radius_km),
        help_has_transport: profile.help_has_transport,
        foster_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("foster_structure_preferences")
        .delete()
        .eq("foster_user_id", user.id);

      if (deleteError) throw deleteError;

      if (!noPreference && selectedPrefs.length > 0) {
        const rows = selectedPrefs.map((key) => {
          const [type, id] = key.split(":");
          return {
            foster_user_id: user.id,
            structure_type: type,
            structure_id: id,
          };
        });

        const { error: insertError } = await supabase
          .from("foster_structure_preferences")
          .insert(rows);

        if (insertError) throw insertError;
      }

      setMessage(
        profile.foster_profile_enabled
          ? "Votre fiche Famille d'accueil est enregistrée. Merci de proposer votre aide 🐾"
          : "Votre profil Famille d'accueil est actuellement désactivé."
      );
    } catch (cause) {
      console.error("Sauvegarde Famille d'accueil :", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer votre fiche."
      );
    } finally {
      setSaving(false);
    }
  }

  const canAccessPrivateNetwork =
    HELP_NETWORK_ROLES.includes(currentRole);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />
          <p className="mt-4 font-black text-[#064b42]">
            Chargement de votre fiche F.A...
          </p>
        </div>
      </main>
    );
  }

  if (activeTab === "network") {
    return (
      <>
        <HelpWorkspaceTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {canAccessPrivateNetwork ? (
          <HelpNetworkPage />
        ) : (
          <PrivateHelpAccessMessage
            onBack={() => setActiveTab("fa")}
          />
        )}
      </>
    );
  }

  if (activeTab === "sos") {
    return (
      <>
        <HelpWorkspaceTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {canAccessPrivateNetwork ? (
          <HelpSosPage />
        ) : (
          <PrivateHelpAccessMessage
            onBack={() => setActiveTab("fa")}
          />
        )}
      </>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]">
      <HelpWorkspaceTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <form onSubmit={save} className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <section className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ef919b] text-white shadow-lg">
              <Home size={30} />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
              Taui Te Ora
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#064b42] sm:text-5xl">
              Famille d&apos;accueil
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6f625a] sm:text-base">
              Offrez temporairement un foyer à un animal qui en a besoin. Décrivez votre environnement, vos disponibilités et les animaux que vous pouvez accueillir.
            </p>
          </div>

          <div className="mt-8 rounded-[28px] bg-white p-5 shadow sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#064b42]">
                    Je me propose comme famille d&apos;accueil
                  </h2>
                  <p className="mt-1 text-sm text-[#6f625a]">
                    Vous pouvez désactiver votre disponibilité à tout moment sans supprimer votre fiche.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  update(
                    "foster_profile_enabled",
                    !profile.foster_profile_enabled
                  )
                }
                className={`rounded-full px-5 py-3 text-sm font-black text-white shadow ${
                  profile.foster_profile_enabled
                    ? "bg-[#5a9c84]"
                    : "bg-[#8d847d]"
                }`}
              >
                {profile.foster_profile_enabled ? "✓ Disponible" : "Indisponible"}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Section
              icon={<Building2 size={22} />}
              title="Pour quelle association ou structure ?"
              subtitle="Choisissez une ou plusieurs structures, ou restez disponible sans préférence."
            >
              <button
                type="button"
                onClick={setWithoutPreference}
                className={`flex w-full items-center justify-between rounded-[20px] border-2 p-4 text-left ${
                  noPreference
                    ? "border-[#064b42] bg-[#eaf5f1]"
                    : "border-[#eadfd8] bg-white"
                }`}
              >
                <div>
                  <p className="font-black text-[#064b42]">Sans préférence</p>
                  <p className="mt-1 text-xs text-[#6f625a]">
                    Toutes les associations, refuges, fourrières et bénévoles peuvent me contacter.
                  </p>
                </div>
                {noPreference && <Check size={20} strokeWidth={3} />}
              </button>

              {structures.length === 0 ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-[#dfcdb8] bg-[#faf5ed] p-4 text-sm text-[#6f625a]">
                  Aucun profil Association, Refuge, Fourrière ou Bénévole n&apos;est visible pour le moment.
                </div>
              ) : (
                <>
                  <input
                    value={structureSearch}
                    onChange={(event) => setStructureSearch(event.target.value)}
                    placeholder="Rechercher une association, un refuge, une fourrière ou un bénévole..."
                    className="mt-4 w-full rounded-full border border-[#e5d8cd] bg-white px-4 py-3 outline-none focus:border-[#ef919b]"
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {filteredStructures.map((item) => {
                      const key = prefKey(item.type, item.id);
                      const selected = selectedPrefs.includes(key);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePreference(item)}
                          className={`flex items-center justify-between rounded-[20px] border-2 p-4 text-left ${
                            selected
                              ? "border-[#ef919b] bg-[#fce8ec]"
                              : "border-[#eadfd8] bg-white"
                          }`}
                        >
                          <div>
                            <p className="font-black text-[#064b42]">{item.name}</p>
                            <p className="mt-1 text-xs capitalize text-[#756d67]">
                              {structureTypeLabel(item.type)}
                            </p>
                          </div>
                          {selected && (
                            <Check size={18} strokeWidth={3} className="text-[#df8995]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Section>

            <Section
              icon={<PawPrint size={22} />}
              title="Quels animaux puis-je accueillir ?"
              subtitle="Sélectionnez uniquement ce qui correspond réellement à vos possibilités."
            >
              <OptionGrid>
                <Toggle label="🐶 Chiens" checked={profile.foster_accepts_dogs} onClick={() => update("foster_accepts_dogs", !profile.foster_accepts_dogs)} />
                <Toggle label="🐱 Chats" checked={profile.foster_accepts_cats} onClick={() => update("foster_accepts_cats", !profile.foster_accepts_cats)} />
                <Toggle label="🐾 Autres" checked={profile.foster_accepts_other} onClick={() => update("foster_accepts_other", !profile.foster_accepts_other)} />
              </OptionGrid>

              <label className="mt-5 block">
                <FieldLabel>Capacité maximum simultanée</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={profile.foster_capacity}
                  onChange={(event) => update("foster_capacity", Math.max(1, Number(event.target.value || 1)))}
                  className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                />
              </label>

              <SubTitle>Taille</SubTitle>
              <OptionGrid>
                <Toggle label="Petit" checked={profile.foster_size_small} onClick={() => update("foster_size_small", !profile.foster_size_small)} />
                <Toggle label="Moyen" checked={profile.foster_size_medium} onClick={() => update("foster_size_medium", !profile.foster_size_medium)} />
                <Toggle label="Grand" checked={profile.foster_size_large} onClick={() => update("foster_size_large", !profile.foster_size_large)} />
              </OptionGrid>

              <SubTitle>Âge</SubTitle>
              <OptionGrid>
                <Toggle label="Chiot / chaton" checked={profile.foster_age_puppy} onClick={() => update("foster_age_puppy", !profile.foster_age_puppy)} />
                <Toggle label="Jeune" checked={profile.foster_age_young} onClick={() => update("foster_age_young", !profile.foster_age_young)} />
                <Toggle label="Adulte" checked={profile.foster_age_adult} onClick={() => update("foster_age_adult", !profile.foster_age_adult)} />
                <Toggle label="Senior" checked={profile.foster_age_senior} onClick={() => update("foster_age_senior", !profile.foster_age_senior)} />
              </OptionGrid>

              <SubTitle>Sexe</SubTitle>
              <OptionGrid>
                <Toggle label="Mâle" checked={profile.foster_accepts_male} onClick={() => update("foster_accepts_male", !profile.foster_accepts_male)} />
                <Toggle label="Femelle" checked={profile.foster_accepts_female} onClick={() => update("foster_accepts_female", !profile.foster_accepts_female)} />
              </OptionGrid>

              <SubTitle>Caractère / comportement</SubTitle>
              <OptionGrid>
                <Toggle label="😌 Calme" checked={profile.foster_temperament_calm} onClick={() => update("foster_temperament_calm", !profile.foster_temperament_calm)} />
                <Toggle label="🐾 Sociable" checked={profile.foster_temperament_social} onClick={() => update("foster_temperament_social", !profile.foster_temperament_social)} />
                <Toggle label="🌱 Timide" checked={profile.foster_temperament_shy} onClick={() => update("foster_temperament_shy", !profile.foster_temperament_shy)} />
                <Toggle label="⚡ Actif" checked={profile.foster_temperament_active} onClick={() => update("foster_temperament_active", !profile.foster_temperament_active)} />
                <Toggle label="Réactif accepté" checked={profile.foster_accepts_reactive} onClick={() => update("foster_accepts_reactive", !profile.foster_accepts_reactive)} />
              </OptionGrid>

              <SubTitle>Situations particulières</SubTitle>
              <OptionGrid>
                <Toggle label="💊 Traitement médical" checked={profile.foster_accepts_medical} onClick={() => update("foster_accepts_medical", !profile.foster_accepts_medical)} />
                <Toggle label="🩹 Convalescence" checked={profile.foster_accepts_recovery} onClick={() => update("foster_accepts_recovery", !profile.foster_accepts_recovery)} />
                <Toggle label="♿ Handicap" checked={profile.foster_accepts_disabled} onClick={() => update("foster_accepts_disabled", !profile.foster_accepts_disabled)} />
                <Toggle label="❤️ Besoins particuliers" checked={profile.foster_accepts_special_needs} onClick={() => update("foster_accepts_special_needs", !profile.foster_accepts_special_needs)} />
              </OptionGrid>
            </Section>

            <Section
              icon={<Clock3 size={22} />}
              title="Combien de temps puis-je accueillir ?"
              subtitle="Vous pouvez sélectionner plusieurs durées."
            >
              <OptionGrid>
                <Toggle label="🚨 Urgence 24 / 48 h" checked={profile.foster_duration_emergency} onClick={() => update("foster_duration_emergency", !profile.foster_duration_emergency)} />
                <Toggle label="Quelques jours" checked={profile.foster_duration_days} onClick={() => update("foster_duration_days", !profile.foster_duration_days)} />
                <Toggle label="1 semaine" checked={profile.foster_duration_week} onClick={() => update("foster_duration_week", !profile.foster_duration_week)} />
                <Toggle label="Plusieurs semaines" checked={profile.foster_duration_weeks} onClick={() => update("foster_duration_weeks", !profile.foster_duration_weeks)} />
                <Toggle label="Plusieurs mois" checked={profile.foster_duration_months} onClick={() => update("foster_duration_months", !profile.foster_duration_months)} />
                <Toggle label="Jusqu'à adoption" checked={profile.foster_duration_until_adoption} onClick={() => update("foster_duration_until_adoption", !profile.foster_duration_until_adoption)} />
              </OptionGrid>
            </Section>

            <Section
              icon={<Home size={22} />}
              title="Mon environnement"
              subtitle="Ces informations permettent d'éviter de proposer un animal qui ne serait pas adapté à votre foyer."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <FieldLabel>Type de logement</FieldLabel>
                  <select
                    value={profile.foster_housing_type}
                    onChange={(event) => update("foster_housing_type", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="maison_jardin">Maison avec jardin</option>
                    <option value="terrain">Maison avec terrain</option>
                    <option value="autre">Autre</option>
                  </select>
                </label>

                <label>
                  <FieldLabel>Présence à domicile</FieldLabel>
                  <select
                    value={profile.foster_presence}
                    onChange={(event) => update("foster_presence", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="quasi_permanente">Quasi permanente</option>
                    <option value="journee">Présent une grande partie de la journée</option>
                    <option value="matin_soir">Principalement matin / soir</option>
                    <option value="variable">Variable</option>
                  </select>
                </label>

                <label>
                  <FieldLabel>Heures maximum seul / jour</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={profile.foster_hours_alone}
                    onChange={(event) => update("foster_hours_alone", event.target.value === "" ? "" : Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <label>
                  <FieldLabel>Horaires / rythme de travail</FieldLabel>
                  <input
                    value={profile.foster_work_schedule}
                    onChange={(event) => update("foster_work_schedule", event.target.value)}
                    placeholder="Ex. télétravail, horaires décalés..."
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <OptionGrid className="mt-5">
                <Toggle label="🌿 Jardin" checked={profile.foster_has_garden} onClick={() => update("foster_has_garden", !profile.foster_has_garden)} />
                <Toggle label="🔒 Terrain clôturé" checked={profile.foster_garden_fenced} onClick={() => update("foster_garden_fenced", !profile.foster_garden_fenced)} />
                <Toggle label="🚪 Possibilité d'isoler l'animal" checked={profile.foster_can_isolate} onClick={() => update("foster_can_isolate", !profile.foster_can_isolate)} />
              </OptionGrid>
            </Section>

            <Section
              icon={<Users size={22} />}
              title="Mon foyer & mon expérience"
              subtitle="Parlez-nous des humains et animaux qui partageront le quotidien de l'animal accueilli."
            >
              <OptionGrid>
                <Toggle label="👧 Enfants au foyer" checked={profile.foster_has_children} onClick={() => update("foster_has_children", !profile.foster_has_children)} />
                <Toggle label="🐶 J'ai déjà un ou plusieurs chiens" checked={profile.foster_has_dogs} onClick={() => update("foster_has_dogs", !profile.foster_has_dogs)} />
                <Toggle label="🐱 J'ai déjà un ou plusieurs chats" checked={profile.foster_has_cats} onClick={() => update("foster_has_cats", !profile.foster_has_cats)} />
                <Toggle label="💊 Je peux administrer des médicaments" checked={profile.foster_can_medicate} onClick={() => update("foster_can_medicate", !profile.foster_can_medicate)} />
              </OptionGrid>

              {profile.foster_has_children && (
                <label className="mt-5 block">
                  <FieldLabel>Âge / informations sur les enfants</FieldLabel>
                  <input
                    value={profile.foster_children_details}
                    onChange={(event) => update("foster_children_details", event.target.value)}
                    placeholder="Ex. 2 enfants de 8 et 12 ans"
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <FieldLabel>Mon expérience</FieldLabel>
                  <select
                    value={profile.foster_experience}
                    onChange={(event) => update("foster_experience", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="experimente">Expérimenté</option>
                    <option value="tres_experimente">Très expérimenté / cas complexes</option>
                  </select>
                </label>

                <label>
                  <FieldLabel>Mes animaux actuels</FieldLabel>
                  <input
                    value={profile.foster_current_animals_notes}
                    onChange={(event) => update("foster_current_animals_notes", event.target.value)}
                    placeholder="Ex. 1 chien mâle castré, 2 chats..."
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </Section>

            <Section
              icon={<MapPin size={22} />}
              title="Ma zone géographique"
              subtitle="Pour proposer en priorité les accueils réellement accessibles pour vous."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <FieldLabel>Île *</FieldLabel>
                  <input
                    value={profile.island}
                    onChange={(event) => update("island", event.target.value)}
                    placeholder="Tahiti"
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <label>
                  <FieldLabel>Commune</FieldLabel>
                  <input
                    value={profile.city}
                    onChange={(event) => update("city", event.target.value)}
                    placeholder="Punaauia"
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>

                <label>
                  <FieldLabel>Rayon maximum (km)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={profile.help_radius_km}
                    onChange={(event) => update("help_radius_km", event.target.value === "" ? "" : Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <div className="mt-5">
                <Toggle label="🚗 Je peux transporter l'animal" checked={profile.help_has_transport} onClick={() => update("help_has_transport", !profile.help_has_transport)} />
              </div>
            </Section>

            <Section
              icon={<ShieldCheck size={22} />}
              title="Mes conditions"
              subtitle="Précisez clairement ce que vous pouvez ou ne pouvez pas prendre en charge."
            >
              <label className="block">
                <FieldLabel>Mes conditions / limites</FieldLabel>
                <textarea
                  rows={5}
                  value={profile.foster_conditions}
                  onChange={(event) => update("foster_conditions", event.target.value)}
                  placeholder="Ex. pas de chien réactif aux chats, pas d'animal de plus de 25 kg..."
                  className="mt-2 w-full resize-none rounded-[20px] border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="mt-5 block">
                <FieldLabel>Quelques mots sur moi / mon foyer</FieldLabel>
                <textarea
                  rows={5}
                  value={profile.foster_public_notes}
                  onChange={(event) => update("foster_public_notes", event.target.value)}
                  placeholder="Présentez votre mode de vie, votre expérience et ce qui vous motive..."
                  className="mt-2 w-full resize-none rounded-[20px] border border-[#e5d8cd] bg-white px-4 py-3 outline-none"
                />
              </label>
            </Section>
          </div>

          {error && (
            <div className="mt-6 rounded-[20px] bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-[20px] bg-[#eaf5f1] p-4 text-sm font-bold text-[#064b42]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-4 text-lg font-black text-white shadow-xl disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? "Enregistrement..." : "Enregistrer ma fiche F.A"}
          </button>
        </section>
      </form>
    </main>
  );
}

function HelpWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: HelpWorkspaceTab;
  onChange: (tab: HelpWorkspaceTab) => void;
}) {
  const tabs: Array<{
    key: HelpWorkspaceTab;
    label: string;
    icon: string;
  }> = [
    {
      key: "fa",
      label: "Ma fiche F.A.",
      icon: "🏠",
    },
    {
      key: "network",
      label: "Réseau d'aide",
      icon: "🤝",
    },
    {
      key: "sos",
      label: "SOS & besoins",
      icon: "🚨",
    },
  ];

  return (
    <div className="sticky top-0 z-[60] border-b border-[#e7ddd1] bg-[#f5ead8]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto rounded-[22px] bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`min-w-max flex-1 rounded-[16px] px-4 py-3 text-sm font-black transition ${
              activeTab === tab.key
                ? "bg-[#064b42] text-white shadow"
                : "bg-transparent text-[#064b42] hover:bg-[#f8f4ec]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrivateHelpAccessMessage({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-12">
      <section className="mx-auto max-w-xl rounded-[30px] bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f3ef] text-2xl">
          🔒
        </div>

        <h2 className="mt-5 text-2xl font-black text-[#064b42]">
          Espace réservé
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#756d67]">
          Vous pouvez créer et gérer votre fiche Famille d&apos;accueil ici.
          L&apos;accès aux coordonnées du Réseau d&apos;aide et à la gestion des SOS
          reste réservé aux associations, refuges, fourrières, bénévoles et à
          l&apos;administration.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
        >
          Retour à ma fiche F.A.
        </button>
      </section>
    </main>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce8ec] text-[#d76f7e]">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-[#064b42]">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6f625a]">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OptionGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[54px] items-center justify-between gap-3 rounded-[18px] border-2 px-4 py-3 text-left text-sm font-bold transition ${
        checked
          ? "border-[#ef919b] bg-[#fce8ec] text-[#064b42]"
          : "border-[#eadfd8] bg-white text-[#6f625a]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          checked
            ? "bg-[#ef919b] text-white"
            : "bg-[#f4eee5] text-[#a69b93]"
        }`}
      >
        {checked ? (
          <Check size={14} strokeWidth={3} />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current opacity-40" />
        )}
      </span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-sm font-black text-[#064b42]">
      {children}
    </span>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-sm font-black uppercase tracking-[0.12em] text-[#df8995]">
      {children}
    </h3>
  );
}
