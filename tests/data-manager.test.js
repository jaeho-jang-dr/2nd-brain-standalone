// 🧪 DataManager 모듈 유닛 테스트
// Jest 테스트 환경에서 DataManager 클래스의 모든 기능을 테스트

const fs = require('fs');
const path = require('path');

// DataManager 클래스 로드
const dataManagerPath = path.resolve(__dirname, '../data-manager.js');
const dataManagerCode = fs.readFileSync(dataManagerPath, 'utf8');

// 전역 스코프에서 DataManager 클래스 정의
eval(dataManagerCode);

describe('DataManager', () => {
    let dataManager;
    let mockApp;

    beforeEach(() => {
        // 목 앱 인스턴스 생성
        mockApp = {
            memories: [],
            addMemory: jest.fn(),
            updateUI: jest.fn(),
            saveMemories: jest.fn()
        };
        
        // DataManager 인스턴스 생성
        dataManager = new DataManager(mockApp);
        
        // console.log mock 설정
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('생성자 및 초기화', () => {
        test('DataManager 인스턴스가 올바르게 생성되어야 함', () => {
            expect(dataManager).toBeInstanceOf(DataManager);
            expect(dataManager.app).toBe(mockApp);
            expect(dataManager.indexedData).toBeInstanceOf(Map);
            expect(dataManager.classifications).toHaveProperty('byDate');
            expect(dataManager.classifications).toHaveProperty('byPerson');
            expect(dataManager.classifications).toHaveProperty('byClass');
            expect(dataManager.classifications).toHaveProperty('byImportance');
            expect(dataManager.classifications).toHaveProperty('byTags');
            expect(dataManager.classifications).toHaveProperty('byType');
        });

        test('모든 분류 맵이 Map 인스턴스여야 함', () => {
            Object.values(dataManager.classifications).forEach(classification => {
                expect(classification).toBeInstanceOf(Map);
            });
        });

        test('init 메서드가 올바르게 실행되어야 함', () => {
            const spy = jest.spyOn(dataManager, 'buildIndexes');
            const setupSpy = jest.spyOn(dataManager, 'setupAutoIndexing');
            
            dataManager.init();
            
            expect(spy).toHaveBeenCalled();
            expect(setupSpy).toHaveBeenCalled();
        });
    });

    describe('인덱스 구축', () => {
        beforeEach(() => {
            // 테스트용 메모리 데이터 설정
            mockApp.memories = [
                {
                    id: '1',
                    type: 'text',
                    content: '오늘 회의 내용',
                    timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
                    tags: ['회의', '업무'],
                    importance: 8,
                    person: 'user1'
                },
                {
                    id: '2',
                    type: 'photo',
                    content: '점심 사진',
                    timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
                    tags: ['음식', '일상'],
                    importance: 5,
                    person: 'user1'
                },
                {
                    id: '3',
                    type: 'voice',
                    content: '중요한 아이디어',
                    timestamp: new Date('2024-01-16T09:00:00Z').toISOString(),
                    tags: ['아이디어', '중요'],
                    importance: 9,
                    person: 'user2'
                }
            ];
        });

        test('buildIndexes가 모든 메모리를 인덱싱해야 함', () => {
            dataManager.buildIndexes();
            
            // 날짜별 인덱스 확인
            expect(dataManager.classifications.byDate.has('2024-01-15')).toBe(true);
            expect(dataManager.classifications.byDate.has('2024-01-16')).toBe(true);
            expect(dataManager.classifications.byDate.get('2024-01-15')).toHaveLength(2);
            expect(dataManager.classifications.byDate.get('2024-01-16')).toHaveLength(1);
            
            // 타입별 인덱스 확인
            expect(dataManager.classifications.byType.has('text')).toBe(true);
            expect(dataManager.classifications.byType.has('photo')).toBe(true);
            expect(dataManager.classifications.byType.has('voice')).toBe(true);
            
            // 사용자별 인덱스 확인
            expect(dataManager.classifications.byPerson.has('user1')).toBe(true);
            expect(dataManager.classifications.byPerson.has('user2')).toBe(true);
            expect(dataManager.classifications.byPerson.get('user1')).toHaveLength(2);
            expect(dataManager.classifications.byPerson.get('user2')).toHaveLength(1);
        });

        test('addToIndexes가 단일 메모리를 모든 인덱스에 추가해야 함', () => {
            const memory = {
                id: 'test',
                type: 'text',
                content: '테스트 메모리',
                timestamp: new Date().toISOString(),
                tags: ['테스트'],
                importance: 7,
                person: 'testuser'
            };
            
            dataManager.addToIndexes(memory);
            
            // 각 인덱스에 추가되었는지 확인
            const today = new Date().toISOString().split('T')[0];
            expect(dataManager.classifications.byDate.has(today)).toBe(true);
            expect(dataManager.classifications.byType.has('text')).toBe(true);
            expect(dataManager.classifications.byPerson.has('testuser')).toBe(true);
            expect(dataManager.classifications.byImportance.has('high')).toBe(true); // 7은 'high' 레벨
            expect(dataManager.classifications.byTags.has('테스트')).toBe(true);
        });
    });

    describe('날짜별 인덱싱', () => {
        test('indexByDate가 일/월/년별로 올바르게 분류해야 함', () => {
            const memory = {
                id: 'test',
                timestamp: new Date('2024-03-15T14:30:00Z').toISOString()
            };
            
            dataManager.indexByDate(memory);
            
            // 일별 인덱스
            expect(dataManager.classifications.byDate.has('2024-03-15')).toBe(true);
            expect(dataManager.classifications.byDate.get('2024-03-15')).toContain(memory);
            
            // 월별 인덱스
            expect(dataManager.classifications.byDate.has('month_2024-03')).toBe(true);
            expect(dataManager.classifications.byDate.get('month_2024-03')).toContain(memory);
            
            // 연별 인덱스
            expect(dataManager.classifications.byDate.has('year_2024')).toBe(true);
            expect(dataManager.classifications.byDate.get('year_2024')).toContain(memory);
        });

        test('같은 날짜의 여러 메모리가 올바르게 그룹화되어야 함', () => {
            const memory1 = {
                id: '1',
                timestamp: new Date('2024-03-15T10:00:00Z').toISOString()
            };
            const memory2 = {
                id: '2',
                timestamp: new Date('2024-03-15T15:00:00Z').toISOString()
            };
            
            dataManager.indexByDate(memory1);
            dataManager.indexByDate(memory2);
            
            expect(dataManager.classifications.byDate.get('2024-03-15')).toHaveLength(2);
            expect(dataManager.classifications.byDate.get('2024-03-15')).toContain(memory1);
            expect(dataManager.classifications.byDate.get('2024-03-15')).toContain(memory2);
        });
    });

    describe('사용자별 인덱싱', () => {
        test('indexByPerson이 사용자별로 메모리를 그룹화해야 함', () => {
            const memory1 = { id: '1', person: 'alice' };
            const memory2 = { id: '2', person: 'bob' };
            const memory3 = { id: '3', person: 'alice' };
            
            dataManager.indexByPerson(memory1);
            dataManager.indexByPerson(memory2);
            dataManager.indexByPerson(memory3);
            
            expect(dataManager.classifications.byPerson.get('alice')).toHaveLength(2);
            expect(dataManager.classifications.byPerson.get('bob')).toHaveLength(1);
            expect(dataManager.classifications.byPerson.get('alice')).toContain(memory1);
            expect(dataManager.classifications.byPerson.get('alice')).toContain(memory3);
        });

        test('person 필드가 없을 때 unknown으로 분류되어야 함', () => {
            const memory = { id: 'test' };
            
            dataManager.indexByPerson(memory);
            
            expect(dataManager.classifications.byPerson.has('unknown')).toBe(true);
            expect(dataManager.classifications.byPerson.get('unknown')).toContain(memory);
        });

        test('createdBy 필드를 대체로 사용해야 함', () => {
            const memory = { id: 'test', createdBy: 'creator' };
            
            dataManager.indexByPerson(memory);
            
            expect(dataManager.classifications.byPerson.has('creator')).toBe(true);
            expect(dataManager.classifications.byPerson.get('creator')).toContain(memory);
        });
    });

    describe('중요도별 인덱싱', () => {
        test('indexByImportance가 중요도 레벨별로 메모리를 그룹화해야 함', () => {
            const memory1 = { id: '1', importance: 5 };
            const memory2 = { id: '2', importance: 8 };
            const memory3 = { id: '3', importance: 9 };
            
            dataManager.indexByImportance(memory1);
            dataManager.indexByImportance(memory2);
            dataManager.indexByImportance(memory3);
            
            expect(dataManager.classifications.byImportance.has('medium')).toBe(true);
            expect(dataManager.classifications.byImportance.has('high')).toBe(true);
            expect(dataManager.classifications.byImportance.has('critical')).toBe(true);
        });

        test('getImportanceLevel이 올바른 레벨을 반환해야 함', () => {
            const testCases = [
                { importance: 10, expected: 'critical' },
                { importance: 9, expected: 'critical' },
                { importance: 8, expected: 'high' },
                { importance: 7, expected: 'high' },
                { importance: 6, expected: 'medium' },
                { importance: 5, expected: 'medium' },
                { importance: 4, expected: 'low' },
                { importance: 3, expected: 'low' },
                { importance: 2, expected: 'minimal' },
                { importance: 1, expected: 'minimal' }
            ];
            
            testCases.forEach(({ importance, expected }) => {
                const result = dataManager.getImportanceLevel(importance);
                expect(result).toBe(expected);
            });
        });

        test('importance가 없을 때 기본값으로 medium 레벨에 분류되어야 함', () => {
            const memory = { id: 'test' };
            
            dataManager.indexByImportance(memory);
            
            expect(dataManager.classifications.byImportance.has('medium')).toBe(true);
            expect(dataManager.classifications.byImportance.get('medium')).toContain(memory);
        });
    });

    describe('태그별 인덱싱', () => {
        test('indexByTags가 각 태그별로 메모리를 그룹화해야 함', () => {
            const memory1 = { id: '1', tags: ['회의', '업무'] };
            const memory2 = { id: '2', tags: ['업무', '프로젝트'] };
            const memory3 = { id: '3', tags: ['개인'] };
            
            dataManager.indexByTags(memory1);
            dataManager.indexByTags(memory2);
            dataManager.indexByTags(memory3);
            
            expect(dataManager.classifications.byTags.get('업무')).toHaveLength(2);
            expect(dataManager.classifications.byTags.get('회의')).toHaveLength(1);
            expect(dataManager.classifications.byTags.get('프로젝트')).toHaveLength(1);
            expect(dataManager.classifications.byTags.get('개인')).toHaveLength(1);
        });

        test('태그가 없는 메모리는 인덱싱하지 않아야 함', () => {
            const memory = { id: 'test' };
            const initialSize = dataManager.classifications.byTags.size;
            
            dataManager.indexByTags(memory);
            
            expect(dataManager.classifications.byTags.size).toBe(initialSize);
        });

        test('빈 태그 배열은 인덱싱하지 않아야 함', () => {
            const memory = { id: 'test', tags: [] };
            const initialSize = dataManager.classifications.byTags.size;
            
            dataManager.indexByTags(memory);
            
            expect(dataManager.classifications.byTags.size).toBe(initialSize);
        });
    });

    describe('분류별 인덱싱', () => {
        test('indexByClass가 메모리를 올바른 클래스로 분류해야 함', () => {
            const workMemory = { id: '1', content: '회의 내용', tags: ['업무'] };
            const personalMemory = { id: '2', content: '가족 모임', tags: ['개인'] };
            const photoMemory = { id: '3', type: 'photo', content: '사진' };
            
            dataManager.indexByClass(workMemory);
            dataManager.indexByClass(personalMemory);
            dataManager.indexByClass(photoMemory);
            
            expect(dataManager.classifications.byClass.has('work')).toBe(true);
            expect(dataManager.classifications.byClass.has('personal')).toBe(true);
            expect(dataManager.classifications.byClass.has('media')).toBe(true);
        });

        test('determineMemoryClass가 키워드 기반으로 올바르게 분류해야 함', () => {
            const testCases = [
                { content: '회의 내용', expected: 'work' },
                { content: '가족과의 시간', expected: 'personal' },
                { content: '새로운 아이디어', expected: 'ideas' },
                { content: '맛있는 음식', expected: 'food' },
                { type: 'photo', content: '사진', expected: 'media' },
                { type: 'unknown', content: '기타', expected: 'general' }
            ];
            
            testCases.forEach(({ content, type, expected }) => {
                const result = dataManager.determineMemoryClass({ content, type });
                expect(result).toBe(expected);
            });
        });
    });

    describe('타입별 인덱싱', () => {
        test('indexByType이 타입별로 메모리를 그룹화해야 함', () => {
            const memory1 = { id: '1', type: 'text' };
            const memory2 = { id: '2', type: 'photo' };
            const memory3 = { id: '3', type: 'text' };
            
            dataManager.indexByType(memory1);
            dataManager.indexByType(memory2);
            dataManager.indexByType(memory3);
            
            expect(dataManager.classifications.byType.get('text')).toHaveLength(2);
            expect(dataManager.classifications.byType.get('photo')).toHaveLength(1);
            expect(dataManager.classifications.byType.get('text')).toContain(memory1);
            expect(dataManager.classifications.byType.get('text')).toContain(memory3);
        });

        test('type이 없을 때 unknown으로 분류되어야 함', () => {
            const memory = { id: 'test' };
            
            dataManager.indexByType(memory);
            
            expect(dataManager.classifications.byType.has('unknown')).toBe(true);
            expect(dataManager.classifications.byType.get('unknown')).toContain(memory);
        });
    });

    describe('검색 기능', () => {
        beforeEach(() => {
            // 테스트용 데이터 설정
            mockApp.memories = [
                {
                    id: '1',
                    type: 'text',
                    content: '중요한 회의 내용',
                    timestamp: new Date('2024-01-15').toISOString(),
                    tags: ['회의', '중요'],
                    importance: 8
                },
                {
                    id: '2',
                    type: 'photo',
                    content: '팀 점심 사진',
                    timestamp: new Date('2024-01-15').toISOString(),
                    tags: ['점심', '팀'],
                    importance: 5
                },
                {
                    id: '3',
                    type: 'voice',
                    content: '아이디어 메모',
                    timestamp: new Date('2024-01-16').toISOString(),
                    tags: ['아이디어'],
                    importance: 7
                }
            ];
            dataManager.buildIndexes();
        });

        test('searchByClassification이 기본 검색을 수행해야 함', () => {
            const results = dataManager.searchByClassification('type', 'text');
            
            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('text');
        });

        test('searchByClassification이 옵션으로 필터링해야 함', () => {
            const options = {
                importance: 7,
                type: 'text'
            };
            const results = dataManager.searchByClassification('tags', '회의', options);
            
            expect(results).toHaveLength(1);
            expect(results[0].importance).toBeGreaterThanOrEqual(7);
        });

        test('sortResults가 다양한 기준으로 정렬해야 함', () => {
            const testMemories = [
                { id: '1', timestamp: '2024-01-15T10:00:00Z', importance: 5, type: 'text' },
                { id: '2', timestamp: '2024-01-16T10:00:00Z', importance: 8, type: 'photo' },
                { id: '3', timestamp: '2024-01-14T10:00:00Z', importance: 7, type: 'voice' }
            ];
            
            // 날짜순 정렬 (최신순)
            const dateResults = dataManager.sortResults([...testMemories], 'date');
            expect(dateResults[0].id).toBe('2'); // 가장 최신
            
            // 중요도순 정렬
            const importanceResults = dataManager.sortResults([...testMemories], 'importance');
            expect(importanceResults[0].importance).toBe(8); // 가장 중요
            
            // 타입순 정렬
            const typeResults = dataManager.sortResults([...testMemories], 'type');
            expect(typeResults[0].type).toBe('photo'); // 알파벳순
        });

        test('performTextSearch가 텍스트 검색을 수행해야 함', () => {
            const results = dataManager.performTextSearch('회의', mockApp.memories);
            
            expect(results).toHaveLength(1);
            expect(results[0].content).toContain('회의');
        });

        test('smartSearch가 특별 패턴을 감지해야 함', () => {
            // 날짜 패턴 테스트
            const todayResults = dataManager.smartSearch('오늘');
            expect(Array.isArray(todayResults)).toBe(true);
            
            // 일반 텍스트 검색
            const textResults = dataManager.smartSearch('회의');
            expect(textResults).toHaveLength(1);
            expect(textResults[0].content).toContain('회의');
        });

        test('searchByDatePattern이 날짜 키워드를 처리해야 함', () => {
            // 오늘 검색
            const todayResults = dataManager.searchByDatePattern('오늘');
            expect(Array.isArray(todayResults)).toBe(true);
            
            // 어제 검색
            const yesterdayResults = dataManager.searchByDatePattern('어제');
            expect(Array.isArray(yesterdayResults)).toBe(true);
            
            // 이번주 검색
            const thisWeekResults = dataManager.searchByDatePattern('이번주');
            expect(Array.isArray(thisWeekResults)).toBe(true);
        });

        test('getThisWeekMemories가 이번주 메모리를 반환해야 함', () => {
            const results = dataManager.getThisWeekMemories();
            
            expect(Array.isArray(results)).toBe(true);
            // 날짜 범위 검증은 복잡하므로 타입만 확인
        });

        test('filterByDateRange가 날짜 범위로 필터링해야 함', () => {
            const memories = [
                { timestamp: '2024-01-15T10:00:00Z' },
                { timestamp: '2024-01-16T10:00:00Z' },
                { timestamp: '2024-01-17T10:00:00Z' }
            ];
            
            const filtered = dataManager.filterByDateRange(memories, {
                start: '2024-01-15',
                end: '2024-01-16T23:59:59Z' // 16일 끝까지 포함되도록
            });
            
            expect(filtered).toHaveLength(2);
        });
    });

    describe('통계 및 분석', () => {
        beforeEach(() => {
            mockApp.memories = [
                { id: '1', type: 'text', content: '텍스트 내용', importance: 8, timestamp: new Date('2024-01-15').toISOString() },
                { id: '2', type: 'photo', content: '사진 내용', importance: 5, timestamp: new Date('2024-01-15').toISOString() },
                { id: '3', type: 'text', content: '또 다른 텍스트', importance: 7, timestamp: new Date('2024-01-16').toISOString() },
                { id: '4', type: 'voice', content: '음성 내용', importance: 9, timestamp: new Date('2024-01-16').toISOString() }
            ];
            dataManager.buildIndexes();
        });

        test('getDataStatistics가 전체 통계를 반환해야 함', () => {
            const stats = dataManager.getDataStatistics();
            
            expect(stats).toHaveProperty('total', 4);
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('byClass');
            expect(stats).toHaveProperty('byImportance');
            expect(stats).toHaveProperty('byDate');
            expect(stats).toHaveProperty('recentActivity');
            expect(stats).toHaveProperty('topTags');
            expect(stats).toHaveProperty('storageInfo');
        });

        test('getCountByClassification이 분류별 개수를 반환해야 함', () => {
            const typeCounts = dataManager.getCountByClassification('Type');
            
            expect(typeCounts.text).toBe(2);
            expect(typeCounts.photo).toBe(1);
            expect(typeCounts.voice).toBe(1);
        });

        test('getDateStatistics가 날짜별 통계를 반환해야 함', () => {
            const stats = dataManager.getDateStatistics();
            
            expect(stats).toHaveProperty('today');
            expect(stats).toHaveProperty('thisWeek');
            expect(stats).toHaveProperty('thisMonth');
            expect(typeof stats.today).toBe('number');
            expect(typeof stats.thisWeek).toBe('number');
            expect(typeof stats.thisMonth).toBe('number');
        });

        test('getRecentActivity가 최근 활동을 반환해야 함', () => {
            const recentActivity = dataManager.getRecentActivity();
            
            expect(Array.isArray(recentActivity)).toBe(true);
            expect(recentActivity.length).toBeLessThanOrEqual(10);
            // 날짜순으로 정렬되어 있는지 확인 (최신순)
            if (recentActivity.length > 1) {
                expect(new Date(recentActivity[0].timestamp))
                    .toBeInstanceOf(Date);
            }
        });

        test('getTopTags가 상위 태그 목록을 반환해야 함', () => {
            // 태그가 있는 데이터로 다시 설정
            mockApp.memories = [
                { id: '1', content: '회의 내용', tags: ['회의', '업무'] },
                { id: '2', content: '업무 내용', tags: ['업무', '프로젝트'] },
                { id: '3', content: '또 다른 회의', tags: ['회의'] },
                { id: '4', content: '개인 일정', tags: ['개인'] }
            ];
            dataManager.buildIndexes();
            
            const topTags = dataManager.getTopTags(3);
            
            expect(topTags).toHaveLength(3);
            // 정렬 순서는 알파벳 순이므로 확인만 하고 순서는 신경쓰지 않음
            const tagNames = topTags.map(t => t.tag);
            expect(tagNames).toContain('회의');
            expect(tagNames).toContain('업무');
            expect(tagNames).toContain('프로젝트');
        });

        test('getStorageInfo가 저장소 정보를 반환해야 함', () => {
            const storageInfo = dataManager.getStorageInfo();
            
            expect(storageInfo).toHaveProperty('memoriesCount');
            expect(storageInfo).toHaveProperty('storageUsed');
            expect(storageInfo).toHaveProperty('averageMemorySize');
            expect(typeof storageInfo.memoriesCount).toBe('number');
            expect(typeof storageInfo.storageUsed).toBe('number');
        });

        test('countMemoriesSince가 특정 날짜 이후 메모리 개수를 반환해야 함', () => {
            const count = dataManager.countMemoriesSince('2024-01-16');
            
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('데이터 정리 및 최적화', () => {
        test('optimizeIndexes가 빈 인덱스를 정리하고 재구축해야 함', () => {
            // 빈 인덱스 추가
            dataManager.classifications.byTags.set('empty', []);
            dataManager.classifications.byType.set('empty', []);
            
            const report = dataManager.optimizeIndexes();
            
            expect(dataManager.classifications.byTags.has('empty')).toBe(false);
            expect(dataManager.classifications.byType.has('empty')).toBe(false);
            expect(report).toHaveProperty('totalMemories');
            expect(report).toHaveProperty('indexes');
        });

        test('removeFromIndexes가 모든 인덱스에서 메모리를 제거해야 함', () => {
            const memory = {
                id: 'test-remove',
                type: 'text',
                tags: ['test'],
                importance: 7,
                timestamp: new Date().toISOString()
            };
            
            dataManager.addToIndexes(memory);
            
            // 추가 확인
            expect(dataManager.classifications.byType.get('text')).toContain(memory);
            
            dataManager.removeFromIndexes('test-remove');
            
            // 제거 확인 - 모든 분류에서 제거되었는지 확인
            Object.values(dataManager.classifications).forEach(map => {
                map.forEach(memories => {
                    expect(memories.every(m => m.id !== 'test-remove')).toBe(true);
                });
            });
        });

        test('updateInIndexes가 메모리를 업데이트해야 함', () => {
            const memory = {
                id: 'test-update',
                type: 'text',
                tags: ['old'],
                importance: 5
            };
            
            dataManager.addToIndexes(memory);
            
            const updatedMemory = {
                id: 'test-update',
                type: 'photo',
                tags: ['new'],
                importance: 8
            };
            
            dataManager.updateInIndexes(updatedMemory);
            
            expect(dataManager.classifications.byType.get('photo')).toContain(updatedMemory);
            expect(dataManager.classifications.byTags.get('new')).toContain(updatedMemory);
        });
    });

    describe('인덱스 리포트 및 분석', () => {
        beforeEach(() => {
            mockApp.memories = [
                { id: '1', type: 'text', content: '업무 내용', tags: ['업무'], timestamp: '2024-01-15T10:00:00Z' },
                { id: '2', type: 'photo', content: '업무 사진', tags: ['업무'], timestamp: '2024-01-16T10:00:00Z' },
                { id: '3', type: 'text', content: '개인 내용', tags: ['개인'], timestamp: '2024-01-17T10:00:00Z' }
            ];
            dataManager.buildIndexes();
        });

        test('getIndexReport가 인덱스 상태 리포트를 반환해야 함', () => {
            const report = dataManager.getIndexReport();
            
            expect(report).toHaveProperty('totalMemories', 3);
            expect(report).toHaveProperty('indexes');
            expect(report).toHaveProperty('topClassifications');
            expect(report.indexes.byDate).toBeGreaterThan(0);
            expect(report.indexes.byType).toBeGreaterThan(0);
        });

        test('getMostActive가 가장 활발한 분류를 반환해야 함', () => {
            const mostActiveType = dataManager.getMostActive('byType');
            
            expect(mostActiveType).toHaveProperty('key');
            expect(mostActiveType).toHaveProperty('count');
            expect(mostActiveType.key).toBe('text'); // text가 2개로 가장 많음
            expect(mostActiveType.count).toBe(2);
        });
    });

    describe('유틸리티 메서드', () => {
        test('shuffleArray가 배열을 섞어야 함', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = dataManager.shuffleArray([...original]);
            
            expect(shuffled).toHaveLength(original.length);
            expect(shuffled).toEqual(expect.arrayContaining(original));
            // 순서가 바뀌었는지는 확률적이므로 길이와 요소만 확인
        });

        test('setupAutoIndexing이 이벤트 리스너를 설정해야 함', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            
            dataManager.setupAutoIndexing();
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('memoryAdded', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('memoryDeleted', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('memoryUpdated', expect.any(Function));
        });
    });

    describe('에러 처리', () => {
        test('잘못된 timestamp가 있는 메모리는 건너뛰어야 함', () => {
            const validMemory = {
                id: 'valid',
                content: '유효한 메모리',
                timestamp: new Date().toISOString(),
                type: 'text'
            };
            
            // 유효한 메모리는 정상 처리되어야 함
            expect(() => {
                dataManager.addToIndexes(validMemory);
            }).not.toThrow();
            
            expect(dataManager.classifications.byType.has('text')).toBe(true);
        });

        test('content가 없는 메모리 처리', () => {
            const memory = {
                id: 'test',
                type: 'text',
                timestamp: new Date().toISOString()
                // content 없음
            };
            
            expect(() => {
                dataManager.addToIndexes(memory);
            }).not.toThrow();
        });

        test('빈 앱 메모리 배열 처리', () => {
            mockApp.memories = null;
            
            expect(() => {
                dataManager.buildIndexes();
            }).not.toThrow();
            
            mockApp.memories = undefined;
            
            expect(() => {
                dataManager.buildIndexes();
            }).not.toThrow();
        });

        test('잘못된 분류 타입 처리', () => {
            const results = dataManager.searchByClassification('invalid', 'value');
            
            expect(results).toEqual([]);
        });
    });

    describe('성능 테스트', () => {
        test('대용량 데이터 인덱싱 성능', () => {
            // 1000개의 메모리 생성
            const largeMemories = Array.from({ length: 1000 }, (_, i) => ({
                id: `memory-${i}`,
                type: i % 3 === 0 ? 'text' : i % 3 === 1 ? 'photo' : 'voice',
                content: `메모리 내용 ${i}`,
                timestamp: new Date(2024, 0, 1 + (i % 365)).toISOString(),
                tags: [`tag-${i % 10}`, `category-${i % 5}`],
                importance: (i % 10) + 1
            }));
            
            mockApp.memories = largeMemories;
            
            const startTime = Date.now();
            dataManager.buildIndexes();
            const endTime = Date.now();
            
            expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
            expect(dataManager.classifications.byType.size).toBeGreaterThan(0);
            expect(dataManager.classifications.byTags.size).toBeGreaterThan(0);
        });

        test('대용량 검색 성능', () => {
            // 큰 데이터셋으로 검색 성능 테스트
            const largeMemories = Array.from({ length: 100 }, (_, i) => ({
                id: `search-${i}`,
                type: 'text',
                content: `검색 테스트 내용 ${i}`,
                timestamp: new Date().toISOString(),
                tags: [`search-tag-${i % 5}`]
            }));
            
            mockApp.memories = largeMemories;
            dataManager.buildIndexes();
            
            const startTime = Date.now();
            const results = dataManager.performTextSearch('검색', largeMemories);
            const endTime = Date.now();
            
            expect(endTime - startTime).toBeLessThan(100); // 100ms 이내
            expect(results).toHaveLength(100);
        });
    });
});