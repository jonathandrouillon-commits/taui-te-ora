"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();

  const items = [
    {
      label: "Accueil",
      href: "/",
      icon: "🏠",
    },
    {
      label: "Adopter",
      href: "/adoption",
      icon: "🐾",
    },
    {
      label: "SOS",
      href: "/signalement",
      icon: "🚨",
      special: true,
    },
    {
      label: "Likes",
      href: "/likes",
      icon: "❤️",
    },
    {
      label: "Profil",
      href: "/login?redirect=/dashboard",
      icon: "👤",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#eadfce] bg-white/95 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid h-[70px] max-w-md grid-cols-5 items-center px-2">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.split("?")[0]);

          if (item.special) {
            return (
              <Link
                key={item.href}
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition ${
                active ? "text-[#9c7b54]" : "text-[#6f5a47]"
              }`}
            >
              <span className="text-[20px] leading-none">
                {item.icon}
              </span>

              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}