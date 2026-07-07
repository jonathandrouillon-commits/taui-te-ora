"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
import { notificationService } from "../services/notification.service";

export default function NotificationBadge() {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initNotifications();
  }, []);

  async function initNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const notifications = await notificationService.getMyNotifications(user.id);
    setCount(notifications.filter((n) => !n.is_read).length);
  }

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const notifications =
            await notificationService.getMyNotifications(userId);

          setCount(notifications.filter((n) => !n.is_read).length);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="relative">
      <Bell size={28} className="text-[#0f5d52]" />

      {count > 0 && (
        <div className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {count}
        </div>
      )}
    </div>
  );
}