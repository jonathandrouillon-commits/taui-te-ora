"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { supabase } from "../lib/supabase";

const VISITOR_KEY = "taui_visitor_id";

function createVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    let visitorId =
      window.localStorage.getItem(VISITOR_KEY);

    if (!visitorId) {
      visitorId = crypto.randomUUID();

      window.localStorage.setItem(
        VISITOR_KEY,
        visitorId
      );
    }

    return visitorId;
  } catch {
    /*
     * Certains navigateurs peuvent bloquer
     * localStorage. Dans ce cas, on n'empêche
     * surtout pas le fonctionnement du site.
     */
    return "";
  }
}

function shouldTrackPath(pathname: string) {
  if (!pathname.startsWith("/")) {
    return false;
  }

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return false;
  }

  if (
    pathname === "/api" ||
    pathname.startsWith("/api/")
  ) {
    return false;
  }

  return true;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const currentPath =
      pathname?.trim() || "/";

    if (!shouldTrackPath(currentPath)) {
      return;
    }

    async function trackVisit() {
      try {
        const visitorId =
          createVisitorId();

        if (!visitorId) {
          return;
        }

        const { error } =
          await supabase.rpc(
            "track_page_view",
            {
              p_visitor_id:
                visitorId,
              p_path:
                currentPath,
            }
          );

        if (error) {
          console.error(
            "Erreur analytics :",
            error
          );
        }
      } catch (error) {
        console.error(
          "Erreur analytics :",
          error
        );
      }
    }

    void trackVisit();
  }, [pathname]);

  return null;
}