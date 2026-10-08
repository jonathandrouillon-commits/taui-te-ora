
"use client";

import { useEffect, useState } from "react";

export default function TauiSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean })
          .standalone === true);

    if (!standalone) return;

    try {
      if (sessionStorage.getItem("taui-splash-shown")) {
        return;
      }

      sessionStorage.setItem("taui-splash-shown", "1");
    } catch {
      // Continuer même si le stockage est indisponible.
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 0);

    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, 1500);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 1900);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-[400ms]"
      style={{
        backgroundColor: "#F4EEE3",
        opacity: closing ? 0 : 1,
        pointerEvents: closing ? "none" : "auto",
      }}
    >
      <div className="flex w-full flex-col items-center justify-center px-8">
        <img
          src="/taui-splash-logo.png"
          alt=""
          className="h-auto w-[min(72vw,310px)] object-contain"
        />

        <div className="mt-8 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-[#064b42]">
            TAUI TE ORA
          </p>

          <p className="mt-2 text-xs italic text-[#956f54]">
            Changer de Vie
          </p>
        </div>
      </div>
    </div>
  );
}
