"use client";

type StoryField =
  | "capture_location"
  | "street_duration_number"
  | "street_duration_unit"
  | "story";

type StoryAnimal = {
  capture_location: string;
  street_duration_number: string;
  street_duration_unit: string;
  story: string;
};

type Props = {
  animal: StoryAnimal;
  updateField: (
    field: StoryField,
    value: string
  ) => void;
};

const villes = [
  "Papeete",
  "Faa'a",
  "Punaauia",
  "Pirae",
  "Arue",
  "Mahina",
  "Paea",
  "Papara",
  "Taravao",
  "Teva i Uta",
  "Taiarapu-Est",
  "Taiarapu-Ouest",
  "Moorea-Maiao",
  "Uturoa",
  "Taputapuatea",
  "Tumaraa",
  "Tahaa",
  "Bora Bora",
  "Huahine",
  "Rangiroa",
  "Tubuai",
  "Nuku Hiva",
  "Hiva Oa",
  "Autre",
];

export default function Step5Story({
  animal,
  updateField,
}: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#064b42]">
        Histoire & sauvetage
      </h2>

      <div>
        <label className="mb-2 block text-lg font-bold">
          Lieu de capture
        </label>

        <select
          value={animal.capture_location}
          onChange={(event) =>
            updateField(
              "capture_location",
              event.target.value
            )
          }
          className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
        >
          <option value="">
            Sélectionner une ville
          </option>

          {villes.map((ville) => (
            <option
              key={ville}
              value={ville}
            >
              {ville}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-lg font-bold">
            Temps dans la rue
          </label>

          <input
            type="number"
            min="0"
            placeholder="Ex : 3"
            value={animal.street_duration_number}
            onChange={(event) =>
              updateField(
                "street_duration_number",
                event.target.value
              )
            }
            className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-lg font-bold">
            Unité
          </label>

          <select
            value={animal.street_duration_unit}
            onChange={(event) =>
              updateField(
                "street_duration_unit",
                event.target.value
              )
            }
            className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
          >
            <option value="jours">
              Jour(s)
            </option>

            <option value="mois">
              Mois
            </option>

            <option value="années">
              Année(s)
            </option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-lg font-bold">
          Histoire de l&apos;animal
        </label>

        <textarea
          placeholder="Racontez son histoire..."
          value={animal.story}
          onChange={(event) =>
            updateField(
              "story",
              event.target.value
            )
          }
          className="min-h-52 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
        />
      </div>
    </div>
  );
}