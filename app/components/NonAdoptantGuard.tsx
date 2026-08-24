"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export function getRoleDestination(
  roleValue: unknown
) {
  const role = String(roleValue || "")
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

  useEffect(() => {
    checkRole();
  }, []);

  async function checkRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    let role =
      String(
        user.user_metadata?.role || ""
      )
        .trim()
        .toLowerCase();

    if (!role) {
      const { data: profile } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      role =
        String(profile?.role || "")
          .trim()
          .toLowerCase();
    }

    if (role === "adoptant") {
      router.replace("/profile");
    }
  }

  return <>{children}</>;
}