"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function GeneralTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">
        Informations générales
      </h2>

      <Input
        label="Nom de l’animal"
        value={animal.animal_name || ""}
        onChange={(v) => updateField("animal_name", v)}
      />

      <Select
        label="Type"
        value={animal.animal_type || ""}
        onChange={(v) => updateField("animal_type", v)}
        options={["Chien", "Chat", "Autre"]}
      />

      <Input
        label="Race"
        value={animal.breed || ""}
        onChange={(v) => updateField("breed", v)}
      />

      <Select
        label="Sexe"
        value={animal.sex || ""}
        onChange={(v) => updateField("sex", v)}
        options={["Mâle", "Femelle", "Inconnu"]}
      />

      <Input
        label="Âge"
        value={animal.age_label || ""}
        onChange={(v) => updateField("age_label", v)}
      />

      <Input
        label="Taille"
        value={animal.size_label || ""}
        onChange={(v) => updateField("size_label", v)}
      />

      <Input
        label="Poids en kg"
        value={animal.weight_kg || ""}
        onChange={(v) => updateField("weight_kg", v)}
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
  value: any;
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