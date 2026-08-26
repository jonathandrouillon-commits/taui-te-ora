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

type LocationTabProps = {
  animal: AnimalData;

  updateField: (
    field: string,
    value:
      | string
      | number
      | boolean
  ) => void;
};

export default function LocationTab({
  animal,
  updateField,
}: LocationTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#064b42]">
          Localisation
        </h2>

        <p className="mt-1 text-sm text-[#746c64]">
          Renseignez la localisation actuelle et les
          informations liées à la découverte de
          l&apos;animal.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Île"
          value={String(
            animal.island ?? ""
          )}
          onChange={(value) =>
            updateField(
              "island",
              value
            )
          }
          placeholder="Ex : Tahiti"
        />

        <Input
          label="Ville / Commune"
          value={String(
            animal.city ?? ""
          )}
          onChange={(value) =>
            updateField(
              "city",
              value
            )
          }
          placeholder="Ex : Papeete"
        />

        <Input
          label="Lieu de capture / découverte"
          value={String(
            animal.capture_location ??
              ""
          )}
          onChange={(value) =>
            updateField(
              "capture_location",
              value
            )
          }
          placeholder="Ex : Punaauia"
        />

        <Input
          label="Temps passé dans la rue"
          value={String(
            animal.street_duration ??
              ""
          )}
          onChange={(value) =>
            updateField(
              "street_duration",
              value
            )
          }
          placeholder="Ex : 3 mois"
        />

        <Input
          label="Adresse / Localisation"
          value={String(
            animal.map_address ?? ""
          )}
          onChange={(value) =>
            updateField(
              "map_address",
              value
            )
          }
          placeholder="Adresse ou indication géographique"
        />

        <Input
          label="Association / Structure"
          value={String(
            animal.association_name ??
              ""
          )}
          onChange={(value) =>
            updateField(
              "association_name",
              value
            )
          }
          placeholder="Ex : Les Veilleurs de Kali"
        />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
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

  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-[#064b42]">
        {label}
      </span>

      <input
        type="text"
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