export default function Step4Character({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Caractère</h2>

      <textarea
        placeholder="Décrivez le caractère de l'animal..."
        value={animal.description_character}
        onChange={(e) => updateField("description_character", e.target.value)}
        className="min-h-52 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
      />
    </div>
  );
}