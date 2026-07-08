"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Animal = {
  id: string;
  animal_name: string;
  animal_type: string;
  age_label: string;
  sex: string;
  breed: string;
  size_label: string;
  association_name: string;
  island: string;
  city: string;
  status: string;
  is_published: boolean;
  is_adopted: boolean;
};

export default function AdminAnimalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Animal>>({});

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/admin/animals");
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

    await loadAnimals();
  }

  async function loadAnimals() {
    setLoading(true);

    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setAnimals((data || []) as Animal[]);
    }

    setLoading(false);
  }

  function startEdit(animal: Animal) {
    setEditingId(animal.id);
    setForm(animal);
  }

  function updateField(name: keyof Animal, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveAnimal(id: string) {
    const { error } = await supabase
      .from("animals")
      .update({
        animal_name: form.animal_name,
        animal_type: form.animal_type,
        age_label: form.age_label,
        sex: form.sex,
        breed: form.breed,
        size_label: form.size_label,
        association_name: form.association_name,
        island: form.island,
        city: form.city,
        status: form.status,
        is_published: form.is_published,
        is_adopted: form.is_adopted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setForm({});
    await loadAnimals();
  }

  async function deleteAnimal(id: string) {
    const confirmDelete = confirm(
      "Voulez-vous vraiment supprimer cet animal ? Cette action est définitive."
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("animals")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAnimals();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">Chargement des animaux...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#064b42]">
              Administration des animaux
            </h1>
            <p className="mt-2 text-[#6f5a47]">
              Modifier, publier ou supprimer les profils animaux.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-full bg-white px-6 py-3 font-bold text-[#064b42] shadow"
          >
            Retour admin
          </button>
        </div>

        <div className="space-y-5">
          {animals.map((animal) => {
            const isEditing = editingId === animal.id;

            return (
              <div
                key={animal.id}
                className="rounded-[2rem] bg-white p-6 shadow-md"
              >
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input label="Nom" value={form.animal_name || ""} onChange={(v) => updateField("animal_name", v)} />
                    <Input label="Type" value={form.animal_type || ""} onChange={(v) => updateField("animal_type", v)} />
                    <Input label="Âge" value={form.age_label || ""} onChange={(v) => updateField("age_label", v)} />
                    <Input label="Sexe" value={form.sex || ""} onChange={(v) => updateField("sex", v)} />
                    <Input label="Race" value={form.breed || ""} onChange={(v) => updateField("breed", v)} />
                    <Input label="Taille" value={form.size_label || ""} onChange={(v) => updateField("size_label", v)} />
                    <Input label="Association" value={form.association_name || ""} onChange={(v) => updateField("association_name", v)} />
                    <Input label="Île" value={form.island || ""} onChange={(v) => updateField("island", v)} />
                    <Input label="Ville" value={form.city || ""} onChange={(v) => updateField("city", v)} />
                    <Input label="Statut" value={form.status || ""} onChange={(v) => updateField("status", v)} />

                    <SelectBoolean
                      label="Publié"
                      value={!!form.is_published}
                      onChange={(v) => updateField("is_published", v)}
                    />

                    <SelectBoolean
                      label="Adopté"
                      value={!!form.is_adopted}
                      onChange={(v) => updateField("is_adopted", v)}
                    />

                    <div className="md:col-span-3 flex gap-3 pt-4">
                      <button
                        onClick={() => saveAnimal(animal.id)}
                        className="rounded-full bg-[#064b42] px-6 py-3 font-bold text-white"
                      >
                        Enregistrer
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setForm({});
                        }}
                        className="rounded-full bg-gray-100 px-6 py-3 font-bold text-gray-700"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#2f241c]">
                        {animal.animal_name || "Animal sans nom"}
                      </h2>

                      <p className="mt-1 text-[#6f5a47]">
                        {animal.animal_type || "Type non renseigné"} ·{" "}
                        {animal.age_label || "Âge non renseigné"} ·{" "}
                        {animal.sex || "Sexe non renseigné"}
                      </p>

                      <p className="mt-1 text-sm text-[#9c7b54]">
                        {animal.association_name || "Association non renseignée"} ·{" "}
                        {animal.city || "Ville non renseignée"} ·{" "}
                        {animal.island || "Île non renseignée"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge text={animal.is_published ? "Publié" : "Non publié"} />
                        <Badge text={animal.is_adopted ? "Adopté" : "Disponible"} />
                        <Badge text={animal.status || "Statut vide"} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/admin/animals/${animal.id}/edit`)}
                        className="rounded-full bg-[#9c7b54] px-5 py-3 font-bold text-white"
                      >
                        Modifier
                      </button>

                      <button
                        onClick={() => deleteAnimal(animal.id)}
                        className="rounded-full bg-red-600 px-5 py-3 font-bold text-white"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

function SelectBoolean({
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

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-xs font-bold text-[#6f5a47]">
      {text}
    </span>
  );
}