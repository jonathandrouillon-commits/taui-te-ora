"use client";

import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  type?: string | null;
  titre?: string | null;
  message?: string | null;
  lien?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
};

type RecentNotificationsProps = {
  notifications: NotificationItem[];
};

export default function RecentNotifications({
  notifications,
}: RecentNotificationsProps) {
  const router = useRouter();

  function openNotification(notification: NotificationItem) {
    if (notification.lien) {
      router.push(notification.lien);
    } else {
      router.push("/notifications");
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[#064b42]">
          Notifications
        </h2>

        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="rounded-xl bg-[#f4eee3] px-4 py-2 text-sm font-bold text-[#064b42]"
        >
          Tout voir
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-600">Aucune notification récente.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className={`block w-full rounded-2xl p-4 text-left transition hover:bg-[#eadfcf] ${
                notification.is_read
                  ? "bg-[#f4eee3]"
                  : "bg-[#fff8e8] ring-2 ring-[#b68b2f]"
              }`}
            >
              <p className="text-sm font-black uppercase text-[#b68b2f]">
                {notification.type || "notification"}
              </p>

              <p className="mt-1 font-black text-[#064b42]">
                {notification.titre || "Notification"}
              </p>

              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {notification.message || "Nouvelle notification."}
              </p>

              {notification.created_at && (
                <p className="mt-2 text-xs font-bold text-gray-400">
                  {new Date(notification.created_at).toLocaleString("fr-FR")}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}