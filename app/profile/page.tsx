"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../lib/supabase";

export default function ProfileRedirectPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const checkUser = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login?redirect=/profile"
        );

        return;
      }

      const {
        data:
          profile,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        profileError
      ) {
        throw profileError;
      }

      const role =
        String(
          profile?.role ||
            ""
        )
          .trim()
          .toLowerCase();

      switch (
        role
      ) {
        case "admin":
          router.replace(
            "/admin/dashboard"
          );

          return;

        case "association":
          router.replace(
            "/association/dashboard"
          );

          return;

        case "refuge":
          router.replace(
            "/refuge/dashboard"
          );

          return;

        case "fourriere":
          router.replace(
            "/fourriere/dashboard"
          );

          return;

        case "benevole":
          router.replace(
            "/benevole/dashboard"
          );

          return;

        case "adoptant":
          router.replace(
            "/dashboard"
          );

          return;

        default:
          router.replace(
            "/dashboard"
          );

          return;
      }
    } catch (
      error
    ) {
      console.error(
        "Erreur redirection profil :",
        error
      );

      router.replace(
        "/dashboard"
      );
    } finally {
      setLoading(
        false
      );
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void checkUser());
  }, [checkUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
      <p className="font-bold text-[#064b42]">
        {loading
          ? "Ouverture de votre espace..."
          : "Redirection..."}
      </p>
    </main>
  );
}