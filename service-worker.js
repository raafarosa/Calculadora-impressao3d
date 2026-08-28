
// Instalação: Salva os arquivos essenciais
self.addEventListener('install', event => {
  self.skipWaiting(); // Força a atualização imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Cache Instalado');
      return cache.addAll(assets);
    })
  );
});

// Ativação: Limpa o lixo (caches antigos)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Busca (Fetch): Estratégia Network-First
// Ele tenta a rede. Se falhar (offline), pega no cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});