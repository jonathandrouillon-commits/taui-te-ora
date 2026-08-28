const ages = [
  "Inférieur à 1 mois",
  "1 mois",
  "2 mois",
  "3 mois",
  "4 mois",
  "5 mois",
  "6 mois",
  "7 mois",
  "8 mois",
  "9 mois",
  "10 mois",
  "11 mois",
  "1 an",
  "2 ans",
  "3 ans",
  "4 ans",
  "5 ans",
  "6 ans",
  "7 ans",
  "8 ans",
  "9 ans",
  "10 ans",
  "11 ans",
  "12 ans",
  "13 ans",
  "14 ans",
  "15 ans",
  "16 ans",
  "17 ans",
  "18 ans",
  "19 ans",
  "20 ans",
  "Plus de 20 ans",
];

const weights = Array.from(
  { length: 81 },
  (_, index) => `${index}`
);

type Step1Field =
  | "animal_name"
  | "animal_type"
  | "breed"
  | "sex"
  | "age_label"
  | "size_label"
  | "weight_kg";

type Step1Animal = {
  animal_name: string;
  animal_type: string;
  breed: string;
  sex: string;
  age_label: string;
  size_label: string;
  weight_kg: string;
};

type StepProps = {
  animal: Step1Animal;
  updateField: (
    field: Step1Field,
    value: string
  ) => void;
};

export default function Step1General({
  animal,
  updateField,
}: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">
        Informations générales
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <input
          className="input"
          placeholder="Nom de l'animal"
          value={animal.animal_name}
          onChange={(event) =>
            updateField(
              "animal_name",
              event.target.value
            )
          }
        />

        <select
          className="input"
          value={animal.animal_type}
          onChange={(event) =>
            updateField(
              "animal_type",
              event.target.value
            )
          }
        >
          <option value="">
            Catégorie de l&apos;animal
          </option>

          <option value="Chien">
            Chien
          </option>

          <option value="Chat">
            Chat
          </option>

          <option value="Cheval">
            Cheval
          </option>

          <option value="Oiseau">
            Oiseau
          </option>

          <option value="Lapin">
            Lapin
          </option>

          <option value="Autres">
            Autres
          </option>
        </select>

        <input
          className="input"
          placeholder="Race"
          value={animal.breed}
          onChange={(event) =>
            updateField(
              "breed",
              event.target.value
            )
          }
        />

        <select
          className="input"
          value={animal.sex}
          onChange={(event) =>
            updateField(
              "sex",
              event.target.value
            )
          }
        >
          <option value="">
            Sexe
          </option>

          <option value="Femelle">
            Femelle
          </option>

          <option value="Mâle">
            Mâle
          </option>

          <option value="Inconnu">
            Inconnu
          </option>
        </select>

        <select
          className="input"
          value={animal.age_label}
          onChange={(event) =>
            updateField(
              "age_label",
              event.target.value
            )
          }
        >
          <option value="">
            Âge de l&apos;animal
          </option>

          {ages.map((age) => (
            <option
              key={age}
              value={age}
            >
              {age}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={animal.size_label}
          onChange={(event) =>
            updateField(
              "size_label",
              event.target.value
            )
          }
        >
          <option value="">
            Taille de l&apos;animal
          </option>

          <option value="Petit">
            Petit
          </option>

          <option value="Moyen">
            Moyen
          </option>

          <option value="Grand">
            Grand
          </option>

          <option value="Hors catégorie">
            Hors catégorie
          </option>
        </select>

        <select
          className="input"
          value={animal.weight_kg}
          onChange={(event) =>
            updateField(
              "weight_kg",
              event.target.value
            )
          }
        >
          <option value="">
            Poids en kg
          </option>

          {weights.map((weight) => (
            <option
              key={weight}
              value={weight}
            >
              {weight} kg
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}