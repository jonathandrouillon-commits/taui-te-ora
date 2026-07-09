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
    { href: "/signalement", label: "SOS", icon: "🚨", sos: true },
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
    { href: "/hommage-kali", label: "Hommage à Kali", icon: "❤️" },
  ];

  return (
    <>
      {menuOpen && (
        <>
          <button
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[80] bg-black/30"
          />

          <div className="fixed inset-x-0 bottom-[82px] z-[90] mx-auto max-h-[70vh] w-full max-w-lg overflow-hidden rounded-t-[2rem] bg-white shadow-2xl">
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-14 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pb-5 pt-4">
              <h2 className="mb-4 text-center text-xl font-black text-[#064b42]">
                Menu
              </h2>

              <div className="max-h-[55vh] space-y-3 overflow-y-auto pb-3">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-4 rounded-3xl bg-[#f8f4ec] px-5 py-4 shadow-sm transition active:scale-95"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                      {item.icon}
                    </span>

                    <span className="text-lg font-black text-[#064b42]">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#eadfce] bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-3 pt-2">
          {mainItems.map((item) => {
            const isActive =
              item.href !== "#" &&
              (pathname === item.href || pathname.startsWith(item.href + "/"));

            if (item.menu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <span
                    className={`text-3xl ${
                      menuOpen ? "text-[#064b42]" : "text-[#6f7b63]"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`text-xs font-black uppercase ${
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
                  className="relative -mt-8 flex flex-col items-center justify-center gap-1"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dc7a4b] text-3xl text-white shadow-xl ring-4 ring-white">
                    {item.icon}
                  </span>

                  <span className="text-xs font-black uppercase text-[#dc7a4b]">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1"
              >
                <span className="text-3xl">{item.icon}</span>

                <span
                  className={`text-xs font-black uppercase ${
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