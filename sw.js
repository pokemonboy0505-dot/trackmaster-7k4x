// TrackARC service worker — makes the home-screen web app work fully
// offline. HTML is fetched network-first (so updates arrive when online);
// everything else is cache-first (hashed assets never change).
const CACHE = "trackarc-v136";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(["./", "./manifest.webmanifest", "./icon.png", "./icon-192.png", "./icon-512.png", "./privacy.html"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          // Only a good response may become the cached app shell — caching
          // a host 404/500 page would brick every offline startup after.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put("./", copy));
          }
          return res;
        })
        .catch(() => caches.match("./"))
    );
  } else {
    e.respondWith(
      caches.match(req).then(hit =>
        hit ||
        fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
