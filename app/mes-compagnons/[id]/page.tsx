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
  Users,
  X,
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
  is_deceased: boolean;
  death_date: string | null;
  death_tribute: string | null;
  social_enabled: boolean;
  social_energy: string | null;
  social_dogs: string | null;
  social_cats: string | null;
  social_play: string | null;
  social_size: string | null;
  social_preferred_sizes: string[];
  social_temperaments: string[];
  social_meeting_types: string[];
  social_notes: string | null;
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

  const [
    memorialOpen,
    setMemorialOpen,
  ] = useState(false);

  const [
    deathDate,
    setDeathDate,
  ] = useState("");

  const [
    tributeText,
    setTributeText,
  ] = useState("");

  const [
    markingDeceased,
    setMarkingDeceased,
  ] = useState(false);

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
              is_deceased,
              death_date,
              death_tribute,
              social_enabled,
              social_energy,
              social_dogs,
              social_cats,
              social_play,
              social_size,
              social_preferred_sizes,
              social_temperaments,
              social_meeting_types,
              social_notes,
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

  async function markAsDeceased() {
    if (markingDeceased || !companion || !isOwner) {
      return;
    }

    if (!deathDate) {
      alert("Merci d'indiquer la date du décès.");
      return;
    }

    if (!tributeText.trim()) {
      alert("Merci d'écrire quelques mots pour son hommage.");
      return;
    }

    const confirmed = window.confirm(
      `Confirmer le décès de ${companion.name} ?\n\nIl sera retiré de Mes Compagnons et de la communauté, mais sa fiche et son historique seront conservés.`
    );

    if (!confirmed) {
      return;
    }

    let createdHommageId = "";

    try {
      setMarkingDeceased(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user || user.id !== companion.owner_id) {
        throw new Error(
          "Vous devez être connecté avec le compte propriétaire de ce compagnon."
        );
      }

      if (!user.email) {
        throw new Error(
          "Votre compte ne possède pas d'adresse e-mail utilisable pour créer l'hommage."
        );
      }

      const { data: hommage, error: hommageError } = await supabase
        .from("hommages")
        .insert({
          user_id: user.id,
          animal_name: companion.name,
          animal_type: formatSpecies(companion.species),
          birth_date: companion.birth_date || null,
          death_date: deathDate,
          tribute_text: tributeText.trim(),
          submitter_name: null,
          submitter_email: user.email,
          photo_url: companion.photo_url || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (hommageError) {
        throw hommageError;
      }

      createdHommageId = hommage?.id || "";

      const { error: companionError } = await supabase
        .from("companions")
        .update({
          is_deceased: true,
          is_public: false,
          death_date: deathDate,
          death_tribute: tributeText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", companion.id)
        .eq("owner_id", user.id);

      if (companionError) {
        if (createdHommageId) {
          await supabase
            .from("hommages")
            .delete()
            .eq("id", createdHommageId)
            .eq("user_id", user.id);
        }

        throw companionError;
      }

      setMemorialOpen(false);

      alert(
        `${companion.name} a été retiré de vos compagnons actifs. Son hommage a été créé et sera publié après validation.`
      );

      router.push("/hommage");
      router.refresh();
    } catch (error) {
      console.error("Erreur déclaration décès compagnon :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le décès de ce compagnon."
      );
    } finally {
      setMarkingDeceased(false);
    }
  }

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

            {isOwner && !companion.is_deceased && (
              <div className="mt-7 rounded-[26px] border border-[#efd5d7] bg-[#fce8ec] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#df8995] text-white">
                    <Users size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-black text-[#064b42]">
                      Balades & Copains
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-[#756d67]">
                      {companion.social_enabled
                        ? `${companion.name} peut apparaître dans les recherches de copains compatibles.`
                        : `Active le profil social de ${companion.name} pour lui trouver des copains compatibles.`}
                    </p>
                  </div>
                </div>

                {companion.social_enabled && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {companion.social_energy && (
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#064b42]">
                        ⚡ {companion.social_energy === "modere" ? "Énergie modérée" : companion.social_energy === "sportif" ? "Sportif" : "Calme"}
                      </span>
                    )}
                    {companion.social_size && (
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#064b42]">
                        📏 Taille {companion.social_size}
                      </span>
                    )}
                    {companion.social_temperaments?.slice(0, 3).map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#064b42]">
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/mes-compagnons/${encodeURIComponent(companion.id)}/profil-social`}
                    className="flex items-center justify-center rounded-full border-2 border-[#064b42] bg-white px-5 py-3 font-black text-[#064b42]"
                  >
                    {companion.social_enabled ? "⚙️ Modifier son profil social" : "✨ Créer son profil social"}
                  </Link>

                  <Link
                    href={`/mes-compagnons/${encodeURIComponent(companion.id)}/copains`}
                    className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 font-black text-white shadow-lg ${
                      companion.social_enabled
                        ? "bg-[#df8995]"
                        : "pointer-events-none bg-[#c9b9b4] opacity-60"
                    }`}
                    aria-disabled={!companion.social_enabled}
                  >
                    <PawPrint size={18} />
                    Trouver un copain
                  </Link>
                </div>
              </div>
            )}

            {isOwner && (
              <>
                {!companion.is_deceased && (
                  <Link
                    href={`/mes-compagnons/${encodeURIComponent(companion.id)}/modifier`}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#064b42] bg-white px-5 py-4 font-black text-[#064b42] shadow-sm"
                  >
                    ✏️ Modifier sa fiche
                  </Link>
                )}

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/signalement?companion=${encodeURIComponent(
                      companion.id
                    )}`}
                    className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-4 font-black text-white shadow-lg"
                  >
                    <Siren size={20} />
                    Signaler sa disparition
                  </Link>

                  <Link
                    href="/mes-compagnons"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-5 py-4 font-black text-white shadow-lg"
                  >
                    <PawPrint size={20} />
                    Mes Compagnons
                  </Link>
                </div>

                {!companion.is_deceased && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeathDate("");
                      setTributeText(
                        companion.story
                          ? `Pour ${companion.name}.\n\n${companion.story}`
                          : `Pour ${companion.name}, qui restera toujours dans nos cœurs.`
                      );
                      setMemorialOpen(true);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#b58b5b] bg-white px-5 py-4 font-black text-[#8d673d] shadow-sm transition hover:bg-[#fff8ef]"
                  >
                    🕯️ Animal décédé
                  </button>
                )}
              </>
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

      {memorialOpen && companion && isOwner && (
        <div className="fixed inset-0 z-[500] overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => {
              if (!markingDeceased) {
                setMemorialOpen(false);
              }
            }}
            className="fixed inset-0 h-full w-full"
          />

          <div className="relative z-10 mx-auto w-full max-w-xl overflow-hidden rounded-[32px] bg-[#fffaf7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eadfd8] px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b58b5b]">
                  À sa mémoire
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                  🕯️ {companion.name} est décédé
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMemorialOpen(false)}
                disabled={markingDeceased}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#064b42] shadow disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-[22px] bg-[#f8f4ec] p-4 text-sm leading-6 text-[#6f625a]">
                Son profil ne sera pas supprimé. Il quittera simplement vos compagnons actifs et la communauté. Son histoire et ses anciens signalements resteront conservés.
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block font-black text-[#064b42]">
                  Date du décès *
                </span>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(event) => setDeathDate(event.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-[18px] border border-[#e5d8cd] bg-white px-4 py-3 outline-none focus:border-[#b58b5b]"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block font-black text-[#064b42]">
                  Quelques mots pour lui *
                </span>
                <textarea
                  value={tributeText}
                  onChange={(event) => setTributeText(event.target.value)}
                  rows={7}
                  maxLength={3000}
                  placeholder="Un souvenir, son histoire, quelques mots pour lui..."
                  className="w-full resize-y rounded-[18px] border border-[#e5d8cd] bg-white px-4 py-3 leading-7 outline-none focus:border-[#b58b5b]"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {tributeText.length}/3000
                </p>
              </label>

              <button
                type="button"
                onClick={markAsDeceased}
                disabled={markingDeceased || !deathDate || !tributeText.trim()}
                className="mt-6 w-full rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingDeceased
                  ? "Création de l'hommage..."
                  : "🕯️ Confirmer et créer son hommage"}
              </button>
            </div>
          </div>
        </div>
      )}
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
