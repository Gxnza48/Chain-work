/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Workbox injects the build manifest here (injectManifest strategy).
precacheAndRoute(self.__WB_MANIFEST);

// Activate updated SW immediately so push handlers stay fresh.
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
}

self.addEventListener('push', (event) => {
  let data: PushPayload = {};
  try {
    data = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    data = { title: 'ChainWork', body: event.data?.text() };
  }

  const title = data.title ?? 'ChainWork';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: data.icon ?? '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    tag: data.tag,
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Focus an open tab if we have one.
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && target !== '/') {
            (client as WindowClient).navigate(target).catch(() => {});
          }
          return undefined;
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
