import { getToken, deleteToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { ref, remove, set } from "firebase/database";
import { app, db } from "@/lib/firebase";
import { getFirebaseVapidKey } from "@/lib/firebase-config";

const FCM_TOKEN_ID_KEY = "rider-garage-fcm-token-id";
const FCM_USER_ID_KEY = "rider-garage-fcm-user-id";

let messagingInstance: Messaging | null = null;
let foregroundHandlerAttached = false;

function getVapidKey(): string | null {
  const key = getFirebaseVapidKey();
  return key || null;
}

function tokenStorageId(token: string): string {
  return token.replace(/[.#$[\]/]/g, "_").slice(-48);
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;

  if (!messagingInstance) {
    const { getMessaging } = await import("firebase/messaging");
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (existing) return existing;

  return navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

export function isFcmConfigured(): boolean {
  return Boolean(getVapidKey());
}

export async function registerFcmToken(userId: string): Promise<string | null> {
  const vapidKey = getVapidKey();
  if (!vapidKey) {
    console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set.");
    return null;
  }

  const messaging = await getMessagingInstance();
  const registration = await getServiceWorkerRegistration();
  if (!messaging || !registration) return null;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  const tokenId = tokenStorageId(token);
  await set(ref(db, `pushTokens/${userId}/${tokenId}`), {
    token,
    userId,
    updatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0, 200),
  });

  localStorage.setItem(FCM_TOKEN_ID_KEY, tokenId);
  localStorage.setItem(FCM_USER_ID_KEY, userId);

  attachForegroundMessageHandler(messaging);
  return token;
}

export async function unregisterFcmToken(userId: string): Promise<void> {
  const tokenId = localStorage.getItem(FCM_TOKEN_ID_KEY);
  const storedUserId = localStorage.getItem(FCM_USER_ID_KEY);

  if (tokenId && storedUserId === userId) {
    await remove(ref(db, `pushTokens/${userId}/${tokenId}`));
  }

  const messaging = await getMessagingInstance();
  if (messaging) {
    try {
      await deleteToken(messaging);
    } catch {
      // Token may already be invalid.
    }
  }

  localStorage.removeItem(FCM_TOKEN_ID_KEY);
  localStorage.removeItem(FCM_USER_ID_KEY);
}

function attachForegroundMessageHandler(messaging: Messaging): void {
  if (foregroundHandlerAttached) return;
  foregroundHandlerAttached = true;

  onMessage(messaging, (payload) => {
    if (typeof document === "undefined" || document.visibilityState === "visible") return;
    if (Notification.permission !== "granted") return;

    const title = payload.data?.title || payload.notification?.title || "Rider Garage";
    const body = payload.data?.body || payload.notification?.body || "";

    try {
      const notification = new Notification(title, {
        body,
        icon: "/icons/notification-icon.svg",
        tag: payload.data?.tag || "rider-garage-fcm",
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Ignore notification errors in foreground handler.
    }
  });
}
