// public/sw.js
// KILL SWITCH: the previous service worker's caching was serving stale
// JS bundles after deploys, causing the app to hang/freeze on refresh.
// This version unregisters itself and deletes all caches for every client,
// then the app runs with no service worker at all until reintroduced deliberately.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

self.addEventListener("fetch", () => {
  // No caching logic at all — pass everything straight to network.
});
