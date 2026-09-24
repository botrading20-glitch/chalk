// Loaded into the generated service worker (workbox importScripts in
// vite.config.ts). Tapping the rest notification brings Chalk back.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows.length) return windows[0].focus();
      return self.clients.openWindow(`${self.registration.scope}#/workout`);
    })(),
  );
});
