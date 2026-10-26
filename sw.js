// Generated from the complete, data-free app bundle.
const VERSION = "988913b6637f9c1b";
const PREFIX = 'salary-offline:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
// 每個檔案的 SHA-256：CDN 可能在部署後幾分鐘內還給舊檔，混到新舊檔案時不安裝，下次再試。
const DIGESTS = {"index.html":"PftDaTj7UFUvYg3yYWRl4vFMG6uSxTpmGbCa/Yo3KWA=","salary.html":"oEz8b4/z2sypgqMfZ1MYXyU/leeBAIehxWQrlxLMUe8=","dashboard-common.css":"I9SRPHOEgfFH81g3n7BSxM/CTJmVmJrX2VeeOproWqg=","dashboard-common.js":"xJ+CyhIatLTWFKWSkcEHCx8VY5U5MIZD8YTjm0P+sE0=","link-key.js":"Q1YgxUKaLX6PIaGKNxZbS79W9x2MkUmpBoaTBUQj+LE=","open-guide.js":"XbIVaDPUOwIOoxmB9X1OKoyQDftSh6y87E3K6hcexOk=","salary-mobile.js":"THvUU6yYN1Ej17SjaZvVnFupklwSHWQqg0uTrSi6u5M=","salary-app.js":"rUshlYKlKdOqLlYcZrVl3HlC4DtODRRbU7HBY2BNN2E=","salary-mobile.css":"dzq6/3itcRSlhdo0SJcdbkrUX5srTQEYkk5jjTCwWt8=","salary-store.js":"p8pNF1wNsRM+WJ1rb/0tuaWvNh2WGE3cYBmBd6CHmXY=","salary-offline.js":"3+FuC2Z1G3FBdNIsA3jh7940v/myhZ9ftzRht4jqDt4=","manifest.webmanifest":"fLU3bSi5/nhO32H87ybxAU6ow/8eB70o2+Tl2tJOEjg=","icons/icon-192.png":"iuSt1NgmHJjmvGjYinHQB9RjzwpJcC8JdsQ1AbXK9bs=","icons/icon-512.png":"wrIcoMIMPm3btt2n2qFDmAKhHAHuhIP8NttDCy3YEQU=","icons/apple-touch-icon.png":"CcPu+RCSdWOApAXLDMY5VVfEWrPxuxS31rHavxw3JKQ=","vendor/react.js":"2Unxw2h67a3O2shSYYZfKbF80nOZfn9rK/xTsvnUxN0=","vendor/react-dom.js":"NfT5dPSyvNRNpzljNH+JUuNB+DkJ5EmCJ9Tia5j2bw0=","vendor/chart.js":"dEAdc43T4D7l37O2hBIQ/ixOrYqWDEARykugt4qf2PM=","vendor/LICENSES.txt":"HNtohkFLYzAQoJ0a0cPuqfRUk4ayxAo3dPwNZqihDoo="};
const FILES = Object.keys(DIGESTS);
const urls = FILES.map(file => new URL(file, self.registration.scope).href);
const base64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    for (const [index, url] of urls.entries()) {
      // ?v= 讓 CDN 不用快取的舊檔；快取時仍以不含查詢的網址存放。
      const response = await fetch(url + '?v=' + VERSION, { cache: 'reload' });
      if (!response.ok) throw new Error('Incomplete offline bundle');
      const digest = base64(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer()));
      if (digest !== DIGESTS[FILES[index]]) throw new Error('Mixed offline bundle: ' + FILES[index]);
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
