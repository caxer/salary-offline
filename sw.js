// Generated from the complete, data-free app bundle.
const VERSION = "35835da25e753417";
const PREFIX = 'salary-offline:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const FILES = ["index.html","salary.html","dashboard-common.css","dashboard-common.js","link-key.js","open-guide.js","salary-mobile.js","salary-mobile.css","salary-store.js","salary-offline.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","vendor/react.js","vendor/react-dom.js","vendor/babel.js","vendor/chart.js","vendor/LICENSES.txt"];
const urls = FILES.map(file => new URL(file, self.registration.scope).href);
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    for (const url of urls) {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error('Incomplete offline bundle');
      await cache.put(url, response);
    }
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') { event.respondWith(Promise.resolve(new Response('Blocked', { status: 405 }))); return; }
  let path = url.href.split('?')[0].split('#')[0];
  if (path === self.registration.scope) path = new URL('index.html', self.registration.scope).href;
  if (!urls.includes(path)) { event.respondWith(Promise.resolve(new Response('Not found', { status: 404 }))); return; }
  event.respondWith((async () => {
    const response = await (await caches.open(CACHE)).match(path);
    return response || new Response('Offline bundle missing', { status: 503 });
  })());
});
