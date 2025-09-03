// Service Worker para Orkut BR PWA
const CACHE_NAME = 'orkut-br-v1.0.0';
const STATIC_CACHE_NAME = 'orkut-br-static-v1.0.0';
const RUNTIME_CACHE_NAME = 'orkut-br-runtime-v1.0.0';

// Arquivos essenciais para cache
const ESSENTIAL_FILES = [
  '/',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Arquivos para cache offline
const OFFLINE_PAGES = [
  '/',
  '/login',
  '/perfil',
  '/mensagens',
  '/comunidades',
];

// URLs que devem ser sempre atualizadas
const NETWORK_FIRST_URLS = [
  '/api/',
  '/auth/',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cache aberto');
        return cache.addAll(OFFLINE_PAGES);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalação concluída');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove caches antigos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ativação concluída');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições (Fetch Event)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não HTTP/HTTPS
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Estratégias de cache baseadas na URL
  if (shouldUseNetworkFirst(url)) {
    // Network First para APIs e dados dinâmicos
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(url)) {
    // Cache First para assets estáticos
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Stale While Revalidate para páginas
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Estratégia Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    throw error;
  }
}

// Estratégia Cache First
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch and cache:', request.url);
    throw error;
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      console.log('🔄 Background fetch failed for:', request.url);
    });
  
  // Return cached version immediately, update in background
  return cachedResponse || fetchPromise;
}

// Helpers
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST_URLS.some(pattern => url.pathname.startsWith(pattern));
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2)$/);
}

// Background Sync (para quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('🔄 Executando sincronização em background...');
  // Implementar lógica de sincronização aqui se necessário
}

// Push Notifications (para futuras implementações)
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Você tem uma nova notificação no Orkut BR!',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.svg',
    tag: 'orkut-notification',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Orkut BR', options)
  );
});

// Notificação clicada
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎉 Orkut BR Service Worker carregado com sucesso!');
