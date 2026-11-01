/* OpenPulpit service worker: go-live notifications (OP-27). The PWA shell cache arrives with OP-40. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "A preacher you follow is live";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Tap to listen.",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag,
      renotify: false,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
