// ══════════════════════════════════════════════════════
// DoorLynk Service Worker
// Enables PWA (installable app) + offline support
// ══════════════════════════════════════════════════════

const CACHE_NAME = 'doorlynk-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/visitor.html',
  '/manifest.json',
];

// Install: cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Push notifications (for incoming calls)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Someone is at your door!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'doorlynk-ring',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'answer', title: '📞 Answer' },
      { action: 'decline', title: '✕ Decline' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 DoorLynk', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow('/index.html');
    })
  );
});
