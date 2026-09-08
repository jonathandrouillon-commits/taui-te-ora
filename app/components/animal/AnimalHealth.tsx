type AnimalHealthProps = {
  sexe?: string | null;
  sterilise?: boolean | null;
  vaccine?: boolean | null;
  identifie?: boolean | null;
  sante?: string | null;
};

function normalizeSex(
  value?: string | null
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AnimalHealth({
  sexe,
  sterilise,
  vaccine,
  identifie,
  sante,
}: AnimalHealthProps) {
  const normalizedSex =
    normalizeSex(sexe);

  const isMale =
    normalizedSex === "male" ||
    normalizedSex === "m" ||
    normalizedSex === "masculin";

  const isFemale =
    normalizedSex === "femelle" ||
    normalizedSex === "female" ||
    normalizedSex === "f" ||
    normalizedSex === "feminin";

  const sterilisationLabel =
    isMale
      ? "Castré"
      : isFemale
        ? "Stérilisée"
        : "Stérilisé(e)";

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-black text-[#064b42]">
        Santé
      </h2>

      <div className="grid gap-3">
        <Status
          label={sterilisationLabel}
          active={sterilise}
        />

        <Status
          label="Vacciné"
          active={vaccine}
        />

        <Status
          label="Identifié"
          active={identifie}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-[#f4eee3] p-4">
        <p className="font-bold text-[#064b42]">
          Note santé
        </p>

        <p className="mt-2 leading-relaxed text-[#064b42]">
          {sante || "Aucune note santé renseignée."}
        </p>
      </div>
    </div>
  );
}

function Status({
  label,
  active,
}: {
  label: string;
  active?: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#f4eee3] p-4">
      <span className="font-bold text-[#064b42]">
        {label}
      </span>

      <span className="font-black text-[#064b42]">
        {active ? "Oui" : "Non"}
      </span>
    </div>
  );
}
