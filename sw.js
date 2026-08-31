const CACHE_NAME = 'gods-corner-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

const REMINDER_TEXT = {
  en: { title: "God's Corner", body: 'Take a quiet moment today. Your verse is waiting.' },
  es: { title: 'El Rincón de Dios', body: 'Tómate un momento tranquilo hoy. Tu versículo te espera.' }
};

function reminderCopy() {
  const lang = (self.navigator && self.navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  return REMINDER_TEXT[lang];
}

async function showDailyReminder() {
  const copy = reminderCopy();
  await self.registration.showNotification(copy.title, {
    body: copy.body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'daily-verse-reminder'
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-reminder') {
    event.waitUntil(showDailyReminder());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
