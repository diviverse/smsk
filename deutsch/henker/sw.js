const CACHE_NAME = "deutsch-henker-v1.8.1";

const FILES_TO_CACHE = [
  "index.html",
  "offline.html",
  "manifest.json",
  "vocab.json",
  "CaveatBrush.ttf",
  "PatrickHand.ttf",
  "icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const isCoreFile =
    event.request.mode === "navigate" ||
    url.pathname.includes("manifest.json") ||
    url.pathname.includes("vocab.json");

  if (isCoreFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match("offline.html");
          });
        }),
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        });
      }),
    );
  }
});
