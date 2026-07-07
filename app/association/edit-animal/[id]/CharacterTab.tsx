"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function CharacterTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">
        Caractère & comportement
      </h2>

      <Textarea
        label="Description du caractère"
        value={animal.description_character || ""}
        onChange={(v) => updateField("description_character", v)}
      />

      <Textarea
        label="Compatibilité chiens"
        value={animal.compatible_chiens || ""}
        onChange={(v) => updateField("compatible_chiens", v)}
      />

      <Textarea
        label="Compatibilité chats"
        value={animal.compatible_chats || ""}
        onChange={(v) => updateField("compatible_chats", v)}
      />

      <Textarea
        label="Compatibilité enfants"
        value={animal.compatible_enfants || ""}
        onChange={(v) => updateField("compatible_enfants", v)}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}