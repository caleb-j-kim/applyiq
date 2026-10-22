import { useEffect } from 'react';

import { apiFetch } from '@/lib/api-client';
import { setServerNotifications, type AppNotification } from '@/lib/notification-store';

// Backend: com.applyiq.notifications.NotificationController
interface NotificationDto {
  id: string;
  title: string;
  message: string | null;
  createdAt: string;
}

const POLL_MS = 60_000;
let subscribers = 0;
let timer: number | undefined;

export async function refreshServerNotifications() {
  try {
    const items = await apiFetch<NotificationDto[]>('/notifications?unreadOnly=true', {}, { quiet: true });
    setServerNotifications(
      items.map(
        (n): AppNotification => ({
          id: `server:${n.id}`,
          serverId: n.id,
          title: n.title,
          message: n.message ?? '',
          createdAt: new Date(n.createdAt).getTime(),
        })
      )
    );
  } catch {
    // backend unreachable — keep showing what we had and try again next poll
  }
}

export function markServerNotificationRead(serverId: string) {
  return apiFetch(`/notifications/${serverId}/read`, { method: 'PATCH' }).catch(() => undefined);
}

export function markAllServerNotificationsRead() {
  return apiFetch('/notifications/read-all', { method: 'PATCH' }).catch(() => undefined);
}

// The navbar renders a bell for desktop and one for mobile; they share one poll.
export function useServerNotifications() {
  useEffect(() => {
    if (subscribers++ === 0) {
      refreshServerNotifications();
      timer = window.setInterval(refreshServerNotifications, POLL_MS);
    }
    return () => {
      if (--subscribers === 0) window.clearInterval(timer);
    };
  }, []);
}
