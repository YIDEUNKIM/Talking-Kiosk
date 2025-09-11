@echo off
echo ========================================
echo   Talking Kiosk Backend Server
echo ========================================
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo    https://nodejs.org에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)

echo ✅ Node.js 버전:
node --version

REM 의존성 설치 확인
if not exist "node_modules" (
    echo.
    echo 📦 의존성 설치 중...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

REM 환경 변수 파일 확인
if not exist ".env" (
    echo.
    echo ⚠️  .env 파일이 없습니다.
    if exist ".env.example" (
        echo    .env.example을 .env로 복사합니다...
        copy ".env.example" ".env"
        echo    ✅ .env 파일이 생성되었습니다.
        echo    ⚠️  .env 파일에서 API 키를 설정해주세요.
    ) else (
        echo    ❌ .env.example 파일도 없습니다.
        pause
        exit /b 1
    )
)

REM 서버 시작
echo.
echo 🚀 서버를 시작합니다...
echo    서버 주소: http://localhost:3001
echo    종료하려면 Ctrl+C를 누르세요.
echo.

npm start

pause

