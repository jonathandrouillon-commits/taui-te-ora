"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "../../../lib/supabase";
import { animalService } from "../../../services/animal.service";

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();

  const animalId = Array.isArray(
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

  useEffect(() => {
    if (!animalId) {
      router.replace("/");
      return;
    }

    void startAdoption();
  }, [animalId]);

  async function startAdoption() {
    try {
      /* =====================================================
         1. SESSION
      ===================================================== */

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Erreur authentification :",
          sessionError
        );
      }

      const user =
        session?.user;

      /* =====================================================
         2. NON CONNECTÉ
      ===================================================== */

      if (!user) {
        setMessage(
          "Connexion nécessaire..."
        );

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

      /* =====================================================
         3. PROFIL / AUTORISATIONS
         SOURCE UNIQUE : profiles
      ===================================================== */

      setMessage(
        "Vérification de votre profil..."
      );

      const access =
        await animalService.getCurrentUserAccess();

      const role =
        access.role;

      /* =====================================================
         4. PAS DE RÔLE
      ===================================================== */

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

      /* =====================================================
         5. COMPTE ACTIF
      ===================================================== */

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

      /* =====================================================
         6. ADOPTANT UNIQUEMENT
      ===================================================== */

      if (role !== "adoptant") {
        alert(
          "Pour faire une demande d'adoption, vous devez utiliser un profil Adoptant."
        );

        router.replace("/");
        return;
      }

      /* =====================================================
         7. DEMANDE EXISTANTE ?
      ===================================================== */

      setMessage(
        "Vérification de votre demande..."
      );

      const {
        data: existingRequest,
        error: requestError,
      } =
        await supabase
          .from(
            "adoption_requests"
          )
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
            access.userId
          )
          .maybeSingle();

      if (requestError) {
        console.error(
          "Erreur recherche demande :",
          requestError
        );
      }

      /* =====================================================
         8. CONVERSATION EXISTANTE ?
      ===================================================== */

      if (existingRequest) {
        setMessage(
          "Ouverture de votre demande..."
        );

        const {
          data: conversation,
          error: conversationError,
        } =
          await supabase
            .from(
              "conversations"
            )
            .select("id")
            .eq(
              "adoption_request_id",
              existingRequest.id
            )
            .eq(
              "requester_id",
              access.userId
            )
            .eq(
              "owner_id",
              existingRequest.owner_id
            )
            .maybeSingle();

        if (
          conversationError
        ) {
          console.error(
            "Erreur recherche conversation :",
            conversationError
          );
        }

        if (
          conversation?.id
        ) {
          router.replace(
            `/messages/${conversation.id}`
          );

          return;
        }
      }

      /* =====================================================
         9. QUESTIONNAIRE
      ===================================================== */

      setMessage(
        "Préparation de votre demande d'adoption..."
      );

      router.replace(
        `/adoption/questionnaire/${encodeURIComponent(
          animalId
        )}`
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