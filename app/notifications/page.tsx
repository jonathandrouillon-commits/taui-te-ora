"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationService } from "../services/notification.service";

type NotificationItem = {
  id: string;
  type: string;
  titre: string;
  message: string | null;
  lien: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error(error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function openNotification(notification: NotificationItem) {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
      }

      if (notification.lien) {
        router.push(notification.lien);
      } else {
        await loadNotifications();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function archiveNotification(id: string) {
    try {
      await notificationService.archive(id);
      await loadNotifications();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement des notifications...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-8 text-[#064b42]">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
              TAUI TE ORA
            </p>

            <h1 className="mt-2 text-4xl font-black">Notifications</h1>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl bg-white px-5 py-3 font-bold shadow"
          >
            Retour
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow">
            <div className="text-6xl">🔔</div>

            <h2 className="mt-4 text-2xl font-black">
              Aucune notification
            </h2>

            <p className="mt-3 text-gray-600">
              Les nouvelles demandes d’adoption et les alertes apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-3xl bg-white p-5 shadow ${
                  notification.is_read ? "opacity-75" : "ring-2 ring-[#b68b2f]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4eee3] text-2xl">
                      {notification.type === "demande_adoption" ? "🐾" : "🔔"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-black">
                          {notification.titre}
                        </h2>

                        {!notification.is_read && (
                          <span className="rounded-full bg-[#b68b2f] px-3 py-1 text-xs font-black text-white">
                            Nouveau
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-gray-600">
                        {notification.message || "Notification"}
                      </p>

                      <p className="mt-3 text-xs font-bold text-gray-400">
                        {new Date(notification.created_at).toLocaleString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => archiveNotification(notification.id)}
                  className="mt-4 rounded-xl bg-[#f4eee3] px-4 py-2 text-sm font-bold"
                >
                  Archiver
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
