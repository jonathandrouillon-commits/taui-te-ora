"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type HelpForm = {
  help_available: boolean;
  help_foster: boolean;
  help_transport: boolean;
  help_capture: boolean;
  help_food_material: boolean;
  help_vet: boolean;
  help_volunteer: boolean;
  island: string;
  city: string;
  help_notes: string;
};

const EMPTY_FORM: HelpForm = {
  help_available: false,
  help_foster: false,
  help_transport: false,
  help_capture: false,
  help_food_material: false,
  help_vet: false,
  help_volunteer: false,
  island: "",
  city: "",
  help_notes: "",
};

const HELP_OPTIONS: Array<{
  key:
    | "help_foster"
    | "help_transport"
    | "help_capture"
    | "help_food_material"
    | "help_vet"
    | "help_volunteer";
  icon: string;
  title: string;
  description: string;
}> = [
  {
    key: "help_foster",
    icon: "🏠",
    title: "Famille d’accueil",
    description: "Accueillir temporairement un animal.",
  },
  {
    key: "help_transport",
    icon: "🚗",
    title: "Transport",
    description: "Transporter un animal, du matériel ou des dons.",
  },
  {
    key: "help_capture",
    icon: "🛟",
    title: "Aide à la capture",
    description: "Aider lors d’un sauvetage ou d’une récupération.",
  },
  {
    key: "help_food_material",
    icon: "🥣",
    title: "Nourriture / matériel",
    description: "Donner ou acheminer nourriture, cages, couvertures, etc.",
  },
  {
    key: "help_vet",
    icon: "🩺",
    title: "Accompagnement vétérinaire",
    description: "Aider pour un trajet ou un rendez-vous vétérinaire.",
  },
  {
    key: "help_volunteer",
    icon: "🤝",
    title: "Bénévolat",
    description: "Donner du temps pour une association ou une urgence.",
  },
];

export default function DashboardHelpVolunteer() {
  const [form, setForm] = useState<HelpForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedCount = useMemo(
    () =>
      HELP_OPTIONS.filter((option) => form[option.key]).length,
    [form]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "help_available, help_foster, help_transport, help_capture, help_food_material, help_vet, help_volunteer, island, city, help_notes"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active || !data) return;

        setForm({
          help_available: Boolean(data.help_available),
          help_foster: Boolean(data.help_foster),
          help_transport: Boolean(data.help_transport),
          help_capture: Boolean(data.help_capture),
          help_food_material: Boolean(data.help_food_material),
          help_vet: Boolean(data.help_vet),
          help_volunteer: Boolean(data.help_volunteer),
          island: String(data.island || ""),
          city: String(data.city || ""),
          help_notes: String(data.help_notes || ""),
        });
      } catch (error) {
        console.error("Chargement aide bénévole :", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger vos préférences d’aide."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function toggleOption(key: (typeof HELP_OPTIONS)[number]["key"]) {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function save() {
    try {
      setSaving(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Connexion requise.");
      }

      if (form.help_available && selectedCount === 0) {
        throw new Error(
          "Choisissez au moins une manière d’aider."
        );
      }

      if (form.help_available && !form.island.trim()) {
        throw new Error(
          "Indiquez votre île pour recevoir des demandes proches de vous."
        );
      }

      const payload = {
        help_available: form.help_available,
        help_foster: form.help_available ? form.help_foster : false,
        help_transport: form.help_available ? form.help_transport : false,
        help_capture: form.help_available ? form.help_capture : false,
        help_food_material: form.help_available
          ? form.help_food_material
          : false,
        help_vet: form.help_available ? form.help_vet : false,
        help_volunteer: form.help_available
          ? form.help_volunteer
          : false,
        island: form.island.trim() || null,
        city: form.city.trim() || null,
        help_notes: form.help_notes.trim() || null,
        help_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (error) throw error;

      setMessage(
        form.help_available
          ? "Merci ❤️ Votre disponibilité pour aider a bien été enregistrée."
          : "Votre disponibilité a été désactivée."
      );
    } catch (error) {
      console.error("Enregistrement aide bénévole :", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e9f4f0] text-2xl">
          🤝
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Je peux aider
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Indiquez comment vous pouvez aider la cause animale.
                Ces informations serviront ensuite à vous proposer des SOS proches de vous.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-full bg-[#f8f4ec] px-4 py-3">
              <input
                type="checkbox"
                checked={form.help_available}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    help_available: event.target.checked,
                  }))
                }
                disabled={loading || saving}
                className="h-5 w-5 accent-[#064b42]"
              />

              <span className="text-sm font-black text-[#064b42]">
                {form.help_available
                  ? "Disponible"
                  : "Je peux aider"}
              </span>
            </label>
          </div>

          {form.help_available ? (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {HELP_OPTIONS.map((option) => {
                  const active = form[option.key];

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleOption(option.key)}
                      disabled={saving}
                      className={`flex items-start gap-3 rounded-[20px] border-2 p-4 text-left transition ${
                        active
                          ? "border-[#064b42] bg-[#eef7f4]"
                          : "border-[#eee5dc] bg-[#fffdf9]"
                      }`}
                    >
                      <span className="text-2xl">
                        {option.icon}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-black text-[#064b42]">
                          <input
                            type="checkbox"
                            checked={active}
                            readOnly
                            tabIndex={-1}
                            className="h-4 w-4 accent-[#064b42]"
                          />
                          {option.title}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
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
                    className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>

                <label className="block">
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
                    className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Précisions facultatives
                </span>
                <textarea
                  value={form.help_notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      help_notes: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ex. disponible le soir, véhicule utilitaire, peut accueillir un petit chien..."
                  className="w-full resize-none rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
                />
              </label>
            </>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void save()}
              disabled={loading || saving}
              className="rounded-full bg-[#064b42] px-6 py-3 font-black text-white transition hover:bg-[#08695d] disabled:opacity-60"
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer mes disponibilités"}
            </button>

            {form.help_available ? (
              <span className="text-xs font-bold text-gray-500">
                {selectedCount} type{selectedCount > 1 ? "s" : ""} d’aide sélectionné{selectedCount > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>

          {message ? (
            <p className="mt-4 rounded-xl bg-[#f8f4ec] px-4 py-3 text-sm font-semibold text-[#064b42]">
              {message}
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-gray-500">
            Vos coordonnées personnelles ne sont pas affichées publiquement.
            Elles serviront uniquement à organiser l’aide et les futures alertes ciblées.
          </p>
        </div>
      </div>
    </section>
  );
}
