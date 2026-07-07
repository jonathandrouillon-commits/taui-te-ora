"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdoptantProfilePage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AdoptantProfileContent />
    </Suspense>
  );
}

function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
      <p className="text-xl font-black">Chargement du profil adoptant...</p>
    </main>
  );
}

function AdoptantProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const animalId = searchParams.get("animalId") || "";

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    ile: "",
    commune: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function continuer() {
    if (!form.nom.trim()) {
      alert("Merci de renseigner votre nom.");
      return;
    }

    if (!form.prenom.trim()) {
      alert("Merci de renseigner votre prénom.");
      return;
    }

    if (!form.email.trim()) {
      alert("Merci de renseigner votre email.");
      return;
    }

    if (!form.telephone.trim()) {
      alert("Merci de renseigner votre téléphone.");
      return;
    }

    if (animalId) {
      router.push(`/adoption/questionnaire/${animalId}`);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🐾</div>

          <h1 className="text-3xl font-black text-[#064b42]">
            Profil Adoptant
          </h1>

          <p className="mt-3 text-gray-600">
            Ce profil est créé une seule fois et sera utilisé pour toutes vos
            futures demandes d'adoption.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            label="Nom"
            value={form.nom}
            onChange={(v) => updateField("nom", v)}
          />

          <Input
            label="Prénom"
            value={form.prenom}
            onChange={(v) => updateField("prenom", v)}
          />

          <Input
            label="Téléphone"
            value={form.telephone}
            onChange={(v) => updateField("telephone", v)}
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(v) => updateField("email", v)}
          />

          <Input
            label="Île"
            value={form.ile}
            onChange={(v) => updateField("ile", v)}
          />

          <Input
            label="Commune"
            value={form.commune}
            onChange={(v) => updateField("commune", v)}
          />
        </div>

        <button
          type="button"
          onClick={continuer}
          className="mt-8 w-full rounded-2xl bg-[#064b42] py-4 text-lg font-black text-white transition hover:bg-[#086555]"
        >
          Continuer →
        </button>
      </div>
    </main>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Input({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none transition focus:border-[#064b42]"
      />
    </div>
  );
}