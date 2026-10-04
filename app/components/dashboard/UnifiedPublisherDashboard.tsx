"use client";

import PublisherDashboard from "../PublisherDashboard";

import CollapsibleDashboardSection from "./CollapsibleDashboardSection";
import UnifiedProfileSection from "./UnifiedProfileSection";

type PublisherRole =
  | "association"
  | "refuge"
  | "fourriere"
  | "benevole";

const TITLES: Record<
  PublisherRole,
  {
    title: string;
    subtitle: string;
    icon: string;
  }
> = {
  association: {
    title:
      "Espace association",
    subtitle:
      "Animaux, demandes d’adoption, messages et outils de votre structure.",
    icon: "🤝",
  },

  refuge: {
    title:
      "Espace refuge / SIGFA",
    subtitle:
      "Animaux, adoptions, messages et outils de votre structure.",
    icon: "🏠",
  },

  fourriere: {
    title:
      "Espace fourrière",
    subtitle:
      "Animaux, signalements, adoptions et suivi de votre activité.",
    icon: "🐾",
  },

  benevole: {
    title:
      "Espace bénévole",
    subtitle:
      "Réseau d’aide, animaux, messages et actions bénévoles.",
    icon: "💚",
  },
};

export default function UnifiedPublisherDashboard({
  expectedRole,
}: {
  expectedRole:
    PublisherRole;
}) {
  const config =
    TITLES[
      expectedRole
    ];

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <UnifiedProfileSection />

        <CollapsibleDashboardSection
          title={
            config.title
          }
          subtitle={
            config.subtitle
          }
          icon={
            config.icon
          }
          defaultOpen
        >
          <div className="-mx-5 -my-6 sm:-mx-7">
            <PublisherDashboard
              expectedRole={
                expectedRole
              }
            />
          </div>
        </CollapsibleDashboardSection>
      </div>
    </main>
  );
}
