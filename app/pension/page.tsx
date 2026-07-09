import Image from "next/image";

export default function PensionPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">

        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">

          <Image
            src="/pension.jpg"
            alt="Pension"
            width={320}
            height={320}
            priority
            className="mx-auto mb-8 h-44 w-auto object-contain"
          />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            SERVICE PARTENAIRE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🏨 Pension
          </h1>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            Un lieu sûr et confortable pour votre compagnon.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            Retrouvez les pensions partenaires de TAUI TE ORA pour faire
            garder votre chien ou votre chat en toute sérénité pendant vos
            vacances, vos déplacements professionnels ou toute autre absence.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Les établissements référencés proposent des infrastructures
            adaptées, des espaces de détente, des promenades quotidiennes
            ainsi qu'un accompagnement personnalisé selon les besoins de
            chaque animal.
          </p>

        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            🐾 Prestations proposées
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "🐶 Pension pour chiens",
              "🐱 Pension pour chats",
              "🏡 Hébergement individuel",
              "🌴 Espaces de détente",
              "🚶 Promenades quotidiennes",
              "🍖 Alimentation adaptée",
              "💊 Administration de traitements",
              "📸 Nouvelles et photos pendant le séjour",
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

          <h2 className="text-3xl font-black">
            ❤️ Pourquoi choisir une pension partenaire ?
          </h2>

          <p className="mt-5 text-lg leading-8 text-[#6f5a47]">
            Les partenaires de TAUI TE ORA sont sélectionnés pour leur sérieux,
            leur passion des animaux et la qualité de leurs installations afin
            d'assurer un séjour agréable et sécurisé à votre compagnon.
          </p>

        </div>

      </section>
    </main>
  );
}