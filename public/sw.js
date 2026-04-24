const CACHE_VERSION = 'v4';
const CACHE_NAME = 'home-items-' + CACHE_VERSION;
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

// لا نخزن أي ملفات ثابتة - نعتمد على الشبكة دائماً
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW v4] Installing Service Worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW v4] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW v4] Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW v4] Failed to cache:', error);
      })
  );
});

// تفعيل Service Worker - حذف جميع الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('[SW v4] Activating Service Worker - Clearing all old caches!');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // حذف جميع الكاش القديم
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW v4] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => {
        console.log('[SW v4] All old caches cleared');
        return self.clients.claim();
      })
      .then(() => {
        // إرسال رسالة للصفحة لإعادة التحميل
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'FORCE_RELOAD' });
        });
      })
  );
});

// استراتيجية Network Only - لا نستخدم الكاش إلا للـ offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تخطي طلبات Chrome extension و non-GET
  if (url.protocol === 'chrome-extension:' || request.method !== 'GET') {
    return;
  }

  // للـ API نستخدم Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // للملفات الثابتة نستخدم Network First (بدلاً من Cache First)
  event.respondWith(networkFirstForStatic(request));
});

// Network First للـ API
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({ error: 'أنت غير متصل بالإنترنت', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network First للملفات الثابتة
async function networkFirstForStatic(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // صفحة offline للتنقل
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

// استقبال الرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }

  if (event.data.type === 'SYNC_DATA') {
    syncData();
  }
});

// مزامنة البيانات
async function syncData() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (error) {
    console.error('[SW v4] Sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'تحديث جديد!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاس' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('مقاضي', options)
  );
});

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW v4] Service Worker loaded - Force reload mode');
