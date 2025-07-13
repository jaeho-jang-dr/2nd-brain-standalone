// 🔐 2nd Brain 인증 및 사용자 관리 시스템

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30분
        this.sessionTimer = null;
        
        // 기본 관리자 계정 (암호화됨)
        this.adminCredentials = {
            username: this.encodeCredential('admin'),
            password: this.encodeCredential('2ndBrain2024!'),
            role: 'admin',
            name: '관리자'
        };
        
        // 사용자 데이터베이스 (로컬 저장)
        this.users = this.loadUsers();
        
        this.init();
    }

    init() {
        // 저장된 세션 확인
        this.checkSavedSession();
        
        // 자동 로그아웃 타이머 설정
        this.setupSessionTimer();
        
        // UI 업데이트
        this.updateAuthUI();
    }

    // 🔐 자격 증명 암호화/복호화
    encodeCredential(text) {
        // Base64 + ROT13 조합 암호화
        const base64 = btoa(text);
        return base64.replace(/[a-zA-Z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
    }

    decodeCredential(encoded) {
        // ROT13 + Base64 복호화
        const rot13Decoded = encoded.replace(/[a-zA-Z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
        return atob(rot13Decoded);
    }

    // 👤 사용자 관리
    loadUsers() {
        try {
            const saved = localStorage.getItem('2nd_brain_users');
            const users = saved ? JSON.parse(saved) : [];
            
            // 기본 관리자 추가 (없으면)
            const hasAdmin = users.some(user => user.role === 'admin');
            if (!hasAdmin) {
                users.push({
                    id: 'admin_001',
                    username: this.decodeCredential(this.adminCredentials.username),
                    password: this.adminCredentials.password,
                    role: 'admin',
                    name: '관리자',
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                });
            }
            
            return users;
        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
            return [];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('2nd_brain_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('사용자 데이터 저장 실패:', error);
        }
    }

    // 🔑 로그인 시스템
    async login(username, password) {
        try {
            // 사용자 찾기
            const user = this.users.find(u => 
                u.username === username && 
                this.decodeCredential(u.password) === password
            );
            
            if (!user) {
                throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
            }
            
            // 로그인 성공
            this.currentUser = {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            };
            
            this.isLoggedIn = true;
            
            // 마지막 로그인 시간 업데이트
            user.lastLogin = new Date().toISOString();
            this.saveUsers();
            
            // 세션 저장
            this.saveSession();
            
            // 세션 타이머 시작
            this.startSessionTimer();
            
            // UI 업데이트
            this.updateAuthUI();
            
            // 로그인 성공 이벤트 발생
            this.dispatchAuthEvent('login', this.currentUser);
            
            return {
                success: true,
                user: this.currentUser,
                message: `${user.name}님, 환영합니다!`
            };
            
        } catch (error) {
            console.error('로그인 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    logout() {
        // 세션 정리
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // 저장된 세션 삭제
        localStorage.removeItem('2nd_brain_session');
        
        // 타이머 정리
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        // UI 업데이트
        this.updateAuthUI();
        
        // 로그아웃 이벤트 발생
        this.dispatchAuthEvent('logout');
        
        // 로그인 화면 표시
        this.showLoginModal();
        
        return {
            success: true,
            message: '로그아웃되었습니다.'
        };
    }

    // 📱 세션 관리
    saveSession() {
        const sessionData = {
            user: this.currentUser,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
        };
        
        localStorage.setItem('2nd_brain_session', JSON.stringify(sessionData));
    }

    checkSavedSession() {
        try {
            const saved = localStorage.getItem('2nd_brain_session');
            if (!saved) return false;
            
            const sessionData = JSON.parse(saved);
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            if (now < expiresAt) {
                // 유효한 세션
                this.currentUser = sessionData.user;
                this.isLoggedIn = true;
                this.startSessionTimer();
                return true;
            } else {
                // 만료된 세션
                localStorage.removeItem('2nd_brain_session');
                return false;
            }
        } catch (error) {
            console.error('세션 확인 실패:', error);
            return false;
        }
    }

    setupSessionTimer() {
        // 활동 감지 이벤트
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const resetTimer = () => {
            if (this.isLoggedIn) {
                this.startSessionTimer();
            }
        };
        
        activityEvents.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
    }

    startSessionTimer() {
        // 기존 타이머 정리
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        // 새 타이머 시작
        this.sessionTimer = setTimeout(() => {
            this.logout();
            this.showToast('세션이 만료되어 자동 로그아웃되었습니다.', 'warning');
        }, this.sessionTimeout);
    }

    // 🎨 UI 업데이트
    updateAuthUI() {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isLoggedIn && this.currentUser) {
            // 로그인 상태 UI
            if (userInfo) {
                userInfo.innerHTML = `
                    <span class="user-role">${this.currentUser.role === 'admin' ? '👑' : '👤'}</span>
                    <span class="user-name">${this.currentUser.name}</span>
                `;
                userInfo.style.display = 'flex';
            }
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // 관리자 메뉴 표시/숨김
            this.toggleAdminMenu(this.currentUser.role === 'admin');
            
        } else {
            // 로그아웃 상태 UI
            if (userInfo) userInfo.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // 관리자 메뉴 숨김
            this.toggleAdminMenu(false);
        }
    }

    toggleAdminMenu(show) {
        const adminMenus = document.querySelectorAll('.admin-only');
        adminMenus.forEach(menu => {
            menu.style.display = show ? 'block' : 'none';
        });
    }

    // 📝 iOS Safari 최적화된 로그인 모달
    showLoginModal() {
        // iOS Safari 감지
        const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
        
        console.log('🔐 Showing login modal (iOS Safari:', isIOSSafari, ')');
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal active';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-header">
                    <h2>🔐 2nd Brain 로그인</h2>
                    <p>계속하려면 로그인이 필요합니다</p>
                </div>
                
                <!-- iOS Safari 최적화된 로그인 폼 -->
                <form class="auth-form" id="loginForm" action="javascript:void(0);" novalidate>
                    <div class="form-group">
                        <label for="username">아이디</label>
                        <input type="text" 
                               id="username" 
                               name="username"
                               required 
                               placeholder="아이디를 입력하세요" 
                               autocomplete="username"
                               autocapitalize="none"
                               autocorrect="off"
                               spellcheck="false"
                               inputmode="text"
                               style="font-size: 16px;">
                    </div>
                    
                    <div class="form-group">
                        <label for="password">비밀번호</label>
                        <input type="password" 
                               id="password" 
                               name="password"
                               required 
                               placeholder="비밀번호를 입력하세요" 
                               autocomplete="current-password"
                               style="font-size: 16px;">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" 
                                class="auth-btn primary" 
                                id="loginSubmitBtn"
                                style="min-height: 48px; font-size: 16px;">
                            🔑 로그인
                        </button>
                    </div>
                </form>
                
                <div class="auth-info">
                    <p>기본 관리자 계정:</p>
                    <p><strong>아이디:</strong> admin</p>
                    <p><strong>비밀번호:</strong> 2ndBrain2024!</p>
                </div>
                
                <div class="auth-footer">
                    <small>© 2024 2nd Brain. 모든 데이터는 안전하게 보호됩니다.</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // iOS Safari 최적화된 이벤트 핸들러 설정
        const loginForm = modal.querySelector('#loginForm');
        const loginButton = modal.querySelector('#loginSubmitBtn');
        const usernameInput = modal.querySelector('#username');
        const passwordInput = modal.querySelector('#password');
        
        console.log('🔧 Setting up login form events for iOS Safari compatibility');
        
        // 폼 제출 이벤트 (주요 핸들러)
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Login form submitted');
                await this.handleLoginSubmit(modal);
                return false;
            });
        }
        
        // iOS Safari에서 버튼 터치 이벤트 강화
        if (loginButton) {
            console.log('🔧 Setting up iOS Safari login button events');
            
            // 모바일 호환 이벤트 리스너 사용
            this.addMobileCompatibleEventListener(loginButton, async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Login button touched/clicked');
                await this.handleLoginSubmit(modal);
            });
            
            // iOS Safari에서 추가 최적화
            if (isIOSSafari) {
                loginButton.style.touchAction = 'manipulation';
                loginButton.style.webkitTouchCallout = 'none';
                loginButton.style.webkitUserSelect = 'none';
                loginButton.style.userSelect = 'none';
                loginButton.style.webkitTapHighlightColor = 'transparent';
            }
        }
        
        // Enter 키 처리 개선
        if (usernameInput && passwordInput) {
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('🔐 Enter key pressed in login input');
                        await this.handleLoginSubmit(modal);
                    }
                });
                
                // iOS Safari에서 입력 필드 최적화
                if (isIOSSafari) {
                    input.style.webkitTouchCallout = 'default';
                    input.style.webkitUserSelect = 'text';
                    input.style.userSelect = 'text';
                    input.style.touchAction = 'manipulation';
                }
            });
        }
        
        // 모달 외부 클릭으로 닫기 (iOS Safari 호환)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('🔐 Login modal backdrop clicked - closing');
                modal.remove();
            }
        });
        
        // iOS Safari에서 첫 번째 입력 필드에 포커스 (키보드 이슈 방지)
        setTimeout(() => {
            if (usernameInput) {
                usernameInput.focus();
                console.log('🔐 Username input focused');
            }
        }, isIOSSafari ? 300 : 100);
        
        console.log('🔐 Login modal setup completed');
    }

    // 🔧 권한 확인
    hasPermission(requiredRole) {
        if (!this.isLoggedIn) return false;
        
        const roles = ['user', 'admin'];
        const userRoleIndex = roles.indexOf(this.currentUser.role);
        const requiredRoleIndex = roles.indexOf(requiredRole);
        
        return userRoleIndex >= requiredRoleIndex;
    }

    requireAuth(callback) {
        if (this.isLoggedIn) {
            callback();
        } else {
            this.showLoginModal();
        }
    }

    requireAdmin(callback) {
        if (this.hasPermission('admin')) {
            callback();
        } else {
            this.showToast('관리자 권한이 필요합니다.', 'error');
        }
    }

    // 📢 이벤트 시스템
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent('authStateChange', {
            detail: { type, data, user: this.currentUser }
        });
        document.dispatchEvent(event);
    }

    // 💬 토스트 메시지
    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 👥 사용자 관리 (관리자 전용)
    createUser(userData) {
        if (!this.hasPermission('admin')) {
            throw new Error('관리자 권한이 필요합니다.');
        }
        
        const newUser = {
            id: 'user_' + Date.now(),
            username: userData.username,
            password: this.encodeCredential(userData.password),
            role: userData.role || 'user',
            name: userData.name,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        return newUser;
    }

    deleteUser(userId) {
        if (!this.hasPermission('admin')) {
            throw new Error('관리자 권한이 필요합니다.');
        }
        
        this.users = this.users.filter(user => user.id !== userId);
        this.saveUsers();
    }

    // 📊 사용자 통계
    getUserStats() {
        return {
            totalUsers: this.users.length,
            adminCount: this.users.filter(u => u.role === 'admin').length,
            userCount: this.users.filter(u => u.role === 'user').length,
            currentUser: this.currentUser
        };
    }

    // 🔑 iOS Safari 최적화된 로그인 처리 헬퍼 메서드
    async handleLoginSubmit(modal) {
        console.log('🔐 handleLoginSubmit called');
        
        // 중복 제출 방지
        if (this._loginInProgress) {
            console.log('🔐 Login already in progress, ignoring');
            return;
        }
        
        const usernameInput = modal.querySelector('#username');
        const passwordInput = modal.querySelector('#password');
        const loginButton = modal.querySelector('#loginSubmitBtn');
        
        if (!usernameInput || !passwordInput) {
            console.error('🔐 Login inputs not found');
            this.showToast('로그인 폼에 오류가 있습니다.', 'error');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        console.log('🔐 Login attempt:', { username, hasPassword: !!password });
        
        if (!username || !password) {
            this.showToast('아이디와 비밀번호를 모두 입력해주세요.', 'warning');
            return;
        }
        
        // 로그인 진행 상태 설정
        this._loginInProgress = true;
        
        // 버튼 비활성화 및 로딩 표시
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = '🔄 로그인 중...';
            loginButton.style.opacity = '0.7';
        }
        
        try {
            const result = await this.login(username, password);
            
            console.log('🔐 Login result:', result);
            
            if (result.success) {
                // 성공 시 모달 제거
                modal.remove();
                this.showToast(result.message, 'success');
                console.log('🔐 Login successful, modal removed');
            } else {
                // 실패 시 에러 메시지 표시
                this.showToast(result.message, 'error');
                
                // 버튼 복원
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = '🔑 로그인';
                    loginButton.style.opacity = '1';
                }
                
                // 비밀번호 필드 클리어 및 포커스
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error('🔐 Login error:', error);
            this.showToast('로그인 중 오류가 발생했습니다.', 'error');
            
            // 버튼 복원
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = '🔑 로그인';
                loginButton.style.opacity = '1';
            }
        } finally {
            // 로그인 진행 상태 해제
            this._loginInProgress = false;
        }
    }

    // 📱 모바일 호환 이벤트 리스너 (app.js와 동일한 로직)
    addMobileCompatibleEventListener(element, callback) {
        let touchStarted = false;
        let touchStartX = 0;
        let touchStartY = 0;
        
        // 터치 시작
        element.addEventListener('touchstart', (e) => {
            touchStarted = true;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            // 시각적 피드백
            element.style.transform = 'scale(0.95)';
            element.style.opacity = '0.8';
            
            console.log(`🔍 Auth touch start on ${element.id || element.className}`);
        }, { passive: false });
        
        // 터치 종료
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (touchStarted) {
                const touch = e.changedTouches[0];
                const touchEndX = touch.clientX;
                const touchEndY = touch.clientY;
                
                const moveDistance = Math.sqrt(
                    Math.pow(touchEndX - touchStartX, 2) + 
                    Math.pow(touchEndY - touchStartY, 2)
                );
                
                if (moveDistance < 15) {
                    console.log(`✅ Auth touch end - executing callback`);
                    callback(e);
                } else {
                    console.log(`❌ Auth touch moved too much (${moveDistance}px)`);
                }
                
                touchStarted = false;
            }
            
            // 시각적 피드백 제거
            element.style.transform = '';
            element.style.opacity = '';
        }, { passive: false });
        
        // 터치 취소
        element.addEventListener('touchcancel', () => {
            touchStarted = false;
            element.style.transform = '';
            element.style.opacity = '';
            console.log(`🚫 Auth touch cancelled`);
        });
        
        // 데스크톱 클릭 이벤트
        element.addEventListener('click', (e) => {
            if (!('ontouchstart' in window) || !touchStarted) {
                console.log(`🖱️ Auth click event`);
                callback(e);
            }
        });
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.AuthManager = AuthManager;