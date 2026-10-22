// Plain external store (not a React context) so it's usable both from components
// (via useSyncExternalStore) and from api-client.ts, which isn't a component and
// can't call hooks. Two sources: in-memory "local" alerts (API errors, finished AI
// results — gone on refresh), and the user's unread backend notifications (email
// automation, follow-ups), which server-notifications.ts keeps in sync.

export interface AppNotification {
  id: string;
  title?: string;
  message: string;
  createdAt: number;
  // Set for notifications stored on the backend (see server-notifications.ts); dismissing marks them read there.
  serverId?: string;
}

type Listener = () => void;

let local: AppNotification[] = [];
let server: AppNotification[] = [];
let notifications: AppNotification[] = [];
const listeners = new Set<Listener>();

function emit() {
  notifications = [...local, ...server].sort((a, b) => b.createdAt - a.createdAt);
  for (const listener of listeners) listener();
}

export function setServerNotifications(items: AppNotification[]) {
  server = items;
  emit();
}

export function addNotification(message: string) {
  const notification: AppNotification = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    message,
    createdAt: Date.now(),
  };
  local = [notification, ...local];
  emit();
}

export function dismissNotification(id: string) {
  local = local.filter((n) => n.id !== id);
  server = server.filter((n) => n.id !== id);
  emit();
}

export function clearAllNotifications() {
  local = [];
  server = [];
  emit();
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationsSnapshot(): AppNotification[] {
  return notifications;
}

// Settings page toggles. Per browser, like the follow-up settings beside them.
export const DEFAULT_NOTIFICATION_SETTINGS = {
  followUps: true,
  matchScores: true,
  interviewPrep: true,
  weeklyDigest: false,
};
export type NotificationSetting = keyof typeof DEFAULT_NOTIFICATION_SETTINGS;
const SETTINGS_KEY = 'applyiq.notificationSettings';

export function loadNotificationSettings(): Record<NotificationSetting, boolean> {
  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(settings: Record<NotificationSetting, boolean>) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage blocked (private mode) — the toggle just won't persist
  }
}
