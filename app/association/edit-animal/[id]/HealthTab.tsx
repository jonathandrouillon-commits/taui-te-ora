"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function HealthTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">Santé</h2>

      <Checkbox
        label="Vacciné"
        checked={!!animal.vaccinated}
        onChange={(v) => updateField("vaccinated", v)}
      />

      <Checkbox
        label="Stérilisé"
        checked={!!animal.sterilized}
        onChange={(v) => updateField("sterilized", v)}
      />

      <Checkbox
        label="Identifié / pucé"
        checked={!!animal.microchipped}
        onChange={(v) => updateField("microchipped", v)}
      />

      <Textarea
        label="État de santé"
        value={animal.health_status || ""}
        onChange={(v) => updateField("health_status", v)}
      />

      <Textarea
        label="Besoins spécifiques"
        value={animal.special_needs || ""}
        onChange={(v) => updateField("special_needs", v)}
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-[#f4eee3] p-4 font-bold text-[#064b42]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
      {label}
    </label>
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