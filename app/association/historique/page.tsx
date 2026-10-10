
import { Suspense } from "react";
import AssociationHistoriqueClient from "./AssociationHistoriqueClient";

export default function AssociationHistoriquePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 text-[#064b42]">
          <div className="mx-auto max-w-6xl rounded-3xl bg-white p-6">
            Chargement de l'historique…
          </div>
        </main>
      }
    >
      <AssociationHistoriqueClient />
    </Suspense>
  );
}
