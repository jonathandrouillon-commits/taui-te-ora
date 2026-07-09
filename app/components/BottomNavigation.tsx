"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuPages = [
    { label: "Vétérinaires", href: "/veterinaires", icon: "🩺" },
    { label: "Les Veilleurs de Kali", href: "/association/lesveilleursdekali", icon: "🐾" },
    { label: "Toilettage", href: "/toilettage", icon: "✂️" },
    { label: "Gardiennage", href: "/gardiennage", icon: "🏡" },
    { label: "Éducation", href: "/education", icon: "🎓" },
    { label: "Alimentation", href: "/alimentation", icon: "🥣" },
    { label: "Hommage", href: "/hommage", icon: "🕯️" },
  ];

  const items = [
    { label: "Accueil", href: "/", icon: "🏠" },
    { label: "Adopter", href: "/adoption", icon: "🐾" },
    { label: "SOS", href: "/signalement", icon: "🚨", special: true },
    { label: "Search", href: "/search", icon: "🔎" },
    { label: "Menu", href: "", icon: "☰", menu: true },
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden">
          <button
            type="button"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full"
            aria-label="Fermer le menu"
          />

          <div className="absolute bottom-[82px] left-4 right-4 max-h-[70vh] overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#064b42]">Menu</h2>

              <button
                type="button"
                onClick={closeMenu}
                className="rounded-full bg-[#f8f4ec] px-4 py-2 font-bold text-[#064b42]"
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-3">
              {menuPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={closeMenu}
                  className="flex items-center gap-4 rounded-2xl bg-[#f8f4ec] px-5 py-4 font-bold text-[#064b42]"
                >
                  <span className="text-2xl">{page.icon}</span>
                  <span>{page.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#eadfce] bg-white/95 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
        <div className="mx-auto grid h-[70px] max-w-md grid-cols-5 items-center px-2">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.menu
                ? menuOpen
                : pathname.startsWith(item.href.split("?")[0]);

            if (item.special) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="mb-1 flex h-[46px] w-[46px] -translate-y-3 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-lg shadow-red-300">
                    {item.icon}
                  </div>

                  <span className="-mt-3 text-[10px] font-bold text-red-500">
                    {item.label}
                  </span>
                </Link>
              );
            }

            if (item.menu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition ${
                    active ? "text-[#9c7b54]" : "text-[#6f5a47]"
                  }`}
                >
                  <span className="text-[20px] leading-none">{item.icon}</span>
                  <span className="text-[10px] font-semibold leading-none">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition ${
                  active ? "text-[#9c7b54]" : "text-[#6f5a47]"
                }`}
              >
                <span className="text-[20px] leading-none">{item.icon}</span>
                <span className="text-[10px] font-semibold leading-none">
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