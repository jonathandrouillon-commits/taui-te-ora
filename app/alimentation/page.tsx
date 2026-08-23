import TauiPageBackground from "../components/ui/TauiPageBackground";

const produits = [
  {
    titre: "Alimentation pour chiots",
    description:
      "Des recettes adaptées à la croissance et au développement des jeunes chiens.",
    icon: "🐶",
  },
  {
    titre: "Alimentation pour chiens adultes",
    description:
      "Une alimentation équilibrée adaptée à l’activité et à la taille du chien.",
    icon: "🐕",
  },
  {
    titre: "Alimentation pour chiens seniors",
    description:
      "Des recettes adaptées aux besoins spécifiques des chiens plus âgés.",
    icon: "🐾",
  },
  {
    titre: "Alimentation vétérinaire",
    description:
      "Des gammes spécifiques pouvant accompagner certaines sensibilités.",
    icon: "🩺",
  },
];

export default function AlimentationPage() {
  return (
    <TauiPageBackground>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/85 shadow-2xl backdrop-blur-md">
          <div className="bg-gradient-to-br from-[#cf202e] to-[#ef4b55] px-6 py-10 text-center text-white">
            <img
              src="/hills-polynesie.png"
              alt="Hill's Polynésie"
              className="mx-auto h-36 w-64 rounded-[24px] border-4 border-white bg-white object-contain p-4 shadow-2xl"
            />

            <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-white/80">
              Partenaire alimentation
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-6xl">
              Hill&apos;s Polynésie
            </h1>
          </div>

          <div className="p-6 md:p-10">
            <section>
              <h2 className="text-center text-3xl font-black text-[#064b42] md:text-4xl">
                Produits disponibles
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {produits.map((produit) => (
                  <article
                    key={produit.titre}
                    className="rounded-[26px] bg-[#f8f4ec] p-6 shadow-sm"
                  >
                    <div className="text-4xl">{produit.icon}</div>

                    <h3 className="mt-4 text-xl font-black text-[#064b42]">
                      {produit.titre}
                    </h3>

                    <p className="mt-3 leading-7 text-gray-600">
                      {produit.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-12 rounded-[30px] bg-[#fff3f3] p-6 md:p-8">
              <h2 className="text-3xl font-black text-[#064b42]">
                Pourquoi choisir Hill&apos;s ?
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-3xl">🔬</div>

                  <h3 className="mt-3 font-black text-[#064b42]">
                    Expertise nutritionnelle
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Des recettes élaborées pour répondre aux besoins
                    nutritionnels des animaux.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-3xl">🥣</div>

                  <h3 className="mt-3 font-black text-[#064b42]">
                    Gammes adaptées
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Des solutions selon l’âge, la taille et les besoins de
                    l’animal.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-3xl">❤️</div>

                  <h3 className="mt-3 font-black text-[#064b42]">
                    Bien-être animal
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Une alimentation pensée pour accompagner la santé et la
                    vitalité.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-12 text-center">
              <h2 className="text-3xl font-black text-[#064b42]">Contact</h2>

              <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                Contactez Hill&apos;s Polynésie pour connaître les produits et
                les points de vente disponibles.
              </p>

              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-full bg-[#cf202e] px-8 py-4 font-black text-white shadow-lg transition hover:scale-105 hover:bg-[#ae1824]"
              >
                Contacter Hill&apos;s Polynésie
              </a>
            </section>
          </div>
        </div>
      </section>
    </TauiPageBackground>
  );
}