type AnimalHistoryProps = {
  histoire?: string | null;
  lieuCapture?: string | null;
  tempsRue?: string | null;
};

export default function AnimalHistory({
  histoire,
  lieuCapture,
  tempsRue,
}: AnimalHistoryProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-black text-[#064b42]">Son histoire</h2>

      <p className="text-gray-700">
        {histoire || "Aucune histoire renseignée pour le moment."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Detail label="Lieu de capture" value={lieuCapture || "Non renseigné"} />
        <Detail label="Temps dans la rue" value={tempsRue || "Non renseigné"} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4eee3] p-4">
      <p className="text-xs font-black uppercase text-[#b68b2f]">{label}</p>
      <p className="mt-1 font-bold text-[#064b42]">{value}</p>
    </div>
  );
}