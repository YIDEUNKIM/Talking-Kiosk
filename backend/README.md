# Talking Kiosk Backend

음성 지원 키오스크 백엔드 서버입니다. Express.js와 Socket.IO를 사용하여 실시간 음성 처리 및 주문 관리를 제공합니다.

## 주요 기능

- 🎤 **음성 인식 (STT)**: 사용자 음성을 텍스트로 변환
- 🔊 **음성 합성 (TTS)**: 텍스트를 음성으로 변환하여 응답
- 🤖 **AI 자연어 처리**: Hugging Face Gemma-2-2b-it 모델을 사용한 주문 의도 분석
- 📱 **실시간 통신**: Socket.IO를 통한 실시간 데이터 교환
- 🛒 **주문 관리**: JSON 파일 기반 주문 데이터 관리
- 📊 **통계 및 모니터링**: 주문 통계 및 시스템 모니터링

## 기술 스택

- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **Socket.IO** - 실시간 통신
- **Hugging Face** - Gemma AI 모델 API
- **Winston** - 로깅
- **Multer** - 파일 업로드
- **JSON** - 데이터 저장소

## 설치 및 실행

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env
```

주요 설정값:
- `HUGGINGFACE_API_KEY`: Hugging Face API 키 (필수)
- `AI_MODEL_NAME`: 사용할 Gemma 모델 (기본값: google/gemma-2-2b-it)
- `PORT`: 서버 포트 (기본값: 3001)
- `NODE_ENV`: 환경 설정 (development/production)

### 3. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 음성 처리
- `POST /api/voice/upload` - 음성 파일 업로드 및 STT
- `POST /api/voice/tts` - 텍스트를 음성으로 변환
- `POST /api/voice/process` - 음성 명령 처리
- `GET /api/voice/status` - 음성 처리 상태 확인
- `GET /api/voice/ai-status` - AI 서비스 상태 확인
- `POST /api/voice/test-ai` - AI 모델 테스트

### 주문 관리
- `POST /api/order` - 새 주문 생성
- `GET /api/order/:orderId` - 주문 조회
- `PUT /api/order/:orderId/status` - 주문 상태 업데이트
- `POST /api/order/:orderId/payment` - 결제 완료
- `GET /api/order/recent` - 최근 주문 목록

### 메뉴 관리
- `GET /api/menu` - 전체 메뉴 조회
- `GET /api/menu/category/:categoryId` - 카테고리별 메뉴
- `GET /api/menu/item/:itemId` - 특정 메뉴 아이템
- `GET /api/menu/search` - 메뉴 검색

## Socket.IO 이벤트

### 클라이언트 → 서버
- `voice:start` - 음성 스트림 시작
- `voice:data` - 음성 데이터 전송
- `voice:stop` - 음성 스트림 종료
- `order:create` - 주문 생성
- `order:update` - 주문 업데이트
- `payment:complete` - 결제 완료

### 서버 → 클라이언트
- `voice:result` - 음성 처리 결과
- `voice:tts` - TTS 오디오 응답
- `order:created` - 주문 생성 완료
- `order:status_changed` - 주문 상태 변경
- `payment:completed` - 결제 완료 알림

## 프로젝트 구조

```
backend/
├── config.js              # 설정 파일
├── server.js              # 메인 서버 파일
├── package.json           # 의존성 및 스크립트
├── data/                  # 데이터 파일
│   ├── menu.json         # 메뉴 데이터
│   └── orders/           # 주문 데이터
├── services/             # 비즈니스 로직
│   ├── aiService.js      # AI 모델 서비스
│   ├── voiceService.js   # 음성 처리 서비스
│   ├── orderService.js   # 주문 관리 서비스
│   └── menuService.js    # 메뉴 관리 서비스
├── routes/               # API 라우트
│   ├── voice.js         # 음성 처리 라우트
│   ├── order.js         # 주문 관리 라우트
│   └── menu.js          # 메뉴 관리 라우트
├── middleware/           # 미들웨어
│   ├── errorHandler.js  # 에러 처리
│   └── rateLimiter.js   # 레이트 리미팅
├── socket/              # Socket.IO 핸들러
│   └── socketHandler.js # 소켓 이벤트 처리
├── utils/               # 유틸리티
│   └── logger.js        # 로깅 시스템
└── uploads/             # 업로드 파일
    └── voice/           # 음성 파일
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `NODE_ENV` | 실행 환경 | development |
| `PORT` | 서버 포트 | 3001 |
| `HUGGINGFACE_API_KEY` | Hugging Face API 키 (필수) | - |
| `AI_MODEL_NAME` | Gemma 모델 이름 | google/gemma-2-2b-it |
| `VOICE_TIMEOUT` | 음성 처리 타임아웃 | 10000 |
| `LOG_LEVEL` | 로그 레벨 | info |

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `routes/` 디렉토리에 새 라우트 파일 생성
2. `server.js`에서 라우트 등록
3. 필요한 서비스 로직을 `services/`에 구현

### 새로운 Socket.IO 이벤트 추가

1. `socket/socketHandler.js`에서 이벤트 핸들러 구현
2. 클라이언트와 서버 간 이벤트 명명 규칙 정의

### 로깅

Winston을 사용한 구조화된 로깅:
```javascript
const logger = require('../utils/logger');
logger.info('메시지', { 추가데이터 });
```

## 문제 해결

### 일반적인 문제

1. **포트 충돌**: 다른 포트 사용 또는 기존 프로세스 종료
2. **API 키 오류**: Hugging Face API 키 확인
3. **파일 권한**: uploads 디렉토리 쓰기 권한 확인

### 로그 확인

```bash
# 로그 파일 위치
tail -f logs/combined.log
tail -f logs/error.log
```

## 라이선스

MIT License
