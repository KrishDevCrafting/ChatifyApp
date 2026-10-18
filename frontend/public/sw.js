// Chatify Service Worker for Android & Mobile Push/Local Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click: Bring Chatify window to foreground
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If Chatify is already open, focus that tab
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        // If not open, launch new window
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});
