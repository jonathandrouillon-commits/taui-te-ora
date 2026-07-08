"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Accueil",
    icon: "🏠",
  },
  {
    href: "/search",
    label: "Recherche",
    icon: "🔍",
  },
  {
    href: "/signalement",
    label: "Signaler",
    image: "/icons/sos-paw.png",
    center: true,
  },
  {
    href: "/notifications",
    label: "Notifs",
    icon: "🔔",
  },
  {
    href: "/profile",
    label: "Profil",
    icon: "👤",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[26px] bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end gap-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
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
  );
}