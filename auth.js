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

    // 📝 로그인 모달
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal active';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-header">
                    <h2>🔐 2nd Brain 로그인</h2>
                    <p>계속하려면 로그인이 필요합니다</p>
                </div>
                
                <form class="auth-form" id="loginForm">
                    <div class="form-group">
                        <label for="username">아이디</label>
                        <input type="text" id="username" required 
                               placeholder="아이디를 입력하세요" autocomplete="username">
                    </div>
                    
                    <div class="form-group">
                        <label for="password">비밀번호</label>
                        <input type="password" id="password" required 
                               placeholder="비밀번호를 입력하세요" autocomplete="current-password">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="auth-btn primary">
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
        
        // 로그인 폼 이벤트
        const loginForm = modal.querySelector('#loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = modal.querySelector('#username').value;
            const password = modal.querySelector('#password').value;
            
            const result = await this.login(username, password);
            
            if (result.success) {
                modal.remove();
                this.showToast(result.message, 'success');
            } else {
                this.showToast(result.message, 'error');
            }
        });
        
        // 첫 번째 입력 필드에 포커스
        setTimeout(() => {
            modal.querySelector('#username').focus();
        }, 100);
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
}

// 전역에서 사용할 수 있도록 내보내기
window.AuthManager = AuthManager;