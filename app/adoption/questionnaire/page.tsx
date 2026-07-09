"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const fields = [
  {
    name: "proprietaire_animal",
    label: "Êtes-vous propriétaire d’animal ?",
    options: ["Oui", "Avant", "Première fois"],
  },
  {
    name: "animal_actuel",
    label: "Avez-vous actuellement un animal ?",
    options: ["Non", "Chien", "Chat", "Autre"],
  },
  {
    name: "adoption_pour",
    label: "Vous adoptez pour :",
    options: ["Moi", "Ma famille"],
  },
  {
    name: "enfants",
    label: "Avez-vous des enfants ?",
    options: ["Non", "Moins de 8 ans", "Plus de 8 ans", "Plus de 15 ans"],
  },
  {
    name: "jardin",
    label: "Type de jardin :",
    options: ["Clôturé", "Ouvert", "Pas de jardin"],
  },
  {
    name: "age_souhaite",
    label: "Âge souhaité :",
    options: [
      "Puppy (moins de 1 an)",
      "Young (1 à 3 ans)",
      "Adult (3 à 8 ans)",
      "Senior",
      "Aucune préférence",
    ],
  },
  {
    name: "sexe_souhaite",
    label: "Sexe souhaité :",
    options: ["Mâle", "Femelle", "Aucune préférence"],
  },
  {
    name: "taille_souhaitee",
    label: "Taille souhaitée :",
    options: [
      "Petit (0 à 10 kg)",
      "Moyen (11 à 27 kg)",
      "Large (28 à 45 kg)",
      "XL (plus de 45 kg)",
      "Aucune préférence",
    ],
  },
  {
    name: "activite_souhaitee",
    label: "Activité :",
    options: [
      "Chien de compagnie",
      "Cool Dog",
      "Actif",
      "Très actif",
      "Pas de préférence",
    ],
  },
  {
    name: "hypoallergenique",
    label: "Hypoallergénique :",
    options: ["Oui", "Non", "Pas de préférence"],
  },
  {
    name: "proprete",
    label: "Propreté :",
    options: ["Oui", "Non", "Pas de préférence"],
  },
  {
    name: "besoins_speciaux",
    label: "Ouvert à un chien avec besoins spécifiques ?",
    options: ["Oui", "Non", "Pas de préférence"],
  },
];

export default function AdoptionQuestionnairePage() {
  const router = useRouter();
  const params = useParams();
  const animalId = String(params.animalId);

  const [form, setForm] = useState<any>({
    race_souhaitee: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function submitQuestionnaire() {
    console.log("QUESTIONNAIRE :", {
      animalId,
      ...form,
    });

    alert("Questionnaire envoyé.");
    router.push(`/animal/${animalId}`);
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-black">Questionnaire adoptant</h1>

        <p className="mt-3 text-gray-600">
          Ces informations aideront l’association à vérifier la compatibilité
          avec l’animal.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-2 block font-black text-[#064b42]">
                {field.label}
              </span>

              <select
                className="input"
                value={form[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
              >
                <option value="">Sélectionner</option>

                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="block md:col-span-2">
            <span className="mb-2 block font-black text-[#064b42]">
              Race de prédilection
            </span>

            <input
              className="input"
              placeholder="Exemple : Local dog, Labrador, Berger..."
              value={form.race_souhaitee}
              onChange={(e) => updateField("race_souhaitee", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl bg-gray-100 px-6 py-4 font-black"
          >
            Retour
          </button>

          <button
            type="button"
            onClick={submitQuestionnaire}
            className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white"
          >
            Envoyer ma demande
          </button>
        </div>
      </section>
    </main>
  );
}