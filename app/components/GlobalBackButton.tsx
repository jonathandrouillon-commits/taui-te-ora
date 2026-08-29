"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

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
   * Sur PC et tablette, nous recréons le bloc gauche du header :
   *
   * [ Retour ] [ logo TAUI TE ORA + nom + slogan ]
   *
   * Cela empêche définitivement le bouton Retour de cacher
   * le logo ou le nom de l'application.
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
   * VERSION DASHBOARDS ASSOCIATION / BENEVOLE / REFUGE / FOURRIERE
   *
   * On ajoute un fond blanc derrière la zone gauche du header afin
   * de masquer proprement l'ancien emplacement de la marque.
   * Aucun changement n'est fait au reste du dashboard.
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
        <button
          type="button"
          onClick={
            handleBack
          }
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

        <div
          className="
            ml-5
            flex
            min-w-[245px]
            items-center
            gap-3
          "
        >
          <div
            className="
              relative
              h-[58px]
              w-[58px]
              shrink-0
            "
          >
            <Image
              src="/logo.png"
              alt="Logo TAUI TE ORA"
              fill
              priority
              sizes="58px"
              className="
                object-contain
              "
            />
          </div>

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
   * Le logo reste géré par le header existant.
   * On garde seulement un petit bouton Retour.
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
