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
type Animal,
} from "../../services/animal.service";

import {
  compatibilityService,
} from "../../services/compatibility.service";

import {
  supabase,
} from "../../lib/supabase";

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

type QuestionnaireData = {
  proprietaire_animal: string;
  animal_actuel: string;
  adoption_pour: string;
  enfants: string;
  jardin: string;
  age_souhaite: string;
  sexe_souhaite: string;
  taille_souhaitee: string;
  activite_souhaitee: string;
  hypoallergenique: string;
  proprete: string;
  besoins_speciaux: string;
  race_souhaitee: string;
};

type MatchResult = ReturnType<
  typeof compatibilityService.calculate
>;
type AnimalPhoto = {
  id?: string;
  photo_url?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
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
    useState<Animal | null>(
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

  const [
    adoptionMode,
    setAdoptionMode,
  ] = useState(false);

  const [
    matchLoading,
    setMatchLoading,
  ] = useState(false);

  const [
    matchResult,
    setMatchResult,
  ] = useState<MatchResult | null>(
    null
  );

  const [
    matchError,
    setMatchError,
  ] = useState("");

  const [
    likesCount,
    setLikesCount,
  ] = useState(0);

  const loadLikesCount = useCallback(async () => {
    const {
      count,
      error,
    } = await supabase
      .from("favorites")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("animal_id", id);

    if (error) {
      console.error(
        "Erreur compteur coups de coeur :",
        error
      );

      return;
    }

    setLikesCount(
      count || 0
    );
  }, [id]);

  const loadAnimal = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      /*
       * On charge la fiche animal et les vid├®os
       * ind├®pendamment.
       *
       * Ainsi, une erreur vid├®o ne bloque pas
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
          "Erreur chargement vid├®os :",
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
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAnimal();
      void loadLikesCount();
    });

    const channel = supabase
      .channel(`animal-page-favorites-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `animal_id=eq.${id}`,
        },
        () => {
          void loadLikesCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [id, loadAnimal, loadLikesCount]);

  const loadCompatibility =
    useCallback(async () => {
      if (!animal) return;

      try {
        setMatchLoading(true);
        setMatchError("");

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace(
            "/login?redirect=" +
              encodeURIComponent(
                `/adoption/start/${id}`
              )
          );
          return;
        }

        const access =
          await animalService.getCurrentUserAccess();

        if (
          access.role !==
          "adoptant"
        ) {
          throw new Error(
            "La demande d'adoption doit ├¬tre effectu├®e avec un compte Adoptant."
          );
        }

        if (!access.isActive) {
          throw new Error(
            "Votre compte est actuellement d├®sactiv├®."
          );
        }

        if (
          access.approvalStatus ===
            "rejected" ||
          access.approvalStatus ===
            "suspended"
        ) {
          throw new Error(
            "Votre compte ne permet pas actuellement d'effectuer une demande d'adoption."
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            `
              adopter_experience,
              current_animals,
              adoption_for,
              children_age,
              garden_type,
              ideal_age,
              ideal_sex,
              ideal_size,
              ideal_activity,
              ideal_breed,
              hypoallergenic,
              cleanliness,
              special_needs
            `
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (
          !data ||
          !data.adopter_experience ||
          !data.garden_type ||
          !data.ideal_age ||
          !data.ideal_sex ||
          !data.ideal_size ||
          !data.ideal_activity
        ) {
          router.replace(
            "/adoptant/questionnaire?redirect=" +
              encodeURIComponent(
                `/adoption/start/${id}`
              )
          );
          return;
        }

        const questionnaire: QuestionnaireData = {
          proprietaire_animal:
            data.adopter_experience ||
            "",
          animal_actuel:
            data.current_animals ||
            "Aucun",
          adoption_pour:
            data.adoption_for ||
            "Moi / Ma famille",
          enfants:
            data.children_age ||
            "Non",
          jardin:
            data.garden_type ||
            "Pas de jardin",
          age_souhaite:
            data.ideal_age || "",
          sexe_souhaite:
            data.ideal_sex || "",
          taille_souhaitee:
            data.ideal_size || "",
          activite_souhaitee:
            data.ideal_activity ||
            "Pas de pr├®f├®rence",
          hypoallergenique:
            data.hypoallergenic ||
            "Pas de pr├®f├®rence",
          proprete:
            data.cleanliness ||
            "Pas de pr├®f├®rence",
          besoins_speciaux:
            data.special_needs ||
            "Non",
          race_souhaitee:
            data.ideal_breed || "",
        };

        setMatchResult(
          compatibilityService.calculate(
            questionnaire,
            animal
          )
        );
      } catch (error: unknown) {
        console.error(
          "Erreur calcul compatibilit├® :",
          error
        );

        setMatchError(
          error instanceof Error
            ? error.message
            : "Impossible de calculer la compatibilit├®."
        );
      } finally {
        setMatchLoading(false);
      }
    }, [animal, id, router]);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const shouldShowAdoption =
      new URLSearchParams(
        window.location.search
      ).get("adoption") === "1";

    const timeoutId =
      window.setTimeout(
        () => {
          setAdoptionMode(
            shouldShowAdoption
          );

          if (
            shouldShowAdoption &&
            animal
          ) {
            void loadCompatibility();
          }
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [animal, loadCompatibility]);

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
    animal.owner_id ||
    animal.created_by ||
    "";

  const statut =
    animal.is_published
      ? "├Ç adopter"
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
            a: AnimalPhoto, b: AnimalPhoto
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
              likesCount={
                likesCount
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

            {adoptionMode && (
              <section className="mt-5 rounded-[28px] border-2 border-[#df8995] bg-[#fff8f8] p-5 shadow-lg">
                <h2 className="text-center text-2xl font-black text-[#064b42]">
                  Votre compatibilit├® avec {name}
                </h2>

                {matchLoading && (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />
                    <p className="mt-4 font-bold">
                      Calcul de votre compatibilit├®...
                    </p>
                  </div>
                )}

                {!matchLoading &&
                  matchError && (
                    <div className="mt-5 rounded-2xl bg-red-50 p-4 text-center font-bold text-red-700">
                      {matchError}
                    </div>
                  )}

                {!matchLoading &&
                  matchResult && (
                    <>
                      <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[#064b42] text-white shadow-xl">
                        <div className="text-center">
                          <div className="text-4xl font-black">
                            {Math.round(
                              matchResult.score
                            )}
                            %
                          </div>
                          <div className="mt-1 text-xs font-bold uppercase tracking-wide text-white/80">
                            compatibilit├®
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-center text-lg font-black text-[#df8995]">
                        {matchResult.level}
                      </p>

                      <p className="mt-3 text-center text-sm leading-6 text-gray-600">
                        Ce taux est indicatif. LÔÇÖassociation reste la mieux plac├®e pour confirmer si votre foyer correspond aux besoins de {name}.
                      </p>

                      <div className="mt-6 rounded-2xl bg-white p-4 text-center shadow-sm">
                        <p className="font-black text-[#064b42]">
                          Souhaitez-vous confirmer votre int├®r├¬t et entrer en contact avec {association || "lÔÇÖassociation"} ?
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdoptionMode(
                              false
                            );
                            router.replace(
                              `/animal/${id}`
                            );
                          }}
                          className="rounded-full bg-gray-100 px-5 py-4 font-black text-gray-700"
                        >
                          Pas maintenant
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/adoption/start/${id}?confirm=1`
                            )
                          }
                          className="rounded-full bg-[#df8995] px-5 py-4 font-black text-white shadow-lg transition hover:bg-[#cf7481]"
                        >
                          Confirmer et contacter
                        </button>
                      </div>
                    </>
                  )}
              </section>
            )}
          </div>
        </section>

        {/* =====================================================
            VIDEO
            Rien n'est affich├® si aucune vid├®o n'existe.
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
                  En vid├®o
                </h2>

                <p className="text-sm text-gray-500">
                  D├®couvrez{" "}
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
                      Votre navigateur ne permet pas la lecture de cette vid├®o.
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
