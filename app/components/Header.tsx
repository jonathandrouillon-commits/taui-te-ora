"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import NotificationBadge from "./NotificationBadge";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#f7f2e9]/95 backdrop-blur border-b border-[#eadfce] px-3 py-1">
      <div className="mx-auto max-w-6xl">

        {/* Ligne supérieure */}
        <div className="flex items-center justify-between">

          {/* Logo */}
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

          {/* Actions */}
          <div className="flex items-center gap-1.5">

            <Link
              href="/login"
              className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#0f5d52] shadow hover:bg-gray-100 transition"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#0f5d52] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow hover:bg-[#0b4d44] transition"
            >
              Créer un compte
            </Link>

            <Link
              href="/notifications"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow hover:scale-105 transition"
            >
              <NotificationBadge />
            </Link>

          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mt-1 flex items-center gap-2">

          <div className="flex h-8 flex-1 items-center rounded-full bg-white px-3 shadow">

            <Search
              size={15}
              className="mr-2 text-gray-400 flex-shrink-0"
            />

            <input
              type="text"
              placeholder="Rechercher un animal..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
            />
          </div>

          <button
            className="flex h-8 items-center gap-1 rounded-full bg-[#0f5d52] px-3 text-white shadow hover:bg-[#0b4d44] transition"
          >
            <SlidersHorizontal size={15} />

            <span className="hidden sm:block text-[11px] font-semibold">
              Filtres
            </span>
          </button>

        </div>

      </div>
    </header>
  );
}