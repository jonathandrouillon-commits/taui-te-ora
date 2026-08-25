"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  notificationService,
  Notification,
} from "../services/notification.service";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  useEffect(() => {
    void initNotifications();
  }, []);

  async function initNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setRecipientId(user.id);
    await loadNotifications(user.id);
    setLoading(false);
  }

  async function loadNotifications(id: string) {
    const data =
      await notificationService.getMyNotifications(id);

    setNotifications(data);
  }

  useEffect(() => {
    if (!recipientId) return;

    const channel = supabase
      .channel(`notifications-page-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${recipientId}`,
        },
        async () => {
          await loadNotifications(recipientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId]);

  async function markAsRead(id: string) {
    await notificationService.markAsRead(id);

    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : item
      )
    );
  }

  async function markAllAsRead() {
    if (!recipientId) return;

    await notificationService.markAllAsRead(
      recipientId
    );

    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at || now,
      }))
    );
  }

  const unreadCount =
    notifications.filter(
      (item) => !item.is_read
    ).length;

  if (loading) {
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
              {unreadCount > 0
                ? `${unreadCount} notification(s) non lue(s)`
                : "Toutes les notifications sont lues"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-3xl border p-5 shadow ${
                  notification.is_read
                    ? "border-stone-200 bg-white"
                    : "border-orange-300 bg-orange-50"
                }`}
              >
                <p className="text-xs uppercase text-orange-600">
                  {notification.type}
                </p>

                <h2 className="mt-1 text-lg font-bold text-stone-900">
                  {notification.title}
                </h2>

                <p className="mt-2 text-stone-700">
                  {notification.message}
                </p>

                {!notification.is_read && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow"
                    >
                      Marquer comme lu
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}