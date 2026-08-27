"use client";

import {
  useEffect,
  useState,
} from "react";

type AlertPreference =
  | "lost"
  | "found"
  | "both";

type PushState =
  | "loading"
  | "ready"
  | "enabled"
  | "denied"
  | "unsupported"
  | "error";

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    "=".repeat(
      (4 -
        (base64String.length %
          4)) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (character) =>
        character.charCodeAt(0)
    )
  );
}

function preferenceToValues(
  preference: AlertPreference
) {
  return {
    alertLost:
      preference === "lost" ||
      preference === "both",

    alertFound:
      preference === "found" ||
      preference === "both",
  };
}

export default function LostFoundPushPreferences() {
  const [
    state,
    setState,
  ] =
    useState<PushState>(
      "loading"
    );

  const [
    selected,
    setSelected,
  ] =
    useState<AlertPreference | null>(
      null
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    activating,
    setActivating,
  ] =
    useState<AlertPreference | null>(
      null
    );

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      !(
        "serviceWorker" in
        navigator
      ) ||
      !(
        "PushManager" in
        window
      ) ||
      !(
        "Notification" in
        window
      )
    ) {
      setState(
        "unsupported"
      );

      return;
    }

    if (
      Notification.permission ===
      "denied"
    ) {
      setState("denied");

      return;
    }

    const stored =
      window.localStorage.getItem(
        "taui-push-preference"
      );

    if (
      stored === "lost" ||
      stored === "found" ||
      stored === "both"
    ) {
      setSelected(stored);
    }

    setState(
      Notification.permission ===
        "granted"
        ? "enabled"
        : "ready"
    );
  }, []);

  async function activate(
    preference: AlertPreference
  ) {
    setActivating(
      preference
    );

    setMessage("");

    try {
      if (
        !(
          "serviceWorker" in
          navigator
        ) ||
        !(
          "PushManager" in
          window
        ) ||
        !(
          "Notification" in
          window
        )
      ) {
        throw new Error(
          "Les notifications push ne sont pas disponibles sur cet appareil."
        );
      }

      const publicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "La clé publique VAPID n'est pas configurée."
        );
      }

      /*
       * IMPORTANT :
       * cette demande apparaît directement
       * après le clic de l'utilisateur.
       */
      let permission =
        Notification.permission;

      if (
        permission ===
        "default"
      ) {
        permission =
          await Notification.requestPermission();
      }

      if (
        permission !==
        "granted"
      ) {
        if (
          permission ===
          "denied"
        ) {
          setState(
            "denied"
          );

          throw new Error(
            "Les notifications ont été refusées. Vous pouvez les réactiver dans les réglages de votre téléphone ou navigateur."
          );
        }

        throw new Error(
          "L'autorisation de notification n'a pas été accordée."
        );
      }

      /*
       * On utilise le service worker
       * PWA existant de Taui Te Ora.
       */
      let registration =
        await navigator
          .serviceWorker
          .getRegistration(
            "/"
          );

      if (
        !registration
      ) {
        registration =
          await navigator
            .serviceWorker
            .register(
              "/sw.js",
              {
                scope: "/",
              }
            );
      }

      await navigator
        .serviceWorker
        .ready;

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (
        !subscription
      ) {
        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,

              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            });
      }

      const json =
        subscription.toJSON();

      if (
        !json.keys?.p256dh ||
        !json.keys?.auth
      ) {
        throw new Error(
          "L'abonnement push est incomplet."
        );
      }

      const values =
        preferenceToValues(
          preference
        );

      const response =
        await fetch(
          "/api/push/subscribe",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                endpoint:
                  subscription.endpoint,

                p256dh:
                  json.keys
                    .p256dh,

                auth:
                  json.keys
                    .auth,

                alertLost:
                  values.alertLost,

                alertFound:
                  values.alertFound,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Impossible d'enregistrer les notifications."
        );
      }

      window.localStorage.setItem(
        "taui-push-preference",
        preference
      );

      setSelected(
        preference
      );

      setState(
        "enabled"
      );

      if (
        preference ===
        "lost"
      ) {
        setMessage(
          "Alertes animaux perdus activées."
        );
      } else if (
        preference ===
        "found"
      ) {
        setMessage(
          "Alertes animaux trouvés activées."
        );
      } else {
        setMessage(
          "Alertes animaux perdus et trouvés activées."
        );
      }
    } catch (
      caughtError
    ) {
      console.error(
        "Activation push Taui Te Ora :",
        caughtError
      );

      setState(
        Notification.permission ===
          "denied"
          ? "denied"
          : "error"
      );

      setMessage(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Impossible d'activer les notifications."
      );
    } finally {
      setActivating(
        null
      );
    }
  }

  if (
    state ===
    "unsupported"
  ) {
    return (
      <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg sm:p-8">
        <h2 className="text-xl font-black text-[#064b42] sm:text-2xl">
          🔔 Alertes animaux
        </h2>

        <p className="mt-3 text-sm text-[#6f5a47]">
          Les notifications
          push ne sont pas
          disponibles sur cet
          appareil ou ce
          navigateur.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg sm:p-8">
      <div className="text-center">
        <div className="text-4xl">
          🔔
        </div>

        <h2 className="mt-3 text-2xl font-black text-[#064b42]">
          Recevoir les alertes
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6f5a47]">
          Soyez prévenu
          immédiatement
          lorsqu&apos;un animal
          est signalé perdu ou
          trouvé.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <PushButton
          active={
            selected ===
            "lost"
          }
          loading={
            activating ===
            "lost"
          }
          disabled={
            activating !==
            null
          }
          onClick={() =>
            activate(
              "lost"
            )
          }
          icon="🔎"
          title="Animaux perdus"
        />

        <PushButton
          active={
            selected ===
            "found"
          }
          loading={
            activating ===
            "found"
          }
          disabled={
            activating !==
            null
          }
          onClick={() =>
            activate(
              "found"
            )
          }
          icon="🐾"
          title="Animaux trouvés"
        />

        <PushButton
          active={
            selected ===
            "both"
          }
          loading={
            activating ===
            "both"
          }
          disabled={
            activating !==
            null
          }
          onClick={() =>
            activate(
              "both"
            )
          }
          icon="🚨"
          title="Les deux"
        />
      </div>

      {state ===
        "denied" && (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
          Les notifications
          sont actuellement
          bloquées sur cet
          appareil.
        </div>
      )}

      {message && (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm font-semibold ${
            state ===
              "enabled"
              ? "bg-green-50 text-green-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-gray-500">
        Lors du premier
        choix, votre téléphone
        vous demandera
        l&apos;autorisation
        d&apos;envoyer des
        notifications.
      </p>
    </section>
  );
}

function PushButton({
  active,
  loading,
  disabled,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className={`rounded-[22px] border-2 px-4 py-5 text-center transition ${
        active
          ? "border-[#064b42] bg-[#064b42] text-white"
          : "border-[#eadfce] bg-[#faf7f2] text-[#064b42]"
      } disabled:opacity-60`}
    >
      <div className="text-3xl">
        {icon}
      </div>

      <div className="mt-2 font-black">
        {loading
          ? "Activation..."
          : title}
      </div>

      {active && (
        <div className="mt-1 text-xs font-bold">
          ✓ Activé
        </div>
      )}
    </button>
  );
}