"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/association/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/association/animals", label: "Mes animaux", icon: "🐶" },
  { href: "/association/add-animal", label: "Ajouter", icon: "➕" },
  { href: "/association/demandes", label: "Demandes", icon: "📥" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[#e2d5bd] bg-white p-6 shadow-sm lg:block">
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
          TAUI TE ORA
        </p>
        <h1 className="mt-2 text-2xl font-black text-[#064b42]">
          Association
        </h1>
      </div>

      <nav className="space-y-3">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition ${
                active
                  ? "bg-[#064b42] text-white"
                  : "bg-[#f4eee3] text-[#064b42] hover:bg-[#eadfcf]"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}