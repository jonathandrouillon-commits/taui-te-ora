"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type Profile = {
  id: string;

  role?: string | null;

  first_name?: string | null;
  last_name?: string | null;

  birth_date?: string | null;

  phone?: string | null;
  email?: string | null;

  avatar_url?: string | null;

  island?: string | null;
  city?: string | null;

  address?: string | null;
  postal_code?: string | null;
};

type AdoptionQuestionnaire = {
  id?: string;

  user_id?: string | null;
  animal_id?: string | null;

  proprietaire_animal?: string | null;

  animal_actuel?: string | null;
  adoption_pour?: string | null;

  enfants?: string | null;
  jardin?: string | null;

  age_souhaite?: string | null;
  sexe_souhaite?: string | null;
  taille_souhaitee?: string | null;
  activite_souhaitee?: string | null;

  hypoallergenique?: string | null;
  proprete?: string | null;

  besoins_speciaux?: string | null;
  race_souhaitee?: string | null;

  animaux_chiens_count?: number | null;
  animaux_chats_count?: number | null;
  animaux_autres_count?: number | null;

  enfants_moins_8_count?: number | null;
  enfants_8_14_count?: number | null;
  enfants_15_plus_count?: number | null;

  type_logement?: string | null;
  temps_seul?: string | null;
  rythme_vie?: string | null;

  age_recherche?: string | null;
  taille_recherche?: string | null;
  sexe_recherche?: string | null;

  accepte_handicap?: boolean | null;
  accepte_traitement?: boolean | null;
  accepte_craintif?: boolean | null;
  accepte_education?: boolean | null;
  accepte_accompagnement_discussion?: boolean | null;

  lieu_vie_animal?: string | null;
  accompagne_regulierement?: string | null;
  place_dans_quotidien?: string | null;
  temps_adaptation?: string | null;
  gestion_difficulte?: string | null;

  preference_libre?: string | null;

  updated_at?: string | null;
  created_at?: string | null;
};

type AdoptionRequest = {
  id: string;

  owner_id?: string | null;
  requester_id?: string | null;
  animal_id?: string | null;

  status?: string | null;

  match_score?: number | null;
  match_level?: string | null;

  created_at?: string | null;
};

type AnimalPhoto = {
  id?: string;

  photo_url?: string | null;
  is_cover?: boolean | null;

  sort_order?: number | null;
};

type Animal = {
  id: string;

  animal_name?: string | null;
  animal_type?: string | null;
  age_label?: string | null;

  animal_photos?: AnimalPhoto[] | null;
};

const ALLOWED_ROLES =
  new Set([
    "association",
    "refuge",
    "fourriere",
    "benevole",
    "admin",
  ]);

/* =========================================================
   PAGE
========================================================= */

export default function AdoptantPublicProfilePage() {
  const router =
    useRouter();

  const params =
    useParams();

  const searchParams =
    useSearchParams();

  const adoptantId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : String(
          params.id ||
            ""
        );

  const requestId =
    searchParams.get(
      "request"
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
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    questionnaire,
    setQuestionnaire,
  ] =
    useState<AdoptionQuestionnaire | null>(
      null
    );

  const [
    request,
    setRequest,
  ] =
    useState<AdoptionRequest | null>(
      null
    );

  const [
    animal,
    setAnimal,
  ] =
    useState<Animal | null>(
      null
    );

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      setErrorMessage(
        ""
      );

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
              `/adoptant/${adoptantId}${
                requestId
                  ? `?request=${requestId}`
                  : ""
              }`
            )
        );

        return;
      }

      /* ---------------------------------------------------
         PROFIL DU VISITEUR
      --------------------------------------------------- */

      const {
        data:
          viewer,
        error:
          viewerError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id, role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        viewerError
      ) {
        throw viewerError;
      }

      const viewerRole =
        String(
          viewer?.role ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        !ALLOWED_ROLES.has(
          viewerRole
        )
      ) {
        throw new Error(
          "Vous n'�tes pas autoris� � consulter ce profil adoptant."
        );
      }

      /* ---------------------------------------------------
         V�RIFIER QUE CET ADOPTANT A BIEN FAIT
         UNE DEMANDE POUR UN ANIMAL DU COMPTE
      --------------------------------------------------- */

      let requestQuery =
        supabase
          .from(
            "adoption_requests"
          )
          .select(
            `
              id,
              created_at,
              owner_id,
              requester_id,
              animal_id,
              status,
              match_score,
              match_level
            `
          )
          .eq(
            "requester_id",
            adoptantId
          );

      if (
        requestId
      ) {
        requestQuery =
          requestQuery.eq(
            "id",
            requestId
          );
      }

      if (
        viewerRole !==
        "admin"
      ) {
        requestQuery =
          requestQuery.eq(
            "owner_id",
            user.id
          );
      }

      const {
        data:
          requestData,
        error:
          requestError,
      } =
        await requestQuery
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        requestError
      ) {
        throw requestError;
      }

      if (
        !requestData
      ) {
        throw new Error(
          "Ce profil n'est accessible que lorsqu'une demande d'adoption concerne l'un de vos animaux."
        );
      }

      setRequest(
        requestData as AdoptionRequest
      );

      /* ---------------------------------------------------
         PROFIL PERSONNEL
      --------------------------------------------------- */

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
              birth_date,
              phone,
              email,
              avatar_url,
              island,
              city,
              address,
              postal_code
            `
          )
          .eq(
            "id",
            adoptantId
          )
          .maybeSingle();

      if (
        profileError
      ) {
        throw profileError;
      }

      if (
        !profileData
      ) {
        throw new Error(
          "Profil adoptant introuvable."
        );
      }

      setProfile(
        profileData as Profile
      );

      /* ---------------------------------------------------
         DERNIER QUESTIONNAIRE ADOPTANT
         = M�ME SOURCE QUE /adoptant/questionnaire
      --------------------------------------------------- */

      const {
        data:
          questionnaireData,
        error:
          questionnaireError,
      } =
        await supabase
          .from(
            "questionnaires_adoption"
          )
          .select("*")
          .eq(
            "user_id",
            adoptantId
          )
          .order(
            "updated_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        questionnaireError
      ) {
        console.error(
          "Erreur questionnaire adoptant :",
          questionnaireError
        );
      }

      setQuestionnaire(
        (
          questionnaireData as
            | AdoptionQuestionnaire
            | null
        ) ||
          null
      );

      /* ---------------------------------------------------
         ANIMAL CONCERN�
      --------------------------------------------------- */

      if (
        requestData.animal_id
      ) {
        const {
          data:
            animalData,
          error:
            animalError,
        } =
          await supabase
            .from(
              "animals"
            )
            .select(
              `
                id,
                animal_name,
                animal_type,
                age_label,
                animal_photos (
                  id,
                  photo_url,
                  is_cover,
                  sort_order
                )
              `
            )
            .eq(
              "id",
              requestData.animal_id
            )
            .maybeSingle();

        if (
          animalError
        ) {
          console.error(
            "Erreur animal :",
            animalError
          );
        } else {
          setAnimal(
            (
              animalData as
                | Animal
                | null
            ) ||
              null
          );
        }
      }
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur profil adoptant :",
        error
      );

      setErrorMessage(
        error instanceof Error ? error.message :
          "Impossible de charger le profil adoptant."
      );
    } finally {
      setLoading(
        false
      );
    }
  }, [adoptantId, requestId, router]);

  /* =======================================================
     NOM
  ======================================================= */

  const fullName =
    useMemo(() => {
      if (
        !profile
      ) {
        return "Adoptant";
      }

      return (
        `${profile.first_name || ""} ${
          profile.last_name || ""
        }`.trim() ||
        "Adoptant"
      );
    }, [
      profile,
    ]);

  useEffect(() => {
    if (adoptantId) {
      queueMicrotask(() => void loadProfile());
    }
  }, [adoptantId, requestId, loadProfile]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-8 text-center font-bold text-[#064b42]">
        Chargement du profil adoptant...
      </main>
    );
  }

  /* =======================================================
     ERREUR
  ======================================================= */

  if (
    errorMessage ||
    !profile ||
    !request
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-6">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-[#064b42]">
            Profil indisponible
          </h1>

          <p className="mt-4 text-[#6f5a47]">
            {errorMessage ||
              "Profil adoptant introuvable."}
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

  const animalPhoto =
    getAnimalPhoto(
      animal
    );

  const animalCountLabel =
    getAnimalCountLabel(
      questionnaire
    );

  const childrenLabel =
    getChildrenLabel(
      questionnaire
    );

  const specialNeeds =
    getSpecialNeeds(
      questionnaire
    );

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-8 pb-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow"
        >
          ? Retour
        </button>

        {/* =================================================
            PROFIL
        ================================================== */}

        <section className="rounded-[30px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              <img
                src={
                  profile.avatar_url
                }
                alt={
                  fullName
                }
                className="h-28 w-28 rounded-full object-cover shadow"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f8f4ec] text-5xl">
                ??
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c7b54]">
                Profil adoptant
              </p>

              <h1 className="mt-1 text-3xl font-black text-[#064b42]">
                {fullName}
              </h1>

              <p className="mt-2 text-[#6f5a47]">
                {[
                  profile.city,
                  profile.island,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " � "
                  ) ||
                  "Localisation non renseign�e"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {typeof request.match_score ===
                  "number" && (
                  <span className="rounded-full bg-[#e8f5f1] px-4 py-2 text-sm font-black text-[#064b42]">
                    ?? Compatibilit�{" "}
                    {
                      request.match_score
                    }
                    %
                  </span>
                )}

                {request.match_level && (
                  <span className="rounded-full bg-[#eef7ff] px-4 py-2 text-sm font-black text-[#23608a]">
                    {
                      request.match_level
                    }
                  </span>
                )}

                <span className="rounded-full bg-[#f8f4ec] px-4 py-2 text-sm font-black text-[#6f5a47]">
                  {getStatusLabel(
                    request.status
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ANIMAL CONCERN�
        ================================================== */}

        {animal && (
          <section className="mt-6 rounded-[30px] bg-white p-5 shadow">
            <h2 className="text-xl font-black text-[#064b42]">
              Demande concernant
            </h2>

            <div className="mt-4 flex items-center gap-4 rounded-[22px] bg-[#f8f4ec] p-4">
              {animalPhoto ? (
                <img
                  src={
                    animalPhoto
                  }
                  alt={
                    animal.animal_name ||
                    "Animal"
                  }
                  className="h-20 w-20 rounded-[18px] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[18px] bg-white text-3xl">
                  ??
                </div>
              )}

              <div>
                <h3 className="text-xl font-black text-[#2f241c]">
                  {animal.animal_name ||
                    "Animal"}
                </h3>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  {[
                    animal.animal_type,
                    animal.age_label,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " � "
                    )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            INFORMATIONS PERSONNELLES
        ================================================== */}

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <h2 className="text-xl font-black text-[#064b42]">
            Informations personnelles
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info
              title="�ge"
              value={formatAge(
                profile.birth_date
              )}
            />

            <Info
              title="T�l�phone"
              value={
                profile.phone
              }
            />

            <Info
              title="Email"
              value={
                profile.email
              }
            />

            <Info
              title="Adresse"
              value={[
                profile.address,
                profile.postal_code,
                profile.city,
                profile.island,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " � "
                )}
            />
          </div>
        </section>

        {/* =================================================
            QUESTIONNAIRE
        ================================================== */}

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#064b42]">
                Dernier questionnaire adoptant
              </h2>

              <p className="mt-1 text-sm text-[#6f5a47]">
                R�ponses actuellement enregistr�es dans le profil adoptant.
              </p>
            </div>

            {questionnaire?.updated_at && (
              <span className="rounded-full bg-[#f8f4ec] px-4 py-2 text-xs font-bold text-[#6f5a47]">
                Mis � jour le{" "}
                {formatDateTime(
                  questionnaire.updated_at
                )}
              </span>
            )}
          </div>

          {!questionnaire ? (
            <div className="mt-5 rounded-[22px] bg-[#fff6e8] p-5">
              <p className="font-black text-[#a86517]">
                Questionnaire r�cent non disponible
              </p>

              <p className="mt-2 text-sm text-[#8c6b43]">
                Aucun questionnaire n&apos;a �t� retrouv� dans la table questionnaires_adoption pour cet adoptant.
              </p>
            </div>
          ) : (
            <>
              {/* 1 */}

              <QuestionBlock
                number="1"
                title="Exp�rience avec les animaux"
              >
                <Answer
                  label="Avez-vous d�j� eu un animal ?"
                  value={
                    questionnaire.proprietaire_animal
                  }
                />
              </QuestionBlock>

              {/* 2 */}

              <QuestionBlock
                number="2"
                title="Animaux vivant actuellement dans le foyer"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <CounterInfo
                    icon="??"
                    label="Chien(s)"
                    value={
                      questionnaire.animaux_chiens_count
                    }
                  />

                  <CounterInfo
                    icon="??"
                    label="Chat(s)"
                    value={
                      questionnaire.animaux_chats_count
                    }
                  />

                  <CounterInfo
                    icon="??"
                    label="Autre(s)"
                    value={
                      questionnaire.animaux_autres_count
                    }
                  />
                </div>

                <Answer
                  label="R�sum�"
                  value={
                    animalCountLabel
                  }
                />
              </QuestionBlock>

              {/* 3 */}

              <QuestionBlock
                number="3"
                title="Enfants dans le foyer"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <CounterInfo
                    icon="??"
                    label="Moins de 8 ans"
                    value={
                      questionnaire.enfants_moins_8_count
                    }
                  />

                  <CounterInfo
                    icon="??"
                    label="8 � 14 ans"
                    value={
                      questionnaire.enfants_8_14_count
                    }
                  />

                  <CounterInfo
                    icon="??"
                    label="15 ans et +"
                    value={
                      questionnaire.enfants_15_plus_count
                    }
                  />
                </div>

                <Answer
                  label="R�sum�"
                  value={
                    childrenLabel
                  }
                />
              </QuestionBlock>

              {/* 4 */}

              <QuestionBlock
                number="4"
                title="Environnement de vie"
              >
                <Answer
                  label="Type de logement"
                  value={
                    questionnaire.type_logement
                  }
                />
              </QuestionBlock>

              {/* 5 */}

              <QuestionBlock
                number="5"
                title="Temps seul"
              >
                <Answer
                  label="Temps pendant lequel l'animal sera g�n�ralement seul"
                  value={
                    questionnaire.temps_seul
                  }
                />
              </QuestionBlock>

              {/* 6 */}

              <QuestionBlock
                number="6"
                title="Rythme de vie"
              >
                <Answer
                  label="Rythme souhait� avec l'animal"
                  value={
                    questionnaire.rythme_vie
                  }
                />
              </QuestionBlock>

              {/* 7-9 */}

              <QuestionBlock
                number="7�9"
                title="Pr�f�rences principales"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Answer
                    label="�ge recherch�"
                    value={
                      questionnaire.age_recherche
                    }
                  />

                  <Answer
                    label="Taille recherch�e"
                    value={
                      questionnaire.taille_recherche
                    }
                  />

                  <Answer
                    label="Sexe recherch�"
                    value={
                      questionnaire.sexe_recherche
                    }
                  />
                </div>
              </QuestionBlock>

              {/* 10 */}

              <QuestionBlock
                number="10"
                title="Accompagnement / besoins particuliers"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <BooleanAnswer
                    label="Handicap"
                    value={
                      questionnaire.accepte_handicap
                    }
                  />

                  <BooleanAnswer
                    label="Traitement m�dical r�gulier"
                    value={
                      questionnaire.accepte_traitement
                    }
                  />

                  <BooleanAnswer
                    label="Animal craintif / traumatis�"
                    value={
                      questionnaire.accepte_craintif
                    }
                  />

                  <BooleanAnswer
                    label="�ducation � poursuivre"
                    value={
                      questionnaire.accepte_education
                    }
                  />

                  <BooleanAnswer
                    label="Ouvert � en discuter"
                    value={
                      questionnaire.accepte_accompagnement_discussion
                    }
                  />
                </div>

                <Answer
                  label="R�sum� besoins sp�ciaux"
                  value={
                    specialNeeds
                  }
                />
              </QuestionBlock>

              {/* FACULTATIF */}

              <QuestionBlock
                number="+"
                title="Informations compl�mentaires"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Answer
                    label="O� vivra principalement l'animal ?"
                    value={
                      questionnaire.lieu_vie_animal
                    }
                  />

                  <Answer
                    label="L'animal pourra accompagner r�guli�rement l'adoptant"
                    value={
                      questionnaire.accompagne_regulierement
                    }
                  />

                  <Answer
                    label="Place de l'animal dans le quotidien"
                    value={
                      questionnaire.place_dans_quotidien
                    }
                  />

                  <Answer
                    label="Temps consacr� � l'adaptation"
                    value={
                      questionnaire.temps_adaptation
                    }
                  />

                  <Answer
                    label="Gestion des difficult�s comportementales"
                    value={
                      questionnaire.gestion_difficulte
                    }
                  />
                </div>

                <Answer
                  label="Pr�f�rence particuli�re"
                  value={
                    questionnaire.preference_libre
                  }
                />
              </QuestionBlock>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Info({
  title,
  value,
}: {
  title: string;
  value?:
    | string
    | null;
}) {
  return (
    <div className="rounded-[20px] bg-[#faf7f2] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#b58b5b]">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-wrap font-semibold text-[#064b42]">
        {value ||
          "Non renseign�"}
      </p>
    </div>
  );
}

function QuestionBlock({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-[24px] border border-[#eee3dc] bg-[#fffaf7] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#ef8196] px-2 text-xs font-black text-white">
          {number}
        </div>

        <h3 className="text-lg font-black text-[#064b42]">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function Answer({
  label,
  value,
}: {
  label: string;
  value?:
    | string
    | null;
}) {
  return (
    <div className="rounded-[18px] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#b58b5b]">
        {label}
      </p>

      <p className="mt-2 font-bold text-[#064b42]">
        {value ||
          "Non renseign�"}
      </p>
    </div>
  );
}

function CounterInfo({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?:
    | number
    | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-[18px] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-sm font-black text-[#5d5955]">
          {label}
        </span>
      </div>

      <span className="text-xl font-black text-[#064b42]">
        {Number(
          value || 0
        )}
      </span>
    </div>
  );
}

function BooleanAnswer({
  label,
  value,
}: {
  label: string;
  value?:
    | boolean
    | null;
}) {
  return (
    <div
      className={`rounded-[18px] border p-4 ${
        value
          ? "border-green-200 bg-green-50"
          : "border-[#eee3dc] bg-white"
      }`}
    >
      <p className="text-sm font-black text-[#064b42]">
        {value
          ? "? "
          : "� "}
        {label}
      </p>

      <p
        className={`mt-1 text-xs font-bold ${
          value
            ? "text-green-700"
            : "text-gray-500"
        }`}
      >
        {value
          ? "Accept�"
          : "Non s�lectionn�"}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatAge(
  birthDate?:
    | string
    | null
) {
  if (
    !birthDate
  ) {
    return "Non renseign�";
  }

  const birth =
    new Date(
      birthDate
    );

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return "Non renseign�";
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getDate() <
        birth.getDate()
    )
  ) {
    age -= 1;
  }

  return `${age} ans`;
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (
    !value
  ) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",
        month:
          "2-digit",
        year:
          "numeric",
        hour:
          "2-digit",
        minute:
          "2-digit",
      }
    ).format(
      new Date(
        value
      )
    );
  } catch {
    return "";
  }
}

function getStatusLabel(
  status?:
    | string
    | null
) {
  switch (
    String(
      status ||
        "pending"
    ).toLowerCase()
  ) {
    case "meeting":
      return "🤝 Rencontre";

    case "accepted":
      return "? Adoption valid�e";

    case "rejected":
    case "refused":
      return "? Demande refus�e";

    case "cancelled":
      return "Demande annul�e";

    case "pending":
    default:
      return "⏳ En attente";
  }
}

function getAnimalPhoto(
  animal:
    | Animal
    | null
) {
  if (
    !animal
  ) {
    return "";
  }

  const photos =
    Array.isArray(
      animal.animal_photos
    )
      ? animal.animal_photos
      : [];

  const cover =
    photos.find(
      (
        photo
      ) =>
        photo.is_cover
    ) ||
    photos
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          Number(
            a.sort_order ||
              0
          ) -
          Number(
            b.sort_order ||
              0
          )
      )[0];

  return (
    cover?.photo_url ||
    ""
  );
}

function getAnimalCountLabel(
  questionnaire:
    | AdoptionQuestionnaire
    | null
) {
  if (
    !questionnaire
  ) {
    return "Non renseign�";
  }

  const labels:
    string[] = [];

  const dogs =
    Number(
      questionnaire.animaux_chiens_count ||
        0
    );

  const cats =
    Number(
      questionnaire.animaux_chats_count ||
        0
    );

  const others =
    Number(
      questionnaire.animaux_autres_count ||
        0
    );

  if (
    dogs > 0
  ) {
    labels.push(
      `${dogs} chien(s)`
    );
  }

  if (
    cats > 0
  ) {
    labels.push(
      `${cats} chat(s)`
    );
  }

  if (
    others > 0
  ) {
    labels.push(
      `${others} autre(s)`
    );
  }

  return (
    labels.join(
      ", "
    ) ||
    "Aucun"
  );
}

function getChildrenLabel(
  questionnaire:
    | AdoptionQuestionnaire
    | null
) {
  if (
    !questionnaire
  ) {
    return "Non renseign�";
  }

  const labels:
    string[] = [];

  const under8 =
    Number(
      questionnaire.enfants_moins_8_count ||
        0
    );

  const eightTo14 =
    Number(
      questionnaire.enfants_8_14_count ||
        0
    );

  const over15 =
    Number(
      questionnaire.enfants_15_plus_count ||
        0
    );

  if (
    under8 > 0
  ) {
    labels.push(
      `${under8} moins de 8 ans`
    );
  }

  if (
    eightTo14 > 0
  ) {
    labels.push(
      `${eightTo14} de 8 � 14 ans`
    );
  }

  if (
    over15 > 0
  ) {
    labels.push(
      `${over15} de 15 ans et +`
    );
  }

  return (
    labels.join(
      ", "
    ) ||
    "Aucun enfant"
  );
}

function getSpecialNeeds(
  questionnaire:
    | AdoptionQuestionnaire
    | null
) {
  if (
    !questionnaire
  ) {
    return "Non renseign�";
  }

  const values:
    string[] = [];

  if (
    questionnaire.accepte_handicap
  ) {
    values.push(
      "Handicap"
    );
  }

  if (
    questionnaire.accepte_traitement
  ) {
    values.push(
      "Traitement m�dical"
    );
  }

  if (
    questionnaire.accepte_craintif
  ) {
    values.push(
      "Animal craintif / traumatis�"
    );
  }

  if (
    questionnaire.accepte_education
  ) {
    values.push(
      "�ducation � poursuivre"
    );
  }

  if (
    questionnaire.accepte_accompagnement_discussion
  ) {
    values.push(
      "Ouvert � en discuter"
    );
  }

  return (
    values.join(
      ", "
    ) ||
    "Aucun besoin particulier s�lectionn�"
  );
}