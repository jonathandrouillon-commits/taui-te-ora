"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login?redirect=/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
      <p className="text-[#064b42] font-bold">
        Redirection vers votre profil...
      </p>
    </main>
  );
}