import type { ReactNode } from "react";

type TauiPageBackgroundProps = {
  children: ReactNode;
  showKali?: boolean;
};

export default function TauiPageBackground({
  children,
  showKali = true,
}: TauiPageBackgroundProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f0e6] pb-28">
      {/* Fond principal Taui Te Ora avec Kali */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/fond-accueil.jpg')",
        }}
      />

      {/* Voile pastel très léger pour garder le fond visible */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#fff8f1]/38" />

      {/* Lumière douce centrale derrière le contenu */}
      <div
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,250,244,0.32) 0%, rgba(255,250,244,0.10) 38%, rgba(255,250,244,0) 72%)",
        }}
      />

      {/* Kali reste visible dans le fond principal.
          On évite ici les anciennes copies rondes qui surchargeaient le design. */}
      {showKali && (
        <div className="pointer-events-none fixed inset-0 z-[3]">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#fff8f1]/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff8f1]/35 to-transparent" />
        </div>
      )}

      {/* Contenu */}
      <div className="relative z-10">{children}</div>
    </main>
  );
}