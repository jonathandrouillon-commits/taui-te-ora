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
  Eye,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import {
  animalService,
} from "../../../services/animal.service";

import {
  photoService,
  type AnimalPhoto,
} from "../../../services/photo.service";

import AnimalTabs, {
  type TabKey,
} from "./AnimalTabs";

import GeneralTab from "./GeneralTab";
import PhotosTab from "./PhotosTab";
import HealthTab from "./HealthTab";
import CharacterTab from "./CharacterTab";
import StoryTab from "./StoryTab";
import LocationTab from "./LocationTab";
import AdoptionTab from "./AdoptionTab";
import PreviewTab from "./PreviewTab";

type EditableValue =
  | string
  | number
  | boolean
  | null
  | undefined;

type EditableAnimal = Record<
  string,
  EditableValue
>;

function normalizeEditableAnimal(
  source: unknown
): EditableAnimal {
  if (
    typeof source !== "object" ||
    source === null
  ) {
    return {};
  }

  const result: EditableAnimal = {};

  for (
    const [key, value] of Object.entries(
      source
    )
  ) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value === undefined
    ) {
      result[key] = value;
    }
  }

  return result;
}

function stringValue(
  value: EditableValue
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function numberValue(
  value: EditableValue
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const converted = Number(value);

  return Number.isFinite(converted)
    ? converted
    : null;
}

function errorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const possibleMessage = (
      error as {
        message?: unknown;
      }
    ).message;

    if (
      typeof possibleMessage ===
      "string"
    ) {
      return possibleMessage;
    }
  }

  return fallback;
}

function buildFacebookShareUrl(
  animalId: string
) {
  const publicAnimalUrl =
    `https://www.taui-te-ora.com/animal/${encodeURIComponent(
      animalId
    )}?adoption=1`;

  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(publicAnimalUrl)
  );
}

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id ?? "");

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabKey>("general");

  const [
    animal,
    setAnimal,
  ] = useState<EditableAnimal | null>(
    null
  );

  const [
    photos,
    setPhotos,
  ] = useState<AnimalPhoto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    showFacebookShare,
    setShowFacebookShare,
  ] = useState(false);

  const loadAnimal =
    useCallback(async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);

        const [
          animalData,
          photosData,
        ] = await Promise.all([
          animalService.getById(id),

          photoService.getByAnimalId(
            id
          ),
        ]);

        setAnimal(
          normalizeEditableAnimal(
            animalData
          )
        );

        setPhotos(
          photosData ?? []
        );
      } catch (error: unknown) {
        console.error(
          "Erreur chargement animal :",
          error
        );

        alert(
          errorMessage(
            error,
            "Impossible de charger l’animal."
          )
        );

        router.push(
          "/association/animals"
        );
      } finally {
        setLoading(false);
      }
    }, [id, router]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAnimal();
    });
  }, [loadAnimal]);

  function updateField(
    field: string,
    value:
      | string
      | number
      | boolean
  ) {
    setAnimal((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  }

  async function saveAnimal() {
    if (!animal || !id) {
      return;
    }

    try {
      setSaving(true);

      await animalService.update(
        id,
        {
          animal_name:
            stringValue(
              animal.animal_name
            ),

          animal_type:
            stringValue(
              animal.animal_type
            ),

          breed:
            stringValue(
              animal.breed
            ),

          sex:
            stringValue(
              animal.sex
            ),

          age_label:
            stringValue(
              animal.age_label
            ),

          size_label:
            stringValue(
              animal.size_label
            ),

          weight_kg:
            numberValue(
              animal.weight_kg
            ),

          island:
            stringValue(
              animal.island
            ),

          city:
            stringValue(
              animal.city
            ),

          map_address:
            stringValue(
              animal.map_address
            ),

          map_visibility:
            stringValue(
              animal.map_visibility
            ),

          description_character:
            stringValue(
              animal.description_character
            ),

          story:
            stringValue(
              animal.story
            ),

          capture_location:
            stringValue(
              animal.capture_location
            ),

          street_duration:
            stringValue(
              animal.street_duration
            ),

          health_status:
            stringValue(
              animal.health_status
            ),

          special_needs:
            stringValue(
              animal.special_needs
            ),

          vaccinated:
            Boolean(
              animal.vaccinated
            ),

          sterilized:
            Boolean(
              animal.sterilized
            ),

          microchipped:
            Boolean(
              animal.microchipped
            ),

          is_published:
            Boolean(
              animal.is_published
            ),
        }
      );

      alert("Animal sauvegardé.");

      await loadAnimal();
    } catch (error: unknown) {
      console.error(
        "Erreur sauvegarde animal :",
        error
      );

      alert(
        errorMessage(
          error,
          "Erreur lors de la sauvegarde."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnimal() {
    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Supprimer définitivement cet animal ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await animalService.delete(id);

      alert("Animal supprimé.");

      router.push(
        "/association/animals"
      );
    } catch (error: unknown) {
      console.error(
        "Erreur suppression animal :",
        error
      );

      alert(
        errorMessage(
          error,
          "Erreur lors de la suppression."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function relistForAdoption() {
    if (!animal || !id) {
      return;
    }

    const animalName =
      stringValue(
        animal.animal_name
      ) || "cet animal";

    const confirmed =
      window.confirm(
        `Remettre ${animalName} à l'adoption ? Sa fiche sera de nouveau visible et pourra recevoir de nouvelles demandes d'adoption.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await animalService.relistForAdoption(
        id
      );

      alert(
        `${animalName} est de nouveau disponible à l'adoption.`
      );

      await loadAnimal();
    } catch (error: unknown) {
      console.error(
        "Erreur remise à l'adoption :",
        error
      );

      alert(
        errorMessage(
          error,
          "Impossible de remettre cet animal à l'adoption."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished() {
    if (!animal || !id) {
      return;
    }

    try {
      setSaving(true);

      const nextValue =
        !Boolean(
          animal.is_published
        );

      await animalService.togglePublished(
        id,
        nextValue
      );

      setAnimal((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          is_published:
            nextValue,
        };
      });

      if (nextValue) {
        /*
         * Le changement false -> true
         * déclenche le webhook Supabase.
         *
         * TAUI publiera donc automatiquement
         * cette annonce sur Les Veilleurs de Kali.
         *
         * On demande ensuite uniquement
         * si le créateur veut également
         * partager sur son Facebook personnel.
         */
        setShowFacebookShare(true);
      } else {
        alert(
          "Animal passé en brouillon."
        );
      }
    } catch (error: unknown) {
      console.error(
        "Erreur publication animal :",
        error
      );

      alert(
        errorMessage(
          error,
          "Erreur lors du changement de statut."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function shareOnPersonalFacebook() {
    if (!id) {
      return;
    }

    const shareUrl =
      buildFacebookShareUrl(id);

    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setShowFacebookShare(false);
  }

  function closeFacebookShare() {
    setShowFacebookShare(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] text-[#064b42]">
        <p className="text-xl font-black">
          Chargement de
          l&apos;éditeur...
        </p>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] text-[#064b42]">
        <p className="text-xl font-black">
          Animal introuvable.
        </p>
      </main>
    );
  }

  const animalName =
    stringValue(
      animal.animal_name
    ) || "Animal sans nom";

  const isPublished =
    Boolean(
      animal.is_published
    );

  const isAdopted =
    Boolean(
      animal.is_adopted
    ) ||
    stringValue(
      animal.status
    ) === "adopted";

  return (
    <>
      <main className="min-h-screen bg-[#fbf7ef] p-6 text-[#064b42]">
        <section className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/association/animals"
                  )
                }
                className="mb-3 rounded-2xl bg-white px-4 py-2 font-bold shadow"
              >
                ← Retour aux animaux
              </button>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
                Édition animal
              </p>

              <h1 className="mt-2 text-4xl font-black">
                {animalName}
              </h1>

              <p className="mt-2 text-gray-500">
                {isAdopted
                  ? "Adopté"
                  : isPublished
                    ? "Publié"
                    : "Brouillon"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/animal/${id}`
                  )
                }
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black shadow"
              >
                <Eye size={18} />

                Voir
              </button>

              {isAdopted ? (
                <button
                  type="button"
                  onClick={
                    relistForAdoption
                  }
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-[#ef8196] px-5 py-3 font-black text-white shadow disabled:opacity-60"
                >
                  <RotateCcw
                    size={18}
                  />

                  {saving
                    ? "Traitement..."
                    : "Remettre à l'adoption"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    togglePublished
                  }
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 font-black text-white disabled:opacity-60 ${
                    isPublished
                      ? "bg-orange-600"
                      : "bg-green-700"
                  }`}
                >
                  {isPublished
                    ? "Dépublier"
                    : "Publier"}
                </button>
              )}

              <button
                type="button"
                onClick={
                  saveAnimal
                }
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-60"
              >
                <Save size={18} />

                {saving
                  ? "Sauvegarde..."
                  : "Sauvegarder"}
              </button>

              <button
                type="button"
                onClick={
                  deleteAnimal
                }
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-60"
              >
                <Trash2 size={18} />

                Supprimer
              </button>
            </div>
          </div>

          <AnimalTabs
            activeTab={activeTab}
            setActiveTab={
              setActiveTab
            }
          />

          <div className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
            {activeTab ===
              "general" && (
              <GeneralTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "photos" && (
              <PhotosTab
                animalId={id}
                photos={photos}
                setPhotos={
                  setPhotos
                }
              />
            )}

            {activeTab ===
              "health" && (
              <HealthTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "character" && (
              <CharacterTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "story" && (
              <StoryTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "location" && (
              <LocationTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "adoption" && (
              <AdoptionTab
                animal={animal}
                updateField={
                  updateField
                }
              />
            )}

            {activeTab ===
              "preview" && (
              <PreviewTab
                animal={animal}
                photos={photos}
              />
            )}
          </div>
        </section>
      </main>

      {showFacebookShare && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[30px] bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fcecef] text-3xl">
              🐾
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#064b42]">
              Animal publié !
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              <strong>
                {animalName}
              </strong>{" "}
              est maintenant publié sur
              TAUI TE ORA.
            </p>

            <div className="mt-4 rounded-2xl bg-[#f5f9f7] px-4 py-4 text-sm leading-6 text-[#064b42]">
              Son annonce sera
              automatiquement partagée
              sur la page Facebook{" "}
              <strong>
                Les Veilleurs de Kali
              </strong>
              .
            </div>

            <p className="mt-5 font-bold text-[#064b42]">
              Souhaitez-vous également
              partager cette annonce sur
              votre profil Facebook ?
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={
                  shareOnPersonalFacebook
                }
                className="rounded-2xl bg-[#1877f2] px-5 py-4 font-black text-white shadow-md"
              >
                Partager sur Facebook
              </button>

              <button
                type="button"
                onClick={
                  closeFacebookShare
                }
                className="rounded-2xl bg-gray-100 px-5 py-4 font-black text-[#064b42]"
              >
                Non merci
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}