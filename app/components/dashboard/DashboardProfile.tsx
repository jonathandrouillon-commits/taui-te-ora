"use client";

import type { Profile } from "../../lib/dashboard";

type DashboardProfileProps = {
  profile: Profile | null;
};

export default function DashboardProfile({ profile }: DashboardProfileProps) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Informations personnelles
      </h2>

      <Info label="Prénom" value={profile?.first_name} />
      <Info label="Nom" value={profile?.last_name} />
      <Info label="Email" value={profile?.email} />
      <Info label="Téléphone" value={profile?.phone} />
      <Info label="Date de naissance" value={formatDate(profile?.birth_date)} />
      <Info label="Ville" value={profile?.city} />
      <Info label="Île" value={profile?.island} />
      <Info label="Adresse" value={profile?.address} />
      <Info label="Code postal" value={profile?.postal_code} />
      <Info label="Rôle" value={profile?.role} />
      <Info label="Organisation" value={profile?.organization_name} />
      <Info label="Statut validation" value={profile?.approval_status} />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="border-b border-[#eadfce] py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#9c7b54]">
        {label}
      </p>

      <p className="mt-1 font-medium text-[#2f241c]">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}