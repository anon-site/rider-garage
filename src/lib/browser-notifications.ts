const STORAGE_KEY = "rider-garage-browser-notifications";

export type BrowserNotificationPreference = "enabled" | "disabled";

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPreference(): BrowserNotificationPreference | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "enabled" || value === "disabled") return value;
  return null;
}

export function setBrowserNotificationPreference(value: BrowserNotificationPreference): void {
  localStorage.setItem(STORAGE_KEY, value);
}

export function areBrowserNotificationsEnabled(): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;
  return getBrowserNotificationPreference() === "enabled";
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function enableBrowserNotifications(userId?: string): Promise<{
  ok: boolean;
  permission: NotificationPermission;
  pushRegistered: boolean;
}> {
  const permission = await requestBrowserNotificationPermission();
  if (permission === "granted") {
    setBrowserNotificationPreference("enabled");

    let pushRegistered = false;
    if (userId) {
      try {
        const { isFcmConfigured, registerFcmToken } = await import("@/lib/fcm");
        if (isFcmConfigured()) {
          pushRegistered = Boolean(await registerFcmToken(userId));
        }
      } catch (error) {
        console.warn("[FCM] Token registration failed:", error);
      }
    }

    return { ok: true, permission, pushRegistered };
  }
  setBrowserNotificationPreference("disabled");
  return { ok: false, permission, pushRegistered: false };
}

export async function disableBrowserNotifications(userId?: string): Promise<void> {
  setBrowserNotificationPreference("disabled");
  if (userId) {
    const { unregisterFcmToken } = await import("@/lib/fcm");
    await unregisterFcmToken(userId);
  }
}

type ShowBrowserNotificationOptions = {
  body: string;
  tag?: string;
};

export function showBrowserNotification(
  title: string,
  { body, tag }: ShowBrowserNotificationOptions
): void {
  if (!areBrowserNotificationsEnabled()) return;

  try {
    const notification = new Notification(title, {
      body,
      tag,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers block notifications outside secure contexts or user gestures.
  }
}

export function notifyAttendanceMovement(
  title: string,
  body: string,
  tag: string
): void {
  if (!areBrowserNotificationsEnabled()) return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  showBrowserNotification(title, { body, tag });
}
