"use client";

import {
  useCallback,
  useEffect,
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

  const initNotifications =
    useCallback(
      async () => {
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
          setLoading(
            false
          );

          return;
        }

        setRecipientId(
          user.id
        );

        await loadNotifications(
          user.id
        );

        setLoading(
          false
        );
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

  async function loadNotifications(
    id: string
  ) {
    const data =
      await notificationService
        .getMyNotifications(
          id
        );

    setNotifications(
      data as ClickableNotification[]
    );
  }

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

  async function markAsRead(
    id: string
  ) {
    await notificationService
      .markAsRead(
        id
      );

    setNotifications(
      (
        current
      ) =>
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
                    new Date()
                      .toISOString(),
                }
              : item
        )
    );
  }

  async function markAllAsRead() {
    if (
      !recipientId
    ) {
      return;
    }

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
  }

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
     * Demande adoption
     *
     * Une association ou
     * un refuge pourra ouvrir
     * directement la demande.
     */
    if (
      notification
        .adoption_request_id
    ) {
      return `/association/demandes/${notification.adoption_request_id}`;
    }

    /*
     * Si seulement animal_id
     * est disponible,
     * on ouvre la fiche animal.
     */
    if (
      notification
        .animal_id
    ) {
      return `/animal/${notification.animal_id}`;
    }

    return null;
  }

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

  const unreadCount =
    notifications.filter(
      (
        item
      ) =>
        !item.is_read
    ).length;

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#f7efe7] px-4 py-8">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7efe7] px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-stone-600">
              {unreadCount >
              0
                ? `${unreadCount} notification(s) non lue(s)`
                : "Toutes les notifications sont lues"}
            </p>
          </div>

          {unreadCount >
            0 && (
            <button
              type="button"
              onClick={
                markAllAsRead
              }
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Tout marquer
              comme lu
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {notifications
            .length ===
          0 ? (
            <div className="rounded-3xl bg-white p-6 shadow">
              Aucune
              notification
              pour le moment.
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
                    className={`rounded-3xl border p-5 shadow transition ${
                      notification.is_read
                        ? "border-stone-200 bg-white"
                        : "border-orange-300 bg-orange-50"
                    } ${
                      url
                        ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
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
                             * Empêche le clic
                             * du bouton de
                             * déclencher aussi
                             * l'ouverture de
                             * la notification.
                             */
                            event.stopPropagation();

                            void markAsRead(
                              notification.id
                            );
                          }}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow"
                        >
                          Marquer
                          comme lu
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