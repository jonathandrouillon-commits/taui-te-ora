"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type VolunteerProfile = {
  help_available: boolean;
  help_foster: boolean;
  help_transport: boolean;
  help_capture: boolean;
  help_food_material: boolean;
  help_vet: boolean;
  help_volunteer: boolean;
  help_notes: string;
  foster_accepts_dogs: boolean;
  foster_accepts_cats: boolean;
  foster_capacity: number;
  foster_duration: string;
  help_radius_km: number | null;
  help_has_transport: boolean;
};

const DEFAULT_PROFILE: VolunteerProfile = {
  help_available: false,
  help_foster: false,
  help_transport: false,
  help_capture: false,
  help_food_material: false,
  help_vet: false,
  help_volunteer: false,
  help_notes: "",
  foster_accepts_dogs: false,
  foster_accepts_cats: false,
  foster_capacity: 1,
  foster_duration: "",
  help_radius_km: 10,
  help_has_transport: false,
};

export default function ProfilBenevolePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<VolunteerProfile>(DEFAULT_PROFILE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          help_available,
          help_foster,
          help_transport,
          help_capture,
          help_food_material,
          help_vet,
          help_volunteer,
          help_notes,
          foster_accepts_dogs,
          foster_accepts_cats,
          foster_capacity,
          foster_duration,
          help_radius_km,
          help_has_transport
          `
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!data) {
        return;
      }

      setProfile({
        help_available: data.help_available ?? false,
        help_foster: data.help_foster ?? false,
        help_transport: data.help_transport ?? false,
        help_capture: data.help_capture ?? false,
        help_food_material: data.help_food_material ?? false,
        help_vet: data.help_vet ?? false,
        help_volunteer: data.help_volunteer ?? false,
        help_notes: data.help_notes ?? "",
        foster_accepts_dogs:
          data.foster_accepts_dogs ?? false,
        foster_accepts_cats:
          data.foster_accepts_cats ?? false,
        foster_capacity: data.foster_capacity ?? 1,
        foster_duration: data.foster_duration ?? "",
        help_radius_km: data.help_radius_km ?? 10,
        help_has_transport:
          data.help_has_transport ?? false,
      });
    } catch (err) {
      console.error(
        "Erreur chargement profil bénévole :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger votre profil bénévole."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof VolunteerProfile>(
    field: K,
    value: VolunteerProfile[K]
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (
        profile.help_available &&
        profile.help_foster &&
        !profile.foster_accepts_dogs &&
        !profile.foster_accepts_cats
      ) {
        setError(
          "Pour être famille d’accueil, indiquez si vous pouvez accueillir des chiens, des chats ou les deux."
        );
        return;
      }

      const payload = {
        help_available: profile.help_available,

        help_foster: profile.help_available
          ? profile.help_foster
          : false,

        help_transport: profile.help_available
          ? profile.help_transport
          : false,

        help_capture: profile.help_available
          ? profile.help_capture
          : false,

        help_food_material: profile.help_available
          ? profile.help_food_material
          : false,

        help_vet: profile.help_available
          ? profile.help_vet
          : false,

        help_volunteer: profile.help_available
          ? profile.help_volunteer
          : false,

        help_notes: profile.help_available
          ? profile.help_notes.trim() || null
          : null,

        help_radius_km:
          profile.help_available &&
          profile.help_radius_km !== null
            ? profile.help_radius_km
            : null,

        help_has_transport: profile.help_available
          ? profile.help_has_transport
          : false,

        foster_accepts_dogs:
          profile.help_available && profile.help_foster
            ? profile.foster_accepts_dogs
            : false,

        foster_accepts_cats:
          profile.help_available && profile.help_foster
            ? profile.foster_accepts_cats
            : false,

        foster_capacity:
          profile.help_available && profile.help_foster
            ? Math.max(1, profile.foster_capacity)
            : 1,

        foster_duration:
          profile.help_available && profile.help_foster
            ? profile.foster_duration || null
            : null,

        help_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setMessage(
        profile.help_available
          ? "Votre profil bénévole a bien été enregistré."
          : "Votre disponibilité bénévole a été désactivée."
      );
    } catch (err) {
      console.error(
        "Erreur sauvegarde profil bénévole :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant l’enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ee]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ef6b55]" />

            <p className="text-sm font-semibold text-gray-600">
              Chargement de votre profil bénévole...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-950"
        >
          <span>←</span>
          Retour
        </button>

        <section className="mb-7 overflow-hidden rounded-[32px] bg-[#183b34] p-7 text-white shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em]">
              Entraide
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Profil bénévole
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Un peu de temps peut changer beaucoup de choses.
              Indiquez comment vous pouvez aider les animaux,
              les associations et les familles d’accueil autour
              de vous.
            </p>
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950">
                Je suis disponible pour aider
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Activez cette option pour enregistrer votre
                disponibilité comme bénévole sur Taui Te Ora.
              </p>
            </div>

            <Switch
              checked={profile.help_available}
              onChange={(value) =>
                updateField("help_available", value)
              }
            />
          </div>
        </section>

        <div
          className={
            profile.help_available
              ? "space-y-6"
              : "pointer-events-none space-y-6 opacity-40"
          }
        >
          <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
            <SectionTitle
              icon="🤝"
              title="Comment pouvez-vous aider ?"
              description="Sélectionnez toutes les missions pour lesquelles vous pouvez être disponible."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <HelpCard
                icon="🏠"
                title="Famille d’accueil"
                description="Accueillir temporairement un animal chez vous."
                checked={profile.help_foster}
                onChange={(value) =>
                  updateField("help_foster", value)
                }
              />

              <HelpCard
                icon="🚗"
                title="Transport"
                description="Transporter un animal vers une famille, une association ou un vétérinaire."
                checked={profile.help_transport}
                onChange={(value) =>
                  updateField("help_transport", value)
                }
              />

              <HelpCard
                icon="🐕"
                title="Capture / récupération"
                description="Aider à récupérer ou sécuriser un animal errant."
                checked={profile.help_capture}
                onChange={(value) =>
                  updateField("help_capture", value)
                }
              />

              <HelpCard
                icon="🥣"
                title="Nourriture & matériel"
                description="Aider avec nourriture, cages, couvertures ou accessoires."
                checked={profile.help_food_material}
                onChange={(value) =>
                  updateField("help_food_material", value)
                }
              />

              <HelpCard
                icon="🩺"
                title="Aide vétérinaire"
                description="Participer à une prise en charge ou un accompagnement vétérinaire."
                checked={profile.help_vet}
                onChange={(value) =>
                  updateField("help_vet", value)
                }
              />

              <HelpCard
                icon="🙋"
                title="Actions bénévoles"
                description="Participer aux collectes, événements et actions sur le terrain."
                checked={profile.help_volunteer}
                onChange={(value) =>
                  updateField("help_volunteer", value)
                }
              />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
            <SectionTitle
              icon="📍"
              title="Votre mobilité"
              description="Définissez votre rayon d’intervention et vos possibilités de déplacement."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-gray-800">
                  Rayon d’intervention
                </label>

                <select
                  value={profile.help_radius_km ?? ""}
                  onChange={(event) =>
                    updateField(
                      "help_radius_km",
                      event.target.value
                        ? Number(event.target.value)
                        : null
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
                >
                  <option value="">Non renseigné</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="30">30 km</option>
                  <option value="50">50 km</option>
                  <option value="100">
                    Toute l’île / 100 km
                  </option>
                </select>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="font-black text-gray-900">
                      J’ai un moyen de transport
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Voiture ou véhicule permettant d’aider
                      lors d’une intervention.
                    </p>
                  </div>

                  <Switch
                    checked={profile.help_has_transport}
                    onChange={(value) =>
                      updateField(
                        "help_has_transport",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {profile.help_foster && (
            <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle
                icon="🏡"
                title="Famille d’accueil"
                description="Précisez vos possibilités d’accueil temporaire."
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <HelpCard
                  icon="🐶"
                  title="J’accepte les chiens"
                  description="Je peux accueillir temporairement un chien."
                  checked={profile.foster_accepts_dogs}
                  onChange={(value) =>
                    updateField(
                      "foster_accepts_dogs",
                      value
                    )
                  }
                />

                <HelpCard
                  icon="🐱"
                  title="J’accepte les chats"
                  description="Je peux accueillir temporairement un chat."
                  checked={profile.foster_accepts_cats}
                  onChange={(value) =>
                    updateField(
                      "foster_accepts_cats",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-gray-800">
                    Capacité d’accueil
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={profile.foster_capacity}
                    onChange={(event) =>
                      updateField(
                        "foster_capacity",
                        Math.max(
                          1,
                          Number(event.target.value) || 1
                        )
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-gray-800">
                    Durée possible
                  </label>

                  <select
                    value={profile.foster_duration}
                    onChange={(event) =>
                      updateField(
                        "foster_duration",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
                  >
                    <option value="">Non renseigné</option>
                    <option value="urgence">
                      Urgence / quelques heures
                    </option>
                    <option value="quelques_jours">
                      Quelques jours
                    </option>
                    <option value="1_2_semaines">
                      1 à 2 semaines
                    </option>
                    <option value="1_mois">
                      Jusqu’à 1 mois
                    </option>
                    <option value="plus_1_mois">
                      Plus d’un mois
                    </option>
                    <option value="sans_limite">
                      Jusqu’à adoption
                    </option>
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
            <SectionTitle
              icon="✍️"
              title="Précisions"
              description="Indiquez vos disponibilités, votre expérience ou toute information utile."
            />

            <textarea
              value={profile.help_notes}
              onChange={(event) =>
                updateField(
                  "help_notes",
                  event.target.value
                )
              }
              maxLength={1000}
              rows={6}
              placeholder="Exemple : disponible le week-end, véhicule avec grande cage, expérience avec les chiens craintifs..."
              className="mt-6 w-full resize-none rounded-2xl border border-gray-200 px-4 py-4 text-sm leading-6 text-gray-900 outline-none"
            />

            <div className="mt-2 text-right text-xs text-gray-400">
              {profile.help_notes.length}/1000
            </div>
          </section>
        </div>

        <div className="sticky bottom-4 z-20 mt-8">
          <div className="rounded-[24px] border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Vous pourrez modifier vos disponibilités à tout
                moment.
              </p>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ef6b55] px-7 py-3 text-sm font-black text-white transition hover:bg-[#df5d48] disabled:opacity-60"
              >
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer mon profil"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7f4ee] text-2xl">
        {icon}
      </div>

      <div>
        <h2 className="text-xl font-black text-gray-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function HelpCard({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-[#ef6b55] bg-[#fff6f3]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7f4ee] text-xl">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${
          checked
            ? "border-[#ef6b55] bg-[#ef6b55] text-white"
            : "border-gray-300 text-transparent"
        }`}
      >
        ✓
      </div>
    </button>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${
        checked ? "bg-[#ef6b55]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}