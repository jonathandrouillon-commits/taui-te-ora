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
    {
      href: "/signalement",
      label: "SOS",
      icon: "/sos-paw.png",
      sos: true,
    },
    { href: "#", label: "Menu", icon: "☰", menu: true },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];

  const menuItems = [
    { href: "/veterinaires", label: "Vétérinaires", icon: "🩺" },
    {
      href: "/association",
      label: "Les Veilleurs de Kali",
      icon: "❤️",
    },
    { href: "/toilettage", label: "Toilettage", icon: "✂️" },
    { href: "/gardiennage", label: "Gardiennage", icon: "🏡" },
    { href: "/education", label: "Éducation", icon: "🎓" },
    { href: "/alimentation", label: "Alimentation", icon: "🥣" },
    { href: "/hommage-kali", label: "Hommage à Kali", icon: "❤️" },
  ];

  return (
    <>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[80] bg-black/30"
          />

          <div className="fixed inset-x-0 bottom-[105px] z-[90] mx-auto max-h-[65vh] w-[calc(100%-24px)] max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-14 rounded-full bg-gray-300" />
            </div>

            <div className="relative px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-5 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f4ec] text-xl font-black text-[#064b42] shadow-sm transition active:scale-95"
              >
                ✕
              </button>

              <h2 className="mb-4 text-center text-lg font-black text-[#064b42]">
                Menu
              </h2>

              <div className="max-h-[50vh] space-y-2 overflow-y-auto pb-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl bg-[#f8f4ec] px-4 py-3 shadow-sm transition active:scale-95"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      {item.icon}
                    </span>

                    <span className="text-base font-black text-[#064b42]">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[80] border-t border-[#eadfce] bg-white/95 px-2 pb-2 pt-1 shadow-[0_-6px_24px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-1 pt-1">
          {mainItems.map((item) => {
            const isActive =
              item.href !== "#" &&
              (pathname === item.href ||
                pathname.startsWith(`${item.href}/`));

            if (item.menu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center justify-center gap-0.5"
                >
                  <span
                    className={`text-[24px] leading-none ${
                      menuOpen ? "text-[#064b42]" : "text-[#6f7b63]"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`text-[9px] font-black uppercase leading-none ${
                      menuOpen ? "text-[#064b42]" : "text-[#6f7b63]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.sos) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -mt-5 flex items-center justify-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#dc7a4b] shadow-xl ring-[3px] ring-white">
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="h-full w-full object-contain"
                    />
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[24px] leading-none">{item.icon}</span>

                <span
                  className={`text-[9px] font-black uppercase leading-none ${
                    isActive ? "text-[#064b42]" : "text-[#6f7b63]"
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