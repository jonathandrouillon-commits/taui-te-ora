"use client";

type AnimalValue =
  | string
  | number
  | boolean
  | null
  | undefined;

type AnimalData = Record<string, AnimalValue>;

type HealthTabProps = {
  animal: AnimalData;

  updateField: (
    field: string,
    value: string | number | boolean
  ) => void;
};

export default function HealthTab({
  animal,
  updateField,
}: HealthTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#064b42]">
          Santé
        </h2>

        <p className="mt-1 text-sm text-[#746c64]">
          Renseignez les informations de santé de
          l&apos;animal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <BooleanCard
          label="Vacciné"
          value={Boolean(animal.vaccinated)}
          onChange={(value) =>
            updateField("vaccinated", value)
          }
        />

        <BooleanCard
          label="Stérilisé"
          value={Boolean(animal.sterilized)}
          onChange={(value) =>
            updateField("sterilized", value)
          }
        />

        <BooleanCard
          label="Identifié / Pucé"
          value={Boolean(animal.microchipped)}
          onChange={(value) =>
            updateField("microchipped", value)
          }
        />
      </div>

      <Textarea
        label="État de santé"
        value={String(animal.health_status ?? "")}
        onChange={(value) =>
          updateField("health_status", value)
        }
        placeholder="Ex : Bon état général, suivi vétérinaire à jour..."
      />

      <Textarea
        label="Besoins particuliers"
        value={String(animal.special_needs ?? "")}
        onChange={(value) =>
          updateField("special_needs", value)
        }
        placeholder="Ex : Traitement, alimentation spécifique, handicap..."
      />
    </div>
  );
}

function BooleanCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#ded4c5] bg-[#fffaf7] p-4">
      <p className="font-black text-[#064b42]">
        {label}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-2xl px-4 py-3 font-black transition ${
            value
              ? "bg-[#064b42] text-white"
              : "bg-white text-[#064b42]"
          }`}
        >
          Oui
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-2xl px-4 py-3 font-black transition ${
            !value
              ? "bg-[#df8995] text-white"
              : "bg-white text-[#064b42]"
          }`}
        >
          Non
        </button>
      </div>
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
        rows={5}
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