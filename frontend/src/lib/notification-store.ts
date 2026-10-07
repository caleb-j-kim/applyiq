// Plain external store (not a React context) so it's usable both from components
// (via useSyncExternalStore) and from api-client.ts, which isn't a component and
// can't call hooks. Session-scoped and in-memory only — these are live "something
// just went wrong talking to the backend" alerts, not a persisted domain record,
// so there's no backend round-trip and nothing survives a refresh (consistent with
// this app's existing toasts, which are equally ephemeral).

export interface AppNotification {
  id: string;
  message: string;
  createdAt: number;
}

type Listener = () => void;

let notifications: AppNotification[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function addNotification(message: string) {
  const notification: AppNotification = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    message,
    createdAt: Date.now(),
  };
  notifications = [notification, ...notifications];
  emit();
}

export function dismissNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  emit();
}

export function clearAllNotifications() {
  notifications = [];
  emit();
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationsSnapshot(): AppNotification[] {
  return notifications;
}
