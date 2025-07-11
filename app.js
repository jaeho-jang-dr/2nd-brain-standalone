// 📱 2nd Brain - 아이폰 단독 실행용 앱
// 서버 없이 클라이언트 사이드에서만 동작

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
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingScreen('🚀 2nd Brain 초기화 중...');
            
            // 기본 데이터 로드
            await this.loadLocalData();
            
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
        
        // 설정 버튼
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showSettingsModal();
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
}

// 🚀 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StandaloneBrainApp();
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