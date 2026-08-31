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
   * Sur PC et tablette :
   *
   * [ Retour ] [ TAUI TE ORA + slogan ]
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
   * VERSION PC / TABLETTE
   * ASSOCIATION / BENEVOLE / REFUGE / FOURRIERE
   */
  if (
    isPublisherDashboard &&
    !editMode
  ) {
    return (
      <div
        className="
          fixed
          left-0
          top-0
          z-[9900]
          hidden
          h-[88px]
          items-center
          bg-white
          pl-5
          pr-5
          shadow-[8px_0_18px_rgba(0,0,0,0.015)]

          md:flex
        "
      >
        {/* RETOUR */}

        <button
          type="button"
          onClick={handleBack}
          aria-label="Retour"
          className="
            flex
            h-12
            shrink-0
            items-center
            justify-center
            gap-1.5
            rounded-full
            border
            border-[#eadfd8]
            bg-white
            px-4
            text-sm
            font-black
            text-[#064b42]
            shadow-md
            transition

            hover:bg-[#fffdf9]
            active:scale-[0.96]
          "
        >
          <ChevronLeft
            size={19}
            strokeWidth={3}
          />

          <span>
            Retour
          </span>
        </button>

        {/* MARQUE TAUI TE ORA */}

        <div
          className="
            ml-6
            flex
            min-w-[190px]
            items-center
          "
        >
          <div
            className="
              min-w-0
              leading-none
            "
          >
            <div
              className="
                whitespace-nowrap
                text-[20px]
                font-black
                tracking-[0.02em]
                text-[#064b42]

                lg:text-[22px]
              "
            >
              TAUI TE ORA
            </div>

            <div
              className="
                mt-2
                whitespace-nowrap
                text-[12px]
                font-medium
                text-[#746b64]

                lg:text-[13px]
              "
            >
              Ensemble pour la vie
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * VERSION MOBILE DES DASHBOARDS PUBLISHER
   *
   * On garde seulement le bouton Retour.
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
          left-3
          top-3
          z-[9900]
          flex
          h-11
          items-center
          justify-center
          gap-1
          rounded-full
          border
          border-[#eadfd8]
          bg-white/95
          px-3
          text-[13px]
          font-black
          text-[#064b42]
          shadow-md
          backdrop-blur-md

          md:hidden
        "
      >
        <ChevronLeft
          size={18}
          strokeWidth={3}
        />

        Retour
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