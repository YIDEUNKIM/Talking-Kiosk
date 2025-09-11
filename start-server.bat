@echo off
echo ====================================
echo Web Speech API 음성 주문 키오스크 서버 시작
echo ====================================

echo.
echo 1. 서버 의존성 설치 중...
call npm install express ws cors

echo.
echo 2. Web Speech API 서버 실행 중...
echo WebSocket: ws://localhost:3001
echo HTTP API: http://localhost:3001
echo Web Speech API 준비 완료
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

node server.js

pause
