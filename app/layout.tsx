import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import BottomNavigation from "./components/BottomNavigation";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "On ne changera pas le monde, mais on peut changer le leur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const associations = [
    { label: "Les Veilleurs de Kali", href: "/association/lesveilleursdekali" },
    { label: "PLUM", href: "/association/plum" },
    { label: "SPAP", href: "/association/spap" },
    { label: "ARPAP", href: "/association/arpap" },
    { label: "Ia Maitai", href: "/association/iamaitai" },
    { label: "Les 4 Pattes de Papara", href: "/association/les4pattesdepapara" },
  ];

  return (
    <html lang="fr">
      <body className="bg-[#f8f4ec]">
        <header className="sticky top-0 z-50 border-b border-[#eadfce] bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-90">
              <img src="/logo.png" alt="TAUI TE ORA" className="h-10 w-10 object-contain" />

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

            <nav className="hidden items-center gap-4 md:flex">
              <Link href="/" className="text-xs font-black text-[#064b42]">
                Accueil
              </Link>

              <Link href="/adoption" className="text-xs font-black text-[#064b42]">
                Adoption
              </Link>

              <div className="group relative">
                <button
                  type="button"
                  className="text-xs font-black text-[#064b42]"
                >
                  Associations ▼
                </button>

                <div className="invisible absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl bg-white p-3 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                  {associations.map((association) => (
                    <Link
                      key={association.href}
                      href={association.href}
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-[#064b42] hover:bg-[#f8f4ec]"
                    >
                      {association.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-full border border-[#064b42] bg-white px-4 py-1.5 text-xs font-bold text-[#064b42]"
              >
                Connexion
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-[#064b42] px-4 py-1.5 text-xs font-bold text-white"
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

        <BottomNavigation />
      </body>
    </html>
  );
}