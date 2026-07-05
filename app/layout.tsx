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

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <Link
              href="/"
              className="flex items-center gap-4"
            >
              <Image
                src="/logo.png"
                alt="TAUI TE ORA"
                width={90}
                height={90}
                priority
              />

              <div>
                <h1 className="text-3xl font-black text-[#064b42]">
                  TAUI TE ORA
                </h1>

                <p className="text-sm text-gray-500">
                  Un nouvel espoir pour les animaux
                </p>
              </div>
            </Link>

          </div>
        </header>

        <main>
          {children}
        </main>

      </body>
    </html>
  );
}