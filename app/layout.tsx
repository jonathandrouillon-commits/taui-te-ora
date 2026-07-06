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

        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-4">

              <img
                src="/logo.png"
                alt="TAUI TE ORA"
                className="h-[90px] w-[90px] object-contain transition duration-300 hover:scale-105"
              />

              <div>

                <div className="flex items-end gap-3">

                  <h1 className="text-3xl font-black tracking-tight text-[#064b42]">
                    TAUI TE ORA
                  </h1>

                  <span className="mb-1 text-[8px] italic text-gray-400">
                    Powered by
                    <span className="ml-1 font-semibold not-italic text-[#064b42]">
                      Les Veilleurs de Kali
                    </span>
                  </span>

                </div>

                <p className="text-sm text-gray-500">
                  On ne changera pas le monde, mais on peut changer le leur.
                </p>

              </div>

            </Link>

            {/* Boutons */}
            <div className="flex items-center gap-3">

              <Link href="/register">
                <button className="rounded-full bg-[#064b42] px-6 py-3 font-bold text-white transition duration-300 hover:scale-105 hover:bg-[#0a6659]">
                  🐾 Créer un compte
                </button>
              </Link>

              <Link href="/login">
                <button className="rounded-full border-2 border-[#064b42] bg-white px-6 py-3 font-bold text-[#064b42] transition duration-300 hover:scale-105 hover:bg-[#064b42] hover:text-white">
                  Connexion
                </button>
              </Link>

            </div>

          </div>
        </header>

        <main>{children}</main>

      </body>
    </html>
  );
}