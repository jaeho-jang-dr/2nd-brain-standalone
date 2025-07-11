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
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
        };

        // CORS 문제 해결을 위한 프록시 사용 (필요시)
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                throw new Error('Claude API 키가 유효하지 않습니다.');
            } else if (response.status === 429) {
                throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                throw new Error(`Claude API 오류: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
        }

        const data = await response.json();
        return data.content[0].text;
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