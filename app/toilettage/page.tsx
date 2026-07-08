export default function ToilettagePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">

        {/* ================= EN-TÊTE ================= */}

        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            SERVICE PARTENAIRE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            ✂️ Toilettage Tahiti by Elodie
          </h1>

          <div className="mt-8 flex justify-center">
            <img
              src="/logos/toilettage-tahiti-elodie.jpg"
              alt="Toilettage Tahiti by Elodie"
              className="h-64 w-64 rounded-full object-cover shadow-2xl ring-4 ring-[#F7F2E8]"
            />
          </div>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            Le bien-être de votre compagnon avant tout.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            Chez <strong>Toilettage Tahiti by Elodie</strong>, chaque chien et
            chaque chat bénéficie d'une attention particulière dans un
            environnement calme, propre et sécurisé.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Notre priorité est d'offrir un toilettage de qualité tout en
            respectant le rythme, le confort et la personnalité de chaque
            animal.
          </p>

        </div>

        {/* ================= PRESTATIONS ================= */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            🐾 Prestations
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "🛁 Bain",
              "✂️ Coupe",
              "🪮 Démêlage",
              "💨 Séchage",
              "🧴 Shampooing adapté",
              "🐾 Coupe des griffes",
              "👂 Nettoyage des oreilles",
              "🪥 Hygiène générale",
              "❤️ Conseils personnalisés",
            ].map((service) => (
              <div
                key={service}
                className="rounded-2xl bg-[#F7F2E8] p-5 text-lg font-bold shadow-sm transition hover:scale-[1.02]"
              >
                {service}
              </div>
            ))}

          </div>

        </div>

        {/* ================= ENGAGEMENT ================= */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            ❤️ Notre engagement
          </h2>

          <p className="mt-5 text-lg leading-8 text-[#6f5a47]">
            Chaque animal est accueilli avec douceur, patience et respect.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Le toilettage est réalisé dans une ambiance sereine afin de limiter
            le stress et garantir le confort de votre compagnon.
          </p>

        </div>

        {/* ================= CONTACT ================= */}

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            📞 Contact
          </h2>

          <div className="mt-6 space-y-4">

            <a
              href="tel:+68987244035"
              className="block rounded-2xl bg-[#064b42] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              📱 87 24 40 35
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61562155410259"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl bg-[#1877F2] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              🌐 Facebook
            </a>

          </div>

        </div>

      </section>
    </main>
  );
}