import Link from "next/link";

function PawShape({
  label,
  sublabel,
  href,
  variant,
}: {
  label: string;
  sublabel: string;
  href: string;
  variant: "primary" | "secondary";
}) {
  const primary = variant === "primary";

  return (
    <Link
      href={href}
      className={`group relative flex h-32 w-32 flex-col items-center justify-center rounded-full transition-all duration-300 hover:scale-110 ${
        primary
          ? "bg-[#064b42] text-white shadow-xl"
          : "border-2 border-[#064b42] bg-white text-[#064b42] shadow-lg"
      }`}
    >
      {/* Coussinets */}
      <div className="absolute -top-3 left-4 h-7 w-7 rounded-full bg-current opacity-20" />
      <div className="absolute -top-5 left-14 h-8 w-8 rounded-full bg-current opacity-20" />
      <div className="absolute -top-3 right-4 h-7 w-7 rounded-full bg-current opacity-20" />
      <div className="absolute top-5 h-14 w-16 rounded-full bg-current opacity-20" />

      <span className="relative text-2xl">🐾</span>

      <span className="relative mt-2 px-2 text-center text-xs font-extrabold uppercase leading-tight">
        {label}
      </span>

      <span className="relative mt-1 px-2 text-center text-[10px] opacity-80">
        {sublabel}
      </span>
    </Link>
  );
}

export default function PawAuthButtons() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
      <PawShape
        href="/register"
        label="Créer un compte"
        sublabel="Rejoindre"
        variant="primary"
      />

      <PawShape
        href="/login"
        label="Connexion"
        sublabel="Mon espace"
        variant="secondary"
      />
    </div>
  );
}