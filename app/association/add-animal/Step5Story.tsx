"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
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

export default function Step5Story({ animal, updateField }: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#064b42]">
        Histoire & sauvetage
      </h2>

      <div>
        <label className="mb-2 block text-lg font-bold">Lieu de capture</label>

        <select
          value={animal.capture_location || ""}
          onChange={(e) => updateField("capture_location", e.target.value)}
          className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
        >
          <option value="">Sélectionner une ville</option>
          {villes.map((ville) => (
            <option key={ville} value={ville}>
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
            value={animal.street_duration_number || ""}
            onChange={(e) =>
              updateField("street_duration_number", e.target.value)
            }
            className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-lg font-bold">Unité</label>

          <select
            value={animal.street_duration_unit || "jours"}
            onChange={(e) =>
              updateField("street_duration_unit", e.target.value)
            }
            className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
          >
            <option value="jours">Jour(s)</option>
            <option value="mois">Mois</option>
            <option value="années">Année(s)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-lg font-bold">
          Histoire de l'animal
        </label>

        <textarea
          placeholder="Racontez son histoire..."
          value={animal.story || ""}
          onChange={(e) => updateField("story", e.target.value)}
          className="min-h-52 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
        />
      </div>
    </div>
  );
}