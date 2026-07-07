"use client";

import Link from "next/link";

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function DashboardHeader({
  title,
  subtitle,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
            Espace Association
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#064b42] lg:text-4xl">
            {title}
          </h1>

          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>

        <div className="flex gap-3">
          <Link
            href="/notifications"
            className="rounded-2xl bg-[#f4eee3] px-5 py-3 font-bold text-[#064b42] shadow"
          >
            🔔 Notifications
          </Link>

          <Link
            href="/association/add-animal"
            className="rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white shadow"
          >
            + Ajouter
          </Link>
        </div>
      </div>
    </header>
  );
}