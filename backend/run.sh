#!/bin/bash

echo "========================================"
echo "  Talking Kiosk Backend Server"
echo "========================================"
echo

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    echo "   https://nodejs.org에서 Node.js를 설치해주세요."
    exit 1
fi

echo "✅ Node.js 버전:"
node --version

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo
    echo "📦 의존성 설치 중..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 의존성 설치에 실패했습니다."
        exit 1
    fi
fi

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo
    echo "⚠️  .env 파일이 없습니다."
    if [ -f ".env.example" ]; then
        echo "   .env.example을 .env로 복사합니다..."
        cp ".env.example" ".env"
        echo "   ✅ .env 파일이 생성되었습니다."
        echo "   ⚠️  .env 파일에서 API 키를 설정해주세요."
    else
        echo "   ❌ .env.example 파일도 없습니다."
        exit 1
    fi
fi

# 서버 시작
echo
echo "🚀 서버를 시작합니다..."
echo "   서버 주소: http://localhost:3001"
echo "   종료하려면 Ctrl+C를 누르세요."
echo

npm start
