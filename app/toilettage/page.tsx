export default function ToilettagePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">

        {/* ==================== EN-TÊTE ==================== */}

        <div className="rounded-[32px] bg-white p-8 shadow-xl text-center">

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            Service partenaire
          </p>

          <h1 className="mt-3 text-4xl font-black">
            ✂️ Toilettage Tahiti by Elodie
          </h1>

          <div className="mt-8 flex justify-center">
            <img
              src="/logos/toilettage-tahiti-elodie.jpg"
              alt="Toilettage Tahiti by Elodie"
              className="h-60 w-60 rounded-full object-cover shadow-2xl ring-4 ring-[#F7F2E8]"
            />
          </div>

          <p className="mt-8 text-lg font-semibold text-[#6f5a47]">
            Le bien-être de votre compagnon avant tout.
          </p>

          <p className="mt-5 leading-8 text-[#6f5a47]">
            Chez <strong>Toilettage Tahiti by Elodie</strong>, chaque chien et
            chaque chat bénéficie d'une attention particulière dans un
            environnement calme, propre et sécurisé.
          </p>

          <p className="mt-4 leading-8 text-[#6f5a47]">
            Notre objectif est d'offrir un toilettage de qualité tout en
            respectant le rythme, le confort et la sensibilité de chaque animal.
          </p>

        </div>

        {/* ==================== PRESTATIONS ==================== */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-2xl font-black">
            🐾 Prestations proposées
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "✂️ Coupe aux ciseaux",
              "🛁 Bain complet",
              "🧴 Shampooing adapté",
              "💨 Séchage professionnel",
              "🪮 Démêlage",
              "✂️ Coupe des griffes",
              "👂 Nettoyage des oreilles",
              "🪥 Hygiène générale",
              "🐶 Conseils d'entretien du pelage",
            ].map((service) => (
              <div
                key={service}
                className="rounded-2xl bg-[#F7F2E8] px-5 py-4 font-bold"
              >
                {service}
              </div>
            ))}

          </div>

        </div>

        {/* ==================== ENGAGEMENT ==================== */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-2xl font-black">
            ❤️ Notre engagement
          </h2>

          <p className="mt-5 leading-8 text-[#6f5a47]">
            Parce que chaque animal est unique, nous prenons le temps
            nécessaire pour que chaque séance de toilettage soit une expérience
            agréable et sans stress.
          </p>

          <p className="mt-4 leading-8 text-[#6f5a47]">
            Le bien-être de votre compagnon reste notre priorité à chaque étape
            de son passage chez <strong>Toilettage Tahiti by Elodie</strong>.
          </p>

        </div>

        {/* ==================== CONTACT ==================== */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-2xl font-black">
            📞 Contact
          </h2>

          <div className="mt-6 grid gap-4">

            <a
              href="tel:+68987244035"
              className="rounded-2xl bg-[#064b42] px-6 py-4 text-center text-lg font-black text-white transition hover:scale-[1.02]"
            >
              📱 87 24 40 35
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61562155410259"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#1877F2] px-6 py-4 text-center text-lg font-black text-white transition hover:scale-[1.02]"
            >
              🌐 Facebook
            </a>

          </div>

        </div>

      </section>
    </main>
  );
}