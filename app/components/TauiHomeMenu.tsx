
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

const SYSTEM_ITEMS: MenuItem[] = [
  { label: "Adopter", href: "/?adopter=1", icon: "💗" },
  { label: "Signaler", href: "/signalement", icon: "🚨" },
  { label: "Mes Compagnons", href: "/mes-compagnons", icon: "🐾" },
  { label: "Balades & Copains", href: "/balades", icon: "🐕" },
  { label: "S.O.S Animal", href: "/sos-aide", icon: "🆘" },
  { label: "Signalements", href: "/signalements", icon: "📍" },
  { label: "Événements", href: "/evenements", icon: "📅" },
  { label: "Dons", href: "/dons", icon: "💝" },
  { label: "Boutique", href: "/boutique", icon: "🛍️" },
  { label: "Associations", href: "/associations", icon: "🤝" },
  { label: "ARPAP", href: "/arpap", icon: "🐾" },
  {
    label: "Les Veilleurs de Kali",
    href: "/association/lesveilleursdekali",
    icon: "🐶",
  },
  { label: "Vétérinaires", href: "/veterinaires", icon: "🩺" },
  { label: "Conseils santé", href: "/conseils-sante", icon: "❤️‍🩹" },
  { label: "Alimentation", href: "/alimentation", icon: "🥣" },
  { label: "Éducation", href: "/education", icon: "🎓" },
  {
    label: "Famille d'accueil",
    href: "/famille-accueil",
    icon: "🏠",
  },
  { label: "Toilettage", href: "/toilettage", icon: "✂️" },
  { label: "Gardiennage", href: "/gardiennage", icon: "🏡" },
  { label: "Pension", href: "/pension", icon: "🛏️" },
  { label: "Hommage", href: "/hommage", icon: "🕯️" },
  { label: "Info", href: "/info", icon: "ℹ️" },
  {
    label: "Communauté des sans voix",
    href: "/communaute-des-sans-voix",
    icon: "🫶",
  },
  {
    label: "Réseau d’aide",
    href: "/reseau-aide",
    icon: "🤲",
  },
];

const PALETTES = [
  ["#ffe3ee", "#d62e77"],
  ["#e1f3fd", "#1489c2"],
  ["#fff0d7", "#ce8117"],
  ["#e4f5e8", "#279563"],
  ["#eee4ff", "#8153c6"],
  ["#ffeadf", "#d26e40"],
];

export default function TauiHomeMenu({
  onAdopt,
}: {
  onAdopt: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getUser();

      if (active) {
        setSignedIn(Boolean(data.user));
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-5xl px-3 pb-36 pt-5 sm:px-6">
      <div className="rounded-[30px] border border-[#e8ded2] bg-[#fffaf5]/95 px-4 py-6 text-center shadow-lg sm:px-8">
        <img
          src="/logo-taui-te-ora.png"
          alt="TAUI TE ORA"
          className="mx-auto h-28 w-auto max-w-full object-contain sm:h-36"
        />

        <h1 className="mt-2 text-2xl font-black text-[#064b42] sm:text-3xl">
          Bienvenue sur TAUI TE ORA
        </h1>

        <p className="mt-2 text-sm text-[#706b62]">
          Une rencontre peut tout changer. Ensemble, agissons
          pour les animaux du fenua.
        </p>

        {!signedIn && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-[#0f5d52] bg-white px-5 py-2 text-xs font-bold text-[#0f5d52]"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#0f5d52] px-5 py-2 text-xs font-bold text-white"
            >
              Créer un compte
            </Link>
          </div>
        )}
      </div>

      <h2 className="mb-3 mt-7 text-center text-lg font-black text-[#064b42]">
        Explorer TAUI TE ORA
      </h2>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
        {SYSTEM_ITEMS.map((item, index) => {
          const [background, foreground] =
            PALETTES[index % PALETTES.length];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={
                item.href === "/?adopter=1"
                  ? (event) => {
                      event.preventDefault();
                      onAdopt();
                    }
                  : undefined
              }
              className="flex min-h-[106px] flex-col items-center justify-center rounded-[22px] border border-white/80 px-2 py-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md active:scale-[.97] sm:min-h-[132px]"
              style={{ backgroundColor: background }}
            >
              <span
                aria-hidden="true"
                className="text-3xl sm:text-4xl"
              >
                {item.icon}
              </span>

              <span
                className="mt-2 text-[11px] font-extrabold leading-tight sm:text-sm"
                style={{ color: foreground }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-[#766f68]">
        La découverte est ouverte à tous. Un compte est
        nécessaire pour enregistrer un coup de cœur,
        créer un compagnon ou effectuer une action.
      </p>
    </main>
  );
}
