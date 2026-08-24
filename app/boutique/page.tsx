"use client";

import Link from "next/link";

export default function BoutiquePage() {
  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 pb-28 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-[#064b42] px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">
              🛍️
            </div>

            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
              Taui Te Ora
            </p>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Boutique
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Un espace solidaire actuellement en construction.
            </p>
          </div>
        </section>

        {/* =====================================================
            EN CONSTRUCTION
        ====================================================== */}

        <section className="mt-8 rounded-[30px] bg-white p-6 text-center shadow-md sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f8f4ec] text-4xl shadow-sm">
            🚧
          </div>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#df8995]">
            En construction
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black leading-tight text-[#064b42] sm:text-4xl">
            La boutique Taui Te Ora arrive bientôt
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6f5a47]">
            Nous préparons actuellement un espace dédié aux produits,
            accessoires et services pour vos compagnons.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#6f5a47]">
            Notre objectif est de créer une boutique utile aux propriétaires
            d&apos;animaux tout en participant directement à la protection
            animale en Polynésie française.
          </p>

          <div className="mx-auto my-9 h-px max-w-xl bg-[#eadfce]" />

          {/* =====================================================
              BOUTIQUE SOLIDAIRE
          ====================================================== */}

          <div className="mx-auto max-w-3xl rounded-[28px] bg-[#efe2d3] p-6 sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
              ❤️
            </div>

            <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[#b58b5b]">
              Une boutique solidaire
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#064b42] sm:text-3xl">
              Acheter pour aider
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6f5a47]">
              Les bénéfices générés par la boutique Taui Te Ora seront
              redistribués entre les associations partenaires afin de soutenir
              leurs actions en faveur des animaux.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] bg-white/70 p-4">
                <div className="text-2xl">
                  🐾
                </div>

                <p className="mt-2 font-black text-[#064b42]">
                  Sauvetage
                </p>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  Soutenir les interventions
                </p>
              </div>

              <div className="rounded-[20px] bg-white/70 p-4">
                <div className="text-2xl">
                  🩺
                </div>

                <p className="mt-2 font-black text-[#064b42]">
                  Soins
                </p>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  Participer aux frais vétérinaires
                </p>
              </div>

              <div className="rounded-[20px] bg-white/70 p-4">
                <div className="text-2xl">
                  🏡
                </div>

                <p className="mt-2 font-black text-[#064b42]">
                  Protection
                </p>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  Aider les associations partenaires
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PROCHAINEMENT
        ====================================================== */}

        <section className="mt-8">
          <div className="mb-5 text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b58b5b]">
              Prochainement
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#064b42] sm:text-3xl">
              Vous pourrez retrouver
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[26px] bg-white p-6 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f4ec] text-3xl">
                🐕
              </div>

              <h3 className="mt-4 text-lg font-black text-[#064b42]">
                Accessoires
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                Pour chiens et chats
              </p>
            </div>

            <div className="rounded-[26px] bg-white p-6 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f4ec] text-3xl">
                🥣
              </div>

              <h3 className="mt-4 text-lg font-black text-[#064b42]">
                Alimentation
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                Une sélection pour vos compagnons
              </p>
            </div>

            <div className="rounded-[26px] bg-white p-6 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f4ec] text-3xl">
                🎾
              </div>

              <h3 className="mt-4 text-lg font-black text-[#064b42]">
                Jeux
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                Jouets et occupations
              </p>
            </div>

            <div className="rounded-[26px] bg-white p-6 text-center shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f4ec] text-3xl">
                ❤️
              </div>

              <h3 className="mt-4 text-lg font-black text-[#064b42]">
                Produits solidaires
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                Pour soutenir la cause animale
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            MESSAGE FINAL
        ====================================================== */}

        <section className="mt-8 rounded-[30px] border border-[#eadfce] bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="text-4xl">
            🐾
          </div>

          <h2 className="mt-4 text-2xl font-black text-[#064b42]">
            Ensemble pour leur offrir une vie meilleure
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#6f5a47]">
            Chaque achat effectué dans la future boutique contribuera à
            soutenir les associations partenaires de Taui Te Ora.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#064b42] px-7 py-3 font-black text-white transition hover:bg-[#0a6659]"
          >
            Retour aux animaux
          </Link>
        </section>
      </div>
    </main>
  );
}