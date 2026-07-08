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
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Questionnaire adoption
      </h2>

      {filled ? (
        <div>
          <Info label="Expérience avec les animaux" value={profile?.adopter_experience} />
          <Info label="Animaux actuels" value={profile?.current_animals} />
          <Info label="Adoption pour" value={profile?.adoption_for} />
          <Info label="Enfants" value={profile?.children_age} />
          <Info label="Jardin / extérieur" value={profile?.garden_type} />
          <Info label="Âge souhaité" value={profile?.ideal_age} />
          <Info label="Sexe souhaité" value={profile?.ideal_sex} />
          <Info label="Taille souhaitée" value={profile?.ideal_size} />
          <Info label="Activité souhaitée" value={profile?.ideal_activity} />
          <Info label="Race souhaitée" value={profile?.ideal_breed} />
          <Info label="Hypoallergénique" value={profile?.hypoallergenic} />
          <Info label="Propreté" value={profile?.cleanliness} />
          <Info label="Besoins particuliers" value={profile?.special_needs} />

          <Link
            href="/adoption/questionnaire"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
          >
            Modifier le questionnaire
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Aucun questionnaire rempli pour le moment.
          </p>

          <Link
            href="/adoption/questionnaire"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
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