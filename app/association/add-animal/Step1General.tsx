"use client";

import {
  useEffect,
  useState,
} from "react";

const ages = [
  "Inférieur à 1 mois",
  "1 mois",
  "2 mois",
  "3 mois",
  "4 mois",
  "5 mois",
  "6 mois",
  "7 mois",
  "8 mois",
  "9 mois",
  "10 mois",
  "11 mois",
  "1 an",
  "2 ans",
  "3 ans",
  "4 ans",
  "5 ans",
  "6 ans",
  "7 ans",
  "8 ans",
  "9 ans",
  "10 ans",
  "11 ans",
  "12 ans",
  "13 ans",
  "14 ans",
  "15 ans",
  "16 ans",
  "17 ans",
  "18 ans",
  "19 ans",
  "20 ans",
  "Plus de 20 ans",
];

const weights = Array.from(
  { length: 81 },
  (_, index) => `${index}`
);

type Step1Field =
  | "animal_name"
  | "animal_type"
  | "breed"
  | "sex"
  | "age_label"
  | "size_label"
  | "weight_kg"
  | "sibling_group_id";

type Step1Animal = {
  animal_name: string;
  animal_type: string;
  breed: string;
  sex: string;
  age_label: string;
  size_label: string;
  weight_kg: string;
  sibling_group_id: string;
};

type SiblingGroupOption = {
  id: string;
  label: string;
};

type StepProps = {
  animal: Step1Animal;

  siblingGroups:
    SiblingGroupOption[];

  updateField: (
    field: Step1Field,
    value: string
  ) => void;
};

export default function Step1General({
  animal,
  siblingGroups,
  updateField,
}: StepProps) {
  const [
    hasSiblings,
    setHasSiblings,
  ] = useState(
    Boolean(
      animal.sibling_group_id
    )
  );

  useEffect(() => {
    if (
      animal.sibling_group_id
    ) {
      setHasSiblings(true);
    }
  }, [
    animal.sibling_group_id,
  ]);

  const existingSiblingGroup =
    siblingGroups.find(
      (group) =>
        group.id ===
        animal.sibling_group_id
    );

  const isNewSiblingGroup =
    Boolean(
      animal.sibling_group_id
    ) &&
    !existingSiblingGroup;

  function selectNoSibling() {
    setHasSiblings(false);

    updateField(
      "sibling_group_id",
      ""
    );
  }

  function selectYesSibling() {
    setHasSiblings(true);
  }

  function createNewSiblingGroup() {
    const newGroupId =
      crypto.randomUUID();

    updateField(
      "sibling_group_id",
      newGroupId
    );
  }

  function selectExistingGroup(
    groupId: string
  ) {
    updateField(
      "sibling_group_id",
      groupId
    );
  }

  return (
    <div className="space-y-8">
      {/* =====================================================
          TITRE
      ====================================================== */}

      <div>
        <h2 className="text-3xl font-black text-[#064b42]">
          Informations générales
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Renseignez les
          informations
          principales de
          l&apos;animal.
        </p>
      </div>

      {/* =====================================================
          INFORMATIONS ANIMAL
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-2">
        {/* NOM */}

        <input
          className="input"
          placeholder="Nom de l'animal"
          value={
            animal.animal_name
          }
          onChange={(
            event
          ) =>
            updateField(
              "animal_name",
              event.target.value
            )
          }
        />

        {/* TYPE */}

        <select
          className="input"
          value={
            animal.animal_type
          }
          onChange={(
            event
          ) =>
            updateField(
              "animal_type",
              event.target.value
            )
          }
        >
          <option value="">
            Catégorie de
            l&apos;animal
          </option>

          <option value="Chien">
            Chien
          </option>

          <option value="Chat">
            Chat
          </option>

          <option value="Cheval">
            Cheval
          </option>

          <option value="Oiseau">
            Oiseau
          </option>

          <option value="Lapin">
            Lapin
          </option>

          <option value="Autres">
            Autres
          </option>
        </select>

        {/* RACE */}

        <input
          className="input"
          placeholder="Race"
          value={
            animal.breed
          }
          onChange={(
            event
          ) =>
            updateField(
              "breed",
              event.target.value
            )
          }
        />

        {/* SEXE */}

        <select
          className="input"
          value={
            animal.sex
          }
          onChange={(
            event
          ) =>
            updateField(
              "sex",
              event.target.value
            )
          }
        >
          <option value="">
            Sexe
          </option>

          <option value="Femelle">
            Femelle
          </option>

          <option value="Mâle">
            Mâle
          </option>

          <option value="Inconnu">
            Inconnu
          </option>
        </select>

        {/* AGE */}

        <select
          className="input"
          value={
            animal.age_label
          }
          onChange={(
            event
          ) =>
            updateField(
              "age_label",
              event.target.value
            )
          }
        >
          <option value="">
            Âge de
            l&apos;animal
          </option>

          {ages.map(
            (age) => (
              <option
                key={age}
                value={age}
              >
                {age}
              </option>
            )
          )}
        </select>

        {/* TAILLE */}

        <select
          className="input"
          value={
            animal.size_label
          }
          onChange={(
            event
          ) =>
            updateField(
              "size_label",
              event.target.value
            )
          }
        >
          <option value="">
            Taille de
            l&apos;animal
          </option>

          <option value="Petit">
            Petit
          </option>

          <option value="Moyen">
            Moyen
          </option>

          <option value="Grand">
            Grand
          </option>

          <option value="Hors catégorie">
            Hors catégorie
          </option>
        </select>

        {/* POIDS */}

        <select
          className="input"
          value={
            animal.weight_kg
          }
          onChange={(
            event
          ) =>
            updateField(
              "weight_kg",
              event.target.value
            )
          }
        >
          <option value="">
            Poids en kg
          </option>

          {weights.map(
            (weight) => (
              <option
                key={weight}
                value={weight}
              >
                {weight} kg
              </option>
            )
          )}
        </select>
      </div>

      {/* =====================================================
          FRATRIE
      ====================================================== */}

      <section className="rounded-[26px] border border-[#eadfce] bg-[#fffaf5] p-5 sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
            Fratrie
          </p>

          <h3 className="mt-1 text-xl font-black text-[#064b42]">
            Cet animal
            fait-il partie
            d&apos;une
            fratrie ?
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
            Les animaux
            d&apos;une même
            fratrie restent
            des fiches
            individuelles,
            mais TAUI TE ORA
            les relie entre
            eux.
          </p>
        </div>

        {/* OUI / NON */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={
              selectNoSibling
            }
            className={`rounded-[18px] border-2 px-5 py-4 font-black transition ${
              !hasSiblings
                ? "border-[#064b42] bg-[#064b42] text-white"
                : "border-[#d9d0c7] bg-white text-[#064b42]"
            }`}
          >
            Non
          </button>

          <button
            type="button"
            onClick={
              selectYesSibling
            }
            className={`rounded-[18px] border-2 px-5 py-4 font-black transition ${
              hasSiblings
                ? "border-[#df8995] bg-[#fff0f3] text-[#a84759]"
                : "border-[#d9d0c7] bg-white text-[#064b42]"
            }`}
          >
            Oui
          </button>
        </div>

        {/* =================================================
            CHOIX FRATRIE
        ================================================== */}

        {hasSiblings && (
          <div className="mt-6 space-y-5">
            {/* FRATRIES EXISTANTES */}

            {siblingGroups.length >
              0 && (
              <div>
                <label className="mb-2 block text-sm font-black text-[#064b42]">
                  Fratrie déjà
                  enregistrée
                </label>

                <select
                  className="input w-full"
                  value={
                    existingSiblingGroup
                      ? animal.sibling_group_id
                      : ""
                  }
                  onChange={(
                    event
                  ) =>
                    selectExistingGroup(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                    une fratrie
                  </option>

                  {siblingGroups.map(
                    (
                      group
                    ) => (
                      <option
                        key={
                          group.id
                        }
                        value={
                          group.id
                        }
                      >
                        {
                          group.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* SEPARATEUR */}

            {siblingGroups.length >
              0 && (
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#eadfce]" />

                <span className="text-xs font-black uppercase tracking-[0.15em] text-[#9a8d80]">
                  ou
                </span>

                <div className="h-px flex-1 bg-[#eadfce]" />
              </div>
            )}

            {/* NOUVELLE FRATRIE */}

            <div>
              <p className="mb-2 text-sm font-black text-[#064b42]">
                Nouvelle
                fratrie
              </p>

              <button
                type="button"
                onClick={
                  createNewSiblingGroup
                }
                className="w-full rounded-[18px] border-2 border-dashed border-[#df8995] bg-white px-5 py-4 font-black text-[#a84759] transition hover:bg-[#fff0f3]"
              >
                + Créer une
                nouvelle
                fratrie
              </button>
            </div>

            {/* CONFIRMATION NOUVELLE */}

            {isNewSiblingGroup && (
              <div className="rounded-[18px] border border-[#efd7db] bg-white p-4 shadow-sm">
                <p className="font-black text-[#064b42]">
                  ✓ Nouvelle
                  fratrie créée
                </p>

                <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                  Cet animal
                  sera le
                  premier
                  membre de
                  cette
                  fratrie.
                  Lorsque vous
                  ajouterez son
                  frère ou sa
                  sœur,
                  sélectionnez
                  cette fratrie
                  dans la liste.
                </p>

                <p className="mt-3 text-xs text-[#9a8d80]">
                  Identifiant :{" "}
                  <span className="font-mono">
                    {
                      animal.sibling_group_id
                    }
                  </span>
                </p>
              </div>
            )}

            {/* CONFIRMATION EXISTANTE */}

            {existingSiblingGroup && (
              <div className="rounded-[18px] bg-[#edf7f4] p-4">
                <p className="font-black text-[#064b42]">
                  ✓ Fratrie
                  sélectionnée
                </p>

                <p className="mt-1 text-sm text-[#526b65]">
                  Cet animal
                  sera relié à{" "}
                  <strong>
                    {
                      existingSiblingGroup.label
                    }
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* PAS ENCORE DE CHOIX */}

            {!animal.sibling_group_id && (
              <div className="rounded-[18px] bg-[#f8f4ec] p-4 text-sm leading-6 text-[#6f5a47]">
                Choisissez une
                fratrie déjà
                existante ou
                créez-en une
                nouvelle avant
                de publier
                l&apos;animal.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}