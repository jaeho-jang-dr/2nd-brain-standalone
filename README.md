# 🧠 2nd Brain - iPhone 단독 실행용 PWA

## 📱 iPhone Safari 접속 주소

**정확한 접속 주소**:
```
https://jaeho-jang-dr.github.io/2nd-brain-standalone
```

GitHub 사용자명: `jaeho-jang-dr`

## 🚀 GitHub Pages 배포 방법

### 1단계: GitHub 계정 준비
1. [GitHub.com](https://github.com)에서 계정 생성/로그인
2. 새 리포지토리 생성: `2nd-brain-standalone`

### 2단계: 파일 업로드
1. GitHub에서 새 리포지토리 생성: `2nd-brain-standalone`
2. 다음 파일들을 리포지토리 루트에 업로드:
   - `index.html` (메인 PWA 인터페이스)
   - `app.js` (앱 로직 + Claude AI 통합)
   - `claude-ai.js` (Claude AI 전용 모듈)
   - `manifest.json` (PWA 매니페스트)
   - `sw.js` (서비스 워커)

### 3단계: GitHub Pages 활성화
1. 리포지토리 → **Settings** 탭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. Source에서 **Deploy from a branch** 선택
4. Branch에서 **main** 선택
5. **Save** 클릭

### 4단계: 배포 완료 확인
- 몇 분 후 다음 주소로 접속 가능:
```
https://jaeho-jang-dr.github.io/2nd-brain-standalone
```

## 📱 iPhone에서 설치 방법

### 1️⃣ Safari로 접속
```
https://jaeho-jang-dr.github.io/2nd-brain-standalone
```

### 2️⃣ PWA 설치
1. Safari 하단의 **공유 버튼**(📤) 터치
2. **"홈 화면에 추가"** 선택
3. 앱 이름 확인 후 **"추가"** 터치

### 3️⃣ 앱 실행
- 홈 화면의 🧠 **2nd Brain** 아이콘 터치
- 네이티브 앱처럼 전체 화면으로 실행됨

## 🔗 예시 주소들

GitHub 사용자명에 따른 실제 접속 주소 예시:

```bash
# 귀하의 정확한 GitHub Pages 주소
https://jaeho-jang-dr.github.io/2nd-brain-standalone

# 리포지토리 주소
https://github.com/jaeho-jang-dr/2nd-brain-standalone
```

## ⚡ 빠른 테스트 방법

배포 후 iPhone Safari에서 접속하여 확인사항:

✅ **로딩 확인**: 🧠 2nd Brain 화면이 표시되는가?  
✅ **음성 기능**: "말하기" 버튼이 작동하는가?  
✅ **사진 기능**: 📸 버튼으로 카메라가 열리는가?  
✅ **PWA 설치**: "홈 화면에 추가" 옵션이 있는가?  
✅ **AI 기능**: 온라인 상태에서 Claude AI가 응답하는가?

## 🆘 문제 해결

### ❓ 404 에러가 나는 경우
- GitHub Pages 활성화가 완료되었는지 확인 (최대 10분 소요)
- 리포지토리명이 정확한지 확인: `2nd-brain-standalone`
- 파일들이 루트 디렉토리에 있는지 확인

### ❓ 앱이 제대로 로드되지 않는 경우
- `index.html` 파일이 업로드되었는지 확인
- 모든 파일(`app.js`, `claude-ai.js`, `manifest.json`, `sw.js`)이 같은 폴더에 있는지 확인

### ❓ AI 기능이 작동하지 않는 경우
- 인터넷 연결 상태 확인
- 개발자 콘솔에서 API 오류 확인 (Safari → 개발자 → 콘솔)

## 📞 지원

배포나 사용 중 문제가 있으면:
1. GitHub 리포지토리 설정 재확인
2. 파일 업로드 상태 확인  
3. iPhone Safari 권한 설정 확인