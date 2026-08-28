type HealthField =
  | "health_status"
  | "vaccinated"
  | "sterilized"
  | "microchipped";

type HealthAnimal = {
  health_status: string;
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
};

type StepProps = {
  animal: HealthAnimal;
  updateField: (
    field: HealthField,
    value: string | boolean
  ) => void;
};

export default function Step3Health({
  animal,
  updateField,
}: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">
        Santé
      </h2>

      <select
        className="input"
        value={animal.health_status}
        onChange={(event) =>
          updateField(
            "health_status",
            event.target.value
          )
        }
      >
        <option value="">
          État de santé
        </option>

        <option value="Mauvaise">
          Mauvaise
        </option>

        <option value="Bonne">
          Bonne
        </option>

        <option value="Très bonne">
          Très bonne
        </option>
      </select>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="box">
          <input
            type="checkbox"
            checked={animal.vaccinated}
            onChange={(event) =>
              updateField(
                "vaccinated",
                event.target.checked
              )
            }
          />

          Vacciné
        </label>

        <label className="box">
          <input
            type="checkbox"
            checked={animal.sterilized}
            onChange={(event) =>
              updateField(
                "sterilized",
                event.target.checked
              )
            }
          />

          Stérilisé
        </label>

        <label className="box">
          <input
            type="checkbox"
            checked={animal.microchipped}
            onChange={(event) =>
              updateField(
                "microchipped",
                event.target.checked
              )
            }
          />

          Identifié
        </label>
      </div>
    </div>
  );
}