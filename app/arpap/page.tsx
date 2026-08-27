import Image from "next/image";

const members = [
  { name: "A Ti’a Matairea", island: "Huahine" },
  { name: "Association Croquettes et câlins Rurutu Animara", island: "Rurutu" },
  { name: "Association RAIROA ANIMARA", island: "Rangiroa" },
  { name: "Association SPAP – FARE ANIMARA", island: "Service de protection animale de Polynésie" },
  { name: "Bora Bora Animara", island: "Bora Bora" },
  { name: "Eimeo Animara", island: "Moorea" },
  { name: "Les 4 Pattes de Papara", island: "Tahiti" },
  { name: "Nuku-Hiva Animara", island: "Nuku Hiva" },
  { name: "Raiatea Animara", island: "Raiatea" },
  { name: "Te Here i te mau Animara no Huahine", island: "Huahine" },
];

export default function ArpapPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f6f0e6] px-4 pb-28 pt-24 text-[#123f38] sm:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-[#1d1d1d] p-4 shadow-xl sm:p-7">
          <Image src="/arpap-logo.png" alt="Logo de l’ARPAP – Alliance pour le respect et la protection des animaux de Polynésie" width={1024} height={410} priority className="h-auto w-full object-contain" />
        </div>

        <section className="mt-6 rounded-[32px] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#df7f76]">Protection animale en Polynésie française</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">L’Alliance pour le respect et la protection des animaux</h1>
          <div className="mt-6 space-y-4 text-base leading-8 text-[#526c67] sm:text-lg">
            <p>L’ARPAP œuvre à la défense des droits des animaux en Polynésie française et au renforcement des structures locales dédiées à leur protection.</p>
            <p>Elle fédère un collectif de 10 associations actives sur l’ensemble du territoire, auxquelles elle apporte un soutien technique, logistique et financier.</p>
            <p>L’ARPAP mène également des campagnes de sensibilisation du public et défend le bien-être animal auprès des institutions. Elle favorise la coopération entre ses membres afin de mutualiser les ressources et de partager les bonnes pratiques.</p>
            <p>Enfin, elle veille au respect de la législation relative au bien-être animal.</p>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-5 text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#df7f76]">Un réseau solidaire</p>
            <h2 className="mt-2 text-3xl font-black">Les 10 associations membres</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {members.map((member, index) => (
              <article key={member.name} className="flex items-center gap-4 rounded-[24px] border border-[#eadfd8] bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdecef] text-lg font-black text-[#b85f6e]">{index + 1}</div>
                <div><h3 className="font-black text-[#064b42]">{member.name}</h3><p className="mt-1 text-sm text-[#6f665f]">📍 {member.island}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-[30px] bg-[#064b42] p-7 text-center text-white sm:p-10">
          <div className="text-4xl">🐾</div>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">Ensemble pour mieux protéger</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-white/80">En réunissant les forces des associations locales, l’ARPAP contribue à construire une protection animale plus forte, plus coordonnée et présente dans tous les archipels.</p>
        </section>
      </section>
    </main>
  );
}
