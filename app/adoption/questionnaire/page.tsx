"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdoptionQuestionnairePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    adopter_experience: "",
    current_animals: "",
    adoption_for: "",
    children_age: "",
    garden_type: "",
    ideal_age: "",
    ideal_sex: "",
    ideal_size: "",
    ideal_activity: "",
    ideal_breed: "",
    hypoallergenic: "",
    cleanliness: "",
    special_needs: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/adoption/questionnaire");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setForm({
      adopter_experience: data?.adopter_experience || "",
      current_animals: data?.current_animals || "",
      adoption_for: data?.adoption_for || "",
      children_age: data?.children_age || "",
      garden_type: data?.garden_type || "",
      ideal_age: data?.ideal_age || "",
      ideal_sex: data?.ideal_sex || "",
      ideal_size: data?.ideal_size || "",
      ideal_activity: data?.ideal_activity || "",
      ideal_breed: data?.ideal_breed || "",
      hypoallergenic: data?.hypoallergenic || "",
      cleanliness: data?.cleanliness || "",
      special_needs: data?.special_needs || "",
    });

    setLoading(false);
  }

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveQuestionnaire() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/adoption/questionnaire");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Questionnaire enregistré.");
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-black text-[#064b42]">
          Questionnaire adoptant
        </h1>

        <p className="mt-2 text-[#6f5a47]">
          Ces informations seront utilisées pour vos futures demandes d'adoption.
        </p>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Expérience avec les animaux"
              value={form.adopter_experience}
              onChange={(v) => updateField("adopter_experience", v)}
              options={["Débutant", "Intermédiaire", "Expérimenté"]}
            />

            <Select
              label="Avez-vous déjà des animaux ?"
              value={form.current_animals}
              onChange={(v) => updateField("current_animals", v)}
              options={["Non", "Oui, chien", "Oui, chat", "Oui, plusieurs animaux"]}
            />

            <Select
              label="Adoption pour"
              value={form.adoption_for}
              onChange={(v) => updateField("adoption_for", v)}
              options={["Moi", "Ma famille", "Une personne proche"]}
            />

            <Select
              label="Avez-vous des enfants ?"
              value={form.children_age}
              onChange={(v) => updateField("children_age", v)}
              options={["Non", "Oui, moins de 6 ans", "Oui, 6 à 12 ans", "Oui, plus de 12 ans"]}
            />

            <Select
              label="Jardin / extérieur"
              value={form.garden_type}
              onChange={(v) => updateField("garden_type", v)}
              options={["Pas de jardin", "Petit jardin", "Grand jardin", "Terrain clôturé"]}
            />

            <Select
              label="Âge souhaité"
              value={form.ideal_age}
              onChange={(v) => updateField("ideal_age", v)}
              options={["Aucune préférence", "Chiot", "Jeune", "Adulte", "Senior"]}
            />

            <Select
              label="Sexe souhaité"
              value={form.ideal_sex}
              onChange={(v) => updateField("ideal_sex", v)}
              options={["Aucune préférence", "Mâle", "Femelle"]}
            />

            <Select
              label="Taille souhaitée"
              value={form.ideal_size}
              onChange={(v) => updateField("ideal_size", v)}
              options={["Aucune préférence", "Petit", "Moyen", "Grand"]}
            />

            <Select
              label="Activité souhaitée"
              value={form.ideal_activity}
              onChange={(v) => updateField("ideal_activity", v)}
              options={["Calme", "Modérée", "Active", "Très active"]}
            />

            <Input
              label="Race souhaitée"
              value={form.ideal_breed}
              onChange={(v) => updateField("ideal_breed", v)}
            />

            <Select
              label="Animal hypoallergénique"
              value={form.hypoallergenic}
              onChange={(v) => updateField("hypoallergenic", v)}
              options={["Pas de préférence", "Oui", "Non"]}
            />

            <Select
              label="Propreté"
              value={form.cleanliness}
              onChange={(v) => updateField("cleanliness", v)}
              options={["Pas de préférence", "Déjà propre", "Peut être éduqué"]}
            />
          </div>

          <div className="mt-5">
            <Textarea
              label="Besoins particuliers acceptés"
              value={form.special_needs}
              onChange={(v) => updateField("special_needs", v)}
            />
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={saveQuestionnaire}
              disabled={saving}
              className="rounded-full bg-[#064b42] px-8 py-4 font-bold text-white transition hover:bg-[#0a6659] disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer mon questionnaire"}
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-white px-8 py-4 font-bold text-[#064b42] shadow"
            >
              Retour dashboard
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      >
        <option value="">Sélectionner</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}