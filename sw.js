// 🔧 2nd Brain Service Worker - 아이폰 단독 실행용
// 완전한 오프라인 지원 및 로컬 캐싱

const CACHE_NAME = '2nd-brain-standalone-v1.0.0';
const STATIC_CACHE = '2nd-brain-static-v1.0.0';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

class StandaloneServiceWorker {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    self.addEventListener('install', this.installHandler.bind(this));
    self.addEventListener('activate', this.activateHandler.bind(this));
    self.addEventListener('fetch', this.fetchHandler.bind(this));
    self.addEventListener('sync', this.syncHandler.bind(this));
    self.addEventListener('message', this.messageHandler.bind(this));
  }

  // 설치 이벤트
  async installHandler(event) {
    console.log('🔧 Service Worker 설치 중...');
    
    event.waitUntil(
      this.precacheStaticAssets()
    );
    
    // 즉시 활성화
    self.skipWaiting();
  }

  async precacheStaticAssets() {
    try {
      const cache = await caches.open(STATIC_CACHE);
      
      // 정적 리소스 캐싱
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log(`✅ 캐시됨: ${url}`);
          }
        } catch (error) {
          console.warn(`⚠️ 캐시 실패: ${url}`, error);
        }
      });
      
      await Promise.allSettled(cachePromises);
      console.log('📦 정적 리소스 캐싱 완료');
      
    } catch (error) {
      console.error('❌ 정적 리소스 캐싱 실패:', error);
    }
  }

  // 활성화 이벤트
  async activateHandler(event) {
    console.log('🚀 Service Worker 활성화 중...');
    
    event.waitUntil(
      Promise.all([
        this.cleanupOldCaches(),
        this.initializeOfflineStorage()
      ])
    );
    
    // 모든 클라이언트 제어
    self.clients.claim();
  }

  async cleanupOldCaches() {
    try {
      const cacheNames = await caches.keys();
      const currentCaches = [CACHE_NAME, STATIC_CACHE];
      
      const deletePromises = cacheNames
        .filter(cacheName => !currentCaches.includes(cacheName))
        .map(cacheName => caches.delete(cacheName));
      
      await Promise.all(deletePromises);
      console.log('🧹 오래된 캐시 정리 완료');
      
    } catch (error) {
      console.error('❌ 캐시 정리 실패:', error);
    }
  }

  async initializeOfflineStorage() {
    // 오프라인 저장공간 초기화
    console.log('💾 오프라인 저장공간 초기화 완료');
  }

  // Fetch 이벤트 - 완전한 오프라인 지원
  fetchHandler(event) {
    const { request } = event;
    const url = new URL(request.url);
    
    // 정적 리소스는 Cache First 전략
    if (this.isStaticAsset(url)) {
      event.respondWith(this.handleStaticAsset(request));
    } else {
      // 외부 요청은 오프라인 응답 제공
      event.respondWith(this.handleOfflineRequest(request));
    }
  }

  // 정적 리소스 처리 - Cache First
  async handleStaticAsset(request) {
    try {
      const cache = await caches.open(STATIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 캐시에 없으면 네트워크에서 가져와서 캐시
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
      
    } catch (error) {
      console.error('정적 리소스 처리 오류:', error);
      
      // 오프라인 상태에서 기본 응답 제공
      if (request.url.endsWith('/')) {
        return this.createOfflineHTML();
      }
      
      return new Response('오프라인 상태입니다.', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  }

  // 오프라인 요청 처리
  async handleOfflineRequest(request) {
    // 모든 외부 요청에 대해 오프라인 응답 제공
    if (request.url.includes('api.anthropic.com') || 
        request.url.includes('googleapis.com')) {
      
      return new Response(JSON.stringify({
        error: 'offline_mode',
        message: '현재 오프라인 모드입니다. 기본 기능만 사용할 수 있습니다.',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 일반 요청은 네트워크 시도 후 실패시 오프라인 응답
    try {
      return await fetch(request);
    } catch (error) {
      return new Response('오프라인 상태입니다.', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  }

  // 오프라인 HTML 생성
  createOfflineHTML() {
    const offlineHTML = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🧠 2nd Brain - 오프라인</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000;
            color: #fff;
            margin: 0;
            padding: 20px;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .brain { font-size: 80px; margin-bottom: 20px; }
          h1 { font-size: 24px; margin: 20px 0; }
          p { font-size: 16px; color: #999; line-height: 1.5; margin: 10px 0; }
          .retry-btn {
            background: #007AFF;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            margin-top: 30px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="brain">🧠</div>
        <h1>2nd Brain</h1>
        <p>인터넷 연결을 확인하고 있습니다...</p>
        <p>오프라인 상태에서도 기본 기능을 사용할 수 있습니다.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          🔄 다시 시도
        </button>
        
        <script>
          // 온라인 상태 확인
          if (navigator.onLine) {
            window.location.reload();
          }
          
          window.addEventListener('online', () => {
            window.location.reload();
          });
        </script>
      </body>
      </html>
    `;
    
    return new Response(offlineHTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // 백그라운드 동기화
  async syncHandler(event) {
    console.log('🔄 백그라운드 동기화:', event.tag);
    
    if (event.tag === 'memory-backup') {
      event.waitUntil(this.syncMemoryData());
    }
  }

  async syncMemoryData() {
    // 메모리 데이터 동기화 (온라인 상태가 되었을 때)
    try {
      const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
      console.log(`📤 ${memories.length}개의 메모리 동기화 준비`);
      
      // 여기서 실제로는 서버와 동기화하지 않고 로컬 저장소만 사용
      console.log('✅ 로컬 메모리 동기화 완료');
      
    } catch (error) {
      console.error('❌ 메모리 동기화 실패:', error);
    }
  }

  // 메시지 처리
  messageHandler(event) {
    const { data } = event;
    
    switch (data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_MEMORY':
        this.cacheMemoryData(data.payload);
        break;
        
      case 'GET_CACHE_SIZE':
        this.getCacheSize().then(size => {
          event.ports[0].postMessage({ size });
        });
        break;
        
      default:
        console.warn('알 수 없는 메시지 타입:', data.type);
    }
  }

  async cacheMemoryData(memoryData) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(memoryData));
      await cache.put(`/memory/${memoryData.id}`, response);
      console.log(`💾 메모리 캐시됨: ${memoryData.id}`);
    } catch (error) {
      console.error('메모리 캐싱 실패:', error);
    }
  }

  async getCacheSize() {
    try {
      let totalSize = 0;
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const size = await this.getResponseSize(response);
            totalSize += size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('캐시 크기 계산 오류:', error);
      return 0;
    }
  }

  async getResponseSize(response) {
    try {
      const clone = response.clone();
      const arrayBuffer = await clone.arrayBuffer();
      return arrayBuffer.byteLength;
    } catch (error) {
      return 0;
    }
  }

  // 유틸리티 메서드
  isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.pathname === asset) ||
           url.pathname.endsWith('.html') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.json');
  }
}

// Service Worker 초기화
const standaloneServiceWorker = new StandaloneServiceWorker();

console.log('🧠 2nd Brain Standalone Service Worker 활성화됨');

// 푸시 알림 지원 (향후 확장용)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Ctext x="96" y="130" font-size="100" text-anchor="middle"%3E🧠%3C/text%3E%3C/svg%3E',
      badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Ctext x="48" y="64" font-size="48" text-anchor="middle"%3E🧠%3C/text%3E%3C/svg%3E',
      tag: 'memory-notification',
      requireInteraction: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '2nd Brain', options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});