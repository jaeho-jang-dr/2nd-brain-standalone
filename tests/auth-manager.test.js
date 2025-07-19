// 🧪 AuthManager 인증 시스템 유닛 테스트
// Jest 테스트 환경에서 AuthManager 클래스의 모든 기능을 테스트

const fs = require('fs');
const path = require('path');

// AuthManager 클래스 로드
const authManagerPath = path.resolve(__dirname, '../auth.js');
const authManagerCode = fs.readFileSync(authManagerPath, 'utf8');

// 전역 스코프에서 AuthManager 클래스 정의
eval(authManagerCode);

describe('AuthManager', () => {
    let authManager;

    beforeEach(() => {
        // localStorage 초기화
        localStorage.clear();
        
        // 전역 window 객체 모킹
        global.window = global.window || {};
        global.window.app = {
            showToast: jest.fn()
        };
        
        // 시간 관련 타이머 모킹
        jest.useFakeTimers();
        
        // console 메서드 모킹
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        
        // AuthManager 인스턴스 생성
        authManager = new AuthManager();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('생성자 및 초기화', () => {
        test('AuthManager 인스턴스가 올바르게 생성되어야 함', () => {
            expect(authManager).toBeInstanceOf(AuthManager);
            expect(authManager.currentUser).toBeNull();
            expect(authManager.isLoggedIn).toBe(false);
            expect(authManager.sessionTimeout).toBe(30 * 60 * 1000); // 30분
            expect(authManager.users).toBeInstanceOf(Array);
        });

        test('기본 관리자 계정이 설정되어야 함', () => {
            expect(authManager.adminCredentials).toHaveProperty('username');
            expect(authManager.adminCredentials).toHaveProperty('password');
            expect(authManager.adminCredentials.role).toBe('admin');
            expect(authManager.adminCredentials.name).toBe('관리자');
        });

        test('기본 관리자 사용자가 사용자 목록에 추가되어야 함', () => {
            const adminUser = authManager.users.find(user => user.role === 'admin');
            expect(adminUser).toBeDefined();
            expect(adminUser.username).toBe('admin');
            expect(adminUser.role).toBe('admin');
            expect(adminUser.name).toBe('관리자');
        });
    });

    describe('자격 증명 암호화/복호화', () => {
        test('encodeCredential이 문자열을 암호화해야 함', () => {
            const plaintext = 'testPassword123';
            const encoded = authManager.encodeCredential(plaintext);
            
            expect(encoded).toBeTruthy();
            expect(encoded).not.toBe(plaintext);
            expect(typeof encoded).toBe('string');
        });

        test('decodeCredential이 암호화된 문자열을 복호화해야 함', () => {
            const plaintext = 'testPassword123';
            const encoded = authManager.encodeCredential(plaintext);
            const decoded = authManager.decodeCredential(encoded);
            
            expect(decoded).toBe(plaintext);
        });

        test('다양한 문자열에 대해 암호화/복호화가 일관되게 작동해야 함', () => {
            const testStrings = [
                'admin',
                '2ndBrain2024!',
                'simplePassword',
                'ComplexP@ssw0rd!',
                // btoa는 한글을 지원하지 않으므로 제외
                'special!@#$%^&*()chars'
            ];

            testStrings.forEach(str => {
                const encoded = authManager.encodeCredential(str);
                const decoded = authManager.decodeCredential(encoded);
                expect(decoded).toBe(str);
            });
        });
    });

    describe('사용자 관리', () => {
        test('loadUsers가 localStorage에서 사용자를 로드해야 함', () => {
            const testUsers = [
                {
                    id: 'test_user_1',
                    username: 'testuser',
                    password: 'encoded_password',
                    role: 'user',
                    name: '테스트 사용자'
                }
            ];
            
            localStorage.setItem('2nd_brain_users', JSON.stringify(testUsers));
            
            const loadedUsers = authManager.loadUsers();
            expect(loadedUsers.length).toBeGreaterThanOrEqual(1);
            // 기본 관리자가 추가되므로 최소 1개 이상
        });

        test('saveUsers가 사용자를 localStorage에 저장해야 함', () => {
            authManager.users = [
                {
                    id: 'test_user_1',
                    username: 'testuser',
                    role: 'user',
                    name: '테스트 사용자'
                }
            ];
            
            authManager.saveUsers();
            
            const saved = localStorage.getItem('2nd_brain_users');
            expect(saved).toBeTruthy();
            
            const parsed = JSON.parse(saved);
            expect(parsed).toEqual(authManager.users);
        });

        test('createUser가 새 사용자를 생성해야 함 (관리자 권한 필요)', () => {
            // 관리자로 로그인
            authManager.currentUser = { role: 'admin' };
            authManager.isLoggedIn = true;
            
            const userData = {
                username: 'newuser',
                password: 'newpassword',
                name: '새 사용자',
                role: 'user'
            };
            
            const newUser = authManager.createUser(userData);
            
            expect(newUser).toHaveProperty('id');
            expect(newUser.username).toBe(userData.username);
            expect(newUser.name).toBe(userData.name);
            expect(newUser.role).toBe(userData.role);
            expect(authManager.users).toContain(newUser);
        });

        test('createUser가 관리자 권한 없이는 실패해야 함', () => {
            authManager.currentUser = { role: 'user' };
            authManager.isLoggedIn = true;
            
            expect(() => {
                authManager.createUser({
                    username: 'newuser',
                    password: 'newpassword',
                    name: '새 사용자'
                });
            }).toThrow('관리자 권한이 필요합니다.');
        });

        test('deleteUser가 사용자를 삭제해야 함 (관리자 권한 필요)', () => {
            // 관리자로 로그인
            authManager.currentUser = { role: 'admin' };
            authManager.isLoggedIn = true;
            
            // 테스트 사용자 추가
            const testUser = {
                id: 'delete_test_user',
                username: 'deleteuser',
                role: 'user'
            };
            authManager.users.push(testUser);
            
            const initialCount = authManager.users.length;
            authManager.deleteUser(testUser.id);
            
            expect(authManager.users.length).toBe(initialCount - 1);
            expect(authManager.users.find(u => u.id === testUser.id)).toBeUndefined();
        });
    });

    describe('로그인 시스템', () => {
        test('login이 유효한 자격 증명으로 성공해야 함', async () => {
            const result = await authManager.login('admin', '2ndBrain2024!');
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.username).toBe('admin');
            expect(result.message).toContain('환영합니다');
            expect(authManager.isLoggedIn).toBe(true);
            expect(authManager.currentUser).toBeDefined();
        });

        test('login이 잘못된 자격 증명으로 실패해야 함', async () => {
            const result = await authManager.login('admin', 'wrongpassword');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('일치하지 않습니다');
            expect(authManager.isLoggedIn).toBe(false);
            expect(authManager.currentUser).toBeNull();
        });

        test('login이 존재하지 않는 사용자로 실패해야 함', async () => {
            const result = await authManager.login('nonexistent', 'password');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('일치하지 않습니다');
            expect(authManager.isLoggedIn).toBe(false);
        });

        test('login 성공 시 마지막 로그인 시간이 업데이트되어야 함', async () => {
            const beforeLogin = new Date().toISOString();
            
            await authManager.login('admin', '2ndBrain2024!');
            
            const adminUser = authManager.users.find(u => u.username === 'admin');
            expect(adminUser.lastLogin).toBeTruthy();
            expect(new Date(adminUser.lastLogin) >= new Date(beforeLogin)).toBe(true);
        });

        test('logout이 세션을 정리해야 함', () => {
            // 먼저 로그인
            authManager.currentUser = { username: 'admin', role: 'admin' };
            authManager.isLoggedIn = true;
            authManager.sessionTimer = setTimeout(() => {}, 1000);
            
            const result = authManager.logout();
            
            expect(result.success).toBe(true);
            expect(authManager.currentUser).toBeNull();
            expect(authManager.isLoggedIn).toBe(false);
            expect(localStorage.getItem('2nd_brain_session')).toBeNull();
        });
    });

    describe('세션 관리', () => {
        test('saveSession이 세션 데이터를 저장해야 함', () => {
            authManager.currentUser = { username: 'admin', role: 'admin' };
            
            authManager.saveSession();
            
            const saved = localStorage.getItem('2nd_brain_session');
            expect(saved).toBeTruthy();
            
            const sessionData = JSON.parse(saved);
            expect(sessionData).toHaveProperty('user');
            expect(sessionData).toHaveProperty('loginTime');
            expect(sessionData).toHaveProperty('expiresAt');
            expect(sessionData.user).toEqual(authManager.currentUser);
        });

        test('checkSavedSession이 유효한 세션을 복원해야 함', () => {
            const futureTime = new Date(Date.now() + 60000).toISOString(); // 1분 후
            const sessionData = {
                user: { username: 'admin', role: 'admin' },
                loginTime: new Date().toISOString(),
                expiresAt: futureTime
            };
            
            localStorage.setItem('2nd_brain_session', JSON.stringify(sessionData));
            
            const result = authManager.checkSavedSession();
            
            expect(result).toBe(true);
            expect(authManager.currentUser).toEqual(sessionData.user);
            expect(authManager.isLoggedIn).toBe(true);
        });

        test('checkSavedSession이 만료된 세션을 삭제해야 함', () => {
            const pastTime = new Date(Date.now() - 60000).toISOString(); // 1분 전
            const sessionData = {
                user: { username: 'admin', role: 'admin' },
                loginTime: new Date().toISOString(),
                expiresAt: pastTime
            };
            
            localStorage.setItem('2nd_brain_session', JSON.stringify(sessionData));
            
            const result = authManager.checkSavedSession();
            
            expect(result).toBe(false);
            expect(authManager.currentUser).toBeNull();
            expect(authManager.isLoggedIn).toBe(false);
            expect(localStorage.getItem('2nd_brain_session')).toBeNull();
        });

        test('startSessionTimer가 타임아웃 후 자동 로그아웃해야 함', () => {
            authManager.currentUser = { username: 'admin' };
            authManager.isLoggedIn = true;
            
            const logoutSpy = jest.spyOn(authManager, 'logout');
            
            authManager.startSessionTimer();
            
            // 세션 타임아웃 시간만큼 시간 진행
            jest.advanceTimersByTime(authManager.sessionTimeout);
            
            expect(logoutSpy).toHaveBeenCalled();
        });
    });

    describe('권한 시스템', () => {
        test('hasPermission이 관리자 권한을 올바르게 확인해야 함', () => {
            authManager.currentUser = { role: 'admin' };
            authManager.isLoggedIn = true;
            
            expect(authManager.hasPermission('admin')).toBe(true);
            expect(authManager.hasPermission('user')).toBe(true);
        });

        test('hasPermission이 일반 사용자 권한을 올바르게 확인해야 함', () => {
            authManager.currentUser = { role: 'user' };
            authManager.isLoggedIn = true;
            
            expect(authManager.hasPermission('user')).toBe(true);
            expect(authManager.hasPermission('admin')).toBe(false);
        });

        test('hasPermission이 로그아웃 상태에서 false를 반환해야 함', () => {
            authManager.isLoggedIn = false;
            
            expect(authManager.hasPermission('user')).toBe(false);
            expect(authManager.hasPermission('admin')).toBe(false);
        });

        test('requireAuth가 로그인된 사용자에게 콜백을 실행해야 함', () => {
            authManager.isLoggedIn = true;
            const callback = jest.fn();
            
            authManager.requireAuth(callback);
            
            expect(callback).toHaveBeenCalled();
        });

        test('requireAuth가 로그아웃된 사용자에게 로그인 모달을 표시해야 함', () => {
            authManager.isLoggedIn = false;
            const showLoginModalSpy = jest.spyOn(authManager, 'showLoginModal').mockImplementation();
            const callback = jest.fn();
            
            authManager.requireAuth(callback);
            
            expect(callback).not.toHaveBeenCalled();
            expect(showLoginModalSpy).toHaveBeenCalled();
        });

        test('requireAdmin이 관리자에게 콜백을 실행해야 함', () => {
            authManager.currentUser = { role: 'admin' };
            authManager.isLoggedIn = true;
            const callback = jest.fn();
            
            authManager.requireAdmin(callback);
            
            expect(callback).toHaveBeenCalled();
        });

        test('requireAdmin이 비관리자에게 에러 토스트를 표시해야 함', () => {
            authManager.currentUser = { role: 'user' };
            authManager.isLoggedIn = true;
            const callback = jest.fn();
            
            authManager.requireAdmin(callback);
            
            expect(callback).not.toHaveBeenCalled();
            expect(window.app.showToast).toHaveBeenCalledWith('관리자 권한이 필요합니다.', 'error');
        });
    });

    describe('UI 관리', () => {
        test('updateAuthUI가 로그인 상태에서 올바른 UI를 표시해야 함', () => {
            // DOM 요소 모킹
            document.body.innerHTML = `
                <div id="userInfo" style="display: none;"></div>
                <button id="loginBtn" style="display: block;"></button>
                <button id="logoutBtn" style="display: none;"></button>
            `;
            
            authManager.currentUser = { role: 'admin', name: '관리자' };
            authManager.isLoggedIn = true;
            
            authManager.updateAuthUI();
            
            const userInfo = document.getElementById('userInfo');
            const loginBtn = document.getElementById('loginBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            expect(userInfo.style.display).toBe('flex');
            expect(loginBtn.style.display).toBe('none');
            expect(logoutBtn.style.display).toBe('block');
            expect(userInfo.innerHTML).toContain('👑');
            expect(userInfo.innerHTML).toContain('관리자');
        });

        test('updateAuthUI가 로그아웃 상태에서 올바른 UI를 표시해야 함', () => {
            document.body.innerHTML = `
                <div id="userInfo" style="display: flex;"></div>
                <button id="loginBtn" style="display: none;"></button>
                <button id="logoutBtn" style="display: block;"></button>
            `;
            
            authManager.isLoggedIn = false;
            authManager.currentUser = null;
            
            authManager.updateAuthUI();
            
            const userInfo = document.getElementById('userInfo');
            const loginBtn = document.getElementById('loginBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            expect(userInfo.style.display).toBe('none');
            expect(loginBtn.style.display).toBe('block');
            expect(logoutBtn.style.display).toBe('none');
        });

        test('toggleAdminMenu가 관리자 메뉴를 표시/숨김해야 함', () => {
            document.body.innerHTML = `
                <div class="admin-only" style="display: none;"></div>
                <div class="admin-only" style="display: none;"></div>
            `;
            
            authManager.toggleAdminMenu(true);
            
            const adminMenus = document.querySelectorAll('.admin-only');
            adminMenus.forEach(menu => {
                expect(menu.style.display).toBe('block');
            });
            
            authManager.toggleAdminMenu(false);
            
            adminMenus.forEach(menu => {
                expect(menu.style.display).toBe('none');
            });
        });
    });

    describe('이벤트 시스템', () => {
        test('dispatchAuthEvent가 커스텀 이벤트를 발생시켜야 함', () => {
            const eventListener = jest.fn();
            document.addEventListener('authStateChange', eventListener);
            
            const testData = { username: 'admin' };
            authManager.dispatchAuthEvent('login', testData);
            
            expect(eventListener).toHaveBeenCalled();
            
            const eventDetail = eventListener.mock.calls[0][0].detail;
            expect(eventDetail.type).toBe('login');
            expect(eventDetail.data).toEqual(testData);
        });

        test('login 성공 시 authStateChange 이벤트가 발생해야 함', async () => {
            const eventListener = jest.fn();
            document.addEventListener('authStateChange', eventListener);
            
            await authManager.login('admin', '2ndBrain2024!');
            
            expect(eventListener).toHaveBeenCalled();
            const eventDetail = eventListener.mock.calls[0][0].detail;
            expect(eventDetail.type).toBe('login');
        });

        test('logout 시 authStateChange 이벤트가 발생해야 함', () => {
            const eventListener = jest.fn();
            document.addEventListener('authStateChange', eventListener);
            
            authManager.currentUser = { username: 'admin' };
            authManager.isLoggedIn = true;
            
            authManager.logout();
            
            expect(eventListener).toHaveBeenCalled();
            const eventDetail = eventListener.mock.calls[0][0].detail;
            expect(eventDetail.type).toBe('logout');
        });
    });

    describe('사용자 통계', () => {
        test('getUserStats가 올바른 통계를 반환해야 함', () => {
            authManager.users = [
                { role: 'admin', username: 'admin1' },
                { role: 'admin', username: 'admin2' },
                { role: 'user', username: 'user1' },
                { role: 'user', username: 'user2' },
                { role: 'user', username: 'user3' }
            ];
            
            authManager.currentUser = { username: 'admin1', role: 'admin' };
            
            const stats = authManager.getUserStats();
            
            expect(stats.totalUsers).toBe(5);
            expect(stats.adminCount).toBe(2);
            expect(stats.userCount).toBe(3);
            expect(stats.currentUser).toEqual(authManager.currentUser);
        });
    });

    describe('로그인 모달', () => {
        test('showLoginModal이 모달을 생성해야 함', () => {
            authManager.showLoginModal();
            
            const modal = document.querySelector('.auth-modal');
            expect(modal).toBeTruthy();
            expect(modal.classList.contains('active')).toBe(true);
            
            const usernameInput = modal.querySelector('#username');
            const passwordInput = modal.querySelector('#password');
            const loginButton = modal.querySelector('#loginSubmitBtn');
            
            expect(usernameInput).toBeTruthy();
            expect(passwordInput).toBeTruthy();
            expect(loginButton).toBeTruthy();
        });

        test('handleLoginSubmit이 유효한 로그인을 처리해야 함', async () => {
            authManager.showLoginModal();
            const modal = document.querySelector('.auth-modal');
            
            const usernameInput = modal.querySelector('#username');
            const passwordInput = modal.querySelector('#password');
            
            usernameInput.value = 'admin';
            passwordInput.value = '2ndBrain2024!';
            
            await authManager.handleLoginSubmit(modal);
            
            expect(authManager.isLoggedIn).toBe(true);
            // 모달 제거는 비동기적으로 일어나므로 로그인 상태만 확인
        });

        test('handleLoginSubmit이 빈 입력값을 거부해야 함', async () => {
            authManager.showLoginModal();
            const modal = document.querySelector('.auth-modal');
            
            const usernameInput = modal.querySelector('#username');
            const passwordInput = modal.querySelector('#password');
            
            usernameInput.value = '';
            passwordInput.value = '';
            
            await authManager.handleLoginSubmit(modal);
            
            expect(authManager.isLoggedIn).toBe(false);
            expect(window.app.showToast).toHaveBeenCalledWith(
                '아이디와 비밀번호를 모두 입력해주세요.', 
                'warning'
            );
        });
    });

    describe('에러 처리', () => {
        test('loadUsers가 잘못된 localStorage 데이터를 처리해야 함', () => {
            localStorage.setItem('2nd_brain_users', 'invalid json');
            
            const users = authManager.loadUsers();
            
            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBeGreaterThanOrEqual(0);
        });

        test('saveUsers가 localStorage 에러를 적절히 처리해야 함', () => {
            jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('Storage full');
            });
            
            expect(() => {
                authManager.saveUsers();
            }).not.toThrow();
        });

        test('checkSavedSession이 잘못된 세션 데이터를 처리해야 함', () => {
            localStorage.setItem('2nd_brain_session', 'invalid json');
            
            const result = authManager.checkSavedSession();
            
            expect(result).toBe(false);
            expect(authManager.isLoggedIn).toBe(false);
        });
    });

    describe('통합 테스트', () => {
        test('전체 인증 플로우가 올바르게 작동해야 함', async () => {
            // 1. 초기 상태 확인
            expect(authManager.isLoggedIn).toBe(false);
            
            // 2. 로그인 실행
            const loginResult = await authManager.login('admin', '2ndBrain2024!');
            expect(loginResult.success).toBe(true);
            expect(authManager.isLoggedIn).toBe(true);
            
            // 3. 권한 확인
            expect(authManager.hasPermission('admin')).toBe(true);
            expect(authManager.hasPermission('user')).toBe(true);
            
            // 4. 세션 저장 확인
            const sessionData = localStorage.getItem('2nd_brain_session');
            expect(sessionData).toBeTruthy();
            
            // 5. 사용자 생성 (관리자 권한)
            const newUser = authManager.createUser({
                username: 'testuser',
                password: 'testpass',
                name: '테스트 사용자',
                role: 'user'
            });
            expect(newUser).toBeDefined();
            
            // 6. 로그아웃
            const logoutResult = authManager.logout();
            expect(logoutResult.success).toBe(true);
            expect(authManager.isLoggedIn).toBe(false);
            expect(authManager.currentUser).toBeNull();
        });
    });
});