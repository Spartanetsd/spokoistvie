/* Service worker: precaches the whole app at install, then works fully offline.
   During the build the list below is replaced with the real file names. */
const VERSION = 'e5b6d6d2f69d';
const PRECACHE = ["./", "./app.css", "./app.js", "./apple-touch-icon.png", "./banner-after.webp", "./banner-before.webp", "./banner-blast.webp", "./banner-library.webp", "./banner-provocations.webp", "./banner-sleep.webp", "./banner-together.webp", "./crest.webp", "./icon-192.png", "./icon-32.png", "./icon-512.png", "./icon-maskable-512.png", "./index.html", "./manifest.webmanifest", "./splash-1170x2532.png", "./splash-1179x2556.png", "./splash-1206x2622.png", "./splash-1260x2736.png", "./splash-1290x2796.png", "./splash-1320x2868.png", "./thumb-after.webp", "./thumb-before.webp", "./thumb-blast.webp", "./thumb-library.webp", "./thumb-provocations.webp", "./thumb-sleep.webp", "./thumb-together.webp"];
const CACHE = 'spokoistvie-' + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('spokoistvie-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: answer from cache instantly (weak network must not delay opening), refresh in background.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = (await cache.match('./index.html')) || (await cache.match('./'));
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put('./index.html', res.clone());
            return res;
          })
          .catch(() => null);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        const res = await network;
        return res || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }),
    );
    return;
  }

  // Static files: cache first.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
