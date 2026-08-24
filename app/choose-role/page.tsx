"use client";

import { useRouter } from "next/navigation";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

type RoleKey =
  | "adoptant"
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere";

type RoleItem = {
  key: RoleKey;
  title: string;
  icon: string;
  description: string;
  path: string;
};

export default function ChooseRolePage() {
  const router = useRouter();

  const roles: RoleItem[] = [
    {
      key: "adoptant",
      title: "Adoptant",
      icon: "🏠",
      description:
        "Je souhaite adopter un animal, enregistrer mes coups de cœur et compléter mon questionnaire adoptant.",
      path: "/register?role=adoptant",
    },
    {
      key: "association",
      title: "Association",
      icon: "🐾",
      description:
        "Je représente une association de protection animale et je souhaite publier et gérer des animaux.",
      path: "/register?role=association",
    },
    {
      key: "refuge",
      title: "Refuge / SIGFA",
      icon: "🏥",
      description:
        "Je représente un refuge ou le SIGFA et je souhaite publier et gérer les animaux pris en charge.",
      path: "/register?role=refuge",
    },
    {
      key: "benevole",
      title: "Bénévole indépendant",
      icon: "🤝",
      description:
        "J'aide des animaux de manière indépendante et je souhaite pouvoir créer et suivre leurs fiches.",
      path: "/register?role=benevole",
    },
    {
      key: "fourriere",
      title: "Fourrière",
      icon: "🏢",
      description:
        "Je représente une fourrière et je souhaite publier et gérer les animaux actuellement pris en charge.",
      path: "/register?role=fourriere",
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#064b42] sm:text-5xl">
            Choisissez votre profil
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Taui Te Ora adapte ensuite votre inscription et vos outils selon
            votre rôle.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => (
            <Card
              key={role.key}
              className="flex h-full flex-col text-center"
            >
              <div className="flex flex-1 flex-col">
                <div className="text-6xl">{role.icon}</div>

                <h2 className="mt-4 text-2xl font-black text-[#064b42]">
                  {role.title}
                </h2>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-500">
                  {role.description}
                </p>
              </div>

              <Button
                onClick={() => router.push(role.path)}
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
            onClick={() => router.push("/login")}
            className="text-sm font-bold text-[#df8995] underline underline-offset-4"
          >
            J'ai déjà un compte
          </button>
        </div>
      </div>
    </main>
  );
}