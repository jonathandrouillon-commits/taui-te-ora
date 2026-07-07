"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Découvrir", icon: "🏠" },
  { href: "/favorites", label: "Favoris", icon: "❤️" },
  { href: "/adoptant/profile", label: "Adopter", icon: "🐾" },
  { href: "/notifications", label: "Notifs", icon: "🔔" },
  { href: "/login", label: "Profil", icon: "👤" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-[28px] bg-white/90 px-3 py-3 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-black transition ${
                active
                  ? "bg-[#6E7E5D] text-white"
                  : "text-[#6E7E5D] hover:bg-[#F7F2E8]"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}