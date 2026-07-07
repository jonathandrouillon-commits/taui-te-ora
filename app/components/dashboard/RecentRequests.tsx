"use client";

import { useRouter } from "next/navigation";

type RequestItem = {
  id: string;
  statut?: string | null;
  motivation?: string | null;
  created_at?: string | null;
};

type RecentRequestsProps = {
  requests: RequestItem[];
};

export default function RecentRequests({ requests }: RecentRequestsProps) {
  const router = useRouter();

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[#064b42]">
          Dernières demandes
        </h2>

        <button
          type="button"
          onClick={() => router.push("/association/demandes")}
          className="rounded-xl bg-[#f4eee3] px-4 py-2 text-sm font-bold text-[#064b42]"
        >
          Tout voir
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-600">Aucune demande récente.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => router.push(`/association/demandes/${request.id}`)}
              className="block w-full rounded-2xl bg-[#f4eee3] p-4 text-left transition hover:bg-[#eadfcf]"
            >
              <p className="text-sm font-black uppercase text-[#b68b2f]">
                {request.statut || "nouvelle"}
              </p>

              <p className="mt-1 font-black text-[#064b42]">
                Demande d’adoption
              </p>

              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {request.motivation || "Aucune motivation renseignée."}
              </p>

              {request.created_at && (
                <p className="mt-2 text-xs font-bold text-gray-400">
                  {new Date(request.created_at).toLocaleString("fr-FR")}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}