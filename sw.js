const CACHE = 'brvm-analyste-v5';
const ASSETS = [
  './',
  './index.html',
  './app.p1.js',
  './app.p2.js',
  './app-ux.js',
  './tech-charts.js',
  './tech-adaptive.js',
  './logo.svg',
  './manifest.webmanifest',
  './quotes.json',
  './fundamentals.json',
  './history.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const path = url.pathname;
  const networkFirst = path.endsWith('quotes.json') || path.endsWith('fundamentals.json') || path.endsWith('history.json');
  if (networkFirst) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.ok && e.request.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
