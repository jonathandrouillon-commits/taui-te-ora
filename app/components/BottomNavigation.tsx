"use client";

import { ClipboardList, Heart, Home, PawPrint, User } from "lucide-react";

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-5xl -translate-x-1/2 rounded-full bg-white/95 px-8 py-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-around text-sm font-bold text-[#2d3b38]">
        <div className="flex flex-col items-center gap-1 text-[#064b42]">
          <Home size={28} fill="#064b42" />
          <span>Accueil</span>
          <div className="h-1 w-10 rounded-full bg-[#064b42]" />
        </div>

        <div className="flex flex-col items-center gap-1 text-gray-500">
          <Heart size={28} />
          <span>Favoris</span>
        </div>

        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full bg-[#064b42] text-white shadow-2xl">
          <PawPrint size={46} fill="white" />
        </div>

        <div className="flex flex-col items-center gap-1 text-gray-500">
          <ClipboardList size={28} />
          <span>Adoptions</span>
        </div>

        <div className="flex flex-col items-center gap-1 text-gray-500">
          <User size={28} />
          <span>Profil</span>
        </div>
      </div>
    </nav>
  );
}