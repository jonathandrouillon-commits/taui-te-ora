import Link from "next/link";

import {
  BellRing,
  BookOpenText,
  Dog,
  Heart,
  Image,
  Megaphone,
  PawPrint,
  Users,
} from "lucide-react";

type AdminCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

export default function AdminPage() {
  const cards: AdminCard[] = [
    {
      title: "Animaux à adopter",
      description:
        "Gérer les animaux proposés à l’adoption sur Taui Te Ora.",
      href: "/admin/animals",
      icon: <Dog size={30} />,
    },
    {
      title: "Compagnons",
      description:
        "Voir les compagnons enregistrés par les utilisateurs.",
      href: "/admin/compagnons",
      icon: <PawPrint size={30} />,
    },
    {
      title: "Utilisateurs",
      description:
        "Gérer les comptes, rôles et validations des utilisateurs.",
      href: "/admin/users",
      icon: <Users size={30} />,
    },
    {
      title: "Signalements",
      description:
        "Consulter et gérer les signalements effectués sur la plateforme.",
      href: "/admin/signalements",
      icon: <BellRing size={30} />,
    },
    {
      title: "Publicités",
      description:
        "Gérer les publicités et partenaires affichés sur Taui Te Ora.",
      href: "/admin/publicites",
      icon: <Megaphone size={30} />,
    },
    {
      title: "Pages",
      description:
        "Modifier les textes et contenus des différentes pages.",
      href: "/admin/pages",
      icon: <BookOpenText size={30} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#df8995] text-white shadow">
              <Heart size={28} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#df8995]">
                Taui Te Ora
              </p>

              <h1 className="text-3xl font-black text-[#064b42]">
                Administration
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            Gérez les animaux, les compagnons, les utilisateurs,
            les signalements et les contenus de la plateforme.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[28px] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#df8995] transition group-hover:bg-[#df8995] group-hover:text-white">
                {card.icon}
              </div>

              <h2 className="mt-5 text-xl font-black text-[#064b42]">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {card.description}
              </p>

              <div className="mt-5 font-black text-[#df8995]">
                Ouvrir →
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}