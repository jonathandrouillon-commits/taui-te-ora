"use client";

import { useRouter } from "next/navigation";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function ChooseRolePage() {
  const router = useRouter();

  const roles = [
    {
      title: "Adoptant",
      icon: "👤",
      description: "Je souhaite adopter ou suivre des animaux.",
      path: "/",
    },
    {
      title: "Association",
      icon: "🐾",
      description: "Je représente une association animale.",
      path: "/association/dashboard",
    },
    {
      title: "Famille d'accueil",
      icon: "🏡",
      description: "Je peux accueillir temporairement un animal.",
      path: "/foster/dashboard",
    },
    {
      title: "Parrain",
      icon: "❤️",
      description: "Je souhaite soutenir un animal ou une association.",
      path: "/sponsor/dashboard",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        <h1 className="text-5xl font-black text-center text-[#064b42]">
          Choisissez votre profil
        </h1>

        <p className="text-center mt-4 text-gray-500 text-lg">
          TAUI TE ORA adapte l'expérience selon votre rôle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          {roles.map((role) => (
            <Card key={role.title} className="text-center space-y-5">
              <div className="text-6xl">{role.icon}</div>

              <h2 className="text-2xl font-black text-[#064b42]">
                {role.title}
              </h2>

              <p className="text-gray-500 min-h-[72px]">
                {role.description}
              </p>

              <Button
                onClick={() => router.push(role.path)}
                className="w-full"
              >
                Continuer
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}