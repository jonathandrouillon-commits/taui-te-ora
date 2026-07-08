import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "On ne changera pas le monde, mais on peut changer le leur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#f8f4ec]">
        <header className="sticky top-0 z-50 border-b border-[#eadfce] bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
            <Link
              href="/"
              className="flex items-center gap-2 transition hover:opacity-90"
            >
              <img
                src="/logo.png"
                alt="TAUI TE ORA"
                className="h-10 w-10 object-contain"
              />

              <div className="leading-tight">
                <h1 className="text-sm font-black tracking-tight text-[#064b42]">
                  TAUI TE ORA
                </h1>

                <span className="text-[8px] italic text-gray-400">
                  Powered by{" "}
                  <span className="font-semibold not-italic text-[#064b42]">
                    Les Veilleurs de Kali
                  </span>
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-full border border-[#064b42] bg-white px-4 py-1.5 text-xs font-bold text-[#064b42] shadow-sm transition hover:bg-[#064b42] hover:text-white"
              >
                Connexion
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-[#064b42] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0a6659]"
              >
                Créer un compte
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/login"
                className="rounded-full border border-[#064b42] px-3 py-1 text-[10px] font-bold text-[#064b42]"
              >
                Connexion
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-[#064b42] px-3 py-1 text-[10px] font-bold text-white"
              >
                Créer
              </Link>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}