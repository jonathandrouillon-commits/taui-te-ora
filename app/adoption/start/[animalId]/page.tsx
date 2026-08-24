"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();

  const animalId = String(
    params.animalId || ""
  );

  const [message, setMessage] =
    useState(
      "Vérification de votre profil..."
    );

  useEffect(() => {
    if (!animalId) {
      router.replace("/");
      return;
    }

    startAdoption();
  }, [animalId]);

  async function startAdoption() {
    try {
      /* ===============================================
         1. VÉRIFIER LA CONNEXION
      =============================================== */

      const {
        data: { user },
        error,
      } =
        await supabase.auth.getUser();

      if (error) {
        console.error(
          "Erreur authentification :",
          error
        );
      }

      /* ===============================================
         2. PAS CONNECTÉ
      =============================================== */

      if (!user) {
        setMessage(
          "Connexion nécessaire..."
        );

        /*
         * IMPORTANT :
         * on revient exactement ici
         * après connexion.
         */
        const redirect =
          `/adoption/start/${animalId}`;

        router.replace(
          "/login?redirect=" +
            encodeURIComponent(
              redirect
            )
        );

        return;
      }

      /* ===============================================
         3. UTILISATEUR CONNECTÉ
      =============================================== */

      const role =
        String(
          user.user_metadata?.role ||
            ""
        )
          .toLowerCase()
          .trim();

      /*
       * Un ancien compte peut éventuellement
       * ne pas encore avoir de rôle.
       */
      if (!role) {
        setMessage(
          "Choix de votre profil..."
        );

        router.replace(
          "/choose-role?redirect=" +
            encodeURIComponent(
              `/adoption/start/${animalId}`
            )
        );

        return;
      }

      /* ===============================================
         4. L'ADOPTION EST RÉSERVÉE AU PROFIL ADOPTANT
      =============================================== */

      if (role !== "adoptant") {
        alert(
          "Pour faire une demande d'adoption, vous devez utiliser un profil Adoptant."
        );

        router.replace("/");
        return;
      }

      /* ===============================================
         5. VÉRIFIER SI UNE DEMANDE EXISTE DÉJÀ
      =============================================== */

      setMessage(
        "Vérification de votre demande..."
      );

      const {
        data: existingRequest,
        error: requestError,
      } = await supabase
        .from("adoption_requests")
        .select(
          `
            id,
            animal_id,
            requester_id,
            owner_id,
            status
          `
        )
        .eq(
          "animal_id",
          animalId
        )
        .eq(
          "requester_id",
          user.id
        )
        .maybeSingle();

      if (requestError) {
        console.error(
          "Erreur recherche demande :",
          requestError
        );
      }

      /* ===============================================
         6. SI UNE DEMANDE EXISTE DÉJÀ,
            CHERCHER SA CONVERSATION
      =============================================== */

      if (existingRequest) {
        setMessage(
          "Ouverture de votre demande..."
        );

        const {
          data: conversation,
        } = await supabase
          .from("conversations")
          .select("id")
          .eq(
            "adoption_request_id",
            existingRequest.id
          )
          .maybeSingle();

        /*
         * Si conversation existante :
         * ouverture directe du chat.
         */
        if (conversation?.id) {
          router.replace(
            `/messages/${conversation.id}`
          );

          return;
        }

        /*
         * Demande ancienne sans conversation :
         * le questionnaire pourra compléter
         * le workflow.
         */
      }

      /* ===============================================
         7. QUESTIONNAIRE ADOPTANT
      =============================================== */

      setMessage(
        "Préparation de votre demande d'adoption..."
      );

      /*
       * On utilise une query string car ta route
       * actuelle est :
       *
       * /adoption/questionnaire
       *
       * et non :
       *
       * /adoption/questionnaire/[animalId]
       */
      router.replace(
        "/adoption/questionnaire" +
          "?animalId=" +
          encodeURIComponent(
            animalId
          )
      );
    } catch (error) {
      console.error(
        "Erreur démarrage adoption :",
        error
      );

      alert(
        "Impossible de préparer la demande d'adoption."
      );

      router.replace("/");
    }
  }

  return (
    <main
      className="
        flex
        min-h-[100dvh]
        items-center
        justify-center
        bg-[#f4eee3]
        px-6
        text-[#064b42]
      "
    >
      <div
        className="
          w-full
          max-w-sm
          rounded-[30px]
          bg-white/90
          p-8
          text-center
          shadow-xl
          backdrop-blur
        "
      >
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

        <div
          className="
            mx-auto
            mt-6
            h-9
            w-9
            animate-spin
            rounded-full
            border-4
            border-[#efd5d7]
            border-t-[#df8995]
          "
        />

        <p
          className="
            mt-5
            text-base
            font-black
          "
        >
          {message}
        </p>
      </div>
    </main>
  );
}