"use client";

import { useParams } from "next/navigation";

export default function AnimalPage() {
  const params = useParams();

  return (
    <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center text-[#064b42]">
      <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
        <h1 className="text-5xl font-black">Profil Animal</h1>
        <p className="mt-6 text-xl font-bold">ID : {String(params.id)}</p>
      </div>
    </main>
  );
}