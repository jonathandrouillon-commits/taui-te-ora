"use client";

import Link from "next/link";

type TopBarProps = {
  title?: string;
  subtitle?: string;
};

export default function TopBar({
  title = "TAUI TE ORA",
  subtitle = "Powered by Les Veilleurs de Kali",
}: TopBarProps) {
  return (
    <header className="mx-auto mb-6 flex w-full max-w-md items-center justify-between rounded-[28px] bg-white/80 px-5 py-4 shadow-xl backdrop-blur">
      <Link
        href="/"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F2E8] text-2xl shadow"
      >
        🐾
      </Link>

      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D8A33A]">
          {subtitle}
        </p>
        <h1 className="text-2xl font-black text-[#4B5A3D]">{title}</h1>
      </div>

      <Link
        href="/notifications"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F2E8] text-2xl shadow"
      >
        🔔
      </Link>
    </header>
  );
}