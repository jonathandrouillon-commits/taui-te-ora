"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();
  const animalId = String(params.animalId);

  useEffect(() => {
    checkUser();
  }, [animalId]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push(`/login?redirect=/adoption/questionnaire/${animalId}`);
      return;
    }

    router.push(`/adoption/questionnaire/${animalId}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
      <p className="text-xl font-black">
        Préparation du questionnaire...
      </p>
    </main>
  );
}