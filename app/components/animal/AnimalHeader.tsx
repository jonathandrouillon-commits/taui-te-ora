type AnimalHeaderProps = {
  nom?: string | null;
  statut?: string | null;
  type?: string | null;
  sexe?: string | null;
  age?: string | null;
  race?: string | null;
  taille?: string | null;
  poids?: string | null;
  ile?: string | null;
  localisation?: string | null;
  association?: string | null;
};

export default function AnimalHeader({
  nom,
  statut,
  type,
  sexe,
  age,
  race,
  taille,
  poids,
  ile,
  localisation,
  association,
}: AnimalHeaderProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="mb-2 text-sm font-black uppercase tracking-wide text-[#b68b2f]">
        {statut || "Disponible"}
      </p>

      <h1 className="text-4xl font-black text-[#064b42]">
        {nom || "Animal sans nom"}
      </h1>

      <p className="mt-2 text-gray-600">
        {type || "Animal"} · {sexe || "Sexe non renseigné"} ·{" "}
        {age || "Âge non renseigné"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Info label="Race" value={race || "Non renseignée"} />
        <Info label="Taille" value={taille || "Non renseignée"} />
        <Info label="Poids" value={poids || "Non renseigné"} />
        <Info label="Île" value={ile || "Non renseignée"} />
        <Info label="Localisation" value={localisation || "Non renseignée"} />
        <Info label="Association" value={association || "Non renseignée"} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4eee3] p-4">
      <p className="text-xs font-black uppercase text-[#b68b2f]">{label}</p>
      <p className="mt-1 break-words font-bold text-[#064b42]">{value}</p>
    </div>
  );
}