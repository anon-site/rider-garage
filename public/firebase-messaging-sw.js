/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (background push when browser is closed/minimized).

importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB9LgXRw_YCKtOtJ8xvm6EAWvf5z2b0xHA",
  authDomain: "rider-garage.firebaseapp.com",
  databaseURL: "https://rider-garage-default-rtdb.firebaseio.com",
  projectId: "rider-garage",
  storageBucket: "rider-garage.firebasestorage.app",
  messagingSenderId: "1301708487",
  appId: "1:1301708487:web:f642546c923851f53a88e2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || payload.notification?.title || "Rider Garage";
  const body = payload.data?.body || payload.notification?.body || "";

  return self.registration.showNotification(title, {
    body,
    icon: "/icons/notification-icon.svg",
    badge: "/icons/notification-icon.svg",
    tag: payload.data?.tag || "rider-garage-attendance",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/dashboard");
      }
      return undefined;
    })
  );
});
