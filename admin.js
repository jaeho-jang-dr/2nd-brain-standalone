// 👑 2nd Brain 관리자 시스템

class AdminManager {
    constructor(authManager, app) {
        this.auth = authManager;
        this.app = app;
        this.isAdminPanelOpen = false;
        
        this.init();
    }

    init() {
        // 인증 상태 변경 이벤트 리스너
        document.addEventListener('authStateChange', (e) => {
            if (e.detail.type === 'login' && e.detail.user.role === 'admin') {
                this.setupAdminInterface();
            }
        });
    }

    // 🎛️ 관리자 인터페이스 설정
    setupAdminInterface() {
        this.addAdminMenuToNavigation();
        this.setupAdminEventListeners();
    }

    addAdminMenuToNavigation() {
        // 관리자 버튼은 이미 HTML에 존재하므로 여기서는 이벤트만 연결
        // AuthManager.updateAuthUI()에서 visibility 관리됨
        console.log('🎛️ 관리자 인터페이스 설정 완료');
    }

    // 관리자 대시보드 페이지로 이동
    openAdminDashboard() {
        window.location.href = 'admin-dashboard.html';
    }

    setupAdminEventListeners() {
        // 관리자 UI 요소들의 이벤트만 처리 (설정 버튼과 관리자 버튼은 app.js에서 처리)
        // 관리자 버튼 이벤트는 app.js의 setupEventListeners()에서 모바일 호환성과 함께 처리됨
        console.log('🎛️ 관리자 이벤트 리스너 설정 완료 - adminBtn은 app.js에서 처리됨');
    }

    // iOS Safari 최적화된 일반 사용자 설정 표시
    showUserSettings() {
        console.log('⚙️ Showing user settings modal');
        
        // iOS Safari 감지
        const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">⚙️ 설정</h3>
                    <button class="close-btn" id="settingsCloseBtn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>🔧 앱 설정</h4>
                        <div class="setting-item">
                            <label>언어 설정</label>
                            <select id="languageSetting" style="font-size: 16px;">
                                <option value="ko-KR">한국어</option>
                                <option value="en-US">English</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="autoTranscription" checked style="min-width: 20px; min-height: 20px;"> 
                                자동 음성 변환
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="locationTracking" style="min-width: 20px; min-height: 20px;"> 
                                위치 추적 허용
                            </label>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>💾 데이터</h4>
                        <button class="btn secondary" id="exportUserDataBtn" style="min-height: 44px; font-size: 16px; margin-bottom: 10px;">📤 내 데이터 내보내기</button>
                        <button class="btn danger" id="clearUserDataBtn" style="min-height: 44px; font-size: 16px;">🗑️ 내 데이터 삭제</button>
                    </div>
                    <div class="settings-section">
                        <h4>ℹ️ 정보</h4>
                        <p>버전: 1.0.0</p>
                        <p>저장 용량: <span id="userStorageInfo">계산 중...</span></p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // iOS Safari 최적화된 이벤트 핸들러 설정
        this.setupUserSettingsEvents(modal, isIOSSafari);
        this.updateUserStorageInfo();
        
        console.log('⚙️ User settings modal created with iOS Safari optimization');
    }
    
    // iOS Safari 최적화된 사용자 설정 이벤트 핸들러
    setupUserSettingsEvents(modal, isIOSSafari) {
        console.log('🔧 Setting up user settings events (iOS Safari:', isIOSSafari, ')');
        
        // 닫기 버튼
        const closeBtn = modal.querySelector('#settingsCloseBtn');
        if (closeBtn) {
            if (window.app && window.app.addMobileCompatibleEventListener) {
                window.app.addMobileCompatibleEventListener(closeBtn, () => {
                    console.log('⚙️ Settings close button clicked');
                    modal.remove();
                });
            } else {
                closeBtn.addEventListener('click', () => {
                    console.log('⚙️ Settings close button clicked (fallback)');
                    modal.remove();
                });
            }
        }
        
        // 데이터 내보내기 버튼
        const exportBtn = modal.querySelector('#exportUserDataBtn');
        if (exportBtn) {
            if (window.app && window.app.addMobileCompatibleEventListener) {
                window.app.addMobileCompatibleEventListener(exportBtn, () => {
                    console.log('⚙️ Export user data button clicked');
                    if (this.app && this.app.exportUserData) {
                        this.app.exportUserData();
                    }
                });
            } else {
                exportBtn.addEventListener('click', () => {
                    console.log('⚙️ Export user data button clicked (fallback)');
                    if (this.app && this.app.exportUserData) {
                        this.app.exportUserData();
                    }
                });
            }
        }
        
        // 데이터 삭제 버튼
        const clearBtn = modal.querySelector('#clearUserDataBtn');
        if (clearBtn) {
            if (window.app && window.app.addMobileCompatibleEventListener) {
                window.app.addMobileCompatibleEventListener(clearBtn, () => {
                    console.log('⚙️ Clear user data button clicked');
                    if (this.app && this.app.clearUserData) {
                        this.app.clearUserData();
                    }
                });
            } else {
                clearBtn.addEventListener('click', () => {
                    console.log('⚙️ Clear user data button clicked (fallback)');
                    if (this.app && this.app.clearUserData) {
                        this.app.clearUserData();
                    }
                });
            }
        }
        
        // 모달 외부 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('⚙️ Settings modal backdrop clicked - closing');
                modal.remove();
            }
        });
        
        // iOS Safari에서 버튼 최적화
        if (isIOSSafari) {
            const buttons = modal.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.touchAction = 'manipulation';
                button.style.webkitTouchCallout = 'none';
                button.style.webkitUserSelect = 'none';
                button.style.userSelect = 'none';
                button.style.webkitTapHighlightColor = 'transparent';
            });
            
            const inputs = modal.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.style.touchAction = 'manipulation';
                if (input.type !== 'checkbox') {
                    input.style.webkitTouchCallout = 'default';
                    input.style.webkitUserSelect = 'text';
                    input.style.userSelect = 'text';
                }
            });
        }
    }

    // 관리자 설정 표시 (기존 기능 유지하면서 확장)
    showAdminSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">👑 관리자 설정</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="admin-quick-actions">
                        <button class="btn primary admin-quick-btn" onclick="window.location.href='admin-dashboard.html'">
                            👑 관리자 대시보드 열기
                        </button>
                        <button class="btn secondary admin-quick-btn" onclick="adminManager.app.createBackup()">
                            💾 즉시 백업
                        </button>
                        <button class="btn secondary admin-quick-btn" onclick="adminManager.showDataSummary()">
                            📊 데이터 요약
                        </button>
                    </div>
                    
                    <div class="settings-section">
                        <h4>⚡ 빠른 작업</h4>
                        <div class="quick-stats">
                            <div class="stat-item">
                                <span>총 메모리:</span>
                                <span id="quickTotalMemories">0</span>
                            </div>
                            <div class="stat-item">
                                <span>총 사용자:</span>
                                <span id="quickTotalUsers">0</span>
                            </div>
                            <div class="stat-item">
                                <span>사용 용량:</span>
                                <span id="quickStorageUsed">0MB</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h4>🔧 시스템 관리</h4>
                        <button class="btn secondary" onclick="adminManager.optimizeSystem()">⚡ 시스템 최적화</button>
                        <button class="btn secondary" onclick="adminManager.rebuildIndexes()">🔄 인덱스 재구축</button>
                        <button class="btn warning" onclick="adminManager.clearCache()">🧹 캐시 정리</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.updateQuickStats();
    }

    updateUserStorageInfo() {
        const storageInfo = this.calculateUserStorage();
        const element = document.getElementById('userStorageInfo');
        if (element) {
            element.textContent = `${storageInfo}MB`;
        }
    }

    updateQuickStats() {
        const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
        const users = JSON.parse(localStorage.getItem('2nd_brain_users') || '[]');
        const storage = this.calculateUserStorage();

        document.getElementById('quickTotalMemories').textContent = memories.length;
        document.getElementById('quickTotalUsers').textContent = users.length;
        document.getElementById('quickStorageUsed').textContent = storage + 'MB';
    }

    calculateUserStorage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (key.startsWith('2nd_brain_')) {
                totalSize += localStorage[key].length;
            }
        }
        return Math.round(totalSize / 1024);
    }

    // 데이터 요약 표시
    showDataSummary() {
        const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
        const users = JSON.parse(localStorage.getItem('2nd_brain_users') || '[]');
        
        const typeBreakdown = {};
        memories.forEach(memory => {
            typeBreakdown[memory.type] = (typeBreakdown[memory.type] || 0) + 1;
        });

        const today = new Date().toISOString().split('T')[0];
        const todayMemories = memories.filter(m => m.timestamp.startsWith(today)).length;

        alert(`📊 데이터 요약

총 메모리: ${memories.length}개
오늘 추가: ${todayMemories}개
총 사용자: ${users.length}명

타입별 분포:
${Object.entries(typeBreakdown).map(([type, count]) => `• ${type}: ${count}개`).join('\n')}

저장 용량: ${this.calculateUserStorage()}MB`);
    }

    // 시스템 최적화
    optimizeSystem() {
        if (confirm('시스템을 최적화하시겠습니까? 인덱스 재구축과 캐시 정리가 수행됩니다.')) {
            // 인덱스 재구축
            if (this.app.dataManager) {
                this.app.dataManager.buildIndexes();
            }
            
            // 캐시 정리
            this.clearCache();
            
            alert('✅ 시스템 최적화가 완료되었습니다!');
        }
    }

    // 인덱스 재구축
    rebuildIndexes() {
        if (this.app.dataManager) {
            this.app.dataManager.buildIndexes();
            alert('✅ 인덱스가 재구축되었습니다!');
        }
    }

    // 캐시 정리
    clearCache() {
        // 임시 데이터 정리
        localStorage.removeItem('admin_last_sync');
        localStorage.removeItem('admin_data_updated');
        
        // 만료된 세션 정리
        const session = localStorage.getItem('2nd_brain_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date();
                const expiresAt = new Date(sessionData.expiresAt);
                
                if (now >= expiresAt) {
                    localStorage.removeItem('2nd_brain_session');
                }
            } catch (error) {
                localStorage.removeItem('2nd_brain_session');
            }
        }
        
        alert('🧹 캐시가 정리되었습니다!');
    }

    // 📊 관리자 패널 토글
    toggleAdminPanel() {
        if (this.isAdminPanelOpen) {
            this.closeAdminPanel();
        } else {
            this.openAdminPanel();
        }
    }

    openAdminPanel() {
        this.isAdminPanelOpen = true;
        
        const panel = document.createElement('div');
        panel.className = 'admin-panel active';
        panel.id = 'adminPanel';
        panel.innerHTML = this.getAdminPanelHTML();
        
        document.body.appendChild(panel);
        
        this.setupAdminPanelEvents(panel);
        this.loadAdminData();
    }

    closeAdminPanel() {
        this.isAdminPanelOpen = false;
        document.getElementById('adminPanel')?.remove();
    }

    // 🎨 관리자 패널 HTML
    getAdminPanelHTML() {
        return `
            <div class="admin-panel-content">
                <div class="admin-header">
                    <h2>👑 관리자 패널</h2>
                    <button class="close-btn" id="closeAdminPanel">✕</button>
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="dashboard">📊 대시보드</button>
                    <button class="admin-tab" data-tab="memories">💾 메모리 관리</button>
                    <button class="admin-tab" data-tab="users">👥 사용자 관리</button>
                    <button class="admin-tab" data-tab="settings">⚙️ 시스템 설정</button>
                </div>
                
                <div class="admin-content">
                    <!-- 대시보드 탭 -->
                    <div class="admin-tab-content active" id="dashboard-tab">
                        <div class="admin-stats">
                            <div class="stat-card">
                                <div class="stat-icon">💾</div>
                                <div class="stat-info">
                                    <div class="stat-number" id="totalMemories">0</div>
                                    <div class="stat-label">총 메모리</div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">📅</div>
                                <div class="stat-info">
                                    <div class="stat-number" id="todayMemories">0</div>
                                    <div class="stat-label">오늘 추가</div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">👥</div>
                                <div class="stat-info">
                                    <div class="stat-number" id="totalUsers">0</div>
                                    <div class="stat-label">총 사용자</div>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">💽</div>
                                <div class="stat-info">
                                    <div class="stat-number" id="storageUsed">0MB</div>
                                    <div class="stat-label">사용 용량</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-charts">
                            <div class="chart-container">
                                <h3>📈 메모리 추가 추이</h3>
                                <canvas id="memoryChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 메모리 관리 탭 -->
                    <div class="admin-tab-content" id="memories-tab">
                        <div class="admin-controls">
                            <div class="control-group">
                                <input type="text" id="memorySearch" placeholder="메모리 검색...">
                                <button class="admin-btn" id="searchMemories">🔍 검색</button>
                            </div>
                            
                            <div class="control-group">
                                <select id="memoryFilter">
                                    <option value="all">전체</option>
                                    <option value="text">텍스트</option>
                                    <option value="voice">음성</option>
                                    <option value="photo">사진</option>
                                    <option value="video">영상</option>
                                    <option value="location">위치</option>
                                </select>
                                
                                <select id="memorySortBy">
                                    <option value="date">날짜순</option>
                                    <option value="importance">중요도순</option>
                                    <option value="type">유형별</option>
                                    <option value="person">사용자별</option>
                                </select>
                                
                                <button class="admin-btn" id="exportMemories">📤 내보내기</button>
                                <button class="admin-btn danger" id="clearAllMemories">🗑️ 전체 삭제</button>
                            </div>
                        </div>
                        
                        <div class="memory-list" id="adminMemoryList">
                            <!-- 동적으로 생성되는 메모리 목록 -->
                        </div>
                    </div>
                    
                    <!-- 사용자 관리 탭 -->
                    <div class="admin-tab-content" id="users-tab">
                        <div class="admin-controls">
                            <button class="admin-btn primary" id="addNewUser">👤 새 사용자 추가</button>
                            <button class="admin-btn" id="exportUsers">📤 사용자 목록 내보내기</button>
                        </div>
                        
                        <div class="user-list" id="adminUserList">
                            <!-- 동적으로 생성되는 사용자 목록 -->
                        </div>
                    </div>
                    
                    <!-- 시스템 설정 탭 -->
                    <div class="admin-tab-content" id="settings-tab">
                        <div class="settings-section">
                            <h3>🔧 시스템 설정</h3>
                            
                            <div class="setting-item">
                                <label>자동 백업 주기</label>
                                <select id="autoBackupInterval">
                                    <option value="immediate">즉시</option>
                                    <option value="hourly">매시간</option>
                                    <option value="daily">매일</option>
                                    <option value="weekly">매주</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <label>최대 저장 메모리 수</label>
                                <input type="number" id="maxMemories" value="10000" min="100" max="100000">
                            </div>
                            
                            <div class="setting-item">
                                <label>세션 유지 시간 (분)</label>
                                <input type="number" id="sessionTimeout" value="30" min="5" max="480">
                            </div>
                            
                            <div class="setting-item">
                                <label>AI 분석 자동 실행</label>
                                <input type="checkbox" id="autoAIAnalysis" checked>
                            </div>
                            
                            <div class="setting-actions">
                                <button class="admin-btn primary" id="saveSystemSettings">💾 설정 저장</button>
                                <button class="admin-btn" id="resetSettings">🔄 기본값 복원</button>
                                <button class="admin-btn danger" id="factoryReset">⚠️ 팩토리 리셋</button>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>📊 데이터 관리</h3>
                            
                            <div class="data-actions">
                                <button class="admin-btn" id="backupData">💾 전체 백업</button>
                                <button class="admin-btn" id="importData">📥 데이터 가져오기</button>
                                <button class="admin-btn" id="optimizeDatabase">⚡ 데이터베이스 최적화</button>
                            </div>
                            
                            <div class="backup-info">
                                <p>마지막 백업: <span id="lastBackupTime">없음</span></p>
                                <p>데이터베이스 크기: <span id="databaseSize">계산 중...</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 🎮 관리자 패널 이벤트 설정
    setupAdminPanelEvents(panel) {
        // 패널 닫기
        panel.querySelector('#closeAdminPanel').addEventListener('click', () => {
            this.closeAdminPanel();
        });

        // 탭 전환
        panel.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAdminTab(e.target.dataset.tab);
            });
        });

        // 메모리 관리 이벤트
        this.setupMemoryManagementEvents(panel);
        
        // 사용자 관리 이벤트
        this.setupUserManagementEvents(panel);
        
        // 시스템 설정 이벤트
        this.setupSystemSettingsEvents(panel);
    }

    // 🔄 탭 전환
    switchAdminTab(tabName) {
        // 모든 탭 비활성화
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // 탭별 데이터 로드
        this.loadTabData(tabName);
    }

    // 📊 관리자 데이터 로드
    loadAdminData() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        const memories = this.app.memories || [];
        const users = this.auth.users || [];
        
        // 통계 업데이트
        document.getElementById('totalMemories').textContent = memories.length;
        document.getElementById('todayMemories').textContent = this.getTodayMemoriesCount(memories);
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('storageUsed').textContent = this.calculateStorageUsage() + 'MB';
        
        // 차트 그리기
        this.drawMemoryChart(memories);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'memories':
                this.loadMemoryManagement();
                break;
            case 'users':
                this.loadUserManagement();
                break;
            case 'settings':
                this.loadSystemSettings();
                break;
        }
    }

    // 💾 메모리 관리
    setupMemoryManagementEvents(panel) {
        // 메모리 검색
        panel.querySelector('#searchMemories').addEventListener('click', () => {
            this.searchMemories();
        });

        // 메모리 필터/정렬
        panel.querySelector('#memoryFilter').addEventListener('change', () => {
            this.filterMemories();
        });
        
        panel.querySelector('#memorySortBy').addEventListener('change', () => {
            this.sortMemories();
        });

        // 메모리 내보내기
        panel.querySelector('#exportMemories').addEventListener('click', () => {
            this.exportMemories();
        });

        // 전체 삭제 (확인 후)
        panel.querySelector('#clearAllMemories').addEventListener('click', () => {
            this.clearAllMemories();
        });
    }

    loadMemoryManagement() {
        const memories = this.app.memories || [];
        this.displayMemoriesInAdmin(memories);
    }

    displayMemoriesInAdmin(memories) {
        const container = document.getElementById('adminMemoryList');
        if (!container) return;

        container.innerHTML = '';

        if (memories.length === 0) {
            container.innerHTML = '<div class="no-data">저장된 메모리가 없습니다.</div>';
            return;
        }

        memories.forEach(memory => {
            const memoryCard = document.createElement('div');
            memoryCard.className = 'admin-memory-card';
            memoryCard.innerHTML = `
                <div class="memory-info">
                    <div class="memory-type">${this.app.getTypeEmoji(memory.type)} ${memory.type}</div>
                    <div class="memory-content">${memory.content.substring(0, 100)}...</div>
                    <div class="memory-meta">
                        <span>📅 ${new Date(memory.timestamp).toLocaleString()}</span>
                        <span>⭐ ${memory.importance || 5}</span>
                        <span>🏷️ ${memory.tags?.join(', ') || '태그 없음'}</span>
                    </div>
                </div>
                <div class="memory-actions">
                    <button class="admin-btn small" onclick="adminManager.editMemory('${memory.id}')">✏️ 편집</button>
                    <button class="admin-btn small danger" onclick="adminManager.deleteMemory('${memory.id}')">🗑️ 삭제</button>
                </div>
            `;
            container.appendChild(memoryCard);
        });
    }

    // 👥 사용자 관리
    setupUserManagementEvents(panel) {
        panel.querySelector('#addNewUser').addEventListener('click', () => {
            this.showAddUserModal();
        });

        panel.querySelector('#exportUsers').addEventListener('click', () => {
            this.exportUsers();
        });
    }

    loadUserManagement() {
        const users = this.auth.users || [];
        this.displayUsersInAdmin(users);
    }

    displayUsersInAdmin(users) {
        const container = document.getElementById('adminUserList');
        if (!container) return;

        container.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'admin-user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <div class="user-role">${user.role === 'admin' ? '👑' : '👤'}</div>
                    <div class="user-details">
                        <div class="user-name">${user.name}</div>
                        <div class="user-username">@${user.username}</div>
                        <div class="user-meta">
                            <span>가입: ${new Date(user.createdAt).toLocaleDateString()}</span>
                            <span>마지막 로그인: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '없음'}</span>
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="admin-btn small" onclick="adminManager.editUser('${user.id}')">✏️ 편집</button>
                    ${user.role !== 'admin' ? `<button class="admin-btn small danger" onclick="adminManager.deleteUser('${user.id}')">🗑️ 삭제</button>` : ''}
                </div>
            `;
            container.appendChild(userCard);
        });
    }

    // ⚙️ 시스템 설정
    setupSystemSettingsEvents(panel) {
        panel.querySelector('#saveSystemSettings').addEventListener('click', () => {
            this.saveSystemSettings();
        });

        panel.querySelector('#resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        panel.querySelector('#factoryReset').addEventListener('click', () => {
            this.factoryReset();
        });

        panel.querySelector('#backupData').addEventListener('click', () => {
            this.backupAllData();
        });

        panel.querySelector('#importData').addEventListener('click', () => {
            this.importData();
        });

        panel.querySelector('#optimizeDatabase').addEventListener('click', () => {
            this.optimizeDatabase();
        });
    }

    // 🔧 유틸리티 메서드
    getTodayMemoriesCount(memories) {
        const today = new Date().toDateString();
        return memories.filter(memory => 
            new Date(memory.timestamp).toDateString() === today
        ).length;
    }

    calculateStorageUsage() {
        let totalSize = 0;
        
        // LocalStorage 크기 계산
        for (let key in localStorage) {
            if (key.startsWith('2nd_brain_')) {
                totalSize += localStorage[key].length;
            }
        }
        
        return Math.round(totalSize / 1024); // KB를 MB로 변환
    }

    drawMemoryChart(memories) {
        // 간단한 메모리 추가 추이 차트
        // 실제 구현에서는 Chart.js 등을 사용할 수 있음
        console.log('차트 그리기:', memories.length, '개의 메모리');
    }

    // 📤 데이터 내보내기
    exportMemories() {
        const memories = this.app.memories || [];
        const dataStr = JSON.stringify(memories, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `2nd_brain_memories_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    exportUsers() {
        const users = this.auth.users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }));
        
        const dataStr = JSON.stringify(users, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `2nd_brain_users_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // 🗑️ 데이터 삭제
    clearAllMemories() {
        if (confirm('⚠️ 정말로 모든 메모리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            if (confirm('🚨 마지막 확인: 모든 데이터가 영구적으로 삭제됩니다!')) {
                this.app.memories = [];
                this.app.saveMemories();
                this.app.updateUI();
                this.loadMemoryManagement();
                this.app.showToast('모든 메모리가 삭제되었습니다.', 'warning');
            }
        }
    }

    deleteMemory(memoryId) {
        if (confirm('이 메모리를 삭제하시겠습니까?')) {
            this.app.deleteMemory(memoryId);
            this.loadMemoryManagement();
            this.app.showToast('메모리가 삭제되었습니다.', 'success');
        }
    }

    deleteUser(userId) {
        if (confirm('이 사용자를 삭제하시겠습니까?')) {
            this.auth.deleteUser(userId);
            this.loadUserManagement();
            this.app.showToast('사용자가 삭제되었습니다.', 'success');
        }
    }

    // 💾 백업 및 복원
    backupAllData() {
        const backupData = {
            memories: this.app.memories || [],
            users: this.auth.users || [],
            settings: this.getSystemSettings(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `2nd_brain_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        localStorage.setItem('2nd_brain_last_backup', new Date().toISOString());
        this.app.showToast('전체 데이터 백업이 완료되었습니다.', 'success');
    }

    getSystemSettings() {
        return {
            autoBackupInterval: localStorage.getItem('2nd_brain_auto_backup') || 'daily',
            maxMemories: parseInt(localStorage.getItem('2nd_brain_max_memories')) || 10000,
            sessionTimeout: parseInt(localStorage.getItem('2nd_brain_session_timeout')) || 30,
            autoAIAnalysis: localStorage.getItem('2nd_brain_auto_ai') !== 'false'
        };
    }

    saveSystemSettings() {
        const settings = {
            autoBackupInterval: document.getElementById('autoBackupInterval').value,
            maxMemories: document.getElementById('maxMemories').value,
            sessionTimeout: document.getElementById('sessionTimeout').value,
            autoAIAnalysis: document.getElementById('autoAIAnalysis').checked
        };
        
        localStorage.setItem('2nd_brain_auto_backup', settings.autoBackupInterval);
        localStorage.setItem('2nd_brain_max_memories', settings.maxMemories);
        localStorage.setItem('2nd_brain_session_timeout', settings.sessionTimeout);
        localStorage.setItem('2nd_brain_auto_ai', settings.autoAIAnalysis);
        
        this.app.showToast('시스템 설정이 저장되었습니다.', 'success');
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.AdminManager = AdminManager;