"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import DashboardMessages from "../components/dashboard/DashboardMessages";

export default function MessagesPage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42] sm:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#064b42] shadow"
          >
            ← Retour
          </button>

          <Link
            href="/"
            className="rounded-full border border-[#d9cec7] bg-white px-5 py-2.5 text-sm font-black text-[#064b42]"
          >
            Accueil
          </Link>
        </div>

        <DashboardMessages fullPage />
      </section>
    </main>
  );
}
