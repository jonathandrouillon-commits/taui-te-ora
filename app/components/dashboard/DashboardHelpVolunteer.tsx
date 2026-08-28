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
  foster_accepts_dogs: boolean;
  foster_accepts_cats: boolean;
  foster_capacity: number;
  foster_duration: string;
  help_radius_km: number | "";
  help_has_transport: boolean;
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
  foster_accepts_dogs: false,
  foster_accepts_cats: false,
  foster_capacity: 1,
  foster_duration: "",
  help_radius_km: "",
  help_has_transport: false,
};

const HELP_OPTIONS = [
  { key: "help_foster" as const, icon: "🏠", title: "Famille d’accueil" },
  { key: "help_transport" as const, icon: "🚗", title: "Transport" },
  { key: "help_capture" as const, icon: "🛟", title: "Aide à la capture" },
  { key: "help_food_material" as const, icon: "🥣", title: "Nourriture / matériel" },
  { key: "help_vet" as const, icon: "🩺", title: "Accompagnement vétérinaire" },
  { key: "help_volunteer" as const, icon: "🤝", title: "Bénévolat" },
];

export default function DashboardHelpVolunteer() {
  const [form, setForm] = useState<HelpForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedCount = useMemo(
    () => HELP_OPTIONS.filter((option) => form[option.key]).length,
    [form]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select(`
            help_available,
            help_foster,
            help_transport,
            help_capture,
            help_food_material,
            help_vet,
            help_volunteer,
            island,
            city,
            help_notes,
            foster_accepts_dogs,
            foster_accepts_cats,
            foster_capacity,
            foster_duration,
            help_radius_km,
            help_has_transport
          `)
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
          foster_accepts_dogs: Boolean(data.foster_accepts_dogs),
          foster_accepts_cats: Boolean(data.foster_accepts_cats),
          foster_capacity: Math.max(1, Number(data.foster_capacity || 1)),
          foster_duration: String(data.foster_duration || ""),
          help_radius_km:
            data.help_radius_km == null ? "" : Number(data.help_radius_km),
          help_has_transport: Boolean(data.help_has_transport),
        });
      } catch (error) {
        console.error("Chargement aide bénévole :", error);
        setMessage(error instanceof Error ? error.message : "Impossible de charger.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  async function save() {
    try {
      setSaving(true);
      setMessage("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connexion requise.");

      if (form.help_available && selectedCount === 0) {
        throw new Error("Choisissez au moins une manière d’aider.");
      }

      if (form.help_available && !form.island.trim()) {
        throw new Error("Indiquez votre île.");
      }

      if (
        form.help_available &&
        form.help_foster &&
        !form.foster_accepts_dogs &&
        !form.foster_accepts_cats
      ) {
        throw new Error("Indiquez si vous acceptez les chiens, les chats ou les deux.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          help_available: form.help_available,
          help_foster: form.help_available ? form.help_foster : false,
          help_transport: form.help_available ? form.help_transport : false,
          help_capture: form.help_available ? form.help_capture : false,
          help_food_material: form.help_available ? form.help_food_material : false,
          help_vet: form.help_available ? form.help_vet : false,
          help_volunteer: form.help_available ? form.help_volunteer : false,
          island: form.island.trim() || null,
          city: form.city.trim() || null,
          help_notes: form.help_notes.trim() || null,
          foster_accepts_dogs:
            form.help_available && form.help_foster ? form.foster_accepts_dogs : false,
          foster_accepts_cats:
            form.help_available && form.help_foster ? form.foster_accepts_cats : false,
          foster_capacity:
            form.help_available && form.help_foster
              ? Math.min(20, Math.max(1, Number(form.foster_capacity || 1)))
              : 1,
          foster_duration:
            form.help_available && form.help_foster
              ? form.foster_duration.trim() || null
              : null,
          help_radius_km:
            form.help_available && form.help_radius_km !== ""
              ? Math.min(500, Math.max(1, Number(form.help_radius_km)))
              : null,
          help_has_transport: form.help_available ? form.help_has_transport : false,
          help_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage(
        form.help_available
          ? "Merci ❤️ Vos disponibilités ont été enregistrées."
          : "Votre disponibilité a été désactivée."
      );
    } catch (error) {
      console.error("Enregistrement aide bénévole :", error);
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer.");
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
              <h2 className="text-xl font-black text-[#064b42]">Je peux aider</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Définissez vos disponibilités pour recevoir uniquement les SOS pertinents.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-full bg-[#f8f4ec] px-4 py-3">
              <input
                type="checkbox"
                checked={form.help_available}
                onChange={(e) => setForm((c) => ({ ...c, help_available: e.target.checked }))}
                className="h-5 w-5 accent-[#064b42]"
              />
              <span className="text-sm font-black text-[#064b42]">
                {form.help_available ? "Disponible" : "Je peux aider"}
              </span>
            </label>
          </div>

          {form.help_available && (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {HELP_OPTIONS.map((option) => {
                  const selected = form[option.key];
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        setForm((c) => ({ ...c, [option.key]: !c[option.key] }))
                      }
                      className={`rounded-[20px] border-2 p-4 text-left font-black ${
                        selected
                          ? "border-[#064b42] bg-[#eef7f4] text-[#064b42]"
                          : "border-[#eee5dc] bg-[#fffdf9] text-[#5f554d]"
                      }`}
                    >
                      {option.icon} {option.title}
                    </button>
                  );
                })}
              </div>

              {form.help_foster && (
                <div className="mt-6 rounded-[24px] bg-[#fff8f5] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">
                    🏠 Famille d’accueil
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
                      <input
                        type="checkbox"
                        checked={form.foster_accepts_dogs}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, foster_accepts_dogs: e.target.checked }))
                        }
                        className="h-5 w-5 accent-[#064b42]"
                      />
                      <span className="font-black text-[#064b42]">🐶 Chiens</span>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-white p-4">
                      <input
                        type="checkbox"
                        checked={form.foster_accepts_cats}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, foster_accepts_cats: e.target.checked }))
                        }
                        className="h-5 w-5 accent-[#064b42]"
                      />
                      <span className="font-black text-[#064b42]">🐱 Chats</span>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Nombre maximum d’animaux
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.foster_capacity}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            foster_capacity: Number(e.target.value || 1),
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Durée possible
                      </span>
                      <select
                        value={form.foster_duration}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, foster_duration: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3"
                      >
                        <option value="">Non précisée</option>
                        <option value="urgence_24_48h">Urgence 24 à 48 h</option>
                        <option value="moins_1_semaine">Moins d’une semaine</option>
                        <option value="1_4_semaines">1 à 4 semaines</option>
                        <option value="1_3_mois">1 à 3 mois</option>
                        <option value="plus_3_mois">Plus de 3 mois</option>
                        <option value="sans_limite">Sans durée précise</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={form.island}
                  onChange={(e) => setForm((c) => ({ ...c, island: e.target.value }))}
                  placeholder="Île - ex. Tahiti"
                  className="rounded-2xl border border-[#e5ddd5] px-4 py-3"
                />

                <input
                  value={form.city}
                  onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                  placeholder="Commune - ex. Punaauia"
                  className="rounded-2xl border border-[#e5ddd5] px-4 py-3"
                />

                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.help_radius_km}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      help_radius_km: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  placeholder="Rayon d’intervention en km"
                  className="rounded-2xl border border-[#e5ddd5] px-4 py-3"
                />

                <label className="flex items-center gap-3 rounded-2xl border border-[#e5ddd5] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.help_has_transport}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, help_has_transport: e.target.checked }))
                    }
                    className="h-5 w-5 accent-[#064b42]"
                  />
                  <span className="font-black text-[#064b42]">
                    🚗 J’ai un moyen de transport
                  </span>
                </label>
              </div>

              <textarea
                value={form.help_notes}
                onChange={(e) => setForm((c) => ({ ...c, help_notes: e.target.value }))}
                rows={3}
                placeholder="Précisions : jardin clôturé, disponible le soir, véhicule utilitaire..."
                className="mt-4 w-full rounded-2xl border border-[#e5ddd5] px-4 py-3"
              />
            </>
          )}

          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="mt-5 rounded-full bg-[#064b42] px-6 py-3 font-black text-white disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer mes disponibilités"}
          </button>

          {message && (
            <p className="mt-4 rounded-xl bg-[#f8f4ec] px-4 py-3 text-sm font-semibold text-[#064b42]">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
