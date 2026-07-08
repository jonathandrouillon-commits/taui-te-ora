type AnimalHealthProps = {
  sterilise?: boolean | null;
  vaccine?: boolean | null;
  identifie?: boolean | null;
  sante?: string | null;
};

export default function AnimalHealth({
  sterilise,
  vaccine,
  identifie,
  sante,
}: AnimalHealthProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-black text-[#064b42]">
        Santé
      </h2>

      <div className="grid gap-3">
        <Status label="Stérilisé" active={sterilise} />
        <Status label="Vacciné" active={vaccine} />
        <Status label="Identifié" active={identifie} />
      </div>

      <div className="mt-5 rounded-2xl bg-[#f4eee3] p-4">
        <p className="font-bold text-[#064b42]">
          Note santé
        </p>

        <p className="mt-2 text-[#064b42] leading-relaxed">
          {sante || "font-bold text-[#064b42]"}
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