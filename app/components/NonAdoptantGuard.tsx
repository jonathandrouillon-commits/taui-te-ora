"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";
import { animalService } from "../services/animal.service";

export function getRoleDestination(
  roleValue: unknown
) {
  const role = String(
    roleValue || ""
  )
    .trim()
    .toLowerCase();

  switch (role) {
    case "adoptant":
      return "/profile";

    case "association":
      return "/association/dashboard";

    case "refuge":
      return "/refuge/dashboard";

    case "fourriere":
      return "/fourriere/dashboard";

    case "benevole":
      return "/benevole/dashboard";

    case "admin":
      return "/admin/dashboard";

    default:
      return "/";
  }
}

export default function NonAdoptantGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const checkRole = useCallback(async () => {
    try {
      /* =====================================================
         1. UTILISATEUR CONNECTÉ
      ===================================================== */

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* =====================================================
         2. PROFIL / RÔLE
         SOURCE UNIQUE : profiles
      ===================================================== */

      const access =
        await animalService.getCurrentUserAccess();

      /* =====================================================
         3. PAS DE RÔLE
      ===================================================== */

      if (!access.role) {
        router.replace(
          "/choose-role"
        );

        return;
      }

      /* =====================================================
         4. COMPTE INACTIF
      ===================================================== */

      if (!access.isActive) {
        router.replace("/");
        return;
      }

      /* =====================================================
         5. COMPTE REFUSÉ / SUSPENDU
      ===================================================== */

      if (
        access.approvalStatus ===
          "rejected" ||
        access.approvalStatus ===
          "suspended"
      ) {
        router.replace("/");
        return;
      }

      /* =====================================================
         6. ADOPTANT INTERDIT ICI
      ===================================================== */

      if (
        access.role === "adoptant"
      ) {
        router.replace(
          "/profile"
        );

        return;
      }
    } catch (error) {
      console.error(
        "Erreur vérification rôle :",
        error
      );

      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void checkRole());
  }, [checkRole]);

  return <>{children}</>;
}