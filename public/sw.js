/* -----------------------------------------------------------------------------
 * SUNO — SERVICE WORKER
 * -----------------------------------------------------------------------------
 * The network is the first infrastructure to fail in a flood, a cyclone or an
 * earthquake. An app that tells a person to evacuate and then shows a blank page
 * when the tower drops has a hole in it that no amount of interface work closes.
 *
 * So the contract this file implements is:
 *
 *   Once Suno has been opened once, on any connection, it opens again with no
 *   connection at all — the shell, the icons, the preparedness plans, the
 *   helpline numbers, the shelter register, and the language the reader chose.
 *
 * What it deliberately does NOT do: serve a cached warning as if it were
 * current. Warnings are network-only. If we cannot reach the network we show the
 * last one we received WITH ITS TIMESTAMP and say plainly that it is stale. A
 * silently stale evacuation notice is worse than an honest absence of one.
 *
 * Cache strategy, by request type:
 *   navigation        network-first (2.5s), fall back to the cached shell
 *   /_next/static/*   cache-first, immutable — hashed filenames never change
 *   Google Fonts      stale-while-revalidate
 *   OSM map tiles     cache-first, capped at 220 entries, oldest evicted
 *   /api/*            network-only, never cached
 *   same-origin rest  stale-while-revalidate
 * -------------------------------------------------------------------------- */

const VERSION = "suno-v10";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const FONTS = `${VERSION}-fonts`;
const TILES = `${VERSION}-tiles`;

const TILE_LIMIT = 220;

/* The shell. Small on purpose — everything else arrives through runtime caching
 * as the reader actually uses it, so a first visit does not pay for screens the
 * reader may never open. */
/* "/app" is the warning screen and is the one URL that MUST survive the network
 * going away — it is the whole point of the offline story. "/" is the landing
 * page and "/how-it-runs" the engineering note; both are worth having but
 * neither is what someone opens while a river is rising. */
const SHELL_URLS = ["/app", "/", "/how-it-runs", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      // addAll is atomic: one 404 would fail the whole install and leave the
      // reader with no offline copy at all. Individual puts degrade instead.
      .then((c) => Promise.allSettled(SHELL_URLS.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/* The page posts the locale chunk it just loaded, so the language a person
 * actually chose is available offline. Without this, a reader who picked
 * Assamese online would fall back to English the moment the tower dropped —
 * which is precisely the failure this product exists to fix. */
self.addEventListener("message", (e) => {
  const data = e.data || {};
  if (data.type === "WARM" && Array.isArray(data.urls)) {
    e.waitUntil(
      caches.open(STATIC).then((c) =>
        Promise.allSettled(
          data.urls.filter((u) => typeof u === "string").slice(0, 40).map((u) => c.add(u)),
        ),
      ),
    );
  }
  if (data.type === "SKIP_WAITING") self.skipWaiting();
});

function isTile(url) {
  return /tile\.openstreetmap\.org$/.test(url.hostname);
}
function isFont(url) {
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

async function trimCache(name, limit) {
  const c = await caches.open(name);
  const keys = await c.keys();
  // Cache keys are insertion-ordered, so the head is the oldest.
  for (let i = 0; i < keys.length - limit; i++) await c.delete(keys[i]);
}

async function cacheFirst(req, cacheName, opts) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === "opaque")) {
      c.put(req, res.clone());
      if (opts && opts.limit) trimCache(cacheName, opts.limit);
    }
    return res;
  } catch (err) {
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await net) || Response.error();
}

/** Network-first with a real deadline. On a degraded connection a request can
 *  hang for thirty seconds; a person watching a river does not have thirty
 *  seconds, so we give up at 2.5s and serve the shell we already have. */
async function networkFirstNav(req) {
  const c = await caches.open(SHELL);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 2500)),
    ]);
    // Cache each navigable route under its own key. Storing every navigation
    // under "/" meant a person whose last visit was the landing page got the
    // landing page back when they went offline on the warning screen.
    if (res && res.ok) {
      const path = new URL(req.url).pathname;
      c.put(SHELL_URLS.includes(path) ? path : "/app", res.clone());
    }
    return res;
  } catch (err) {
    return (
      (await c.match(req)) ||
      (await c.match("/app")) ||
      (await c.match("/")) ||
      Response.error()
    );
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Warnings are never served from cache as if they were current.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(networkFirstNav(req));
    return;
  }

  if (isTile(url)) {
    e.respondWith(cacheFirst(req, TILES, { limit: TILE_LIMIT }));
    return;
  }

  if (isFont(url)) {
    e.respondWith(staleWhileRevalidate(req, FONTS));
    return;
  }

  if (url.origin === self.location.origin) {
    // Hashed build output is immutable — cache-first is correct and free.
    if (url.pathname.startsWith("/_next/static/")) {
      e.respondWith(cacheFirst(req, STATIC));
      return;
    }
    e.respondWith(staleWhileRevalidate(req, STATIC));
  }
});
