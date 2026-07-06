"use client";

import { Clock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center p-8 text-[#064b42]">
      <section className="max-w-2xl rounded-[40px] bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff3dc]">
          <Clock size={52} />
        </div>

        <h1 className="text-5xl font-black">Compte en attente</h1>

        <p className="mt-5 text-lg leading-relaxed text-gray-600">
          Votre compte TAUI TE ORA a bien été créé. Il doit maintenant être
          validé manuellement par l’administrateur du site avant d’accéder à
          l’application.
        </p>

        <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-2xl bg-[#f8f4ec] p-5">
            <ShieldCheck className="mb-3" />
            <h2 className="font-black">Pourquoi ?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Cela permet de protéger les animaux, les associations et les
              adoptants.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f8f4ec] p-5">
            <Mail className="mb-3" />
            <h2 className="font-black">Validation</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vous serez informé dès que votre compte sera validé.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-[#064b42] px-8 py-4 font-black text-white"
        >
          Retour connexion
        </Link>
      </section>
    </main>
  );
}