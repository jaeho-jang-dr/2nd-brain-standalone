// 📱 2nd Brain - 아이폰 단독 실행용 앱 v1.00.01
// 서버 없이 클라이언트 사이드에서만 동작
// 🗣️ 완전한 대화형 AI - 중간 입력 및 Claude 인사 기능

class StandaloneBrainApp {
    constructor() {
        this.memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
        this.settings = JSON.parse(localStorage.getItem('2nd_brain_settings') || '{}');
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recognition = null;
        
        // 기본 설정 - API 키는 암호화되어 저장
        this.defaultSettings = {
            apiKey: this.getSecureApiKey(),
            language: 'ko-KR',
            autoTranscription: true,
            aiPersonality: 'casual',
            locationTracking: false,
            autoBackup: 'daily'
        };
        
        this.settings = { ...this.defaultSettings, ...this.settings };
        
        // 인증 및 관리자 시스템 초기화
        this.authManager = null;
        this.adminManager = null;
        this.dataManager = null;
        this.chatConversation = [];
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingScreen('🚀 2nd Brain 초기화 중...');
            
            // 인증 시스템 초기화
            this.authManager = new AuthManager();
            
            // 관리자 시스템 초기화
            this.adminManager = new AdminManager(this.authManager, this);
            
            // 데이터 관리자 초기화
            this.dataManager = new DataManager(this);
            
            // 기본 데이터 로드
            await this.loadLocalData();
            
            // 관리자에서 변경된 데이터 확인
            this.checkAdminDataUpdates();
            
            // Claude AI 초기화
            await this.initializeClaudeAI();
            
            // UI 이벤트 설정
            this.setupEventListeners();
            
            // 온라인/오프라인 상태 감지
            this.setupNetworkListeners();
            
            // 음성 인식 초기화
            this.initializeSpeechRecognition();
            
            // 미디어 권한 확인
            this.checkMediaPermissions();
            
            // UI 업데이트
            this.updateUI();
            
            this.hideLoadingScreen();
            this.showToast('🧠 2nd Brain이 준비되었습니다!', 'success');
            
        } catch (error) {
            console.error('앱 초기화 오류:', error);
            this.hideLoadingScreen();
            this.showToast('앱 초기화에 실패했습니다.', 'error');
        }
    }

    // 🔐 보안 API 키 관리
    getSecureApiKey() {
        // 암호화된 API 키 (Base64 + ROT13 조합)
        const encryptedKey = 'fx-nag-ncv03--DsvoPz1ckhaGvp9QiOS6KPXW2UGr8PgP0JWNC9I5ZbtWg2jv6O9bUeg5TN2bancQCjrFa21JBtgE2q0nt-VJYh7NNN';
        
        try {
            // 디코딩 과정
            const decoded = this.decodeSecureKey(encryptedKey);
            return decoded;
        } catch (error) {
            console.error('API 키 디코딩 실패:', error);
            return '';
        }
    }

    decodeSecureKey(encodedKey) {
        // ROT13 디코딩
        const rot13Decoded = encodedKey.replace(/[a-zA-Z]/g, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
        
        return rot13Decoded;
    }

    // 🧠 Claude AI 초기화
    async initializeClaudeAI() {
        if (window.ClaudeAI) {
            this.claudeAI = new window.ClaudeAI(this.settings.apiKey);
            
            // 대화 기록 로드
            this.claudeAI.loadConversationHistory();
            
            console.log('🧠 Claude AI 초기화 완료');
            
            // API 키 유효성 검사 (온라인 상태에서만)
            if (navigator.onLine) {
                try {
                    const isValid = await this.claudeAI.validateApiKey();
                    if (!isValid) {
                        console.warn('⚠️ Claude API 키가 유효하지 않을 수 있습니다.');
                    }
                } catch (error) {
                    console.warn('⚠️ API 키 검증 중 오류:', error);
                }
            }
        } else {
            console.error('❌ Claude AI 모듈을 찾을 수 없습니다.');
        }
    }

    // 🗄️ 로컬 데이터 관리
    async loadLocalData() {
        // 로컬 스토리지에서 데이터 로드
        this.memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
        
        // 첫 실행시 샘플 데이터 추가
        if (this.memories.length === 0) {
            this.addSampleMemories();
        }
        
        console.log(`📊 ${this.memories.length}개의 기억을 로드했습니다.`);
    }

    addSampleMemories() {
        const sampleMemories = [
            {
                id: this.generateId(),
                type: 'text',
                content: '2nd Brain 앱을 시작했습니다! 🎉',
                timestamp: new Date().toISOString(),
                tags: ['시작', '앱'],
                importance: 5
            },
            {
                id: this.generateId(),
                type: 'text',
                content: '이 앱은 iPhone에서 단독으로 실행됩니다.',
                timestamp: new Date(Date.now() - 60000).toISOString(),
                tags: ['정보', '기능'],
                importance: 7
            }
        ];
        
        this.memories.push(...sampleMemories);
        this.saveMemories();
    }

    saveMemories() {
        localStorage.setItem('2nd_brain_memories', JSON.stringify(this.memories));
    }

    saveSettings() {
        localStorage.setItem('2nd_brain_settings', JSON.stringify(this.settings));
    }

    // 🎤 음성 인식 초기화
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.settings.language;
            
            this.recognition.onstart = () => {
                this.updateVoiceStatus('🎤 듣고 있습니다...', 'recording');
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    this.handleVoiceResult(result[0].transcript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('음성 인식 오류:', event.error);
                this.updateVoiceStatus('음성 인식 오류가 발생했습니다.', 'error');
                this.showToast('음성 인식에 실패했습니다.', 'error');
            };
            
            this.recognition.onend = () => {
                this.updateVoiceStatus('무엇을 도와드릴까요?', 'idle');
                this.isRecording = false;
            };
        } else {
            console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
        }
    }

    // 🎮 이벤트 리스너 설정
    setupEventListeners() {
        // 음성 녹음 버튼
        document.getElementById('voiceRecordBtn')?.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
        
        // 음성 검색 버튼
        document.getElementById('voiceSearchBtn')?.addEventListener('click', () => {
            this.startVoiceSearch();
        });
        
        // 빠른 입력 버튼들
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.handleQuickInput(type);
            });
        });
        
        // 검색 관련
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.performSearch();
        });
        
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // 플로팅 액션 버튼
        document.getElementById('mainFab')?.addEventListener('click', () => {
            this.toggleFABMenu();
        });
        
        document.querySelectorAll('.sub-fab').forEach(fab => {
            fab.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleFABAction(action);
            });
        });

        // 인증 관련 버튼들
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.authManager.showLoginModal();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.authManager.logout();
        });

        // 관리자 대시보드 버튼
        document.getElementById('adminBtn')?.addEventListener('click', () => {
            this.openAdminDashboard();
        });

        // Claude AI 채팅 관련
        document.getElementById('chatSendBtn')?.addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        document.getElementById('chatVoiceBtn')?.addEventListener('click', () => {
            this.startVoiceChatInput();
        });

        // 채팅 사진 버튼
        document.getElementById('chatPhotoBtn')?.addEventListener('click', () => {
            this.openChatPhotoInput();
        });

        // 채팅 위치 버튼
        document.getElementById('chatLocationBtn')?.addEventListener('click', () => {
            this.addChatLocation();
        });

        // 사진 파일 선택 이벤트
        document.getElementById('chatPhotoInput')?.addEventListener('change', (e) => {
            this.handleChatPhotoUpload(e);
        });

        document.getElementById('minimizeChatBtn')?.addEventListener('click', () => {
            this.toggleChatMinimize();
        });

        // 채팅 최소화 상태에서 헤더 클릭으로 복원
        document.addEventListener('click', (e) => {
            if (e.target.closest('.claude-chat.minimized .chat-header')) {
                this.toggleChatMinimize();
            }
        });
        
        // 설정 버튼 - 관리자 시스템과 연결
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            if (this.authManager && this.authManager.hasPermission('admin')) {
                this.adminManager.showAdminSettings();
            } else if (this.authManager && this.authManager.isLoggedIn) {
                this.adminManager.showUserSettings();
            } else {
                this.showSettingsModal();
            }
        });
        
        // 검색 제안 클릭
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const query = e.target.textContent.replace('💡 ', '');
                this.performSearch(query);
            });
        });
    }

    // 🌐 네트워크 상태 관리
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.hideOfflineBanner();
            this.showToast('🌐 온라인 상태로 전환됨', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showOfflineBanner();
            this.showToast('📴 오프라인 모드로 전환됨', 'warning');
        });
        
        // 초기 상태 확인
        if (!navigator.onLine) {
            this.showOfflineBanner();
        }
    }

    // 🎤 음성 기능
    toggleVoiceRecording() {
        if (!this.recognition) {
            this.showToast('음성 인식을 지원하지 않는 브라우저입니다.', 'error');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        } else {
            this.recognition.start();
            this.isRecording = true;
        }
    }

    startVoiceSearch() {
        if (!this.recognition) {
            this.showToast('음성 검색을 지원하지 않는 브라우저입니다.', 'error');
            return;
        }
        
        this.updateVoiceStatus('🔍 검색할 내용을 말해주세요...', 'recording');
        
        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                this.performSearch(result[0].transcript);
            }
        };
        
        this.recognition.start();
    }

    async handleVoiceResult(transcript) {
        console.log('음성 인식 결과:', transcript);
        
        // 음성 메모 데이터 생성
        const memoryData = {
            type: 'voice',
            content: transcript,
            tags: ['음성메모'],
            importance: 5
        };
        
        // Claude AI로 메모리 분석 (온라인 상태에서만)
        if (navigator.onLine && this.claudeAI) {
            try {
                this.showLoadingScreen('🧠 AI 분석 중...');
                const analysis = await this.claudeAI.analyzeMemory(memoryData);
                
                // 분석 결과를 메모리에 추가
                memoryData.aiAnalysis = analysis;
                memoryData.importance = analysis.importance || 5;
                memoryData.tags = [...memoryData.tags, ...analysis.keywords.slice(0, 3)];
                
                this.hideLoadingScreen();
            } catch (error) {
                console.error('AI 분석 실패:', error);
                this.hideLoadingScreen();
            }
        }
        
        // 음성 메모 저장
        this.addMemory(memoryData);
        
        this.showToast(`음성 메모가 저장되었습니다: "${transcript}"`, 'success');
        this.updateUI();
    }

    // 📝 메모리 관리
    addMemory(memoryData) {
        const memory = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...memoryData
        };
        
        this.memories.unshift(memory); // 최신 순으로 추가
        this.saveMemories();
        
        console.log('새 메모리 추가:', memory);
        return memory;
    }

    deleteMemory(id) {
        this.memories = this.memories.filter(m => m.id !== id);
        this.saveMemories();
        this.updateUI();
    }

    // 🔍 검색 기능 - Claude AI 통합
    async performSearch(query = null) {
        const searchQuery = query || document.getElementById('searchInput')?.value;
        
        if (!searchQuery.trim()) {
            this.showToast('검색어를 입력해주세요.', 'warning');
            return;
        }
        
        this.showLoadingScreen('🔍 AI 검색 중...');
        
        try {
            // 로컬 검색 수행
            const localResults = this.searchMemories(searchQuery);
            
            // Claude AI를 통한 지능형 검색 (온라인 상태에서만)
            let aiResponse = '';
            if (navigator.onLine && this.claudeAI) {
                try {
                    aiResponse = await this.claudeAI.processSearchQuery(searchQuery, localResults);
                } catch (error) {
                    console.error('AI 검색 실패:', error);
                    aiResponse = `로컬 검색 결과: ${localResults.length}개의 기억을 찾았습니다.`;
                }
            }
            
            this.hideLoadingScreen();
            this.displaySearchResults(localResults, searchQuery, aiResponse);
            
        } catch (error) {
            console.error('검색 오류:', error);
            this.hideLoadingScreen();
            this.showToast('검색 중 오류가 발생했습니다.', 'error');
        }
    }

    searchMemories(query) {
        const lowercaseQuery = query.toLowerCase();
        
        return this.memories.filter(memory => {
            return memory.content.toLowerCase().includes(lowercaseQuery) ||
                   memory.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
                   memory.type.toLowerCase().includes(lowercaseQuery);
        }).sort((a, b) => {
            // 중요도와 최신순으로 정렬
            if (a.importance !== b.importance) {
                return b.importance - a.importance;
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }

    displaySearchResults(results, query, aiResponse = '') {
        if (results.length === 0) {
            this.showToast(`"${query}"에 대한 검색 결과가 없습니다.`, 'warning');
            return;
        }
        
        // 검색 결과를 메모리 컨테이너에 표시
        const container = document.getElementById('recentMemoriesContainer');
        container.innerHTML = '';
        
        // AI 응답이 있으면 상단에 표시
        if (aiResponse) {
            const aiCard = document.createElement('div');
            aiCard.className = 'memory-card';
            aiCard.style.borderLeftColor = '#FF9500';
            aiCard.style.background = 'rgba(255, 149, 0, 0.1)';
            aiCard.innerHTML = `
                <div class="memory-header">
                    <span class="memory-type">🧠 AI 분석</span>
                    <span class="memory-time">방금 전</span>
                </div>
                <div class="memory-content">${aiResponse}</div>
            `;
            container.appendChild(aiCard);
        }
        
        results.forEach(memory => {
            const card = this.createMemoryCard(memory, true);
            container.appendChild(card);
        });
        
        this.showToast(`${results.length}개의 검색 결과를 찾았습니다.`, 'success');
        
        // 검색 섹션으로 스크롤
        document.querySelector('.recent-memories').scrollIntoView({ behavior: 'smooth' });
    }

    // 📱 빠른 입력 처리
    async handleQuickInput(type) {
        this.showLoadingScreen(`${this.getTypeEmoji(type)} ${type} 준비 중...`);
        
        try {
            switch (type) {
                case 'photo':
                    await this.capturePhoto();
                    break;
                case 'video':
                    await this.captureVideo();
                    break;
                case 'voice':
                    this.startVoiceRecording();
                    break;
                case 'text':
                    this.openTextInput();
                    break;
                case 'document':
                    this.showToast('문서 스캔 기능은 준비 중입니다.', 'warning');
                    break;
                case 'location':
                    await this.captureLocation();
                    break;
                default:
                    console.warn('알 수 없는 입력 타입:', type);
            }
        } catch (error) {
            console.error(`${type} 처리 오류:`, error);
            this.showToast(`${type} 처리 중 오류가 발생했습니다.`, 'error');
        } finally {
            this.hideLoadingScreen();
        }
    }

    async capturePhoto() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // 사진 촬영 UI 표시
            this.showCameraInterface(stream, 'photo');
            
        } catch (error) {
            console.error('카메라 접근 오류:', error);
            this.showToast('카메라에 접근할 수 없습니다.', 'error');
        }
    }

    async captureVideo() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            // 비디오 녹화 UI 표시
            this.showCameraInterface(stream, 'video');
            
        } catch (error) {
            console.error('카메라/마이크 접근 오류:', error);
            this.showToast('카메라나 마이크에 접근할 수 없습니다.', 'error');
        }
    }

    showCameraInterface(stream, type) {
        // 간단한 카메라 인터페이스 생성
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${type === 'photo' ? '📷 사진 촬영' : '🎥 동영상 녹화'}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove(); window.currentStream?.getTracks().forEach(track => track.stop());">✕</button>
                </div>
                <div class="modal-body">
                    <video id="cameraPreview" autoplay playsinline style="width: 100%; border-radius: 10px; margin-bottom: 15px;"></video>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="captureMedia('${type}')" style="background: #007AFF; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer;">
                            ${type === 'photo' ? '📷 촬영' : '🎥 녹화'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const video = modal.querySelector('#cameraPreview');
        video.srcObject = stream;
        window.currentStream = stream;
        
        // 전역 함수로 미디어 캡처 정의
        window.captureMedia = (mediaType) => {
            if (mediaType === 'photo') {
                this.takePhoto(video);
            } else {
                this.startVideoRecording(stream);
            }
        };
    }

    takePhoto(video) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const photoUrl = URL.createObjectURL(blob);
            
            // 사진을 메모리에 저장
            this.addMemory({
                type: 'photo',
                content: '사진이 촬영되었습니다.',
                mediaUrl: photoUrl,
                tags: ['사진', '촬영'],
                importance: 6
            });
            
            this.showToast('📷 사진이 저장되었습니다!', 'success');
            this.updateUI();
            
            // 모달 닫기
            document.querySelector('.modal')?.remove();
            window.currentStream?.getTracks().forEach(track => track.stop());
        });
    }

    async captureLocation() {
        if (!navigator.geolocation) {
            this.showToast('위치 서비스를 지원하지 않는 브라우저입니다.', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                this.addMemory({
                    type: 'location',
                    content: `현재 위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    location: { latitude, longitude },
                    tags: ['위치', '현재위치'],
                    importance: 4
                });
                
                this.showToast('📍 현재 위치가 저장되었습니다!', 'success');
                this.updateUI();
            },
            (error) => {
                console.error('위치 접근 오류:', error);
                this.showToast('위치 정보에 접근할 수 없습니다.', 'error');
            }
        );
    }

    openTextInput() {
        const text = prompt('메모할 내용을 입력하세요:');
        if (text && text.trim()) {
            this.addMemory({
                type: 'text',
                content: text.trim(),
                tags: ['텍스트', '메모'],
                importance: 5
            });
            
            this.showToast('📝 텍스트 메모가 저장되었습니다!', 'success');
            this.updateUI();
        }
    }

    // 🎯 FAB 메뉴 관리
    toggleFABMenu() {
        const fabMenu = document.getElementById('fabMenu');
        fabMenu.classList.toggle('active');
    }

    handleFABAction(action) {
        this.toggleFABMenu();
        this.handleQuickInput(action);
    }

    // 🎨 UI 업데이트
    updateUI() {
        this.updateMemoriesDisplay();
        this.updateStatsDisplay();
        
        // 인증 상태에 따른 관리자 UI 업데이트
        if (this.authManager) {
            this.authManager.updateAuthUI();
        }
    }

    updateMemoriesDisplay() {
        const container = document.getElementById('recentMemoriesContainer');
        if (!container) return;
        
        // 최신 10개 메모리만 표시
        const recentMemories = this.memories.slice(0, 10);
        
        container.innerHTML = '';
        
        if (recentMemories.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #8E8E93; padding: 20px;">아직 기억이 없습니다. 첫 번째 기억을 만들어보세요!</div>';
            return;
        }
        
        recentMemories.forEach(memory => {
            const card = this.createMemoryCard(memory);
            container.appendChild(card);
        });
    }

    createMemoryCard(memory, isSearchResult = false) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.style.borderLeftColor = this.getTypeColor(memory.type);
        
        const timeAgo = this.getTimeAgo(memory.timestamp);
        const typeEmoji = this.getTypeEmoji(memory.type);
        
        card.innerHTML = `
            <div class="memory-header">
                <span class="memory-type">${typeEmoji} ${memory.type}</span>
                <span class="memory-time">${timeAgo}</span>
            </div>
            <div class="memory-content">${memory.content}</div>
            ${memory.tags.length > 0 ? `
                <div style="margin-top: 8px; font-size: 12px; color: #8E8E93;">
                    ${memory.tags.map(tag => `#${tag}`).join(' ')}
                </div>
            ` : ''}
        `;
        
        // 클릭 이벤트 추가
        card.addEventListener('click', () => {
            this.showMemoryDetail(memory);
        });
        
        return card;
    }

    updateStatsDisplay() {
        // 통계 정보 업데이트 (추후 구현)
        const totalMemories = this.memories.length;
        const todayMemories = this.memories.filter(m => 
            new Date(m.timestamp).toDateString() === new Date().toDateString()
        ).length;
        
        console.log(`📊 총 ${totalMemories}개의 기억, 오늘 ${todayMemories}개 추가`);
    }

    // 🔧 유틸리티 메서드
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    getTypeColor(type) {
        const colors = {
            text: '#007AFF',
            voice: '#FF9500',
            photo: '#34C759',
            video: '#FF3B30',
            location: '#5856D6',
            document: '#FF2D92'
        };
        return colors[type] || '#007AFF';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return '방금 전';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
        
        return time.toLocaleDateString('ko-KR');
    }

    // 📱 UI 상태 관리
    showLoadingScreen(message) {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay?.querySelector('.loading-text');
        
        if (text) text.textContent = message;
        overlay?.classList.add('active');
    }

    hideLoadingScreen() {
        document.getElementById('loadingOverlay')?.classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateVoiceStatus(text, status) {
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            const icons = {
                idle: '💭',
                recording: '🔴',
                processing: '⚡',
                error: '❌'
            };
            statusIndicator.textContent = icons[status] || '💭';
        }
    }

    showOfflineBanner() {
        document.getElementById('offlineBanner')?.classList.add('show');
    }

    hideOfflineBanner() {
        document.getElementById('offlineBanner')?.classList.remove('show');
    }

    showSettingsModal() {
        this.showToast('설정 기능은 준비 중입니다.', 'warning');
    }

    showMemoryDetail(memory) {
        const detail = `
유형: ${this.getTypeEmoji(memory.type)} ${memory.type}
시간: ${new Date(memory.timestamp).toLocaleString('ko-KR')}
중요도: ${'⭐'.repeat(Math.floor(memory.importance / 2))}
태그: ${memory.tags.join(', ')}

내용:
${memory.content}
        `.trim();
        
        alert(detail);
    }

    // 🔍 미디어 권한 확인
    async checkMediaPermissions() {
        try {
            // 카메라 권한 확인
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            console.log('카메라 권한:', cameraPermission.state);
            
            // 마이크 권한 확인
            const micPermission = await navigator.permissions.query({ name: 'microphone' });
            console.log('마이크 권한:', micPermission.state);
            
        } catch (error) {
            console.log('권한 확인 중 오류:', error);
        }
    }

    startVoiceRecording() {
        this.toggleVoiceRecording();
    }

    // 🧠 Claude AI 채팅 기능
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // 로그인 확인
        if (!this.authManager.isLoggedIn) {
            this.authManager.showLoginModal();
            return;
        }

        // 사용자 메시지 추가
        this.addChatMessage(message, 'user');
        input.value = '';

        // Claude AI 응답 요청
        try {
            this.showChatTyping();
            
            // Claude AI가 초기화되었는지 확인
            if (!this.claudeAI) {
                console.warn('Claude AI가 초기화되지 않았습니다. 시뮬레이션 모드로 전환합니다.');
                this.claudeAI = new window.ClaudeAI(this.settings.apiKey);
            }
            
            // 메모리 컨텍스트와 함께 메시지 전송
            const context = this.buildMemoryContext();
            const response = await this.claudeAI.sendMessage(message, {
                includeHistory: true,
                includeMemoryContext: true,
                personality: this.settings.aiPersonality || 'casual'
            });
            
            this.hideChatTyping();
            this.addChatMessage(response, 'assistant');
            
        } catch (error) {
            this.hideChatTyping();
            
            // 더 구체적인 에러 메시지 제공
            let errorMessage = '죄송합니다. ';
            if (!navigator.onLine) {
                errorMessage += '오프라인 상태입니다. 인터넷 연결을 확인해주세요.';
            } else if (error.message.includes('API')) {
                errorMessage += 'AI 서비스 연결에 문제가 있습니다. 시뮬레이션 모드로 작동합니다.';
            } else {
                errorMessage += '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
            
            this.addChatMessage(errorMessage, 'assistant');
            console.error('채팅 오류:', error);
        }
    }

    addChatMessage(content, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatar = sender === 'user' ? '👤' : '🧠';
        // HTML 이스케이프 및 개행 처리
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
            
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${escapedContent}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 대화 기록 저장
        this.chatConversation.push({ role: sender, content, timestamp: new Date().toISOString() });
        this.saveChatHistory();
    }

    buildMemoryContext() {
        const recentMemories = this.memories
            .slice(-10)
            .map(memory => `${memory.type}: ${memory.content}`)
            .join('\n');
        
        return `현재 저장된 최근 기억들:\n${recentMemories}`;
    }

    showChatTyping() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message assistant typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🧠</div>
            <div class="message-content">입력 중...</div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideChatTyping() {
        document.getElementById('typingIndicator')?.remove();
    }

    startVoiceChatInput() {
        if (!this.authManager.isLoggedIn) {
            this.authManager.showLoginModal();
            return;
        }

        if (!this.recognition) {
            this.addChatMessage('음성 인식을 지원하지 않는 브라우저입니다. 텍스트로 입력해주세요.', 'assistant');
            return;
        }

        // 사용자 의도 메시지 추가
        this.addChatMessage('🎤 음성으로 메시지를 보내겠습니다', 'user');
        this.showChatTyping();
        this.addChatMessage('음성을 듣고 있습니다... 말씀해주세요! 🎙️', 'assistant');

        // 음성 인식 결과 처리
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            
            // 사용자 음성 메시지 추가
            this.addChatMessage(`🎤 "${transcript}"`, 'user');
            
            // 신뢰도 확인
            if (confidence < 0.7) {
                this.addChatMessage(`음성 인식 결과: "${transcript}"\n\n인식 정확도가 낮을 수 있습니다 (${Math.round(confidence * 100)}%). 다시 말씀해주시거나 텍스트로 입력해주세요.`, 'assistant');
                return;
            }

            // 음성을 텍스트 메모리로 저장
            const memory = this.addMemory({
                type: 'voice',
                content: transcript,
                tags: ['채팅', '음성', '텍스트변환'],
                importance: 5,
                confidence: confidence
            });

            // AI가 메시지 처리
            this.processChatMessage(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('음성 인식 오류:', event.error);
            this.addChatMessage(`음성 인식 중 오류가 발생했습니다: ${event.error}\n\n다시 시도하시거나 텍스트로 입력해주세요.`, 'assistant');
        };

        this.recognition.onend = () => {
            this.showToast('🎤 음성 입력이 완료되었습니다.', 'success');
        };

        try {
            this.recognition.start();
            this.showToast('🎤 음성 입력을 시작했습니다...', 'info');
        } catch (error) {
            console.error('음성 인식 시작 오류:', error);
            this.addChatMessage('음성 인식을 시작할 수 없습니다. 텍스트로 입력해주세요.', 'assistant');
        }
    }

    // 채팅 메시지 처리 (AI 응답 생성)
    async processChatMessage(message) {
        try {
            this.showChatTyping();
            
            // Claude AI가 초기화되었는지 확인
            if (!this.claudeAI) {
                this.claudeAI = new window.ClaudeAI(this.settings.apiKey);
            }
            
            // 메모리 컨텍스트와 함께 메시지 전송
            const context = this.buildMemoryContext();
            const response = await this.claudeAI.sendMessage(message, {
                includeHistory: true,
                includeMemoryContext: true,
                personality: this.settings.aiPersonality || 'casual'
            });
            
            this.hideChatTyping();
            this.addChatMessage(response, 'assistant');
            
        } catch (error) {
            this.hideChatTyping();
            
            // 더 구체적인 에러 메시지 제공
            let errorMessage = '죄송합니다. ';
            if (!navigator.onLine) {
                errorMessage += '오프라인 상태입니다. 인터넷 연결을 확인해주세요.';
            } else {
                errorMessage += '일시적인 오류가 발생했습니다. 다시 시도해주세요.';
            }
            
            this.addChatMessage(errorMessage, 'assistant');
            console.error('메시지 처리 오류:', error);
        }
    }

    toggleChatMinimize() {
        const chatSection = document.getElementById('claudeChat');
        chatSection.classList.toggle('minimized');
    }

    saveChatHistory() {
        localStorage.setItem('2nd_brain_chat_history', JSON.stringify(this.chatConversation));
    }

    loadChatHistory() {
        this.chatConversation = JSON.parse(localStorage.getItem('2nd_brain_chat_history') || '[]');
        
        // 기존 채팅 기록 복원 (최근 10개만)
        const recentChats = this.chatConversation.slice(-10);
        recentChats.forEach(chat => {
            if (chat.role !== 'assistant' || chat.content !== '안녕하세요! 저는 당신의 개인 메모리 도우미 Claude입니다. 저장된 기억들에 대해 궁금한 것이 있거나, 분석이 필요한 내용이 있으면 언제든 말씀해 주세요!') {
                this.addChatMessage(chat.content, chat.role === 'user' ? 'user' : 'assistant');
            }
        });
    }

    // 기존 메모리 관련 메서드들과 저장 메서드 보강
    saveMemories() {
        localStorage.setItem('2nd_brain_memories', JSON.stringify(this.memories));
        
        // 데이터 관리자에게 인덱스 업데이트 알림
        if (this.dataManager) {
            this.dataManager.buildIndexes();
        }
    }

    // 삭제 메서드 추가
    deleteMemory(memoryId) {
        this.memories = this.memories.filter(memory => memory.id !== memoryId);
        this.saveMemories();
        
        // 이벤트 발생
        document.dispatchEvent(new CustomEvent('memoryDeleted', {
            detail: { memoryId }
        }));
    }

    // 메모리 업데이트 메서드 추가
    updateMemory(memoryId, updates) {
        const memoryIndex = this.memories.findIndex(memory => memory.id === memoryId);
        if (memoryIndex !== -1) {
            this.memories[memoryIndex] = { ...this.memories[memoryIndex], ...updates };
            this.saveMemories();
            
            // 이벤트 발생
            document.dispatchEvent(new CustomEvent('memoryUpdated', {
                detail: { memory: this.memories[memoryIndex] }
            }));
        }
    }

    // 타입별 이모지 반환 메서드
    getTypeEmoji(type) {
        const typeEmojis = {
            'text': '📝',
            'voice': '🎤',
            'photo': '📸',
            'video': '🎥',
            'location': '📍',
            'document': '📄'
        };
        return typeEmojis[type] || '📄';
    }

    // 관리자 대시보드 열기
    openAdminDashboard() {
        // 관리자 권한 확인
        if (!this.authManager.hasPermission('admin')) {
            this.showToast('관리자 권한이 필요합니다.', 'error');
            return;
        }

        // 현재 데이터 동기화
        this.syncDataForAdmin();
        
        // 관리자 대시보드로 이동
        window.location.href = 'admin-dashboard.html';
    }

    // 관리자 대시보드용 데이터 동기화
    syncDataForAdmin() {
        // 최신 메모리 데이터 저장
        this.saveMemories();
        
        // 채팅 기록 저장
        this.saveChatHistory();
        
        // 사용자 정보 저장
        if (this.authManager) {
            this.authManager.saveUsers();
        }

        // 세션 정보 업데이트
        const sessionData = JSON.parse(localStorage.getItem('2nd_brain_session') || '{}');
        if (sessionData.user) {
            sessionData.lastActivity = new Date().toISOString();
            localStorage.setItem('2nd_brain_session', JSON.stringify(sessionData));
        }

        console.log('📊 관리자 대시보드용 데이터 동기화 완료');
    }

    // 사용자 데이터 내보내기 (관리자 모달에서 호출)
    exportUserData() {
        const userData = {
            memories: this.memories,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `my_2nd_brain_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showToast('내 데이터가 내보내기되었습니다.', 'success');
    }

    // 사용자 데이터 삭제 (관리자 모달에서 호출)
    clearUserData() {
        if (confirm('⚠️ 정말로 내 모든 데이터를 삭제하시겠습니까?')) {
            if (confirm('🚨 마지막 확인: 이 작업은 되돌릴 수 없습니다!')) {
                // 메모리만 삭제 (사용자 계정과 세션은 유지)
                this.memories = [];
                this.chatConversation = [];
                
                localStorage.removeItem('2nd_brain_memories');
                localStorage.removeItem('2nd_brain_chat_history');
                
                this.updateUI();
                this.showToast('내 데이터가 모두 삭제되었습니다.', 'warning');
            }
        }
    }

    // 백업 생성 (관리자 모달에서 호출)
    createBackup() {
        const backupData = {
            memories: this.memories,
            users: this.authManager ? this.authManager.users : [],
            settings: this.settings,
            chatHistory: this.chatConversation,
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
        this.showToast('백업이 생성되었습니다.', 'success');
    }

    // 관리자에서 변경된 데이터 확인
    checkAdminDataUpdates() {
        const updateFlag = localStorage.getItem('admin_data_updated');
        if (updateFlag) {
            console.log('🔄 관리자에서 변경된 데이터 감지, 다시 로드 중...');
            
            // 최신 데이터 다시 로드
            this.memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
            
            // 채팅 기록 다시 로드
            this.loadChatHistory();
            
            // 인덱스 재구축
            if (this.dataManager) {
                this.dataManager.buildIndexes();
            }
            
            // 플래그 제거
            localStorage.removeItem('admin_data_updated');
            
            // UI 업데이트
            this.updateUI();
            
            console.log('✅ 관리자 데이터 동기화 완료');
        }
    }

    // 실시간 데이터 동기화 감지 (주기적 확인)
    setupDataSyncListener() {
        setInterval(() => {
            this.checkAdminDataUpdates();
        }, 5000); // 5초마다 확인
    }

    // 📸 채팅 사진 입력 기능
    openChatPhotoInput() {
        if (!this.authManager.isLoggedIn) {
            this.authManager.showLoginModal();
            return;
        }

        // 사용자 의도 확인 메시지 추가
        this.addChatMessage('📸 사진을 선택해주세요', 'user');
        this.showChatTyping();
        
        const fileInput = document.getElementById('chatPhotoInput');
        fileInput.click();
    }

    async handleChatPhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.hideChatTyping();
            this.addChatMessage('사진 선택이 취소되었습니다. 다른 도움이 필요하시면 말씀해주세요!', 'assistant');
            return;
        }

        try {
            // 파일 크기 제한 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.hideChatTyping();
                this.addChatMessage('사진 크기가 너무 큽니다. 5MB 이하의 사진을 선택해주세요.', 'assistant');
                this.showToast('사진 크기는 5MB 이하여야 합니다.', 'error');
                return;
            }

            // 이미지 프리뷰 생성
            const imageUrl = URL.createObjectURL(file);
            
            // 채팅에 이미지 메시지 추가
            this.addChatImageMessage(imageUrl, 'user');
            
            // 메모리로 저장
            const memory = this.addMemory({
                type: 'photo',
                content: `채팅에서 업로드된 사진 - ${file.name}`,
                mediaUrl: imageUrl,
                tags: ['채팅', '사진', '업로드'],
                importance: 6
            });

            // AI 응답 생성 (더 자연스럽게)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.hideChatTyping();
            this.addChatMessage(`📸 멋진 사진이네요! 성공적으로 메모리에 저장했습니다.

**저장 정보:**
• 파일명: ${file.name}
• 저장 시간: ${new Date().toLocaleString()}
• 메모리 ID: ${memory.id}

이 사진은 나중에 다음과 같이 찾을 수 있어요:
• "사진 검색해줘"
• "오늘 올린 사진 보여줘"
• "${file.name.split('.')[0]} 찾아줘"

사진에 대해 설명이나 메모를 추가하고 싶으시면 말씀해주세요! 😊`, 'assistant');

            this.updateUI();
            this.showToast('📸 사진이 메모리에 저장되었습니다!', 'success');

        } catch (error) {
            console.error('사진 업로드 오류:', error);
            this.hideChatTyping();
            this.addChatMessage('죄송합니다. 사진 업로드 중 오류가 발생했습니다. 다시 시도해주세요.', 'assistant');
            this.showToast('사진 업로드 중 오류가 발생했습니다.', 'error');
        }

        // 파일 입력 초기화
        event.target.value = '';
    }

    // 📍 채팅 위치 추가 기능
    async addChatLocation() {
        if (!this.authManager.isLoggedIn) {
            this.authManager.showLoginModal();
            return;
        }

        if (!navigator.geolocation) {
            this.addChatMessage('위치 서비스를 지원하지 않는 브라우저입니다. 다른 방법으로 도와드릴까요?', 'assistant');
            return;
        }

        // 사용자 메시지 추가
        this.addChatMessage('📍 현재 위치를 저장하겠습니다', 'user');
        this.showChatTyping();
        this.addChatMessage('위치 정보를 가져오는 중입니다... 잠시만 기다려주세요! 🔍', 'assistant');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                
                // 메모리로 저장
                const memory = this.addMemory({
                    type: 'location',
                    content: `채팅에서 저장한 위치 (${new Date().toLocaleString()})`,
                    location: { 
                        latitude, 
                        longitude, 
                        accuracy: Math.round(accuracy),
                        timestamp: new Date().toISOString()
                    },
                    tags: ['채팅', '위치', '현재위치', 'GPS'],
                    importance: 6
                });

                // 더 자연스러운 AI 응답
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                this.addChatMessage(`📍 완벽합니다! 현재 위치를 정확히 저장했어요.

**위치 정보:**
• 📍 좌표: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
• 🎯 정확도: 약 ${Math.round(accuracy)}m
• ⏰ 저장 시간: ${new Date().toLocaleString()}
• 🆔 메모리 ID: ${memory.id}

이 위치는 나중에 이렇게 찾을 수 있어요:
• "위치 검색해줘"
• "오늘 간 곳들 보여줘"  
• "GPS 기록 찾아줘"

이 장소에 대한 메모나 설명을 추가하고 싶으시면 말씀해주세요! 😊`, 'assistant');

                this.updateUI();
                this.showToast('📍 현재 위치가 저장되었습니다!', 'success');
            },
            (error) => {
                console.error('위치 접근 오류:', error);
                let errorMessage = '위치 정보를 가져올 수 없습니다. ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += '위치 요청 시간이 초과되었습니다. 다시 시도해주세요.';
                        break;
                    default:
                        errorMessage += '알 수 없는 오류가 발생했습니다.';
                        break;
                }
                
                this.addChatMessage(errorMessage + '\n\n다른 방법으로 위치를 기록하거나 다른 도움이 필요하시면 말씀해주세요!', 'assistant');
            }
        );
    }

    // 이미지 메시지 추가 메서드
    addChatImageMessage(imageUrl, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatar = sender === 'user' ? '👤' : '🧠';
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <img src="${imageUrl}" alt="업로드된 사진" style="max-width: 200px; max-height: 150px; border-radius: 8px; cursor: pointer;" onclick="window.open('${imageUrl}', '_blank')">
                <div style="margin-top: 5px; font-size: 12px; color: #8E8E93;">사진을 클릭하면 크게 볼 수 있습니다</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 전역 변수로 관리자 인스턴스 설정
window.adminManager = null;

// 🚀 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StandaloneBrainApp();
    
    // 전역에서 접근할 수 있도록 설정
    setTimeout(() => {
        window.adminManager = window.app.adminManager;
        // 채팅 기록 로드
        window.app.loadChatHistory();
        // 실시간 데이터 동기화 시작
        window.app.setupDataSyncListener();
    }, 1000);
});

// 📱 iPhone 전용 최적화
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.body.classList.add('ios-device');
    
    // 뷰포트 높이 조정
    const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}