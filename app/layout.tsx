import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "Un nouvel espoir pour les animaux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#f8f4ec]">

        <header className="sticky top-0 z-50 border-b border-[#d9d2c3] bg-white/95 backdrop-blur shadow-sm">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">

            <Link href="/" className="flex items-center gap-5">

              <Image
                src="/logo.png"
                alt="TAUI TE ORA"
                width={82}
                height={82}
                priority
              />

              <div>

                <h1 className="text-4xl font-black tracking-wide text-[#064b42]">
                  TAUI TE ORA
                </h1>

                <p className="text-sm text-gray-500">
                  Un nouvel espoir pour les animaux
                </p>

              </div>

            </Link>

            {/* Powered By */}

            <div className="flex items-center gap-4">

              <div className="text-right">

                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                  Powered by
                </p>

                <p className="text-lg font-black text-[#064b42]">
                  LES VEILLEURS DE KALI
                </p>

              </div>

              <Image
                src="/logo-kali.png"
                alt="Les Veilleurs de Kali"
                width={60}
                height={60}
              />

            </div>

          </div>

        </header>

        <main>{children}</main>

      </body>
    </html>
  );
}