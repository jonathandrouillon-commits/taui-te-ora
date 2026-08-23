import TauiPageBackground from "../components/ui/TauiPageBackground";

function calculateDaysWithoutKali() {
  const disappearanceDate = new Date("2025-03-19T00:00:00");
  const currentDate = new Date();

  disappearanceDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  const difference = currentDate.getTime() - disappearanceDate.getTime();

  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
}

export default function HommagePage() {
  const daysWithoutKali = calculateDaysWithoutKali();

  return (
    <TauiPageBackground showKali={false}>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="overflow-hidden rounded-[40px] border border-white/80 bg-white/85 shadow-2xl backdrop-blur-md">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#064b42] via-[#09675a] to-[#0a796b] px-6 py-12 text-center text-white">
            <div className="pointer-events-none absolute -left-20 top-4 h-64 w-64 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative">
              <div className="mx-auto h-72 w-72 overflow-hidden rounded-full border-8 border-white shadow-2xl ring-4 ring-[#d6b382]/50 md:h-80 md:w-80">
                <img
                  src="/kali-hommage.jpg"
                  alt="Kali"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-[#f1d8b4]">
                TAUI TE ORA
              </p>

              <h1 className="mt-3 text-5xl font-black md:text-7xl">
                Hommage à Kali
              </h1>

              <p className="mt-5 text-2xl font-black text-[#f1d8b4] md:text-4xl">
                {daysWithoutKali} jours sans toi
              </p>

              <p className="mt-3 text-sm font-semibold text-white/70">
                Disparue le 19 mars 2025
              </p>
            </div>
          </div>

          <div className="px-6 py-10 text-center md:px-14 md:py-14">
            <p className="text-3xl font-black leading-tight text-[#064b42] md:text-5xl">
              Oui, je te choisis encore.
            </p>

            <div className="mx-auto my-8 h-px max-w-md bg-gradient-to-r from-transparent via-[#b58b5b] to-transparent" />

            <div className="mx-auto max-w-3xl space-y-6 text-lg leading-9 text-gray-700">
              <p>
                Hey toi, oui toi. Change rien. On recommence tout.
              </p>

              <p>
                Je reprendrais les promenades, les silences, les regards et
                chaque instant passé à tes côtés.
              </p>

              <p>
                Je reprendrais même les jours difficiles, parce qu’ils seraient
                encore des jours avec toi.
              </p>

              <p className="text-2xl font-black italic text-[#8d673d]">
                Allez viens, on recommence tout.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-3xl rounded-[30px] bg-[#f8f4ec] p-7 shadow-inner md:p-10">
              <div className="text-5xl">🐾</div>

              <h2 className="mt-5 text-3xl font-black text-[#064b42]">
                De ton absence est née une mission
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-700">
                TAUI TE ORA et Les Veilleurs de Kali portent ton souvenir.
                Chaque animal retrouvé, protégé ou adopté est une manière de
                continuer à te chercher autrement.
              </p>

              <p className="mt-6 font-black text-[#b58b5b]">
                On ne sauvera pas le monde, mais on sauvera le leur.
              </p>
            </div>

            <p className="mt-10 text-xl font-black text-[#064b42]">
              Pour toujours, Kali.
            </p>
          </div>
        </div>
      </section>
    </TauiPageBackground>
  );
}