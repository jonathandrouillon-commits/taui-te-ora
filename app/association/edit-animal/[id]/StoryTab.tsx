"use client";

type Props = {
  animal: any;
  updateField: (field: string, value: any) => void;
};

export default function StoryTab({ animal, updateField }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-black text-[#064b42]">
        Histoire de l’animal
      </h2>

      <Textarea
        label="Son histoire"
        value={animal.story || ""}
        onChange={(v) => updateField("story", v)}
      />

      <Input
        label="Lieu de capture / sauvetage"
        value={animal.capture_location || ""}
        onChange={(v) => updateField("capture_location", v)}
      />

      <Input
        label="Temps passé dans la rue"
        value={animal.street_duration || ""}
        onChange={(v) => updateField("street_duration", v)}
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
        rows={6}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}