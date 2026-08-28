const islands = [
  "Tahiti",
  "Moorea",
  "Bora Bora",
  "Raiatea",
  "Huahine",
  "Tahaa",
  "Maupiti",
  "Rangiroa",
  "Fakarava",
  "Tikehau",
  "Nuku Hiva",
  "Hiva Oa",
  "Tubuai",
  "Rurutu",
  "Raivavae",
  "Autre",
];

const cities = [
  "Papeete",
  "Pirae",
  "Arue",
  "Mahina",
  "Hitiaa",
  "Mahaena",
  "Tiarei",
  "Papenoo",
  "Punaauia",
  "Paea",
  "Papara",
  "Mataiea",
  "Taravao",
  "Afaahiti",
  "Toahotu",
  "Vairao",
  "Teahupoo",
  "Faaone",
  "Tautira",
  "Faaa",
  "Afareaitu",
  "Haapiti",
  "Papetoai",
  "Paopao",
  "Teavaro",
  "Uturoa",
  "Taputapuatea",
  "Tumaraa",
  "Tahaa",
  "Vaitape",
  "Fare",
  "Avatoru",
  "Tiputa",
  "Rotoava",
  "Taiohae",
  "Atuona",
  "Mataura",
  "Moerai",
  "Autre",
];

type LocationField =
  | "island"
  | "city";

type LocationAnimal = {
  island: string;
  city: string;
};

type StepProps = {
  animal: LocationAnimal;
  updateField: (
    field: LocationField,
    value: string
  ) => void;
};

export default function Step6Location({
  animal,
  updateField,
}: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">
        Localisation
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <select
          className="input"
          value={animal.island}
          onChange={(event) =>
            updateField(
              "island",
              event.target.value
            )
          }
        >
          <option value="">
            Île
          </option>

          {islands.map((island) => (
            <option
              key={island}
              value={island}
            >
              {island}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={animal.city}
          onChange={(event) =>
            updateField(
              "city",
              event.target.value
            )
          }
        >
          <option value="">
            Ville / commune
          </option>

          {cities.map((city) => (
            <option
              key={city}
              value={city}
            >
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}