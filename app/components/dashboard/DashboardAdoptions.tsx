"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelAdoptionRequest,
  getCurrentUser,
} from "../../lib/dashboard";

import {
  supabase,
} from "../../lib/supabase";

import type {
  AdoptionRequest,
} from "../../lib/dashboard";

type DashboardAdoptionsProps = {
  adoptionRequests: AdoptionRequest[];
};

type ConversationMap = Record<
  string,
  string
>;

export default function DashboardAdoptions({
  adoptionRequests,
}: DashboardAdoptionsProps) {
  const [
    requests,
    setRequests,
  ] =
    useState<
      AdoptionRequest[]
    >(adoptionRequests);

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    conversations,
    setConversations,
  ] =
    useState<ConversationMap>(
      {}
    );

  useEffect(() => {
    setRequests(
      adoptionRequests
    );
  }, [
    adoptionRequests,
  ]);

  useEffect(() => {
    loadConversations();
  }, [
    adoptionRequests,
  ]);

  async function loadConversations() {
    try {
      const requestIds =
        adoptionRequests
          .map(
            (
              request
            ) =>
              request.id
          )
          .filter(
            Boolean
          );

      if (
        requestIds.length ===
        0
      ) {
        setConversations(
          {}
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "conversations"
          )
          .select(
            `
              id,
              adoption_request_id
            `
          )
          .in(
            "adoption_request_id",
            requestIds
          );

      if (error) {
        throw error;
      }

      const map:
        ConversationMap =
          {};

      for (
        const conversation of
          data || []
      ) {
        if (
          conversation
            .adoption_request_id &&
          conversation.id
        ) {
          map[
            conversation
              .adoption_request_id
          ] =
            conversation.id;
        }
      }

      setConversations(
        map
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur conversations demandes :",
        error
      );
    }
  }

  async function handleCancel(
    request: AdoptionRequest
  ) {
    if (
      !request?.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment annuler cette demande d'adoption ?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setCancellingId(
        request.id
      );

      const user =
        await getCurrentUser();

      if (!user) {
        alert(
          "Vous devez être connecté."
        );

        return;
      }

      await cancelAdoptionRequest(
        request.id,
        user.id
      );

      setRequests(
        (
          previous
        ) =>
          previous.map(
            (
              item
            ) =>
              item.id ===
              request.id
                ? {
                    ...item,
                    status:
                      "cancelled",
                  }
                : item
          )
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur annulation demande :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'annuler la demande."
      );
    } finally {
      setCancellingId(
        null
      );
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Mes demandes d&apos;adoption
      </h2>

      {requests.length ===
      0 ? (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Tu n&apos;as pas encore envoyé de demande d&apos;adoption.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
          >
            Voir les animaux
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(
            (
              request
            ) => {
              const animal =
                request.animals;

              const animalName =
                animal
                  ?.animal_name ||
                "Animal";

              const animalSubtitle =
                `${
                  animal
                    ?.animal_type ||
                  "Animal"
                } · ${
                  animal
                    ?.age_label ||
                  "Âge non renseigné"
                }`;

              const photos =
                Array.isArray(
                  animal
                    ?.animal_photos
                )
                  ? animal
                      ?.animal_photos
                  : [];

              const coverPhoto =
                photos.find(
                  (
                    photo
                  ) =>
                    photo
                      .is_cover
                ) ||
                photos[0];

              const photoUrl =
                coverPhoto
                  ?.photo_url ||
                "";

              const status =
                String(
                  request.status ||
                    "pending"
                )
                  .trim()
                  .toLowerCase();

              const canCancel =
                status ===
                  "pending" ||
                status ===
                  "en_attente";

              const conversationId =
                conversations[
                  request.id
                ];

              return (
                <article
                  key={
                    request.id
                  }
                  className="
                    rounded-[26px]
                    border
                    border-[#eadfce]
                    bg-[#f8f4ec]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-4

                      sm:flex-row
                      sm:items-center
                    "
                  >
                    {photoUrl ? (
                      <img
                        src={
                          photoUrl
                        }
                        alt={
                          animalName
                        }
                        className="
                          h-28
                          w-full
                          shrink-0
                          rounded-2xl
                          object-cover

                          sm:h-24
                          sm:w-24
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-24
                          w-24
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-[#eadfce]
                          text-3xl
                        "
                      >
                        🐾
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black text-[#2f241c]">
                        {animalName}
                      </h3>

                      <p className="mt-1 text-sm text-[#6f5a47]">
                        {animalSubtitle}
                      </p>

                      <p className="mt-1 text-sm text-[#6f5a47]">
                        Demande envoyée le{" "}
                        {formatDate(
                          request.created_at
                        )}
                      </p>

                      {typeof request.match_score ===
                        "number" && (
                        <span
                          className="
                            mt-3
                            inline-flex
                            rounded-full
                            bg-[#e8f5f1]
                            px-3
                            py-1.5
                            text-xs
                            font-black
                            text-[#064b42]
                          "
                        >
                          ❤️ Compatibilité{" "}
                          {
                            request.match_score
                          }
                          %
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {animal?.id && (
                        <Link
                          href={`/animal/${animal.id}`}
                          className="
                            rounded-full
                            bg-[#2f241c]
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                          "
                        >
                          Voir l&apos;animal
                        </Link>
                      )}

                      {conversationId && (
                        <Link
                          href={`/messages/${conversationId}`}
                          className="
                            rounded-full
                            bg-[#064b42]
                            px-4
                            py-2.5
                            text-sm
                            font-black
                            text-white
                          "
                        >
                          💬 Messages
                        </Link>
                      )}
                    </div>
                  </div>

                  <AdoptionStatus
                    status={
                      status
                    }
                  />

                  {canCancel && (
                    <div className="mt-4">
                      <button
                        type="button"
                        disabled={
                          cancellingId ===
                          request.id
                        }
                        onClick={() =>
                          handleCancel(
                            request
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-[#df8995]
                          bg-white
                          px-5
                          py-2.5
                          text-sm
                          font-bold
                          text-[#d96f81]
                          disabled:opacity-50
                        "
                      >
                        {cancellingId ===
                        request.id
                          ? "Annulation..."
                          : "Annuler ma demande"}
                      </button>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function AdoptionStatus({
  status,
}: {
  status: string;
}) {
  if (
    status ===
    "meeting"
  ) {
    return (
      <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="font-black text-orange-700">
          🤝 Rencontre proposée
        </div>

        <p className="mt-1 text-sm text-orange-700">
          L&apos;association souhaite passer à l&apos;étape de la rencontre avec vous.
        </p>
      </div>
    );
  }

  if (
    status ===
      "accepted"
  ) {
    return (
      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="font-black text-green-700">
          🎉 Adoption validée
        </div>

        <p className="mt-1 text-sm text-green-700">
          Votre demande d&apos;adoption a été acceptée par l&apos;association.
        </p>
      </div>
    );
  }

  if (
    status ===
      "rejected" ||
    status ===
      "refused"
  ) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="font-black text-red-700">
          Adoption refusée
        </div>

        <p className="mt-1 text-sm text-red-700">
          L&apos;association n&apos;a pas retenu cette demande d&apos;adoption.
        </p>
      </div>
    );
  }

  if (
    status ===
    "cancelled"
  ) {
    return (
      <div className="mt-4 rounded-2xl bg-gray-100 p-4">
        <div className="font-black text-gray-600">
          Demande annulée
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-orange-100 bg-[#fff8ea] p-4">
      <div className="font-black text-[#b87518]">
        ⏳ Demande en attente
      </div>

      <p className="mt-1 text-sm text-[#8a6a3c]">
        L&apos;association étudie actuellement votre demande.
      </p>
    </div>
  );
}

function formatDate(
  date?: string
) {
  if (!date) {
    return "date inconnue";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}