"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../lib/supabase";

import {
  notificationService,
  Notification,
} from "../services/notification.service";

type ClickableNotification =
  Notification & {
    conversation_id?: string | null;
    adoption_request_id?: string | null;
    signalement_id?: string | null;
    animal_id?: string | null;
  };

/* =========================================================
   BADGE APPLICATION
========================================================= */

async function updateApplicationBadge(
  count: number
) {
  try {
    /*
     * Mise à jour directe depuis l'application
     * lorsque le navigateur supporte Badging API.
     */

    if (
      typeof navigator !==
      "undefined"
    ) {
      if (
        count > 0 &&
        "setAppBadge" in navigator
      ) {
        await (
          navigator as Navigator & {
            setAppBadge?: (
              value?: number
            ) => Promise<void>;
          }
        ).setAppBadge?.(
          count
        );
      }

      if (
        count <= 0 &&
        "clearAppBadge" in navigator
      ) {
        await (
          navigator as Navigator & {
            clearAppBadge?: () =>
              Promise<void>;
          }
        ).clearAppBadge?.();
      }
    }

    /*
     * On informe également le Service Worker.
     *
     * Cela permet d'avoir une deuxième
     * synchronisation avec public/sw.js.
     */

    if (
      typeof navigator !==
        "undefined" &&
      "serviceWorker" in
        navigator
    ) {
      const registration =
        await navigator
          .serviceWorker
          .ready;

      const worker =
        registration.active ||
        registration.waiting ||
        registration.installing;

      if (
        worker
      ) {
        worker.postMessage({
          type:
            count > 0
              ? "SET_APP_BADGE"
              : "CLEAR_APP_BADGE",

          count,
        });
      }
    }
  } catch (
    error
  ) {
    /*
     * Le badge est une amélioration visuelle.
     * Une erreur de badge ne doit jamais
     * empêcher les notifications de fonctionner.
     */

    console.warn(
      "Badge TAUI TE ORA non disponible :",
      error
    );
  }
}

export default function NotificationsPage() {
  const router =
    useRouter();

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      ClickableNotification[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    recipientId,
    setRecipientId,
  ] =
    useState<
      string | null
    >(null);

  /* =========================================================
     COMPTEUR NON LUES
  ========================================================= */

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            item
          ) =>
            !item.is_read
        ).length,
      [
        notifications,
      ]
    );

  /*
   * Dès que le nombre de notifications
   * non lues change :
   *
   * 5 notifications → badge 5
   * 2 notifications → badge 2
   * 0 notification  → badge supprimé
   */

  useEffect(
    () => {
      if (
        loading
      ) {
        return;
      }

      void updateApplicationBadge(
        unreadCount
      );
    },
    [
      unreadCount,
      loading,
    ]
  );

  /* =========================================================
     INITIALISATION
  ========================================================= */

  const initNotifications =
    useCallback(
      async () => {
        try {
          const {
            data: {
              user,
            },
            error,
          } =
            await supabase
              .auth
              .getUser();

          if (
            error ||
            !user
          ) {
            setRecipientId(
              null
            );

            setNotifications(
              []
            );

            await updateApplicationBadge(
              0
            );

            return;
          }

          setRecipientId(
            user.id
          );

          await loadNotifications(
            user.id
          );
        } catch (
          error
        ) {
          console.error(
            "Erreur initialisation notifications :",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void initNotifications();
          },
          0
        );

      return () =>
        window.clearTimeout(
          timeoutId
        );
    },
    [
      initNotifications,
    ]
  );

  /* =========================================================
     CHARGEMENT NOTIFICATIONS
  ========================================================= */

  async function loadNotifications(
    id: string
  ) {
    try {
      const data =
        await notificationService
          .getMyNotifications(
            id
          );

      setNotifications(
        data as ClickableNotification[]
      );

      const count =
        (
          data as ClickableNotification[]
        ).filter(
          (
            item
          ) =>
            !item.is_read
        ).length;

      await updateApplicationBadge(
        count
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur chargement notifications :",
        error
      );
    }
  }

  /* =========================================================
     TEMPS RÉEL SUPABASE
  ========================================================= */

  useEffect(
    () => {
      if (
        !recipientId
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `notifications-page-${recipientId}`
          )
          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "notifications",

              filter:
                `recipient_id=eq.${recipientId}`,
            },
            async () => {
              await loadNotifications(
                recipientId
              );
            }
          )
          .subscribe();

      return () => {
        void supabase
          .removeChannel(
            channel
          );
      };
    },
    [
      recipientId,
    ]
  );

  /* =========================================================
     MARQUER UNE NOTIFICATION COMME LUE
  ========================================================= */

  async function markAsRead(
    id: string
  ) {
    try {
      await notificationService
        .markAsRead(
          id
        );

      const now =
        new Date()
          .toISOString();

      setNotifications(
        (
          current
        ) => {
          const updated =
            current.map(
              (
                item
              ) =>
                item.id ===
                id
                  ? {
                      ...item,

                      is_read:
                        true,

                      read_at:
                        item.read_at ||
                        now,
                    }
                  : item
            );

          const count =
            updated.filter(
              (
                item
              ) =>
                !item.is_read
            ).length;

          void updateApplicationBadge(
            count
          );

          return updated;
        }
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur lecture notification :",
        error
      );
    }
  }

  /* =========================================================
     TOUT MARQUER COMME LU
  ========================================================= */

  async function markAllAsRead() {
    if (
      !recipientId
    ) {
      return;
    }

    try {
      await notificationService
        .markAllAsRead(
          recipientId
        );

      const now =
        new Date()
          .toISOString();

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              item
            ) => ({
              ...item,

              is_read:
                true,

              read_at:
                item.read_at ||
                now,
            })
          )
      );

      /*
       * Plus aucune notification non lue :
       * suppression du badge.
       */

      await updateApplicationBadge(
        0
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur lecture de toutes les notifications :",
        error
      );
    }
  }

  /* =========================================================
     URL D'UNE NOTIFICATION
  ========================================================= */

  function getNotificationUrl(
    notification:
      ClickableNotification
  ) {
    /*
     * Messages :
     * priorité maximale.
     */

    if (
      notification
        .conversation_id
    ) {
      return `/messages/${notification.conversation_id}`;
    }

    /*
     * Signalement / matching
     */

    if (
      notification
        .signalement_id
    ) {
      return `/signalement/${notification.signalement_id}`;
    }

    /*
     * Demande d'adoption.
     */

    if (
      notification
        .adoption_request_id
    ) {
      return `/association/demandes/${notification.adoption_request_id}`;
    }

    /*
     * Fiche animal.
     */

    if (
      notification
        .animal_id
    ) {
      return `/animal/${notification.animal_id}`;
    }

    return null;
  }

  /* =========================================================
     OUVERTURE NOTIFICATION
  ========================================================= */

  async function openNotification(
    notification:
      ClickableNotification
  ) {
    /*
     * On marque automatiquement
     * la notification comme lue
     * au clic.
     */

    if (
      !notification
        .is_read
    ) {
      await markAsRead(
        notification.id
      );
    }

    const url =
      getNotificationUrl(
        notification
      );

    if (
      url
    ) {
      router.push(
        url
      );
    }
  }

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#f7efe7] px-4 py-8">
        Chargement...
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f7efe7] px-4 pb-28 pt-8">
      <section className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-stone-600">
              {unreadCount >
              0
                ? `${unreadCount} notification${
                    unreadCount >
                    1
                      ? "s"
                      : ""
                  } non lue${
                    unreadCount >
                    1
                      ? "s"
                      : ""
                  }`
                : "Toutes les notifications sont lues"}
            </p>
          </div>

          {/* COMPTEUR */}

          {unreadCount >
            0 && (
            <div className="flex h-11 min-w-11 items-center justify-center rounded-full bg-red-600 px-3 text-lg font-black text-white shadow">
              {unreadCount >
              99
                ? "99+"
                : unreadCount}
            </div>
          )}

        </div>

        {/* TOUT MARQUER */}

        {unreadCount >
          0 && (
          <div className="mt-5">
            <button
              type="button"
              onClick={
                markAllAsRead
              }
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
            >
              Tout marquer comme lu
            </button>
          </div>
        )}

        {/* LISTE */}

        <div className="mt-6 space-y-4">

          {notifications.length ===
          0 ? (

            <div className="rounded-3xl bg-white p-8 text-center shadow">
              <div className="text-5xl">
                🔔
              </div>

              <h2 className="mt-4 text-xl font-black text-stone-900">
                Aucune notification
              </h2>

              <p className="mt-2 text-sm text-stone-500">
                Vos prochaines alertes TAUI TE ORA apparaîtront ici.
              </p>
            </div>

          ) : (

            notifications.map(
              (
                notification
              ) => {
                const url =
                  getNotificationUrl(
                    notification
                  );

                return (
                  <div
                    key={
                      notification.id
                    }
                    role={
                      url
                        ? "button"
                        : undefined
                    }
                    tabIndex={
                      url
                        ? 0
                        : undefined
                    }
                    onClick={() => {
                      if (
                        url
                      ) {
                        void openNotification(
                          notification
                        );
                      }
                    }}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        !url
                      ) {
                        return;
                      }

                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        void openNotification(
                          notification
                        );
                      }
                    }}
                    className={`relative rounded-3xl border p-5 shadow transition ${
                      notification.is_read
                        ? "border-stone-200 bg-white"
                        : "border-red-200 bg-red-50"
                    } ${
                      url
                        ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                        : ""
                    }`}
                  >

                    {/* POINT ROUGE */}

                    {!notification
                      .is_read && (
                      <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-red-600 shadow" />
                    )}

                    <div className="flex items-start justify-between gap-4 pr-5">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                          {
                            notification.type
                          }
                        </p>

                        <h2 className="mt-1 text-lg font-bold text-stone-900">
                          {
                            notification.title
                          }
                        </h2>
                      </div>

                      {url && (
                        <span className="shrink-0 rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white">
                          Ouvrir →
                        </span>
                      )}

                    </div>

                    <p className="mt-2 text-stone-700">
                      {
                        notification.message
                      }
                    </p>

                    {!notification
                      .is_read && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            /*
                             * Empêche l'ouverture
                             * automatique de la notification.
                             */

                            event.stopPropagation();

                            void markAsRead(
                              notification.id
                            );
                          }}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow"
                        >
                          Marquer comme lu
                        </button>
                      </div>
                    )}

                  </div>
                );
              }
            )
          )}

        </div>

      </section>
    </main>
  );
}