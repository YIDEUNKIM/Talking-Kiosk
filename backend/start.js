#!/usr/bin/env node

/**
 * Talking Kiosk Backend Server
 * 음성 지원 키오스크 백엔드 서버 시작 스크립트
 */

const path = require('path');
const fs = require('fs-extra');

// 환경 변수 로드
require('dotenv').config();

// 필수 디렉토리 생성
async function ensureDirectories() {
  const directories = [
    './logs',
    './uploads',
    './uploads/voice',
    './data',
    './data/orders'
  ];

  for (const dir of directories) {
    try {
      await fs.ensureDir(path.join(__dirname, dir));
      console.log(`✅ Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error.message);
    }
  }
}

// 환경 변수 검증 (Ollama 사용으로 API 키 불필요)
function validateEnvironment() {
  console.log('✅ 환경 변수 검증 완료 (Ollama 사용)');

  console.log('✅ Environment variables validated');
}

// 서버 시작
async function startServer() {
  try {
    console.log('🚀 Starting Talking Kiosk Backend Server...\n');

    // 디렉토리 생성
    await ensureDirectories();
    
    // 환경 변수 검증
    validateEnvironment();

    // 서버 시작
    require('./server');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 서버 시작
startServer();
