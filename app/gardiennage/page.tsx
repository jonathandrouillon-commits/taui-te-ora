export default function GardiennagePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            SERVICE PARTENAIRE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🏡 Sev ORA Animaux - Tahiti
          </h1>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            Gardiennage et accompagnement bienveillant pour vos animaux.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            <strong>Sev ORA Animaux - Tahiti</strong> accompagne les propriétaires
            d’animaux avec sérieux, douceur et attention.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            L’objectif est d’assurer le confort, la sécurité et le bien-être de
            votre compagnon lorsque vous avez besoin d’un service de gardiennage
            ou d’une présence de confiance.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">🐾 Services proposés</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "🏡 Gardiennage d’animaux",
              "🐶 Présence et compagnie",
              "🐱 Attention chiens et chats",
              "🥣 Repas et eau fraîche",
              "🚶 Sorties et promenades",
              "❤️ Surveillance du bien-être",
              "📸 Nouvelles de votre animal",
              "🧼 Respect de l’environnement de l’animal",
              "🤝 Service de confiance",
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

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">❤️ Notre engagement</h2>

          <p className="mt-5 text-lg leading-8 text-[#6f5a47]">
            Chaque animal est différent. Le gardiennage doit donc respecter son
            rythme, ses habitudes, son caractère et ses besoins.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            La priorité est de proposer une présence rassurante, attentive et
            responsable, afin que votre compagnon reste serein pendant votre
            absence.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">📞 Contact</h2>

          <div className="mt-6 space-y-4">
            <a
              href="https://www.facebook.com/Sev.Viaud"
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