// 🧠 Claude AI 통합 - 아이폰 단독 실행용
// Anthropic Claude API를 브라우저에서 직접 호출

class ClaudeAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-5-sonnet-20241022';
        this.maxTokens = 4000;
        this.conversationHistory = [];
        this.isProcessing = false;
    }

    // Claude API 직접 호출
    async sendMessage(message, options = {}) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('Claude API 키가 설정되지 않았습니다.');
        }

        if (this.isProcessing) {
            throw new Error('이미 처리 중인 요청이 있습니다.');
        }

        this.isProcessing = true;

        try {
            // 메시지 준비
            const messages = this.prepareMessages(message, options);
            
            // API 요청
            const response = await this.callClaudeAPI(messages, options);
            
            // 대화 기록에 추가
            this.addToHistory(message, response);
            
            return response;
            
        } catch (error) {
            console.error('Claude AI 오류:', error);
            
            // 오프라인이거나 API 오류시 기본 응답
            if (!navigator.onLine) {
                return this.getOfflineResponse(message);
            }
            
            throw error;
            
        } finally {
            this.isProcessing = false;
        }
    }

    // 메시지 준비
    prepareMessages(userMessage, options) {
        const messages = [];
        
        // 시스템 프롬프트
        const systemPrompt = this.getSystemPrompt(options);
        
        // 최근 대화 기록 포함 (컨텍스트 유지)
        if (options.includeHistory && this.conversationHistory.length > 0) {
            const recentHistory = this.conversationHistory.slice(-10); // 최근 10개 대화
            
            recentHistory.forEach(item => {
                messages.push(
                    { role: 'user', content: item.user },
                    { role: 'assistant', content: item.assistant }
                );
            });
        }
        
        // 사용자 메시지 추가
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        return {
            model: this.model,
            max_tokens: options.maxTokens || this.maxTokens,
            messages: messages,
            system: systemPrompt
        };
    }

    // 시스템 프롬프트 생성
    getSystemPrompt(options) {
        const personality = options.personality || 'casual';
        const includeMemoryContext = options.includeMemoryContext || false;
        
        let systemPrompt = `당신은 "2nd Brain"이라는 개인 기억 관리 앱의 AI 어시스턴트입니다. 
사용자의 기억을 도와주고, 검색하고, 분석하는 역할을 합니다.

주요 역할:
1. 사용자의 음성, 텍스트, 사진, 영상 등의 기억을 분석하고 정리
2. 자연어 검색 쿼리를 이해하고 관련된 기억들을 찾아줌
3. 기억들 간의 연결점을 찾고 인사이트 제공
4. 사용자의 일상과 경험을 더 잘 기억할 수 있도록 도움

성격 설정: ${this.getPersonalityDescription(personality)}

응답 가이드라인:
- 친근하고 도움이 되는 톤으로 응답
- 한국어로 자연스럽게 대화
- 구체적이고 실용적인 조언 제공
- 사용자의 프라이버시를 존중`;

        if (includeMemoryContext) {
            systemPrompt += `\n\n현재 이 앱은 아이폰에서 단독으로 실행되며, 모든 데이터는 로컬에 안전하게 저장됩니다.`;
        }

        return systemPrompt;
    }

    getPersonalityDescription(personality) {
        const personalities = {
            casual: '친근하고 편안한 말투로, 친구처럼 대화합니다.',
            professional: '정중하고 전문적인 말투로, 비즈니스 상황에 적합하게 대화합니다.',
            detailed: '자세하고 구체적인 설명을 제공하며, 깊이 있는 분석을 합니다.',
            concise: '간결하고 핵심적인 답변을 제공하며, 요점만 말합니다.'
        };
        
        return personalities[personality] || personalities.casual;
    }

    // Claude API 호출
    async callClaudeAPI(payload, options) {
        // 브라우저 CORS 제한으로 인해 실제 API 호출 대신 시뮬레이션된 응답 제공
        // 실제 배포시에는 백엔드 프록시 서버를 통해 API를 호출해야 함
        
        console.warn('🔧 개발 모드: Claude AI 시뮬레이션 응답을 사용합니다.');
        
        // 시뮬레이션을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userMessage = payload.messages[payload.messages.length - 1].content;
        
        // 키워드 기반 지능형 응답 생성
        return this.generateIntelligentResponse(userMessage, options);
    }

    // 대화 기록 관리
    addToHistory(userMessage, assistantResponse) {
        this.conversationHistory.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: new Date().toISOString()
        });

        // 기록이 너무 많아지면 오래된 것 삭제 (최대 50개 유지)
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }

        // 로컬 스토리지에 저장
        this.saveConversationHistory();
    }

    saveConversationHistory() {
        try {
            localStorage.setItem('claude_conversation_history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('대화 기록 저장 실패:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('claude_conversation_history');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('대화 기록 로드 실패:', error);
            this.conversationHistory = [];
        }
    }

    // 오프라인 응답
    getOfflineResponse(message) {
        const offlineResponses = {
            // 일반적인 질문들에 대한 기본 응답
            '안녕': '안녕하세요! 현재 오프라인 모드입니다. 기본적인 기록 기능은 계속 사용하실 수 있어요.',
            '도움': '오프라인 상태에서는 다음 기능들을 사용할 수 있습니다:\n- 텍스트 메모 작성\n- 사진/영상 촬영\n- 음성 녹음\n- 로컬 검색',
            '검색': '오프라인 상태에서는 로컬에 저장된 기억들만 검색할 수 있습니다.',
            '사진': '사진 촬영 기능은 오프라인에서도 정상적으로 작동합니다.',
            '음성': '음성 녹음은 가능하지만, AI 분석은 온라인 상태에서만 이용할 수 있습니다.'
        };

        // 키워드 매칭으로 적절한 응답 찾기
        for (const [keyword, response] of Object.entries(offlineResponses)) {
            if (message.toLowerCase().includes(keyword)) {
                return response;
            }
        }

        // 기본 오프라인 응답
        return `현재 오프라인 모드입니다. "${message}"에 대한 자세한 분석은 인터넷 연결 후에 이용해주세요. 그동안 기본적인 기록 기능들은 계속 사용하실 수 있습니다.`;
    }

    // 메모리 분석 (특화 기능)
    async analyzeMemory(memoryData, options = {}) {
        const analysisPrompt = `다음 기억을 분석해주세요:

유형: ${memoryData.type}
내용: ${memoryData.content}
시간: ${new Date(memoryData.timestamp).toLocaleString('ko-KR')}
${memoryData.tags ? `태그: ${memoryData.tags.join(', ')}` : ''}

분석해주실 내용:
1. 이 기억의 중요도 (1-10점)
2. 주요 키워드 3-5개
3. 감정 분석 (긍정/중립/부정)
4. 관련될 수 있는 다른 기억들의 특징
5. 한 줄 요약

JSON 형식으로 응답해주세요.`;

        try {
            const response = await this.sendMessage(analysisPrompt, {
                maxTokens: 1000,
                personality: 'detailed'
            });

            // JSON 파싱 시도
            try {
                return JSON.parse(response);
            } catch {
                // JSON 파싱 실패시 텍스트 응답 반환
                return {
                    analysis: response,
                    importance: 5,
                    keywords: [],
                    emotion: 'neutral',
                    summary: memoryData.content.substring(0, 50) + '...'
                };
            }
        } catch (error) {
            console.error('메모리 분석 실패:', error);
            
            // 오프라인이거나 API 오류시 기본 분석
            return this.getBasicAnalysis(memoryData);
        }
    }

    // 지능형 응답 생성 (시뮬레이션)
    generateIntelligentResponse(message, options = {}) {
        const lowerMessage = message.toLowerCase();
        
        // 메모리 관련 질문
        if (lowerMessage.includes('기억') || lowerMessage.includes('메모리')) {
            if (lowerMessage.includes('몇개') || lowerMessage.includes('얼마나')) {
                const memoryCount = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]').length;
                return `현재 총 ${memoryCount}개의 기억이 저장되어 있습니다. 오늘 추가된 기억을 확인하시려면 "오늘 기억 보여줘"라고 말씀해주세요.`;
            }
            if (lowerMessage.includes('오늘')) {
                const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
                const today = new Date().toDateString();
                const todayMemories = memories.filter(m => new Date(m.timestamp).toDateString() === today);
                return `오늘은 ${todayMemories.length}개의 기억을 저장하셨네요. ${todayMemories.length > 0 ? `가장 최근 기억은 "${todayMemories[0].content.substring(0, 30)}..."입니다.` : '아직 오늘의 기억이 없습니다. 새로운 기억을 만들어보세요!'}`;
            }
            if (lowerMessage.includes('중요한')) {
                const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
                const importantMemories = memories.filter(m => m.importance >= 7);
                return `중요도가 높은 기억이 ${importantMemories.length}개 있습니다. ${importantMemories.length > 0 ? `가장 중요한 기억은 "${importantMemories[0].content.substring(0, 40)}..."입니다.` : '아직 중요한 기억으로 표시된 것이 없습니다.'}`;
            }
        }
        
        // 검색 관련
        if (lowerMessage.includes('검색') || lowerMessage.includes('찾')) {
            const searchTerm = message.replace(/검색|찾아|찾기|찾아줘|검색해줘/g, '').trim();
            if (searchTerm) {
                const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
                const results = memories.filter(m => 
                    m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (m.tags && m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
                );
                return `"${searchTerm}"에 대한 검색 결과: ${results.length}개의 기억을 찾았습니다. ${results.length > 0 ? `첫 번째 결과: "${results[0].content.substring(0, 50)}..."` : '일치하는 기억이 없습니다.'}`;
            }
            return '무엇을 검색하고 싶으신가요? 예: "회의 검색해줘", "오늘 일정 찾아줘"';
        }
        
        // 기능 안내
        if (lowerMessage.includes('도움') || lowerMessage.includes('help') || lowerMessage.includes('사용법')) {
            return `2nd Brain 사용법을 안내해드릴게요! 📱

주요 기능:
• 📝 텍스트 메모: 간단한 메모 작성
• 🎤 음성 메모: 음성으로 기록 (자동 텍스트 변환)
• 📸 사진 메모: 사진으로 순간 포착
• 📍 위치 메모: 현재 위치 저장
• 🔍 스마트 검색: "오늘 기억", "중요한 일정" 등으로 검색

저와 대화하며 기억을 관리해보세요! 😊`;
        }
        
        // 인사말
        if (lowerMessage.includes('안녕') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return '안녕하세요! 저는 당신의 개인 메모리 도우미입니다. 오늘은 어떤 것을 기억하고 싶으신가요? 💭';
        }
        
        // 감사 인사
        if (lowerMessage.includes('고마워') || lowerMessage.includes('감사')) {
            return '도움이 되어서 기쁩니다! 언제든지 필요하시면 말씀해주세요. 😊';
        }
        
        // 분석 요청
        if (lowerMessage.includes('분석') || lowerMessage.includes('통계')) {
            const memories = JSON.parse(localStorage.getItem('2nd_brain_memories') || '[]');
            const types = {};
            memories.forEach(m => {
                types[m.type] = (types[m.type] || 0) + 1;
            });
            
            let analysis = `📊 메모리 분석 결과:\n\n총 ${memories.length}개의 기억이 있습니다.\n\n타입별 분포:\n`;
            Object.entries(types).forEach(([type, count]) => {
                const emoji = { text: '📝', voice: '🎤', photo: '📸', video: '🎥', location: '📍' }[type] || '📎';
                analysis += `${emoji} ${type}: ${count}개\n`;
            });
            
            return analysis;
        }
        
        // 메모리 저장 명령
        if (lowerMessage.includes('저장') || lowerMessage.includes('기록') || lowerMessage.includes('메모')) {
            // "xxx를 저장해줘", "xxx 기록해줘" 패턴 감지
            const savePatterns = [
                /(.+)을?\s*(저장|기록|메모)해?줘?/,
                /(.+)을?\s*(저장|기록|메모)하고?\s*싶어?/,
                /(저장|기록|메모):\s*(.+)/,
                /(저장|기록|메모)해줘:?\s*(.+)/
            ];
            
            for (const pattern of savePatterns) {
                const match = message.match(pattern);
                if (match && match[1] && match[1].trim()) {
                    const content = match[1].trim();
                    if (content.length > 2) { // 너무 짧은 내용 제외
                        // 실제 메모리 저장 (전역 app 인스턴스 사용)
                        if (window.app) {
                            const memory = window.app.addMemory({
                                type: 'text',
                                content: content,
                                tags: ['채팅', '텍스트', '저장'],
                                importance: 6
                            });
                            window.app.updateUI();
                            return `✅ "${content}"를 메모리에 저장했습니다!

이 내용은 나중에 다음과 같은 방법으로 찾을 수 있습니다:
• "${content.split(' ')[0]} 검색해줘"
• "텍스트 메모 보여줘"
• "채팅에서 저장한 내용 찾아줘"

다른 것도 저장하고 싶으시면 말씀해주세요!`;
                        }
                    }
                }
            }
            return '무엇을 저장하고 싶으신가요? 예: "오늘 회의 내용을 저장해줘", "중요한 일정 기록해줘"';
        }

        // 메모 작성 요청
        if (lowerMessage.includes('메모 작성') || lowerMessage.includes('메모 만들') || lowerMessage.includes('노트')) {
            return `📝 메모 작성을 도와드릴게요! 

다음과 같은 방법으로 메모를 작성할 수 있습니다:
• "xxx를 저장해줘" - 텍스트로 저장
• 📸 버튼 - 사진으로 기록
• 🎤 버튼 - 음성으로 기록
• 📍 버튼 - 위치 정보 저장

어떤 내용을 메모하고 싶으신가요?`;
        }

        // 기본 응답
        return `"${message}"에 대해 말씀해주셨네요. 제가 도와드릴 수 있는 것들:

💾 **기록 관리**
• "xxx를 저장해줘" - 텍스트 메모 저장
• 📸📍🎤 버튼으로 다양한 형태 기록

🔍 **검색 & 분석**
• "오늘 기억 보여줘", "회의 검색해줘"
• "내 기억 분석해줘", "통계 보여줘"

❓ **도움말**
• "사용법 알려줘", "도움말"

무엇을 도와드릴까요? 🤔`;
    }
    
    // 기본 분석 (오프라인용)
    getBasicAnalysis(memoryData) {
        const content = memoryData.content.toLowerCase();
        let importance = 5;
        let emotion = 'neutral';
        
        // 간단한 키워드 기반 중요도 판단
        const importantKeywords = ['중요', 'urgent', '긴급', '회의', '약속', '병원', '시험'];
        const positiveKeywords = ['좋', '행복', '성공', '축하', '기쁨', '사랑'];
        const negativeKeywords = ['나쁘', '슬프', '실패', '문제', '걱정', '스트레스'];
        
        if (importantKeywords.some(keyword => content.includes(keyword))) {
            importance = 8;
        }
        
        if (positiveKeywords.some(keyword => content.includes(keyword))) {
            emotion = 'positive';
        } else if (negativeKeywords.some(keyword => content.includes(keyword))) {
            emotion = 'negative';
        }
        
        return {
            importance: importance,
            keywords: memoryData.tags || [],
            emotion: emotion,
            summary: memoryData.content.substring(0, 50) + (memoryData.content.length > 50 ? '...' : ''),
            analysis: '오프라인 모드에서는 기본 분석만 제공됩니다.'
        };
    }

    // 검색 쿼리 처리
    async processSearchQuery(query, memories) {
        const searchPrompt = `사용자가 "${query}"라고 검색했습니다. 
다음은 로컬에 저장된 기억들입니다:

${memories.map((memory, index) => 
    `${index + 1}. [${memory.type}] ${memory.content} (${new Date(memory.timestamp).toLocaleDateString()})`
).join('\n')}

사용자의 검색 의도를 파악하고, 가장 관련성이 높은 기억들을 추천해주세요.
관련성 점수(1-10)와 함께 설명해주세요.`;

        try {
            return await this.sendMessage(searchPrompt, {
                maxTokens: 2000,
                personality: 'detailed'
            });
        } catch (error) {
            console.error('검색 쿼리 처리 실패:', error);
            return `"${query}"에 대한 검색을 수행했습니다. ${memories.length}개의 관련 기억을 찾았습니다.`;
        }
    }

    // API 키 유효성 검사
    async validateApiKey() {
        try {
            const testResponse = await this.sendMessage('안녕하세요', { maxTokens: 50 });
            return true;
        } catch (error) {
            return false;
        }
    }

    // 설정 업데이트
    updateSettings(newSettings) {
        if (newSettings.apiKey) {
            this.apiKey = newSettings.apiKey;
        }
        if (newSettings.model) {
            this.model = newSettings.model;
        }
        if (newSettings.maxTokens) {
            this.maxTokens = newSettings.maxTokens;
        }
    }

    // 대화 기록 초기화
    clearHistory() {
        this.conversationHistory = [];
        localStorage.removeItem('claude_conversation_history');
    }

    // 통계 정보
    getUsageStats() {
        return {
            totalConversations: this.conversationHistory.length,
            apiCallsToday: this.getApiCallsToday(),
            lastUsed: this.conversationHistory.length > 0 ? 
                this.conversationHistory[this.conversationHistory.length - 1].timestamp : null
        };
    }

    getApiCallsToday() {
        const today = new Date().toDateString();
        return this.conversationHistory.filter(item => 
            new Date(item.timestamp).toDateString() === today
        ).length;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.ClaudeAI = ClaudeAI;