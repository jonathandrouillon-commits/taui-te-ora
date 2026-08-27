"use client";

import { useEffect, useState } from "react";

type PushState =
  | "loading"
  | "ready"
  | "enabled"
  | "disabled"
  | "denied"
  | "unsupported"
  | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function DashboardPushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function detectState() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (active) setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (active) {
          setEnabled(false);
          setState("denied");
        }
        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.getRegistration("/");

        const subscription =
          await registration?.pushManager.getSubscription();

        const isEnabled =
          Notification.permission === "granted" &&
          Boolean(subscription);

        if (!active) return;

        setEnabled(isEnabled);
        setState(isEnabled ? "enabled" : "ready");
      } catch (error) {
        console.error("Détection notifications push :", error);

        if (active) {
          setEnabled(false);
          setState("error");
        }
      }
    }

    void detectState();

    return () => {
      active = false;
    };
  }, []);

  async function enableNotifications() {
    setSaving(true);
    setMessage("");

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error(
          "Les notifications ne sont pas disponibles sur cet appareil."
        );
      }

      let permission = Notification.permission;

      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        if (permission === "denied") {
          setState("denied");
          throw new Error(
            "Les notifications sont bloquées dans les réglages de votre navigateur ou téléphone."
          );
        }

        throw new Error(
          "L’autorisation d’envoyer des notifications n’a pas été accordée."
        );
      }

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "La clé publique VAPID n’est pas configurée."
        );
      }

      let registration =
        await navigator.serviceWorker.getRegistration("/");

      if (!registration) {
        registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
      }

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(publicKey),
          });
      }

      const json = subscription.toJSON();

      if (!json.keys?.p256dh || !json.keys?.auth) {
        throw new Error(
          "L’abonnement push est incomplet."
        );
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          alertLost: true,
          alertFound: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible d’activer les notifications."
        );
      }

      window.localStorage.setItem(
        "taui-push-preference",
        "both"
      );

      setEnabled(true);
      setState("enabled");
      setMessage("Notifications activées.");
    } catch (error) {
      console.error("Activation notifications :", error);

      setEnabled(false);

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        setState("denied");
      } else {
        setState("error");
      }

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’activer les notifications."
      );
    } finally {
      setSaving(false);
    }
  }

  async function disableNotifications() {
    setSaving(true);
    setMessage("");

    try {
      const registration =
        await navigator.serviceWorker.getRegistration("/");

      const subscription =
        await registration?.pushManager.getSubscription();

      if (subscription) {
        const json = subscription.toJSON();

        if (json.keys?.p256dh && json.keys?.auth) {
          const response = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
              alertLost: false,
              alertFound: false,
            }),
          });

          if (!response.ok) {
            const result = await response
              .json()
              .catch(() => null);

            throw new Error(
              result?.error ||
                "Impossible de désactiver les notifications."
            );
          }

          await subscription.unsubscribe();
        }
      }

      window.localStorage.removeItem(
        "taui-push-preference"
      );

      setEnabled(false);
      setState("disabled");
      setMessage("Notifications désactivées.");
    } catch (error) {
      console.error("Désactivation notifications :", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de désactiver les notifications."
      );
      setState("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (event.target.checked) {
      await enableNotifications();
      return;
    }

    await disableNotifications();
  }

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5e7ea] text-2xl">
          🔔
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Notifications
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Recevoir les alertes TAUI TE ORA sur cet appareil.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-full bg-[#f8f4ec] px-4 py-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) =>
                  void handleToggle(event)
                }
                disabled={
                  saving ||
                  state === "loading" ||
                  state === "unsupported"
                }
                className="h-5 w-5 accent-[#064b42]"
              />

              <span className="text-sm font-black text-[#064b42]">
                {saving
                  ? "En cours..."
                  : enabled
                    ? "Activées"
                    : "Activer"}
              </span>
            </label>
          </div>

          {state === "denied" ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Les notifications sont bloquées sur cet appareil.
              Autorise-les dans les réglages du navigateur ou du téléphone,
              puis recharge cette page.
            </p>
          ) : null}

          {state === "unsupported" ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Cet appareil ou ce navigateur ne prend pas en charge les notifications push.
            </p>
          ) : null}

          {message ? (
            <p
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                state === "enabled"
                  ? "bg-green-50 text-green-800"
                  : state === "disabled"
                    ? "bg-[#eef7f4] text-[#064b42]"
                    : "bg-amber-50 text-amber-800"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
