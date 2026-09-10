"use client";

import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

type DashboardPrivacyAccessProps = {
  title?: string;
};

export default function DashboardPrivacyAccess({
  title = "Mes données & Confidentialité",
}: DashboardPrivacyAccessProps) {
  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6">
      <div className="rounded-[28px] border border-[#d8e9e3] bg-[#edf6f2] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#064b42] shadow-sm">
              <ShieldCheck size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">
                Compte & confidentialité
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                🔐 {title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607069]">
                Consultez les informations liées à votre compte, téléchargez
                vos données, retrouvez la politique de confidentialité et
                gérez les options disponibles selon votre type de profil.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Link
              href="/profile/mes-donnees"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-3 text-sm font-black text-white shadow transition hover:bg-[#08695d]"
            >
              <ShieldCheck size={18} />
              Mes données
            </Link>

            <Link
              href="/confidentialite"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-[#064b42] bg-white px-6 py-3 text-sm font-black text-[#064b42] transition hover:bg-[#f5faf8]"
            >
              <FileText size={18} />
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}