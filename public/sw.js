const CACHE_NAME = "charlotte-gembook-v3";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/stories/neverending-charlotte/cover.png",
  "/stories/neverending-charlotte/page-1.png",
  "/stories/neverending-charlotte/page-2.png",
  "/stories/neverending-charlotte/page-3.png",
  "/stories/neverending-charlotte/page-4.png",
  "/stories/neverending-charlotte/page-5.png",
  "/stories/neverending-charlotte/page-6.png",
  "/stories/neverending-charlotte/page-7.png",
  "/stories/neverending-charlotte/page-8.png",
  "/stories/neverending-charlotte/page-9.png",
  "/stories/neverending-charlotte/page-10.png",
  "/audio/neverending-charlotte/cover.mp3",
  "/audio/neverending-charlotte/page-1.mp3",
  "/audio/neverending-charlotte/page-2.mp3",
  "/audio/neverending-charlotte/page-3.mp3",
  "/audio/neverending-charlotte/page-4.mp3",
  "/audio/neverending-charlotte/page-5.mp3",
  "/audio/neverending-charlotte/page-6.mp3",
  "/audio/neverending-charlotte/page-7.mp3",
  "/audio/neverending-charlotte/page-8.mp3",
  "/audio/neverending-charlotte/page-9.mp3",
  "/audio/neverending-charlotte/page-10.mp3",
  "/audio/neverending-charlotte/closing.mp3",
  "/stories/casper-charlotte/cover.png",
  "/stories/casper-charlotte/page-1.png",
  "/stories/casper-charlotte/page-2.png",
  "/stories/casper-charlotte/page-3.png",
  "/stories/casper-charlotte/page-4.png",
  "/stories/casper-charlotte/page-5.png",
  "/stories/casper-charlotte/page-6.png",
  "/stories/casper-charlotte/page-7.png",
  "/stories/casper-charlotte/page-8.png",
  "/stories/casper-charlotte/page-9.png",
  "/stories/casper-charlotte/page-10.png",
  "/audio/casper-charlotte/cover.mp3",
  "/audio/casper-charlotte/page-1.mp3",
  "/audio/casper-charlotte/page-2.mp3",
  "/audio/casper-charlotte/page-3.mp3",
  "/audio/casper-charlotte/page-4.mp3",
  "/audio/casper-charlotte/page-5.mp3",
  "/audio/casper-charlotte/page-6.mp3",
  "/audio/casper-charlotte/page-7.mp3",
  "/audio/casper-charlotte/page-8.mp3",
  "/audio/casper-charlotte/page-9.mp3",
  "/audio/casper-charlotte/page-10.mp3",
  "/audio/casper-charlotte/closing.mp3",
  "/stories/labyrinth-charlotte/cover.png",
  "/stories/labyrinth-charlotte/page-1.png",
  "/stories/labyrinth-charlotte/page-2.png",
  "/stories/labyrinth-charlotte/page-3.png",
  "/stories/labyrinth-charlotte/page-4.png",
  "/stories/labyrinth-charlotte/page-5.png",
  "/stories/labyrinth-charlotte/page-6.png",
  "/stories/labyrinth-charlotte/page-7.png",
  "/stories/labyrinth-charlotte/page-8.png",
  "/stories/labyrinth-charlotte/page-9.png",
  "/stories/labyrinth-charlotte/page-10.png",
  "/audio/labyrinth-charlotte/cover.mp3",
  "/audio/labyrinth-charlotte/page-1.mp3",
  "/audio/labyrinth-charlotte/page-2.mp3",
  "/audio/labyrinth-charlotte/page-3.mp3",
  "/audio/labyrinth-charlotte/page-4.mp3",
  "/audio/labyrinth-charlotte/page-5.mp3",
  "/audio/labyrinth-charlotte/page-6.mp3",
  "/audio/labyrinth-charlotte/page-7.mp3",
  "/audio/labyrinth-charlotte/page-8.mp3",
  "/audio/labyrinth-charlotte/page-9.mp3",
  "/audio/labyrinth-charlotte/page-10.mp3",
  "/audio/labyrinth-charlotte/closing.mp3",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
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
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first strategy for story images and voiceover audio
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
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
