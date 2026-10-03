"use client";

import { useRouter } from "next/navigation";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

type ProfileGroup =
  | "user"
  | "vet_association"
  | "refuge_sigfa"
  | "independent_volunteer"
  | "municipality_pound";

type RoleItem = {
  key: ProfileGroup;
  title: string;
  icon: string;
  description: string;
  path: string;
};

export default function ChooseRolePage() {
  const router = useRouter();

  const roles: RoleItem[] = [
    {
      key: "user",
      title: "Utilisateur",
      icon: "👤",
      description:
        "Je souhaite enregistrer mes compagnons, adopter, signaler un animal, participer aux balades et utiliser les services Taui Te Ora.",
      path: "/register?group=user",
    },

    {
      key: "vet_association",
      title: "Vétérinaire & Association",
      icon: "🩺",
      description:
        "Je suis vétérinaire ou je représente une association de protection animale.",
      path: "/register?group=vet_association",
    },

    {
      key: "refuge_sigfa",
      title: "Refuge / SIGFA",
      icon: "🏠",
      description:
        "Je représente un refuge ou le SIGFA et je prends en charge des animaux.",
      path: "/register?group=refuge_sigfa",
    },

    {
      key: "independent_volunteer",
      title: "Bénévole indépendant",
      icon: "🤝",
      description:
        "J'aide les animaux de manière indépendante sans représenter une structure.",
      path: "/register?group=independent_volunteer",
    },

    {
      key: "municipality_pound",
      title: "Commune & Fourrière",
      icon: "🏛️",
      description:
        "Je représente une commune ou une fourrière intervenant dans la prise en charge des animaux.",
      path: "/register?group=municipality_pound",
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col justify-center">

        <div className="text-center">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
            TAUI TE ORA
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#064b42] sm:text-5xl">
            Choisissez votre profil
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Sélectionnez le profil qui correspond le mieux à votre utilisation
            de Taui Te Ora.
          </p>

        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">

          {roles.map((role) => (
            <Card
              key={role.key}
              className="flex h-full flex-col text-center"
            >
              <div className="flex flex-1 flex-col">

                <div className="text-6xl">
                  {role.icon}
                </div>

                <h2 className="mt-4 text-2xl font-black text-[#064b42]">
                  {role.title}
                </h2>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-500">
                  {role.description}
                </p>

              </div>

              <Button
                onClick={() =>
                  router.push(role.path)
                }
                className="mt-6 w-full"
              >
                Créer ce compte
              </Button>

            </Card>
          ))}

        </div>

        <div className="mt-8 text-center">

          <button
            type="button"
            onClick={() =>
              router.push("/login")
            }
            className="text-sm font-bold text-[#df8995] underline underline-offset-4"
          >
            J&apos;ai déjà un compte
          </button>

        </div>

      </div>
    </main>
  );
}