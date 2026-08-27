"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditMode(params.get("edit") === "1");
    setQueryReady(true);
  }, [pathname]);

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
  const isAdminPage = pathname.startsWith("/admin");

  /*
   * En mode edition visuelle, le bouton Retour doit toujours etre visible,
   * y compris sur /dons et /balades.
   */
  if (
    !queryReady ||
    (!editMode &&
      (hiddenRoutes.includes(pathname) ||
        isWalkPage ||
        isDonationPage))
  ) {
    return null;
  }

  function handleBack() {
    /*
     * Depuis l'editeur visuel, on revient toujours a la gestion des pages.
     */
    if (editMode) {
      router.push("/admin/pages");
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <>
      {isAdminPage && !editMode ? (
        /*
         * Ce spacer reserve une vraie zone au-dessus des pages admin.
         * Le bouton fixe ne recouvre donc plus "Administration" ou les titres.
         */
        <div
          aria-hidden="true"
          className="h-16 sm:h-[72px]"
        />
      ) : null}

      <button
        type="button"
        onClick={handleBack}
        aria-label={
          editMode
            ? "Retour a la gestion des pages"
            : "Retour"
        }
        className={`
          fixed
          left-4
          z-[9900]
          flex
          min-h-[44px]
          items-center
          gap-1.5
          rounded-full
          border
          border-[#eadfd8]
          bg-white/95
          px-4
          text-sm
          font-black
          text-[#064b42]
          shadow-md
          backdrop-blur-md
          transition
          hover:bg-white
          active:scale-[0.96]
          ${
            editMode
              ? "top-[84px] sm:top-[78px]"
              : "top-4"
          }
        `}
      >
        <ChevronLeft
          size={18}
          strokeWidth={3}
        />

        <span>
          {editMode
            ? "Retour à la gestion"
            : "Retour"}
        </span>
      </button>
    </>
  );
}
