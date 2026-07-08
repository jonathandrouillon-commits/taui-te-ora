"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdoptantQuestionnaireRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
      <p className="font-bold text-[#064b42]">
        Redirection vers votre questionnaire...
      </p>
    </main>
  );
}