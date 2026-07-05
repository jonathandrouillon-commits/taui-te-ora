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
    setAnimal((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadFile(file: File, animalId: string, index: number) {
    const path = `${animalId}/photos/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("animals")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("animals").getPublicUrl(path);

    await supabase.from("animal_photos").insert({
      animal_id: animalId,
      photo_url: data.publicUrl,
      is_cover: index === 0,
      sort_order: index,
    });
  }

  async function saveAnimal(publish: boolean) {
    try {
      setSaving(true);

      const createdAnimal = await animalService.create({
        ...animal,
        weight_kg: animal.weight_kg ? Number(animal.weight_kg) : null,
        is_published: publish,
      });

      for (let i = 0; i < photos.length; i++) {
        await uploadFile(photos[i], createdAnimal.id, i);
      }

      router.push("/association/animals");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-black">Ajouter un animal</h1>
        <p className="mt-2 text-gray-500">
          Créez une fiche animal complète.
        </p>

        <ProgressBar step={step} />

        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-xl">
          {step === 1 && <Step1General animal={animal} updateField={updateField} />}
          {step === 2 && <Step2Photos photos={photos} setPhotos={setPhotos} />}
          {step === 3 && <Step3Health animal={animal} updateField={updateField} />}
          {step === 4 && <Step4Character animal={animal} updateField={updateField} />}
          {step === 5 && <Step5Story animal={animal} updateField={updateField} />}
          {step === 6 && <Step6Location animal={animal} updateField={updateField} />}
          {step === 7 && <Step7Preview animal={animal} photos={photos} />}

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => (step === 1 ? router.push("/association/animals") : setStep(step - 1))}
              className="rounded-2xl bg-gray-100 px-6 py-4 font-black"
            >
              {step === 1 ? "Annuler" : "Retour"}
            </button>

            {step < 7 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white"
              >
                Suivant
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => saveAnimal(false)}
                  className="rounded-2xl bg-gray-100 px-6 py-4 font-black"
                >
                  {saving ? "Sauvegarde..." : "Brouillon"}
                </button>

                <button
                  onClick={() => saveAnimal(true)}
                  className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white"
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