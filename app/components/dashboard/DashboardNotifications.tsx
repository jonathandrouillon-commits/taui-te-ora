"use client";

import Link from "next/link";

import type {
  Notification,
} from "../../lib/dashboard";

type DashboardNotificationsProps = {
  notifications: Notification[];
};

type ExtendedNotification =
  Notification & {
    signalement_id?: string | null;
    animal_id?: string | null;
    adoption_request_id?: string | null;
  };

export default function DashboardNotifications({
  notifications,
}: DashboardNotificationsProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <h2 className="mb-5 text-2xl font-bold text-[#2f241c]">
        Notifications
      </h2>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Aucune notification pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(
            (notification) => {
              const item =
                notification as ExtendedNotification;

              const destination =
                getNotificationDestination(
                  item
                );

              const isClickable =
                Boolean(
                  destination
                );

              const content = (
                <div
                  className={`rounded-2xl border p-4 transition ${
                    notification.is_read
                      ? "border-[#eadfce] bg-[#f8f4ec]"
                      : "border-[#9c7b54] bg-[#fff8ea]"
                  } ${
                    isClickable
                      ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#2f241c]">
                        {notification.title ||
                          "Notification"}
                      </h3>

                      <p className="mt-1 text-sm text-[#6f5a47]">
                        {notification.message ||
                          "Aucun message"}
                      </p>

                      <p className="mt-2 text-xs text-[#9c7b54]">
                        {formatDate(
                          notification.created_at
                        )}
                      </p>

                      {isClickable && (
                        <p className="mt-3 text-sm font-black text-[#064b42]">
                          {getOpenLabel(
                            item
                          )}
                        </p>
                      )}
                    </div>

                    {!notification.is_read && (
                      <span className="shrink-0 rounded-full bg-[#9c7b54] px-3 py-1 text-xs font-bold text-white">
                        Nouveau
                      </span>
                    )}
                  </div>
                </div>
              );

              if (
                destination
              ) {
                return (
                  <Link
                    key={
                      notification.id
                    }
                    href={
                      destination
                    }
                    className="block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={
                    notification.id
                  }
                >
                  {content}
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function getNotificationDestination(
  notification:
    ExtendedNotification
) {
  /*
   * Signalement animal
   * perdu / trouvé.
   */
  if (
    notification.signalement_id
  ) {
    return `/signalement/${notification.signalement_id}`;
  }

  /*
   * Conversation / message.
   */
  if (
    notification.conversation_id
  ) {
    return `/messages/${notification.conversation_id}`;
  }

  /*
   * Demande adoption.
   */
  if (
    notification.adoption_request_id
  ) {
    return `/association/demandes/${notification.adoption_request_id}`;
  }

  /*
   * Animal adoption.
   */
  if (
    notification.animal_id
  ) {
    return `/animal/${notification.animal_id}`;
  }

  return null;
}

function getOpenLabel(
  notification:
    ExtendedNotification
) {
  if (
    notification.signalement_id
  ) {
    return "🐾 Voir le signalement →";
  }

  if (
    notification.conversation_id
  ) {
    return "💬 Lire le message →";
  }

  if (
    notification.adoption_request_id
  ) {
    return "📋 Voir la demande →";
  }

  if (
    notification.animal_id
  ) {
    return "🐾 Voir l’animal →";
  }

  return "";
}

function formatDate(
  date?: string
) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}