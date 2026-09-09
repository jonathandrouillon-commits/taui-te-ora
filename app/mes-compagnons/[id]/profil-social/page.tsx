"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  PawPrint,
  Save,
  Sparkles,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

type Companion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  photo_url: string | null;
  is_deceased: boolean;
  social_enabled: boolean;
  social_energy: string | null;
  social_dogs: string | null;
  social_cats: string | null;
  social_play: string | null;
  social_size: string | null;
  social_preferred_sizes: string[];
  social_temperaments: string[];
  social_meeting_types: string[];
  social_notes: string | null;
};

const ENERGY_OPTIONS = [
  { value: "calme", label: "🌿 Calme" },
  { value: "modere", label: "🐾 Modéré" },
  { value: "sportif", label: "⚡ Sportif" },
];

const SOCIAL_OPTIONS = [
  { value: "oui", label: "✅ Oui" },
  { value: "a_tester", label: "🤔 À tester" },
  { value: "non", label: "❌ Non" },
];

const PLAY_OPTIONS = [
  { value: "oui", label: "🎾 Oui" },
  { value: "parfois", label: "🙂 Parfois" },
  { value: "non", label: "🌿 Non" },
];

const SIZE_OPTIONS = [
  { value: "petit", label: "Petit" },
  { value: "moyen", label: "Moyen" },
  { value: "grand", label: "Grand" },
];

const TEMPERAMENT_OPTIONS = [
  { value: "calme", label: "🌿 Calme" },
  { value: "joueur", label: "🎾 Joueur" },
  { value: "sociable", label: "🤝 Sociable" },
  { value: "timide", label: "🌸 Timide" },
  { value: "independant", label: "✨ Indépendant" },
  { value: "energique", label: "⚡ Énergique" },
  { value: "reactif", label: "⚠️ Réactif" },
];

const MEETING_OPTIONS = [
  { value: "balade", label: "🐾 Balade" },
  { value: "jeu", label: "🎾 Jeu" },
  { value: "sociabilisation", label: "🤝 Sociabilisation" },
  { value: "compagnie", label: "❤️ Compagnie" },
];

export default function CompanionSocialProfilePage() {
  const router = useRouter();
  const params = useParams();
  const companionId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [socialEnabled, setSocialEnabled] = useState(false);
  const [energy, setEnergy] = useState("");
  const [dogs, setDogs] = useState("");
  const [cats, setCats] = useState("");
  const [play, setPlay] = useState("");
  const [size, setSize] = useState("");
  const [preferredSizes, setPreferredSizes] = useState<string[]>([]);
  const [temperaments, setTemperaments] = useState<string[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("companions")
          .select(`
            id,
            owner_id,
            name,
            species,
            photo_url,
            is_deceased,
            social_enabled,
            social_energy,
            social_dogs,
            social_cats,
            social_play,
            social_size,
            social_preferred_sizes,
            social_temperaments,
            social_meeting_types,
            social_notes
          `)
          .eq("id", companionId)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        if (!data) {
          setErrorMessage("Compagnon introuvable.");
          return;
        }

        const item = data as Companion;

        if (item.owner_id !== user.id) {
          setErrorMessage(
            "Seul le propriétaire peut modifier le profil social de ce compagnon."
          );
          return;
        }

        if (item.is_deceased) {
          setErrorMessage(
            "Le profil social n'est pas disponible pour un compagnon décédé."
          );
          return;
        }

        setCompanion(item);
        setSocialEnabled(Boolean(item.social_enabled));
        setEnergy(item.social_energy || "");
        setDogs(item.social_dogs || "");
        setCats(item.social_cats || "");
        setPlay(item.social_play || "");
        setSize(item.social_size || "");
        setPreferredSizes(item.social_preferred_sizes || []);
        setTemperaments(item.social_temperaments || []);
        setMeetingTypes(item.social_meeting_types || []);
        setNotes(item.social_notes || "");
      } catch (error) {
        console.error("Erreur profil social :", error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger le profil social."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (companionId) void load();

    return () => {
      active = false;
    };
  }, [companionId, router]);

  function toggleArray(
    value: string,
    current: string[],
    setter: (values: string[]) => void
  ) {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  }

  async function saveProfile() {
    if (!companion || saving) return;

    if (socialEnabled) {
      if (!energy) {
        alert("Choisis le niveau d'énergie.");
        return;
      }

      if (!size) {
        alert("Indique la taille de ton compagnon.");
        return;
      }

      if (meetingTypes.length === 0) {
        alert("Choisis au moins un type de rencontre.");
        return;
      }
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user || user.id !== companion.owner_id) {
        throw new Error(
          "Vous devez être connecté avec le compte propriétaire."
        );
      }

      const { error } = await supabase
        .from("companions")
        .update({
          social_enabled: socialEnabled,
          social_energy: energy || null,
          social_dogs: dogs || null,
          social_cats: cats || null,
          social_play: play || null,
          social_size: size || null,
          social_preferred_sizes: preferredSizes,
          social_temperaments: temperaments,
          social_meeting_types: meetingTypes,
          social_notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companion.id)
        .eq("owner_id", user.id);

      if (error) throw error;

      alert(
        socialEnabled
          ? `Le profil social de ${companion.name} est prêt 🐾`
          : `Le profil social de ${companion.name} a été enregistré.`
      );

      router.push(`/mes-compagnons/${companion.id}`);
      router.refresh();
    } catch (error) {
      console.error("Erreur sauvegarde profil social :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le profil social."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />
          <p className="mt-4 font-black text-[#064b42]">
            Chargement du profil social...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !companion) {
    return (
      <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8">
        <section className="mx-auto max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl">
          <div className="text-6xl">🐾</div>
          <h1 className="mt-4 text-2xl font-black text-[#064b42]">
            Profil social indisponible
          </h1>
          <p className="mt-3 text-[#756d67]">
            {errorMessage || "Cette fiche n'est pas disponible."}
          </p>
          <Link
            href={`/mes-compagnons/${companionId}`}
            className="mt-6 inline-flex rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour au compagnon
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <div className="overflow-hidden rounded-[32px] border border-[#e4cfaa] bg-[#fffaf7] shadow-xl">
          <div className="bg-[#064b42] p-6 text-white sm:p-8">
            <div className="flex items-center gap-4">
              {companion.photo_url ? (
                <img
                  src={companion.photo_url}
                  alt={companion.name}
                  className="h-20 w-20 rounded-full border-4 border-white/30 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl">
                  🐾
                </div>
              )}

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c2c8]">
                  Balades & Copains
                </p>
                <h1 className="mt-1 text-3xl font-black">
                  Profil social de {companion.name}
                </h1>
                <p className="mt-2 text-sm text-white/75">
                  Aide Taui Te Ora à lui proposer les bonnes rencontres.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-[24px] bg-[#fce8ec] p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 shrink-0 text-[#d76f7e]" size={22} />
                <div>
                  <h2 className="font-black text-[#064b42]">
                    Participer à Balades & Copains
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#756d67]">
                    En activant ce profil, {companion.name} pourra être proposé
                    aux autres compagnons compatibles.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSocialEnabled((value) => !value)}
                className={`mt-4 flex w-full items-center justify-between rounded-[18px] px-5 py-4 text-left font-black transition ${
                  socialEnabled
                    ? "bg-[#064b42] text-white"
                    : "bg-white text-[#064b42]"
                }`}
              >
                <span>
                  {socialEnabled
                    ? "Profil social activé"
                    : "Activer le profil social"}
                </span>

                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    socialEnabled
                      ? "bg-white text-[#064b42]"
                      : "bg-[#f1e8dc]"
                  }`}
                >
                  {socialEnabled ? <Check size={17} /> : <PawPrint size={16} />}
                </span>
              </button>
            </div>

            <ChoiceSection
              title="Niveau d'énergie"
              subtitle="Quel rythme lui correspond le mieux ?"
              options={ENERGY_OPTIONS}
              value={energy}
              onChange={setEnergy}
            />

            <ChoiceSection
              title="Sociabilité avec les chiens"
              options={SOCIAL_OPTIONS}
              value={dogs}
              onChange={setDogs}
            />

            <ChoiceSection
              title="Sociabilité avec les chats"
              options={SOCIAL_OPTIONS}
              value={cats}
              onChange={setCats}
            />

            <ChoiceSection
              title="Aime jouer"
              options={PLAY_OPTIONS}
              value={play}
              onChange={setPlay}
            />

            <ChoiceSection
              title="Taille de mon compagnon"
              options={SIZE_OPTIONS}
              value={size}
              onChange={setSize}
            />

            <MultiChoiceSection
              title="Tailles de copains préférées"
              subtitle="Tu peux en choisir plusieurs. Ne rien sélectionner = aucune préférence."
              options={SIZE_OPTIONS}
              values={preferredSizes}
              onToggle={(value) =>
                toggleArray(value, preferredSizes, setPreferredSizes)
              }
            />

            <MultiChoiceSection
              title="Son tempérament"
              subtitle="Choisis tout ce qui lui correspond."
              options={TEMPERAMENT_OPTIONS}
              values={temperaments}
              onToggle={(value) =>
                toggleArray(value, temperaments, setTemperaments)
              }
            />

            <MultiChoiceSection
              title="Que recherchez-vous ?"
              subtitle="Au moins un choix lorsque le profil social est activé."
              options={MEETING_OPTIONS}
              values={meetingTypes}
              onToggle={(value) =>
                toggleArray(value, meetingTypes, setMeetingTypes)
              }
            />

            <div className="rounded-[24px] bg-white p-5 shadow-sm">
              <h2 className="font-black text-[#064b42]">
                Quelques précisions
              </h2>
              <p className="mt-1 text-sm text-[#756d67]">
                Une information utile avant une rencontre ou une balade.
              </p>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                maxLength={1000}
                placeholder={`${companion.name} aime les rencontres calmes, préfère marcher avant de jouer...`}
                className="mt-4 w-full resize-y rounded-[18px] border border-[#e5d8cd] bg-[#fffaf7] px-4 py-3 leading-6 outline-none focus:border-[#df8995]"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {notes.length}/1000
              </p>
            </div>

            <div className="rounded-[22px] bg-[#eaf5f1] p-4 text-sm leading-6 text-[#49685f]">
              🐾 Le profil social sert à proposer des rencontres. Il ne garantit
              jamais que deux animaux s'entendront : les propriétaires restent
              responsables de la rencontre et de la sécurité de leurs animaux.
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? "Enregistrement..." : "Enregistrer le profil social"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChoiceSection({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[#064b42]">{title}</h2>

      {subtitle && (
        <p className="mt-1 text-sm text-[#756d67]">{subtitle}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(selected ? "" : option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                selected
                  ? "border-[#064b42] bg-[#064b42] text-white"
                  : "border-[#e5d8cd] bg-[#fffaf7] text-[#6f625a]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiChoiceSection({
  title,
  subtitle,
  options,
  values,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[#064b42]">{title}</h2>

      {subtitle && (
        <p className="mt-1 text-sm text-[#756d67]">{subtitle}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                selected
                  ? "border-[#df8995] bg-[#fce8ec] text-[#a64f5d]"
                  : "border-[#e5d8cd] bg-[#fffaf7] text-[#6f625a]"
              }`}
            >
              {selected && "✓ "}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
