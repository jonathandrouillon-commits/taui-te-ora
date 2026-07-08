"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signalement");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
      <p className="font-bold text-[#064b42]">
        Redirection vers le formulaire de signalement...
      </p>
    </main>
  );
}