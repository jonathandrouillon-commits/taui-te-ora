type AnimalCompatibilityProps = {
  compatibleChiens?: string | null;
  compatibleChats?: string | null;
  compatibleEnfants?: string | null;
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
        <Compatibility
          label="Chiens"
          value={compatibleChiens}
        />

        <Compatibility
          label="Chats"
          value={compatibleChats}
        />

        <Compatibility
          label="Enfants"
          value={compatibleEnfants}
        />
      </div>
    </div>
  );
}

function Compatibility({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const displayValue =
    typeof value === "string" && value.trim()
      ? value.trim()
      : "Non renseigné";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f4eee3] p-4">
      <span className="font-bold text-[#064b42]">
        {label}
      </span>

      <span className="text-right font-black text-[#064b42]">
        {displayValue}
      </span>
    </div>
  );
}