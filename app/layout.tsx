import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "Plateforme d'adoption animale",
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
        <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

            <Link
              href="/"
              className="flex items-center gap-4 hover:opacity-90 transition"
            >
              <Image
  src="/logo.png"
  alt="TAUI TE ORA"
  width={90}
  height={90}
  priority
/>

              <div>
                <h1 className="text-2xl font-black text-[#064b42]">
                  TAUI TE ORA
                </h1>

                <p className="text-sm text-gray-500">
                  Changer une vie
                </p>
              </div>
            </Link>

          </div>
        </header>

        {/* CONTENU */}
        <main>{children}</main>

      </body>
    </html>
  );
}