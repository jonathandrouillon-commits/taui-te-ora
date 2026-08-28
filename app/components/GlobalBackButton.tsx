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
   * Dashboards qui possèdent déjà leur propre en-tête TAUI TE ORA.
   * Ici le bouton doit rester compact pour ne jamais cacher le logo / nom.
   */
  const isPublisherDashboard =
    pathname === "/association/dashboard" ||
    pathname === "/benevole/dashboard" ||
    pathname === "/refuge/dashboard" ||
    pathname === "/fourriere/dashboard";

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

  return (
    <>
      {isAdminPage && !editMode ? (
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
            ? "Retour à la gestion des pages"
            : "Retour"
        }
        className={`
          fixed
          z-[9900]
          flex
          items-center
          justify-center
          gap-1
          rounded-full
          border
          border-[#eadfd8]
          bg-white/95
          font-black
          text-[#064b42]
          shadow-md
          backdrop-blur-md
          transition
          hover:bg-white
          active:scale-[0.96]

          ${
            editMode
              ? "left-4 top-[84px] min-h-[44px] px-4 text-sm sm:top-[78px]"
              : isPublisherDashboard
                ? `
                    left-3
                    top-4
                    h-11
                    min-w-[108px]
                    px-3
                    text-[13px]

                    sm:left-4
                    sm:h-12
                    sm:min-w-[116px]
                    sm:px-3.5
                    sm:text-sm

                    lg:left-5
                  `
                : `
                    left-4
                    top-4
                    min-h-[44px]
                    px-4
                    text-sm
                  `
          }
        `}
      >
        <ChevronLeft
          size={18}
          strokeWidth={3}
          className="shrink-0"
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