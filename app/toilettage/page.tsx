export default function ToilettagePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[32px] bg-white p-8 shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            Service partenaire
          </p>

          <h1 className="mt-3 text-4xl font-black">
            ✂️ Toilettage Tahiti by Elodie
          </h1>

          <p className="mt-4 text-lg font-semibold text-[#6f5a47]">
            Le bien-être de votre compagnon avant tout.
          </p>

          <p className="mt-5 leading-7 text-[#6f5a47]">
            Chaque chien et chaque chat bénéficie d'une attention particulière
            dans un environnement calme, propre et sécurisé. L'objectif est
            d'offrir un toilettage de qualité tout en respectant le rythme, le
            confort et la sensibilité de chaque animal.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-black">🐾 Prestations proposées</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Coupe aux ciseaux",
              "Bain complet",
              "Shampooing adapté au type de pelage",
              "Séchage professionnel",
              "Démêlage",
              "Coupe des griffes",
              "Nettoyage des oreilles",
              "Hygiène générale",
              "Conseils d'entretien du pelage",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#f8f4ec] px-5 py-4 font-bold"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-black">❤️ Notre engagement</h2>

          <p className="mt-4 leading-7 text-[#6f5a47]">
            Parce que chaque animal est unique, le temps nécessaire est pris
            pour que chaque séance de toilettage soit une expérience agréable et
            sans stress. Le bien-être de votre compagnon reste la priorité à
            chaque étape.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-black">📞 Contact</h2>

          <div className="mt-5 grid gap-4">
            <a
              href="tel:+68987244035"
              className="rounded-2xl bg-[#064b42] px-6 py-4 text-center text-lg font-black text-white"
            >
              Appeler : 87 24 40 35
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61562155410259"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#1877F2] px-6 py-4 text-center text-lg font-black text-white"
            >
              Ouvrir la page Facebook
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}