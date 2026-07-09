import Image from "next/image";

export default function EducationPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">

        {/* Présentation */}
        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">

          <Image
            src="/tahitidogschool.png"
            alt="Tahiti Dog School"
            width={300}
            height={300}
            priority
            className="mx-auto mb-8 h-44 w-auto object-contain"
          />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            SERVICE PARTENAIRE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🎓 Tahiti Dog School
          </h1>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            Éducation canine positive et accompagnement personnalisé.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            <strong>Tahiti Dog School</strong> accompagne les propriétaires de
            chiens grâce à une approche moderne, positive et respectueuse du
            bien-être animal.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Chaque chien est unique. Les séances sont adaptées à son âge,
            son tempérament et aux objectifs de son propriétaire afin de créer
            une relation harmonieuse et durable.
          </p>

        </div>

        {/* Services */}
        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            🐶 Services proposés
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "🐾 Éducation du chiot",
              "🐕 Éducation du chien adulte",
              "🧠 Rééducation comportementale",
              "🏡 Séances à domicile",
              "🎯 Bilan comportemental",
              "❤️ Méthodes positives",
              "👨‍👩‍👧 Accompagnement des propriétaires",
              "📚 Conseils personnalisés",
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

        {/* Philosophie */}
        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            ❤️ Notre philosophie
          </h2>

          <p className="mt-5 text-lg leading-8 text-[#6f5a47]">
            L'éducation doit être basée sur la confiance, la communication
            et le respect du chien. Chaque accompagnement est personnalisé
            afin d'aider les familles à mieux comprendre leur compagnon.
          </p>

        </div>

        {/* Contact */}
        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            📞 Contact
          </h2>

          <div className="mt-6 space-y-4">

            <a
              href="tel:+68987313838"
              className="block rounded-2xl bg-[#064b42] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              📞 87 31 38 38
            </a>

            <a
              href="mailto:tahitidogschool@gmail.com"
              className="block rounded-2xl bg-[#0b8f79] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              ✉️ tahitidogschool@gmail.com
            </a>

            <a
              href="https://www.facebook.com/TahitiDogSchool"
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