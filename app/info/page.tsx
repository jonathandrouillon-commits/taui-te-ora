import Link from "next/link";

import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  Heart,
  Info,
  MapPin,
  Search,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react";

export default function InfoPage() {
  return (
    <main className="min-h-screen bg-[#fbf7ef] pb-28 text-[#2f241c]">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-6">
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#f6c8cf]/40 blur-3xl" />

        <div className="pointer-events-none absolute -left-24 top-52 h-72 w-72 rounded-full bg-[#bfe4da]/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#eadfd8] bg-white shadow-lg">
              <img
                src="/logo-taui-te-ora.png"
                alt="TAUI TE ORA"
                className="h-16 w-16 object-contain"
              />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#df8995]">
              TAUI TE ORA
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight text-[#064b42] sm:text-5xl md:text-6xl">
              Une rencontre peut
              <span className="block text-[#df8995]">
                tout changer.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#756d67] sm:text-lg">
              Une plateforme imaginée pour faciliter
              l&apos;adoption responsable, aider les associations
              et créer une véritable communauté autour des animaux
              en Polynésie.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-4 font-black text-white shadow-lg transition hover:bg-[#08695d]"
              >
                Découvrir les animaux

                <ArrowRight size={18} />
              </Link>

              <Link
                href="/signalements"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-[#064b42] bg-white px-7 py-4 font-black text-[#064b42] transition hover:bg-[#edf7f4]"
              >
                Voir les signalements
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COEUR DU PROJET
      ====================================================== */}

      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[36px] bg-[#064b42] shadow-xl">
            <div className="grid lg:grid-cols-2">
              <div className="p-7 text-white sm:p-10 lg:p-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
                  <Heart size={16} />

                  Le cœur de TAUI TE ORA
                </div>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">
                  L&apos;adoption responsable avant tout.
                </h2>

                <p className="mt-5 leading-7 text-white/80">
                  Choisir un animal ne devrait pas simplement
                  dépendre d&apos;une photo.
                </p>

                <p className="mt-4 leading-7 text-white/80">
                  Chaque animal possède son histoire, son caractère
                  et ses besoins. Chaque adoptant possède également
                  un mode de vie différent.
                </p>

                <p className="mt-4 leading-7 text-white/80">
                  TAUI TE ORA aide à créer une première rencontre
                  plus pertinente entre les deux.
                </p>
              </div>

              <div className="bg-[#0a5d52] p-7 sm:p-10 lg:p-12">
                <div className="rounded-[30px] bg-white p-6 shadow-2xl sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9c7b54]">
                        Compatibilité
                      </p>

                      <p className="mt-1 text-lg font-black text-[#2f241c]">
                        Premier matching
                      </p>
                    </div>

                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#edf7f4]">
                      <span className="text-2xl font-black text-[#064b42]">
                        92%
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#eee8df]">
                    <div className="h-full w-[92%] rounded-full bg-[#df8995]" />
                  </div>

                  <div className="mt-6 space-y-3">
                    <CheckLine>
                      Mode de vie compatible
                    </CheckLine>

                    <CheckLine>
                      Environnement adapté
                    </CheckLine>

                    <CheckLine>
                      Besoins de l&apos;animal étudiés
                    </CheckLine>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-[#756d67]">
                    Le pourcentage constitue une première aide.
                    La décision finale d&apos;adoption reste toujours
                    humaine et appartient aux associations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ASSOCIATIONS
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Pourquoi ?"
            title="Aider aussi ceux qui sont sur le terrain."
            text="Le matching a également été pensé pour soulager les associations dans les premières étapes d'une demande d'adoption."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={<Users size={26} />}
              title="Des demandes mieux qualifiées"
              text="L'adoptant renseigne en amont les informations essentielles sur son foyer et son mode de vie."
            />

            <InfoCard
              icon={<Search size={26} />}
              title="Un premier tri"
              text="Le score de compatibilité aide à identifier rapidement les profils qui semblent correspondre aux besoins de l'animal."
            />

            <InfoCard
              icon={<Heart size={26} />}
              title="Plus de temps pour l'animal"
              text="Moins de temps consacré aux premières questions et davantage de temps pour l'accompagnement et les rencontres."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          KALI
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[36px] border border-[#eadfd8] bg-white p-7 shadow-lg sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#f8d7dc]/50 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] bg-[#fff5f6] p-8 text-center">
                <div>
                  <div className="text-7xl">
                    🐾
                  </div>

                  <p className="mt-4 text-2xl font-black text-[#064b42]">
                    Pour Kali.
                  </p>

                  <p className="mt-1 font-bold text-[#df8995]">
                    Et maintenant pour tous les autres.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
                  L&apos;histoire derrière le projet
                </p>

                <h2 className="mt-3 text-3xl font-black text-[#064b42] sm:text-4xl">
                  Une disparition qui a changé beaucoup de choses.
                </h2>

                <p className="mt-5 leading-7 text-[#756d67]">
                  La disparition de Kali a fait naître une réflexion
                  beaucoup plus large sur la manière dont nous
                  recherchons, protégeons et aidons les animaux.
                </p>

                <p className="mt-4 leading-7 text-[#756d67]">
                  De cette histoire sont nés Les Veilleurs de Kali,
                  puis l&apos;envie de construire un outil capable
                  d&apos;être utile à d&apos;autres animaux et à leurs
                  familles.
                </p>

                <p className="mt-4 font-black leading-7 text-[#064b42]">
                  TAUI TE ORA ne peut pas changer ce qui s&apos;est
                  passé. Mais son histoire peut peut-être aider à
                  changer celle d&apos;autres animaux.
                </p>

                <Link
                  href="/hommage"
                  className="mt-6 inline-flex items-center gap-2 font-black text-[#df687c]"
                >
                  Découvrir son histoire

                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ECOSYSTEME
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Et autour de l'adoption..."
            title="TAUI TE ORA est devenu tout un écosystème."
            text="Nous ajoutons progressivement des outils permettant de retrouver, protéger, aider et réunir les animaux et ceux qui les aiment."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureLink
              href="/signalements"
              icon={<Bell size={25} />}
              title="Perdus & trouvés"
              text="Consulter les animaux perdus, trouvés et suivre l'évolution d'un signalement."
            />

            <FeatureLink
              href="/signalement"
              icon={<Shield size={25} />}
              title="Animaux en danger"
              text="Signaler des situations de maltraitance, d'abandon, de blessure ou de détresse."
            />

            <FeatureLink
              href="/balades"
              icon={<MapPin size={25} />}
              title="Balades & Copains"
              text="Créer ou rejoindre des balades et permettre aux animaux comme à leurs humains de se rencontrer."
            />

            <FeatureLink
              href="/evenements"
              icon={<Calendar size={25} />}
              title="Événements"
              text="Journées adoption, collectes, tombolas et actions solidaires."
            />

            <FeatureLink
              href="/boutique"
              icon={<ShoppingBag size={25} />}
              title="Boutique"
              text="Découvrir l'espace boutique et les initiatives liées à l'univers animal."
            />

            <FeatureLink
              href="/associations"
              icon={<Users size={25} />}
              title="Réseau animalier"
              text="Associations, vétérinaires et acteurs du monde animal réunis au même endroit."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          ALERTES PUSH
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[36px] bg-[#fff0f3] p-7 sm:p-10">
            <div className="grid gap-7 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-[#df687c] shadow-md">
                <Bell size={34} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df687c]">
                  Alertes communautaires
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#064b42]">
                  Une photo. Un secteur. Une alerte.
                </h2>

                <p className="mt-4 max-w-3xl leading-7 text-[#756d67]">
                  Pour les animaux perdus ou trouvés, TAUI TE ORA
                  développe un système de notifications permettant
                  de mobiliser rapidement les utilisateurs et
                  multiplier les yeux qui cherchent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EN CONSTRUCTION
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f3ecdf] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#8b653c]">
            <Info size={16} />

            Plateforme en évolution
          </div>

          <h2 className="mt-5 text-3xl font-black text-[#064b42] sm:text-4xl">
            Ce n&apos;est que le début.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#756d67]">
            TAUI TE ORA continue d&apos;évoluer. De nouvelles
            fonctionnalités, de nouveaux partenaires et de nouveaux
            services seront progressivement ajoutés à la plateforme.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-4 font-black text-white"
            >
              Commencer à découvrir

              <ArrowRight size={18} />
            </Link>

            <Link
              href="/associations"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-[#064b42] bg-white px-7 py-4 font-black text-[#064b42]"
            >
              Découvrir les associations
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          SIGNATURE
      ====================================================== */}

      <section className="px-4 pb-8 pt-4 text-center sm:px-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#df8995]">
          ADOPTER · SIGNALER · RETROUVER · PROTÉGER · AIDER
        </p>

        <p className="mt-3 text-2xl font-black text-[#064b42]">
          TAUI TE ORA
        </p>

        <p className="mt-1 text-sm text-[#756d67]">
          Une rencontre peut tout changer. 🐾
        </p>
      </section>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-black leading-tight text-[#064b42] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-[#756d67]">
        {text}
      </p>
    </div>
  );
}

function CheckLine({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f8f4ec] px-4 py-3">
      <CheckCircle
        size={19}
        className="shrink-0 text-[#064b42]"
      />

      <span className="font-bold text-[#5f5751]">
        {children}
      </span>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[28px] border border-[#eadfd8] bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f4] text-[#064b42]">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-[#064b42]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#756d67]">
        {text}
      </p>
    </article>
  );
}

function FeatureLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-[#eadfd8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#df687c]">
          {icon}
        </div>

        <ArrowRight
          size={19}
          className="text-[#b8aea5] transition group-hover:translate-x-1 group-hover:text-[#064b42]"
        />
      </div>

      <h3 className="mt-5 text-xl font-black text-[#064b42]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#756d67]">
        {text}
      </p>
    </Link>
  );
}