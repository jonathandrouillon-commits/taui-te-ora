"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

type PushState =
  | "loading"
  | "ready"
  | "enabled"
  | "denied"
  | "unsupported"
  | "error";

type Preferences = {
  lost: boolean;
  found: boolean;
  messages: boolean;
  profile: boolean;
  sos: boolean;
};

const STORAGE_KEY =
  "taui-push-preferences-v2";

const DEFAULT_PREFERENCES: Preferences = {
  lost: true,
  found: true,
  messages: true,
  profile: true,
  sos: true,
};

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

function loadStoredPreferences(): Preferences {
  try {
    const current =
      window.localStorage
        .getItem(
          STORAGE_KEY
        );

    if (current) {
      const parsed =
        JSON.parse(
          current
        ) as Partial<Preferences>;

      return {
        lost:
          parsed.lost ??
          true,
        found:
          parsed.found ??
          true,
        messages:
          parsed.messages ??
          true,
        profile:
          parsed.profile ??
          true,
        sos:
          parsed.sos ??
          true,
      };
    }

    /*
     * Migration de l'ancienne préférence :
     * lost / found / both.
     */
    const legacy =
      window.localStorage
        .getItem(
          "taui-push-preference"
        );

    if (
      legacy === "lost"
    ) {
      return {
        ...DEFAULT_PREFERENCES,
        lost: true,
        found: false,
      };
    }

    if (
      legacy === "found"
    ) {
      return {
        ...DEFAULT_PREFERENCES,
        lost: false,
        found: true,
      };
    }

    return {
      ...DEFAULT_PREFERENCES,
    };
  } catch {
    return {
      ...DEFAULT_PREFERENCES,
    };
  }
}

function saveStoredPreferences(
  preferences: Preferences
) {
  window.localStorage
    .setItem(
      STORAGE_KEY,
      JSON.stringify(
        preferences
      )
    );
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
    preferences,
    setPreferences,
  ] =
    useState<Preferences>(
      DEFAULT_PREFERENCES
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
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

          setPreferences(
            loadStoredPreferences()
          );

          if (
            Notification.permission ===
            "denied"
          ) {
            setState(
              "denied"
            );
          } else if (
            Notification.permission ===
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
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, []);

  async function getServiceWorkerRegistration() {
    let registration =
      await navigator
        .serviceWorker
        .getRegistration(
          "/"
        );

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

    return navigator
      .serviceWorker
      .ready;
  }

  async function savePreferences(
    nextPreferences: Preferences
  ) {
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
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
          "Les notifications push ne sont pas disponibles sur cet appareil."
        );
      }

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
          "Les notifications sont bloquées sur cet appareil."
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

      const publicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "Clé VAPID publique manquante."
        );
      }

      const registration =
        await getServiceWorkerRegistration();

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (!subscription) {
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
          "Abonnement push incomplet."
        );
      }

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase
          .auth
          .getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        throw new Error(
          "Vous devez être connecté pour enregistrer vos notifications."
        );
      }

      const response =
        await fetch(
          "/api/push/subscribe",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body:
              JSON.stringify({
                endpoint:
                  subscription.endpoint,
                p256dh,
                auth,
                alertLost:
                  nextPreferences.lost,
                alertFound:
                  nextPreferences.found,
                alertMessages:
                  nextPreferences.messages,
                alertProfile:
                  nextPreferences.profile,
                alertSos:
                  nextPreferences.sos,
              }),
          }
        );

      const result =
        (await response
          .json()
          .catch(
            () => null
          )) as
          | {
              ok?: boolean;
              error?: string;
              userLinked?: boolean;
            }
          | null;

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            `Erreur serveur ${response.status}.`
        );
      }

      if (
        result?.userLinked !==
        true
      ) {
        throw new Error(
          "Le téléphone n'a pas pu être rattaché à votre compte."
        );
      }

      setPreferences(
        nextPreferences
      );

      saveStoredPreferences(
        nextPreferences
      );

      setState(
        "enabled"
      );

      setMessage(
        "✅ Préférences de notifications enregistrées."
      );
    } catch (
      error
    ) {
      console.error(
        "Préférences PUSH Taui Te Ora :",
        error
      );

      setState(
        Notification.permission ===
          "denied"
          ? "denied"
          : "error"
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Impossible d'enregistrer les notifications."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  function toggle(
    key: keyof Preferences
  ) {
    const next = {
      ...preferences,
      [key]:
        !preferences[key],
    };

    /*
     * On autorise tout désactiver :
     * l'abonnement reste lié au téléphone,
     * mais aucun push de cette catégorie ne partira.
     */
    void savePreferences(
      next
    );
  }

  function enableAll() {
    void savePreferences({
      lost: true,
      found: true,
      messages: true,
      profile: true,
      sos: true,
    });
  }

  const allEnabled =
    preferences.lost &&
    preferences.found &&
    preferences.messages &&
    preferences.profile &&
    preferences.sos;

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

          <h2 className="mt-3 text-xl font-black text-[#064b42]">
            Notifications non disponibles
          </h2>

          <p className="mt-3 text-sm text-[#6f5a47]">
            Ce navigateur ou cet appareil ne permet pas les notifications push.
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
          Mes notifications
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6f5a47]">
          Choisissez ce que vous souhaitez recevoir sur votre téléphone.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PreferenceButton
          active={
            preferences.lost
          }
          disabled={
            saving
          }
          icon="🔎"
          title="Animaux perdus"
          subtitle="Alertes de disparition"
          onClick={() =>
            toggle(
              "lost"
            )
          }
        />

        <PreferenceButton
          active={
            preferences.found
          }
          disabled={
            saving
          }
          icon="🐾"
          title="Animaux trouvés"
          subtitle="Animaux trouvés ou récupérés"
          onClick={() =>
            toggle(
              "found"
            )
          }
        />

        <PreferenceButton
          active={
            preferences.messages
          }
          disabled={
            saving
          }
          icon="💬"
          title="Messages"
          subtitle="Nouveaux messages privés"
          onClick={() =>
            toggle(
              "messages"
            )
          }
        />

        <PreferenceButton
          active={
            preferences.profile
          }
          disabled={
            saving
          }
          icon="👤"
          title="Mon profil & mes démarches"
          subtitle="Adoption, compte, validation et suivi"
          onClick={() =>
            toggle(
              "profile"
            )
          }
        />

        <PreferenceButton
          active={
            preferences.sos
          }
          disabled={
            saving
          }
          icon="🚨"
          title="SOS Animal"
          subtitle="Demandes d'aide urgentes"
          onClick={() =>
            toggle(
              "sos"
            )
          }
        />

        <button
          type="button"
          disabled={
            saving
          }
          onClick={
            enableAll
          }
          className={`rounded-[22px] border-2 px-4 py-5 text-center font-black transition ${
            allEnabled
              ? "border-[#064b42] bg-[#064b42] text-white"
              : "border-[#d7c89d] bg-[#fff8df] text-[#705b20]"
          } disabled:opacity-50`}
        >
          <div className="text-3xl">
            🔔
          </div>

          <div className="mt-2">
            Tout recevoir
          </div>

          <div className="mt-1 text-xs font-semibold opacity-80">
            Active toutes les catégories
          </div>
        </button>
      </div>

      {state ===
        "denied" && (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-4 text-center text-sm font-semibold text-red-700">
          🔕 Les notifications sont bloquées sur cet appareil.
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
        Vous pourrez modifier ces choix à tout moment.
      </p>
    </section>
  );
}

function PreferenceButton({
  active,
  disabled,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
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
        {title}
      </div>

      <div className="mt-1 text-xs font-semibold opacity-80">
        {subtitle}
      </div>

      <div className="mt-2 text-xs font-black">
        {active
          ? "✓ Activé"
          : "Désactivé"}
      </div>
    </button>
  );
}
