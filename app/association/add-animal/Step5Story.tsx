export default function Step5Story({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Histoire</h2>

      <textarea
        placeholder="Racontez son histoire..."
        value={animal.story}
        onChange={(e) => updateField("story", e.target.value)}
        className="min-h-52 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
      />
    </div>
  );
}