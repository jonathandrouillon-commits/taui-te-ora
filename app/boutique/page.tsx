"use client";

import Link from "next/link";

const categories = [
  {
    title: "Accessoires",
    description:
      "Colliers, laisses, harnais et accessoires pour vos compagnons.",
    icon: "🐕",
    href: "/boutique?categorie=accessoires",
  },
  {
    title: "Alimentation",
    description:
      "Une sélection de produits pour chiens et chats.",
    icon: "🥣",
    href: "/boutique?categorie=alimentation",
  },
  {
    title: "Bien-être",
    description:
      "Des produits pour prendre soin de votre animal au quotidien.",
    icon: "❤️",
    href: "/boutique?categorie=bien-etre",
  },
  {
    title: "Jeux",
    description:
      "Jouets et occupations pour chiens et chats.",
    icon: "🎾",
    href: "/boutique?categorie=jeux",
  },
  {
    title: "Produits solidaires",
    description:
      "Des achats qui contribuent à soutenir la protection animale.",
    icon: "🐾",
    href: "/boutique?categorie=solidaire",
  },
  {
    title: "Associations",
    description:
      "Découvrez les produits proposés par les associations partenaires.",
    icon: "🤝",
    href: "/boutique?categorie=associations",
  },
];

export default function BoutiquePage() {
  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 pb-28 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* HERO */}

        <section className="overflow-hidden rounded-[32px] bg-[#064b42] px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">
              🛍️
            </div>

            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
              Taui Te Ora
            </p>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Boutique
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Retrouvez une sélection de produits pour vos animaux
              et soutenez les acteurs de la protection animale en
              Polynésie.
            </p>
          </div>
        </section>

        {/* CATEGORIES */}

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-[#064b42]">
              Que recherchez-vous ?
            </h2>

            <p className="mt-1 text-[#6f5a47]">
              Parcourez la boutique par catégorie.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group rounded-[26px] bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f4ec] text-3xl">
                  {category.icon}
                </div>

                <h3 className="mt-5 text-xl font-black text-[#064b42]">
                  {category.title}
                </h3>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#6f5a47]">
                  {category.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-black text-[#b58b5b]">
                    Découvrir
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#064b42] font-black text-white transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PRODUITS */}

        <section className="mt-10 rounded-[30px] bg-white p-6 shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#b58b5b]">
                Boutique
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                Nos produits
              </h2>
            </div>

            <span className="w-fit rounded-full bg-[#f8f4ec] px-4 py-2 text-sm font-black text-[#6f5a47]">
              Bientôt disponible
            </span>
          </div>

          <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#eadfce] bg-[#faf7f2] px-6 text-center">
            <div className="text-5xl">
              🐾
            </div>

            <h3 className="mt-4 text-xl font-black text-[#064b42]">
              La boutique se prépare
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#6f5a47]">
              Les premiers produits seront prochainement disponibles
              sur Taui Te Ora.
            </p>
          </div>
        </section>

        {/* SOLIDAIRE */}

        <section className="mt-8 rounded-[30px] bg-[#efe2d3] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
              ❤️
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#064b42]">
                Une boutique solidaire
              </h2>

              <p className="mt-2 max-w-2xl leading-7 text-[#6f5a47]">
                L'espace Boutique pourra également mettre en avant les
                associations et leurs produits afin de contribuer à
                leurs actions en faveur des animaux.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}