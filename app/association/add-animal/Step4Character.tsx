"use client";

type Props = {
  animal: Record<string, string | number | boolean | string[] | undefined>;
  updateField: (field: string, value: string | string[]) => void;
};

const SELECT_OPTIONS = {
  energy_level: [
    ["", "Sélectionner"],
    ["tres_calme", "Très calme"],
    ["calme", "Calme"],
    ["modere", "Modéré"],
    ["actif", "Actif"],
    ["tres_actif", "Très actif"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  human_contact: [
    ["", "Sélectionner"],
    ["tres_proche", "Très proche de l'humain"],
    ["sociable", "Sociable"],
    ["independant", "Indépendant"],
    ["craintif", "Craintif"],
    ["tres_craintif", "Très craintif"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  daily_activity_need: [
    ["", "Sélectionner"],
    ["faible", "Faible"],
    ["modere", "Modéré"],
    ["important", "Important"],
    ["tres_important", "Très important"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  housing_need: [
    ["", "Sélectionner"],
    ["appartement_ok", "Appartement OK"],
    ["maison_souhaitee", "Maison souhaitée"],
    ["jardin_souhaite", "Jardin souhaité"],
    ["jardin_obligatoire", "Jardin obligatoire"],
    ["jardin_cloture_obligatoire", "Jardin clôturé obligatoire"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  alone_tolerance: [
    ["", "Sélectionner"],
    ["supporte_bien", "Supporte bien la solitude"],
    ["quelques_heures", "Quelques heures"],
    ["peu_de_solitude", "Peu de solitude"],
    ["a_travailler", "À travailler"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  adopter_experience_required: [
    ["", "Sélectionner"],
    ["premiere_adoption_ok", "Première adoption OK"],
    ["experience_souhaitee", "Un peu d'expérience souhaitée"],
    ["experimente", "Adoptant expérimenté"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
  education_level: [
    ["", "Sélectionner"],
    ["facile", "Facile / bonnes bases"],
    ["bases_a_poursuivre", "Bases à poursuivre"],
    ["education_necessaire", "Éducation nécessaire"],
    ["travail_specifique", "Travail spécifique nécessaire"],
    ["inconnu", "❓ Inconnu / non évalué"],
  ],
} as const;

const VIGILANCE_OPTIONS = [
  ["fugueur", "Fugueur"],
  ["anxiete_separation", "Anxiété de séparation"],
  ["reactif_chiens", "Réactif avec les chiens"],
  ["reactif_humains", "Réactif avec les humains"],
  ["protection_ressources", "Protection de ressources"],
  ["besoins_medicaux", "Besoins médicaux particuliers"],
] as const;

export default function Step4Character({
  animal,
  updateField,
}: Props) {
  const vigilancePoints = Array.isArray(animal.vigilance_points)
    ? animal.vigilance_points
    : [];

  function toggleVigilance(value: string) {
    const next = vigilancePoints.includes(value)
      ? vigilancePoints.filter((item) => item !== value)
      : [...vigilancePoints, value];

    updateField("vigilance_points", next);
  }

  function clearVigilance() {
    updateField("vigilance_points", []);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-[#064b42]">
          Caractère & compatibilités
        </h2>

        <p className="mt-2 text-sm text-[#6f5a47]">
          Cette partie sert au calcul de compatibilité avec les adoptants.
          Quelques clics suffisent. Si vous ne savez pas encore, choisissez
          « Inconnu / non évalué ».
        </p>
      </div>

      <section className="rounded-[26px] bg-[#faf7f2] p-5">
        <h3 className="text-xl font-black text-[#064b42]">
          Profil rapide
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <QuickSelect
            title="Niveau d'énergie"
            value={String(animal.energy_level ?? "")}
            options={SELECT_OPTIONS.energy_level}
            onChange={(value) => updateField("energy_level", value)}
          />

          <QuickSelect
            title="Contact humain"
            value={String(animal.human_contact ?? "")}
            options={SELECT_OPTIONS.human_contact}
            onChange={(value) => updateField("human_contact", value)}
          />

          <QuickSelect
            title="Besoin d'activité quotidienne"
            value={String(animal.daily_activity_need ?? "")}
            options={SELECT_OPTIONS.daily_activity_need}
            onChange={(value) =>
              updateField("daily_activity_need", value)
            }
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-[#faf7f2] p-5">
        <h3 className="text-xl font-black text-[#064b42]">
          Environnement
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <QuickSelect
            title="Habitat"
            value={String(animal.housing_need ?? "")}
            options={SELECT_OPTIONS.housing_need}
            onChange={(value) => updateField("housing_need", value)}
          />

          <QuickSelect
            title="Tolérance à la solitude"
            value={String(animal.alone_tolerance ?? "")}
            options={SELECT_OPTIONS.alone_tolerance}
            onChange={(value) =>
              updateField("alone_tolerance", value)
            }
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-[#faf7f2] p-5">
        <h3 className="text-xl font-black text-[#064b42]">
          Adoption & éducation
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <QuickSelect
            title="Expérience adoptant nécessaire"
            value={String(
              animal.adopter_experience_required ?? ""
            )}
            options={SELECT_OPTIONS.adopter_experience_required}
            onChange={(value) =>
              updateField("adopter_experience_required", value)
            }
          />

          <QuickSelect
            title="Niveau d'éducation"
            value={String(animal.education_level ?? "")}
            options={SELECT_OPTIONS.education_level}
            onChange={(value) =>
              updateField("education_level", value)
            }
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-[#faf7f2] p-5">
        <h3 className="text-xl font-black text-[#064b42]">
          Compatibilités
        </h3>

        <p className="mt-1 text-sm text-[#6f5a47]">
          « À tester » ou « Inconnu » n'est jamais considéré comme une
          incompatibilité.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <CompatibilitySelect
            title="Avec les chiens"
            value={String(animal.compatible_chiens ?? "")}
            onChange={(value) =>
              updateField("compatible_chiens", value)
            }
          />

          <CompatibilitySelect
            title="Avec les chats"
            value={String(animal.compatible_chats ?? "")}
            onChange={(value) =>
              updateField("compatible_chats", value)
            }
          />

          <CompatibilitySelect
            title="Avec les enfants"
            value={String(animal.compatible_enfants ?? "")}
            onChange={(value) =>
              updateField("compatible_enfants", value)
            }
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-[#faf7f2] p-5">
        <h3 className="text-xl font-black text-[#064b42]">
          Points de vigilance
        </h3>

        <p className="mt-1 text-sm text-[#6f5a47]">
          Facultatif. Cochez uniquement les points réellement connus.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VIGILANCE_OPTIONS.map(([value, label]) => {
            const checked = vigilancePoints.includes(value);

            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleVigilance(value)}
                className={`rounded-2xl border-2 px-4 py-3 text-left font-bold transition ${
                  checked
                    ? "border-[#df8995] bg-[#fff0f2] text-[#9f4f5d]"
                    : "border-[#eadfce] bg-white text-[#064b42]"
                }`}
              >
                {checked ? "✓ " : ""}
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={clearVigilance}
          className={`mt-4 rounded-full px-5 py-2.5 text-sm font-black transition ${
            vigilancePoints.length === 0
              ? "bg-[#eaf4ef] text-[#064b42]"
              : "bg-white text-[#6f5a47]"
          }`}
        >
          {vigilancePoints.length === 0
            ? "✓ Aucun point de vigilance connu"
            : "Aucun point de vigilance connu"}
        </button>
      </section>

      <section className="space-y-5">
        <div>
          <label className="mb-2 block text-lg font-bold">
            Caractère de l'animal
          </label>

          <textarea
            placeholder="Quelques mots suffisent : affectueux, joueur, calme, timide..."
            value={String(animal.description_character ?? "")}
            onChange={(e) =>
              updateField("description_character", e.target.value)
            }
            className="min-h-36 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-lg font-bold">
            Famille idéale
            <span className="ml-2 text-sm font-normal text-gray-500">
              facultatif
            </span>
          </label>

          <textarea
            placeholder="Exemple : famille calme, présente, avec jardin clôturé..."
            value={String(animal.ideal_family ?? "")}
            onChange={(e) =>
              updateField("ideal_family", e.target.value)
            }
            className="min-h-28 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
          />
        </div>
      </section>
    </div>
  );
}

function QuickSelect({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{title}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border bg-white p-4 text-base outline-none"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue || "empty"} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompatibilitySelect({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{title}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border bg-white p-4 text-lg outline-none"
      >
        <option value="">Sélectionner</option>
        <option value="oui">✅ Oui</option>
        <option value="non">❌ Non</option>
        <option value="a_tester">🧪 À tester</option>
        <option value="inconnu">❓ Inconnu / non évalué</option>
      </select>
    </div>
  );
}
