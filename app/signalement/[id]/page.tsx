"use client";

import {
  useCallback,
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
  disappearance_at?: string | null;
  found_at?: string | null;

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

type SignalementMatch = {
  signalement_id: string;
  type_signalement?: string | null;
  animal_type?: string | null;
  animal_name?: string | null;
  sex?: string | null;
  color?: string | null;
  breed?: string | null;
  island?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  disappearance_at?: string | null;
  found_at?: string | null;
  status?: string | null;
  photo_url?: string | null;
  match_score: number;
  match_level?: string | null;
  match_reasons?: string[] | null;
};

type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  organization_name?: string | null;
  avatar_url?: string | null;
};

type SignalementUpdate = {
  id: string;
  created_at?: string | null;
  signalement_id: string;
  created_by: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  observation_at?: string | null;
  is_verified?: boolean | null;
  verified_by?: string | null;
  verified_at?: string | null;
};

const ALLOWED_ROLES =
  new Set([
    "admin",
    "association",
    "refuge",
    "benevole",
    "fourriere",
    "adoptant",
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

  const [matches, setMatches] = useState<SignalementMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [
    resolutionNote,
    setResolutionNote,
  ] =
    useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState("nouveau");

  const [
    reporterMessage,
    setReporterMessage,
  ] =
    useState("");

  const [updates, setUpdates] = useState<SignalementUpdate[]>([]);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateObservationAt, setUpdateObservationAt] = useState("");
  const [updateLatitude, setUpdateLatitude] = useState("");
  const [updateLongitude, setUpdateLongitude] = useState("");

  const loadData = useCallback(async () => {
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
          "Vous devez être connecté à TAUI TE ORA pour consulter cette alerte."
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

      setSelectedStatus(
        normalizeStatus(
          signalementData
            ?.status ||
            "nouveau"
        )
      );

      setReporterMessage(
        signalementData
          ?.resolution_note ||
          ""
      );

      const loadedType = String(
        signalementData?.type_signalement || ""
      ).trim().toLowerCase();

      if (loadedType === "animal perdu" || loadedType === "animal trouvé") {
        setMatchesLoading(true);

        const {
          data: matchData,
          error: matchError,
        } = await supabase.rpc("get_signalement_matches", {
          p_signalement_id: signalementId,
        });

        if (matchError) {
          console.error("Erreur matching signalements :", matchError);
          setMatches([]);
        } else {
          setMatches((matchData || []) as SignalementMatch[]);
        }

        setMatchesLoading(false);
      } else {
        setMatches([]);
        setMatchesLoading(false);
      }

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

      const { data: updateData, error: updateError } = await supabase
        .from("signalement_updates")
        .select("*")
        .eq("signalement_id", signalementId)
        .order("created_at", { ascending: false });

      if (updateError) console.error("Erreur informations supplémentaires :", updateError);
      setUpdates((updateData || []) as SignalementUpdate[]);

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
  }, [signalementId, router]);

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

  async function notifyReporter(
    nextStatus: string,
    customMessage?: string
  ) {
    if (
      !signalement?.user_id
    ) {
      return;
    }

    const label =
      statusLabel(
        nextStatus
      );

    const message =
      customMessage?.trim() ||
      `Le statut de votre signalement est maintenant : ${label}.`;

    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          recipient_id:
            signalement.user_id,

          signalement_id:
            signalement.id,

          type:
            "signalement_status",

          title:
            `Mise à jour de votre signalement : ${label}`,

          message,

          is_read:
            false,
        });

    if (error) {
      console.error(
        "Erreur notification déclarant :",
        error
      );
    }
  }

  async function saveSignalementStatus() {
    if (
      !signalement ||
      !currentProfile
    ) {
      return;
    }

    const signalementType =
      String(signalement.type_signalement || "").trim().toLowerCase();

    const lostOrFoundAnimal =
      signalementType === "animal perdu" ||
      signalementType === "animal trouvé";

    if (
      lostOrFoundAnimal &&
      currentProfile.role !== "admin" &&
      signalement.user_id !== currentProfile.id
    ) {
      alert("Seul l'auteur du signalement ou un administrateur peut modifier le statut de cet animal.");
      return;
    }

    try {
      setActionLoading(
        true
      );

      const now =
        new Date()
          .toISOString();

      const payload: Record<
        string,
        any
      > = {
        status:
          selectedStatus,

        resolution_note:
          reporterMessage.trim() ||
          null,

        updated_at:
          now,
      };

      if (
        selectedStatus ===
        "en_cours"
      ) {
        payload.intervention_started_at =
          signalement.intervention_started_at ||
          now;
      }

      if (
        selectedStatus ===
          "animal_retrouve" ||
        selectedStatus ===
          "cloture"
      ) {
        payload.resolved_at =
          now;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .update(
            payload
          )
          .eq(
            "id",
            signalement.id
          );

      if (error) {
        throw error;
      }

      await logAction(
        selectedStatus,
        reporterMessage.trim()
      );

      await notifyReporter(
        selectedStatus,
        reporterMessage
      );

      alert(
        "Signalement sauvegardé. Le statut a été mis à jour."
      );

      await loadData();
    } catch (
      error: any
    ) {
      console.error(
        "Erreur sauvegarde signalement :",
        error
      );

      alert(
        error?.message ||
          "Impossible de sauvegarder le signalement."
      );
    } finally {
      setActionLoading(
        false
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
              "en_cours",

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
        "en_cours"
      );

      await notifyReporter(
        "en_cours"
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
              "en_cours",

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
        "en_cours"
      );

      await notifyReporter(
        "en_cours"
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
              "cloture",

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
        "cloture",
        resolutionNote.trim()
      );

      await notifyReporter(
        "cloture",
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

  async function addSignalementUpdate() {
    if (!currentProfile || !signalement || !updateMessage.trim()) return;
    try {
      setActionLoading(true);
      const isAdmin = currentProfile.role === "admin";
      const { error } = await supabase.from("signalement_updates").insert({
        signalement_id: signalement.id,
        created_by: currentProfile.id,
        message: updateMessage.trim(),
        latitude: updateLatitude.trim() ? Number(updateLatitude) : null,
        longitude: updateLongitude.trim() ? Number(updateLongitude) : null,
        observation_at: updateObservationAt ? new Date(updateObservationAt).toISOString() : null,
        is_verified: isAdmin,
        verified_by: isAdmin ? currentProfile.id : null,
        verified_at: isAdmin ? new Date().toISOString() : null,
      });
      if (error) throw error;
      setUpdateMessage(""); setUpdateObservationAt(""); setUpdateLatitude(""); setUpdateLongitude("");
      alert(isAdmin ? "Information ajoutée et vérifiée." : "Information envoyée. Elle sera publiée après vérification par un administrateur.");
      await loadData();
    } catch (error: any) {
      alert(error?.message || "Impossible d'ajouter cette information.");
    } finally { setActionLoading(false); }
  }

  async function verifySignalementUpdate(updateId: string) {
    if (currentProfile?.role !== "admin") return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from("signalement_updates").update({
        is_verified: true,
        verified_by: currentProfile.id,
        verified_at: new Date().toISOString(),
      }).eq("id", updateId);
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert(error?.message || "Impossible de vérifier cette information.");
    } finally { setActionLoading(false); }
  }

  useEffect(() => {
    if (signalementId) {
      queueMicrotask(() => void loadData());
    }
  }, [signalementId, loadData]);

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

  const canIntervene =
    currentProfile?.role === "admin" ||
    currentProfile?.role === "association" ||
    currentProfile?.role === "refuge" ||
    currentProfile?.role === "benevole" ||
    currentProfile?.role === "fourriere";

  const signalementType =
    String(signalement.type_signalement || "").trim().toLowerCase();
  const isLostAnimal = signalementType === "animal perdu";
  const isFoundAnimal = signalementType === "animal trouvé";
  const isLostOrFoundAnimal = isLostAnimal || isFoundAnimal;
  const isReporter = signalement.user_id === currentProfile?.id;
  const canManageLostOrFoundAnimal =
    isLostOrFoundAnimal && (currentProfile?.role === "admin" || isReporter);
  const canAddUpdate =
    isLostOrFoundAnimal && (currentProfile?.role === "admin" || isReporter);
  const visibleUpdates =
    currentProfile?.role === "admin" ? updates : updates.filter((item) => item.is_verified);

  const assignedName =
    getProfileName(
      assignedProfile
    );

  const status =
    normalizeStatus(
      signalement.status ||
        "nouveau"
    );

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

        {isLostOrFoundAnimal && (
          <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b58b5b]">
                  Matching automatique
                </p>
                <h2 className="mt-1 text-xl font-black text-[#064b42]">
                  🔎 Correspondances possibles
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f5a47]">
                  TAUI TE ORA compare les signalements perdus et trouvés. Une correspondance est une suggestion et doit toujours être vérifiée.
                </p>
              </div>

              {!matchesLoading && matches.length > 0 && (
                <span className="w-fit rounded-full bg-[#edf7f4] px-4 py-2 text-sm font-black text-[#064b42]">
                  {matches.length} résultat{matches.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {matchesLoading ? (
              <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-5 font-bold text-[#6f5a47]">
                Recherche des correspondances...
              </div>
            ) : matches.length === 0 ? (
              <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-5">
                <p className="font-black text-[#064b42]">
                  Aucune correspondance suffisamment proche pour le moment.
                </p>
                <p className="mt-2 text-sm text-[#6f5a47]">
                  Le matching évoluera automatiquement lorsque de nouveaux signalements seront enregistrés.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {matches.map((match) => {
                  const dataScore = Number(match.match_score || 0);
                  const identificationMatch =
                    String(match.match_level || "").trim().toLowerCase() === "identification" ||
                    (Array.isArray(match.match_reasons) &&
                      match.match_reasons.includes("Même numéro d'identification"));
                  const score = identificationMatch
                    ? Math.max(99, dataScore)
                    : dataScore;
                  const level = getMatchLevel(identificationMatch ? "identification" : null, score);
                  const reasons = Array.isArray(match.match_reasons)
                    ? match.match_reasons
                    : [];

                  return (
                    <article
                      key={match.signalement_id}
                      className="overflow-hidden rounded-[24px] border border-[#eadfce] bg-[#faf7f2]"
                    >
                      <div className="grid sm:grid-cols-[150px_1fr]">
                        <div className="min-h-[150px] bg-[#eee5d9]">
                          {match.photo_url ? (
                            <img
                              src={match.photo_url}
                              alt={match.animal_name || "Animal correspondant"}
                              className="h-full min-h-[150px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[150px] items-center justify-center text-5xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${level.classes}`}>
                              {score}% · {level.label}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#6f5a47]">
                              {match.type_signalement || "Signalement"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-black text-[#064b42]">
                            {match.animal_name || "Nom inconnu"}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-[#6f5a47]">
                            {match.animal_type || "Animal"}
                            {match.breed ? ` · ${match.breed}` : ""}
                            {match.sex ? ` · ${match.sex}` : ""}
                          </p>

                          <p className="mt-2 text-sm font-black text-[#b58b5b]">
                            📍 {match.city || "Commune inconnue"} · {match.island || "Île inconnue"}
                          </p>

                          {reasons.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {reasons.map((reason) => (
                                <span
                                  key={`${match.signalement_id}-${reason}`}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#064b42]"
                                >
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/signalement/${match.signalement_id}`)
                            }
                            className="mt-4 w-full rounded-full bg-[#064b42] px-5 py-3 font-black text-white transition hover:bg-[#08695d]"
                          >
                            Voir le signalement →
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
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

              {isLostAnimal && (
                <Info
                  title="Date / heure approximative de disparition"
                  value={signalement.disappearance_at
                    ? new Date(signalement.disappearance_at).toLocaleString("fr-FR")
                    : "Non renseigné"}
                />
              )}

              {isFoundAnimal && (
                <Info
                  title="Date / heure approximative de découverte"
                  value={signalement.found_at
                    ? new Date(signalement.found_at).toLocaleString("fr-FR")
                    : "Non renseigné"}
                />
              )}

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

        {isLostOrFoundAnimal && (
          <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
            <h2 className="text-xl font-black text-[#064b42]">Informations vérifiées</h2>
            <p className="mt-1 text-sm text-[#6f5a47]">
              Les observations vérifiées sont visibles par tous. L&apos;administrateur valide les nouvelles informations.
            </p>

            <div className="mt-5 space-y-4">
              {visibleUpdates.length === 0 && (
                <div className="rounded-[22px] bg-[#faf7f2] p-5 text-[#6f5a47]">
                  Aucune information supplémentaire vérifiée pour le moment.
                </div>
              )}
              {visibleUpdates.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[#eadfce] bg-[#faf7f2] p-5">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${item.is_verified ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                    {item.is_verified ? "✓ Information vérifiée" : "En attente de vérification"}
                  </span>
                  <p className="mt-4 whitespace-pre-wrap font-semibold text-[#064b42]">{item.message}</p>
                  {item.observation_at && (
                    <p className="mt-3 text-sm text-[#6f5a47]">🕒 Observation : {new Date(item.observation_at).toLocaleString("fr-FR")}</p>
                  )}
                  {typeof item.latitude === "number" && typeof item.longitude === "number" && (
                    <a href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer"
                      className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow-sm">
                      📍 Voir le point d&apos;observation
                    </a>
                  )}
                  {currentProfile?.role === "admin" && !item.is_verified && (
                    <button type="button" disabled={actionLoading}
                      onClick={() => void verifySignalementUpdate(item.id)}
                      className="mt-4 block rounded-full bg-green-700 px-5 py-3 font-black text-white disabled:opacity-50">
                      ✓ Vérifier et publier
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canAddUpdate && (
              <div className="mt-7 border-t border-[#eadfce] pt-6">
                <h3 className="font-black text-[#064b42]">Ajouter une information</h3>
                <textarea value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} rows={4}
                  placeholder="Exemple : aperçu près de la mairie, direction Paea..."
                  className="mt-4 w-full rounded-[22px] border border-[#eadfce] bg-[#faf7f2] p-4" />
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input type="datetime-local" value={updateObservationAt} onChange={(e) => setUpdateObservationAt(e.target.value)}
                    className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3" />
                  <input placeholder="Latitude" value={updateLatitude} onChange={(e) => setUpdateLatitude(e.target.value)}
                    className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3" />
                  <input placeholder="Longitude" value={updateLongitude} onChange={(e) => setUpdateLongitude(e.target.value)}
                    className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3" />
                </div>
                <button type="button" disabled={actionLoading || !updateMessage.trim()}
                  onClick={() => void addSignalementUpdate()}
                  className="mt-5 w-full rounded-full bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-50">
                  Ajouter l&apos;information
                </button>
              </div>
            )}
          </section>
        )}

        {canIntervene && (
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
        )}

        {((isLostOrFoundAnimal && canManageLostOrFoundAnimal) || (!isLostOrFoundAnimal && canIntervene)) && (
        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Traitement du signalement
              </h2>

              <p className="mt-1 text-sm text-[#6f5a47]">
                Modifiez le statut, ajoutez un message pour le déclarant puis sauvegardez.
              </p>
            </div>

            <StatusBadge
              status={
                selectedStatus
              }
            />
          </div>

          {!isLostOrFoundAnimal &&
            !signalement.assigned_to &&
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
                className="mt-5 w-full rounded-full bg-orange-500 px-6 py-4 text-lg font-black text-white disabled:opacity-50"
              >
                🚨 Prendre en charge
              </button>
            )}

          {signalement.assigned_to &&
            !mine &&
            currentProfile?.role !==
              "admin" && (
              <div className="mt-5 rounded-[22px] bg-[#f8f4ec] p-5">
                <p className="font-black text-[#064b42]">
                  Intervention déjà prise en charge
                </p>

                <p className="mt-2 text-sm text-[#6f5a47]">
                  {assignedName} gère actuellement ce signalement.
                </p>
              </div>
            )}

          {((isLostOrFoundAnimal && canManageLostOrFoundAnimal) ||
            (!isLostOrFoundAnimal && (mine || currentProfile?.role === "admin"))) && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block font-black text-[#064b42]">
                  Statut du signalement
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStatus(
                        "en_cours"
                      )
                    }
                    className={`rounded-[18px] border-2 px-4 py-4 text-sm font-black transition ${
                      selectedStatus ===
                      "en_cours"
                        ? "border-orange-500 bg-orange-100 text-orange-800"
                        : "border-orange-100 bg-white text-orange-700"
                    }`}
                  >
                    🟠 En cours
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStatus(
                        "animal_retrouve"
                      )
                    }
                    className={`rounded-[18px] border-2 px-4 py-4 text-sm font-black transition ${
                      selectedStatus ===
                      "animal_retrouve"
                        ? "border-green-400 bg-green-100 text-green-800"
                        : "border-green-100 bg-white text-green-700"
                    }`}
                  >
                    🟢 Animal retrouvé
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStatus(
                        "cloture"
                      )
                    }
                    className={`rounded-[18px] border-2 px-4 py-4 text-sm font-black transition ${
                      selectedStatus ===
                      "cloture"
                        ? "border-green-800 bg-green-800 text-white"
                        : "border-green-200 bg-white text-green-900"
                    }`}
                  >
                    ✅ Clôturé
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-black text-[#064b42]">
                  Message envoyé au déclarant
                </label>

                <textarea
                  value={
                    reporterMessage
                  }
                  onChange={(
                    event
                  ) =>
                    setReporterMessage(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Exemple : Nous avons pris en charge votre signalement. L'animal a été retrouvé et mis en sécurité..."
                  className="w-full rounded-[22px] border border-[#eadfce] bg-[#faf7f2] p-4 outline-none focus:border-[#064b42]"
                />

                <p className="mt-2 text-xs text-[#7a7068]">
                  Si le déclarant possède un compte TAUI TE ORA, il recevra cette mise à jour dans ses notifications avec le nouveau statut.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  saveSignalementStatus
                }
                className="w-full rounded-full bg-[#064b42] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#08695d] disabled:opacity-50"
              >
                {actionLoading
                  ? "Sauvegarde..."
                  : "💾 Sauvegarder le signalement"}
              </button>
            </div>
          )}

          {(status ===
              "animal_retrouve" ||
            status ===
              "cloture") && (
            <div
              className={`mt-5 rounded-[22px] p-5 ${
                status ===
                "animal_retrouve"
                  ? "bg-green-100 text-green-800"
                  : "bg-green-800 text-white"
              }`}
            >
              <p className="text-lg font-black">
                {status ===
                "animal_retrouve"
                  ? "🟢 Animal retrouvé"
                  : "✅ Signalement clôturé"}
              </p>

              {signalement.resolution_note && (
                <p className="mt-3 whitespace-pre-wrap">
                  {
                    signalement.resolution_note
                  }
                </p>
              )}

              {signalement.resolved_at && (
                <p className="mt-3 text-sm opacity-80">
                  Mis à jour le{" "}
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
        )}
      </div>
    </main>
  );
}

function getMatchLevel(level?: string | null, score = 0) {
  const normalized = String(level || "").trim().toLowerCase();

  if (normalized === "identification") {
    return {
      label: "Identification correspondante",
      classes: "bg-green-800 text-white",
    };
  }

  if (normalized === "tres_forte" || score >= 85) {
    return {
      label: "Très forte correspondance",
      classes: "bg-green-700 text-white",
    };
  }

  if (normalized === "forte" || score >= 70) {
    return {
      label: "Forte correspondance",
      classes: "bg-green-100 text-green-800",
    };
  }

  if (normalized === "possible" || score >= 55) {
    return {
      label: "Correspondance possible",
      classes: "bg-orange-100 text-orange-800",
    };
  }

  return {
    label: "À vérifier",
    classes: "bg-gray-100 text-gray-700",
  };
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

function normalizeStatus(
  status?: string | null
) {
  switch (
    String(
      status ||
        "nouveau"
    )
      .trim()
      .toLowerCase()
  ) {
    case "pris_en_charge":
    case "en_intervention":
    case "en_cours":
      return "en_cours";

    case "animal_retrouve":
    case "retrouve":
      return "animal_retrouve";

    case "regle":
    case "resolu":
    case "cloture":
      return "cloture";

    case "nouveau":
    default:
      return "nouveau";
  }
}

function statusLabel(
  status?: string | null
) {
  switch (
    normalizeStatus(
      status
    )
  ) {
    case "en_cours":
      return "En cours";

    case "animal_retrouve":
      return "Animal retrouvé";

    case "cloture":
      return "Clôturé";

    case "nouveau":
    default:
      return "Nouveau";
  }
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeStatus(
      status
    );

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

    en_cours: {
      label:
        "En cours",
      classes:
        "bg-orange-100 text-orange-800",
    },

    animal_retrouve: {
      label:
        "Animal retrouvé",
      classes:
        "bg-green-100 text-green-800",
    },

    cloture: {
      label:
        "Clôturé",
      classes:
        "bg-green-800 text-white",
    },
  };

  const item =
    config[normalized] ||
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
