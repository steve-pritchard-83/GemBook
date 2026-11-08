const SHELL_CACHE_NAME = "charlotte-gembook-shell-v4";
const MEDIA_CACHE_NAME = "charlotte-gembook-media-v4";

// Lightweight app shell & book covers precached immediately on install
const SHELL_PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/stories/neverending-charlotte/cover.png",
  "/stories/casper-charlotte/cover.png",
  "/stories/labyrinth-charlotte/cover.png",
  "/audio/neverending-charlotte/cover.mp3",
  "/audio/casper-charlotte/cover.mp3",
  "/audio/labyrinth-charlotte/cover.mp3",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_PRECACHE_ASSETS).catch(() => {
        // Ignore individual asset failure during initial install
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== SHELL_CACHE_NAME && key !== MEDIA_CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow the app to request background caching of all pages/audio for an opened story
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_STORY_ASSETS") {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
        for (const url of urls) {
          try {
            const existing = await cache.match(url);
            if (!existing) {
              const res = await fetch(url);
              if (res && res.status === 200) {
                await cache.put(url, res);
              }
            }
          } catch {
            // Ignore offline fetch failure
          }
        }
      })
    );
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first strategy for story images, voiceover audio, and icons
  if (
    url.pathname.startsWith("/stories/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches
              .open(MEDIA_CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML/app routes
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches
            .open(SHELL_CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
