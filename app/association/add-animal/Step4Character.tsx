"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function Step4Character({ animal, updateField }: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#064b42]">
        Caractère & compatibilités
      </h2>

      <div>
        <label className="mb-2 block text-lg font-bold">
          Caractère de l'animal
        </label>

        <textarea
          placeholder="Décrivez le caractère de l'animal..."
          value={animal.description_character || ""}
          onChange={(e) =>
            updateField("description_character", e.target.value)
          }
          className="min-h-52 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <CompatibilitySelect
          title="Compatibilité avec les chiens"
          value={animal.compatible_chiens || ""}
          onChange={(value) => updateField("compatible_chiens", value)}
        />

        <CompatibilitySelect
          title="Compatibilité avec les chats"
          value={animal.compatible_chats || ""}
          onChange={(value) => updateField("compatible_chats", value)}
        />

        <CompatibilitySelect
          title="Compatibilité avec les enfants"
          value={animal.compatible_enfants || ""}
          onChange={(value) => updateField("compatible_enfants", value)}
        />
      </div>
    </div>
  );
}

function CompatibilitySelect({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{title}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
      >
        <option value="">Sélectionner</option>
        <option value="oui">✅ Oui</option>
        <option value="non">❌ Non</option>
        <option value="a_tester">🧪 À tester</option>
        <option value="inconnu">❓ Inconnu</option>
      </select>
    </div>
  );
}