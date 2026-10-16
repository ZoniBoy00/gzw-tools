// Offline support: app shell is cached on first visit, API reads fall back to the last response.
const VERSION = 'gzw-tools-v1'
const SHELL = ['/', '/manifest.webmanifest', '/favicon-32.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(request, fallbackKey) {
  const cache = await caches.open(VERSION)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(fallbackKey || request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(fallbackKey || request)
    if (cached) return cached
    throw error
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION)
  const cached = await cache.match(request)
  const refresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })
  return cached || refresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'))
  } else if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/assets/') || /\.(woff2?|png|webp|svg)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
