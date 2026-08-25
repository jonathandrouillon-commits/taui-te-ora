"use client";

import Link from "next/link";
import SupportButton from "../SupportButton";

type DashboardSettingsProps = {
  onLogout: () => void;
};

export default function DashboardSettings({
  onLogout,
}: DashboardSettingsProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Paramètres
      </h2>

      <div className="space-y-3">
        <Link
          href="/adoptant/profile"
          className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] px-5 py-4 text-[#2f241c]"
        >
          <span>
            Modifier mon profil
          </span>

          <span>
            ›
          </span>
        </Link>

        <Link
          href="/adoption/questionnaire"
          className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] px-5 py-4 text-[#2f241c]"
        >
          <span>
            Modifier mon questionnaire
          </span>

          <span>
            ›
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] px-5 py-4 text-[#2f241c]"
        >
          <span>
            Voir les animaux à adopter
          </span>

          <span>
            ›
          </span>
        </Link>

        <div className="pt-2">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
            Assistance
          </p>

          <SupportButton />
        </div>

        <button
          type="button"
          onClick={
            onLogout
          }
          className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-5 py-4 text-left font-semibold text-red-600"
        >
          <span>
            Déconnexion
          </span>

          <span>
            ›
          </span>
        </button>
      </div>
    </section>
  );
}