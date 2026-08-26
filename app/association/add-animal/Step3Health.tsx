type AnimalForm = Record<string, string | number | boolean | undefined>;

type StepProps = {
  animal: AnimalForm;
  updateField: (field: string, value: string | boolean) => void;
};

export default function Step3Health({ animal, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Santé</h2>

      <select
        className="input"
        value={String(animal.health_status ?? "")}
        onChange={(e) => updateField("health_status", e.target.value)}
      >
        <option value="">État de santé</option>
        <option>Mauvaise</option>
        <option>Bonne</option>
        <option>Très bonne</option>
      </select>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="box">
          <input
            type="checkbox"
            checked={Boolean(animal.vaccinated)}
            onChange={(e) => updateField("vaccinated", e.target.checked)}
          />
          Vacciné
        </label>

        <label className="box">
          <input
            type="checkbox"
            checked={Boolean(animal.sterilized)}
            onChange={(e) => updateField("sterilized", e.target.checked)}
          />
          Stérilisé
        </label>

        <label className="box">
          <input
            type="checkbox"
            checked={Boolean(animal.microchipped)}
            onChange={(e) => updateField("microchipped", e.target.checked)}
          />
          Identifié
        </label>
      </div>
    </div>
  );
}