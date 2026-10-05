"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

type BadgeNavigator =
  Navigator & {
    setAppBadge?: (
      value?: number
    ) => Promise<void>;
    clearAppBadge?: () =>
      Promise<void>;
  };

async function applyApplicationBadge(
  count: number
) {
  try {
    if (
      typeof navigator ===
      "undefined"
    ) {
      return;
    }

    const badgeNavigator =
      navigator as BadgeNavigator;

    if (
      count > 0 &&
      typeof badgeNavigator
        .setAppBadge ===
        "function"
    ) {
      await badgeNavigator
        .setAppBadge(
          count
        );
    } else if (
      count <= 0 &&
      typeof badgeNavigator
        .clearAppBadge ===
        "function"
    ) {
      await badgeNavigator
        .clearAppBadge();
    }

    if (
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

      worker?.postMessage({
        type:
          count > 0
            ? "SET_APP_BADGE"
            : "CLEAR_APP_BADGE",
        count,
      });
    }
  } catch (
    error
  ) {
    console.warn(
      "Badge global Taui Te Ora indisponible :",
      error
    );
  }
}

export default function GlobalNotificationBadge() {
  const [
    recipientId,
    setRecipientId,
  ] = useState<
    string | null
  >(null);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const mountedRef =
    useRef(true);

  const syncUnreadCount =
    useCallback(
      async (
        userId:
          | string
          | null
      ) => {
        if (
          !userId
        ) {
          if (
            mountedRef.current
          ) {
            setUnreadCount(0);
          }

          await applyApplicationBadge(
            0
          );

          return;
        }

        try {
          const {
            count,
            error,
          } =
            await supabase
              .from(
                "notifications"
              )
              .select(
                "id",
                {
                  count:
                    "exact",
                  head:
                    true,
                }
              )
              .eq(
                "recipient_id",
                userId
              )
              .eq(
                "is_read",
                false
              );

          if (
            error
          ) {
            throw error;
          }

          const nextCount =
            Number(
              count || 0
            );

          if (
            mountedRef.current
          ) {
            setUnreadCount(
              nextCount
            );
          }

          await applyApplicationBadge(
            nextCount
          );
        } catch (
          error
        ) {
          console.error(
            "Erreur synchronisation badge global :",
            error
          );
        }
      },
      []
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      let authSubscription:
        | {
            unsubscribe:
              () => void;
          }
        | undefined;

      async function initialize() {
        try {
          const {
            data: {
              session,
            },
          } =
            await supabase
              .auth
              .getSession();

          const userId =
            session?.user
              ?.id ||
            null;

          if (
            !mountedRef.current
          ) {
            return;
          }

          setRecipientId(
            userId
          );

          await syncUnreadCount(
            userId
          );

          const {
            data,
          } =
            supabase.auth
              .onAuthStateChange(
                (
                  _event,
                  nextSession
                ) => {
                  const nextUserId =
                    nextSession
                      ?.user
                      ?.id ||
                    null;

                  if (
                    mountedRef.current
                  ) {
                    setRecipientId(
                      nextUserId
                    );
                  }

                  void syncUnreadCount(
                    nextUserId
                  );
                }
              );

          authSubscription =
            data.subscription;
        } catch (
          error
        ) {
          console.error(
            "Erreur initialisation badge global :",
            error
          );
        }
      }

      void initialize();

      return () => {
        mountedRef.current =
          false;

        authSubscription
          ?.unsubscribe();
      };
    },
    [
      syncUnreadCount,
    ]
  );

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
            `global-notification-badge-${recipientId}`
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema:
                "public",
              table:
                "notifications",
              filter:
                `recipient_id=eq.${recipientId}`,
            },
            () => {
              void syncUnreadCount(
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
      syncUnreadCount,
    ]
  );

  useEffect(
    () => {
      function refreshBadge() {
        if (
          document
            .visibilityState ===
          "visible"
        ) {
          void syncUnreadCount(
            recipientId
          );
        }
      }

      document.addEventListener(
        "visibilitychange",
        refreshBadge
      );

      window.addEventListener(
        "focus",
        refreshBadge
      );

      return () => {
        document.removeEventListener(
          "visibilitychange",
          refreshBadge
        );

        window.removeEventListener(
          "focus",
          refreshBadge
        );
      };
    },
    [
      recipientId,
      syncUnreadCount,
    ]
  );

  useEffect(
    () => {
      function handleManualRefresh() {
        void syncUnreadCount(
          recipientId
        );
      }

      window.addEventListener(
        "taui-notifications-updated",
        handleManualRefresh
      );

      return () => {
        window.removeEventListener(
          "taui-notifications-updated",
          handleManualRefresh
        );
      };
    },
    [
      recipientId,
      syncUnreadCount,
    ]
  );

  useEffect(
    () => {
      void applyApplicationBadge(
        unreadCount
      );
    },
    [
      unreadCount,
    ]
  );

  return null;
}
