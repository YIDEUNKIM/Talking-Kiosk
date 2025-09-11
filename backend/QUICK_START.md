# 🚀 Talking Kiosk Backend - 빠른 시작 가이드

## 📋 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Hugging Face API 키

## ⚡ 빠른 실행

### Windows 사용자
```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 실행 스크립트 실행
run.bat
```

### Linux/Mac 사용자
```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 실행 스크립트 실행
./run.sh
```

### 수동 실행
```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에서 HUGGINGFACE_API_KEY 설정

# 3. 서버 시작
npm start
```

## 🔧 환경 설정

### 1. Hugging Face API 키 발급
1. [Hugging Face](https://huggingface.co) 계정 생성
2. Settings → Access Tokens에서 새 토큰 생성
3. `.env` 파일에 `HUGGINGFACE_API_KEY=your-token-here` 추가

### 2. 환경 변수 설정
`.env` 파일에서 다음 값들을 설정하세요:

```env
# 필수 설정
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

# 선택적 설정
PORT=3001
NODE_ENV=development
```

## 🌐 서버 접속

서버가 성공적으로 시작되면 다음 주소에서 접속할 수 있습니다:

- **메인 서버**: http://localhost:3001
- **헬스 체크**: http://localhost:3001/health
- **API 문서**: http://localhost:3001/api/menu

## 📡 API 테스트

### 1. 헬스 체크
```bash
curl http://localhost:3001/health
```

### 2. 메뉴 조회
```bash
curl http://localhost:3001/api/menu
```

### 3. 음성 처리 상태 확인
```bash
curl http://localhost:3001/api/voice/status
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::3001
```
**해결방법**: 다른 포트 사용하거나 기존 프로세스 종료
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

#### 2. API 키 오류
```
Error: Invalid API key
```
**해결방법**: `.env` 파일에서 `HUGGINGFACE_API_KEY` 확인

#### 3. 의존성 설치 실패
```
npm ERR! peer dep missing
```
**해결방법**: Node.js 버전 확인 및 재설치
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📊 모니터링

### 로그 확인
```bash
# 실시간 로그 확인
tail -f logs/combined.log

# 에러 로그만 확인
tail -f logs/error.log
```

### 서버 상태 확인
```bash
curl http://localhost:3001/health
```

## 🧪 테스트 실행

```bash
# 전체 테스트 실행
npm test

# 특정 테스트 실행
npm test test/test-server.js
npm test test/test-services.js
```

## 📱 프론트엔드 연동

프론트엔드에서 백엔드와 연동하려면:

1. **API 엔드포인트**: `http://localhost:3001/api/`
2. **Socket.IO**: `http://localhost:3001`
3. **CORS**: 이미 설정되어 있음

### 프론트엔드 설정 예시
```javascript
// API 호출
const response = await fetch('http://localhost:3001/api/menu');
const menuData = await response.json();

// Socket.IO 연결
const socket = io('http://localhost:3001');
```

## 🆘 지원

문제가 발생하면:

1. 로그 파일 확인 (`logs/` 디렉토리)
2. 환경 변수 설정 확인
3. Node.js 버전 확인 (16.x 이상)
4. 네트워크 연결 확인

## 📚 추가 정보

- **상세 문서**: [README.md](./README.md)
- **API 문서**: 서버 실행 후 http://localhost:3001/api/menu
- **소스 코드**: 각 서비스별로 `services/` 디렉토리 참조

