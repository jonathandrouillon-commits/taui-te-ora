"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

const fields = [
  {
    name: "proprietaire_animal",
    label: "Êtes-vous propriétaire d’un animal ?",
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
    label: "Ouvert à un chien avec des besoins spécifiques ?",
    options: ["Oui", "Non", "Pas de préférence"],
  },
];

type FormData = {
  proprietaire_animal: string;
  animal_actuel: string;
  adoption_pour: string;
  enfants: string;
  jardin: string;
  age_souhaite: string;
  sexe_souhaite: string;
  taille_souhaitee: string;
  activite_souhaitee: string;
  hypoallergenique: string;
  proprete: string;
  besoins_speciaux: string;
  race_souhaitee: string;
};

const initialForm: FormData = {
  proprietaire_animal: "",
  animal_actuel: "",
  adoption_pour: "",
  enfants: "",
  jardin: "",
  age_souhaite: "",
  sexe_souhaite: "",
  taille_souhaitee: "",
  activite_souhaitee: "",
  hypoallergenique: "",
  proprete: "",
  besoins_speciaux: "",
  race_souhaitee: "",
};

export default function AdoptionQuestionnairePage() {
  const router = useRouter();
  const params = useParams();

  const animalId = Array.isArray(params.animalId)
    ? params.animalId[0]
    : String(params.animalId || "");

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function questionnaireComplet() {
    return fields.every((field) => {
      const fieldName = field.name as keyof FormData;
      return Boolean(form[fieldName]);
    });
  }

  async function submitQuestionnaire() {
    if (loading) return;

    if (!animalId) {
      alert("L’identifiant de l’animal est introuvable.");
      return;
    }

    if (!questionnaireComplet()) {
      alert("Merci de répondre à toutes les questions.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erreur utilisateur :", userError);
        alert("Impossible de vérifier votre compte.");
        return;
      }

      if (!user) {
        alert("Vous devez être connecté pour envoyer une demande d’adoption.");

        router.push(
          `/login?redirect=/adoption/questionnaire/${animalId}`
        );

        return;
      }

      const { data: questionnaireExistant, error: searchError } =
        await supabase
          .from("questionnaires_adoption")
          .select("id")
          .eq("user_id", user.id)
          .eq("animal_id", animalId)
          .maybeSingle();

      if (searchError) {
        console.error(
          "Erreur recherche questionnaire existant :",
          searchError
        );

        alert(`Erreur Supabase : ${searchError.message}`);
        return;
      }

      if (questionnaireExistant) {
        const { error: updateError } = await supabase
          .from("questionnaires_adoption")
          .update({
            proprietaire_animal: form.proprietaire_animal,
            animal_actuel: form.animal_actuel,
            adoption_pour: form.adoption_pour,
            enfants: form.enfants,
            jardin: form.jardin,
            age_souhaite: form.age_souhaite,
            sexe_souhaite: form.sexe_souhaite,
            taille_souhaitee: form.taille_souhaitee,
            activite_souhaitee: form.activite_souhaitee,
            hypoallergenique: form.hypoallergenique,
            proprete: form.proprete,
            besoins_speciaux: form.besoins_speciaux,
            race_souhaitee: form.race_souhaitee.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", questionnaireExistant.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Erreur mise à jour questionnaire :", updateError);
          alert(`Erreur : ${updateError.message}`);
          return;
        }

        alert("Votre questionnaire a été mis à jour sur votre profil.");
        router.push("/profile");
        router.refresh();
        return;
      }

      const { error: insertError } = await supabase
        .from("questionnaires_adoption")
        .insert({
          user_id: user.id,
          animal_id: animalId,
          proprietaire_animal: form.proprietaire_animal,
          animal_actuel: form.animal_actuel,
          adoption_pour: form.adoption_pour,
          enfants: form.enfants,
          jardin: form.jardin,
          age_souhaite: form.age_souhaite,
          sexe_souhaite: form.sexe_souhaite,
          taille_souhaitee: form.taille_souhaitee,
          activite_souhaitee: form.activite_souhaitee,
          hypoallergenique: form.hypoallergenique,
          proprete: form.proprete,
          besoins_speciaux: form.besoins_speciaux,
          race_souhaitee: form.race_souhaitee.trim(),
        });

      if (insertError) {
        console.error("Erreur enregistrement questionnaire :", insertError);
        alert(`Erreur : ${insertError.message}`);
        return;
      }

      alert("Votre questionnaire a bien été enregistré sur votre profil.");

      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Erreur inattendue :", error);
      alert("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-6 shadow-xl md:p-8">
        <h1 className="text-3xl font-black md:text-4xl">
          Questionnaire adoptant
        </h1>

        <p className="mt-3 text-gray-600">
          Ces informations aideront l’association à vérifier la compatibilité
          avec l’animal.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {fields.map((field) => {
            const fieldName = field.name as keyof FormData;

            return (
              <label key={field.name} className="block">
                <span className="mb-2 block font-black text-[#064b42]">
                  {field.label}
                </span>

                <select
                  className="w-full rounded-2xl border border-[#ded4c5] bg-white px-4 py-3 text-[#064b42] outline-none transition focus:border-[#064b42] focus:ring-2 focus:ring-[#064b42]/20"
                  value={form[fieldName]}
                  onChange={(event) =>
                    updateField(fieldName, event.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Sélectionner</option>

                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}

          <label className="block md:col-span-2">
            <span className="mb-2 block font-black text-[#064b42]">
              Race de prédilection
            </span>

            <input
              type="text"
              className="w-full rounded-2xl border border-[#ded4c5] bg-white px-4 py-3 text-[#064b42] outline-none transition placeholder:text-gray-400 focus:border-[#064b42] focus:ring-2 focus:ring-[#064b42]/20"
              placeholder="Exemple : Local Dog, Labrador, Berger..."
              value={form.race_souhaitee}
              onChange={(event) =>
                updateField("race_souhaitee", event.target.value)
              }
              disabled={loading}
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-2xl bg-gray-100 px-6 py-4 font-black text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retour
          </button>

          <button
            type="button"
            onClick={submitQuestionnaire}
            disabled={loading}
            className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white transition hover:bg-[#043c35] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Envoyer ma demande"}
          </button>
        </div>
      </section>
    </main>
  );
}