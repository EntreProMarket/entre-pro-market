// public/sw.js
// Service Worker for Entre PRO Market PWA
//
// Strategy:
// - HTML pages: network-first, falling back to cache, falling back to a
//   dedicated offline page if nothing cached exists for that URL yet.
// - Images (product photos, flyers, portfolios, logos): cache-first once
//   fetched successfully, so anything a user has already viewed (their own
//   profile, browsed products/events) stays visible offline afterward.
// - Everything else (JS/CSS bundles, static assets): cache-first for speed,
//   network fallback if not yet cached.
// - API calls, Supabase, Stripe: always network — never cached, since this
//   is live data (orders, auth, payments) that must never be served stale.

const CACHE_VERSION = "v2";
const PAGE_CACHE = `entrepromarket-pages-${CACHE_VERSION}`;
const IMAGE_CACHE = `entrepromarket-images-${CACHE_VERSION}`;
const STATIC_CACHE = `entrepromarket-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/home",
  "/marketplace",
  OFFLINE_URL,
  "/logo-transparent.png",
  "/logo-circle.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently continue if some precache URLs aren't available yet —
        // they'll get cached the first time they're actually visited instead.
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const currentCaches = [PAGE_CACHE, IMAGE_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

function isImageRequest(request) {
  return request.destination === "image" || /\.(png|jpe?g|webp|gif|svg)$/i.test(new URL(request.url).pathname);
}

function isNeverCached(url) {
  return url.includes("/api/") || url.includes("supabase") || url.includes("stripe");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (isNeverCached(request.url)) return;

  // ── Page navigations — network-first, cache fallback, offline page as last resort ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // ── Images — cache-first, so anything already viewed stays available offline ──
  if (isImageRequest(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached); // nothing to fall back to if never fetched
      })
    );
    return;
  }

  // ── Everything else (JS, CSS, fonts) — cache-first for speed ──
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
