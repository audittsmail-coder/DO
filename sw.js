const CACHE_NAME = 'aquapulse-shell-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// network-first เสมอ: ผู้ใช้ที่ออนไลน์จะได้เวอร์ชันล่าสุดทุกครั้ง แคชทำหน้าที่แค่ fallback ตอนออฟไลน์
// (ไม่ยุ่งกับคำขอไป Firebase/Open-Meteo เลย ปล่อยให้วิ่งตรงไปเน็ตเวิร์กเสมอ กัน data ค้างเก่า)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
