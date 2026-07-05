"use client";

import Image from "next/image";
import { Bell, Search, SlidersHorizontal } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full mb-8">
      <div className="flex items-start justify-between">
        <Image
          src="/logo.png"
          alt="logo"
          width={300}
          height={210}
          priority
          className="object-contain"
        />

        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-4 border-white">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300"
            alt="Profil"
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="flex-1 bg-white rounded-full px-6 py-5 shadow-md flex items-center">
          <Search size={24} className="text-gray-400 mr-4" />

          <input
            type="text"
            placeholder="Rechercher un animal..."
            className="flex-1 outline-none bg-transparent text-xl"
          />
        </div>

        <button className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center">
          <Bell size={28} className="text-[#0f5d52]" />
        </button>

        <button className="bg-[#0f5d52] rounded-full px-8 text-white flex items-center gap-3 shadow-md">
          <SlidersHorizontal size={24} />
          <span className="text-xl font-semibold">Filtres</span>
        </button>
      </div>
    </header>
  );
}