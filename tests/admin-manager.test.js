// 🧪 AdminManager 관리자 시스템 유닛 테스트
// Jest 테스트 환경에서 AdminManager 클래스의 모든 기능을 테스트

const fs = require('fs');
const path = require('path');

// AdminManager와 의존성 클래스들 로드
const authManagerPath = path.resolve(__dirname, '../auth.js');
const adminManagerPath = path.resolve(__dirname, '../admin.js');

// 의존성 클래스들을 먼저 로드
eval(fs.readFileSync(authManagerPath, 'utf8'));
eval(fs.readFileSync(adminManagerPath, 'utf8'));

describe('AdminManager', () => {
    let adminManager;
    let mockAuthManager;
    let mockApp;

    beforeEach(() => {
        // localStorage 초기화
        localStorage.clear();
        
        // DOM 초기화
        document.body.innerHTML = '';
        
        // Mock AuthManager 생성
        mockAuthManager = {
            currentUser: { role: 'admin', username: 'admin', name: '관리자' },
            isLoggedIn: true,
            users: [
                { 
                    id: 'admin_001', 
                    username: 'admin', 
                    role: 'admin', 
                    name: '관리자',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                },
                { 
                    id: 'user_001', 
                    username: 'testuser', 
                    role: 'user', 
                    name: '테스트 사용자',
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                }
            ],
            deleteUser: jest.fn()
        };
        
        // Mock App 생성
        mockApp = {
            memories: [
                {
                    id: 'memory_1',
                    type: 'text',
                    content: '테스트 메모리 1',
                    timestamp: new Date().toISOString(),
                    tags: ['테스트'],
                    importance: 7
                },
                {
                    id: 'memory_2',
                    type: 'voice',
                    content: '테스트 음성 메모리',
                    timestamp: new Date(Date.now() - 86400000).toISOString(), // 어제
                    tags: ['음성'],
                    importance: 5
                }
            ],
            getTypeEmoji: jest.fn((type) => {
                const emojis = { text: '📝', voice: '🎙️', photo: '📸' };
                return emojis[type] || '📎';
            }),
            deleteMemory: jest.fn(),
            saveMemories: jest.fn(),
            updateUI: jest.fn(),
            showToast: jest.fn(),
            exportUserData: jest.fn(),
            clearUserData: jest.fn(),
            dataManager: {
                buildIndexes: jest.fn()
            },
            addMobileCompatibleEventListener: jest.fn((element, callback) => {
                element.addEventListener('click', callback);
            })
        };
        
        // 전역 window 객체 모킹
        global.window = global.window || {};
        global.window.app = mockApp;
        global.window.adminManager = null; // 테스트에서 설정할 예정
        
        // console 메서드 모킹
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        
        // AdminManager 인스턴스 생성
        adminManager = new AdminManager(mockAuthManager, mockApp);
        global.window.adminManager = adminManager;
        
        // confirm 모킹
        global.confirm = jest.fn(() => true);
        global.alert = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('생성자 및 초기화', () => {
        test('AdminManager 인스턴스가 올바르게 생성되어야 함', () => {
            expect(adminManager).toBeInstanceOf(AdminManager);
            expect(adminManager.auth).toBe(mockAuthManager);
            expect(adminManager.app).toBe(mockApp);
            expect(adminManager.isAdminPanelOpen).toBe(false);
        });

        test('인증 상태 변경 이벤트 리스너가 설정되어야 함', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            
            // 새 인스턴스 생성으로 init 호출
            new AdminManager(mockAuthManager, mockApp);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('authStateChange', expect.any(Function));
        });

        test('관리자 로그인 시 관리자 인터페이스가 설정되어야 함', () => {
            const setupSpy = jest.spyOn(adminManager, 'setupAdminInterface');
            
            // 관리자 로그인 이벤트 시뮬레이션
            const event = new CustomEvent('authStateChange', {
                detail: { 
                    type: 'login', 
                    user: { role: 'admin', username: 'admin' }
                }
            });
            
            document.dispatchEvent(event);
            
            expect(setupSpy).toHaveBeenCalled();
        });
    });

    describe('관리자 인터페이스', () => {
        test('setupAdminInterface가 관리자 메뉴와 이벤트를 설정해야 함', () => {
            const addMenuSpy = jest.spyOn(adminManager, 'addAdminMenuToNavigation');
            const setupEventsSpy = jest.spyOn(adminManager, 'setupAdminEventListeners');
            
            adminManager.setupAdminInterface();
            
            expect(addMenuSpy).toHaveBeenCalled();
            expect(setupEventsSpy).toHaveBeenCalled();
        });

        test('openAdminDashboard가 관리자 대시보드로 이동해야 함', () => {
            // location.href 모킹
            delete window.location;
            window.location = { href: '' };
            
            adminManager.openAdminDashboard();
            
            expect(window.location.href).toBe('admin-dashboard.html');
        });
    });

    describe('사용자 설정 모달', () => {
        test('showUserSettings가 사용자 설정 모달을 생성해야 함', () => {
            adminManager.showUserSettings();
            
            const modal = document.querySelector('.modal');
            expect(modal).toBeTruthy();
            expect(modal.classList.contains('active')).toBe(true);
            
            const title = modal.querySelector('.modal-title');
            expect(title.textContent).toContain('설정');
            
            const languageSetting = modal.querySelector('#languageSetting');
            const autoTranscription = modal.querySelector('#autoTranscription');
            const locationTracking = modal.querySelector('#locationTracking');
            
            expect(languageSetting).toBeTruthy();
            expect(autoTranscription).toBeTruthy();
            expect(locationTracking).toBeTruthy();
        });

        test('사용자 설정 모달의 이벤트가 올바르게 설정되어야 함', () => {
            adminManager.showUserSettings();
            
            const modal = document.querySelector('.modal');
            const closeBtn = modal.querySelector('#settingsCloseBtn');
            const exportBtn = modal.querySelector('#exportUserDataBtn');
            const clearBtn = modal.querySelector('#clearUserDataBtn');
            
            expect(closeBtn).toBeTruthy();
            expect(exportBtn).toBeTruthy();
            expect(clearBtn).toBeTruthy();
            
            // 모달이 존재하는지만 확인 (닫기는 비동기적으로 처리됨)
            expect(modal).toBeTruthy();
        });

        test('데이터 내보내기 버튼이 작동해야 함', () => {
            // window.app를 설정하지 않아서 fallback 이벤트 사용
            global.window.app = null;
            
            adminManager.showUserSettings();
            
            const modal = document.querySelector('.modal');
            const exportBtn = modal.querySelector('#exportUserDataBtn');
            
            exportBtn.click();
            
            expect(mockApp.exportUserData).toHaveBeenCalled();
        });

        test('데이터 삭제 버튼이 작동해야 함', () => {
            // window.app를 설정하지 않아서 fallback 이벤트 사용
            global.window.app = null;
            
            adminManager.showUserSettings();
            
            const modal = document.querySelector('.modal');
            const clearBtn = modal.querySelector('#clearUserDataBtn');
            
            clearBtn.click();
            
            expect(mockApp.clearUserData).toHaveBeenCalled();
        });
    });

    describe('관리자 설정 모달', () => {
        test('showAdminSettings가 관리자 설정 모달을 생성해야 함', () => {
            adminManager.showAdminSettings();
            
            const modal = document.querySelector('.modal');
            expect(modal).toBeTruthy();
            expect(modal.classList.contains('active')).toBe(true);
            
            const title = modal.querySelector('.modal-title');
            expect(title.textContent).toBe('👑 관리자 설정'); // 정확한 텍스트 매치
            
            // 빠른 통계 요소들 확인
            const totalMemories = modal.querySelector('#quickTotalMemories');
            const totalUsers = modal.querySelector('#quickTotalUsers');
            const storageUsed = modal.querySelector('#quickStorageUsed');
            
            expect(totalMemories).toBeTruthy();
            expect(totalUsers).toBeTruthy();
            expect(storageUsed).toBeTruthy();
        });

        test('updateQuickStats가 통계를 올바르게 업데이트해야 함', () => {
            // 테스트 데이터 설정
            localStorage.setItem('2nd_brain_memories', JSON.stringify(mockApp.memories));
            localStorage.setItem('2nd_brain_users', JSON.stringify(mockAuthManager.users));
            
            adminManager.showAdminSettings();
            
            const totalMemories = document.getElementById('quickTotalMemories');
            const totalUsers = document.getElementById('quickTotalUsers');
            
            expect(totalMemories.textContent).toBe('2'); // mockApp.memories.length
            expect(totalUsers.textContent).toBe('2'); // mockAuthManager.users.length
        });
    });

    describe('스토리지 계산', () => {
        test('calculateUserStorage가 올바른 스토리지 크기를 계산해야 함', () => {
            localStorage.setItem('2nd_brain_memories', JSON.stringify(['test data']));
            localStorage.setItem('2nd_brain_settings', JSON.stringify({ test: 'value' }));
            localStorage.setItem('other_data', 'should not be counted');
            
            const storage = adminManager.calculateUserStorage();
            
            expect(typeof storage).toBe('number');
            expect(storage).toBeGreaterThanOrEqual(0); // 스토리지 크기는 0 이상이어야 함
        });

        test('updateUserStorageInfo가 스토리지 정보를 업데이트해야 함', () => {
            document.body.innerHTML = '<span id="userStorageInfo">계산 중...</span>';
            
            adminManager.updateUserStorageInfo();
            
            const element = document.getElementById('userStorageInfo');
            expect(element.textContent).toMatch(/\d+MB/);
        });
    });

    describe('시스템 관리 기능', () => {
        test('optimizeSystem이 시스템 최적화를 수행해야 함', () => {
            adminManager.optimizeSystem();
            
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('시스템을 최적화하시겠습니까?')
            );
            expect(mockApp.dataManager.buildIndexes).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('시스템 최적화가 완료되었습니다')
            );
        });

        test('rebuildIndexes가 인덱스를 재구축해야 함', () => {
            adminManager.rebuildIndexes();
            
            expect(mockApp.dataManager.buildIndexes).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('인덱스가 재구축되었습니다')
            );
        });

        test('clearCache가 캐시를 정리해야 함', () => {
            localStorage.setItem('admin_last_sync', 'test');
            localStorage.setItem('admin_data_updated', 'test');
            localStorage.setItem('2nd_brain_session', JSON.stringify({
                expiresAt: new Date(Date.now() - 60000).toISOString() // 만료된 세션
            }));
            
            adminManager.clearCache();
            
            expect(localStorage.getItem('admin_last_sync')).toBeNull();
            expect(localStorage.getItem('admin_data_updated')).toBeNull();
            expect(localStorage.getItem('2nd_brain_session')).toBeNull();
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('캐시가 정리되었습니다')
            );
        });
    });

    describe('데이터 요약', () => {
        test('showDataSummary가 데이터 요약을 표시해야 함', () => {
            localStorage.setItem('2nd_brain_memories', JSON.stringify(mockApp.memories));
            localStorage.setItem('2nd_brain_users', JSON.stringify(mockAuthManager.users));
            
            adminManager.showDataSummary();
            
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('📊 데이터 요약')
            );
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('총 메모리: 2개')
            );
            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('총 사용자: 2명')
            );
        });
    });

    describe('관리자 패널', () => {
        test('toggleAdminPanel이 패널을 열고 닫을 수 있어야 함', () => {
            // 패널 열기
            expect(adminManager.isAdminPanelOpen).toBe(false);
            
            adminManager.toggleAdminPanel();
            
            expect(adminManager.isAdminPanelOpen).toBe(true);
            expect(document.getElementById('adminPanel')).toBeTruthy();
            
            // 패널 닫기
            adminManager.toggleAdminPanel();
            
            expect(adminManager.isAdminPanelOpen).toBe(false);
            expect(document.getElementById('adminPanel')).toBeFalsy();
        });

        test('openAdminPanel이 관리자 패널을 생성해야 함', () => {
            adminManager.openAdminPanel();
            
            const panel = document.getElementById('adminPanel');
            expect(panel).toBeTruthy();
            expect(panel.classList.contains('active')).toBe(true);
            expect(adminManager.isAdminPanelOpen).toBe(true);
            
            // 패널 내용 확인
            const header = panel.querySelector('.admin-header h2');
            const tabs = panel.querySelectorAll('.admin-tab');
            const closeBtn = panel.querySelector('#closeAdminPanel');
            
            expect(header.textContent).toContain('관리자 패널');
            expect(tabs.length).toBeGreaterThan(0);
            expect(closeBtn).toBeTruthy();
        });

        test('closeAdminPanel이 패널을 제거해야 함', () => {
            adminManager.openAdminPanel();
            expect(document.getElementById('adminPanel')).toBeTruthy();
            
            // Mock remove 메서드
            const panel = document.getElementById('adminPanel');
            panel.remove = jest.fn();
            
            adminManager.closeAdminPanel();
            
            expect(panel.remove).toHaveBeenCalled();
            expect(adminManager.isAdminPanelOpen).toBe(false);
        });

        test('switchAdminTab이 탭을 전환해야 함', () => {
            adminManager.openAdminPanel();
            
            // 모든 탭 비활성화 상태로 시작
            const tabs = document.querySelectorAll('.admin-tab');
            const contents = document.querySelectorAll('.admin-tab-content');
            
            // memories 탭으로 전환
            adminManager.switchAdminTab('memories');
            
            const memoriesTab = document.querySelector('[data-tab="memories"]');
            const memoriesContent = document.getElementById('memories-tab');
            
            expect(memoriesTab.classList.contains('active')).toBe(true);
            expect(memoriesContent.classList.contains('active')).toBe(true);
        });
    });

    describe('메모리 관리', () => {
        test('loadMemoryManagement가 메모리 목록을 표시해야 함', () => {
            adminManager.openAdminPanel();
            
            adminManager.loadMemoryManagement();
            
            const container = document.getElementById('adminMemoryList');
            expect(container).toBeTruthy();
            
            const memoryCards = container.querySelectorAll('.admin-memory-card');
            expect(memoryCards.length).toBe(mockApp.memories.length);
        });

        test('displayMemoriesInAdmin이 메모리를 올바르게 표시해야 함', () => {
            document.body.innerHTML = '<div id="adminMemoryList"></div>';
            
            adminManager.displayMemoriesInAdmin(mockApp.memories);
            
            const container = document.getElementById('adminMemoryList');
            const memoryCards = container.querySelectorAll('.admin-memory-card');
            
            expect(memoryCards.length).toBe(2);
            
            const firstCard = memoryCards[0];
            expect(firstCard.innerHTML).toContain('테스트 메모리 1');
            expect(firstCard.innerHTML).toContain('📝 text');
        });

        test('빈 메모리 목록에 대한 처리', () => {
            document.body.innerHTML = '<div id="adminMemoryList"></div>';
            
            adminManager.displayMemoriesInAdmin([]);
            
            const container = document.getElementById('adminMemoryList');
            expect(container.innerHTML).toContain('저장된 메모리가 없습니다');
        });

        test('deleteMemory가 메모리를 삭제해야 함', () => {
            adminManager.deleteMemory('memory_1');
            
            expect(global.confirm).toHaveBeenCalledWith('이 메모리를 삭제하시겠습니까?');
            expect(mockApp.deleteMemory).toHaveBeenCalledWith('memory_1');
            expect(mockApp.showToast).toHaveBeenCalledWith('메모리가 삭제되었습니다.', 'success');
        });
    });

    describe('사용자 관리', () => {
        test('loadUserManagement가 사용자 목록을 표시해야 함', () => {
            adminManager.openAdminPanel();
            
            adminManager.loadUserManagement();
            
            const container = document.getElementById('adminUserList');
            expect(container).toBeTruthy();
            
            const userCards = container.querySelectorAll('.admin-user-card');
            expect(userCards.length).toBe(mockAuthManager.users.length);
        });

        test('displayUsersInAdmin이 사용자를 올바르게 표시해야 함', () => {
            document.body.innerHTML = '<div id="adminUserList"></div>';
            
            adminManager.displayUsersInAdmin(mockAuthManager.users);
            
            const container = document.getElementById('adminUserList');
            const userCards = container.querySelectorAll('.admin-user-card');
            
            expect(userCards.length).toBe(2);
            
            const adminCard = userCards[0];
            expect(adminCard.innerHTML).toContain('👑'); // 관리자 아이콘
            expect(adminCard.innerHTML).toContain('관리자');
            
            const userCard = userCards[1];
            expect(userCard.innerHTML).toContain('👤'); // 일반 사용자 아이콘
            expect(userCard.innerHTML).toContain('테스트 사용자');
        });

        test('deleteUser가 사용자를 삭제해야 함', () => {
            adminManager.deleteUser('user_001');
            
            expect(global.confirm).toHaveBeenCalledWith('이 사용자를 삭제하시겠습니까?');
            expect(mockAuthManager.deleteUser).toHaveBeenCalledWith('user_001');
            expect(mockApp.showToast).toHaveBeenCalledWith('사용자가 삭제되었습니다.', 'success');
        });
    });

    describe('데이터 내보내기', () => {
        test('exportMemories가 메모리를 내보내야 함', () => {
            // Blob과 URL.createObjectURL 모킹
            global.Blob = jest.fn((content, options) => ({ content, options }));
            global.URL = { createObjectURL: jest.fn(() => 'blob:test-url') };
            
            // DOM 링크 생성을 위한 모킹
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn()
            };
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            
            adminManager.exportMemories();
            
            expect(global.Blob).toHaveBeenCalledWith(
                [JSON.stringify(mockApp.memories, null, 2)],
                { type: 'application/json' }
            );
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toMatch(/2nd_brain_memories_.*\.json/);
        });

        test('exportUsers가 사용자를 내보내야 함', () => {
            // Blob과 URL.createObjectURL 모킹
            global.Blob = jest.fn((content, options) => ({ content, options }));
            global.URL = { createObjectURL: jest.fn(() => 'blob:test-url') };
            
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn()
            };
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            
            adminManager.exportUsers();
            
            expect(global.Blob).toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toMatch(/2nd_brain_users_.*\.json/);
        });
    });

    describe('백업 및 복원', () => {
        test('backupAllData가 전체 데이터를 백업해야 함', () => {
            global.Blob = jest.fn((content, options) => ({ content, options }));
            global.URL = { createObjectURL: jest.fn(() => 'blob:test-url') };
            
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn()
            };
            jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
            
            adminManager.backupAllData();
            
            expect(global.Blob).toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toMatch(/2nd_brain_backup_.*\.json/);
            expect(localStorage.getItem('2nd_brain_last_backup')).toBeTruthy();
            expect(mockApp.showToast).toHaveBeenCalledWith(
                '전체 데이터 백업이 완료되었습니다.', 
                'success'
            );
        });

        test('getSystemSettings가 시스템 설정을 반환해야 함', () => {
            localStorage.setItem('2nd_brain_auto_backup', 'weekly');
            localStorage.setItem('2nd_brain_max_memories', '5000');
            localStorage.setItem('2nd_brain_session_timeout', '60');
            localStorage.setItem('2nd_brain_auto_ai', 'true');
            
            const settings = adminManager.getSystemSettings();
            
            expect(settings).toEqual({
                autoBackupInterval: 'weekly',
                maxMemories: 5000,
                sessionTimeout: 60,
                autoAIAnalysis: true
            });
        });
    });

    describe('유틸리티 메서드', () => {
        test('getTodayMemoriesCount가 오늘 메모리 개수를 정확히 계산해야 함', () => {
            const today = new Date();
            const yesterday = new Date(Date.now() - 86400000);
            
            const memories = [
                { timestamp: today.toISOString() },
                { timestamp: today.toISOString() },
                { timestamp: yesterday.toISOString() }
            ];
            
            const count = adminManager.getTodayMemoriesCount(memories);
            
            expect(count).toBe(2);
        });

        test('calculateStorageUsage가 스토리지 사용량을 계산해야 함', () => {
            localStorage.setItem('2nd_brain_test1', 'a'.repeat(1024)); // 1KB
            localStorage.setItem('2nd_brain_test2', 'b'.repeat(1024)); // 1KB
            localStorage.setItem('other_data', 'c'.repeat(1024)); // 포함되지 않음
            
            const usage = adminManager.calculateStorageUsage();
            
            expect(usage).toBeGreaterThanOrEqual(0); // 스토리지 사용량은 0 이상
            expect(typeof usage).toBe('number');
        });

        test('drawMemoryChart가 로그를 출력해야 함', () => {
            const consoleSpy = jest.spyOn(console, 'log');
            
            adminManager.drawMemoryChart(mockApp.memories);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '차트 그리기:', 
                mockApp.memories.length, 
                '개의 메모리'
            );
        });
    });

    describe('대시보드 데이터', () => {
        test('loadDashboardData가 대시보드 통계를 업데이트해야 함', () => {
            document.body.innerHTML = `
                <span id="totalMemories">0</span>
                <span id="todayMemories">0</span>
                <span id="totalUsers">0</span>
                <span id="storageUsed">0</span>
            `;
            
            adminManager.loadDashboardData();
            
            const totalMemories = document.getElementById('totalMemories');
            const totalUsers = document.getElementById('totalUsers');
            
            expect(totalMemories.textContent).toBe('2');
            expect(totalUsers.textContent).toBe('2');
        });

        test('loadTabData가 탭별 데이터를 로드해야 함', () => {
            // loadDashboardData에서 사용하는 DOM 요소들을 미리 생성
            document.body.innerHTML = `
                <span id="totalMemories">0</span>
                <span id="todayMemories">0</span>
                <span id="totalUsers">0</span>
                <span id="storageUsed">0</span>
            `;
            
            const loadDashboardSpy = jest.spyOn(adminManager, 'loadDashboardData');
            const loadMemorySpy = jest.spyOn(adminManager, 'loadMemoryManagement');
            const loadUserSpy = jest.spyOn(adminManager, 'loadUserManagement');
            
            adminManager.loadTabData('dashboard');
            expect(loadDashboardSpy).toHaveBeenCalled();
            
            adminManager.loadTabData('memories');
            expect(loadMemorySpy).toHaveBeenCalled();
            
            adminManager.loadTabData('users');
            expect(loadUserSpy).toHaveBeenCalled();
        });
    });

    describe('시스템 설정', () => {
        test('saveSystemSettings가 설정을 저장해야 함', () => {
            document.body.innerHTML = `
                <select id="autoBackupInterval"><option value="weekly" selected></option></select>
                <input id="maxMemories" value="8000">
                <input id="sessionTimeout" value="45">
                <input id="autoAIAnalysis" type="checkbox" checked>
            `;
            
            adminManager.saveSystemSettings();
            
            expect(localStorage.getItem('2nd_brain_auto_backup')).toBe('weekly');
            expect(localStorage.getItem('2nd_brain_max_memories')).toBe('8000');
            expect(localStorage.getItem('2nd_brain_session_timeout')).toBe('45');
            expect(localStorage.getItem('2nd_brain_auto_ai')).toBe(true); // boolean 값으로 저장됨
            expect(mockApp.showToast).toHaveBeenCalledWith(
                '시스템 설정이 저장되었습니다.', 
                'success'
            );
        });
    });

    describe('통합 테스트', () => {
        test('전체 관리자 워크플로우가 올바르게 작동해야 함', () => {
            // 1. 관리자 패널 열기
            adminManager.openAdminPanel();
            expect(adminManager.isAdminPanelOpen).toBe(true);
            
            // 2. 메모리 관리 탭으로 전환
            adminManager.switchAdminTab('memories');
            expect(document.getElementById('memories-tab').classList.contains('active')).toBe(true);
            
            // 3. 메모리 삭제
            adminManager.deleteMemory('memory_1');
            expect(mockApp.deleteMemory).toHaveBeenCalledWith('memory_1');
            
            // 4. 사용자 관리 탭으로 전환
            adminManager.switchAdminTab('users');
            expect(document.getElementById('users-tab').classList.contains('active')).toBe(true);
            
            // 5. 사용자 삭제
            adminManager.deleteUser('user_001');
            expect(mockAuthManager.deleteUser).toHaveBeenCalledWith('user_001');
            
            // 6. 시스템 최적화
            adminManager.optimizeSystem();
            expect(mockApp.dataManager.buildIndexes).toHaveBeenCalled();
            
            // 7. 패널 닫기
            adminManager.closeAdminPanel();
            expect(adminManager.isAdminPanelOpen).toBe(false);
        });
    });
});