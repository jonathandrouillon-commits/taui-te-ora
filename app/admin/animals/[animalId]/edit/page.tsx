"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const animalId = params.animalId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    reference_number: "",
    animal_name: "",
    animal_type: "",
    age_label: "",
    sex: "",
    breed: "",
    size_label: "",
    association_name: "",
    street_duration: "",
    capture_location: "",
    island: "",
    city: "",
    map_address: "",
    description_character: "",
    health_status: "",
    special_needs: "",
    story: "",
    weight_kg: "",
    status: "",
    compatible_chiens: "",
    compatible_chats: "",
    compatible_enfants: "",
    is_published: false,
    is_adopted: false,
    vaccinated: false,
    sterilized: false,
    microchipped: false,
  });

  useEffect(() => {
    checkAdminAndLoadAnimal();
  }, []);

  async function checkAdminAndLoadAnimal() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/admin/animals/${animalId}/edit`);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }

    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("id", animalId)
      .maybeSingle();

    if (error) {
      alert(error.message);
      router.push("/admin/animals");
      return;
    }

    if (!data) {
      alert("Animal introuvable.");
      router.push("/admin/animals");
      return;
    }

    setForm({
      reference_number: data.reference_number || "",
      animal_name: data.animal_name || "",
      animal_type: data.animal_type || "",
      age_label: data.age_label || "",
      sex: data.sex || "",
      breed: data.breed || "",
      size_label: data.size_label || "",
      association_name: data.association_name || "",
      street_duration: data.street_duration || "",
      capture_location: data.capture_location || "",
      island: data.island || "",
      city: data.city || "",
      map_address: data.map_address || "",
      description_character: data.description_character || "",
      health_status: data.health_status || "",
      special_needs: data.special_needs || "",
      story: data.story || "",
      weight_kg: data.weight_kg ? String(data.weight_kg) : "",
      status: data.status || "",
      compatible_chiens: data.compatible_chiens || "",
      compatible_chats: data.compatible_chats || "",
      compatible_enfants: data.compatible_enfants || "",
      is_published: data.is_published || false,
      is_adopted: data.is_adopted || false,
      vaccinated: data.vaccinated || false,
      sterilized: data.sterilized || false,
      microchipped: data.microchipped || false,
    });

    setLoading(false);
  }

  function updateField(name: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveAnimal() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("animals")
        .update({
          reference_number: form.reference_number,
          animal_name: form.animal_name,
          animal_type: form.animal_type,
          age_label: form.age_label,
          sex: form.sex,
          breed: form.breed,
          size_label: form.size_label,
          association_name: form.association_name,
          street_duration: form.street_duration,
          capture_location: form.capture_location,
          island: form.island,
          city: form.city,
          map_address: form.map_address,
          description_character: form.description_character,
          health_status: form.health_status,
          special_needs: form.special_needs,
          story: form.story,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          status: form.status,
          compatible_chiens: form.compatible_chiens,
          compatible_chats: form.compatible_chats,
          compatible_enfants: form.compatible_enfants,
          is_published: form.is_published,
          is_adopted: form.is_adopted,
          vaccinated: form.vaccinated,
          sterilized: form.sterilized,
          microchipped: form.microchipped,
          updated_at: new Date().toISOString(),
        })
        .eq("id", animalId);

      if (error) throw error;

      alert("Profil animal mis à jour.");
      router.push("/admin/animals");
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnimal() {
    const confirmDelete = confirm("Supprimer définitivement cet animal ?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("animals")
      .delete()
      .eq("id", animalId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Animal supprimé.");
    router.push("/admin/animals");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">
          Chargement du profil animal...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#064b42]">
              Modifier le profil animal
            </h1>
            <p className="mt-2 text-[#6f5a47]">
              Gestion complète du profil, de la publication et du statut.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/animals")}
            className="rounded-full bg-white px-6 py-3 font-bold text-[#064b42] shadow"
          >
            Retour
          </button>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Informations principales
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Référence" value={form.reference_number} onChange={(v) => updateField("reference_number", v)} />
            <Input label="Nom de l'animal" value={form.animal_name} onChange={(v) => updateField("animal_name", v)} />
            <Input label="Type" value={form.animal_type} onChange={(v) => updateField("animal_type", v)} />
            <Input label="Âge" value={form.age_label} onChange={(v) => updateField("age_label", v)} />
            <Input label="Sexe" value={form.sex} onChange={(v) => updateField("sex", v)} />
            <Input label="Race" value={form.breed} onChange={(v) => updateField("breed", v)} />
            <Input label="Taille" value={form.size_label} onChange={(v) => updateField("size_label", v)} />
            <Input label="Poids kg" value={form.weight_kg} onChange={(v) => updateField("weight_kg", v)} />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Association et localisation
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Association" value={form.association_name} onChange={(v) => updateField("association_name", v)} />
            <Input label="Île" value={form.island} onChange={(v) => updateField("island", v)} />
            <Input label="Ville" value={form.city} onChange={(v) => updateField("city", v)} />
            <Input label="Adresse carte" value={form.map_address} onChange={(v) => updateField("map_address", v)} />
            <Input label="Lieu de capture" value={form.capture_location} onChange={(v) => updateField("capture_location", v)} />
            <Input label="Temps dans la rue" value={form.street_duration} onChange={(v) => updateField("street_duration", v)} />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Description complète
          </h2>

          <div className="space-y-5">
            <Textarea label="Caractère" value={form.description_character} onChange={(v) => updateField("description_character", v)} />
            <Textarea label="Histoire" value={form.story} onChange={(v) => updateField("story", v)} />
            <Textarea label="État de santé" value={form.health_status} onChange={(v) => updateField("health_status", v)} />
            <Textarea label="Besoins particuliers" value={form.special_needs} onChange={(v) => updateField("special_needs", v)} />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-[#2f241c]">
            Compatibilités et statut
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Compatible chiens" value={form.compatible_chiens} onChange={(v) => updateField("compatible_chiens", v)} />
            <Input label="Compatible chats" value={form.compatible_chats} onChange={(v) => updateField("compatible_chats", v)} />
            <Input label="Compatible enfants" value={form.compatible_enfants} onChange={(v) => updateField("compatible_enfants", v)} />
            <Input label="Statut" value={form.status} onChange={(v) => updateField("status", v)} />

            <BooleanSelect label="Publié" value={form.is_published} onChange={(v) => updateField("is_published", v)} />
            <BooleanSelect label="Adopté" value={form.is_adopted} onChange={(v) => updateField("is_adopted", v)} />
            <BooleanSelect label="Vacciné" value={form.vaccinated} onChange={(v) => updateField("vaccinated", v)} />
            <BooleanSelect label="Stérilisé" value={form.sterilized} onChange={(v) => updateField("sterilized", v)} />
            <BooleanSelect label="Pucé" value={form.microchipped} onChange={(v) => updateField("microchipped", v)} />
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={saveAnimal}
            disabled={saving}
            className="rounded-full bg-[#064b42] px-8 py-4 font-bold text-white shadow disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>

          <button
            onClick={deleteAnimal}
            className="rounded-full bg-red-600 px-8 py-4 font-bold text-white shadow"
          >
            Supprimer
          </button>

          <button
            onClick={() => router.push("/admin/animals")}
            className="rounded-full bg-white px-8 py-4 font-bold text-[#064b42] shadow"
          >
            Annuler
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
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

function BooleanSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <select
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      >
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </select>
    </div>
  );
}