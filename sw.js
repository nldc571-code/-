// Keep the application shell current. A cache-first response for game.js can
// leave browsers running an older build whose controls no longer match index.html.
const CACHE_NAME = "rps-survival-v12";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/game.js",
  "/manifest.webmanifest",
  "/assets/app-icon.png",
  "/assets/ui/health-heart.png",
  "/assets/characters/scout.png",
  "/assets/characters/vanguard.png",
  "/assets/characters/medic.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Refresh UI files before using the offline copy so new controls always get
  // their matching event handlers. The cache remains the offline fallback.
  const appShell = ["/", "/index.html", "/styles.css", "/game.js"].includes(requestUrl.pathname);
  if (appShell) {
    event.respondWith(fetch(event.request).then((response) => {
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html"))));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match("/index.html"))));
});