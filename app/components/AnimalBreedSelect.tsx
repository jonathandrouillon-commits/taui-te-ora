"use client";

import {
  getBreedLabel,
  getBreedOptions,
} from "../lib/animalBreeds";

type AnimalBreedSelectProps = {
  species: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
};

export default function AnimalBreedSelect({
  species,
  value,
  onChange,
  className = "input",
  required = false,
}: AnimalBreedSelectProps) {
  const options =
    getBreedOptions(species);

  const label =
    getBreedLabel(species);

  /*
   * Pour une catégorie non gérée ("Autres"),
   * on conserve une saisie libre.
   */
  if (options.length === 0) {
    return (
      <input
        className={className}
        placeholder={`${label} / type`}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    );
  }

  const isKnownOption =
    options.includes(
      value as never
    );

  const customValue =
    value &&
    !isKnownOption &&
    value !== "Autre"
      ? value
      : "";

  const selectedValue =
    customValue
      ? "Autre"
      : value;

  return (
    <div className="space-y-2">
      <select
        className={className}
        value={selectedValue}
        required={required}
        onChange={(event) => {
          const nextValue =
            event.target.value;

          if (
            nextValue === "Autre"
          ) {
            onChange("Autre");
            return;
          }

          onChange(nextValue);
        }}
      >
        <option value="">
          {species
            ? `Sélectionner — ${label}`
            : "Choisissez d'abord l'espèce"}
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>

      {selectedValue ===
        "Autre" && (
        <input
          className={className}
          placeholder={`Préciser — ${label.toLowerCase()}`}
          value={customValue}
          onChange={(event) =>
            onChange(
              event.target.value ||
                "Autre"
            )
          }
        />
      )}
    </div>
  );
}
