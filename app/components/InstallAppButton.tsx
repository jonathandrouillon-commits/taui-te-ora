"use client";

import {
  useEffect,
  useState,
} from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome:
      | "accepted"
      | "dismissed";
  }>;
};

export default function InstallAppButton() {
  const [
    installPrompt,
    setInstallPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  const [installed, setInstalled] =
    useState(false);

  const [isIos, setIsIos] =
    useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

    const iosStandalone =
      (window.navigator as any)
        .standalone === true;

    if (
      standalone ||
      iosStandalone
    ) {
      setInstalled(true);
    }

    const userAgent =
      window.navigator.userAgent.toLowerCase();

    setIsIos(
      /iphone|ipad|ipod/.test(
        userAgent
      )
    );

    function handleBeforeInstallPrompt(
      event: Event
    ) {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();

    const result =
      await installPrompt.userChoice;

    if (
      result.outcome === "accepted"
    ) {
      setInstalled(true);
    }

    setInstallPrompt(null);
  }

  if (installed) {
    return (
      <div
        className="
          rounded-[18px]
          bg-[#e8f7ee]
          px-4
          py-3
          text-center
          text-sm
          font-bold
          text-[#4b7660]
        "
      >
        ✓ Taui Te Ora est installée
      </div>
    );
  }

  if (installPrompt) {
    return (
      <button
        type="button"
        onClick={installApp}
        className="
          flex
          w-full
          items-center
          justify-center
          gap-3
          rounded-[20px]
          bg-[#ef8196]
          px-5
          py-4
          font-bold
          text-white
          shadow-lg
        "
      >
        <span className="text-2xl">
          📲
        </span>

        Installer Taui Te Ora
      </button>
    );
  }

  if (isIos) {
    return (
      <div
        className="
          rounded-[20px]
          bg-white
          p-4
          text-sm
          text-[#5d5954]
          shadow-sm
        "
      >
        <p className="font-bold">
          Installer Taui Te Ora
        </p>

        <p className="mt-2 leading-relaxed">
          Sur iPhone : appuyez sur
          Partager puis « Sur
          l&apos;écran d&apos;accueil ».
        </p>
      </div>
    );
  }

  return null;
}
