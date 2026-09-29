/* /date service worker.
   Pages: network first, cache as you go, offline page when both fail.
   Static assets and demo photos: cache first, refresh in the background.
   Supabase and any other origin: never touched. */
const VERSION = 'date-v5'
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '')
const OFFLINE = `${BASE}/offline/`
const SHELL = [OFFLINE, `${BASE}/`, `${BASE}/icons/icon-192.png`]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting()
})

function isStatic(url) {
  return url.pathname.startsWith(`${BASE}/_next/static/`) || url.pathname.startsWith(`${BASE}/demo/`) ||
    url.pathname.startsWith(`${BASE}/icons/`) || /\.(png|jpg|jpeg|webp|svg|woff2?|mp3)$/.test(url.pathname)
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(VERSION).then((c) => c.put(req, copy))
        return res
      }).catch(() => caches.match(req).then((hit) => hit || caches.match(OFFLINE))),
    )
    return
  }

  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()))
          return res
        }).catch(() => hit)
        return hit || refresh
      }),
    )
  }
})

/* Web push: Val's notes on the lock screen. Payload is JSON
   { title, body, url, tag }. */
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { body: e.data && e.data.text() } }
  const title = data.title || '/date'
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: `${BASE}/icons/icon-192.png`,
    badge: `${BASE}/icons/maskable-192.png`,
    tag: data.tag || 'val',
    renotify: Boolean(data.tag),
    data: { url: data.url || `${BASE}/inbox/` },
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = new URL(e.notification.data?.url || `${BASE}/inbox/`, self.location.origin).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ('focus' in c) { c.navigate(target); return c.focus() }
    }
    return self.clients.openWindow(target)
  }))
})
