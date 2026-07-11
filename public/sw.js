// Resonate service worker — app-shell + Transformers.js model offline cache.
const SHELL_CACHE = "resonate-shell-v1";
const RUNTIME_CACHE = "resonate-runtime-v1";
const MODEL_CACHE = "resonate-hf-model-v1";

const SHELL_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(SHELL_URLS.map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (![SHELL_CACHE, RUNTIME_CACHE, MODEL_CACHE].includes(k)) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

function isHFModel(url) {
  return url.hostname === "huggingface.co"
      || url.hostname.endsWith(".huggingface.co")
      || url.hostname === "cdn-lfs.huggingface.co";
}
function isHashedAsset(url) {
  return url.origin === self.location.origin
      && /\.(js|css|woff2?|ttf|otf|json|wasm|png|jpg|jpeg|svg|webp)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/~oauth")) return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(SHELL_CACHE);
        c.put("/", fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const c = await caches.open(SHELL_CACHE);
        return (await c.match(req)) || (await c.match("/")) || Response.error();
      }
    })());
    return;
  }

  if (isHFModel(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(MODEL_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }
});