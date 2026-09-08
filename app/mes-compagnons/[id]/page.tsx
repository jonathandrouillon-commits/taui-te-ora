"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  MapPin,
  PawPrint,
  ShieldCheck,
  Siren,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

type Companion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  weight: string | null;
  character: string | null;
  story: string | null;
  photo_url: string | null;
  identification_type: string | null;
  identification_number: string | null;
  sterilization_status: string | null;
  sterilization_date: string | null;
  sterilization_note: string | null;
  is_public: boolean;
  created_at: string;
};

function formatSpecies(
  value: string | null
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  switch (normalized) {
    case "chien":
      return "Chien";

    case "chat":
      return "Chat";

    case "cheval":
      return "Cheval";

    default:
      return value || "Animal";
  }
}

function formatSex(
  value: string | null
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "male" ||
    normalized === "mâle"
  ) {
    return "Mâle";
  }

  if (
    normalized === "female" ||
    normalized === "femelle"
  ) {
    return "Femelle";
  }

  return "Non renseigné";
}

function formatIdentification(
  value: string | null
) {
  if (value === "tatouage") {
    return "Tatouage";
  }

  if (value === "puce") {
    return "Puce électronique";
  }

  return "Identification";
}

function formatSterilization(
  value: string | null
) {
  if (value === "oui") {
    return "✅ Stérilisé / castré";
  }

  if (value === "en_cours") {
    return "🕒 Stérilisation / castration en cours";
  }

  if (value === "non") {
    return "❌ Non stérilisé";
  }

  return "Statut non renseigné";
}

function calculateAge(
  birthDate: string | null
) {
  if (!birthDate) {
    return "";
  }

  const birth =
    new Date(birthDate);

  const now =
    new Date();

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return "";
  }

  let years =
    now.getFullYear() -
    birth.getFullYear();

  let months =
    now.getMonth() -
    birth.getMonth();

  if (
    now.getDate() <
    birth.getDate()
  ) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return `${years} an${
      years > 1 ? "s" : ""
    }`;
  }

  if (months > 0) {
    return `${months} mois`;
  }

  return "Moins d'un mois";
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export default function CompanionDetailPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const companionId =
    String(
      params?.id || ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    companion,
    setCompanion,
  ] =
    useState<Companion | null>(
      null
    );

  const [
    isOwner,
    setIsOwner,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadCompanion() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        const {
          data,
          error,
        } =
          await supabase
            .from("companions")
            .select(`
              id,
              owner_id,
              name,
              species,
              breed,
              sex,
              birth_date,
              color,
              weight,
              character,
              story,
              photo_url,
              identification_type,
              identification_number,
              sterilization_status,
              sterilization_date,
              sterilization_note,
              is_public,
              created_at
            `)
            .eq(
              "id",
              companionId
            )
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        if (!data) {
          setErrorMessage(
            "Ce compagnon est introuvable ou n'est pas accessible."
          );

          return;
        }

        const typedCompanion =
          data as Companion;

        setCompanion(
          typedCompanion
        );

        setIsOwner(
          Boolean(
            user &&
              user.id ===
                typedCompanion.owner_id
          )
        );
      } catch (error) {
        console.error(
          "Erreur fiche compagnon :",
          error
        );

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger ce compagnon."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (companionId) {
      void loadCompanion();
    }

    return () => {
      active = false;
    };
  }, [
    companionId,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement du compagnon...
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !companion
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8">
        <section className="mx-auto max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl">
          <div className="text-6xl">
            🐾
          </div>

          <h1 className="mt-4 text-2xl font-black text-[#064b42]">
            Compagnon introuvable
          </h1>

          <p className="mt-3 text-[#756d67]">
            {errorMessage ||
              "Cette fiche n'est pas disponible."}
          </p>

          <Link
            href="/mes-compagnons"
            className="mt-6 inline-flex rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour à Mes Compagnons
          </Link>
        </section>
      </main>
    );
  }

  const age =
    calculateAge(
      companion.birth_date
    );

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft
            size={17}
          />

          Retour
        </button>

        <article className="overflow-hidden rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] shadow-xl">

          <div className="relative aspect-[16/10] overflow-hidden bg-[#f4eee5] sm:aspect-[16/8]">
            {companion.photo_url ? (
              <img
                src={
                  companion.photo_url
                }
                alt={
                  companion.name
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl">
                🐾
              </div>
            )}

            <div className="absolute right-4 top-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black shadow-lg ${
                  companion.is_public
                    ? "bg-[#eaf5f1] text-[#064b42]"
                    : "bg-white text-[#756d67]"
                }`}
              >
                {companion.is_public ? (
                  <Eye size={15} />
                ) : (
                  <EyeOff size={15} />
                )}

                {companion.is_public
                  ? "Visible dans la communauté"
                  : "Profil privé"}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ef919b] text-white">
                <PawPrint
                  size={24}
                />
              </div>

              <div>
                <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                  {companion.name}
                </h1>

                <p className="mt-1 font-bold text-[#756d67]">
                  {formatSpecies(
                    companion.species
                  )}
                  {" · "}
                  {formatSex(
                    companion.sex
                  )}
                  {age
                    ? ` · ${age}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {companion.breed && (
                <InfoBlock
                  title="Race"
                  value={
                    companion.breed
                  }
                />
              )}

              {companion.color && (
                <InfoBlock
                  title="Couleur"
                  value={
                    companion.color
                  }
                />
              )}

              {companion.weight && (
                <InfoBlock
                  title="Poids"
                  value={
                    companion.weight
                  }
                />
              )}

              {companion.birth_date && (
                <InfoBlock
                  title="Date de naissance"
                  value={
                    formatDate(
                      companion.birth_date
                    )
                  }
                />
              )}
            </div>

            <div className="mt-6 rounded-[24px] bg-[#eaf5f1] p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={22}
                  className="text-[#064b42]"
                />

                <h2 className="font-black text-[#064b42]">
                  Stérilisation / Castration
                </h2>
              </div>

              <p className="mt-3 font-bold text-[#49685f]">
                {formatSterilization(
                  companion.sterilization_status
                )}
              </p>

              {companion.sterilization_date && (
                <p className="mt-2 text-sm text-[#6f625a]">
                  Date prévue :{" "}
                  {formatDate(
                    companion.sterilization_date
                  )}
                </p>
              )}

              {companion.sterilization_note && (
                <p className="mt-2 text-sm text-[#6f625a]">
                  {
                    companion.sterilization_note
                  }
                </p>
              )}
            </div>

            {isOwner &&
              companion.identification_number && (
                <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
                  <h2 className="font-black text-[#064b42]">
                    Identification
                  </h2>

                  <p className="mt-2 text-sm text-[#756d67]">
                    {formatIdentification(
                      companion.identification_type
                    )}
                  </p>

                  <p className="mt-1 text-lg font-black text-[#3b2417]">
                    {
                      companion.identification_number
                    }
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-[#9a918a]">
                    Ces informations restent privées et ne sont visibles que par le propriétaire.
                  </p>
                </div>
              )}

            {companion.character && (
              <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
                <h2 className="font-black text-[#064b42]">
                  Son caractère
                </h2>

                <p className="mt-3 leading-relaxed text-[#6f625a]">
                  {
                    companion.character
                  }
                </p>
              </div>
            )}

            {companion.story && (
              <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
                <h2 className="font-black text-[#064b42]">
                  Son histoire
                </h2>

                <p className="mt-3 whitespace-pre-line leading-relaxed text-[#6f625a]">
                  {
                    companion.story
                  }
                </p>
              </div>
            )}

            {isOwner && (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/signalement?companion=${encodeURIComponent(
                    companion.id
                  )}`}
                  className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-4 font-black text-white shadow-lg"
                >
                  <Siren
                    size={20}
                  />

                  Signaler sa disparition
                </Link>

                <Link
                  href="/mes-compagnons"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-4 font-black text-white shadow-lg"
                >
                  <PawPrint
                    size={20}
                  />

                  Mes Compagnons
                </Link>
              </div>
            )}

            {!isOwner &&
              companion.is_public && (
                <div className="mt-7 rounded-[24px] bg-[#fce8ec] p-5 text-center">
                  <p className="font-black text-[#d76f7e]">
                    🐾 Membre de la communauté des Sans Voix
                  </p>
                </div>
              )}

          </div>
        </article>
      </section>
    </main>
  );
}

function InfoBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#df8995]">
        {title}
      </p>

      <p className="mt-2 font-black text-[#064b42]">
        {value}
      </p>
    </div>
  );
}
