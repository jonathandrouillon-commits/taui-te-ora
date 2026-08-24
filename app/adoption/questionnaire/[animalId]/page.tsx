"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

/* =========================================================
   ADMIN TAUI TE ORA
========================================================= */

const FALLBACK_ADMIN_ID =
  "7bbb8dd5-9647-48f2-ae81-116d2e8fdbbe";

/* =========================================================
   QUESTIONNAIRE
========================================================= */

const fields = [
  {
    name: "proprietaire_animal",
    label: "Êtes-vous propriétaire d’un animal ?",
    options: ["Oui", "Avant", "Première fois"],
  },
  {
    name: "animal_actuel",
    label: "Avez-vous actuellement un animal ?",
    options: ["Non", "Chien", "Chat", "Autre"],
  },
  {
    name: "adoption_pour",
    label: "Vous adoptez pour :",
    options: ["Moi", "Ma famille"],
  },
  {
    name: "enfants",
    label: "Avez-vous des enfants ?",
    options: [
      "Non",
      "Moins de 8 ans",
      "Plus de 8 ans",
      "Plus de 15 ans",
    ],
  },
  {
    name: "jardin",
    label: "Type de jardin :",
    options: [
      "Clôturé",
      "Ouvert",
      "Pas de jardin",
    ],
  },
  {
    name: "age_souhaite",
    label: "Âge souhaité :",
    options: [
      "Puppy (moins de 1 an)",
      "Young (1 à 3 ans)",
      "Adult (3 à 8 ans)",
      "Senior",
      "Aucune préférence",
    ],
  },
  {
    name: "sexe_souhaite",
    label: "Sexe souhaité :",
    options: [
      "Mâle",
      "Femelle",
      "Aucune préférence",
    ],
  },
  {
    name: "taille_souhaitee",
    label: "Taille souhaitée :",
    options: [
      "Petit (0 à 10 kg)",
      "Moyen (11 à 27 kg)",
      "Large (28 à 45 kg)",
      "XL (plus de 45 kg)",
      "Aucune préférence",
    ],
  },
  {
    name: "activite_souhaitee",
    label: "Activité :",
    options: [
      "Chien de compagnie",
      "Cool Dog",
      "Actif",
      "Très actif",
      "Pas de préférence",
    ],
  },
  {
    name: "hypoallergenique",
    label: "Hypoallergénique :",
    options: [
      "Oui",
      "Non",
      "Pas de préférence",
    ],
  },
  {
    name: "proprete",
    label: "Propreté :",
    options: [
      "Oui",
      "Non",
      "Pas de préférence",
    ],
  },
  {
    name: "besoins_speciaux",
    label:
      "Ouvert à un animal avec des besoins spécifiques ?",
    options: [
      "Oui",
      "Non",
      "Pas de préférence",
    ],
  },
];

type FormData = {
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

const initialForm: FormData = {
  proprietaire_animal: "",
  animal_actuel: "",
  adoption_pour: "",
  enfants: "",
  jardin: "",
  age_souhaite: "",
  sexe_souhaite: "",
  taille_souhaitee: "",
  activite_souhaitee: "",
  hypoallergenique: "",
  proprete: "",
  besoins_speciaux: "",
  race_souhaitee: "",
};

/* =========================================================
   PAGE
========================================================= */

export default function AdoptionQuestionnairePage() {
  const router = useRouter();
  const params = useParams();

  const animalId = Array.isArray(params.animalId)
    ? params.animalId[0]
    : String(params.animalId || "");

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function questionnaireComplet() {
    return fields.every((field) => {
      const fieldName =
        field.name as keyof FormData;

      return Boolean(form[fieldName]);
    });
  }

  /* =======================================================
     QUESTIONNAIRE
  ======================================================= */

  async function saveQuestionnaire(
    userId: string
  ) {
    const {
      data: existing,
      error: searchError,
    } = await supabase
      .from("questionnaires_adoption")
      .select("id")
      .eq("user_id", userId)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    const questionnaireData = {
      proprietaire_animal:
        form.proprietaire_animal,

      animal_actuel:
        form.animal_actuel,

      adoption_pour:
        form.adoption_pour,

      enfants:
        form.enfants,

      jardin:
        form.jardin,

      age_souhaite:
        form.age_souhaite,

      sexe_souhaite:
        form.sexe_souhaite,

      taille_souhaitee:
        form.taille_souhaitee,

      activite_souhaitee:
        form.activite_souhaitee,

      hypoallergenique:
        form.hypoallergenique,

      proprete:
        form.proprete,

      besoins_speciaux:
        form.besoins_speciaux,

      race_souhaitee:
        form.race_souhaitee.trim(),

      updated_at:
        new Date().toISOString(),
    };

    if (existing) {
      const { error } =
        await supabase
          .from("questionnaires_adoption")
          .update(questionnaireData)
          .eq("id", existing.id)
          .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return existing.id;
    }

    const {
      data,
      error,
    } = await supabase
      .from("questionnaires_adoption")
      .insert({
        user_id: userId,
        animal_id: animalId,
        ...questionnaireData,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  /* =======================================================
     ADMIN
  ======================================================= */

  async function getAdminId() {
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
  }

  /* =======================================================
     DEMANDE D'ADOPTION
  ======================================================= */

  async function getOrCreateAdoptionRequest(
    userId: string
  ) {
    setStatusMessage(
      "Création de votre demande d'adoption..."
    );

    const {
      data: animal,
      error: animalError,
    } = await supabase
      .from("animals")
      .select(
        `
          id,
          animal_name,
          owner_id
        `
      )
      .eq("id", animalId)
      .single();

    if (animalError) {
      throw animalError;
    }

    if (!animal?.owner_id) {
      throw new Error(
        "Le créateur de cette fiche animal est introuvable."
      );
    }

    const {
      data: existingRequest,
      error: searchError,
    } = await supabase
      .from("adoption_requests")
      .select(
        `
          id,
          animal_id,
          requester_id,
          owner_id,
          status,
          message
        `
      )
      .eq("animal_id", animalId)
      .eq("requester_id", userId)
      .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    if (existingRequest) {
      return {
        request: existingRequest,
        animal,
        isNew: false,
      };
    }

    const {
      data: request,
      error,
    } = await supabase
      .from("adoption_requests")
      .insert({
        animal_id: animalId,
        requester_id: userId,
        owner_id: animal.owner_id,
        status: "pending",
        message:
          `Je souhaite adopter ${
            animal.animal_name ||
            "cet animal"
          }.`,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      request,
      animal,
      isNew: true,
    };
  }

  /* =======================================================
     CONVERSATION
  ======================================================= */

  async function getOrCreateConversation(
    requestId: string,
    ownerId: string,
    requesterId: string
  ) {
    setStatusMessage(
      "Préparation de la conversation..."
    );

    const {
      data: existing,
      error: searchError,
    } = await supabase
      .from("conversations")
      .select("id")
      .eq(
        "adoption_request_id",
        requestId
      )
      .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    if (existing?.id) {
      return {
        conversationId:
          existing.id,

        isNew:
          false,
      };
    }

    const {
      data,
      error,
    } = await supabase
      .from("conversations")
      .insert({
        animal_id:
          animalId,

        adoption_request_id:
          requestId,

        requester_id:
          requesterId,

        owner_id:
          ownerId,

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

      isNew:
        true,
    };
  }

  /* =======================================================
     PREMIER MESSAGE
  ======================================================= */

  async function createInitialMessage({
    conversationId,
    requesterId,
    animalName,
  }: {
    conversationId: string;
    requesterId: string;
    animalName: string;
  }) {
    const {
      data: existing,
      error: searchError,
    } = await supabase
      .from("conversation_messages")
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

    if (existing) {
      return;
    }

    const { error } =
      await supabase
        .from("conversation_messages")
        .insert({
          conversation_id:
            conversationId,

          sender_id:
            requesterId,

          message:
            `Bonjour, je suis intéressé(e) par l'adoption de ${animalName}.`,
        });

    if (error) {
      throw error;
    }
  }

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  async function createNotifications({
    animalName,
    ownerId,
    requesterId,
    requestId,
    conversationId,
  }: {
    animalName: string;
    ownerId: string;
    requesterId: string;
    requestId: string;
    conversationId: string;
  }) {
    setStatusMessage(
      "Envoi des notifications..."
    );

    const adminId =
      await getAdminId();

    const title =
      "Nouvelle demande d'adoption";

    const message =
      `Une nouvelle demande d'adoption a été envoyée pour ${animalName}.`;

    const notifications: any[] = [
      {
        /*
         * IMPORTANT :
         * ta vraie table notifications
         * exige user_id.
         */
        user_id:
          ownerId,

        recipient_id:
          ownerId,

        animal_id:
          animalId,

        adoption_request_id:
          requestId,

        conversation_id:
          conversationId,

        type:
          "adoption_request",

        title,

        message,

        is_read:
          false,
      },
    ];

    /*
     * Notification administrateur.
     * On évite le doublon si l'admin
     * est également propriétaire
     * de la fiche.
     */
    if (
      adminId &&
      adminId !== ownerId
    ) {
      notifications.push({
        user_id:
          adminId,

        recipient_id:
          adminId,

        animal_id:
          animalId,

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

        is_read:
          false,
      });
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .insert(
        notifications
      );

    if (error) {
      throw error;
    }
  }

  /* =======================================================
     ENVOYER LA DEMANDE
  ======================================================= */

  async function submitQuestionnaire() {
    if (loading) return;

    if (!animalId) {
      alert(
        "L’identifiant de l’animal est introuvable."
      );

      return;
    }

    if (!questionnaireComplet()) {
      alert(
        "Merci de répondre à toutes les questions."
      );

      return;
    }

    try {
      setLoading(true);

      setStatusMessage(
        "Vérification de votre compte..."
      );

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      /* PAS CONNECTÉ */

      if (!user) {
        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              `/adoption/questionnaire/${animalId}`
            )
        );

        return;
      }

      /* PROFIL ADOPTANT */

      const role =
        String(
          user.user_metadata
            ?.role || ""
        )
          .toLowerCase()
          .trim();

      if (
        role &&
        role !== "adoptant"
      ) {
        alert(
          "La demande d'adoption doit être effectuée avec un compte Adoptant."
        );

        return;
      }

      /* 1 — QUESTIONNAIRE */

      setStatusMessage(
        "Enregistrement du questionnaire..."
      );

      await saveQuestionnaire(
        user.id
      );

      /* 2 — DEMANDE */

      const {
        request,
        animal,
        isNew: isNewRequest,
      } =
        await getOrCreateAdoptionRequest(
          user.id
        );

      /* 3 — CONVERSATION */

      const {
        conversationId,
        isNew: isNewConversation,
      } =
        await getOrCreateConversation(
          request.id,
          request.owner_id,
          user.id
        );

      /* 4 — MESSAGE INITIAL */

      await createInitialMessage({
        conversationId,

        requesterId:
          user.id,

        animalName:
          animal.animal_name ||
          "cet animal",
      });

      /* 5 — NOTIFICATIONS */

      if (
        isNewRequest ||
        isNewConversation
      ) {
        await createNotifications({
          animalName:
            animal.animal_name ||
            "cet animal",

          ownerId:
            request.owner_id,

          requesterId:
            user.id,

          requestId:
            request.id,

          conversationId,
        });
      }

      /* 6 — CHAT */

      setStatusMessage(
        "Ouverture de votre conversation..."
      );

      router.push(
        `/messages/${conversationId}`
      );

      router.refresh();
    } catch (error: any) {
      console.error(
        "ERREUR DEMANDE ADOPTION :",
        error
      );

      alert(
        error?.message ||
          "Une erreur est survenue lors de l'envoi de votre demande."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AFFICHAGE
  ========================================================= */

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#f4eee3]
        px-4
        py-8
        pb-28
        text-[#064b42]
      "
    >
      <section
        className="
          mx-auto
          max-w-4xl
          rounded-[32px]
          bg-white
          p-6
          shadow-xl
          md:p-8
        "
      >
        <div className="text-center">

          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              mx-auto
              h-24
              w-24
              object-contain
            "
          />

          <h1
            className="
              mt-4
              text-3xl
              font-black
              md:text-4xl
            "
          >
            Questionnaire adoptant
          </h1>

          <p className="mt-3 text-gray-600">
            Ces informations aideront le créateur de la fiche à vérifier votre compatibilité avec l’animal.
          </p>

        </div>

        <div
          className="
            mt-8
            grid
            gap-5
            md:grid-cols-2
          "
        >
          {fields.map(
            (field) => {
              const fieldName =
                field.name as keyof FormData;

              return (
                <label
                  key={field.name}
                  className="block"
                >
                  <span
                    className="
                      mb-2
                      block
                      font-black
                      text-[#064b42]
                    "
                  >
                    {field.label}
                  </span>

                  <select
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-[#ded4c5]
                      bg-white
                      px-4
                      py-3
                      text-[#064b42]
                      outline-none
                      transition
                      focus:border-[#064b42]
                      focus:ring-2
                      focus:ring-[#064b42]/20
                    "
                    value={
                      form[fieldName]
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        fieldName,
                        event.target.value
                      )
                    }
                    disabled={
                      loading
                    }
                  >
                    <option value="">
                      Sélectionner
                    </option>

                    {field.options.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>
                </label>
              );
            }
          )}

          <label className="block md:col-span-2">

            <span
              className="
                mb-2
                block
                font-black
                text-[#064b42]
              "
            >
              Race de prédilection
            </span>

            <input
              type="text"
              className="
                w-full
                rounded-2xl
                border
                border-[#ded4c5]
                bg-white
                px-4
                py-3
                text-[#064b42]
                outline-none
                transition
                placeholder:text-gray-400
                focus:border-[#064b42]
                focus:ring-2
                focus:ring-[#064b42]/20
              "
              placeholder="Exemple : Local Dog, Labrador, Berger..."
              value={
                form.race_souhaitee
              }
              onChange={(
                event
              ) =>
                updateField(
                  "race_souhaitee",
                  event.target.value
                )
              }
              disabled={
                loading
              }
            />

          </label>
        </div>

        {/* ÉTAT */}

        {loading &&
          statusMessage && (
            <div
              className="
                mt-7
                rounded-[20px]
                bg-[#fce8ec]
                px-5
                py-4
                text-center
                text-sm
                font-bold
                text-[#75545c]
              "
            >
              {statusMessage}
            </div>
          )}

        {/* BOUTONS */}

        <div
          className="
            mt-8
            flex
            flex-col-reverse
            gap-4
            sm:flex-row
            sm:justify-between
          "
        >
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            disabled={loading}
            className="
              rounded-2xl
              bg-gray-100
              px-6
              py-4
              font-black
              text-gray-700
              disabled:opacity-50
            "
          >
            Retour
          </button>

          <button
            type="button"
            onClick={
              submitQuestionnaire
            }
            disabled={loading}
            className="
              rounded-2xl
              bg-[#064b42]
              px-6
              py-4
              font-black
              text-white
              disabled:opacity-60
            "
          >
            {loading
              ? "Envoi de la demande..."
              : "Envoyer ma demande"}
          </button>
        </div>

      </section>
    </main>
  );
}