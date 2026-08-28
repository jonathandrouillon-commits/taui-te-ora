"use client";

type AnimalValue =
  | string
  | number
  | boolean
  | null
  | undefined;

type AnimalData = Record<
  string,
  AnimalValue
>;

type GeneralTabProps = {
  animal: AnimalData;

  updateField: (
    field: string,
    value:
      | string
      | number
      | boolean
  ) => void;
};

export default function GeneralTab({
  animal,
  updateField,
}: GeneralTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#064b42]">
          Informations g�n�rales
        </h2>

        <p className="mt-1 text-sm text-[#746c64]">
          Renseignez les informations
          principales de l&apos;animal.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Nom de l�animal"
          value={String(
            animal.animal_name ?? ""
          )}
          onChange={(value) =>
            updateField(
              "animal_name",
              value
            )
          }
        />

        <Select
          label="Type d�animal"
          value={String(
            animal.animal_type ?? ""
          )}
          onChange={(value) =>
            updateField(
              "animal_type",
              value
            )
          }
          options={[
            {
              value: "",
              label: "S�lectionner",
            },
            {
              value: "Chien",
              label: "Chien",
            },
            {
              value: "Chat",
              label: "Chat",
            },
            {
              value: "Cheval",
              label: "Cheval",
            },
            {
              value: "Autre",
              label: "Autre",
            },
          ]}
        />

        <Input
          label="Race"
          value={String(
            animal.breed ?? ""
          )}
          onChange={(value) =>
            updateField(
              "breed",
              value
            )
          }
        />

        <Select
          label="Sexe"
          value={String(
            animal.sex ?? ""
          )}
          onChange={(value) =>
            updateField(
              "sex",
              value
            )
          }
          options={[
            {
              value: "",
              label: "S�lectionner",
            },
            {
              value: "M�le",
              label: "M�le",
            },
            {
              value: "Femelle",
              label: "Femelle",
            },
          ]}
        />

        <Input
          label="�ge"
          value={String(
            animal.age_label ?? ""
          )}
          onChange={(value) =>
            updateField(
              "age_label",
              value
            )
          }
          placeholder="Ex : 2 ans"
        />

        <Select
          label="Taille"
          value={String(
            animal.size_label ?? ""
          )}
          onChange={(value) =>
            updateField(
              "size_label",
              value
            )
          }
          options={[
            {
              value: "",
              label: "S�lectionner",
            },
            {
              value: "Petit",
              label: "Petit",
            },
            {
              value: "Moyen",
              label: "Moyen",
            },
            {
              value: "Grand",
              label: "Grand",
            },
            {
              value: "XL",
              label: "XL",
            },
          ]}
        />

        <Input
          label="Poids (kg)"
          type="number"
          value={String(
            animal.weight_kg ?? ""
          )}
          onChange={(value) =>
            updateField(
              "weight_kg",
              value
            )
          }
          placeholder="Ex : 18"
        />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;

  onChange: (
    value: string
  ) => void;

  type?: string;

  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-[#064b42]">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-2xl
          border
          border-gray-300
          bg-white
          p-4
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;

  onChange: (
    value: string
  ) => void;

  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-[#064b42]">
        {label}
      </span>

      <select
        value={String(
          value ?? ""
        )}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-2xl
          border
          border-gray-300
          bg-white
          p-4
          text-[#2f241c]
          outline-none
          transition
          focus:border-[#064b42]
          focus:ring-2
          focus:ring-[#064b42]/10
        "
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}