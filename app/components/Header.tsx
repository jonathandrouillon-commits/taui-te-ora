"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import NotificationBadge from "./NotificationBadge";

export default function Header() {
  const associations = [
    {
      name: "Les Veilleurs de Kali",
      href: "/association",
    },
    {
      name: "Sev ORA Animaux",
      href: "/gardiennage",
    },
    {
      name: "SPAP",
      href: "/association/spap",
    },
    {
      name: "ARPAP",
      href: "/association/arpap",
    },
    {
      name: "Les 4 Pattes de Papara",
      href: "/association/les-4-pattes-de-papara",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#eadfce] bg-[#f7f2e9]/95 px-3 py-1 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="TAUI TE ORA"
              width={80}
              height={48}
              priority
              className="h-6 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/"
              className="text-xs font-black text-[#064b42] hover:text-[#b58b5b]"
            >
              Accueil
            </Link>

            <Link
              href="/adoption"
              className="text-xs font-black text-[#064b42] hover:text-[#b58b5b]"
            >
              Adoption
            </Link>

            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-black text-[#064b42] hover:text-[#b58b5b]"
              >
                Associations <ChevronDown size={14} />
              </button>

              <div className="invisible absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                {associations.map((association) => (
                  <Link
                    key={association.href}
                    href={association.href}
                    className="block rounded-xl px-4 py-3 text-sm font-bold text-[#064b42] hover:bg-[#f8f4ec]"
                  >
                    {association.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#0f5d52] shadow transition hover:bg-gray-100"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#0f5d52] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow transition hover:bg-[#0b4d44]"
            >
              Créer un compte
            </Link>

            <Link
              href="/notifications"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition hover:scale-105"
            >
              <NotificationBadge />
            </Link>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <div className="flex h-8 flex-1 items-center rounded-full bg-white px-3 shadow">
            <Search size={15} className="mr-2 flex-shrink-0 text-gray-400" />

            <input
              type="text"
              placeholder="Rechercher un animal..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
            />
          </div>

          <button className="flex h-8 items-center gap-1 rounded-full bg-[#0f5d52] px-3 text-white shadow transition hover:bg-[#0b4d44]">
            <SlidersHorizontal size={15} />

            <span className="hidden text-[11px] font-semibold sm:block">
              Filtres
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}