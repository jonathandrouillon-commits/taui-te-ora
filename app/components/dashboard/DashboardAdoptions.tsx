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

import type {
  AdoptionRequest,
} from "../../lib/dashboard";

type DashboardAdoptionsProps = {
  adoptionRequests: AdoptionRequest[];
};

export default function DashboardAdoptions({
  adoptionRequests,
}: DashboardAdoptionsProps) {
  const [
    requests,
    setRequests,
  ] =
    useState<AdoptionRequest[]>(
      adoptionRequests
    );

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    setRequests(
      adoptionRequests
    );
  }, [
    adoptionRequests,
  ]);

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
            Tu n&apos;as pas
            encore envoyé de
            demande
            d&apos;adoption.
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
                animal?.animal_name ||
                "Animal";

              const animalSubtitle =
                `${
                  animal?.animal_type ||
                  "Animal"
                } · ${
                  animal?.age_label ||
                  "Âge non renseigné"
                }`;

              const photos =
                Array.isArray(
                  animal?.animal_photos
                )
                  ? animal
                      ?.animal_photos
                  : [];

              const coverPhoto =
                photos.find(
                  (
                    photo
                  ) =>
                    photo.is_cover
                ) ||
                photos[0];

              const photoUrl =
                coverPhoto?.photo_url ||
                "";

              const canCancel =
                request.status ===
                  "pending" ||
                request.status ===
                  "en_attente" ||
                !request.status;

              return (
                <div
                  key={
                    request.id
                  }
                  className="
                    flex
                    flex-col
                    gap-4
                    rounded-2xl
                    border
                    border-[#eadfce]
                    bg-[#f8f4ec]
                    p-4

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
                        h-24
                        w-full
                        shrink-0
                        rounded-2xl
                        object-cover

                        sm:h-20
                        sm:w-20
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-20
                        w-20
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
                    <h3 className="font-bold text-[#2f241c]">
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
                      <div className="mt-2">
                        <span
                          className="
                            inline-flex
                            rounded-full
                            bg-[#e8f5f1]
                            px-3
                            py-1
                            text-xs
                            font-black
                            text-[#064b42]
                          "
                        >
                          ❤️ Match{" "}
                          {
                            request.match_score
                          }
                          %
                        </span>
                      </div>
                    )}

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(
                        request.status
                      )}
                    </span>
                  </div>

                  <div
                    className="
                      flex
                      shrink-0
                      flex-wrap
                      gap-2

                      sm:flex-col
                    "
                  >
                    {animal?.id && (
                      <Link
                        href={`/animal/${animal.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-full
                          bg-[#2f241c]
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        Voir
                      </Link>
                    )}

                    {canCancel && (
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
                          inline-flex
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-[#df8995]
                          bg-white
                          px-4
                          py-2
                          text-sm
                          font-bold
                          text-[#d96f81]
                          transition
                          hover:bg-[#fff0f2]
                          disabled:opacity-50
                        "
                      >
                        {cancellingId ===
                        request.id
                          ? "Annulation..."
                          : "Annuler ma demande"}
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function getStatusLabel(
  status?: string
) {
  if (
    status ===
    "accepted"
  )
    return "Acceptée";

  if (
    status ===
      "refused" ||
    status ===
      "rejected"
  )
    return "Refusée";

  if (
    status ===
    "cancelled"
  )
    return "Annulée";

  if (
    status ===
    "pending"
  )
    return "En attente";

  return "En attente";
}

function getStatusStyle(
  status?: string
) {
  if (
    status ===
    "accepted"
  )
    return "bg-green-100 text-green-700";

  if (
    status ===
      "refused" ||
    status ===
      "rejected"
  )
    return "bg-red-100 text-red-700";

  if (
    status ===
    "cancelled"
  )
    return "bg-gray-200 text-gray-600";

  return "bg-orange-100 text-orange-700";
}

function formatDate(
  date?: string
) {
  if (!date)
    return "date inconnue";

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