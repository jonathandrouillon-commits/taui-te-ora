import Link from "next/link";

import {
  createClient,
} from "@supabase/supabase-js";

type HelpType =
  | "famille_accueil"
  | "transport"
  | "capture"
  | "nourriture_materiel"
  | "veterinaire"
  | "benevolat";

type Urgency =
  | "normale"
  | "urgente"
  | "critique";

type SosStatus =
  | "ouvert"
  | "en_cours"
  | "cloture";

type PublicSos = {
  id: string;
  title: string;
  help_type: HelpType;
  island: string;
  city: string | null;
  message: string;
  urgency: Urgency;
  status: SosStatus;
  animal_type?: string | null;
  animals_count?: number | null;
  created_at: string;
  closed_at?: string | null;
};

const HELP_TYPES: Record<
  HelpType,
  {
    label: string;
    icon: string;
  }
> = {
  famille_accueil: {
    label: "Famille d’accueil",
    icon: "🏠",
  },
  transport: {
    label: "Transport",
    icon: "🚗",
  },
  capture: {
    label: "Capture / sauvetage",
    icon: "🛟",
  },
  nourriture_materiel: {
    label: "Nourriture / matériel",
    icon: "🥣",
  },
  veterinaire: {
    label: "Accompagnement vétérinaire",
    icon: "🩺",
  },
  benevolat: {
    label: "Bénévolat",
    icon: "🤝",
  },
};

function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function statusLabel(
  status: SosStatus
) {
  if (status === "en_cours") {
    return "En cours";
  }

  if (status === "cloture") {
    return "Clôturé";
  }

  return "Ouvert";
}

function urgencyLabel(
  urgency: Urgency
) {
  if (urgency === "critique") {
    return "🚨 Critique";
  }

  if (urgency === "urgente") {
    return "⚠️ Urgente";
  }

  return "ℹ️ Normale";
}

export default async function PublicSosPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } =
    await params;

  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from("help_sos")
      .select(
        "id,title,help_type,island,city,message,urgency,status,animal_type,animals_count,created_at,closed_at"
      )
      .eq("id", id)
      .maybeSingle();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-4 py-16">
        <section className="mx-auto max-w-2xl rounded-[30px] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#064b42]">
            SOS indisponible
          </h1>

          <p className="mt-3 text-[#756d67]">
            Ce SOS n&apos;existe pas ou n&apos;est plus disponible.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour à TAUI TE ORA
          </Link>
        </section>
      </main>
    );
  }

  const sos =
    data as PublicSos;

  const help =
    HELP_TYPES[
      sos.help_type
    ] || {
      label: "Aide",
      icon: "🤝",
    };

  const publicUrl =
    `https://www.taui-te-ora.com/sos-aide/${encodeURIComponent(
      sos.id
    )}`;

  const facebookUrl =
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(
      publicUrl
    );

  const whatsappText =
    `🚨 SOS TAUI TE ORA\n${sos.title}\n📍 ${[
      sos.city,
      sos.island,
    ]
      .filter(Boolean)
      .join(" · ")}\n${publicUrl}`;

  const whatsappUrl =
    "https://wa.me/?text=" +
    encodeURIComponent(
      whatsappText
    );

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-20 pt-16 text-[#064b42]">
      <article className="mx-auto max-w-3xl">
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
            TAUI TE ORA
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
              {urgencyLabel(
                sos.urgency
              )}
            </span>

            <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-xs font-black text-[#5f554d]">
              {help.icon}{" "}
              {help.label}
            </span>

            <span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-black text-[#064b42]">
              {statusLabel(
                sos.status
              )}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            {sos.title}
          </h1>

          <p className="mt-4 font-black text-[#9c7b54]">
            📍{" "}
            {[
              sos.city,
              sos.island,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <p className="mt-2 text-sm text-[#756d67]">
            Publié le{" "}
            {new Date(
              sos.created_at
            ).toLocaleString(
              "fr-FR"
            )}
          </p>

          <section className="mt-7 rounded-[24px] bg-[#fffaf5] p-5 sm:p-6">
            <h2 className="text-xl font-black">
              Besoin
            </h2>

            <p className="mt-3 whitespace-pre-line leading-7 text-[#5f554d]">
              {sos.message}
            </p>
          </section>

          {(sos.animal_type ||
            sos.animals_count) && (
            <section className="mt-5 rounded-[24px] bg-[#f8f4ec] p-5">
              <h2 className="font-black">
                Animaux concernés
              </h2>

              <p className="mt-2 text-[#5f554d]">
                {[
                  sos.animals_count
                    ? `${sos.animals_count} animal${
                        sos.animals_count >
                        1
                          ? "aux"
                          : ""
                      }`
                    : null,
                  sos.animal_type,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </section>
          )}

          <section className="mt-7 border-t border-[#eee5dc] pt-6">
            <p className="text-sm font-black">
              Partager ce SOS
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-[#1877F2] px-5 py-3 text-center font-black text-white"
              >
                Facebook
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-[#25D366] px-5 py-3 text-center font-black text-white"
              >
                WhatsApp
              </a>

              <Link
                href="/"
                className="rounded-2xl border border-[#d9cec7] bg-white px-5 py-3 text-center font-black text-[#064b42]"
              >
                TAUI TE ORA
              </Link>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
