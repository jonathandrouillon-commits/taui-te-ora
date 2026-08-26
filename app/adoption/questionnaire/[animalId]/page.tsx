"use client";

import {
  useEffect,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

export default function AdoptionQuestionnaireRedirectPage() {
  const router = useRouter();
  const params = useParams();

  const animalId =
    Array.isArray(
      params.animalId
    )
      ? params.animalId[0]
      : String(
          params.animalId || ""
        );

  useEffect(() => {
    if (!animalId) {
      router.replace("/");
      return;
    }

    router.replace(
      `/adoption/start/${encodeURIComponent(
        animalId
      )}`
    );
  }, [animalId, router]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4eee3] px-6 text-[#064b42]">
      <div className="w-full max-w-sm rounded-[30px] bg-white/90 p-8 text-center shadow-xl">
        <img
          src="/logo-taui-te-ora.png"
          alt="Taui Te Ora"
          className="mx-auto h-24 w-24 object-contain"
        />

        <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

        <p className="mt-5 text-base font-black">
          Préparation de votre demande d’adoption...
        </p>
      </div>
    </main>
  );
}
