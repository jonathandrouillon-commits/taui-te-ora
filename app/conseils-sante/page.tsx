import TauiPageBackground from "../components/ui/TauiPageBackground";

const conseils = [
  {
    number: "01",
    icon: "🥣",
    title: "Une alimentation adaptée à ses besoins",
    text: `Une bonne santé commence par une alimentation équilibrée,
adaptée à l'âge, au poids, au niveau d'activité et à l'état de santé
de votre animal. Attention également aux restes de table : certains
aliments peuvent être trop gras, trop salés ou dangereux pour les
chiens et les chats. En cas de doute, demandez conseil à votre
vétérinaire.`,
  },

  {
    number: "02",
    icon: "🐕",
    title: "Bouger, mais aux bonnes heures",
    text: `Les chiens ont besoin de promenades, de jeux et d'activité
physique quotidienne. Sous le climat polynésien, évitez autant que
possible les longues sorties aux heures les plus chaudes. Privilégiez
le matin ou la fin de journée. Le bitume, le béton et même le sable
peuvent devenir très chauds et brûler les coussinets.`,
  },

  {
    number: "03",
    icon: "🩺",
    title: "Ne pas attendre qu'il soit malade",
    text: `Une visite régulière chez le vétérinaire permet de surveiller
le poids, les dents, la peau, les oreilles, les vaccinations et
l'état général de votre animal. C'est particulièrement important
pour les animaux âgés, car certaines maladies peuvent évoluer
discrètement.`,
  },

  {
    number: "04",
    icon: "⚖️",
    title: "Surveiller son poids",
    text: `Quelques kilos supplémentaires peuvent représenter beaucoup
pour un chien ou un chat. Le surpoids peut notamment favoriser les
problèmes articulaires et réduire la mobilité. Adaptez les portions
à l'activité réelle de votre compagnon et évitez de multiplier les
friandises.`,
  },

  {
    number: "05",
    icon: "🦷",
    title: "Ne pas oublier les dents",
    text: `La mauvaise haleine n'est pas toujours anodine. Tartre,
inflammation des gencives et infections dentaires peuvent devenir
douloureux. Habituez si possible votre animal aux soins dentaires et
demandez à votre vétérinaire de contrôler régulièrement sa bouche.`,
  },

  {
    number: "06",
    icon: "🦟",
    title: "Être vigilant avec les parasites",
    text: `Sous un climat chaud et humide comme celui de la Polynésie,
la prévention contre les parasites mérite une attention particulière.
Puces, tiques, vers et autres parasites peuvent affecter la santé de
votre compagnon. Votre vétérinaire pourra vous conseiller un protocole
adapté à son âge, son poids et son mode de vie.`,
  },

  {
    number: "07",
    icon: "🏡",
    title: "Sécuriser son environnement",
    text: `Un jardin n'est réellement sécurisé que s'il empêche
l'animal de sortir. Portail ouvert, clôture abîmée, circulation
routière ou départ soudain derrière un autre animal peuvent rapidement
provoquer un accident ou une disparition. À la plage et près du lagon,
surveillez également votre compagnon et prévoyez toujours de l'ombre
et de l'eau douce.`,
  },

  {
    number: "08",
    icon: "💉",
    title: "Vacciner, identifier et stériliser",
    text: `La vaccination contribue à protéger votre animal contre
plusieurs maladies infectieuses. L'identification augmente fortement
les chances de retrouver son propriétaire en cas de disparition.
La stérilisation contribue également à limiter les portées non
désirées et le nombre d'animaux abandonnés ou vivant dans la rue.`,
  },

  {
    number: "09",
    icon: "💧",
    title: "Eau fraîche et ombre en permanence",
    text: `Avec la chaleur et l'humidité du Fenua, votre animal doit
toujours pouvoir accéder facilement à une eau propre et fraîche ainsi
qu'à un endroit ombragé et ventilé. Ne laissez jamais un animal
enfermé dans une voiture, même pour quelques minutes.`,
  },

  {
    number: "10",
    icon: "❤️",
    title: "Prendre soin de sa tête autant que de son corps",
    text: `Un animal a besoin de nourriture et de soins, mais aussi
d'attention, d'interactions et de stimulation. Promenades, jeux,
apprentissage et moments avec sa famille participent à son équilibre.
Pour un animal adopté après avoir vécu dans la rue ou après une
expérience difficile, patience, régularité et douceur sont
essentielles.`,
  },
];

export default function ConseilsSantePage() {
  return (
    <TauiPageBackground>
      <main className="mx-auto max-w-6xl px-4 py-10 pb-28">

        {/* HEADER */}

        <section className="text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/90 text-5xl shadow-xl">
            ❤️‍🩹
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-[#df8995]">
            Bien-être animal
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#064b42] md:text-6xl">
            Conseils santé
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6f665f]">
            10 réflexes simples pour prendre soin de votre chien ou
            de votre chat au Fenua.
          </p>

        </section>

        {/* CONSEILS */}

        <section className="mt-10 grid gap-5 md:grid-cols-2">

          {conseils.map((conseil) => (
            <article
              key={conseil.number}
              className="
                relative
                overflow-hidden
                rounded-[30px]
                border
                border-white/80
                bg-white/90
                p-6
                shadow-lg
                backdrop-blur
              "
            >

              <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f8eee7] text-3xl">
                  {conseil.icon}
                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#df8995]">
                    Conseil {conseil.number}
                  </p>

                  <h2 className="mt-1 text-xl font-black leading-tight text-[#064b42]">
                    {conseil.title}
                  </h2>

                </div>

              </div>

              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#665e58]">
                {conseil.text}
              </p>

            </article>
          ))}

        </section>

        {/* MESSAGE FINAL */}

        <section
          className="
            mt-8
            rounded-[30px]
            bg-[#064b42]
            p-7
            text-center
            text-white
            shadow-xl
          "
        >

          <div className="text-4xl">
            🐾
          </div>

          <h2 className="mt-4 text-2xl font-black">
            Prendre soin d'eux, c'est aussi les protéger
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/80">
            Au Fenua, prendre soin de son animal signifie aussi
            anticiper les particularités de notre environnement :
            chaleur, humidité, parasites, accès à l'extérieur et
            risques de divagation.
          </p>

          <p className="mx-auto mt-4 max-w-3xl font-bold text-[#f1d8b4]">
            Observer son animal et remarquer rapidement ce qui change
            reste l'un des meilleurs moyens de prendre soin de lui.
          </p>

        </section>

        {/* AVERTISSEMENT */}

        <section
          className="
            mt-5
            rounded-[24px]
            border
            border-[#e8d9c3]
            bg-[#fffaf1]/90
            p-5
            text-center
          "
        >
          <p className="text-sm font-bold leading-6 text-[#6f5b40]">
            Ces conseils sont généraux et ne remplacent jamais
            l'avis, l'examen ou le diagnostic d'un vétérinaire.
          </p>
        </section>

      </main>
    </TauiPageBackground>
  );
}