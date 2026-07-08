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
    href: "/animals",
    label: "Animaux",
    icon: "🐾",
  },
  {
    href: "/report",
    label: "Signaler",
    image: "/icons/sos-paw.png",
    center: true,
  },
  {
    href: "/favorites",
    label: "Favoris",
    icon: "🤍",
  },
  {
    href: "/login",
    label: "Mon compte",
    icon: "👤",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-[32px] bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl">
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
                <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-20 w-20 object-contain transition hover:scale-110"
                  />
                </div>

                <span className="mt-2 text-[11px] font-black uppercase text-[#C0392B]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition ${
                active
                  ? "bg-[#6E7E5D] text-white"
                  : "text-[#6E7E5D]"
              }`}
            >
              <span className="text-3xl">{item.icon}</span>

              <span className="mt-1 text-[11px] font-black uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}