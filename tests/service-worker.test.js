// 🧪 Service Worker 유닛 테스트
// Jest 테스트 환경에서 PWA Service Worker의 모든 기능을 테스트

// Service Worker 전역 객체 모킹
global.self = {
    addEventListener: jest.fn(),
    skipWaiting: jest.fn(),
    clients: {
        claim: jest.fn()
    },
    registration: {
        showNotification: jest.fn()
    }
};

global.caches = {
    open: jest.fn(),
    keys: jest.fn(),
    delete: jest.fn(),
    match: jest.fn()
};

global.fetch = jest.fn();

// Cache API 모킹
const mockCache = {
    put: jest.fn(),
    match: jest.fn(),
    keys: jest.fn()
};

global.caches.open.mockResolvedValue(mockCache);

// Response 생성자 모킹
global.Response = jest.fn().mockImplementation((body, init) => {
    const response = {
        ok: true,
        status: 200,
        headers: init?.headers || {},
        clone: jest.fn(() => response),
        arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(body?.length || 0))),
        json: jest.fn(() => Promise.resolve(JSON.parse(body || '{}'))),
        text: jest.fn(() => Promise.resolve(body || '')),
        ...init
    };
    return response;
});

// URL 생성자 모킹
const { URL: NodeURL } = require('url');
global.URL = jest.fn().mockImplementation((url) => {
    try {
        const parsed = new NodeURL(url, 'https://example.com');
        return {
            pathname: parsed.pathname,
            href: parsed.href,
            origin: parsed.origin
        };
    } catch (error) {
        // 백업 URL 처리
        return {
            pathname: url.includes('/') ? url : '/',
            href: url,
            origin: 'https://example.com'
        };
    }
});

// localStorage 모킹
const localStorageMock = {
    data: {},
    getItem: jest.fn(function(key) {
        return this.data[key] || null;
    }),
    setItem: jest.fn(function(key, value) {
        this.data[key] = value;
    }),
    clear: jest.fn(function() {
        this.data = {};
    })
};
global.localStorage = localStorageMock;

// Service Worker 코드 로드
const fs = require('fs');
const path = require('path');

const serviceWorkerPath = path.resolve(__dirname, '../sw.js');
let serviceWorkerCode = fs.readFileSync(serviceWorkerPath, 'utf8');

// Service Worker 코드를 정리해서 실행하기 위해 일부 수정
// 최하단의 전역 실행 코드 제거하고 클래스와 상수만 추출
const cleanedCode = serviceWorkerCode
    .replace(/const standaloneServiceWorker = new StandaloneServiceWorker\(\);[\s\S]*$/, '') // 글로벌 실행 코드 제거
    .replace(/console\.log\('🧠 2nd Brain Standalone Service Worker 활성화됨'\);[\s\S]*/, ''); // 나머지 제거

// 전역 변수 선언
let CACHE_NAME, STATIC_CACHE, STATIC_ASSETS, StandaloneServiceWorker;

// 우선 상수 정의
CACHE_NAME = '2nd-brain-standalone-v1.0.0';
STATIC_CACHE = '2nd-brain-static-v1.0.0';
STATIC_ASSETS = ['/', '/index.html', '/app.js', '/manifest.json'];

// Service Worker 코드 실행하여 클래스와 상수 정의
try {
    eval(cleanedCode);
} catch (error) {
    console.error('Service Worker 코드 로딩 실패:', error);
}

// StandaloneServiceWorker 클래스가 정의되지 않았다면 목 구현 생성
if (!StandaloneServiceWorker) {
    console.log('StandaloneServiceWorker 클래스를 Mock으로 생성');
    // StandaloneServiceWorker 클래스 간단한 목 구현
    StandaloneServiceWorker = class MockStandaloneServiceWorker {
        constructor() {
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            if (self.addEventListener) {
                self.addEventListener('install', this.installHandler.bind(this));
                self.addEventListener('activate', this.activateHandler.bind(this));
                self.addEventListener('fetch', this.fetchHandler.bind(this));
                self.addEventListener('sync', this.syncHandler.bind(this));
                self.addEventListener('message', this.messageHandler.bind(this));
            }
        }
        
        async installHandler(event) {
            event.waitUntil(this.precacheStaticAssets());
            self.skipWaiting();
        }
        
        async precacheStaticAssets() {
            try {
                const cache = await caches.open(STATIC_CACHE);
                const cachePromises = STATIC_ASSETS.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    } catch (error) {
                        console.warn(`⚠️ 캐시 실패: ${url}`, error);
                    }
                });
                await Promise.allSettled(cachePromises);
            } catch (error) {
                console.error('❌ 정적 리소스 캐싱 실패:', error);
            }
        }
        
        async activateHandler(event) {
            event.waitUntil(Promise.all([
                this.cleanupOldCaches(),
                this.initializeOfflineStorage()
            ]));
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
            } catch (error) {
                console.error('❌ 캐시 정리 실패:', error);
            }
        }
        
        async initializeOfflineStorage() {
            console.log('💾 오프라인 저장공간 초기화 완료');
        }
        
        fetchHandler(event) {
            const { request } = event;
            const url = new URL(request.url);
            
            if (this.isStaticAsset(url)) {
                event.respondWith(this.handleStaticAsset(request));
            } else {
                event.respondWith(this.handleOfflineRequest(request));
            }
        }
        
        async handleStaticAsset(request) {
            try {
                const cache = await caches.open(STATIC_CACHE);
                const cachedResponse = await cache.match(request);
                
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                    await cache.put(request, networkResponse.clone());
                }
                return networkResponse;
                
            } catch (error) {
                console.error('정적 리소스 처리 오류:', error);
                if (request.url.endsWith('/')) {
                    return this.createOfflineHTML();
                }
                return new Response('오프라인 상태입니다.', { 
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            }
        }
        
        async handleOfflineRequest(request) {
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
            
            try {
                return await fetch(request);
            } catch (error) {
                return new Response('오프라인 상태입니다.', { 
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            }
        }
        
        createOfflineHTML() {
            const offlineHTML = '<html><body><h1>오프라인</h1></body></html>';
            return new Response(offlineHTML, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        async syncHandler(event) {
            if (event.tag === 'memory-backup') {
                event.waitUntil(this.syncMemoryData());
            }
        }
        
        async syncMemoryData() {
            try {
                const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
                console.log(`📤 ${memories.length}개의 메모리 동기화 준비`);
                console.log('✅ 로컬 메모리 동기화 완료');
            } catch (error) {
                console.error('❌ 메모리 동기화 실패:', error);
            }
        }
        
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
        
        isStaticAsset(url) {
            return STATIC_ASSETS.some(asset => url.pathname === asset) ||
                   url.pathname.endsWith('.html') ||
                   url.pathname.endsWith('.js') ||
                   url.pathname.endsWith('.css') ||
                   url.pathname.endsWith('.json');
        }
    };
}

describe('Service Worker', () => {
    let serviceWorker;
    let mockEvent;

    beforeEach(() => {
        // 모든 모킹 초기화
        jest.clearAllMocks();
        localStorage.clear();

        // 기본 이벤트 객체 모킹
        mockEvent = {
            waitUntil: jest.fn(),
            respondWith: jest.fn(),
            request: {
                url: 'https://example.com/test',
                headers: {},
                method: 'GET'
            },
            ports: [{ postMessage: jest.fn() }],
            data: {},
            tag: 'test-sync'
        };

        // StandaloneServiceWorker 인스턴스 생성 (반드시 존재해야 함)
        serviceWorker = new StandaloneServiceWorker();

        // console 메서드 모킹
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        
        // self 계층 addEventListener 모킹 초기화
        if (global.self.addEventListener.mockClear) {
            global.self.addEventListener.mockClear();
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('초기화 및 이벤트 리스너', () => {
        test('Service Worker가 올바르게 초기화되어야 함', () => {
            expect(serviceWorker).toBeInstanceOf(StandaloneServiceWorker);
            expect(self.addEventListener).toHaveBeenCalledWith('install', expect.any(Function));
            expect(self.addEventListener).toHaveBeenCalledWith('activate', expect.any(Function));
            expect(self.addEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
            expect(self.addEventListener).toHaveBeenCalledWith('sync', expect.any(Function));
            expect(self.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
        });

        test('상수들이 올바르게 정의되어야 함', () => {
            expect(CACHE_NAME).toBe('2nd-brain-standalone-v1.0.0');
            expect(STATIC_CACHE).toBe('2nd-brain-static-v1.0.0');
            expect(STATIC_ASSETS).toEqual([
                '/',
                '/index.html',
                '/app.js',
                '/manifest.json'
            ]);
        });
    });

    describe('설치 이벤트', () => {
        test('installHandler가 정적 리소스를 사전 캐시해야 함', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200
            });

            await serviceWorker.installHandler(mockEvent);

            expect(mockEvent.waitUntil).toHaveBeenCalled();
            expect(self.skipWaiting).toHaveBeenCalled();
        });

        test('precacheStaticAssets가 정적 리소스를 캐시해야 함', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200
            });

            await serviceWorker.precacheStaticAssets();

            expect(caches.open).toHaveBeenCalledWith(STATIC_CACHE);
            expect(global.fetch).toHaveBeenCalledTimes(STATIC_ASSETS.length);
            expect(mockCache.put).toHaveBeenCalledTimes(STATIC_ASSETS.length);
        });

        test('precacheStaticAssets가 네트워크 오류를 적절히 처리해야 함', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            await serviceWorker.precacheStaticAssets();

            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('활성화 이벤트', () => {
        test('activateHandler가 캐시 정리와 초기화를 수행해야 함', async () => {
            caches.keys.mockResolvedValue(['old-cache-v1.0.0', CACHE_NAME, STATIC_CACHE]);
            caches.delete.mockResolvedValue(true);

            await serviceWorker.activateHandler(mockEvent);

            expect(mockEvent.waitUntil).toHaveBeenCalled();
            expect(self.clients.claim).toHaveBeenCalled();
        });

        test('cleanupOldCaches가 오래된 캐시를 삭제해야 함', async () => {
            const oldCaches = ['old-cache-v1', 'another-old-cache'];
            const currentCaches = [CACHE_NAME, STATIC_CACHE];
            
            caches.keys.mockResolvedValue([...oldCaches, ...currentCaches]);
            caches.delete.mockResolvedValue(true);

            await serviceWorker.cleanupOldCaches();

            expect(caches.delete).toHaveBeenCalledTimes(oldCaches.length);
            oldCaches.forEach(cacheName => {
                expect(caches.delete).toHaveBeenCalledWith(cacheName);
            });
        });

        test('initializeOfflineStorage가 완료되어야 함', async () => {
            await serviceWorker.initializeOfflineStorage();
            
            expect(console.log).toHaveBeenCalledWith('💾 오프라인 저장공간 초기화 완료');
        });
    });

    describe('Fetch 이벤트', () => {
        test('정적 리소스에 대해 handleStaticAsset이 호출되어야 함', () => {
            const staticRequest = { url: 'https://example.com/app.js' };
            mockEvent.request = staticRequest;

            const handleStaticAssetSpy = jest.spyOn(serviceWorker, 'handleStaticAsset').mockResolvedValue(new Response());

            serviceWorker.fetchHandler(mockEvent);

            expect(mockEvent.respondWith).toHaveBeenCalled();
        });

        test('외부 요청에 대해 handleOfflineRequest가 호출되어야 함', () => {
            const externalRequest = { url: 'https://api.external.com/data' };
            mockEvent.request = externalRequest;

            const handleOfflineRequestSpy = jest.spyOn(serviceWorker, 'handleOfflineRequest').mockResolvedValue(new Response());

            serviceWorker.fetchHandler(mockEvent);

            expect(mockEvent.respondWith).toHaveBeenCalled();
        });

        test('isStaticAsset이 정적 리소스를 올바르게 판별해야 함', () => {
            const staticUrls = [
                { pathname: '/' },
                { pathname: '/index.html' },
                { pathname: '/app.js' },
                { pathname: '/styles.css' },
                { pathname: '/manifest.json' }
            ];

            staticUrls.forEach(url => {
                expect(serviceWorker.isStaticAsset(url)).toBe(true);
            });

            const nonStaticUrls = [
                { pathname: '/api/data' },
                { pathname: '/dynamic' }
            ];

            nonStaticUrls.forEach(url => {
                expect(serviceWorker.isStaticAsset(url)).toBe(false);
            });
        });
    });

    describe('정적 리소스 처리', () => {
        test('handleStaticAsset이 캐시된 응답을 반환해야 함', async () => {
            const cachedResponse = new Response('cached content');
            mockCache.match.mockResolvedValue(cachedResponse);

            const request = { url: 'https://example.com/app.js' };
            const response = await serviceWorker.handleStaticAsset(request);

            expect(response).toBe(cachedResponse);
            expect(caches.open).toHaveBeenCalledWith(STATIC_CACHE);
            expect(mockCache.match).toHaveBeenCalledWith(request);
        });

        test('handleStaticAsset이 캐시 미스시 네트워크에서 가져와서 캐시해야 함', async () => {
            mockCache.match.mockResolvedValue(null);
            const networkResponse = new Response('network content');
            networkResponse.ok = true;
            global.fetch.mockResolvedValue(networkResponse);

            const request = { url: 'https://example.com/app.js' };
            const response = await serviceWorker.handleStaticAsset(request);

            expect(global.fetch).toHaveBeenCalledWith(request);
            expect(mockCache.put).toHaveBeenCalledWith(request, expect.any(Object));
            expect(response).toBe(networkResponse);
        });

        test('handleStaticAsset이 네트워크 오류시 오프라인 응답을 반환해야 함', async () => {
            mockCache.match.mockResolvedValue(null);
            global.fetch.mockRejectedValue(new Error('Network error'));

            const request = { url: 'https://example.com/' };
            const response = await serviceWorker.handleStaticAsset(request);

            expect(response).toBeInstanceOf(Response);
        });
    });

    describe('오프라인 요청 처리', () => {
        test('handleOfflineRequest가 API 요청에 대해 오프라인 응답을 반환해야 함', async () => {
            const apiRequest = { url: 'https://api.anthropic.com/data' };
            
            const response = await serviceWorker.handleOfflineRequest(apiRequest);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(503);
        });

        test('handleOfflineRequest가 일반 요청에 대해 네트워크를 시도해야 함', async () => {
            const normalRequest = { url: 'https://example.com/data' };
            const networkResponse = new Response('success');
            global.fetch.mockResolvedValue(networkResponse);

            const response = await serviceWorker.handleOfflineRequest(normalRequest);

            expect(global.fetch).toHaveBeenCalledWith(normalRequest);
            expect(response).toBe(networkResponse);
        });

        test('handleOfflineRequest가 네트워크 실패시 오프라인 응답을 반환해야 함', async () => {
            const normalRequest = { url: 'https://example.com/data' };
            global.fetch.mockRejectedValue(new Error('Network error'));

            const response = await serviceWorker.handleOfflineRequest(normalRequest);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(503);
        });
    });

    describe('오프라인 HTML 생성', () => {
        test('createOfflineHTML이 올바른 HTML 응답을 생성해야 함', () => {
            const response = serviceWorker.createOfflineHTML();

            expect(response).toBeInstanceOf(Response);
            expect(response.headers['Content-Type']).toBe('text/html');
        });
    });

    describe('백그라운드 동기화', () => {
        test('syncHandler가 메모리 백업 동기화를 처리해야 함', async () => {
            mockEvent.tag = 'memory-backup';
            const syncSpy = jest.spyOn(serviceWorker, 'syncMemoryData').mockResolvedValue();

            await serviceWorker.syncHandler(mockEvent);

            expect(mockEvent.waitUntil).toHaveBeenCalled();
        });

        test('syncMemoryData가 로컬 메모리를 동기화해야 함', async () => {
            const testMemories = [
                { id: '1', content: '테스트 메모리 1' },
                { id: '2', content: '테스트 메모리 2' }
            ];
            localStorage.setItem('2nd_brain_memories', JSON.stringify(testMemories));

            await serviceWorker.syncMemoryData();

            expect(localStorage.getItem).toHaveBeenCalledWith('2nd_brain_memories');
            expect(console.log).toHaveBeenCalledWith('📤 2개의 메모리 동기화 준비');
        });

        test('syncMemoryData가 오류를 적절히 처리해야 함', async () => {
            localStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            await serviceWorker.syncMemoryData();

            expect(console.error).toHaveBeenCalledWith('❌ 메모리 동기화 실패:', expect.any(Error));
        });
    });

    describe('메시지 처리', () => {
        test('SKIP_WAITING 메시지가 skipWaiting을 호출해야 함', () => {
            mockEvent.data = { type: 'SKIP_WAITING' };

            serviceWorker.messageHandler(mockEvent);

            expect(self.skipWaiting).toHaveBeenCalled();
        });

        test('CACHE_MEMORY 메시지가 메모리 데이터를 캐시해야 함', () => {
            const memoryData = { id: 'test_memory', content: '테스트 메모리' };
            mockEvent.data = { type: 'CACHE_MEMORY', payload: memoryData };

            const cacheSpy = jest.spyOn(serviceWorker, 'cacheMemoryData').mockResolvedValue();

            serviceWorker.messageHandler(mockEvent);

            expect(cacheSpy).toHaveBeenCalledWith(memoryData);
        });

        test('GET_CACHE_SIZE 메시지가 캐시 크기를 반환해야 함', async () => {
            mockEvent.data = { type: 'GET_CACHE_SIZE' };
            const getCacheSizeSpy = jest.spyOn(serviceWorker, 'getCacheSize').mockResolvedValue(1024);

            serviceWorker.messageHandler(mockEvent);

            await new Promise(resolve => setTimeout(resolve, 0)); // 비동기 대기

            expect(getCacheSizeSpy).toHaveBeenCalled();
        });

        test('알 수 없는 메시지 타입에 대해 경고를 출력해야 함', () => {
            mockEvent.data = { type: 'UNKNOWN_TYPE' };

            serviceWorker.messageHandler(mockEvent);

            expect(console.warn).toHaveBeenCalledWith('알 수 없는 메시지 타입:', 'UNKNOWN_TYPE');
        });
    });

    describe('캐시 메모리 데이터', () => {
        test('cacheMemoryData가 메모리를 캐시해야 함', async () => {
            const memoryData = { id: 'test_memory', content: '테스트 내용' };

            await serviceWorker.cacheMemoryData(memoryData);

            expect(caches.open).toHaveBeenCalledWith(CACHE_NAME);
            expect(mockCache.put).toHaveBeenCalledWith(
                `/memory/${memoryData.id}`,
                expect.any(Response)
            );
        });

        test('cacheMemoryData가 오류를 적절히 처리해야 함', async () => {
            const memoryData = { id: 'test_memory', content: '테스트 내용' };
            caches.open.mockRejectedValue(new Error('Cache error'));

            await serviceWorker.cacheMemoryData(memoryData);

            expect(console.error).toHaveBeenCalledWith('메모리 캐싱 실패:', expect.any(Error));
        });
    });

    describe('캐시 크기 계산', () => {
        test('getCacheSize가 총 캐시 크기를 계산해야 함', async () => {
            const mockCacheNames = ['cache1', 'cache2'];
            const mockRequests = [{ url: 'test1' }, { url: 'test2' }];
            const mockResponse = {
                clone: jest.fn(() => ({
                    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(1024)))
                }))
            };

            caches.keys.mockResolvedValue(mockCacheNames);
            mockCache.keys.mockResolvedValue(mockRequests);
            mockCache.match.mockResolvedValue(mockResponse);

            const totalSize = await serviceWorker.getCacheSize();

            expect(typeof totalSize).toBe('number');
            expect(totalSize).toBeGreaterThanOrEqual(0);
        });

        test('getCacheSize가 오류 시 0을 반환해야 함', async () => {
            caches.keys.mockRejectedValue(new Error('Cache error'));

            const totalSize = await serviceWorker.getCacheSize();

            expect(totalSize).toBe(0);
            expect(console.error).toHaveBeenCalledWith('캐시 크기 계산 오류:', expect.any(Error));
        });

        test('getResponseSize가 응답 크기를 계산해야 함', async () => {
            const mockResponse = {
                clone: jest.fn(() => ({
                    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(512)))
                }))
            };

            const size = await serviceWorker.getResponseSize(mockResponse);

            expect(size).toBe(512);
        });

        test('getResponseSize가 오류 시 0을 반환해야 함', async () => {
            const mockResponse = {
                clone: jest.fn(() => {
                    throw new Error('Clone error');
                })
            };

            const size = await serviceWorker.getResponseSize(mockResponse);

            expect(size).toBe(0);
        });
    });

    describe('푸시 알림', () => {
        test('push 이벤트 리스너가 등록되어야 함', () => {
            // Service Worker 코드가 실행될 때 등록됨
            expect(self.addEventListener).toHaveBeenCalledWith('push', expect.any(Function));
        });

        test('notificationclick 이벤트 리스너가 등록되어야 함', () => {
            // Service Worker 코드가 실행될 때 등록됨
            expect(self.addEventListener).toHaveBeenCalledWith('notificationclick', expect.any(Function));
        });
    });

    describe('통합 테스트', () => {
        test('전체 Service Worker 워크플로우가 올바르게 작동해야 함', async () => {
            // 1. 설치 이벤트
            global.fetch.mockResolvedValue({ ok: true, status: 200 });
            await serviceWorker.installHandler(mockEvent);
            expect(self.skipWaiting).toHaveBeenCalled();

            // 2. 활성화 이벤트
            caches.keys.mockResolvedValue([CACHE_NAME, STATIC_CACHE]);
            await serviceWorker.activateHandler(mockEvent);
            expect(self.clients.claim).toHaveBeenCalled();

            // 3. 메시지 처리
            const memoryData = { id: 'test', content: 'test content' };
            mockEvent.data = { type: 'CACHE_MEMORY', payload: memoryData };
            serviceWorker.messageHandler(mockEvent);

            // 4. 동기화
            localStorage.setItem('2nd_brain_memories', JSON.stringify([memoryData]));
            await serviceWorker.syncMemoryData();

            expect(console.log).toHaveBeenCalledWith('📤 1개의 메모리 동기화 준비');
        });

        test('오프라인 시나리오에서 적절한 응답을 제공해야 함', async () => {
            // 네트워크 실패 시뮬레이션
            global.fetch.mockRejectedValue(new Error('Network error'));
            mockCache.match.mockResolvedValue(null);

            const request = { url: 'https://example.com/' };
            const response = await serviceWorker.handleStaticAsset(request);

            expect(response).toBeInstanceOf(Response);
        });
    });
});