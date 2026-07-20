// App-shell service worker. Bump CACHE_VERSION when deploying changes so
// clients pick up new files.
const CACHE_VERSION = 'fittrack-v2';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './manifest.webmanifest',
  './js/app.js',
  './js/utils.js',
  './js/exercises.js',
  './js/split.js',
  './js/plan-gen.js',
  './js/energy.js',
  './js/nutrition.js',
  './js/progress.js',
  './js/recap.js',
  './js/ai.js',
  './js/fitbit.js',
  './js/demo-store.js',
  './js/firebase-store.js',
  './js/views/modal.js',
  './js/views/detail.js',
  './js/views/today.js',
  './js/views/plan.js',
  './js/views/meals.js',
  './js/views/timer.js',
  './js/views/history.js',
  './js/views/weight.js',
  './js/views/settings.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/chart.umd.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Same-origin: network-first so deploys show up, cache fallback offline.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true })),
    );
  }
  // Cross-origin (Firebase, CDNs): let the network handle it.
});
