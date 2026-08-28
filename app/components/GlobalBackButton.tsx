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

  const isPublisherDashboard =
    pathname === "/association/dashboard" ||
    pathname === "/benevole/dashboard" ||
    pathname === "/refuge/dashboard" ||
    pathname === "/fourriere/dashboard" ||
    pathname === "/sigfa/dashboard";

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

  /*
   * DASHBOARDS
   * Association / Bénévole / Refuge / Fourrière / SIGFA
   *
   * IMPORTANT :
   * On n'ajoute PLUS de logo ni de texte ici.
   * La barre principale conserve son logo TAUI TE ORA.
   */
  if (isPublisherDashboard && !editMode) {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label="Retour"
        className="
          fixed
          left-5
          top-[18px]
          z-[9900]

          flex
          h-12
          items-center
          justify-center
          gap-1.5

          rounded-full
          border
          border-[#eadfd8]

          bg-white/95
          px-5

          text-sm
          font-black
          text-[#064b42]

          shadow-md
          backdrop-blur-md

          transition

          hover:bg-white
          active:scale-[0.96]

          max-md:left-3
          max-md:top-3
          max-md:h-11
          max-md:px-3
          max-md:text-[13px]
        "
      >
        <ChevronLeft
          size={19}
          strokeWidth={3}
        />

        <span className="whitespace-nowrap">
          Retour
        </span>
      </button>
    );
  }

  return (
    <>
      {isAdminPage && !editMode ? (
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
        />

        <span className="whitespace-nowrap">
          {editMode
            ? "Retour à la gestion"
            : "Retour"}
        </span>
      </button>
    </>
  );
}