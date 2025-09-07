#!/usr/bin/env node

/**
 * Talking Kiosk Backend Setup Script
 * 백엔드 서버 초기 설정 스크립트
 */

const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('🔧 Setting up Talking Kiosk Backend...\n');

  try {
    // 1. 필수 디렉토리 생성
    console.log('📁 Creating directories...');
    const directories = [
      './logs',
      './uploads',
      './uploads/voice',
      './data',
      './data/orders'
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(__dirname, dir));
      console.log(`   ✅ ${dir}`);
    }

    // 2. 환경 변수 파일 확인
    console.log('\n🔐 Checking environment configuration...');
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');

    if (!await fs.pathExists(envPath)) {
      if (await fs.pathExists(envExamplePath)) {
        await fs.copy(envExamplePath, envPath);
        console.log('   ✅ .env file created from .env.example');
        console.log('   ⚠️  Please update .env file with your actual API keys');
      } else {
        console.log('   ⚠️  .env file not found. Please create one manually.');
      }
    } else {
      console.log('   ✅ .env file exists');
    }

    // 3. 메뉴 데이터 확인
    console.log('\n📋 Checking menu data...');
    const menuPath = path.join(__dirname, 'data/menu.json');
    if (await fs.pathExists(menuPath)) {
      console.log('   ✅ Menu data exists');
    } else {
      console.log('   ⚠️  Menu data not found');
    }

    // 4. 주문 데이터 초기화
    console.log('\n🛒 Initializing order data...');
    const ordersPath = path.join(__dirname, 'data/orders/orders.json');
    if (!await fs.pathExists(ordersPath)) {
      const initialOrdersData = {
        orders: [],
        lastOrderId: 0,
        statistics: {
          totalOrders: 0,
          totalRevenue: 0,
          popularItems: {}
        }
      };
      await fs.writeJson(ordersPath, initialOrdersData, { spaces: 2 });
      console.log('   ✅ Order data initialized');
    } else {
      console.log('   ✅ Order data exists');
    }

    // 5. 로그 파일 생성
    console.log('\n📝 Setting up logging...');
    const logFiles = ['combined.log', 'error.log'];
    for (const logFile of logFiles) {
      const logPath = path.join(__dirname, 'logs', logFile);
      if (!await fs.pathExists(logPath)) {
        await fs.writeFile(logPath, '');
        console.log(`   ✅ ${logFile} created`);
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update .env file with your Hugging Face API key');
    console.log('   2. Run "npm start" to start the server');
    console.log('   3. Run "npm run dev" for development mode');
    console.log('\n🌐 Server will be available at: http://localhost:3001');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
