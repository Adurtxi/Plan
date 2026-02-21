const CACHE_NAME = 'voyager-os-v1';
const MAP_CACHE_NAME = 'leaflet-tiles';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache First Strategy for Leaflet Tiles
  if (url.origin === 'https://tile.openstreetmap.org' || url.origin.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response; // Return from cache
        }
        
        return fetch(event.request).then((networkResponse) => {
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = networkResponse.clone();
          caches.open(MAP_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // If offline and not in cache, just fail silently for tiles
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Fetch from network to update cache in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }).catch((err) => {
            console.log("Offline mode, serving from cache", err);
          });
          return response;
        }

        return fetch(event.request).catch(() => {
            return caches.match('/');
        });
      }
    )
  );
});
