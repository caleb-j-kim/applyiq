import { useSyncExternalStore } from 'react';
import { Bell, X } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  clearAllNotifications,
  dismissNotification,
  getNotificationsSnapshot,
  subscribeNotifications,
} from '@/lib/notification-store';
import {
  markAllServerNotificationsRead,
  markServerNotificationRead,
  refreshServerNotifications,
  useServerNotifications,
} from '@/lib/server-notifications';

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  useServerNotifications();
  const notifications = useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot);
  const hasUnread = notifications.length > 0;

  const dismiss = (id: string, serverId?: string) => {
    dismissNotification(id);
    if (serverId) markServerNotificationRead(serverId);
  };

  const clearAll = () => {
    const hadServer = notifications.some((n) => n.serverId);
    clearAllNotifications();
    if (hadServer) markAllServerNotificationsRead();
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && refreshServerNotifications()}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Bell className="h-4.5 w-4.5" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-white dark:ring-black" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-80 p-0">
        <div className="relative flex items-center justify-center px-3 py-2">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {hasUnread && (
            <button
              type="button"
              onClick={clearAll}
              className="absolute right-3 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You're all caught up — no notifications.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col overflow-y-auto">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  {n.title && <p className="text-sm font-medium text-foreground">{n.title}</p>}
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Dismiss notification"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => dismiss(n.id, n.serverId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
