const CACHE_NAME = 'lol-tournament-v3';

const PRECACHE_ASSETS = ['/', '/manifest.json'];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Offline - Tournament Panel</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070B14;color:#c8aa6e;font-family:sans-serif;text-align:center}
    h1{font-size:1.5rem;margin-bottom:.5rem}
    p{color:#8b7a4a;font-size:1rem}
  </style>
</head>
<body>
  <div>
    <h1>Brak połączenia</h1>
    <p>Sprawdź połączenie z internetem i spróbuj ponownie.</p>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?|ttf|eot|json)(\?.*)?$/i.test(url.pathname);
}

// Network-first: try network, fall back to cache
function networkFirst(event) {
  return fetch(event.request)
    .then((response) => {
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // For navigation requests, show offline page
        if (event.request.mode === 'navigate') {
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
}

// Cache-first: try cache, fall back to network
function cacheFirst(event) {
  return caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    });
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  if (isApiRequest(url)) {
    // API calls: network-first
    event.respondWith(networkFirst(event));
  } else if (isStaticAsset(url)) {
    // Static assets: cache-first
    event.respondWith(cacheFirst(event));
  } else {
    // HTML pages / navigation: network-first
    event.respondWith(networkFirst(event));
  }
});
