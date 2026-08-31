"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Crosshair,
  Eye,
  ImagePlus,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ObservationType = "seen" | "secured";

type Observation = {
  id: string;
  signalement_id: string;
  user_id: string;
  observation_type: ObservationType | string;
  observation_at: string | null;
  latitude: number | null;
  longitude: number | null;
  animal_state: string | null;
  comment: string | null;
  photo_urls: string[] | null;
  is_verified: boolean | null;
  created_at: string;
};

type Props = {
  signalementId: string;
};

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ANIMAL_STATES = [
  { value: "", label: "État non renseigné" },
  { value: "semble_bien", label: "Semble aller bien" },
  { value: "apeure", label: "Apeuré / craintif" },
  { value: "blesse", label: "Semble blessé" },
  { value: "affaibli", label: "Affaibli" },
  { value: "agressif", label: "Comportement agressif" },
  { value: "danger_immediat", label: "Danger immédiat" },
];

function localDateTimeValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Date inconnue";

  try {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

function animalStateLabel(value: string | null | undefined) {
  if (!value) return "";
  return ANIMAL_STATES.find((item) => item.value === value)?.label || value;
}

function extensionForFile(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function createFilePath(signalementId: string, userId: string, file: File) {
  return [
    "observations",
    signalementId,
    userId,
    `${Date.now()}-${crypto.randomUUID()}.${extensionForFile(file)}`,
  ].join("/");
}

export default function SignalementObservationPanel({
  signalementId,
}: Props) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [observationType, setObservationType] =
    useState<ObservationType>("seen");
  const [observationAt, setObservationAt] = useState(localDateTimeValue());
  const [animalState, setAnimalState] = useState("");
  const [comment, setComment] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const loadObservations = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("signalement_observations")
        .select("*")
        .eq("signalement_id", signalementId)
        .order("observation_at", { ascending: false });

      if (error) throw error;
      setObservations((data || []) as Observation[]);
    } catch (error: unknown) {
      console.error("Erreur observations :", error);
    } finally {
      setLoading(false);
    }
  }, [signalementId]);

  useEffect(() => {
    queueMicrotask(() => void loadObservations());
  }, [loadObservations]);

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const seenCount = useMemo(
    () => observations.filter((item) => item.observation_type === "seen").length,
    [observations]
  );

  const securedCount = useMemo(
    () =>
      observations.filter((item) => item.observation_type === "secured").length,
    [observations]
  );

  const latestObservation = observations[0] || null;

  function openForm(type: ObservationType) {
    setObservationType(type);
    setObservationAt(localDateTimeValue());
    setFormOpen(true);
    setErrorMessage("");
  }

  function closeForm() {
    if (sending) return;
    setFormOpen(false);
    setErrorMessage("");
  }

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files || []);

    try {
      incoming.forEach((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(
            `Le fichier "${file.name}" n'est pas autorisé. Formats acceptés : JPG, PNG et WEBP.`
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Le fichier "${file.name}" dépasse 8 Mo.`);
        }
      });

      setPhotos((previous) => [...previous, ...incoming].slice(0, MAX_PHOTOS));
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Photo non autorisée."
      );
    }

    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((previous) => previous.filter((_, i) => i !== index));
  }

  function getPosition() {
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (error) => {
        console.error("Erreur GPS :", error);
        setErrorMessage("Impossible de récupérer votre position.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      }
    );
  }

  async function uploadPhotos(userId: string) {
    const urls: string[] = [];

    for (const file of photos) {
      const filePath = createFilePath(signalementId, userId, file);

      const { error: uploadError } = await supabase.storage
        .from("signalements")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("signalements")
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) urls.push(publicUrlData.publicUrl);
    }

    return urls;
  }

  async function submitObservation() {
    try {
      setSending(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Vous devez être connecté pour ajouter une observation."
        );
      }

      if (!observationAt) {
        throw new Error(
          "Merci d'indiquer la date et l'heure de l'observation."
        );
      }

      if (latitude === null || longitude === null) {
        throw new Error("Merci d'ajouter la position de l'observation.");
      }

      const photoUrls = await uploadPhotos(user.id);

      const { error: insertError } = await supabase
        .from("signalement_observations")
        .insert({
          signalement_id: signalementId,
          user_id: user.id,
          observation_type: observationType,
          observation_at: new Date(observationAt).toISOString(),
          latitude,
          longitude,
          animal_state: animalState || null,
          comment: comment.trim() || null,
          photo_urls: photoUrls,
          is_verified: false,
        });

      if (insertError) throw insertError;

      setFormOpen(false);
      setComment("");
      setAnimalState("");
      setLatitude(null);
      setLongitude(null);
      setPhotos([]);
      setObservationAt(localDateTimeValue());

      await loadObservations();

      alert(
        observationType === "secured"
          ? "Merci. La mise en sécurité de l'animal a été enregistrée."
          : "Merci. Votre observation a été ajoutée au signalement."
      );
    } catch (error: unknown) {
      console.error("Erreur ajout observation :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter l'observation."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-[30px] bg-white shadow">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                Communauté
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                Avez-vous vu cet animal ?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f5a47]">
                Chaque observation peut aider à retrouver l&apos;animal. Indiquez
                où et quand vous l&apos;avez vu, avec une photo si possible.
              </p>
            </div>

            <div className="rounded-[18px] bg-[#f8f4ec] px-4 py-3 text-center">
              <p className="text-xl font-black text-[#064b42]">{seenCount}</p>
              <p className="text-[11px] font-bold text-[#796d62]">
                observation{seenCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openForm("seen")}
              className="flex min-h-[72px] items-center justify-center gap-3 rounded-[22px] bg-[#064b42] px-5 py-4 font-black text-white shadow transition hover:opacity-90"
            >
              <Eye size={24} />
              Je l&apos;ai vu
            </button>

            <button
              type="button"
              onClick={() => openForm("secured")}
              className="flex min-h-[72px] items-center justify-center gap-3 rounded-[22px] bg-[#df8995] px-5 py-4 font-black text-white shadow transition hover:opacity-90"
            >
              <ShieldCheck size={24} />
              Je l&apos;ai mis en sécurité
            </button>
          </div>

          {securedCount > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-green-50 p-4 text-green-800">
              <CheckCircle2 size={22} />
              <p className="font-bold">
                {securedCount} indication{securedCount > 1 ? "s" : ""} de mise
                en sécurité
              </p>
            </div>
          )}
        </div>

        {latestObservation && (
          <div className="border-t border-[#eee4da] bg-[#fffaf5] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a98b73]">
              Dernière observation connue
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#064b42]">
              <span className="flex items-center gap-2">
                <Clock3 size={16} />
                {formatDate(latestObservation.observation_at)}
              </span>

              {typeof latestObservation.latitude === "number" &&
                typeof latestObservation.longitude === "number" && (
                  <a
                    href={`https://www.google.com/maps?q=${latestObservation.latitude},${latestObservation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline"
                  >
                    <MapPin size={16} />
                    Voir la dernière position
                  </a>
                )}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
        <h2 className="text-xl font-black text-[#064b42]">
          Historique des observations
        </h2>
        <p className="mt-1 text-sm text-[#6f5a47]">
          Les observations sont classées de la plus récente à la plus ancienne.
        </p>

        {loading ? (
          <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-5 text-center font-bold text-[#6f5a47]">
            Chargement...
          </div>
        ) : observations.length === 0 ? (
          <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-5 text-[#6f5a47]">
            Aucune observation pour le moment.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {observations.map((observation, index) => {
              const urls = Array.isArray(observation.photo_urls)
                ? observation.photo_urls
                : [];

              return (
                <article
                  key={observation.id}
                  className="rounded-[24px] border border-[#eadfce] bg-[#faf7f2] p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        observation.observation_type === "secured"
                          ? "bg-green-100 text-green-800"
                          : "bg-[#e8f2ef] text-[#064b42]"
                      }`}
                    >
                      {observation.observation_type === "secured"
                        ? "🐾 Mis en sécurité"
                        : "👀 Vu"}
                    </span>

                    {index === 0 && (
                      <span className="rounded-full bg-[#df8995] px-3 py-1 text-xs font-black text-white">
                        Dernière position
                      </span>
                    )}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        observation.is_verified
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {observation.is_verified ? "✓ Vérifié" : "Non vérifié"}
                    </span>
                  </div>

                  <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#064b42]">
                    <Clock3 size={16} />
                    {formatDate(observation.observation_at)}
                  </p>

                  {observation.animal_state && (
                    <p className="mt-3 text-sm font-semibold text-[#6f5a47]">
                      État constaté :{" "}
                      <strong className="text-[#064b42]">
                        {animalStateLabel(observation.animal_state)}
                      </strong>
                    </p>
                  )}

                  {observation.comment && (
                    <p className="mt-3 whitespace-pre-wrap leading-6 text-[#40372f]">
                      {observation.comment}
                    </p>
                  )}

                  {typeof observation.latitude === "number" &&
                    typeof observation.longitude === "number" && (
                      <a
                        href={`https://www.google.com/maps?q=${observation.latitude},${observation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow-sm"
                      >
                        <MapPin size={16} />
                        Voir cette position
                      </a>
                    )}

                  {urls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {urls.map((url, photoIndex) => (
                        <a
                          key={`${observation.id}-${photoIndex}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-[18px] bg-white"
                        >
                          <img
                            src={url}
                            alt="Photo de l'observation"
                            className="aspect-square h-full w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center sm:p-6">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[30px] bg-[#fbf7ef] shadow-2xl sm:max-w-2xl sm:rounded-[30px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadfce] bg-white p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                  Observation
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                  {observationType === "secured"
                    ? "Animal mis en sécurité"
                    : "Je l'ai vu"}
                </h2>
              </div>

              <button
                type="button"
                disabled={sending}
                onClick={closeForm}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5eee7] text-[#064b42]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label className="text-sm font-black text-[#064b42]">
                  Date et heure de l&apos;observation
                </label>
                <input
                  type="datetime-local"
                  value={observationAt}
                  onChange={(event) => setObservationAt(event.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-[#ded5cb] bg-white px-4 py-4 outline-none focus:border-[#df8995]"
                />
              </div>

              <div>
                <p className="text-sm font-black text-[#064b42]">Position</p>
                <button
                  type="button"
                  disabled={locating}
                  onClick={getPosition}
                  className="mt-2 flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#064b42] px-5 py-4 font-black text-white"
                >
                  <Crosshair size={20} />
                  {locating
                    ? "Localisation..."
                    : latitude !== null && longitude !== null
                      ? "Position enregistrée ✓"
                      : "Utiliser ma position actuelle"}
                </button>

                {latitude !== null && longitude !== null && (
                  <p className="mt-2 text-center text-xs font-bold text-[#6f5a47]">
                    📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-black text-[#064b42]">
                  État de l&apos;animal
                </label>
                <select
                  value={animalState}
                  onChange={(event) => setAnimalState(event.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-[#ded5cb] bg-white px-4 py-4 outline-none"
                >
                  {ANIMAL_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black text-[#064b42]">
                  Commentaire
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Exemple : aperçu devant la mairie, il partait en direction de Paea..."
                  className="mt-2 w-full resize-none rounded-[18px] border border-[#ded5cb] bg-white px-4 py-4 outline-none focus:border-[#df8995]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#064b42]">Photos</p>
                    <p className="mt-1 text-xs text-[#6f5a47]">
                      Jusqu&apos;à {MAX_PHOTOS} photos.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f4e6e8] px-4 py-2 text-sm font-black text-[#a84759]">
                    <ImagePlus size={18} />
                    Ajouter
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotos}
                      className="hidden"
                    />
                  </label>
                </div>

                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {previews.map((preview, index) => (
                      <div
                        key={preview}
                        className="relative overflow-hidden rounded-[18px] bg-white"
                      >
                        <img
                          src={preview}
                          alt="Aperçu"
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-[18px] bg-red-50 p-4 font-bold text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                disabled={sending}
                onClick={() => void submitObservation()}
                className="w-full rounded-[20px] bg-[#df8995] px-6 py-5 text-lg font-black text-white shadow-lg disabled:opacity-50"
              >
                {sending
                  ? "Envoi..."
                  : observationType === "secured"
                    ? "Confirmer la mise en sécurité"
                    : "Envoyer mon observation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
