"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const hiddenRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
    "/choose-role",
  ];

  const isWalkPage = pathname.startsWith("/balades");
  const isDonationPage = pathname === "/dons";
  const isDashboardPage =
    pathname === "/dashboard" ||
    pathname.endsWith("/dashboard");

  if (
    hiddenRoutes.includes(pathname) ||
    isWalkPage ||
    isDonationPage ||
    isDashboardPage
  ) {
    return null;
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Retour"
      className="
        fixed
        left-4
        top-4
        z-[350]
        flex
        h-10
        items-center
        gap-1
        rounded-full
        border
        border-[#eadfd8]
        bg-white/90
        px-3
        text-sm
        font-black
        text-[#064b42]
        shadow-md
        backdrop-blur-md
        transition
        hover:bg-white
        active:scale-[0.96]
      "
    >
      <ChevronLeft size={18} strokeWidth={3} />

      <span>Retour</span>
    </button>
  );
}
