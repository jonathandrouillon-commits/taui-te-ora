"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuPages = [
    { href: "/info", label: "Info", icon: "ℹ️" },
    { href: "/associations", label: "Associations", icon: "❤️" },
    { href: "/toilettage", label: "Toilettage", icon: "✂️" },
    { href: "/gardiennage", label: "Gardiennage", icon: "🏡" },
    { href: "/education", label: "Éducation", icon: "🎓" },
    { href: "/alimentation", label: "Alimentation", icon: "🥣" },
  ];

  const items = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/search", label: "Recherche", icon: "🔍" },
    {
      href: "/signalement",
      label: "Signaler",
      image: "/icons/sos-paw.png",
      center: true,
    },
    { href: "", label: "Menu", icon: "☰", menu: true },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full"
            aria-label="Fermer le menu"
          />

          <div className="absolute bottom-28 left-1/2 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#064b42]">
                Menu services
              </h2>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-[#F7F2E8] px-4 py-2 text-sm font-black text-[#6E7E5D]"
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-3">
              {menuPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-4 rounded-2xl bg-[#F7F2E8] px-5 py-4 font-black text-[#064b42] transition hover:bg-[#eadfce]"
                >
                  <span className="text-2xl">{page.icon}</span>
                  <span>{page.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[26px] bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-5 items-end gap-1">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.menu
                ? menuOpen
                : pathname.startsWith(item.href);

            if (item.center) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center"
                >
                  <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-2xl transition hover:scale-105">
                    <img
                      src={item.image}
                      alt={item.label}
                      className="h-11 w-11 object-contain"
                    />
                  </div>

                  <span className="mt-0.5 text-[10px] font-black uppercase text-[#C0392B]">
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
                  className={`flex flex-col items-center justify-center rounded-xl px-2 py-1.5 transition ${
                    active
                      ? "bg-[#6E7E5D] text-white"
                      : "text-[#6E7E5D] hover:bg-[#F7F2E8]"
                  }`}
                >
                  <span className="text-2xl leading-none">{item.icon}</span>

                  <span className="mt-1 text-[10px] font-black uppercase leading-none">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-1.5 transition ${
                  active
                    ? "bg-[#6E7E5D] text-white"
                    : "text-[#6E7E5D] hover:bg-[#F7F2E8]"
                }`}
              >
                <span className="text-2xl leading-none">{item.icon}</span>

                <span className="mt-1 text-[10px] font-black uppercase leading-none">
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