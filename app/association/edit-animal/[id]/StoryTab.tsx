"use client";

type AnimalValue =
  | string
  | number
  | boolean
  | null
  | undefined;

type AnimalData = Record<string, AnimalValue>;

type StoryTabProps = {
  animal: AnimalData;

  updateField: (
    field: string,
    value: string | number | boolean
  ) => void;
};

export default function StoryTab({
  animal,
  updateField,
}: StoryTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#064b42]">
          Son histoire
        </h2>

        <p className="mt-1 text-sm text-[#746c64]">
          Racontez son parcours, sa découverte et les éléments
          importants de son histoire.
        </p>
      </div>

      <Textarea
        label="Son histoire"
        value={String(animal.story ?? "")}
        onChange={(value) =>
          updateField("story", value)
        }
        placeholder="Ex : Trouvé dans la rue, recueilli par une famille d’accueil..."
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-[#064b42]">
        {label}
      </span>

      <textarea
        value={value}
        placeholder={placeholder}
        rows={10}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          w-full
          resize-none
          rounded-[20px]
          border
          border-[#ded4c5]
          bg-[#fffaf7]
          px-4
          py-3
          text-[#2f241c]
          outline-none
          transition
          placeholder:text-gray-400
          focus:border-[#064b42]
          focus:ring-2
          focus:ring-[#064b42]/10
        "
      />
    </label>
  );
}