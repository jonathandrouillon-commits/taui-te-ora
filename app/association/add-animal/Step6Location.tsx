export default function Step6Location({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Localisation</h2>

      <div className="grid gap-5 md:grid-cols-2">
        <input
          className="input"
          placeholder="Île"
          value={animal.island}
          onChange={(e) => updateField("island", e.target.value)}
        />

        <input
          className="input"
          placeholder="Commune"
          value={animal.city}
          onChange={(e) => updateField("city", e.target.value)}
        />
      </div>
    </div>
  );
}