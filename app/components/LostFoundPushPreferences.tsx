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
    window.atob(
      base64
    );

  return Uint8Array.from(
    [...rawData].map(
      (character) =>
        character.charCodeAt(
          0
        )
    )
  );
}

function preferenceToValues(
  preference: AlertPreference
) {
  return {
    alertLost:
      preference ===
        "lost" ||
      preference ===
        "both",

    alertFound:
      preference ===
        "found" ||
      preference ===
        "both",
  };
}

function getPermissionState() {
  if (
    typeof window ===
      "undefined" ||
    !(
      "Notification" in
      window
    )
  ) {
    return null;
  }

  return Notification.permission;
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
      "undefined"
    ) {
      return;
    }

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
      setState(
        "unsupported"
      );

      return;
    }

    const permission =
      Notification.permission;

    if (
      permission ===
      "denied"
    ) {
      setState(
        "denied"
      );
    } else if (
      permission ===
      "granted"
    ) {
      setState(
        "enabled"
      );
    } else {
      setState(
        "ready"
      );
    }

    const stored =
      window.localStorage
        .getItem(
          "taui-push-preference"
        );

    if (
      stored ===
        "lost" ||
      stored ===
        "found" ||
      stored ===
        "both"
    ) {
      setSelected(
        stored
      );
    }
  }, []);

  async function getServiceWorkerRegistration() {
    if (
      !(
        "serviceWorker" in
        navigator
      )
    ) {
      throw new Error(
        "Service Worker non disponible."
      );
    }

    /*
     * On cherche d'abord
     * un worker déjà installé.
     */

    let registration =
      await navigator
        .serviceWorker
        .getRegistration(
          "/"
        );

    /*
     * Sinon on installe le
     * Service Worker Taui Te Ora.
     */

    if (!registration) {
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

    /*
     * Attend qu'un Service Worker
     * soit réellement actif.
     */

    const readyRegistration =
      await navigator
        .serviceWorker
        .ready;

    return (
      readyRegistration ||
      registration
    );
  }

  async function activate(
    preference: AlertPreference
  ) {
    if (
      activating !==
      null
    ) {
      return;
    }

    setActivating(
      preference
    );

    setMessage("");

    try {
      /*
       * Vérification navigateur
       */

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

        throw new Error(
          "Les notifications push ne sont pas disponibles sur cet appareil ou ce navigateur."
        );
      }

      /*
       * Vérification clé VAPID
       */

      const publicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "La clé NEXT_PUBLIC_VAPID_PUBLIC_KEY n'est pas configurée."
        );
      }

      /*
       * Demande d'autorisation.
       *
       * IMPORTANT :
       * elle est déclenchée directement
       * suite au clic utilisateur.
       */

      let permission =
        Notification.permission;

      if (
        permission ===
        "default"
      ) {
        permission =
          await Notification
            .requestPermission();
      }

      if (
        permission ===
        "denied"
      ) {
        setState(
          "denied"
        );

        throw new Error(
          "Les notifications sont bloquées. Autorisez-les dans les réglages de votre navigateur ou téléphone."
        );
      }

      if (
        permission !==
        "granted"
      ) {
        throw new Error(
          "L'autorisation de notification n'a pas été accordée."
        );
      }

      /*
       * Service Worker
       */

      const registration =
        await getServiceWorkerRegistration();

      if (
        !registration
          .pushManager
      ) {
        throw new Error(
          "PushManager indisponible."
        );
      }

      /*
       * Cherche abonnement existant
       */

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      /*
       * Sinon crée l'abonnement
       */

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

      if (
        !subscription
      ) {
        throw new Error(
          "Impossible de créer l'abonnement push."
        );
      }

      const json =
        subscription.toJSON();

      const p256dh =
        json.keys?.p256dh;

      const auth =
        json.keys?.auth;

      if (
        !subscription.endpoint ||
        !p256dh ||
        !auth
      ) {
        throw new Error(
          "L'abonnement push généré par le navigateur est incomplet."
        );
      }

      /*
       * Préférences utilisateur
       */

      const values =
        preferenceToValues(
          preference
        );

      /*
       * Enregistrement serveur
       */

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

                p256dh,

                auth,

                alertLost:
                  values.alertLost,

                alertFound:
                  values.alertFound,
              }),
          }
        );

      let result:
        | {
            ok?: boolean;
            error?: string;
          }
        | null =
        null;

      try {
        result =
          await response.json();
      } catch {
        result =
          null;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            `Erreur serveur ${response.status}.`
        );
      }

      /*
       * Sauvegarde préférence locale
       */

      window.localStorage
        .setItem(
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
          "✅ Notifications pour les animaux perdus activées."
        );
      } else if (
        preference ===
        "found"
      ) {
        setMessage(
          "✅ Notifications pour les animaux trouvés activées."
        );
      } else {
        setMessage(
          "✅ Notifications animaux perdus et trouvés activées."
        );
      }
    } catch (
      caughtError
    ) {
      console.error(
        "Activation push Taui Te Ora :",
        caughtError
      );

      const permission =
        getPermissionState();

      if (
        permission ===
        "denied"
      ) {
        setState(
          "denied"
        );
      } else {
        setState(
          "error"
        );
      }

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
        <div className="text-center">
          <div className="text-4xl">
            🔕
          </div>

          <h2 className="mt-3 text-xl font-black text-[#064b42] sm:text-2xl">
            Notifications non disponibles
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#6f5a47]">
            Ce navigateur ou cet appareil ne permet pas encore les notifications push.
          </p>
        </div>
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
          Soyez prévenu immédiatement lorsqu&apos;un animal est signalé perdu ou trouvé.
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
            void activate(
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
            void activate(
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
            void activate(
              "both"
            )
          }
          icon="🚨"
          title="Les deux"
        />
      </div>

      {state ===
        "denied" && (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-4 text-center text-sm font-semibold text-red-700">
          🔕 Les notifications sont actuellement bloquées sur cet appareil.
          <br />
          Autorisez les notifications pour Taui Te Ora dans les réglages du navigateur.
        </div>
      )}

      {message && (
        <div
          className={`mt-5 rounded-2xl px-4 py-4 text-center text-sm font-semibold ${
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
        Lors du premier choix, votre téléphone ou navigateur vous demandera l&apos;autorisation d&apos;envoyer des notifications.
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
      className={`rounded-[22px] border-2 px-4 py-5 text-center transition active:scale-[0.98] ${
        active
          ? "border-[#064b42] bg-[#064b42] text-white"
          : "border-[#eadfce] bg-[#faf7f2] text-[#064b42]"
      } disabled:cursor-not-allowed disabled:opacity-60`}
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