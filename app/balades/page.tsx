"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listWalks, type Walk } from "../services/walk.service";

const paceLabel = { calme: "Tranquille", moderee: "Modérée", sportive: "Sportive" };

export default function WalksPage() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listWalks().then(({ data, error: queryError }) => {
      if (queryError) setError("Les balades ne peuvent pas encore être chargées.");
      setWalks((data as Walk[]) || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div><p className="text-sm font-black uppercase tracking-widest text-[#d96b4c]">Communauté</p><h1 className="text-3xl font-black">🐾 Balades & Copains</h1><p className="mt-2 text-sm text-[#416c66]">Des promenades collectives pour socialiser les chiens, jamais pour la reproduction.</p></div>
          <Link href="/balades/creer" className="shrink-0 rounded-full bg-[#ef7f61] px-5 py-3 text-sm font-black text-white shadow">+ Organiser</Link>
        </div>
        {loading && <p className="rounded-3xl bg-white p-6 text-center font-bold">Chargement…</p>}
        {error && <p className="rounded-3xl bg-white p-6 text-center font-bold text-red-700">{error}</p>}
        {!loading && !error && walks.length === 0 && <div className="rounded-3xl bg-white p-8 text-center shadow-sm"><p className="text-4xl">🌴</p><h2 className="mt-3 text-xl font-black">Aucune balade prévue</h2><p className="mt-2 text-sm text-[#416c66]">Sois le premier à en proposer une.</p></div>}
        <div className="grid gap-4 sm:grid-cols-2">
          {walks.map((walk) => <Link key={walk.id} href={`/balades/${walk.id}`} className="rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex justify-between gap-3"><h2 className="text-xl font-black">{walk.title}</h2><span className="h-fit rounded-full bg-[#e5f4ef] px-3 py-1 text-xs font-black">{walk.max_dogs} chiens max.</span></div><p className="mt-4 font-bold">📍 {walk.location}</p><p className="mt-2 text-sm">📅 {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(walk.starts_at))}</p><p className="mt-2 text-sm">🚶 {paceLabel[walk.pace]} · {walk.duration_minutes} min · {walk.audience}</p></Link>)}
        </div>
      </section>
    </main>
  );
}
