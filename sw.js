// TrackARC service worker â€” makes the home-screen web app work fully
// offline. HTML is fetched network-first (so updates arrive when online);
// everything else is cache-first (hashed assets never change).
const CACHE = "trackarc-v13";

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
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./"))
    );
  } else {
    e.respondWith(
      caches.match(req).then(hit =>
        hit ||
        fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
      )
    );
  }
});
