
"use client";

import { useRouter } from "next/navigation";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

type ProfileGroup =
  | "user"
  | "vet_association"
  | "refuge_sigfa"
  | "independent_volunteer"
  | "municipality_pound"
  | "pet_boarding";

type RoleItem = {
  key: ProfileGroup;
  title: string;
  icon: string;
  description: string;
  details: string[];
  path: string;
};

const roles: RoleItem[] = [
  {
    key: "user",
    title: "Utilisateur / Adoptant",
    icon: "🐾",
    description:
      "Tu aimes les animaux et souhaites profiter de Taui Te Ora, que tu envisages d'adopter ou non.",
    details: [
      "Adopter un animal ou découvrir ceux qui attendent une famille.",
      "Enregistrer tes animaux dans Mes compagnons.",
      "Participer aux balades et à la communauté.",
      "Signaler un animal perdu, trouvé ou en difficulté.",
      "Et peut-être craquer un jour pour un nouveau compagnon !",
    ],
    path: "/register?group=user",
  },
  {
    key: "vet_association",
    title: "Vétérinaire / Association",
    icon: "🩺",
    description:
      "Tu es vétérinaire ou tu représentes une association engagée dans la protection animale.",
    details: [
      "Présenter ton activité ou ton association.",
      "Participer à la prise en charge des animaux.",
      "Présenter les animaux proposés à l'adoption, selon ton profil.",
      "Faciliter les échanges avec les familles et les bénévoles.",
    ],
    path: "/register?group=vet_association",
  },
  {
    key: "refuge_sigfa",
    title: "Refuge / SIGFA",
    icon: "🏡",
    description:
      "Tu représentes un refuge ou le SIGFA et participes à l'accueil et à la protection des animaux.",
    details: [
      "Présenter ta structure.",
      "Enregistrer les animaux pris en charge.",
      "Suivre les demandes d'adoption.",
      "Faciliter la recherche de familles responsables.",
    ],
    path: "/register?group=refuge_sigfa",
  },
  {
    key: "independent_volunteer",
    title: "Bénévole",
    icon: "🤝",
    description:
      "Tu donnes de ton temps pour les animaux, seul ou aux côtés d'une ou plusieurs associations.",
    details: [
      "Aider une ou plusieurs associations.",
      "Participer aux sauvetages et aux transports.",
      "Apporter ton aide lors des collectes et événements.",
      "Contribuer à la protection animale selon tes disponibilités.",
      "Pas besoin de posséder une association pour agir !",
    ],
    path: "/register?group=independent_volunteer",
  },
  {
    key: "municipality_pound",
    title: "Commune / Fourrière",
    icon: "🏛️",
    description:
      "Tu représentes une commune ou une fourrière impliquée dans la gestion et la protection des animaux.",
    details: [
      "Présenter ta structure et ses missions.",
      "Participer à la prise en charge des animaux.",
      "Faciliter les échanges avec les acteurs de terrain.",
      "Contribuer au suivi des animaux concernés.",
    ],
    path: "/register?group=municipality_pound",
  },
  {
    key: "pet_boarding",
    title: "Pension / Gardiennage",
    icon: "🐕",
    description:
      "Tu proposes un service de garde ou d'hébergement pour les animaux de compagnie.",
    details: [
      "Présenter ton activité de gardiennage.",
      "Faire connaître tes services aux propriétaires.",
      "Rejoindre le réseau des acteurs du bien-être animal.",
      "Participer à la communauté Taui Te Ora.",
    ],
    path: "/register?group=pet_boarding",
  },
];

export default function ChooseRolePage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-8 text-[#3b2417] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="text-center">
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="mx-auto h-24 w-24 object-contain"
          />

          <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
            TAUI TE ORA
          </p>

          <h1 className="mt-3 text-3xl font-black text-[#064b42] sm:text-5xl">
            Quel est ton profil ?
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Que tu souhaites adopter, aider, protéger ou
            simplement partager ton amour des animaux,
            il y a une place pour toi sur Taui Te Ora.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-[#df8995]">
            Choisis le profil qui correspond le mieux
            à ton engagement.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card
              key={role.key}
              className="flex h-full flex-col"
            >
              <div className="flex flex-1 flex-col">
                <div className="text-center text-6xl">
                  {role.icon}
                </div>

                <h2 className="mt-4 text-center text-2xl font-black text-[#064b42]">
                  {role.title}
                </h2>

                <p className="mt-4 text-center text-sm leading-relaxed text-gray-600">
                  {role.description}
                </p>

                <div className="mt-5 flex-1 rounded-2xl bg-[#f7f3ec] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#064b42]">
                    Ce profil est fait pour toi si :
                  </p>

                  <ul className="space-y-3">
                    {role.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2 text-sm leading-relaxed text-[#665c54]"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 font-black text-[#df8995]"
                        >
                          ✓
                        </span>

                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                onClick={() => router.push(role.path)}
                className="mt-6 w-full"
              >
                Choisir ce profil
              </Button>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-[#e4cfaa] bg-white p-6 text-center">
          <p className="text-lg font-black text-[#064b42]">
            Tu ne sais pas quel profil choisir ?
          </p>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Si tu souhaites simplement découvrir
            l'application, enregistrer tes compagnons
            ou éventuellement adopter un animal,
            choisis Utilisateur / Adoptant.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/register?group=user")
            }
            className="mt-5 rounded-full bg-[#df8995] px-6 py-3 text-sm font-black text-white transition hover:opacity-90"
          >
            Je découvre Taui Te Ora
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm font-bold text-[#df8995] underline underline-offset-4"
          >
            J&apos;ai déjà un compte
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          Ensemble, donnons une chance à chaque animal.
        </p>
      </div>
    </main>
  );
}
