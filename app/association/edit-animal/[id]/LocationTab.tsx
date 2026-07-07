"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function LocationTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">
        Localisation
      </h2>

      <Input
        label="Île"
        value={animal.island || ""}
        onChange={(v) => updateField("island", v)}
      />

      <Input
        label="Commune"
        value={animal.city || ""}
        onChange={(v) => updateField("city", v)}
      />

      <Input
        label="Adresse visible sur la carte"
        value={animal.map_address || ""}
        onChange={(v) => updateField("map_address", v)}
      />

      <Select
        label="Visibilité de la localisation"
        value={animal.map_visibility || ""}
        onChange={(v) => updateField("map_visibility", v)}
        options={["public", "approximatif", "masqué"]}
      />
    </div>
  );
}

function Input({
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
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
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}