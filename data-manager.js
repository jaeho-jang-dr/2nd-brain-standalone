// 📊 2nd Brain 데이터 관리 및 인덱싱 시스템

class DataManager {
    constructor(app) {
        this.app = app;
        this.indexedData = new Map();
        this.classifications = {
            byDate: new Map(),
            byPerson: new Map(),
            byClass: new Map(),
            byImportance: new Map(),
            byTags: new Map(),
            byType: new Map()
        };
        
        this.init();
    }

    init() {
        this.buildIndexes();
        this.setupAutoIndexing();
    }

    // 🔍 인덱스 구축
    buildIndexes() {
        const memories = this.app.memories || [];
        
        // 기존 인덱스 초기화
        Object.values(this.classifications).forEach(map => map.clear());
        
        memories.forEach(memory => {
            this.addToIndexes(memory);
        });
        
        console.log('📊 데이터 인덱스 구축 완료:', {
            totalMemories: memories.length,
            dateGroups: this.classifications.byDate.size,
            personGroups: this.classifications.byPerson.size,
            classGroups: this.classifications.byClass.size,
            importanceGroups: this.classifications.byImportance.size
        });
    }

    // 📋 메모리를 인덱스에 추가
    addToIndexes(memory) {
        // 날짜별 인덱싱
        this.indexByDate(memory);
        
        // 사용자별 인덱싱
        this.indexByPerson(memory);
        
        // 분류별 인덱싱
        this.indexByClass(memory);
        
        // 중요도별 인덱싱
        this.indexByImportance(memory);
        
        // 태그별 인덱싱
        this.indexByTags(memory);
        
        // 타입별 인덱싱
        this.indexByType(memory);
    }

    // 📅 날짜별 인덱싱
    indexByDate(memory) {
        const date = new Date(memory.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const monthKey = dateKey.substring(0, 7); // YYYY-MM
        const yearKey = dateKey.substring(0, 4); // YYYY
        
        // 일별
        if (!this.classifications.byDate.has(dateKey)) {
            this.classifications.byDate.set(dateKey, []);
        }
        this.classifications.byDate.get(dateKey).push(memory);
        
        // 월별
        const monthlyKey = `month_${monthKey}`;
        if (!this.classifications.byDate.has(monthlyKey)) {
            this.classifications.byDate.set(monthlyKey, []);
        }
        this.classifications.byDate.get(monthlyKey).push(memory);
        
        // 연별
        const yearlyKey = `year_${yearKey}`;
        if (!this.classifications.byDate.has(yearlyKey)) {
            this.classifications.byDate.set(yearlyKey, []);
        }
        this.classifications.byDate.get(yearlyKey).push(memory);
    }

    // 👤 사용자별 인덱싱
    indexByPerson(memory) {
        const person = memory.person || memory.createdBy || 'unknown';
        
        if (!this.classifications.byPerson.has(person)) {
            this.classifications.byPerson.set(person, []);
        }
        this.classifications.byPerson.get(person).push(memory);
    }

    // 🏷️ 분류별 인덱싱
    indexByClass(memory) {
        const memoryClass = this.determineMemoryClass(memory);
        
        if (!this.classifications.byClass.has(memoryClass)) {
            this.classifications.byClass.set(memoryClass, []);
        }
        this.classifications.byClass.get(memoryClass).push(memory);
    }

    // ⭐ 중요도별 인덱싱
    indexByImportance(memory) {
        const importance = memory.importance || 5;
        const importanceLevel = this.getImportanceLevel(importance);
        
        if (!this.classifications.byImportance.has(importanceLevel)) {
            this.classifications.byImportance.set(importanceLevel, []);
        }
        this.classifications.byImportance.get(importanceLevel).push(memory);
    }

    // 🏷️ 태그별 인덱싱
    indexByTags(memory) {
        const tags = memory.tags || [];
        
        tags.forEach(tag => {
            if (!this.classifications.byTags.has(tag)) {
                this.classifications.byTags.set(tag, []);
            }
            this.classifications.byTags.get(tag).push(memory);
        });
    }

    // 📝 타입별 인덱싱
    indexByType(memory) {
        const type = memory.type || 'unknown';
        
        if (!this.classifications.byType.has(type)) {
            this.classifications.byType.set(type, []);
        }
        this.classifications.byType.get(type).push(memory);
    }

    // 🤖 메모리 분류 결정
    determineMemoryClass(memory) {
        const content = memory.content.toLowerCase();
        const tags = memory.tags || [];
        
        // 키워드 기반 분류
        const classificationRules = {
            'work': ['회의', '업무', '프로젝트', '일', '미팅', '보고서', '발표'],
            'personal': ['개인', '가족', '친구', '취미', '운동', '건강'],
            'learning': ['공부', '학습', '책', '강의', '수업', '교육', '연구'],
            'travel': ['여행', '휴가', '관광', '호텔', '비행기', '기차'],
            'food': ['음식', '요리', '식당', '레시피', '카페', '맛집'],
            'shopping': ['쇼핑', '구매', '온라인', '배송', '주문', '결제'],
            'health': ['병원', '의사', '약', '치료', '검사', '건강'],
            'finance': ['돈', '결제', '은행', '투자', '주식', '보험'],
            'entertainment': ['영화', '음악', '게임', '스포츠', '공연', '드라마'],
            'ideas': ['아이디어', '생각', '계획', '목표', '꿈', '영감']
        };
        
        // 태그 우선 검사
        for (const tag of tags) {
            for (const [className, keywords] of Object.entries(classificationRules)) {
                if (keywords.includes(tag)) {
                    return className;
                }
            }
        }
        
        // 내용 기반 검사
        for (const [className, keywords] of Object.entries(classificationRules)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                return className;
            }
        }
        
        // 타입 기반 기본 분류
        const typeBasedClass = {
            'photo': 'media',
            'video': 'media',
            'voice': 'notes',
            'text': 'notes',
            'location': 'places',
            'document': 'documents'
        };
        
        return typeBasedClass[memory.type] || 'general';
    }

    // ⭐ 중요도 레벨 결정
    getImportanceLevel(importance) {
        if (importance >= 9) return 'critical';
        if (importance >= 7) return 'high';
        if (importance >= 5) return 'medium';
        if (importance >= 3) return 'low';
        return 'minimal';
    }

    // 🔄 자동 인덱싱 설정
    setupAutoIndexing() {
        // 메모리 추가 이벤트 리스너
        document.addEventListener('memoryAdded', (e) => {
            this.addToIndexes(e.detail.memory);
        });
        
        // 메모리 삭제 이벤트 리스너
        document.addEventListener('memoryDeleted', (e) => {
            this.removeFromIndexes(e.detail.memoryId);
        });
        
        // 메모리 업데이트 이벤트 리스너
        document.addEventListener('memoryUpdated', (e) => {
            this.updateInIndexes(e.detail.memory);
        });
    }

    // 🗑️ 인덱스에서 메모리 제거
    removeFromIndexes(memoryId) {
        Object.values(this.classifications).forEach(map => {
            map.forEach((memories, key) => {
                const filteredMemories = memories.filter(m => m.id !== memoryId);
                if (filteredMemories.length === 0) {
                    map.delete(key);
                } else {
                    map.set(key, filteredMemories);
                }
            });
        });
    }

    // 🔄 인덱스에서 메모리 업데이트
    updateInIndexes(memory) {
        this.removeFromIndexes(memory.id);
        this.addToIndexes(memory);
    }

    // 🔍 고급 검색 메서드
    searchByClassification(type, value, options = {}) {
        const classification = this.classifications[`by${type.charAt(0).toUpperCase() + type.slice(1)}`];
        
        if (!classification || !classification.has(value)) {
            return [];
        }
        
        let results = [...classification.get(value)];
        
        // 추가 필터링
        if (options.dateRange) {
            results = this.filterByDateRange(results, options.dateRange);
        }
        
        if (options.importance) {
            results = results.filter(m => (m.importance || 5) >= options.importance);
        }
        
        if (options.type) {
            results = results.filter(m => m.type === options.type);
        }
        
        if (options.tags) {
            results = results.filter(m => 
                options.tags.some(tag => (m.tags || []).includes(tag))
            );
        }
        
        // 정렬
        const sortBy = options.sortBy || 'date';
        results = this.sortResults(results, sortBy);
        
        // 제한
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        
        return results;
    }

    // 📊 데이터 분석 메서드
    getDataStatistics() {
        const memories = this.app.memories || [];
        
        return {
            total: memories.length,
            byType: this.getCountByClassification('Type'),
            byClass: this.getCountByClassification('Class'),
            byImportance: this.getCountByClassification('Importance'),
            byDate: this.getDateStatistics(),
            recentActivity: this.getRecentActivity(),
            topTags: this.getTopTags(),
            storageInfo: this.getStorageInfo()
        };
    }

    getCountByClassification(type) {
        const classification = this.classifications[`by${type}`];
        const counts = {};
        
        classification.forEach((memories, key) => {
            counts[key] = memories.length;
        });
        
        return counts;
    }

    getDateStatistics() {
        const today = new Date();
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        return {
            today: this.countMemoriesSince(today.toISOString().split('T')[0]),
            thisWeek: this.countMemoriesSince(thisWeek.toISOString().split('T')[0]),
            thisMonth: this.countMemoriesSince(thisMonth.toISOString().split('T')[0])
        };
    }

    countMemoriesSince(dateString) {
        const memories = this.app.memories || [];
        return memories.filter(memory => 
            memory.timestamp >= dateString
        ).length;
    }

    getRecentActivity() {
        const memories = this.app.memories || [];
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        return memories
            .filter(memory => new Date(memory.timestamp) > last24Hours)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    getTopTags(limit = 10) {
        const tagCounts = new Map();
        
        this.classifications.byTags.forEach((memories, tag) => {
            tagCounts.set(tag, memories.length);
        });
        
        return Array.from(tagCounts.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }

    getStorageInfo() {
        const memories = this.app.memories || [];
        let totalSize = 0;
        
        // LocalStorage 크기 계산
        for (let key in localStorage) {
            if (key.startsWith('2nd_brain_')) {
                totalSize += localStorage[key].length;
            }
        }
        
        return {
            memoriesCount: memories.length,
            storageUsed: Math.round(totalSize / 1024), // KB
            averageMemorySize: memories.length > 0 ? Math.round(totalSize / memories.length) : 0
        };
    }

    // 🔄 정렬 메서드
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'date':
                return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            case 'importance':
                return results.sort((a, b) => (b.importance || 5) - (a.importance || 5));
            
            case 'type':
                return results.sort((a, b) => a.type.localeCompare(b.type));
            
            case 'person':
                return results.sort((a, b) => {
                    const personA = a.person || a.createdBy || 'unknown';
                    const personB = b.person || b.createdBy || 'unknown';
                    return personA.localeCompare(personB);
                });
            
            case 'random':
                return this.shuffleArray([...results]);
            
            default:
                return results;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 📅 날짜 범위 필터링
    filterByDateRange(memories, dateRange) {
        const { start, end } = dateRange;
        return memories.filter(memory => {
            const memoryDate = new Date(memory.timestamp);
            return (!start || memoryDate >= new Date(start)) &&
                   (!end || memoryDate <= new Date(end));
        });
    }

    // 🔍 스마트 검색
    smartSearch(query, options = {}) {
        const memories = this.app.memories || [];
        let results = [];
        
        // 키워드 분석
        const keywords = query.toLowerCase().split(' ');
        
        // 특별 검색 패턴 감지
        const patterns = {
            datePattern: /(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4})|오늘|어제|이번주|지난주|이번달|지난달/,
            importancePattern: /중요|urgent|high|low|높은|낮은/,
            typePattern: /사진|photo|음성|voice|텍스트|text|영상|video|위치|location/,
            personPattern: /@(\w+)|사용자|user/
        };
        
        // 패턴별 검색
        if (patterns.datePattern.test(query)) {
            results = this.searchByDatePattern(query);
        } else if (patterns.importancePattern.test(query)) {
            results = this.searchByImportancePattern(query);
        } else if (patterns.typePattern.test(query)) {
            results = this.searchByTypePattern(query);
        } else {
            // 일반 텍스트 검색
            results = this.performTextSearch(query, memories);
        }
        
        // 추가 필터 적용
        if (options.filters) {
            results = this.applyFilters(results, options.filters);
        }
        
        // 정렬
        results = this.sortResults(results, options.sortBy || 'date');
        
        return results;
    }

    performTextSearch(query, memories) {
        const keywords = query.toLowerCase().split(' ');
        
        return memories.filter(memory => {
            const searchableText = [
                memory.content,
                ...(memory.tags || []),
                memory.type,
                memory.person || memory.createdBy || ''
            ].join(' ').toLowerCase();
            
            return keywords.some(keyword => searchableText.includes(keyword));
        });
    }

    searchByDatePattern(query) {
        const lowerQuery = query.toLowerCase();
        let dateKey = '';
        
        if (lowerQuery.includes('오늘')) {
            dateKey = new Date().toISOString().split('T')[0];
        } else if (lowerQuery.includes('어제')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            dateKey = yesterday.toISOString().split('T')[0];
        } else if (lowerQuery.includes('이번주')) {
            return this.getThisWeekMemories();
        } else if (lowerQuery.includes('지난주')) {
            return this.getLastWeekMemories();
        }
        
        return this.classifications.byDate.get(dateKey) || [];
    }

    getThisWeekMemories() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
        
        return this.filterByDateRange(this.app.memories || [], {
            start: startOfWeek.toISOString().split('T')[0],
            end: endOfWeek.toISOString().split('T')[0]
        });
    }

    // 📊 인덱스 상태 리포트
    getIndexReport() {
        return {
            totalMemories: this.app.memories?.length || 0,
            indexes: {
                byDate: this.classifications.byDate.size,
                byPerson: this.classifications.byPerson.size,
                byClass: this.classifications.byClass.size,
                byImportance: this.classifications.byImportance.size,
                byTags: this.classifications.byTags.size,
                byType: this.classifications.byType.size
            },
            topClassifications: {
                mostActiveDate: this.getMostActive('byDate'),
                mostActivePerson: this.getMostActive('byPerson'),
                mostActiveClass: this.getMostActive('byClass'),
                mostUsedTag: this.getMostActive('byTags')
            }
        };
    }

    getMostActive(classificationType) {
        const classification = this.classifications[classificationType];
        let maxCount = 0;
        let mostActive = null;
        
        classification.forEach((memories, key) => {
            if (memories.length > maxCount) {
                maxCount = memories.length;
                mostActive = key;
            }
        });
        
        return { key: mostActive, count: maxCount };
    }

    // 🧹 인덱스 최적화
    optimizeIndexes() {
        // 빈 인덱스 정리
        Object.values(this.classifications).forEach(map => {
            map.forEach((memories, key) => {
                if (memories.length === 0) {
                    map.delete(key);
                }
            });
        });
        
        // 인덱스 재구축
        this.buildIndexes();
        
        console.log('🧹 데이터 인덱스 최적화 완료');
        return this.getIndexReport();
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.DataManager = DataManager;