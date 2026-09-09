"use client";

import {
  POLYNESIA_ISLANDS,
  getCommunesForIsland,
} from "../../lib/animalFormOptions";

type LocationField =
  | "island"
  | "city";

type LocationAnimal = {
  island: string;
  city: string;
};

type StepProps = {
  animal: LocationAnimal;
  updateField: (
    field: LocationField,
    value: string
  ) => void;
};

export default function Step6Location({
  animal,
  updateField,
}: StepProps) {
  const communes =
    getCommunesForIsland(
      animal.island
    );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">
        Localisation
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <select
          className="input"
          value={animal.island}
          onChange={(event) => {
            updateField(
              "island",
              event.target.value
            );

            updateField(
              "city",
              ""
            );
          }}
        >
          <option value="">
            Île
          </option>

          {POLYNESIA_ISLANDS.map(
            (island) => (
              <option
                key={island}
                value={island}
              >
                {island}
              </option>
            )
          )}
        </select>

        <select
          className="input"
          value={animal.city}
          disabled={!animal.island}
          onChange={(event) =>
            updateField(
              "city",
              event.target.value
            )
          }
        >
          <option value="">
            {animal.island
              ? "Commune"
              : "Choisissez d'abord l'île"}
          </option>

          {communes.map(
            (commune) => (
              <option
                key={commune}
                value={commune}
              >
                {commune}
              </option>
            )
          )}
        </select>
      </div>
    </div>
  );
}
