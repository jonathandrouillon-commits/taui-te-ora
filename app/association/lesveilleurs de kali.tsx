export default function AssociationPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">
          <img
            src="/lesveilleurs.jpg"
            alt="Les Veilleurs de Kali"
            className="mx-auto mb-6 h-44 w-44 rounded-full object-cover shadow-lg"
          />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            ASSOCIATION PARTENAIRE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🐾 Les Veilleurs de Kali
          </h1>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            On ne changera pas le monde, mais on peut changer le leur.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            <strong>Les Veilleurs de Kali</strong> est une association engagée
            pour la protection, le signalement, l’aide et l’accompagnement des
            animaux en détresse.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Notre mission est de créer un lien entre les animaux, les familles,
            les associations et toutes les personnes qui souhaitent agir pour le
            bien-être animal en Polynésie.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">❤️ Nos actions</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "🐶 Aide aux animaux en détresse",
              "📢 Signalement d’animaux perdus ou errants",
              "🏡 Recherche de familles d’accueil",
              "❤️ Soutien aux adoptions",
              "🥣 Aide alimentaire",
              "🩺 Soutien aux soins vétérinaires",
              "🤝 Collaboration avec les associations",
              "🌺 Sensibilisation au bien-être animal",
            ].map((action) => (
              <div
                key={action}
                className="rounded-2xl bg-[#F7F2E8] p-5 text-lg font-bold shadow-sm transition hover:scale-[1.02]"
              >
                {action}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">📞 Contact</h2>

          <div className="mt-8 space-y-4">
            <a
              href="tel:+68989324580"
              className="block rounded-2xl bg-[#064b42] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              📱 +689 89 32 45 80
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61580234248072"
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