"use client";

import Link from "next/link";
import type { AdoptionRequest } from "../../lib/dashboard";

type DashboardAdoptionsProps = {
  adoptionRequests: AdoptionRequest[];
};

export default function DashboardAdoptions({
  adoptionRequests,
}: DashboardAdoptionsProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Mes demandes d'adoption
      </h2>

      {adoptionRequests.length === 0 ? (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Tu n'as pas encore envoyé de demande d'adoption.
          </p>

          <Link
            href="/adoption"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
          >
            Voir les animaux
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {adoptionRequests.map((request) => {
            const animal = request.animals;
            const animalName = animal?.animal_name || "Animal";
            const animalSubtitle = `${animal?.animal_type || "Animal"} · ${
              animal?.age_label || "Âge non renseigné"
            }`;

            return (
              <div
                key={request.id}
                className="flex items-center gap-4 rounded-2xl border border-[#eadfce] bg-[#f8f4ec] p-4"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#eadfce] text-3xl">
                  🐶
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-[#2f241c]">
                    {animalName}
                  </h3>

                  <p className="mt-1 text-sm text-[#6f5a47]">
                    {animalSubtitle}
                  </p>

                  <p className="mt-1 text-sm text-[#6f5a47]">
                    Demande envoyée le {formatDate(request.created_at)}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                {animal?.id && (
                  <Link
                    href={`/animal/${animal.id}`}
                    className="hidden rounded-full bg-[#2f241c] px-4 py-2 text-sm font-semibold text-white sm:inline-block"
                  >
                    Voir
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getStatusLabel(status?: string) {
  if (status === "accepted") return "Acceptée";
  if (status === "refused") return "Refusée";
  if (status === "rejected") return "Refusée";
  if (status === "pending") return "En attente";
  return "En attente";
}

function getStatusStyle(status?: string) {
  if (status === "accepted") return "bg-green-100 text-green-700";
  if (status === "refused" || status === "rejected") return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
}

function formatDate(date?: string) {
  if (!date) return "date inconnue";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}