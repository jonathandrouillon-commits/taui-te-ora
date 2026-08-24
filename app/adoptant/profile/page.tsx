"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdoptantProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileId, setProfileId] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    email: "",
    island: "",
    city: "",
    address: "",
    postal_code: "",

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
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/adoptant/profile");
        return;
      }

      setProfileId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setForm({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        birth_date: data?.birth_date || "",
        phone: data?.phone || "",
        email: data?.email || user.email || "",
        island: data?.island || "",
        city: data?.city || "",
        address: data?.address || "",
        postal_code: data?.postal_code || "",

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
    } catch (error: any) {
      alert(error.message || "Erreur lors du chargement du profil.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveProfile() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date || null,
          phone: form.phone,
          email: form.email,
          island: form.island,
          city: form.city,
          address: form.address,
          postal_code: form.postal_code,

          adopter_experience: form.adopter_experience,
          current_animals: form.current_animals,
          adoption_for: form.adoption_for,
          children_age: form.children_age,
          garden_type: form.garden_type,
          ideal_age: form.ideal_age,
          ideal_sex: form.ideal_sex,
          ideal_size: form.ideal_size,
          ideal_activity: form.ideal_activity,
          ideal_breed: form.ideal_breed,
          hypoallergenic: form.hypoallergenic,
          cleanliness: form.cleanliness,
          special_needs: form.special_needs,
        })
        .eq("id", profileId);

      if (error) throw error;

      alert("Profil mis à jour avec succès.");
      router.push("/profile");
    } catch (error: any) {
      alert(error.message || "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">Chargement du profil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-[#064b42]">
            Mon profil adoptant
          </h1>
          <p className="mt-2 text-[#6f5a47]">
            Modifiez vos informations personnelles et votre questionnaire
            d&apos;adoption.
          </p>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Informations personnelles
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Prénom" value={form.first_name} onChange={(v) => updateField("first_name", v)} />
            <Input label="Nom" value={form.last_name} onChange={(v) => updateField("last_name", v)} />
            <Input label="Date de naissance" type="date" value={form.birth_date} onChange={(v) => updateField("birth_date", v)} />
            <Input label="Téléphone" value={form.phone} onChange={(v) => updateField("phone", v)} />
            <Input label="Email" value={form.email} onChange={(v) => updateField("email", v)} />
            <Input label="Île" value={form.island} onChange={(v) => updateField("island", v)} />
            <Input label="Ville" value={form.city} onChange={(v) => updateField("city", v)} />
            <Input label="Code postal" value={form.postal_code} onChange={(v) => updateField("postal_code", v)} />
          </div>

          <div className="mt-5">
            <Input label="Adresse" value={form.address} onChange={(v) => updateField("address", v)} />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Questionnaire adoptant
          </h2>

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
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="rounded-full bg-[#064b42] px-8 py-4 font-bold text-white transition hover:bg-[#0a6659] disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-full bg-white px-8 py-4 font-bold text-[#064b42] shadow"
          >
            Retour à mon espace
          </button>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <input
        type={type}
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
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
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
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}