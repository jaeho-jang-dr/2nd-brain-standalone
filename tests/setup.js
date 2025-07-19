// 🧪 Jest 테스트 환경 설정 파일
// DOM 환경 및 브라우저 API 모킹

// LocalStorage Mock
const localStorageMock = {
  data: {},
  getItem: jest.fn(function(key) {
    return this.data[key] || null;
  }),
  setItem: jest.fn(function(key, value) {
    this.data[key] = value;
  }),
  removeItem: jest.fn(function(key) {
    delete this.data[key];
  }),
  clear: jest.fn(function() {
    this.data = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// SessionStorage Mock
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Navigator Mock
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: null
    }))
  },
  writable: true
});

// Geolocation Mock
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn()
  },
  writable: true
});

// MediaDevices Mock
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }]
    }))
  },
  writable: true
});

// Speech Recognition Mock
window.webkitSpeechRecognition = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  onend: null,
  continuous: false,
  interimResults: false,
  lang: 'ko-KR'
}));

window.SpeechRecognition = window.webkitSpeechRecognition;

// MediaRecorder Mock
window.MediaRecorder = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null,
  onstart: null,
  onstop: null,
  state: 'inactive'
}));

// Fetch Mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers()
  })
);

// Blob Mock
global.Blob = jest.fn((content, options) => ({
  size: 0,
  type: options?.type || '',
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  text: () => Promise.resolve(''),
  stream: () => new ReadableStream()
}));

// URL Mock
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Console mock to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 각 테스트 전에 모든 mock 클리어
beforeEach(() => {
  localStorageMock.data = {};
  jest.clearAllMocks();
});

// 비동기 테스트를 위한 유틸리티
global.waitFor = (callback, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

// DOM 이벤트 시뮬레이션 헬퍼
global.fireEvent = (element, eventType, eventInit = {}) => {
  const event = new Event(eventType, { bubbles: true, ...eventInit });
  element.dispatchEvent(event);
  return event;
};

// 모바일 환경 시뮬레이션
global.mockMobileEnvironment = () => {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    writable: true
  });
  
  Object.defineProperty(window, 'innerWidth', {
    value: 375,
    writable: true
  });
  
  Object.defineProperty(window, 'innerHeight', {
    value: 812,
    writable: true
  });
};

// 기본적으로 모바일 환경으로 설정
mockMobileEnvironment();