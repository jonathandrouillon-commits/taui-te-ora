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
        {type || "Animal"} � {sexe || "Sexe non renseign�"} �{" "}
        {age || "�ge non renseign�"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Info label="Race" value={race || "Non renseign�e"} />
        <Info label="Taille" value={taille || "Non renseign�e"} />
        <Info label="Poids" value={poids || "Non renseign�"} />
        <Info label="�le" value={ile || "Non renseign�e"} />
        <Info label="Localisation" value={localisation || "Non renseign�e"} />
        <Info label="Association" value={association || "Non renseign�e"} />
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