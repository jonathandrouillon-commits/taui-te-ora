type AnimalCompatibilityProps = {
  compatibleChiens?: boolean | null;
  compatibleChats?: boolean | null;
  compatibleEnfants?: boolean | null;
};

export default function AnimalCompatibility({
  compatibleChiens,
  compatibleChats,
  compatibleEnfants,
}: AnimalCompatibilityProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-black text-[#064b42]">
        Compatibilités
      </h2>

      <div className="grid gap-3">
        <Compatibility label="Chiens" value={compatibleChiens} />
        <Compatibility label="Chats" value={compatibleChats} />
        <Compatibility label="Enfants" value={compatibleEnfants} />
      </div>
    </div>
  );
}

function Compatibility({
  label,
  value,
}: {
  label: string;
  value?: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#f4eee3] p-4">
      <span className="font-bold text-[#064b42]">{label}</span>
      <span className="font-black text-[#064b42]">
        {value === null || value === undefined ? "Non renseigné" : value ? "Oui" : "Non"}
      </span>
    </div>
  );
}