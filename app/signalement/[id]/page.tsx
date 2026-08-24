"use client";

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

type Signalement = {
  id: string;
  created_at?: string | null;

  user_id?: string | null;

  type_signalement?: string | null;

  animal_type?: string | null;
  animal_name?: string | null;
  sex?: string | null;
  age_label?: string | null;
  color?: string | null;
  breed?: string | null;

  island?: string | null;
  city?: string | null;
  address?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  situation?: string | null;
  description?: string | null;

  reporter_name?: string | null;
  reporter_phone?: string | null;
  reporter_email?: string | null;

  anonymous?: boolean | null;
  wants_contact?: boolean | null;

  status?: string | null;

  assigned_to?: string | null;
  assigned_at?: string | null;

  intervention_started_at?: string | null;
  resolved_at?: string | null;

  resolution_note?: string | null;
};

type Media = {
  id?: string;
  file_url: string;
  file_type?: string | null;
  file_name?: string | null;
};

type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  organization_name?: string | null;
  avatar_url?: string | null;
};

const ALLOWED_ROLES =
  new Set([
    "admin",
    "association",
    "refuge",
    "benevole",
    "fourriere",
  ]);

export default function SignalementDetailPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const signalementId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : String(
          params.id ||
            ""
        );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    currentProfile,
    setCurrentProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    signalement,
    setSignalement,
  ] =
    useState<Signalement | null>(
      null
    );

  const [
    assignedProfile,
    setAssignedProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    medias,
    setMedias,
  ] =
    useState<Media[]>(
      []
    );

  const [
    resolutionNote,
    setResolutionNote,
  ] =
    useState("");

  useEffect(() => {
    if (
      signalementId
    ) {
      loadData();
    }
  }, [
    signalementId,
  ]);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase
          .auth
          .getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login?redirect=" +
            encodeURIComponent(
              `/signalement/${signalementId}`
            )
        );

        return;
      }

      const {
        data:
          profileData,
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            `
              id,
              role,
              first_name,
              last_name,
              organization_name,
              avatar_url
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        profileError
      ) {
        throw profileError;
      }

      const role =
        String(
          profileData?.role ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        !ALLOWED_ROLES.has(
          role
        )
      ) {
        throw new Error(
          "Cette alerte est réservée aux associations, refuges, bénévoles, fourrières et administrateurs."
        );
      }

      setCurrentProfile(
        profileData as Profile
      );

      const {
        data:
          signalementData,
        error:
          signalementError,
      } =
        await supabase
          .from(
            "signalements"
          )
          .select("*")
          .eq(
            "id",
            signalementId
          )
          .single();

      if (
        signalementError
      ) {
        throw signalementError;
      }

      setSignalement(
        signalementData as Signalement
      );

      setResolutionNote(
        signalementData
          ?.resolution_note ||
          ""
      );

      const {
        data:
          mediaData,
        error:
          mediaError,
      } =
        await supabase
          .from(
            "signalement_medias"
          )
          .select(
            `
              id,
              file_url,
              file_type,
              file_name
            `
          )
          .eq(
            "signalement_id",
            signalementId
          );

      if (
        mediaError
      ) {
        console.error(
          "Erreur médias :",
          mediaError
        );
      }

      setMedias(
        (mediaData ||
          []) as Media[]
      );

      if (
        signalementData
          ?.assigned_to
      ) {
        const {
          data:
            assignedData,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              `
                id,
                role,
                first_name,
                last_name,
                organization_name,
                avatar_url
              `
            )
            .eq(
              "id",
              signalementData
                .assigned_to
            )
            .maybeSingle();

        setAssignedProfile(
          (assignedData as Profile | null) ||
            null
        );
      } else {
        setAssignedProfile(
          null
        );
      }

      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read: true,
        })
        .eq(
          "recipient_id",
          user.id
        )
        .eq(
          "signalement_id",
          signalementId
        );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur signalement :",
        error
      );

      setErrorMessage(
        error?.message ||
          "Impossible de charger le signalement."
      );
    } finally {
      setLoading(false);
    }
  }

  async function logAction(
    action: string,
    note?: string
  ) {
    if (
      !currentProfile
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "signalement_interventions"
        )
        .insert({
          signalement_id:
            signalementId,

          profile_id:
            currentProfile.id,

          action,

          note:
            note || null,
        });

    if (error) {
      console.error(
        "Erreur historique intervention :",
        error
      );
    }
  }

  async function takeIntervention() {
    if (
      !currentProfile ||
      !signalement
    ) {
      return;
    }

    try {
      setActionLoading(
        true
      );

      /*
       * Verrouillage logique :
       * la prise en charge ne fonctionne
       * que si assigned_to est encore NULL.
       */
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .update({
            assigned_to:
              currentProfile.id,

            assigned_at:
              new Date()
                .toISOString(),

            status:
              "pris_en_charge",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            signalement.id
          )
          .is(
            "assigned_to",
            null
          )
          .select("*")
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        alert(
          "Cette intervention vient déjà d'être prise en charge par un autre intervenant."
        );

        await loadData();

        return;
      }

      await logAction(
        "pris_en_charge"
      );

      await loadData();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de prendre l'intervention."
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  async function startIntervention() {
    if (
      !currentProfile ||
      !signalement
    ) {
      return;
    }

    try {
      setActionLoading(
        true
      );

      const {
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .update({
            status:
              "en_intervention",

            intervention_started_at:
              new Date()
                .toISOString(),

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            signalement.id
          )
          .eq(
            "assigned_to",
            currentProfile.id
          );

      if (error) {
        throw error;
      }

      await logAction(
        "en_intervention"
      );

      await loadData();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de démarrer l'intervention."
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  async function resolveIntervention() {
    if (
      !currentProfile ||
      !signalement
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Confirmer que cette intervention est réglée ?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setActionLoading(
        true
      );

      const {
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .update({
            status:
              "regle",

            resolved_at:
              new Date()
                .toISOString(),

            resolution_note:
              resolutionNote.trim() ||
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            signalement.id
          )
          .eq(
            "assigned_to",
            currentProfile.id
          );

      if (error) {
        throw error;
      }

      await logAction(
        "regle",
        resolutionNote.trim()
      );

      await loadData();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de clôturer l'intervention."
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-8 text-center font-bold text-[#064b42]">
        Chargement du signalement...
      </main>
    );
  }

  if (
    errorMessage ||
    !signalement
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-8">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">
            Signalement indisponible
          </h1>

          <p className="mt-4 text-gray-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour
          </button>
        </div>
      </main>
    );
  }

  const mine =
    signalement.assigned_to ===
    currentProfile?.id;

  const assignedName =
    getProfileName(
      assignedProfile
    );

  const status =
    signalement.status ||
    "nouveau";

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow"
        >
          ← Retour
        </button>

        <section className="rounded-[30px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                  🚨 SOS
                </span>

                <StatusBadge
                  status={
                    status
                  }
                />

                {signalement.anonymous && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                    🔒 Anonyme
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black text-[#064b42]">
                {signalement.type_signalement ||
                  "Signalement"}
              </h1>

              <p className="mt-2 text-lg text-[#6f5a47]">
                {signalement.animal_type ||
                  "Animal"}{" "}
                ·{" "}
                {signalement.animal_name ||
                  "Nom inconnu"}
              </p>

              <p className="mt-3 font-black text-[#b58b5b]">
                📍{" "}
                {signalement.city ||
                  "Commune inconnue"}{" "}
                -{" "}
                {signalement.island ||
                  "Île inconnue"}
              </p>
            </div>

            {signalement.assigned_to && (
              <div className="rounded-[22px] bg-[#f8f4ec] p-4">
                <p className="text-xs font-black uppercase text-[#9c7b54]">
                  Pris en charge par
                </p>

                <p className="mt-2 font-black text-[#064b42]">
                  {assignedName}
                </p>
              </div>
            )}
          </div>
        </section>

        {medias.length > 0 && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medias.map(
              (
                media,
                index
              ) => (
                <a
                  key={
                    media.id ||
                    index
                  }
                  href={
                    media.file_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-[24px] bg-white shadow"
                >
                  {String(
                    media.file_type ||
                      ""
                  ).startsWith(
                    "image/"
                  ) ? (
                    <img
                      src={
                        media.file_url
                      }
                      alt={
                        media.file_name ||
                        "Photo du signalement"
                      }
                      className="aspect-[4/3] h-full w-full object-cover"
                    />
                  ) : (
                    <div className="p-8 text-center font-bold text-[#064b42]">
                      📎{" "}
                      {media.file_name ||
                        "Fichier"}
                    </div>
                  )}
                </a>
              )
            )}
          </section>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[30px] bg-white p-6 shadow">
            <h2 className="text-xl font-black text-[#064b42]">
              Informations animal
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info
                title="Type"
                value={
                  signalement.animal_type
                }
              />

              <Info
                title="Nom"
                value={
                  signalement.animal_name
                }
              />

              <Info
                title="Sexe"
                value={
                  signalement.sex
                }
              />

              <Info
                title="Âge estimé"
                value={
                  signalement.age_label
                }
              />

              <Info
                title="Couleur"
                value={
                  signalement.color
                }
              />

              <Info
                title="Race"
                value={
                  signalement.breed
                }
              />
            </div>

            <div className="mt-4">
              <Info
                title="Situation"
                value={
                  signalement.situation
                }
              />
            </div>

            <div className="mt-4">
              <Info
                title="Description"
                value={
                  signalement.description
                }
              />
            </div>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow">
            <h2 className="text-xl font-black text-[#064b42]">
              Localisation
            </h2>

            <div className="mt-5 space-y-3">
              <Info
                title="Île"
                value={
                  signalement.island
                }
              />

              <Info
                title="Commune"
                value={
                  signalement.city
                }
              />

              <Info
                title="Adresse"
                value={
                  signalement.address
                }
              />

              {typeof signalement.latitude ===
                "number" &&
                typeof signalement.longitude ===
                  "number" && (
                  <a
                    href={`https://www.google.com/maps?q=${signalement.latitude},${signalement.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-full bg-[#064b42] px-5 py-3 text-center font-black text-white"
                  >
                    📍 Ouvrir la géolocalisation
                  </a>
                )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <h2 className="text-xl font-black text-[#064b42]">
            Déclarant
          </h2>

          {signalement.anonymous ? (
            <div className="mt-5 rounded-[22px] bg-gray-100 p-5">
              <p className="font-black text-gray-700">
                🔒 Signalement anonyme
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Le nom, le téléphone et l&apos;adresse email ne sont pas communiqués aux intervenants.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info
                title="Nom"
                value={
                  signalement.reporter_name
                }
              />

              <Info
                title="Téléphone"
                value={
                  signalement.reporter_phone
                }
              />

              <Info
                title="Email"
                value={
                  signalement.reporter_email
                }
              />
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <h2 className="text-xl font-black text-[#064b42]">
            Intervention
          </h2>

          {!signalement.assigned_to &&
            status ===
              "nouveau" && (
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  takeIntervention
                }
                className="mt-5 w-full rounded-full bg-red-600 px-6 py-4 text-lg font-black text-white disabled:opacity-50"
              >
                🚨 Je prends l&apos;intervention
              </button>
            )}

          {signalement.assigned_to &&
            !mine && (
              <div className="mt-5 rounded-[22px] bg-[#f8f4ec] p-5">
                <p className="font-black text-[#064b42]">
                  Intervention déjà prise en charge
                </p>

                <p className="mt-2 text-sm text-[#6f5a47]">
                  {assignedName} gère actuellement ce signalement.
                </p>
              </div>
            )}

          {mine &&
            status ===
              "pris_en_charge" && (
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  startIntervention
                }
                className="mt-5 w-full rounded-full bg-orange-500 px-6 py-4 text-lg font-black text-white disabled:opacity-50"
              >
                ▶ Démarrer l&apos;intervention
              </button>
            )}

          {mine &&
            status ===
              "en_intervention" && (
              <div className="mt-5">
                <label className="mb-2 block font-black text-[#064b42]">
                  Note de résolution
                </label>

                <textarea
                  value={
                    resolutionNote
                  }
                  onChange={(
                    event
                  ) =>
                    setResolutionNote(
                      event
                        .target
                        .value
                    )
                  }
                  rows={4}
                  placeholder="Exemple : animal récupéré, confié au vétérinaire..."
                  className="w-full rounded-[22px] border border-[#eadfce] bg-[#faf7f2] p-4 outline-none"
                />

                <button
                  type="button"
                  disabled={
                    actionLoading
                  }
                  onClick={
                    resolveIntervention
                  }
                  className="mt-4 w-full rounded-full bg-green-600 px-6 py-4 text-lg font-black text-white disabled:opacity-50"
                >
                  ✅ Intervention réglée
                </button>
              </div>
            )}

          {status ===
            "regle" && (
            <div className="mt-5 rounded-[22px] bg-green-50 p-5 text-green-800">
              <p className="text-lg font-black">
                ✅ Intervention réglée
              </p>

              {signalement.resolution_note && (
                <p className="mt-3 whitespace-pre-wrap">
                  {
                    signalement.resolution_note
                  }
                </p>
              )}

              {signalement.resolved_at && (
                <p className="mt-3 text-sm">
                  Clôturée le{" "}
                  {new Date(
                    signalement.resolved_at
                  ).toLocaleString(
                    "fr-FR"
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getProfileName(
  profile:
    | Profile
    | null
) {
  if (!profile) {
    return "Intervenant";
  }

  if (
    profile.organization_name
  ) {
    return profile.organization_name;
  }

  const name =
    `${profile.first_name || ""} ${
      profile.last_name || ""
    }`.trim();

  return (
    name ||
    "Intervenant"
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<
    string,
    {
      label: string;
      classes: string;
    }
  > = {
    nouveau: {
      label:
        "Nouveau",
      classes:
        "bg-red-100 text-red-700",
    },

    pris_en_charge: {
      label:
        "Pris en charge",
      classes:
        "bg-orange-100 text-orange-700",
    },

    en_intervention: {
      label:
        "Intervention en cours",
      classes:
        "bg-yellow-100 text-yellow-800",
    },

    regle: {
      label:
        "Réglé",
      classes:
        "bg-green-100 text-green-700",
    },
  };

  const item =
    config[status] ||
    config.nouveau;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${item.classes}`}
    >
      {item.label}
    </span>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value:
    | string
    | null
    | undefined;
}) {
  return (
    <div className="rounded-2xl bg-[#faf7f2] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#b58b5b]">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-line text-[#064b42]">
        {value ||
          "Non renseigné"}
      </p>
    </div>
  );
}