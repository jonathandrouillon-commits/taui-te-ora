import Image from "next/image";

export default function HommagePage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-28 pt-6 text-[#064b42]">
      <section className="mx-auto max-w-5xl rounded-[32px] bg-white p-8 shadow-xl">

        {/* Photo de Kali */}
        <div className="flex justify-center">
          <div className="relative h-72 w-72 overflow-hidden rounded-full border-8 border-white shadow-2xl ring-4 ring-[#b58b5b]/40">
            <Image
              src="/kali-hommage.jpg"
              alt="Kali"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            TAUI TE ORA
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42] md:text-7xl">
            🐾 Hommage à Kali
          </h1>

          <p className="mt-4 text-3xl font-black text-[#b58b5b] md:text-5xl">
            477 jours sans toi
          </p>

          <p className="mt-2 text-xl font-bold text-[#6f5a47]">
            Disparue le 19 mars 2025
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-left text-xl leading-9 text-[#4f4438] md:text-2xl">

          <p>
            Le 19 mars 2025, sans le savoir, c'était le dernier jour où je te voyais.
          </p>

          <p>
            Depuis ce jour, le temps a continué d'avancer. Les saisons ont changé.
            Les anniversaires sont passés. La vie des autres a repris son cours.
            Mais la mienne s'est figée.
          </p>

          <p>
            Il y a des blessures qui ne cicatrisent pas. Il y a des absences qui
            ne s'apprennent jamais. Et il y a toi.
          </p>

          <p>
            Pendant onze ans, tu n'as jamais été juste un chien. Tu étais ma
            présence, ma joie, ma petite peste, mon repère, une partie de ma vie.
          </p>

          <p>
            À l'époque où je m'étais perdu, tu étais là. Et sans le savoir,
            tu m'as reconstruit.
          </p>

          <p>
            Pendant onze ans tu as été ma raison de vivre. Aujourd'hui, même
            dans ton absence, ton souvenir est devenu la force qui me pousse à
            continuer.
          </p>

          <p>
            Pendant des mois, je t'ai cherchée. Chaque message me donnait
            l'espoir de te retrouver avant de me briser un peu plus.
          </p>

          <p>
            Toute la Polynésie s'est mobilisée pour toi. Des milliers de personnes
            ont partagé ton histoire. Des inconnus sont devenus une famille.
            Grâce à vous, j'ai tenu debout.
          </p>

          <p>
            Aujourd'hui, malgré le temps, je t'attends encore. Parce que
            l'amour ne connaît pas le calendrier.
          </p>

          <p>
            Chaque animal que nous aidons, chaque famille que nous soutenons,
            chaque adoption, chaque vie sauvée porte un peu de toi.
          </p>

          <p>
            Je continuerai à me battre pour toi, pour ceux qui attendent encore
            leur compagnon disparu, pour ceux qui n'ont plus personne.
          </p>

          <p>
            Parce que ton histoire ne doit jamais être oubliée.
          </p>

          <p>
            Kali, si l'amour avait eu le pouvoir de te ramener, tu serais encore
            là aujourd'hui.
          </p>

          <p>
            Tu me manques aujourd'hui autant qu'au premier jour. Tu me manqueras
            demain, dans dix ans et toute ma vie.
          </p>

          <p>
            Et le jour où mon cœur cessera de battre, j'aime croire que tu seras là.
          </p>

          <p>
            Je t'imagine courir vers moi une dernière fois.
            Je poserai mon front contre le tien.
            Et cette fois...
          </p>

          <p className="pt-4 text-center text-4xl font-black text-[#064b42]">
            Je ne te laisserai plus jamais partir.
          </p>

          <p className="text-center text-5xl font-black text-[#b58b5b]">
            ❤️ Je t'aime, ma princesse ❤️
          </p>

          <p className="pb-6 text-center text-2xl font-bold text-[#6f5a47]">
            19 mars 2025 • À jamais dans mon cœur
          </p>

        </div>
      </section>
    </main>
  );
}