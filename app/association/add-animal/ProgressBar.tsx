export default function ProgressBar({ step }: { step: number }) {
  const steps = ["Infos", "Photos", "Santé", "Caractère", "Histoire", "Lieu", "Aperçu"];

  return (
    <div className="mt-8 grid grid-cols-7 gap-2">
      {steps.map((label, index) => {
        const active = step >= index + 1;

        return (
          <div key={label}>
            <div
              className={`h-3 rounded-full ${
                active ? "bg-[#064b42]" : "bg-gray-200"
              }`}
            />
            <p className="mt-2 text-center text-xs font-bold">{label}</p>
          </div>
        );
      })}
    </div>
  );
}