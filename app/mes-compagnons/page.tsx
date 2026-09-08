"use client";

import Link from "next/link";
import {
  PawPrint,
  Plus,
  MapPin,
  ShieldCheck,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";

export default function MesCompagnonsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8 text-[#3b2417]">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ef919b] text-white shadow">
                  <PawPrint size={24} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                    Mes Compagnons
                  </h1>

                  <p className="mt-1 text-sm text-[#6f625a] sm:text-base">
                    Les animaux qui partagent votre vie.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/mes-compagnons/ajouter"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#0b5e53] active:scale-[0.98]"
            >
              <Plus size={18} />
              Ajouter un compagnon
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] bg-white p-6 shadow">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#064b42]">
                  Pourquoi créer le profil de votre animal ?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                  Une fois votre compagnon enregistré, ses informations
                  principales pourront être réutilisées dans Taui Te Ora pour
                  les balades, les activités communautaires et surtout pour
                  créer rapidement un signalement en cas de disparition.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fce8ec] text-[#d76f7e]">
                <HeartPulse size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Profil complet
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                Photos, histoire, caractère, identification et informations
                utiles.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf5f1] text-[#064b42]">
                <MapPin size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Balades & communauté
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                Sélectionnez facilement le compagnon qui participe à une
                balade ou à une activité.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2db] text-[#b06e22]">
                <AlertTriangle size={20} />
              </div>

              <h3 className="mt-4 font-black text-[#064b42]">
                Disparition
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6f625a]">
                En cas de perte, créez rapidement un signalement avec les
                informations déjà enregistrées.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border-2 border-dashed border-[#dfcdb8] bg-[#faf5ed] px-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#ef919b] shadow">
              <PawPrint size={30} />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#064b42]">
              Aucun compagnon pour le moment
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6f625a]">
              Ajoutez votre premier animal pour créer son profil Taui Te Ora.
            </p>

            <Link
              href="/mes-compagnons/ajouter"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#ef919b] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:opacity-90 active:scale-[0.98]"
            >
              <Plus size={18} />
              Ajouter mon premier compagnon
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
