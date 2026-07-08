"use client";

import type { Notification } from "../../lib/dashboard";

type DashboardNotificationsProps = {
  notifications: Notification[];
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
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-4 ${
                notification.is_read
                  ? "border-[#eadfce] bg-[#f8f4ec]"
                  : "border-[#9c7b54] bg-[#fff8ea]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#2f241c]">
                    {notification.title || "Notification"}
                  </h3>

                  <p className="mt-1 text-sm text-[#6f5a47]">
                    {notification.message || "Aucun message"}
                  </p>

                  <p className="mt-2 text-xs text-[#9c7b54]">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read && (
                  <span className="rounded-full bg-[#9c7b54] px-3 py-1 text-xs font-bold text-white">
                    Nouveau
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(date?: string) {
  if (!date) return "Date inconnue";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}