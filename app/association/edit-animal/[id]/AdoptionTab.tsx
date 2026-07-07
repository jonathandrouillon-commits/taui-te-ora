"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function AdoptionTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">
        Statut d’adoption
      </h2>

      <Select
        label="Publication"
        value={animal.is_published ? "published" : "draft"}
        onChange={(v) => updateField("is_published", v === "published")}
        options={[
          { value: "draft", label: "Brouillon" },
          { value: "published", label: "Publié" },
        ]}
      />

      <Textarea
        label="Notes internes"
        value={animal.internal_notes || ""}
        onChange={(v) => updateField("internal_notes", v)}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
        rows={5}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}