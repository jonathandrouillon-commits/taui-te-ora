"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { animalService } from "../../services/animal.service";

import ProgressBar from "./ProgressBar";
import Step1General from "./Step1General";
import Step2Photos from "./Step2Photos";
import Step3Health from "./Step3Health";
import Step4Character from "./Step4Character";
import Step5Story from "./Step5Story";
import Step6Location from "./Step6Location";
import Step7Preview from "./Step7Preview";

export default function AddAnimalPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const [animal, setAnimal] = useState({
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

  function updateField(field: string, value: any) {
    setAnimal((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateAnimal() {
    if (!animal.animal_name.trim()) {
      alert("Merci d’indiquer le nom de l’animal.");
      setStep(1);
      return false;
    }

    if (!animal.animal_type.trim()) {
      alert("Merci d’indiquer le type d’animal.");
      setStep(1);
      return false;
    }

    if (!animal.sex.trim()) {
      alert("Merci d’indiquer le sexe de l’animal.");
      setStep(1);
      return false;
    }

    if (!animal.island.trim()) {
      alert("Merci d’indiquer l’île.");
      setStep(6);
      return false;
    }

    return true;
  }

  async function uploadFile(file: File, animalId: string, index: number) {
    const safeName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const path = `${animalId}/photos/${Date.now()}-${index}-${safeName}`;

    const { error } = await supabase.storage
      .from("animals")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("animals").getPublicUrl(path);

    const { error: photoError } = await supabase.from("animal_photos").insert({
      animal_id: animalId,
      photo_url: data.publicUrl,
      is_cover: index === 0,
      sort_order: index,
    });

    if (photoError) throw photoError;
  }

  async function saveAnimal(publish: boolean) {
    try {
      if (!validateAnimal()) return;

      setSaving(true);

      const createdAnimal = await animalService.create({
        animal_name: animal.animal_name,
        animal_type: animal.animal_type,
        breed: animal.breed || null,
        sex: animal.sex,
        age_label: animal.age_label || null,
        size_label: animal.size_label || null,
        weight_kg: animal.weight_kg ? Number(animal.weight_kg) : null,
        island: animal.island || null,
        city: animal.city || null,
        description_character: animal.description_character || null,
        story: animal.story || null,
        health_status: animal.health_status || null,
        vaccinated: animal.vaccinated,
        sterilized: animal.sterilized,
        microchipped: animal.microchipped,
        is_published: publish,
      });

      for (let i = 0; i < photos.length; i++) {
        await uploadFile(photos[i], createdAnimal.id, i);
      }

      alert(
        publish
          ? "Animal publié avec succès."
          : "Animal enregistré en brouillon."
      );

      router.push("/association/animals");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de l’enregistrement de l’animal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-black">Ajouter un animal</h1>

        <p className="mt-2 text-gray-500">
          Créez une fiche animal complète pour l’adoption.
        </p>

        <ProgressBar step={step} />

        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-xl">
          {step === 1 && (
            <Step1General animal={animal} updateField={updateField} />
          )}

          {step === 2 && (
            <Step2Photos photos={photos} setPhotos={setPhotos} />
          )}

          {step === 3 && (
            <Step3Health animal={animal} updateField={updateField} />
          )}

          {step === 4 && (
            <Step4Character animal={animal} updateField={updateField} />
          )}

          {step === 5 && (
            <Step5Story animal={animal} updateField={updateField} />
          )}

          {step === 6 && (
            <Step6Location animal={animal} updateField={updateField} />
          )}

          {step === 7 && (
            <Step7Preview animal={animal} photos={photos} />
          )}

          <div className="mt-10 flex justify-between gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                step === 1
                  ? router.push("/association/animals")
                  : setStep(step - 1)
              }
              className="rounded-2xl bg-gray-100 px-6 py-4 font-black disabled:opacity-60"
            >
              {step === 1 ? "Annuler" : "Retour"}
            </button>

            {step < 7 ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setStep(step + 1)}
                className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-60"
              >
                Suivant
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveAnimal(false)}
                  className="rounded-2xl bg-gray-100 px-6 py-4 font-black disabled:opacity-60"
                >
                  {saving ? "Sauvegarde..." : "Brouillon"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveAnimal(true)}
                  className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-60"
                >
                  {saving ? "Publication..." : "Publier"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}