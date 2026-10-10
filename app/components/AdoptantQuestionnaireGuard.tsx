"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const QUESTIONNAIRE = "/adoptant/questionnaire";
const EXEMPT = [
  "/login", "/register", "/choose-role", "/forgot-password",
  "/reset-password", "/update-password", "/confidentialite",
  "/notifications/setup", "/auth", "/callback"
];

function exempt(path: string) {
  return path === QUESTIONNAIRE || EXEMPT.some(p => path === p || path.startsWith(p + "/"));
}

export default function AdoptantQuestionnaireGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (exempt(pathname)) {
      queueMicrotask(() => { if (!cancelled) setBlocked(false); });
      return () => { cancelled = true; };
    }
    async function check() {
      setBlocked(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authError || !user) { setBlocked(false); return; }
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, adopter_questionnaire_completed_at")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) { console.error("Contrôle questionnaire :", error); setBlocked(false); return; }
        if (profile?.role === "adoptant" && !profile.adopter_questionnaire_completed_at) {
          const redirect = pathname + (window.location.search || "");
          router.replace(QUESTIONNAIRE + "?redirect=" + encodeURIComponent(redirect));
          return;
        }
        setBlocked(false);
      } catch (error) {
        console.error("Contrôle questionnaire :", error);
        if (!cancelled) setBlocked(false);
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (!blocked || exempt(pathname)) return null;
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8f4ec] p-6 text-center font-bold text-[#064b42]" aria-live="polite">Vérification de votre profil…</div>;
}
