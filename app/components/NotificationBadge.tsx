"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
import { notificationService } from "../services/notification.service";

export default function NotificationBadge() {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void initNotifications();
  }, []);

  async function initNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const notifications =
      await notificationService.getMyNotifications(user.id);

    setCount(
      notifications.filter((notification) => !notification.is_read).length
    );
  }

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notification-badge-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async () => {
          const notifications =
            await notificationService.getMyNotifications(userId);

          setCount(
            notifications.filter(
              (notification) => !notification.is_read
            ).length
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="relative">
      <Bell size={28} className="text-[#0f5d52]" />

      {count > 0 && (
        <div className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {count}
        </div>
      )}
    </div>
  );
}