# 음성 주문 키오스크 프로토타입 (Web Speech API)

기존 React 키오스크 앱에 **Web Speech API**를 활용한 음성 주문 기능을 추가한 프로토타입입니다.

## 🎯 주요 기능

- **브라우저 내장 음성 인식**: Web Speech API 기반 음성 인식
- **음성 합성**: 브라우저 내장 TTS로 응답
- **실시간 처리**: 빠른 음성 인식 및 명령 처리
- **음성 주문**: "아이스 아메리카노 한 잔 주세요" → 자동으로 장바구니에 추가
- **특별 명령어**: 
  - "아아 한 잔 주세요" → 아이스 아메리카노 추가
  - "아샷추 두 잔 주세요" → 아메리카노 더블샷 2개 추가
- **결제 명령**: "결제해주세요" → 결제 페이지로 이동
- **간단한 설정**: 별도 API 키 불필요

## 🚀 실행 방법

### 1. 백엔드 서버 설치 및 실행

```bash
# 서버 의존성 설치
npm install express ws cors

# 서버 실행
node server.js
```

또는 개발 모드로 실행:
```bash
npx nodemon server.js
```

서버가 성공적으로 실행되면:
- WebSocket: `ws://localhost:3001`
- HTTP API: `http://localhost:3001`
- Web Speech API 준비 완료

### 2. 프론트엔드 실행

새 터미널에서:
```bash
# React 앱 실행
npm start
```

브라우저에서 `http://localhost:3000`으로 접속

## 🎤 음성 명령어 예시

### 메뉴 주문
- "아메리카노 한 잔 주세요"
- "아이스 아메리카노 두 잔 주세요"  
- "아아 한 잔 주세요" (아이스 아메리카노)
- "아샷추 주세요" (아메리카노 더블샷)
- "카페라떼 한 잔 주세요"
- "뜨거운 카페라떼 주세요"

### 결제
- "결제해주세요"
- "계산해주세요"
- "주문완료"

## 🔧 시스템 구조

```
사용자 음성 → 브라우저(Web Speech API) → WebSocket → Node.js 서버
                     ↓                                     ↓
               음성 인식 결과                        명령 파싱 및 처리
                     ↓                                     ↓
               브라우저 TTS ← WebSocket ← 응답 메시지 ← 장바구니 업데이트
```

### 주요 컴포넌트
- **server.js**: Node.js WebSocket 서버, 음성 명령 파싱
- **parseVoiceCommand**: 음성 명령어 해석 함수
- **VoiceContext.js**: React Context로 Web Speech API 관리
- **MenuPage.js**: 메인 키오스크 화면 (음성 기능 통합)
- **VoiceButton.js**: 음성 인식 버튼 컴포넌트

## 📱 사용 방법

1. 앱 실행 후 우상단의 **음성 버튼** 클릭
2. "말씀하세요, 듣고 있습니다" 음성 안내 후 주문
3. 음성 주문이 자동으로 장바구니에 추가됨
4. "결제해주세요"로 결제 진행

## 🛠️ 기술 스택

- **Frontend**: React, Web Speech API (STT/TTS), WebSocket 통신
- **Backend**: Node.js, WebSocket, Express
- **Speech**: Web Speech API (브라우저 내장)
- **Communication**: WebSocket 실시간 메시지 통신

## ⚠️ 주의사항

- **Chrome/Edge 브라우저 권장**: Web Speech API 완전 지원
- **마이크 권한 허용 필요**: 브라우저에서 마이크 접근 허용
- **HTTPS 권장**: 프로덕션 환경에서는 HTTPS 필요 (localhost는 HTTP 가능)
- **서버 우선 실행**: 백엔드 서버 → 프론트엔드 순서로 실행
- **한국어 최적화**: 음성 인식 및 응답이 한국어로 설정됨
- **API 키 불필요**: 별도의 외부 API 키 설정 필요 없음

## 🔍 트러블슈팅

### 음성 인식이 안 될 때
- 브라우저에서 마이크 권한 확인
- Chrome/Edge 브라우저 사용 (Web Speech API 완전 지원)
- 마이크가 제대로 연결되어 있는지 확인
- 조용한 환경에서 테스트

### WebSocket 연결 실패 시
- 서버가 3001 포트에서 실행 중인지 확인
- 방화벽 설정 확인
- 브라우저 개발자 도구 콘솔에서 오류 메시지 확인

### 음성 합성 문제
- 브라우저의 자동 재생 정책으로 인한 문제일 수 있음
- 사용자 상호작용 후 음성 재생이 시작됨
- 스피커/헤드폰이 제대로 연결되어 있는지 확인
- 브라우저 음량 설정 확인

## 📄 API 엔드포인트

- `GET /api/orders` - 현재 주문 목록 조회
- `POST /api/orders/clear` - 주문 초기화  
- `GET /api/menu` - 메뉴 및 별칭 정보
