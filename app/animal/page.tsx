"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { animalService } from "../../../services/animal.service";
import { supabase } from "../../../lib/supabase";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);

  const [animal, setAnimal] = useState<any>({
    animal_name: "",
    animal_type: "Chien",
    breed: "",
    sex: "Femelle",
    age_label: "",
    size_label: "",
    weight_kg: "",
    island: "",
    city: "",
    description_character: "",
    story: "",
    health_status: "",
    vaccinated: false,
    sterilized: false,
    microchipped: false,
    is_published: false,
  });

  useEffect(() => {
    loadAnimal();
  }, []);

  async function loadAnimal() {
    const data = await animalService.getById(id);

    setAnimal({
      animal_name: data.animal_name || "",
      animal_type: data.animal_type || "Chien",
      breed: data.breed || "",
      sex: data.sex || "Femelle",
      age_label: data.age_label || "",
      size_label: data.size_label || "",
      weight_kg: data.weight_kg || "",
      island: data.island || "",
      city: data.city || "",
      description_character: data.description_character || "",
      story: data.story || "",
      health_status: data.health_status || "",
      vaccinated: data.vaccinated || false,
      sterilized: data.sterilized || false,
      microchipped: data.microchipped || false,
      is_published: data.is_published || false,
    });

    setLoading(false);
  }

  function updateField(field: string, value: any) {
    setAnimal((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function uploadFile(file: File, path: string) {
    const { error } = await supabase.storage
      .from("animals")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("animals").getPublicUrl(path);
    return data.publicUrl;
  }

  async function updateAnimal() {
    try {
      setSaving(true);

      await animalService.update(id, {
        ...animal,
        weight_kg: animal.weight_kg ? Number(animal.weight_kg) : null,
      });

      if (coverPhoto) {
        await supabase
          .from("animal_photos")
          .update({ is_cover: false })
          .eq("animal_id", id);

        const photoPath = `${id}/photos/${Date.now()}-${coverPhoto.name}`;
        const photoUrl = await uploadFile(coverPhoto, photoPath);

        await supabase.from("animal_photos").insert({
          animal_id: id,
          photo_url: photoUrl,
          is_cover: true,
          sort_order: 0,
        });
      }

      router.push("/association/animals");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center text-[#064b42] font-black">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-black">Modifier l'animal</h1>

        <Card className="mt-10 space-y-8">
          <div>
            <h2 className="mb-5 text-3xl font-black">
              Informations générales
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                placeholder="Nom de l'animal"
                value={animal.animal_name}
                onChange={(v) => updateField("animal_name", v)}
              />

              <Input
                placeholder="Race"
                value={animal.breed}
                onChange={(v) => updateField("breed", v)}
              />

              <Input
                placeholder="Âge estimé"
                value={animal.age_label}
                onChange={(v) => updateField("age_label", v)}
              />

              <Input
                placeholder="Taille"
                value={animal.size_label}
                onChange={(v) => updateField("size_label", v)}
              />

              <Input
                placeholder="Poids en kg"
                value={String(animal.weight_kg)}
                onChange={(v) => updateField("weight_kg", v)}
              />

              <Input
                placeholder="État de santé"
                value={animal.health_status}
                onChange={(v) => updateField("health_status", v)}
              />

              <Input
                placeholder="Île"
                value={animal.island}
                onChange={(v) => updateField("island", v)}
              />

              <Input
                placeholder="Commune"
                value={animal.city}
                onChange={(v) => updateField("city", v)}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-5 text-3xl font-black">Nouvelle photo</h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
              className="w-full rounded-2xl bg-white p-5"
            />
          </div>

          <div>
            <h2 className="mb-5 text-3xl font-black">Santé</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <input
                  type="checkbox"
                  checked={animal.vaccinated}
                  onChange={(e) => updateField("vaccinated", e.target.checked)}
                  className="mr-3"
                />
                Vacciné
              </label>

              <label className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <input
                  type="checkbox"
                  checked={animal.sterilized}
                  onChange={(e) => updateField("sterilized", e.target.checked)}
                  className="mr-3"
                />
                Stérilisé
              </label>

              <label className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <input
                  type="checkbox"
                  checked={animal.microchipped}
                  onChange={(e) =>
                    updateField("microchipped", e.target.checked)
                  }
                  className="mr-3"
                />
                Identifié
              </label>
            </div>
          </div>

          <textarea
            placeholder="Caractère de l'animal..."
            value={animal.description_character}
            onChange={(e) =>
              updateField("description_character", e.target.value)
            }
            className="min-h-40 w-full rounded-2xl border bg-white px-5 py-4 text-lg outline-none"
          />

          <textarea
            placeholder="Son histoire..."
            value={animal.story}
            onChange={(e) => updateField("story", e.target.value)}
            className="min-h-40 w-full rounded-2xl border bg-white px-5 py-4 text-lg outline-none"
          />

          <div className="flex justify-between gap-4 pt-6">
            <Button
              variant="secondary"
              onClick={() => router.push("/association/animals")}
            >
              Annuler
            </Button>

            <Button onClick={updateAnimal}>
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}