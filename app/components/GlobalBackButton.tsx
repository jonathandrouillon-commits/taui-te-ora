"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const [editMode, setEditMode] =
    useState(false);

  const [queryReady, setQueryReady] =
    useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setEditMode(
      params.get("edit") === "1"
    );

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

  const isWalkPage =
    pathname.startsWith(
      "/balades"
    );

  const isDonationPage =
    pathname === "/dons";

  const isAnimalDetailPage =
    pathname.startsWith(
      "/animal/"
    );

  const isSignalementDetailPage =
    pathname.startsWith(
      "/signalement/"
    );

  const isAdminPage =
    pathname.startsWith(
      "/admin"
    );

  /*
   * Dashboards Publisher :
   * Association / bénévole / refuge / fourrière.
   *
   * IMPORTANT :
   * Le header du dashboard gère déjà le logo
   * et le nom TAUI TE ORA.
   *
   * Ici on affiche uniquement le bouton Retour
   * afin d'éviter tout doublon dans le header.
   */
  const isPublisherDashboard =
    pathname ===
      "/association/dashboard" ||
    pathname ===
      "/benevole/dashboard" ||
    pathname ===
      "/refuge/dashboard" ||
    pathname ===
      "/fourriere/dashboard";

  if (
    !queryReady ||
    (
      !editMode &&
      (
        hiddenRoutes.includes(
          pathname
        ) ||
        isWalkPage ||
        isDonationPage ||
        isAnimalDetailPage ||
        isSignalementDetailPage
      )
    )
  ) {
    return null;
  }

  function handleBack() {
    /*
     * En édition admin :
     * toujours revenir à Gestion des pages.
     */
    if (editMode) {
      router.push(
        "/admin/pages"
      );

      return;
    }

    if (
      window.history.length >
      1
    ) {
      router.back();

      return;
    }

    router.push("/");
  }

  /*
   * DASHBOARDS ASSOCIATION / BÉNÉVOLE /
   * REFUGE / FOURRIÈRE
   *
   * Uniquement le bouton Retour.
   * Aucun logo ni texte TAUI TE ORA ici :
   * ils restent gérés par le header existant.
   */
  if (
    isPublisherDashboard &&
    !editMode
  ) {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label="Retour"
        className="
          fixed
          left-4
          top-4
          z-[9900]
          flex
          min-h-[44px]
          items-center
          justify-center
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
        "
      >
        <ChevronLeft
          size={18}
          strokeWidth={3}
          className="
            shrink-0
          "
        />

        <span
          className="
            whitespace-nowrap
          "
        >
          Retour
        </span>
      </button>
    );
  }

  /*
   * AUTRES PAGES
   */

  return (
    <>
      {isAdminPage &&
      !editMode ? (
        <div
          aria-hidden="true"
          className="
            h-16
            sm:h-[72px]
          "
        />
      ) : null}

      <button
        type="button"
        onClick={handleBack}
        aria-label={
          editMode
            ? "Retour à la gestion des pages"
            : "Retour"
        }
        className={`
          fixed
          left-4
          z-[9900]
          flex
          min-h-[44px]
          items-center
          justify-center
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
          className="
            shrink-0
          "
        />

        <span
          className="
            whitespace-nowrap
          "
        >
          {editMode
            ? "Retour à la gestion"
            : "Retour"}
        </span>
      </button>
    </>
  );
}
