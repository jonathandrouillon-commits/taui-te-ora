"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

type NotificationRow = {
  id: string;

  recipient_id: string;

  title?: string | null;
  message?: string | null;

  is_read?: boolean | null;

  created_at?: string | null;

  conversation_id?: string | null;
  animal_id?: string | null;
  adoption_request_id?: string | null;

  type?: string | null;
};

export default function NotificationBell() {
  const router =
    useRouter();

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    toast,
    setToast,
  ] =
    useState<NotificationRow | null>(
      null
    );

  const timeoutRef =
    useRef<number | null>(
      null
    );

  const loadUnreadCount = useCallback(async (
    currentUserId: string
  ) => {
    const {
      count,
      error,
    } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", currentUserId)
      .eq("is_read", false);

    if (error) {
      console.error("Erreur compteur notifications :", error);
      return;
    }

    setUnreadCount(count || 0);
  }, []);

  const showToast = useCallback((notification: NotificationRow) => {
    setToast(notification);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 7000);
  }, []);

  const showBrowserNotification = useCallback(async (
    notification: NotificationRow
  ) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      new Notification(notification.title || "Taui Te Ora", {
        body: notification.message || "Vous avez une nouvelle notification.",
        icon: "/logo-taui-te-ora.png",
      });
    } catch (error) {
      console.error("Notification navigateur :", error);
    }
  }, []);

  useEffect(() => {
    let active =
      true;

    let channel:
      | ReturnType<
          typeof supabase.channel
        >
      | null = null;

    async function initialize() {
      const {
        data: {
          user,
        },
        error,
      } =
        await supabase.auth.getUser();

      if (
        error ||
        !user ||
        !active
      ) {
        return;
      }

      setUserId(
        user.id
      );

      await loadUnreadCount(
        user.id
      );

      /*
       * On écoute uniquement les notifications
       * destinées à l'utilisateur connecté.
       */
      channel =
        supabase
          .channel(
            `notifications-${user.id}`
          )
          .on(
            "postgres_changes",
            {
              event:
                "INSERT",
              schema:
                "public",
              table:
                "notifications",
              filter:
                `recipient_id=eq.${user.id}`,
            },
            (
              payload
            ) => {
              const notification =
                payload.new as NotificationRow;

              if (
                notification.recipient_id !==
                user.id
              ) {
                return;
              }

              /*
               * Incrémente le badge rouge.
               */
              if (
                notification.is_read !==
                true
              ) {
                setUnreadCount(
                  (
                    previous
                  ) =>
                    previous +
                    1
                );
              }

              /*
               * Affiche le message dans l'application.
               */
              showToast(
                notification
              );

              /*
               * Notification navigateur facultative.
               */
              showBrowserNotification(
                notification
              );
            }
          )
          .on(
            "postgres_changes",
            {
              event:
                "UPDATE",
              schema:
                "public",
              table:
                "notifications",
              filter:
                `recipient_id=eq.${user.id}`,
            },
            (
              payload
            ) => {
              const notification =
                payload.new as NotificationRow;

              if (
                notification.recipient_id ===
                user.id
              ) {
                /*
                 * On recalcule le compteur afin
                 * de toujours rester juste.
                 */
                void loadUnreadCount(
                  user.id
                );
              }
            }
          )
          .subscribe();
    }

    void initialize();

    return () => {
      active =
        false;

      if (
        timeoutRef.current
      ) {
        window.clearTimeout(
          timeoutRef.current
        );
      }

      if (
        channel
      ) {
        void supabase.removeChannel(
          channel
        );
      }
    };
  }, [
    loadUnreadCount,
    showToast,
    showBrowserNotification,
  ]);

  function openNotifications() {
    setToast(
      null
    );

    router.push(
      "/notifications"
    );
  }

  function openToast() {
    if (
      toast?.conversation_id
    ) {
      router.push(
        `/messages/${toast.conversation_id}`
      );

      setToast(
        null
      );

      return;
    }

    if (
      toast?.animal_id
    ) {
      router.push(
        `/animal/${toast.animal_id}`
      );

      setToast(
        null
      );

      return;
    }

    openNotifications();
  }

  /*
   * Pas connecté :
   * on n'affiche pas la cloche dynamique.
   */
  if (
    !userId
  ) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          CLOCHE
      ====================================================== */}

      <button
        type="button"
        onClick={
          openNotifications
        }
        aria-label={
          unreadCount > 0
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
            : "Notifications"
        }
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-[#f8f4ec]
          text-[#064b42]
          shadow-sm
          transition
          active:scale-95
        "
      >
        <BellIcon />

        {/* BADGE ROUGE */}

        {unreadCount >
          0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              h-[20px]
              min-w-[20px]
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              bg-red-500
              px-1
              text-[10px]
              font-black
              leading-none
              text-white
              shadow
            "
          >
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* =====================================================
          MESSAGE TEMPS RÉEL
      ====================================================== */}

      {toast && (
        <button
          type="button"
          onClick={
            openToast
          }
          className="
            fixed
            left-1/2
            top-[90px]
            z-[999]
            w-[calc(100%-28px)]
            max-w-[430px]
            -translate-x-1/2
            rounded-[22px]
            border
            border-[#eadfce]
            bg-white
            p-4
            text-left
            shadow-2xl
            backdrop-blur-xl
            transition
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#fde7e9]
                text-xl
              "
            >
              🔔
            </div>

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <p
                  className="
                    truncate
                    text-sm
                    font-black
                    text-[#064b42]
                  "
                >
                  {toast.title ||
                    "Nouvelle notification"}
                </p>

                <span
                  className="
                    shrink-0
                    rounded-full
                    bg-red-500
                    px-2
                    py-1
                    text-[9px]
                    font-black
                    uppercase
                    text-white
                  "
                >
                  Nouveau
                </span>
              </div>

              <p
                className="
                  mt-1
                  line-clamp-2
                  text-[13px]
                  leading-5
                  text-[#6f5a47]
                "
              >
                {toast.message ||
                  "Vous avez reçu une nouvelle notification."}
              </p>

              <p
                className="
                  mt-2
                  text-[10px]
                  font-bold
                  text-[#b58b5b]
                "
              >
                Appuyer pour ouvrir
              </p>
            </div>
          </div>
        </button>
      )}
    </>
  );
}

/* =========================================================
   ICÔNE
========================================================= */

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}