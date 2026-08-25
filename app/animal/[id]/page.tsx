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
  Video,
} from "lucide-react";

import AnimalActions from "../../components/animal/AnimalActions";
import AnimalGallery from "../../components/animal/AnimalGallery";
import AnimalHeader from "../../components/animal/AnimalHeader";
import AnimalHistory from "../../components/animal/AnimalHistory";
import AnimalHealth from "../../components/animal/AnimalHealth";
import AnimalCompatibility from "../../components/animal/AnimalCompatibility";

import {
  animalService,
} from "../../services/animal.service";

import {
  videoService,
} from "../../services/video.service";

type AnimalVideo = {
  id: string;
  animal_id: string;
  video_url: string;
  sort_order: number;
  created_at?: string;
};

export default function AnimalPublicPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const id =
    String(params.id);

  const [
    animal,
    setAnimal,
  ] =
    useState<any | null>(
      null
    );

  const [
    videos,
    setVideos,
  ] =
    useState<AnimalVideo[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  useEffect(() => {
    void loadAnimal();
  }, [id]);

  async function loadAnimal() {
    try {
      setLoading(true);
      setErrorMessage("");

      /*
       * On charge la fiche animal et les vidéos
       * indépendamment.
       *
       * Ainsi, une erreur vidéo ne bloque pas
       * l'affichage de la fiche.
       */

      const data =
        await animalService.getById(
          id
        );

      setAnimal(data);

      try {
        const videoData =
          await videoService.getByAnimal(
            id
          );

        setVideos(
          (videoData ||
            []) as AnimalVideo[]
        );
      } catch (
        videoError
      ) {
        console.error(
          "Erreur chargement vidéos :",
          videoError
        );

        setVideos([]);
      }
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErrorMessage(
        "Animal introuvable ou erreur de chargement."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">
          Chargement de la fiche animal...
        </p>
      </main>
    );
  }

  /* =========================================================
     ERREUR
  ========================================================= */

  if (
    errorMessage ||
    !animal
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] px-4 text-[#064b42]">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black">
            Fiche introuvable
          </h1>

          <p className="mt-3 text-gray-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-6 rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white"
          >
            Retour
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     INFORMATIONS
  ========================================================= */

  const name =
    animal.animal_name ||
    animal.nom ||
    "Animal";

  const type =
    animal.animal_type ||
    animal.type ||
    "";

  const sexe =
    animal.sex ||
    animal.sexe ||
    "";

  const age =
    animal.age_label ||
    animal.age ||
    "";

  const race =
    animal.breed ||
    animal.race ||
    "";

  const taille =
    animal.size_label ||
    animal.taille ||
    "";

  const poids =
    animal.weight_kg
      ? `${animal.weight_kg} kg`
      : animal.poids ||
        "";

  const ile =
    animal.island ||
    animal.ile ||
    "";

  const localisation =
    animal.city ||
    animal.localisation ||
    "";

  const association =
    animal.owner_profile
      ?.organization_name ||
    animal.association_name ||
    animal.association_id ||
    "";

  const ownerProfileId =
    animal.owner_profile?.id ||
    animal.profile_id ||
    animal.created_by ||
    animal.user_id ||
    "";

  const statut =
    animal.is_published
      ? "À adopter"
      : "Brouillon";

  /* =========================================================
     PHOTOS
  ========================================================= */

  const photos =
    animal.animal_photos &&
    animal.animal_photos.length >
      0
      ? [
          ...animal.animal_photos,
        ].sort(
          (
            a: any,
            b: any
          ) => {
            if (
              a.is_cover
            ) {
              return -1;
            }

            if (
              b.is_cover
            ) {
              return 1;
            }

            return (
              (a.sort_order ??
                0) -
              (b.sort_order ??
                0)
            );
          }
        )
      : animal.photo_url
        ? [
            {
              id: "main",

              photo_url:
                animal.photo_url,

              is_cover:
                true,
            },
          ]
        : [];

  /* =========================================================
     VIDEOS
  ========================================================= */

  const sortedVideos =
    [...videos].sort(
      (a, b) =>
        (a.sort_order ??
          0) -
        (b.sort_order ??
          0)
    );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-6 text-[#064b42]">
      <div className="mx-auto max-w-6xl">

        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 rounded-xl bg-white px-4 py-2 font-bold shadow"
        >
          ← Retour
        </button>

        {/* =====================================================
            GALERIE + INFORMATIONS
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <AnimalGallery
            photos={
              photos
            }
            name={
              name
            }
          />

          <div>
            <AnimalHeader
              nom={
                name
              }
              statut={
                statut
              }
              type={
                type
              }
              sexe={
                sexe
              }
              age={
                age
              }
              race={
                race
              }
              taille={
                taille
              }
              poids={
                poids
              }
              ile={
                ile
              }
              localisation={
                localisation
              }
              association={
                association
              }
            />

            <AnimalActions
              animalId={
                animal.id
              }
              animalName={
                name
              }
              ownerProfileId={
                ownerProfileId
              }
            />
          </div>
        </section>

        {/* =====================================================
            VIDEO
            Rien n'est affiché si aucune vidéo n'existe.
        ====================================================== */}

        {sortedVideos.length >
          0 && (
          <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow">
            <div className="flex items-center gap-3 border-b border-[#eee4d5] px-6 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f2]">
                <Video
                  size={
                    22
                  }
                  className="text-[#df8995]"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#064b42]">
                  En vidéo
                </h2>

                <p className="text-sm text-gray-500">
                  Découvrez{" "}
                  {name}{" "}
                  en mouvement
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {sortedVideos.map(
                (
                  video
                ) => (
                  <div
                    key={
                      video.id
                    }
                    className="overflow-hidden rounded-2xl bg-black"
                  >
                    <video
                      src={
                        video.video_url
                      }
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-[650px] w-full object-contain"
                    >
                      Votre navigateur ne permet pas la lecture de cette vidéo.
                    </video>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            INFORMATIONS COMPLEMENTAIRES
        ====================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <AnimalHistory
            histoire={
              animal.story ||
              animal.histoire ||
              ""
            }
            lieuCapture={
              animal.capture_location ||
              animal.lieu_capture ||
              ""
            }
            tempsRue={
              animal.street_duration ||
              animal.temps_rue ||
              ""
            }
          />

          <AnimalHealth
            sterilise={
              animal.sterilized ??
              animal.sterilise ??
              false
            }
            vaccine={
              animal.vaccinated ??
              animal.vaccine ??
              false
            }
            identifie={
              animal.microchipped ??
              animal.identifie ??
              false
            }
            sante={
              animal.health_status ||
              animal.sante ||
              ""
            }
          />

          <AnimalCompatibility
            compatibleChiens={
              animal.compatible_chiens ||
              null
            }
            compatibleChats={
              animal.compatible_chats ||
              null
            }
            compatibleEnfants={
              animal.compatible_enfants ||
              null
            }
          />
        </section>
      </div>
    </main>
  );
}