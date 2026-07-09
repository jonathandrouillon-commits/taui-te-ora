"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const mainItems = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔎" },
  { href: "/signalement", icon: "/sos-paw.png", sos: true },
  { href: "#", label: "Menu", icon: "☰", menu: true },
  { href: "/profile", label: "Profil", icon: "👤" },
];
  

const menuItems = [
  { href: "/veterinaires", label: "Vétérinaires", icon: "🩺" },
  { href: "/association", label: "Les Veilleurs de Kali", icon: "❤️" },
  { href: "/toilettage", label: "Toilettage", icon: "✂️" },
  { href: "/gardiennage", label: "Gardiennage", icon: "🏡" },
  { href: "/education", label: "Éducation", icon: "🎓" },
  { href: "/alimentation", label: "Alimentation", icon: "🥣" },
  { href: "/hommage", label: "Hommage à Kali", icon: "❤️" },
];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-[50px] bg-[#f8f4ec] px-6 pb-8 pt-5 shadow-2xl">
            <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[#d6c8b4]" />

            <h2 className="mb-5 text-center text-2xl font-black uppercase tracking-wide text-[#064b42]">
              Menu
            </h2>

            <div className="grid gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 text-[#064b42] shadow-md transition active:scale-95"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1eadf] text-2xl">
                    {item.icon}
                  </span>

                  <span className="text-base font-black">{item.label}</span>
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mt-5 w-full rounded-2xl bg-[#064b42] py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[80] border-t border-[#eadfce] bg-white/95 px-3 pb-3 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-end justify-between">
          {mainItems.map((item) => {
            const active = !item.menu && isActive(item.href);

            if (item.menu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex w-16 flex-col items-center justify-center gap-1"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[#6E7E5D]">
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase text-[#6E7E5D]">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex w-16 flex-col items-center justify-center gap-1"
              >
                <span
                  className={`flex items-center justify-center rounded-full transition ${
                    item.sos
                      ? "h-14 w-14 -translate-y-3 bg-[#D67B52] text-2xl text-white shadow-xl"
                      : active
                        ? "h-10 w-10 bg-[#064b42] text-xl text-white"
                        : "h-10 w-10 text-xl text-[#6E7E5D]"
                  }`}
                >
                  {item.icon}
                </span>

                <span
                  className={`text-[10px] font-black uppercase ${
                    item.sos
                      ? "-mt-2 text-[#D67B52]"
                      : active
                        ? "text-[#064b42]"
                        : "text-[#6E7E5D]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}