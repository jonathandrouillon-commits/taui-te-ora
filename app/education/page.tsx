import TauiPageBackground from "../components/ui/TauiPageBackground";

export default function EducationPage() {
  return (
    <TauiPageBackground>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/85 shadow-2xl backdrop-blur-md">
          <div className="bg-gradient-to-br from-[#173c5e] to-[#3475a7] px-6 py-10 text-center text-white">
            <img
              src="/tahiti-dog-school.png"
              alt="Tahiti Dog School"
              className="mx-auto h-40 w-40 rounded-full border-4 border-white bg-white object-contain p-2 shadow-2xl"
            />

            <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-white/80">
              Partenaire TAUI TE ORA
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-6xl">
              Tahiti Dog School
            </h1>

            <p className="mt-3 text-xl font-bold">
              Éducation canine et accompagnement
            </p>
          </div>

          <div className="p-6 md:p-10">
            <p className="mx-auto max-w-3xl text-center text-lg leading-8 text-gray-700">
              Des méthodes d’éducation adaptées à votre chien pour construire
              une relation équilibrée, respectueuse et durable.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-[26px] bg-[#f8f4ec] p-6">
                <div className="text-4xl">🎓</div>

                <h2 className="mt-4 text-xl font-black text-[#064b42]">
                  Éducation canine
                </h2>

                <ul className="mt-4 space-y-3 text-gray-700">
                  <li>• Apprentissage des bases</li>
                  <li>• Marche en laisse</li>
                  <li>• Rappel</li>
                  <li>• Gestion des comportements</li>
                  <li>• Socialisation</li>
                </ul>
              </article>

              <article className="rounded-[26px] bg-[#f8f4ec] p-6">
                <div className="text-4xl">🤝</div>

                <h2 className="mt-4 text-xl font-black text-[#064b42]">
                  Accompagnement personnalisé
                </h2>

                <p className="mt-4 leading-7 text-gray-700">
                  Les séances sont adaptées au chien, à son environnement et aux
                  objectifs de sa famille.
                </p>
              </article>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1877f2] px-8 py-4 text-center font-black text-white shadow-lg transition hover:scale-105"
              >
                Voir la page Facebook
              </a>

              <a
                href="mailto:"
                className="rounded-full bg-[#064b42] px-8 py-4 text-center font-black text-white shadow-lg transition hover:scale-105 hover:bg-[#08695d]"
              >
                Envoyer un email
              </a>
            </div>
          </div>
        </div>
      </section>
    </TauiPageBackground>
  );
}