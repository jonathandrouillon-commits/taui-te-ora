"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "../../../lib/supabase";
import { animalService } from "../../../services/animal.service";
import { compatibilityService } from "../../../services/compatibility.service";

const FALLBACK_ADMIN_ID =
  "7bbb8dd5-9647-48f2-ae81-116d2e8fdbbe";

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

type AdoptionRequest = {
  id: string;
  animal_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
  message?: string | null;
  match_score?: number | null;
  match_level?: string | null;
  match_details?: unknown;
  match_calculated_at?: string | null;
};

type NotificationRow = {
  recipient_id: string;
  animal_id: string;
  adoption_request_id: string;
  conversation_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
};

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return String(
      (
        error as {
          message: string;
        }
      ).message
    );
  }

  return "Une erreur est survenue lors de l'envoi de votre demande.";
}

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();
  const hasStarted = useRef(false);

  const animalId =
    Array.isArray(
      params.animalId
    )
      ? params.animalId[0]
      : String(
          params.animalId || ""
        );

  const [message, setMessage] =
    useState(
      "Vérification de votre profil..."
    );

  const getAdminId =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (
        !error &&
        data?.id
      ) {
        return data.id;
      }

      return FALLBACK_ADMIN_ID;
    }, []);

  const loadQuestionnaire =
    useCallback(
      async (
        userId: string
      ): Promise<
        QuestionnaireData | null
      > => {
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
          .eq("id", userId)
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
          return null;
        }

        return {
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
            "Pas de préférence",
          hypoallergenique:
            data.hypoallergenic ||
            "Pas de préférence",
          proprete:
            data.cleanliness ||
            "Pas de préférence",
          besoins_speciaux:
            data.special_needs ||
            "Non",
          race_souhaitee:
            data.ideal_breed || "",
        };
      },
      []
    );

  const findExistingRequest =
    useCallback(
      async (
        userId: string
      ) => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "adoption_requests"
          )
          .select(
            `
              id,
              animal_id,
              requester_id,
              owner_id,
              status,
              message,
              match_score,
              match_level,
              match_details,
              match_calculated_at
            `
          )
          .eq(
            "animal_id",
            animalId
          )
          .eq(
            "requester_id",
            userId
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data as
          | AdoptionRequest
          | null;
      },
      [animalId]
    );

  const findConversation =
    useCallback(
      async (
        requestId: string
      ) => {
        const {
          data,
          error,
        } = await supabase
          .from("conversations")
          .select("id")
          .eq(
            "adoption_request_id",
            requestId
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data?.id || null;
      },
      []
    );

  const getAnimal =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from("animals")
        .select(
          `
            id,
            animal_name,
            owner_id,
            garden_requirement,
            enfants_moins_8,
            enfants_8_14,
            enfants_15_plus,
            foyer_chiens,
            foyer_chats,
            foyer_autres,
            activity_level,
            experience_recommandee,
            handicap,
            traitement_regulier,
            craintif_traumatise,
            education_a_poursuivre
          `
        )
        .eq("id", animalId)
        .single();

      if (error) {
        throw error;
      }

      if (!data?.owner_id) {
        throw new Error(
          "Le créateur de cette fiche animal est introuvable."
        );
      }

      return data;
    }, [animalId]);

  const createOrUpdateRequest =
    useCallback(
      async ({
        userId,
        questionnaire,
        existingRequest,
      }: {
        userId: string;
        questionnaire: QuestionnaireData;
        existingRequest: AdoptionRequest | null;
      }) => {
        setMessage(
          "Calcul de votre compatibilité..."
        );

        const animal =
          await getAnimal();

        const match =
          compatibilityService.calculate(
            questionnaire,
            animal
          );

        const matchCalculatedAt =
          new Date().toISOString();

        if (existingRequest) {
          const {
            data,
            error,
          } = await supabase
            .from(
              "adoption_requests"
            )
            .update({
              match_score:
                match.score,
              match_level:
                match.level,
              match_details:
                match.details,
              match_calculated_at:
                matchCalculatedAt,
            })
            .eq(
              "id",
              existingRequest.id
            )
            .eq(
              "requester_id",
              userId
            )
            .select()
            .single();

          if (error) {
            throw error;
          }

          return {
            request:
              data as AdoptionRequest,
            animal,
            isNewRequest: false,
          };
        }

        setMessage(
          "Création de votre demande d'adoption..."
        );

        const {
          data,
          error,
        } = await supabase
          .from("adoption_requests")
          .insert({
            animal_id: animalId,
            requester_id: userId,
            owner_id:
              animal.owner_id,
            status: "pending",
            message:
              `Je souhaite adopter ${
                animal.animal_name ||
                "cet animal"
              }.`,
            match_score:
              match.score,
            match_level:
              match.level,
            match_details:
              match.details,
            match_calculated_at:
              matchCalculatedAt,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          request:
            data as AdoptionRequest,
          animal,
          isNewRequest: true,
        };
      },
      [animalId, getAnimal]
    );

  const getOrCreateConversation =
    useCallback(
      async ({
        request,
        userId,
      }: {
        request: AdoptionRequest;
        userId: string;
      }) => {
        setMessage(
          "Préparation de la conversation..."
        );

        const existingId =
          await findConversation(
            request.id
          );

        if (existingId) {
          return {
            conversationId:
              existingId,
            isNewConversation:
              false,
          };
        }

        const {
          data,
          error,
        } = await supabase
          .from("conversations")
          .insert({
            animal_id: animalId,
            requester_id: userId,
            owner_id:
              request.owner_id,
            adoption_request_id:
              request.id,
            updated_at:
              new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        return {
          conversationId:
            data.id,
          isNewConversation: true,
        };
      },
      [animalId, findConversation]
    );

  const createInitialMessage =
    useCallback(
      async ({
        conversationId,
        userId,
        animalName,
      }: {
        conversationId: string;
        userId: string;
        animalName: string;
      }) => {
        const {
          data: existing,
          error: searchError,
        } = await supabase
          .from(
            "conversation_messages"
          )
          .select("id")
          .eq(
            "conversation_id",
            conversationId
          )
          .limit(1)
          .maybeSingle();

        if (searchError) {
          throw searchError;
        }

        if (existing) return;

        const { error } =
          await supabase
            .from(
              "conversation_messages"
            )
            .insert({
              conversation_id:
                conversationId,
              sender_id: userId,
              message:
                `Bonjour, je suis intéressé(e) par l'adoption de ${animalName}.`,
            });

        if (error) {
          throw error;
        }
      },
      []
    );

  const createNotifications =
    useCallback(
      async ({
        animalName,
        ownerId,
        requestId,
        conversationId,
      }: {
        animalName: string;
        ownerId: string;
        requestId: string;
        conversationId: string;
      }) => {
        setMessage(
          "Envoi des notifications..."
        );

        const adminId =
          await getAdminId();

        const notifications: NotificationRow[] = [
          {
            recipient_id:
              ownerId,
            animal_id: animalId,
            adoption_request_id:
              requestId,
            conversation_id:
              conversationId,
            type:
              "adoption_request",
            title:
              "Nouvelle demande d'adoption",
            message:
              `Une nouvelle demande d'adoption a été envoyée pour ${animalName}.`,
            is_read: false,
          },
        ];

        if (
          adminId &&
          adminId !== ownerId
        ) {
          notifications.push({
            recipient_id:
              adminId,
            animal_id: animalId,
            adoption_request_id:
              requestId,
            conversation_id:
              conversationId,
            type:
              "adoption_request_admin",
            title:
              "Nouvelle demande d'adoption",
            message:
              `Nouvelle demande d'adoption pour ${animalName}.`,
            is_read: false,
          });
        }

        const { error } =
          await supabase
            .from("notifications")
            .insert(
              notifications
            );

        if (error) {
          throw error;
        }
      },
      [animalId, getAdminId]
    );

  const startAdoption =
    useCallback(async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          router.replace(
            "/login?redirect=" +
              encodeURIComponent(
                `/adoption/start/${animalId}`
              )
          );
          return;
        }

        const access =
          await animalService.getCurrentUserAccess();

        if (!access.role) {
          router.replace(
            "/choose-role?redirect=" +
              encodeURIComponent(
                `/adoption/start/${animalId}`
              )
          );
          return;
        }

        if (!access.isActive) {
          alert(
            "Votre compte est actuellement désactivé."
          );
          router.replace("/");
          return;
        }

        if (
          access.approvalStatus ===
            "rejected" ||
          access.approvalStatus ===
            "suspended"
        ) {
          alert(
            "Votre compte ne permet pas actuellement d'effectuer une demande d'adoption."
          );
          router.replace("/");
          return;
        }

        if (
          access.role !==
          "adoptant"
        ) {
          alert(
            "Pour faire une demande d'adoption, vous devez utiliser un profil Adoptant."
          );
          router.replace("/");
          return;
        }

        setMessage(
          "Vérification de votre demande..."
        );

        const existingRequest =
          await findExistingRequest(
            access.userId
          );

        if (existingRequest) {
          const conversationId =
            await findConversation(
              existingRequest.id
            );

          if (conversationId) {
            router.replace(
              `/messages/${conversationId}`
            );
            return;
          }
        }

        setMessage(
          "Lecture de votre profil adoptant..."
        );

        const questionnaire =
          await loadQuestionnaire(
            access.userId
          );

        if (!questionnaire) {
          alert(
            "Complétez une seule fois votre profil adoptant avant d'envoyer votre demande."
          );

          router.replace(
            "/adoptant/questionnaire?redirect=" +
              encodeURIComponent(
                `/adoption/start/${animalId}`
              )
          );
          return;
        }

        const confirmationReceived =
          new URLSearchParams(
            window.location.search
          ).get("confirm") === "1";

        if (!confirmationReceived) {
          setMessage(
            "Ouverture de la fiche animal..."
          );

          router.replace(
            `/animal/${encodeURIComponent(
              animalId
            )}?adoption=1`
          );
          return;
        }

        const {
          request,
          animal,
          isNewRequest,
        } =
          await createOrUpdateRequest({
            userId:
              access.userId,
            questionnaire,
            existingRequest,
          });

        const {
          conversationId,
          isNewConversation,
        } =
          await getOrCreateConversation({
            request,
            userId:
              access.userId,
          });

        const animalName =
          animal.animal_name ||
          "cet animal";

        await createInitialMessage({
          conversationId,
          userId: access.userId,
          animalName,
        });

        if (
          isNewRequest ||
          isNewConversation
        ) {
          await createNotifications({
            animalName,
            ownerId:
              request.owner_id,
            requestId: request.id,
            conversationId,
          });
        }

        setMessage(
          "Ouverture de votre conversation..."
        );

        router.replace(
          `/messages/${conversationId}`
        );
        router.refresh();
      } catch (error: unknown) {
        console.error(
          "Erreur démarrage adoption :",
          error
        );

        alert(
          getErrorMessage(error)
        );

        router.replace("/");
      }
    }, [
      animalId,
      createInitialMessage,
      createNotifications,
      createOrUpdateRequest,
      findConversation,
      findExistingRequest,
      getOrCreateConversation,
      loadQuestionnaire,
      router,
    ]);

  useEffect(() => {
    if (!animalId) {
      router.replace("/");
      return;
    }

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    queueMicrotask(
      () => void startAdoption()
    );
  }, [animalId, router, startAdoption]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4eee3] px-6 text-[#064b42]">
      <div className="w-full max-w-sm rounded-[30px] bg-white/90 p-8 text-center shadow-xl backdrop-blur">
        <img
          src="/logo-taui-te-ora.png"
          alt="Taui Te Ora"
          className="mx-auto h-24 w-24 object-contain"
        />

        <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

        <p className="mt-5 text-base font-black">
          {message}
        </p>
      </div>
    </main>
  );
}
