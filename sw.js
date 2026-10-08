// Bump VERSION whenever you change index.html so phones pick up the new shell.
const VERSION = 'thecut-v20';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './ex/info.js'];

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's HTTP cache (GitHub Pages sends max-age=600), so a new
  // version never installs a stale copy of the app.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache GitHub API traffic: sync must always see live data.
  if (url.hostname === 'api.github.com' || url.hostname.endsWith('githubusercontent.com')) return;

  if (req.mode === 'navigate'){
    // Network first (so updates arrive), but give up after 3s and use the cached app at the gym.
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await Promise.race([
          fetch(req, { cache: 'no-cache' }),   // revalidate with the server instead of trusting a 10-min-old copy
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))
        ]);
        if (res.ok) cache.put('./index.html', res.clone());
        return res;
      } catch (err) {
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Everything else (icons, Google Fonts): serve from cache, refresh in the background.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

// Evening reminder pushed from the GitHub Action (.github/scripts/remind.mjs).
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'The Cut', {
    body: d.body || 'Time to close your day.', icon: 'icon-192.png', badge: 'icon-192.png',
    tag: 'close-day', data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c);
    return open ? open.focus() : self.clients.openWindow(e.notification.data.url);
  }));
});
