#!/usr/bin/env node

// 🧪 2nd Brain Standalone - 전체 테스트 실행 스크립트
// 모든 유닛 테스트를 실행하고 포괄적인 결과 리포트 생성

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧠 2nd Brain Standalone - 유닛 테스트 실행 시작\n');

// 테스트 설정
const testFiles = [
    'tests/claude-ai.test.js',
    'tests/data-manager.test.js', 
    'tests/standalone-brain-app.test.js',
    'tests/auth-manager.test.js',
    'tests/admin-manager.test.js',
    'tests/service-worker.test.js'
];

const testResults = [];
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

console.log('📋 실행할 테스트 파일:');
testFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
});
console.log('\n' + '='.repeat(60) + '\n');

// 각 테스트 파일 개별 실행
for (const testFile of testFiles) {
    console.log(`🚀 실행 중: ${testFile}`);
    
    try {
        // Jest 실행하고 결과 캡처
        const output = execSync(`npm test -- ${testFile} 2>&1`, { 
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        // 결과 파싱
        const lines = output.split('\n');
        let passed = 0;
        let failed = 0;
        let total = 0;
        
        // Jest 출력에서 테스트 결과 추출
        for (const line of lines) {
            if (line.includes('Tests:')) {
                // Jest 출력 형식: "Tests: 40 passed, 40 total" 또는 "Tests: 2 failed, 38 passed, 40 total"
                const failedMatch = line.match(/(\d+)\s+failed/);
                const passedMatch = line.match(/(\d+)\s+passed/);
                const totalMatch = line.match(/(\d+)\s+total/);
                
                if (totalMatch) {
                    total = parseInt(totalMatch[1]);
                    passed = passedMatch ? parseInt(passedMatch[1]) : 0;
                    failed = failedMatch ? parseInt(failedMatch[1]) : 0;
                    
                    // 만약 failed + passed !== total이면 passed를 조정
                    if (failed + passed !== total && !failedMatch) {
                        failed = total - passed;
                    }
                    break;
                }
            }
        }
        
        testResults.push({
            file: testFile,
            status: 'SUCCESS',
            passed,
            failed,
            total,
            percentage: total > 0 ? Math.round((passed / total) * 100) : 0
        });
        
        totalTests += total;
        totalPassed += passed;
        totalFailed += failed;
        
        console.log(`✅ ${testFile}: ${passed}/${total} 통과 (${Math.round((passed / total) * 100)}%)`);
        
    } catch (error) {
        // 테스트 실패 시에도 결과 파싱 시도
        const output = error.stdout ? error.stdout.toString() : '';
        const lines = output.split('\n');
        let passed = 0;
        let failed = 0;
        let total = 0;
        
        for (const line of lines) {
            if (line.includes('Tests:')) {
                // Jest 출력 형식: "Tests: 40 passed, 40 total" 또는 "Tests: 2 failed, 38 passed, 40 total"
                const failedMatch = line.match(/(\d+)\s+failed/);
                const passedMatch = line.match(/(\d+)\s+passed/);
                const totalMatch = line.match(/(\d+)\s+total/);
                
                if (totalMatch) {
                    total = parseInt(totalMatch[1]);
                    passed = passedMatch ? parseInt(passedMatch[1]) : 0;
                    failed = failedMatch ? parseInt(failedMatch[1]) : 0;
                    
                    // 만약 failed + passed !== total이면 passed를 조정
                    if (failed + passed !== total && !failedMatch) {
                        failed = total - passed;
                    }
                    break;
                }
            }
        }
        
        testResults.push({
            file: testFile,
            status: 'PARTIAL',
            passed,
            failed,
            total,
            percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
            error: error.message
        });
        
        totalTests += total;
        totalPassed += passed;
        totalFailed += failed;
        
        console.log(`⚠️  ${testFile}: ${passed}/${total} 통과 (${total > 0 ? Math.round((passed / total) * 100) : 0}%) - 일부 실패`);
    }
    
    console.log('');
}

console.log('='.repeat(60));
console.log('📊 전체 테스트 결과 요약\n');

// 개별 테스트 파일 결과
testResults.forEach(result => {
    const statusIcon = result.status === 'SUCCESS' ? '✅' : '⚠️';
    const moduleLabel = result.file.replace('tests/', '').replace('.test.js', '');
    
    console.log(`${statusIcon} ${moduleLabel.padEnd(25)} ${result.passed.toString().padStart(3)}/${result.total.toString().padEnd(3)} (${result.percentage.toString().padStart(3)}%)`);
});

console.log('\n' + '-'.repeat(60));

// 전체 통계
const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
console.log(`📈 전체 통계: ${totalPassed}/${totalTests} 테스트 통과 (${overallPercentage}%)`);
console.log(`✅ 성공: ${totalPassed}`);
console.log(`❌ 실패: ${totalFailed}`);

// 성능 평가
let performanceGrade = 'F';
if (overallPercentage >= 95) performanceGrade = 'A+';
else if (overallPercentage >= 90) performanceGrade = 'A';
else if (overallPercentage >= 85) performanceGrade = 'B+';
else if (overallPercentage >= 80) performanceGrade = 'B';
else if (overallPercentage >= 75) performanceGrade = 'C+';
else if (overallPercentage >= 70) performanceGrade = 'C';
else if (overallPercentage >= 60) performanceGrade = 'D';

console.log(`🎯 테스트 품질 등급: ${performanceGrade}`);

// 상세 리포트 생성
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportContent = `# 2nd Brain Standalone - 테스트 리포트

**생성 날짜:** ${new Date().toLocaleString('ko-KR')}
**전체 성공률:** ${overallPercentage}%
**품질 등급:** ${performanceGrade}

## 📊 모듈별 테스트 결과

| 모듈 | 통과 | 전체 | 성공률 | 상태 |
|------|------|------|--------|------|
${testResults.map(result => {
    const moduleLabel = result.file.replace('tests/', '').replace('.test.js', '');
    const statusEmoji = result.status === 'SUCCESS' ? '✅' : '⚠️';
    return `| ${moduleLabel} | ${result.passed} | ${result.total} | ${result.percentage}% | ${statusEmoji} |`;
}).join('\n')}

## 📈 전체 통계

- **총 테스트 수:** ${totalTests}
- **통과한 테스트:** ${totalPassed}
- **실패한 테스트:** ${totalFailed}
- **전체 성공률:** ${overallPercentage}%

## 🎯 모듈별 분석

${testResults.map(result => {
    const moduleLabel = result.file.replace('tests/', '').replace('.test.js', '');
    return `### ${moduleLabel}
- 테스트 수: ${result.total}
- 통과: ${result.passed}
- 실패: ${result.failed}
- 성공률: ${result.percentage}%
${result.error ? `- 오류: ${result.error.substring(0, 200)}...` : ''}
`;
}).join('\n')}

## 🏆 성과 및 개선 사항

### 주요 성과
${testResults.filter(r => r.percentage >= 90).map(r => 
    `- ${r.file.replace('tests/', '').replace('.test.js', '')}: ${r.percentage}% 성공률로 우수한 테스트 커버리지 달성`
).join('\n') || '- 90% 이상 성공률을 달성한 모듈이 없습니다.'}

### 개선 필요 영역
${testResults.filter(r => r.percentage < 80).map(r => 
    `- ${r.file.replace('tests/', '').replace('.test.js', '')}: ${r.percentage}% 성공률로 추가 개선 필요`
).join('\n') || '- 모든 모듈이 80% 이상의 성공률을 달성했습니다.'}

---

**리포트 생성:** 2nd Brain Standalone Test Runner
**Jest 버전:** ${require('./package.json').devDependencies.jest}
`;

// 리포트 파일 저장
const reportPath = `test-report-${timestamp}.md`;
fs.writeFileSync(reportPath, reportContent);

console.log(`\n📄 상세 리포트가 생성되었습니다: ${reportPath}`);

// 요약 메시지
console.log('\n' + '='.repeat(60));
if (overallPercentage >= 80) {
    console.log('🎉 축하합니다! 우수한 테스트 커버리지를 달성했습니다!');
} else if (overallPercentage >= 60) {
    console.log('👍 양호한 테스트 커버리지입니다. 조금 더 개선하면 완벽해집니다!');
} else {
    console.log('💪 테스트 커버리지 개선이 필요합니다. 실패한 테스트들을 검토해보세요.');
}

console.log('\n🚀 2nd Brain Standalone 테스트 실행 완료!\n');

// 종료 코드 설정 (실패가 있으면 1, 모두 성공하면 0)
process.exit(totalFailed > 0 ? 1 : 0);