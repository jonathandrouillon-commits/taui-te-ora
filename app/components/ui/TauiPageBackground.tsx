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
    <main className="relative min-h-screen overflow-hidden bg-[#f8f4ec] pb-28">
      {/* Image principale du fond */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/fond-accueil.jpg')",
        }}
      />

      {/* Voile clair pour rendre les textes lisibles */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#f8f4ec]/80 backdrop-blur-[1px]" />

      {/* Logo fondu au centre */}
      <div className="pointer-events-none fixed inset-0 z-[2] flex items-center justify-center">
        <img
          src="/logo.png"
          alt=""
          className="w-[280px] max-w-[65vw] opacity-[0.05] md:w-[500px]"
        />
      </div>

      {/* Images décoratives de Kali */}
      {showKali && (
        <>
          <img
            src="/kali-hommage.jpg"
            alt=""
            className="pointer-events-none fixed -left-16 top-24 z-[2] h-52 w-52 rotate-[-12deg] rounded-full object-cover opacity-[0.07] md:h-72 md:w-72"
          />

          <img
            src="/kali-hommage.jpg"
            alt=""
            className="pointer-events-none fixed -right-16 top-[34%] z-[2] h-60 w-60 rotate-[10deg] rounded-full object-cover opacity-[0.08] md:h-80 md:w-80"
          />

          <img
            src="/kali-hommage.jpg"
            alt=""
            className="pointer-events-none fixed bottom-10 left-[22%] z-[2] h-40 w-40 rotate-[6deg] rounded-full object-cover opacity-[0.05] md:h-56 md:w-56"
          />
        </>
      )}

      {/* Contenu de la page */}
      <div className="relative z-10">{children}</div>
    </main>
  );
}