"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../lib/supabase";

import LostFoundPushPreferences from "../components/LostFoundPushPreferences";

const MAX_FILES = 5;

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_FILE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const SAFE_EXTENSIONS: Record<
  string,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validateFile(
  file: File
) {
  if (
    !ALLOWED_FILE_TYPES.has(
      file.type
    )
  ) {
    throw new Error(
      `Le fichier "${file.name}" n'est pas autorisé. Formats acceptés : JPG, PNG et WEBP.`
    );
  }

  if (
    file.size <= 0
  ) {
    throw new Error(
      `Le fichier "${file.name}" est vide.`
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      `Le fichier "${file.name}" dépasse la taille maximale de 8 Mo.`
    );
  }
}

function buildSafeFilePath(
  signalementId: string,
  file: File
) {
  const extension =
    SAFE_EXTENSIONS[
      file.type
    ];

  if (
    !extension
  ) {
    throw new Error(
      "Type de fichier non autorisé."
    );
  }

  const randomId =
    typeof crypto !==
      "undefined" &&
    "randomUUID" in
      crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${signalementId}/${randomId}.${extension}`;
}

type LeafletModule =
  typeof import("leaflet");

type LeafletMap =
  import("leaflet").Map;

type LeafletMarker =
  import("leaflet").Marker;

type Companion = {
  id: string;
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
};

function getCompanionAgeLabel(birthDate: string | null) {
  if (!birthDate) {
    return "";
  }

  const birth = new Date(birthDate);
  const now = new Date();

  if (Number.isNaN(birth.getTime())) {
    return "";
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return `${years} an${years > 1 ? "s" : ""}`;
  }

  if (months > 0) {
    return `${months} mois`;
  }

  return "Moins d'un mois";
}

function companionSpeciesLabel(species: string) {
  const normalized = String(species || "")
    .trim()
    .toLowerCase();

  if (normalized === "chien") return "Chien";
  if (normalized === "chat") return "Chat";
  if (normalized === "oiseau") return "Oiseau";
  return "Autre";
}

function companionSexLabel(sex: string | null) {
  const normalized = String(sex || "")
    .trim()
    .toLowerCase();

  if (normalized === "male" || normalized === "mâle" || normalized === "male") {
    return "Mâle";
  }

  if (normalized === "female" || normalized === "femelle") {
    return "Femelle";
  }

  return "Inconnu";
}

function buildFacebookSignalementShareUrl(signalementId: string) {
  const publicUrl = `https://www.taui-te-ora.com/signalement/public/${encodeURIComponent(signalementId)}`;
  return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(publicUrl);
}

export default function SignalementPage() {
  const router =
    useRouter();

  const mapRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const leafletMap =
    useRef<LeafletMap | null>(
      null
    );

  const markerRef =
    useRef<LeafletMarker | null>(
      null
    );

  const leafletRef =
    useRef<LeafletModule | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    gpsLoading,
    setGpsLoading,
  ] =
    useState(false);

  const [
    files,
    setFiles,
  ] =
    useState<File[]>([]);

  const [
    tauiAnimalChoice,
    setTauiAnimalChoice,
  ] = useState<"" | "oui" | "non">("");

  const [
    companions,
    setCompanions,
  ] = useState<Companion[]>([]);

  const [
    companionsLoading,
    setCompanionsLoading,
  ] = useState(false);

  const [
    selectedCompanionId,
    setSelectedCompanionId,
  ] = useState("");

  const [
    form,
    setForm,
  ] =
    useState({
      type_signalement:
        "",

      animal_type:
        "",

      animal_name:
        "",

      sex: "",

      age_label:
        "",

      color: "",

      breed: "",

      collar_color: "",

      distinctive_features: "",

      identification_number: "",

      island: "",

      city: "",

      address: "",

      address_details:
        "",

      latitude: "",

      longitude:
        "",

      disappearance_date:
        "",

      disappearance_time:
        "",

      disappearance_time_unknown:
        false,

      found_date:
        "",

      found_time:
        "",

      found_time_unknown:
        false,

      situation: "",

      description:
        "",

      reporter_name:
        "",

      reporter_phone:
        "",

      reporter_email:
        "",

      anonymous:
        false,

      wants_contact:
        true,
    });

  useEffect(() => {
    let active = true;

    async function loadCompanions() {
      try {
        setCompanionsLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!active || !user) {
          if (active) {
            setCompanions([]);
          }
          return;
        }

        const { data, error } = await supabase
          .from("companions")
          .select(`
            id,
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
            sterilization_status
          `)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setCompanions((data || []) as Companion[]);
        }
      } catch (error) {
        console.error(
          "Erreur chargement Mes Compagnons dans le signalement :",
          error
        );

        if (active) {
          setCompanions([]);
        }
      } finally {
        if (active) {
          setCompanionsLoading(false);
        }
      }
    }

    void loadCompanions();

    return () => {
      active = false;
    };
  }, []);

  function selectTauiCompanion(companion: Companion) {
    setTauiAnimalChoice("oui");
    setSelectedCompanionId(companion.id);

    setForm((previous) => ({
      ...previous,
      type_signalement: "Animal perdu",
      animal_type: companionSpeciesLabel(companion.species),
      animal_name: companion.name || "",
      sex: companionSexLabel(companion.sex),
      age_label: getCompanionAgeLabel(companion.birth_date),
      color: companion.color || "",
      breed: companion.breed || "",
      identification_number: companion.identification_number || "",
      distinctive_features:
        previous.distinctive_features || companion.character || "",
      description:
        previous.description || companion.story || "",
    }));
  }

  function chooseNonTauiAnimal() {
    setTauiAnimalChoice("non");
    setSelectedCompanionId("");
  }

  const selectedCompanion =
    companions.find((item) => item.id === selectedCompanionId) || null;

  const updateField =
    useCallback(
      (
        name: string,
        value:
          | string
          | boolean
      ) => {
        setForm(
          (
            previous
          ) => ({
            ...previous,
            [name]:
              value,
          })
        );
      },
      []
    );

  const setPosition =
    useCallback(
      (
        lat: number,
        lng: number
      ) => {
        updateField(
          "latitude",
          String(lat)
        );

        updateField(
          "longitude",
          String(lng)
        );

        const L =
          leafletRef.current;

        const map =
          leafletMap.current;

        if (
          !L ||
          !map
        ) {
          return;
        }

        const icon =
          L.divIcon({
            className:
              "",

            html:
              '<div style="font-size:34px;">📍</div>',

            iconSize: [
              34,
              34,
            ],

            iconAnchor: [
              17,
              34,
            ],
          });

        if (
          !markerRef.current
        ) {
          const marker =
            L.marker(
              [
                lat,
                lng,
              ],
              {
                draggable:
                  true,

                icon,
              }
            ).addTo(
              map
            );

          markerRef.current =
            marker;

          marker.on(
            "dragend",
            () => {
              const pos =
                marker.getLatLng();

              updateField(
                "latitude",
                String(
                  pos.lat
                )
              );

              updateField(
                "longitude",
                String(
                  pos.lng
                )
              );
            }
          );
        } else {
          markerRef.current.setLatLng(
            [
              lat,
              lng,
            ]
          );
        }

        map.setView(
          [
            lat,
            lng,
          ],
          16
        );
      },
      [
        updateField,
      ]
    );

  useEffect(
    () => {
      let cancelled =
        false;

      async function initMap() {
        if (
          !mapRef.current ||
          leafletMap.current
        ) {
          return;
        }

        const L =
          await import(
            "leaflet"
          );

        if (
          cancelled ||
          !mapRef.current
        ) {
          return;
        }

        leafletRef.current =
          L;

        const map =
          L.map(
            mapRef.current
          ).setView(
            [
              -17.5516,
              -149.5585,
            ],
            10
          );

        leafletMap.current =
          map;

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              "© OpenStreetMap",
          }
        ).addTo(
          map
        );

        map.on(
          "click",
          (
            event:
              import(
                "leaflet"
              ).LeafletMouseEvent
          ) => {
            setPosition(
              event.latlng.lat,
              event.latlng.lng
            );
          }
        );
      }

      void initMap();

      return () => {
        cancelled =
          true;
      };
    },
    [
      setPosition,
    ]
  );

  function handleFilesChange(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      const selectedFiles =
        Array.from(
          event.target
            .files ||
            []
        );

      selectedFiles.forEach(
        validateFile
      );

      if (files.length + selectedFiles.length > MAX_FILES) {
        throw new Error(
          `Vous pouvez ajouter au maximum ${MAX_FILES} photos.`
        );
      }

      setFiles((previousFiles) => [
        ...previousFiles,
        ...selectedFiles,
      ]);

      event.target.value = "";
    } catch (
      caughtError
    ) {
      event.target.value =
        "";

      alert(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Fichier non autorisé."
      );
    }
  }

  function removeFile(indexToRemove: number) {
    setFiles((previousFiles) =>
      previousFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  function useMyLocation() {
    if (
      !navigator.geolocation
    ) {
      alert(
        "La géolocalisation n'est pas disponible."
      );

      return;
    }

    setGpsLoading(
      true
    );

    navigator.geolocation.getCurrentPosition(
      (
        position
      ) => {
        setPosition(
          position.coords
            .latitude,
          position.coords
            .longitude
        );

        setGpsLoading(
          false
        );
      },
      () => {
        alert(
          "Impossible de récupérer votre position."
        );

        setGpsLoading(
          false
        );
      }
    );
  }

  async function sendSignalement() {
    let facebookShareWindow: Window | null = null;

    try {
      setLoading(
        true
      );

      if (
        tauiAnimalChoice === "oui" &&
        !selectedCompanionId
      ) {
        alert(
          "Merci de sélectionner le compagnon Taui Te Ora concerné."
        );

        return;
      }

      if (
        !form.type_signalement ||
        !form.animal_type ||
        !form.island ||
        !form.city
      ) {
        alert(
          "Merci de remplir le type de signalement, l'animal, l'île et la commune."
        );

        return;
      }

      if (
        form.type_signalement ===
          "Animal perdu" &&
        !form.disappearance_date
      ) {
        alert(
          "Merci d'indiquer la date approximative de disparition."
        );

        return;
      }

      if (
        form.type_signalement ===
          "Animal trouvé" &&
        !form.found_date
      ) {
        alert(
          "Merci d'indiquer la date approximative de découverte."
        );

        return;
      }

      if (
        files.length >
        MAX_FILES
      ) {
        throw new Error(
          `Vous pouvez ajouter au maximum ${MAX_FILES} photos.`
        );
      }

      files.forEach(
        validateFile
      );

      // Ouvre la fenêtre immédiatement après le clic afin d'éviter
      // que le navigateur ne bloque le partage après les opérations async.
      facebookShareWindow = window.open(
        "",
        "taui-facebook-signalement-share",
        "popup=yes,width=760,height=820"
      );

      if (facebookShareWindow) {
        facebookShareWindow.document.write(
          `<html><body style="font-family:Arial,sans-serif;padding:40px;text-align:center;background:#f8f4ec;color:#064b42"><h2>Publication du signalement…</h2><p>Facebook va s'ouvrir automatiquement.</p></body></html>`
        );
      }

      const {
        data: {
          user,
        },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (authError) {
        console.error(
          "ERREUR AUTH SIGNALEMENT :",
          authError
        );

        throw new Error(
          `Session Supabase invalide : ${authError.message}`
        );
      }

      console.log(
        "USER SIGNALEMENT :",
        user?.id || null
      );

      const {
        data:
          signalement,
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .insert({
            user_id:
              user?.id ||
              null,

            companion_id:
              selectedCompanionId ||
              null,

            type_signalement:
              form.type_signalement,

            animal_type:
              form.animal_type,

            animal_name:
              form.animal_name,

            sex:
              form.sex,

            age_label:
              form.age_label,

            color:
              form.color,

            breed:
              form.breed,

            collar_color:
              form.collar_color.trim() || null,

            distinctive_features:
              form.distinctive_features.trim() || null,

            identification_number:
              form.identification_number.trim() || null,

            island:
              form.island,

            city:
              form.city,

            address:
              form.address,

            latitude:
              form.latitude
                ? Number(
                    form.latitude
                  )
                : null,

            longitude:
              form.longitude
                ? Number(
                    form.longitude
                  )
                : null,

            disappearance_at:
              form.type_signalement ===
                "Animal perdu" &&
              form.disappearance_date
                ? new Date(
                    `${form.disappearance_date}T${
                      form.disappearance_time_unknown ||
                      !form.disappearance_time
                        ? "12:00"
                        : form.disappearance_time
                    }:00`
                  ).toISOString()
                : null,

            found_at:
              form.type_signalement ===
                "Animal trouvé" &&
              form.found_date
                ? new Date(
                    `${form.found_date}T${
                      form.found_time_unknown ||
                      !form.found_time
                        ? "12:00"
                        : form.found_time
                    }:00`
                  ).toISOString()
                : null,

            situation:
              form.situation,

            description:
              `${form.description}\n\nPrécisions adresse : ${form.address_details}`,

            reporter_name:
              form.anonymous
                ? ""
                : form.reporter_name,

            reporter_phone:
              form.anonymous
                ? ""
                : form.reporter_phone,

            reporter_email:
              form.anonymous
                ? ""
                : form.reporter_email,

            anonymous:
              form.anonymous,

            wants_contact:
              form.wants_contact,

            status:
              "nouveau",
          })
          .select(
            "id"
          )
          .single();

      if (
        error
      ) {
        throw error;
      }

      if (
        files.length >
          0 &&
        signalement?.id
      ) {
        for (
          const file
          of files
        ) {
          validateFile(
            file
          );

          const filePath =
            buildSafeFilePath(
              signalement.id,
              file
            );

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "signalements"
              )
              .upload(
                filePath,
                file,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    file.type,
                }
              );

          if (
            uploadError
          ) {
            throw uploadError;
          }

          const {
            data:
              publicUrlData,
          } =
            supabase.storage
              .from(
                "signalements"
              )
              .getPublicUrl(
                filePath
              );

          const {
            error:
              mediaError,
          } =
            await supabase
              .from(
                "signalement_medias"
              )
              .insert({
                signalement_id:
                  signalement.id,

                file_url:
                  publicUrlData.publicUrl,

                file_type:
                  file.type,

                file_name:
                  file.name,
              });

          if (
            mediaError
          ) {
            throw mediaError;
          }
        }
      }

      /*
       * Matching automatique perdu <-> trouvé.
       * Une erreur de matching ne doit jamais annuler le signalement.
       */
      if (
        signalement?.id &&
        (
          form.type_signalement === "Animal perdu" ||
          form.type_signalement === "Animal trouvé"
        )
      ) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            throw new Error(
              "Session utilisateur introuvable pour le matching."
            );
          }

          const matchingResponse = await fetch(
            "/api/matching/signalement",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                signalementId: signalement.id,
              }),
            }
          );

          if (!matchingResponse.ok) {
            const matchingResult = await matchingResponse
              .json()
              .catch(() => null);

            console.error(
              "Matching signalement :",
              matchingResult
            );
          }
        } catch (matchingError) {
          console.error(
            "Matching signalement :",
            matchingError
          );
        }
      }

      /*
       * Notifications push :
       * uniquement pour
       * Animal perdu et
       * Animal trouvé.
       *
       * Une erreur de push
       * ne doit jamais
       * annuler le signalement.
       */
      if (
        signalement?.id &&
        (
          form.type_signalement ===
            "Animal perdu" ||
          form.type_signalement ===
            "Animal trouvé"
        )
      ) {
        try {
          const response =
            await fetch(
              "/api/push/signalement",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      signalementId:
                        signalement.id,
                    }
                  ),
              }
            );

          if (
            !response.ok
          ) {
            const result =
              await response
                .json()
                .catch(
                  () =>
                    null
                );

            console.error(
              "Notification signalement :",
              result
            );
          }
        } catch (
          pushError
        ) {
          console.error(
            "Notification signalement :",
            pushError
          );
        }
      }

      alert(
        "Signalement envoyé avec succès."
      );

      if (signalement?.id) {
        const facebookShareUrl = buildFacebookSignalementShareUrl(signalement.id);

        if (facebookShareWindow && !facebookShareWindow.closed) {
          facebookShareWindow.location.href = facebookShareUrl;
        } else {
          window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
        }
      }

      router.push(
        "/"
      );
    } catch (
      caughtError: unknown
    ) {
      if (facebookShareWindow && !facebookShareWindow.closed) {
        facebookShareWindow.close();
      }

      console.error(
        "ERREUR COMPLETE SIGNALEMENT :",
        caughtError
      );

      const errorDetails =
        caughtError &&
        typeof caughtError === "object"
          ? (caughtError as Record<string, unknown>)
          : {};

      const errorDescription =
        typeof errorDetails.error_description === "string"
          ? errorDetails.error_description
          : "";

      const details =
        typeof errorDetails.details === "string"
          ? errorDetails.details
          : "";

      const hint =
        typeof errorDetails.hint === "string"
          ? errorDetails.hint
          : "";

      const serializedError = (() => {
        if (typeof caughtError === "string") {
          return caughtError;
        }

        try {
          return JSON.stringify(caughtError);
        } catch {
          return "";
        }
      })();

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : errorDescription ||
            details ||
            hint ||
            serializedError;

      alert(
        message ||
          "Erreur lors de l'envoi."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-52 pt-20 md:pb-10 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
            🚨 Signaler un animal
          </h1>
        </div>

        <LostFoundPushPreferences />

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
              Taui Te Ora
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#064b42]">
              Cet animal est-il déjà enregistré sur Taui Te Ora ?
            </h2>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#6f5a47]">
              Si c&apos;est votre compagnon, sélectionnez-le : sa fiche sera chargée
              automatiquement et vous n&apos;aurez plus qu&apos;à renseigner les détails
              de sa disparition.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTauiAnimalChoice("oui")}
              className={`rounded-[22px] border-2 px-5 py-4 text-left transition ${
                tauiAnimalChoice === "oui"
                  ? "border-[#ef8998] bg-[#fff0f3]"
                  : "border-[#eadfce] bg-[#faf7f2]"
              }`}
            >
              <div className="text-2xl">🐾</div>
              <div className="mt-2 font-black text-[#064b42]">
                Oui, c&apos;est mon compagnon
              </div>
              <div className="mt-1 text-xs leading-5 text-[#756d67]">
                Charger sa fiche Mes Compagnons.
              </div>
            </button>

            <button
              type="button"
              onClick={chooseNonTauiAnimal}
              className={`rounded-[22px] border-2 px-5 py-4 text-left transition ${
                tauiAnimalChoice === "non"
                  ? "border-[#8db8aa] bg-[#eaf5f1]"
                  : "border-[#eadfce] bg-[#faf7f2]"
              }`}
            >
              <div className="text-2xl">📝</div>
              <div className="mt-2 font-black text-[#064b42]">
                Non, continuer normalement
              </div>
              <div className="mt-1 text-xs leading-5 text-[#756d67]">
                Remplir le signalement comme aujourd&apos;hui.
              </div>
            </button>
          </div>

          {tauiAnimalChoice === "oui" && (
            <div className="mt-6">
              {companionsLoading ? (
                <div className="rounded-[22px] bg-[#faf7f2] p-5 text-center font-bold text-[#064b42]">
                  Chargement de vos compagnons...
                </div>
              ) : companions.length === 0 ? (
                <div className="rounded-[22px] border border-[#eadfce] bg-[#faf7f2] p-5 text-center">
                  <p className="font-black text-[#064b42]">
                    Aucun compagnon enregistré.
                  </p>
                  <p className="mt-2 text-sm text-[#756d67]">
                    Ajoutez d&apos;abord votre animal dans Mes Compagnons ou choisissez
                    « Non » pour continuer normalement.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/mes-compagnons/ajouter")}
                    className="mt-4 rounded-full bg-[#064b42] px-5 py-3 text-sm font-black text-white"
                  >
                    + Ajouter un compagnon
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {companions.map((companion) => {
                    const selected = selectedCompanionId === companion.id;

                    return (
                      <button
                        key={companion.id}
                        type="button"
                        onClick={() => selectTauiCompanion(companion)}
                        className={`overflow-hidden rounded-[24px] border-2 bg-white text-left shadow-sm transition active:scale-[.99] ${
                          selected
                            ? "border-[#ef8998] ring-4 ring-[#fde7eb]"
                            : "border-[#eadfce]"
                        }`}
                      >
                        <div className="aspect-[4/3] bg-[#f4eee5]">
                          {companion.photo_url ? (
                            <img
                              src={companion.photo_url}
                              alt={companion.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-6xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-black text-[#064b42]">
                                {companion.name}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-[#756d67]">
                                {companionSpeciesLabel(companion.species)}
                                {companion.breed ? ` · ${companion.breed}` : ""}
                              </p>
                            </div>

                            {selected && (
                              <span className="rounded-full bg-[#ef8998] px-3 py-1 text-xs font-black text-white">
                                Sélectionné
                              </span>
                            )}
                          </div>

                          {companion.identification_number && (
                            <p className="mt-3 text-xs font-bold text-[#6f5a47]">
                              Identification : {companion.identification_number}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedCompanion && (
            <div className="mt-6 rounded-[24px] border border-[#d5ebe4] bg-[#eaf5f1] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {selectedCompanion.photo_url && (
                  <img
                    src={selectedCompanion.photo_url}
                    alt={selectedCompanion.name}
                    className="h-24 w-24 rounded-[20px] object-cover shadow"
                  />
                )}

                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5e8f80]">
                    Fiche Taui Te Ora chargée
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-[#064b42]">
                    {selectedCompanion.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#5f6f68]">
                    Ses informations d&apos;identité ont été préremplies. Complétez
                    maintenant la localisation, la date, l&apos;heure et les circonstances
                    de la disparition.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/mes-compagnons")}
                  className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
                >
                  Mes Compagnons
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            Informations générales
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Type de signalement"
              value={
                form.type_signalement
              }
              onChange={(
                value
              ) =>
                updateField(
                  "type_signalement",
                  value
                )
              }
              options={[
                "Animal errant",
                "Animal perdu",
                "Animal trouvé",
                "Animal blessé",
                "Animal maltraité",
                "Animal décédé",
                "Autre",
              ]}
            />

            <Select
              label="Type d'animal"
              value={
                form.animal_type
              }
              onChange={(
                value
              ) =>
                updateField(
                  "animal_type",
                  value
                )
              }
              options={[
                "Chien",
                "Chat",
                "Oiseau",
                "Autre",
              ]}
            />

            <Input
              label="Nom si connu"
              value={
                form.animal_name
              }
              onChange={(
                value
              ) =>
                updateField(
                  "animal_name",
                  value
                )
              }
            />

            <Select
              label="Sexe"
              value={
                form.sex
              }
              onChange={(
                value
              ) =>
                updateField(
                  "sex",
                  value
                )
              }
              options={[
                "Inconnu",
                "Mâle",
                "Femelle",
              ]}
            />

            <Input
              label="Âge estimé"
              value={
                form.age_label
              }
              onChange={(
                value
              ) =>
                updateField(
                  "age_label",
                  value
                )
              }
            />

            <Input
              label="Couleur"
              value={
                form.color
              }
              onChange={(
                value
              ) =>
                updateField(
                  "color",
                  value
                )
              }
            />

            <Input
              label="Race"
              value={
                form.breed
              }
              onChange={(
                value
              ) =>
                updateField(
                  "breed",
                  value
                )
              }
            />

            {(form.type_signalement === "Animal perdu" ||
              form.type_signalement === "Animal trouvé") && (
              <>
                <Input
                  label="Couleur du collier"
                  value={form.collar_color}
                  onChange={(value) => updateField("collar_color", value)}
                />

                <Input
                  label="Numéro d'identification (puce ou tatouage)"
                  value={form.identification_number}
                  onChange={(value) => updateField("identification_number", value)}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="Signes particuliers"
                    value={form.distinctive_features}
                    onChange={(value) => updateField("distinctive_features", value)}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-black text-[#064b42]">
              📍 Localisation
            </h2>

            <button
              type="button"
              onClick={
                useMyLocation
              }
              disabled={
                gpsLoading
              }
              className="rounded-full bg-[#064b42] px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {gpsLoading
                ? "Localisation..."
                : "📍 Utiliser ma position"}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <Input
                label="Île"
                value={
                  form.island
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "island",
                    value
                  )
                }
              />

              <Input
                label="Commune"
                value={
                  form.city
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "city",
                    value
                  )
                }
              />

              <Input
                label="Adresse ou repère"
                value={
                  form.address
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "address",
                    value
                  )
                }
              />

              <Textarea
                label="Informations complémentaires"
                value={
                  form.address_details
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "address_details",
                    value
                  )
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Latitude"
                  value={
                    form.latitude
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "latitude",
                      value
                    )
                  }
                />

                <Input
                  label="Longitude"
                  value={
                    form.longitude
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "longitude",
                      value
                    )
                  }
                />
              </div>
            </div>

            <div
              ref={
                mapRef
              }
              className="h-[420px] overflow-hidden rounded-[28px] border shadow sm:h-[500px]"
            />
          </div>
        </section>

        {form.type_signalement ===
          "Animal perdu" && (
          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-black text-[#064b42]">
              🔎 Disparition
            </h2>

            <p className="mb-6 text-sm text-[#6f5a47]">
              Indiquez le moment où
              l&apos;animal a été vu
              pour la dernière fois.
              Une heure approximative
              suffit.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">
                  Date de disparition
                </label>

                <input
                  type="date"
                  value={
                    form.disappearance_date
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "disappearance_date",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-[#064b42]">
                  Heure approximative
                </label>

                <input
                  type="time"
                  value={
                    form.disappearance_time
                  }
                  disabled={
                    form.disappearance_time_unknown
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "disappearance_time",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 disabled:opacity-50"
                />
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 font-semibold text-[#064b42]">
              <input
                type="checkbox"
                checked={
                  form.disappearance_time_unknown
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "disappearance_time_unknown",
                    event.target
                      .checked
                  )
                }
              />

              Heure inconnue
            </label>

            <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-4 text-sm text-[#6f5a47]">
              Le point GPS placé sur
              la carte ci-dessus
              correspond au{" "}
              <strong>
                dernier lieu connu de
                disparition
              </strong>
              .
            </div>
          </section>
        )}

        {form.type_signalement ===
          "Animal trouvé" && (
          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-black text-[#064b42]">
              📍 Découverte de
              l&apos;animal
            </h2>

            <p className="mb-6 text-sm text-[#6f5a47]">
              Indiquez le moment où
              l&apos;animal a été
              découvert. Une heure
              approximative suffit.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">
                  Date de découverte
                </label>

                <input
                  type="date"
                  value={
                    form.found_date
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "found_date",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-[#064b42]">
                  Heure approximative
                </label>

                <input
                  type="time"
                  value={
                    form.found_time
                  }
                  disabled={
                    form.found_time_unknown
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "found_time",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 disabled:opacity-50"
                />
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 font-semibold text-[#064b42]">
              <input
                type="checkbox"
                checked={
                  form.found_time_unknown
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "found_time_unknown",
                    event.target
                      .checked
                  )
                }
              />

              Heure inconnue
            </label>

            <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-4 text-sm text-[#6f5a47]">
              Le point GPS placé sur
              la carte ci-dessus sera
              utilisé comme{" "}
              <strong>
                lieu de découverte de
                l&apos;animal
              </strong>
              .
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            État de l&apos;animal
          </h2>

          <Textarea
            label="Situation"
            value={
              form.situation
            }
            onChange={(
              value
            ) =>
              updateField(
                "situation",
                value
              )
            }
          />

          <div className="mt-5">
            <Textarea
              label="Description complète"
              value={
                form.description
              }
              onChange={(
                value
              ) =>
                updateField(
                  "description",
                  value
                )
              }
            />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            📷 Photos
          </h2>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFilesChange
            }
            className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
          />

          <p className="mt-3 text-sm text-gray-500">
            Vous pouvez ajouter
            jusqu&apos;à 5 photos
            (JPG, PNG ou WEBP), 8 Mo
            maximum par photo, pour
            aider à identifier
            l&apos;animal.
          </p>

          {files.length >
            0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {files.map(
                (
                  file,
                  index
                ) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#faf7f2]"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Aperçu ${index + 1}`}
                      className="h-48 w-full object-cover"
                    />

                    <div className="p-4">
                      <p className="break-all text-sm font-semibold text-[#064b42]">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} Mo
                      </p>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={loading}
                        className="mt-3 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            Vos coordonnées
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Nom"
              value={
                form.reporter_name
              }
              disabled={
                form.anonymous
              }
              onChange={(
                value
              ) =>
                updateField(
                  "reporter_name",
                  value
                )
              }
            />

            <Input
              label="Téléphone"
              value={
                form.reporter_phone
              }
              disabled={
                form.anonymous
              }
              onChange={(
                value
              ) =>
                updateField(
                  "reporter_phone",
                  value
                )
              }
            />

            <Input
              label="Email"
              value={
                form.reporter_email
              }
              disabled={
                form.anonymous
              }
              onChange={(
                value
              ) =>
                updateField(
                  "reporter_email",
                  value
                )
              }
            />
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex gap-3 font-semibold">
              <input
                type="checkbox"
                checked={
                  form.wants_contact
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "wants_contact",
                    event.target
                      .checked
                  )
                }
              />

              Je souhaite être
              recontacté
            </label>

            <label className="flex gap-3 font-semibold">
              <input
                type="checkbox"
                checked={
                  form.anonymous
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "anonymous",
                    event.target
                      .checked
                  )
                }
              />

              Je souhaite rester
              anonyme
            </label>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={
              sendSignalement
            }
            disabled={
              loading
            }
            className="rounded-full bg-red-600 px-8 py-4 text-lg font-black text-white disabled:opacity-60"
          >
            {loading
              ? "Envoi..."
              : "🚨 Envoyer le signalement"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/"
              )
            }
            disabled={
              loading
            }
            className="rounded-full bg-white px-8 py-4 font-bold text-[#064b42] shadow disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </div>
    </main>
  );
}

type InputProps = {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  disabled?: boolean;
};

function Input({
  label,
  value,
  onChange,
  disabled = false,
}: InputProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <input
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

type SelectProps = {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  options: string[];
};

function Select({
  label,
  value,
  onChange,
  options,
}: SelectProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      >
        <option value="">
          Sélectionner
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {
                option
              }
            </option>
          )
        )}
      </select>
    </div>
  );
}

type TextareaProps = {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;
};

function Textarea({
  label,
  value,
  onChange,
}: TextareaProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <textarea
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        rows={
          5
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      />
    </div>
  );
}
