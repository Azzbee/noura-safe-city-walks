// Service Worker for Noura - Push Notifications & Offline Support

const CACHE_NAME = 'noura-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - SPA navigation support + cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API and backend requests
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('newsapi')
  ) {
    return;
  }

  // IMPORTANT: For SPA routes (e.g. /settings), always serve index.html
  // so deep-links work even when the server doesn't have a file at that path.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Prefer the cached shell for instant navigations.
          const cached = await caches.match('/index.html');
          if (cached) return cached;

          const response = await fetch('/index.html');
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', response.clone());
          }
          return response;
        } catch {
          return (await caches.match('/')) || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Cache-first for other GET requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'Safety Alert',
    body: 'You have a new safety notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'safety-alert',
    requireInteraction: true,
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: data.url || '/' },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
