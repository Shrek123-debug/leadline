// LeadLine service worker
// ------------------------------------------------------------------
// Strategy: cache-as-you-go (stale-while-revalidate), not a fixed
// precache list. Vite's build output has content-hashed filenames that
// change every deploy, so a hardcoded manifest would go stale. Instead:
// the first time any GET request succeeds, we store it. Later requests
// (including fully offline ones) are served from that cache instantly,
// while a background fetch tries to refresh the cache for next time.
//
// The Netlify Function that generates letters is explicitly excluded —
// that call always needs a live network round-trip, and pretending
// otherwise would be dishonest about what this app can actually do
// offline.

const CACHE_NAME = "leadline-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever intercept simple GETs. Never touch the letter-generation
  // API call (or any other POST) — that must always hit the real network.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/.netlify/functions/")) return;
  if (url.origin !== self.location.origin) return; // don't cache third-party requests (fonts CDN, etc.)

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      // Kick off a network fetch regardless; if it succeeds, refresh the
      // cache for next time. If we already have something cached, return
      // that immediately without waiting on the network at all.
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) return cached;

      const fresh = await networkFetch;
      if (fresh) return fresh;

      // Nothing cached and the network failed: for a page navigation,
      // fall back to whatever shell we do have so the app still opens.
      if (request.mode === "navigate") {
        const shell = (await cache.match("/")) || (await cache.match("/index.html"));
        if (shell) return shell;
      }

      return new Response("Offline and not yet cached.", { status: 503, statusText: "Offline" });
    })
  );
});
