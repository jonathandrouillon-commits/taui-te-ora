"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let cancelled = false;

    async function registerServiceWorker() {
      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });

        if (cancelled) {
          return;
        }

        /*
         * Vérifie immédiatement si une nouvelle version
         * du Service Worker est disponible.
         */
        await registration.update();

        /*
         * Puis vérifie périodiquement.
         * Une heure évite de solliciter inutilement le serveur.
         */
        const updateInterval = window.setInterval(() => {
          void registration.update().catch((error) => {
            console.error(
              "Mise à jour PWA Taui Te Ora :",
              error
            );
          });
        }, 60 * 60 * 1000);

        return () => {
          window.clearInterval(updateInterval);
        };
      } catch (error) {
        console.error(
          "Erreur PWA Taui Te Ora :",
          error
        );
      }

      return undefined;
    }

    let cleanup:
      | (() => void)
      | undefined;

    void registerServiceWorker().then((result) => {
      cleanup = result;
    });

    return () => {
      cancelled = true;

      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return null;
}