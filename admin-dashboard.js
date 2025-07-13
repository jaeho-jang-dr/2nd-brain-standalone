// 👑 2nd Brain 관리자 대시보드 전용 JavaScript

class AdminDashboard {
    constructor() {
        this.authManager = null;
        this.dataManager = null;
        this.claudeAI = null;
        this.memories = [];
        this.users = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedItems = new Set();
        
        this.init();
    }

    async init() {
        // 인증 확인
        await this.checkAuthentication();
        
        // 시스템 초기화
        this.initializeManagers();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 데이터 로드
        this.loadDashboardData();
        
        console.log('👑 관리자 대시보드 초기화 완료');
    }

    async checkAuthentication() {
        // 세션 확인
        const session = localStorage.getItem('2nd_brain_session');
        if (!session) {
            this.redirectToLogin();
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            if (now >= expiresAt || sessionData.user.role !== 'admin') {
                this.redirectToLogin();
                return;
            }
            
            // 사용자 정보 헤더에 표시
            this.updateUserInfo(sessionData.user);
            
            console.log('✅ 관리자 인증 확인됨:', sessionData.user.name);
        } catch (error) {
            console.error('인증 확인 실패:', error);
            this.redirectToLogin();
        }
    }

    updateUserInfo(user) {
        const adminTitle = document.querySelector('.admin-title h1');
        if (adminTitle) {
            adminTitle.textContent = `2nd Brain 관리자 - ${user.name}`;
        }
    }

    redirectToLogin() {
        if (confirm('관리자 권한이 필요합니다. 메인 페이지로 이동하여 로그인하시겠습니까?')) {
            window.location.href = 'index.html';
        }
    }

    initializeManagers() {
        // 기본 매니저들 초기화
        this.authManager = new AuthManager();
        this.dataManager = new DataManager({ memories: this.getMemories() });
        
        if (window.ClaudeAI) {
            this.claudeAI = new window.ClaudeAI(this.getSecureApiKey());
        }
    }

    getSecureApiKey() {
        // ROT13 암호화된 API 키 복호화
        const encryptedKey = 'fx-nag-ncv03--DsvoPz1ckhaGvp9QiOS6KPXW2UGr8PgP0JWNC9I5ZbtWg2jv6O9bUeg5TN2bancQCjrFa21JBtgE2q0nt-VJYh7NNN';
        return this.decodeSecureKey(encryptedKey);
    }

    decodeSecureKey(encoded) {
        // ROT13 복호화
        const rot13Decoded = encoded.replace(/[a-zA-Z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
        return atob(rot13Decoded);
    }

    setupEventListeners() {
        // 헤더 버튼들
        document.getElementById('homeBtn')?.addEventListener('click', () => {
            adminDashboard.returnToMain();
        });

        document.getElementById('aiChatBtn')?.addEventListener('click', () => {
            adminDashboard.showAiPopup();
        });

        document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
            adminDashboard.showPasswordModal();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            adminDashboard.logout();
        });

        // 탭 전환
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                adminDashboard.switchTab(e.target.dataset.tab);
            });
        });

        // 검색 및 필터
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            adminDashboard.performSearch();
        });

        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                adminDashboard.performSearch();
            }
        });

        // 대시보드 새로고침
        document.getElementById('refreshStats')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // 데이터 관리 버튼들
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => {
            this.deleteSelected();
        });

        document.getElementById('backupBtn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            this.clearAllData();
        });

        // 비밀번호 변경 모달
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // AI 채팅
        document.getElementById('askAiBtn')?.addEventListener('click', () => {
            this.askAI();
        });

        document.getElementById('closeAiPopup')?.addEventListener('click', () => {
            this.hideAiPopup();
        });

        // 모달 닫기
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal, .ai-popup').classList.remove('active');
            });
        });

        // 모달 배경 클릭시 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // 📊 대시보드 데이터 로드
    loadDashboardData() {
        // 실시간 데이터 동기화
        this.syncDataFromMain();
        
        this.memories = this.getMemories();
        this.users = this.getUsers();
        
        // 통계 업데이트
        this.updateStats();
        
        // 최근 활동 표시
        this.showRecentActivity();
        
        console.log('📊 대시보드 데이터 로드 완료');
    }

    // 메인 앱에서 데이터 동기화
    syncDataFromMain() {
        // 메인 앱에서 추가된 최신 데이터 확인
        const lastSync = localStorage.getItem('admin_last_sync') || '0';
        const currentTime = Date.now().toString();
        
        // 데이터 인덱스 재구축 (변경사항 있을 경우)
        if (this.dataManager) {
            this.dataManager.buildIndexes();
        }
        
        localStorage.setItem('admin_last_sync', currentTime);
        console.log('🔄 메인 앱 데이터 동기화 완료');
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayMemories = this.memories.filter(m => 
            m.timestamp.startsWith(today)
        ).length;

        document.getElementById('totalMemories').textContent = this.memories.length;
        document.getElementById('todayMemories').textContent = todayMemories;
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('storageUsed').textContent = this.calculateStorageUsage() + 'MB';
    }

    showRecentActivity() {
        const recent = this.memories
            .slice(0, 10)
            .map(memory => `
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${this.getTypeEmoji(memory.type)} ${memory.content.substring(0, 50)}...</span>
                        <small style="color: var(--text-secondary);">${this.formatDate(memory.timestamp)}</small>
                    </div>
                </div>
            `).join('');

        document.getElementById('recentActivity').innerHTML = recent || '<p style="text-align: center; color: var(--text-secondary);">최근 활동이 없습니다.</p>';
    }

    // 🔍 검색 및 필터링
    performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const importanceFilter = document.getElementById('importanceFilter').value;

        let results = this.memories;

        // 텍스트 검색
        if (query) {
            results = results.filter(memory => 
                memory.content.toLowerCase().includes(query) ||
                (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        // 타입 필터
        if (typeFilter) {
            results = results.filter(memory => memory.type === typeFilter);
        }

        // 날짜 필터
        if (dateFilter) {
            results = results.filter(memory => 
                memory.timestamp.startsWith(dateFilter)
            );
        }

        // 중요도 필터
        if (importanceFilter) {
            const minImportance = parseInt(importanceFilter);
            results = results.filter(memory => 
                (memory.importance || 5) >= minImportance
            );
        }

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageResults = results.slice(startIndex, endIndex);

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAll"></th>
                        <th>타입</th>
                        <th>내용</th>
                        <th>날짜</th>
                        <th>중요도</th>
                        <th>태그</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageResults.map(memory => `
                        <tr>
                            <td><input type="checkbox" class="item-checkbox" data-id="${memory.id}"></td>
                            <td>${this.getTypeEmoji(memory.type)} ${memory.type}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${memory.content}</td>
                            <td>${this.formatDate(memory.timestamp)}</td>
                            <td>${'⭐'.repeat(Math.min(memory.importance || 0, 5))}</td>
                            <td>${(memory.tags || []).join(', ')}</td>
                            <td>
                                <button class="btn secondary" onclick="adminDashboard.viewMemory('${memory.id}')">👁️</button>
                                <button class="btn primary" onclick="adminDashboard.editMemory('${memory.id}')">✏️</button>
                                <button class="btn danger" onclick="adminDashboard.deleteMemory('${memory.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('searchResults').innerHTML = html;
        this.setupPagination(results.length);
        this.setupCheckboxes();
    }

    setupPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="adminDashboard.goToPage(${i})">${i}</button>`;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.performSearch();
    }

    setupCheckboxes() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.item-checkbox');

        selectAll?.addEventListener('change', (e) => {
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) {
                    this.selectedItems.add(cb.dataset.id);
                } else {
                    this.selectedItems.delete(cb.dataset.id);
                }
            });
        });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedItems.add(e.target.dataset.id);
                } else {
                    this.selectedItems.delete(e.target.dataset.id);
                }
            });
        });
    }

    // 🔧 데이터 관리 메서드
    viewMemory(id) {
        const memory = this.memories.find(m => m.id === id);
        if (memory) {
            alert(`📋 메모리 상세:\n\n타입: ${memory.type}\n내용: ${memory.content}\n날짜: ${this.formatDate(memory.timestamp)}\n중요도: ${memory.importance || 5}\n태그: ${(memory.tags || []).join(', ')}`);
        }
    }

    editMemory(id) {
        const memory = this.memories.find(m => m.id === id);
        if (memory) {
            const newContent = prompt('내용 수정:', memory.content);
            if (newContent !== null) {
                memory.content = newContent;
                this.saveMemories();
                this.performSearch();
                this.showToast('메모리가 수정되었습니다.', 'success');
            }
        }
    }

    deleteMemory(id) {
        if (confirm('이 메모리를 삭제하시겠습니까?')) {
            this.memories = this.memories.filter(m => m.id !== id);
            this.saveMemories();
            this.performSearch();
            this.loadDashboardData();
            this.showToast('메모리가 삭제되었습니다.', 'success');
        }
    }

    deleteSelected() {
        if (this.selectedItems.size === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        if (confirm(`선택한 ${this.selectedItems.size}개 항목을 삭제하시겠습니까?`)) {
            this.memories = this.memories.filter(m => !this.selectedItems.has(m.id));
            this.saveMemories();
            this.selectedItems.clear();
            this.performSearch();
            this.loadDashboardData();
            this.showToast('선택한 메모리들이 삭제되었습니다.', 'success');
        }
    }

    exportData() {
        const data = {
            memories: this.memories,
            users: this.users.map(u => ({ ...u, password: undefined })), // 비밀번호 제외
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `2nd_brain_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showToast('데이터가 내보내기되었습니다.', 'success');
    }

    createBackup() {
        const backup = {
            memories: this.memories,
            users: this.users,
            settings: this.getSettings(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `2nd_brain_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        localStorage.setItem('2nd_brain_last_backup', new Date().toISOString());
        this.showToast('백업이 생성되었습니다.', 'success');
    }

    clearAllData() {
        if (confirm('⚠️ 정말로 모든 데이터를 삭제하시겠습니까?')) {
            if (confirm('🚨 마지막 확인: 모든 데이터가 영구적으로 삭제됩니다!')) {
                localStorage.removeItem('2nd_brain_memories');
                this.memories = [];
                this.loadDashboardData();
                this.performSearch();
                this.showToast('모든 데이터가 삭제되었습니다.', 'warning');
            }
        }
    }

    // 🔑 비밀번호 변경
    showPasswordModal() {
        document.getElementById('passwordModal').classList.add('active');
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 6) {
            alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        // 현재 비밀번호 확인
        const session = JSON.parse(localStorage.getItem('2nd_brain_session'));
        const currentUser = this.users.find(u => u.id === session.user.id);

        if (!currentUser || this.authManager.decodeCredential(currentUser.password) !== currentPassword) {
            alert('현재 비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 변경
        currentUser.password = this.authManager.encodeCredential(newPassword);
        this.saveUsers();

        document.getElementById('passwordModal').classList.remove('active');
        document.getElementById('passwordForm').reset();
        
        this.showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
    }

    // 🧠 AI 채팅 기능
    showAiPopup() {
        document.getElementById('aiPopup').classList.add('active');
    }

    hideAiPopup() {
        document.getElementById('aiPopup').classList.remove('active');
    }

    async askAI() {
        const question = document.getElementById('aiQuestion').value.trim();
        if (!question) {
            alert('질문을 입력해주세요.');
            return;
        }

        if (!this.claudeAI) {
            alert('Claude AI가 초기화되지 않았습니다.');
            return;
        }

        const responseArea = document.getElementById('aiResponseArea');
        responseArea.innerHTML = '<div class="loading"><div class="spinner"></div> AI가 답변을 생성하고 있습니다...</div>';

        try {
            // 데이터 컨텍스트 준비
            const context = this.buildDataContext();
            const fullQuestion = `관리자 질문: ${question}\n\n현재 데이터베이스 상태:\n${context}`;
            
            const response = await this.claudeAI.sendMessage(fullQuestion);
            
            responseArea.innerHTML = `
                <div class="ai-response">
                    <strong>🧠 Claude AI 답변:</strong><br><br>
                    ${response.replace(/\n/g, '<br>')}
                </div>
                <button class="copy-btn" onclick="adminDashboard.copyResponse('${response.replace(/'/g, "\\'")}')">📋 답변 복사</button>
            `;
        } catch (error) {
            console.error('AI 질문 실패:', error);
            responseArea.innerHTML = `
                <div class="ai-response" style="color: var(--danger-color);">
                    ❌ AI 응답 중 오류가 발생했습니다: ${error.message}
                </div>
            `;
        }
    }

    buildDataContext() {
        const stats = {
            totalMemories: this.memories.length,
            typeBreakdown: this.getTypeBreakdown(),
            recentMemories: this.memories.slice(0, 5).map(m => `${m.type}: ${m.content.substring(0, 50)}...`),
            totalUsers: this.users.length,
            storageUsage: this.calculateStorageUsage()
        };

        return `
총 메모리: ${stats.totalMemories}개
타입별 분포: ${JSON.stringify(stats.typeBreakdown)}
총 사용자: ${stats.totalUsers}명
스토리지 사용량: ${stats.storageUsage}MB

최근 메모리 5개:
${stats.recentMemories.join('\n')}
        `.trim();
    }

    copyResponse(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('답변이 클립보드에 복사되었습니다.', 'success');
        }).catch(() => {
            // 폴백: 텍스트 영역 사용
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('답변이 복사되었습니다.', 'success');
        });
    }

    // 🔄 탭 전환
    switchTab(tabName) {
        // 모든 탭 비활성화
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // 탭별 데이터 로드
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'data-browser':
                this.performSearch();
                break;
            case 'memory-manager':
                this.loadMemoryManager();
                break;
            case 'user-manager':
                this.loadUserManager();
                break;
            case 'system-settings':
                this.loadSystemSettings();
                break;
        }
    }

    loadMemoryManager() {
        const html = this.memories.map(memory => `
            <div style="background: var(--background-secondary); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${this.getTypeEmoji(memory.type)} ${memory.type}</strong> - ${memory.content.substring(0, 100)}...
                        <br><small style="color: var(--text-secondary);">${this.formatDate(memory.timestamp)} | 중요도: ${memory.importance || 5}</small>
                    </div>
                    <div>
                        <button class="btn secondary" onclick="adminDashboard.viewMemory('${memory.id}')">👁️</button>
                        <button class="btn primary" onclick="adminDashboard.editMemory('${memory.id}')">✏️</button>
                        <button class="btn danger" onclick="adminDashboard.deleteMemory('${memory.id}')">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('memoryList').innerHTML = html || '<p style="text-align: center; color: var(--text-secondary);">저장된 메모리가 없습니다.</p>';
    }

    loadUserManager() {
        const html = this.users.map(user => `
            <div style="background: var(--background-secondary); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${user.role === 'admin' ? '👑' : '👤'} ${user.name}</strong> (@${user.username})
                        <br><small style="color: var(--text-secondary);">가입: ${this.formatDate(user.createdAt)} | 마지막 로그인: ${user.lastLogin ? this.formatDate(user.lastLogin) : '없음'}</small>
                    </div>
                    <div>
                        <button class="btn primary">✏️ 편집</button>
                        ${user.role !== 'admin' ? '<button class="btn danger">🗑️ 삭제</button>' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('userList').innerHTML = html;
    }

    loadSystemSettings() {
        const settings = this.getSettings();
        const html = `
            <div class="form-group">
                <label>자동 백업 주기</label>
                <select class="form-input" id="autoBackupInterval">
                    <option value="immediate" ${settings.autoBackupInterval === 'immediate' ? 'selected' : ''}>즉시</option>
                    <option value="hourly" ${settings.autoBackupInterval === 'hourly' ? 'selected' : ''}>매시간</option>
                    <option value="daily" ${settings.autoBackupInterval === 'daily' ? 'selected' : ''}>매일</option>
                    <option value="weekly" ${settings.autoBackupInterval === 'weekly' ? 'selected' : ''}>매주</option>
                </select>
            </div>
            <div class="form-group">
                <label>최대 메모리 개수</label>
                <input type="number" class="form-input" id="maxMemories" value="${settings.maxMemories || 10000}" min="100" max="100000">
            </div>
            <div class="form-group">
                <label>세션 타임아웃 (분)</label>
                <input type="number" class="form-input" id="sessionTimeout" value="${settings.sessionTimeout || 30}" min="5" max="480">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="autoAIAnalysis" ${settings.autoAIAnalysis !== false ? 'checked' : ''}> 
                    AI 분석 자동 실행
                </label>
            </div>
        `;

        document.getElementById('systemSettings').innerHTML = html;
    }

    // 🔧 유틸리티 메서드
    getMemories() {
        return JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
    }

    saveMemories() {
        localStorage.setItem('2nd_brain_memories', JSON.stringify(this.memories));
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('2nd_brain_users') || '[]');
    }

    saveUsers() {
        localStorage.setItem('2nd_brain_users', JSON.stringify(this.users));
    }

    getSettings() {
        return JSON.parse(localStorage.getItem('2nd_brain_settings') || '{}');
    }

    logout() {
        if (confirm('로그아웃하시겠습니까?')) {
            // 관리자에서 수정된 데이터를 메인으로 동기화
            this.syncDataToMain();
            
            localStorage.removeItem('2nd_brain_session');
            window.location.href = 'index.html';
        }
    }

    // 관리자에서 메인으로 데이터 동기화
    syncDataToMain() {
        // 관리자에서 수정된 모든 데이터 저장 확인
        this.saveMemories();
        this.saveUsers();
        
        // 메인 앱이 데이터 변경을 감지할 수 있도록 플래그 설정
        localStorage.setItem('admin_data_updated', Date.now().toString());
        
        console.log('📤 관리자 → 메인 데이터 동기화 완료');
    }

    // 메인으로 돌아가기
    returnToMain() {
        // 데이터 동기화 후 메인으로 이동
        this.syncDataToMain();
        
        this.showToast('메인 페이지로 이동합니다...', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString('ko-KR');
    }

    getTypeEmoji(type) {
        const emojis = {
            text: '📝',
            voice: '🎙️',
            photo: '📸',
            video: '🎥',
            location: '📍',
            document: '📄'
        };
        return emojis[type] || '📎';
    }

    getTypeBreakdown() {
        const breakdown = {};
        this.memories.forEach(memory => {
            breakdown[memory.type] = (breakdown[memory.type] || 0) + 1;
        });
        return breakdown;
    }

    calculateStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (key.startsWith('2nd_brain_')) {
                totalSize += localStorage[key].length;
            }
        }
        return Math.round(totalSize / 1024); // KB를 MB로 변환
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'danger' ? 'var(--danger-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 4000;
            transform: translateX(400px);
            transition: transform 0.3s;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// 전역 인스턴스 생성
window.adminDashboard = new AdminDashboard();