"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const VISITOR_KEY = "taui_visitor_id";

function createVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  let visitorId = localStorage.getItem(VISITOR_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  return visitorId;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    async function trackVisit() {
      try {
        const visitorId = createVisitorId();

        if (!visitorId) {
          return;
        }

        const { error } = await supabase.rpc(
          "track_page_view",
          {
            p_visitor_id: visitorId,
            p_path: pathname || "/",
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