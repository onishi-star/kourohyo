const CACHE_NAME = 'schedule-cache-v3';

const urlsToCache = [
  './',
  './index.html',
  './style.css'
];

// インストール時：新しいキャッシュを作成
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// リクエスト時：ネットワーク優先、失敗時はキャッシュを使う（GETメソッドのみ）
self.addEventListener('fetch', (e) => {
  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  }
});