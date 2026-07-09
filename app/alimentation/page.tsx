import Image from "next/image";

export default function AlimentationPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">
          <Image
            src="/hills-polynesie.jpg"
            alt="Hill's Pet Nutrition Polynésie"
            width={320}
            height={320}
            priority
            className="mx-auto mb-8 h-44 w-auto object-contain"
          />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            PARTENAIRE NUTRITION ANIMALE
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🥣 Hill's Pet Nutrition Polynésie
          </h1>

          <p className="mt-8 text-2xl font-bold text-[#6f5a47]">
            Une alimentation de qualité pour la santé de votre compagnon.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            <strong>Hill's Pet Nutrition Polynésie</strong> accompagne les
            propriétaires de chiens et de chats avec des solutions
            nutritionnelles adaptées aux besoins de chaque animal.
          </p>

          <p className="mt-4 text-lg leading-8 text-[#6f5a47]">
            Que votre compagnon soit un chiot, un chaton, un adulte ou un
            senior, Hill's propose une alimentation pensée pour soutenir sa
            santé, son bien-être et sa qualité de vie.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">🐶 Produits disponibles</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "🐕 Science Plan",
              "🩺 Prescription Diet",
              "⭐ Vet Essentials",
              "🐶 Alimentation pour chiots",
              "🐱 Alimentation pour chatons",
              "❤️ Gestion du poids",
              "🦴 Santé articulaire",
              "🩺 Nutrition thérapeutique",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#F7F2E8] p-5 text-lg font-bold shadow-sm transition hover:scale-[1.02]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">❤️ Pourquoi choisir Hill's ?</h2>

          <p className="mt-5 text-lg leading-8 text-[#6f5a47]">
            Les aliments Hill's sont formulés pour répondre aux besoins
            nutritionnels spécifiques des chiens et des chats. Ils permettent
            d'accompagner les animaux à chaque étape de leur vie avec une
            alimentation équilibrée et de qualité.
          </p>
        </div>

        <div className="mt-6 rounded-[32px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">📞 Contact</h2>

          <div className="mt-6 space-y-4">
            <a
              href="tel:+68989408000"
              className="block rounded-2xl bg-[#064b42] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              📞 89 40 80 00
            </a>

            <a
              href="mailto:hillspetnutritionpolynesie@gmail.com"
              className="block rounded-2xl bg-[#0b8f79] px-6 py-5 text-center text-xl font-black text-white transition hover:scale-[1.02]"
            >
              ✉️ hillspetnutritionpolynesie@gmail.com
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61574249457633"
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