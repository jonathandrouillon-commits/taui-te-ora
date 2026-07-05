export default function Step3Health({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Santé</h2>

      <input
        className="input"
        placeholder="État de santé"
        value={animal.health_status}
        onChange={(e) => updateField("health_status", e.target.value)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <label className="box">
          <input type="checkbox" checked={animal.vaccinated} onChange={(e) => updateField("vaccinated", e.target.checked)} />
          Vacciné
        </label>

        <label className="box">
          <input type="checkbox" checked={animal.sterilized} onChange={(e) => updateField("sterilized", e.target.checked)} />
          Stérilisé
        </label>

        <label className="box">
          <input type="checkbox" checked={animal.microchipped} onChange={(e) => updateField("microchipped", e.target.checked)} />
          Identifié
        </label>
      </div>
    </div>
  );
}