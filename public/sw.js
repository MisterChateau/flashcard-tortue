/* Flashcard Tortue — Service Worker (PWA installable + cache offline) */
const CACHE = 'tortue-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/tortue.jpg',
  '/vendor/supabase.min.js',
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Jamais de cache pour l'API ni Supabase (données fraîches + auth)
  if (url.pathname.startsWith('/api/') || url.hostname.endsWith('supabase.co')) return;

  // Network-first pour la navigation, fallback cache (mode offline)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('/', copy)).catch(() => {});
        return r;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first pour les assets statiques (dont les splash screens)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && e.request.method === 'GET') {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return r;
    }).catch(() => hit))
  );
});
