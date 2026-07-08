"use client";

import Link from "next/link";
import type { Profile } from "../../lib/dashboard";
import { isQuestionnaireFilled } from "../../lib/dashboard";

type DashboardQuestionnaireProps = {
  profile: Profile | null;
};

export default function DashboardQuestionnaire({
  profile,
}: DashboardQuestionnaireProps) {
  const filled = isQuestionnaireFilled(profile);

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2f241c]">
            Questionnaire adoptant
          </h2>

          <p className="mt-2 text-[#6f5a47]">
            Ces informations sont enregistrées dans votre profil et seront
            utilisées pour vos futures demandes d'adoption.
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
            filled
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {filled ? "Complété" : "À compléter"}
        </span>
      </div>

      {filled ? (
        <>
          <div className="space-y-2">
            <Info label="Expérience" value={profile?.adopter_experience} />
            <Info label="Animaux actuels" value={profile?.current_animals} />
            <Info label="Adoption pour" value={profile?.adoption_for} />
            <Info label="Enfants" value={profile?.children_age} />
            <Info label="Jardin" value={profile?.garden_type} />
            <Info label="Âge souhaité" value={profile?.ideal_age} />
            <Info label="Sexe souhaité" value={profile?.ideal_sex} />
            <Info label="Taille souhaitée" value={profile?.ideal_size} />
            <Info label="Activité souhaitée" value={profile?.ideal_activity} />
            <Info label="Race souhaitée" value={profile?.ideal_breed} />
            <Info label="Hypoallergénique" value={profile?.hypoallergenic} />
            <Info label="Propreté" value={profile?.cleanliness} />
            <Info label="Besoins particuliers" value={profile?.special_needs} />
          </div>

          <Link
            href="/adoption/questionnaire"
            className="mt-8 inline-flex rounded-full bg-[#9c7b54] px-6 py-3 font-semibold text-white transition hover:bg-[#846646]"
          >
            Modifier mon questionnaire
          </Link>
        </>
      ) : (
        <div className="rounded-3xl bg-[#f8f4ec] p-8 text-center">
          <div className="mb-4 text-6xl">📋</div>

          <h3 className="text-xl font-bold text-[#2f241c]">
            Questionnaire incomplet
          </h3>

          <p className="mx-auto mt-4 max-w-md text-[#6f5a47]">
            Complétez votre questionnaire adoptant pour que les associations
            puissent mieux comprendre votre foyer et vos préférences.
          </p>

          <Link
            href="/adoption/questionnaire"
            className="mt-8 inline-flex rounded-full bg-[#064b42] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#0a6659]"
          >
            Compléter mon questionnaire
          </Link>
        </div>
      )}
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-5 py-3">
      <span className="font-medium text-[#6f5a47]">{label}</span>

      <span className="text-right font-bold text-[#2f241c]">
        {value || "Non renseigné"}
      </span>
    </div>
  );
}