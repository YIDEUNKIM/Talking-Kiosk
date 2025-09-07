#!/usr/bin/env node

/**
 * AI 모델 테스트 스크립트
 * Gemma 모델이 제대로 작동하는지 확인
 */

const axios = require('axios');
const config = require('./config');

// 테스트할 명령어들
const testCommands = [
  '아메리카노 한 잔 주세요',
  '카페라떼 두 잔',
  '아이스 아메리카노',
  '뜨거운 카페라떼 라지 사이즈',
  '샷 추가한 아메리카노',
  '카드로 결제해주세요'
];

async function testAI() {
  console.log('🧪 AI 모델 테스트 시작...\n');
  
  const baseURL = `http://${config.server.host}:${config.server.port}`;
  
  try {
    // 1. 서버 상태 확인
    console.log('1️⃣ 서버 상태 확인...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 서버 상태:', healthResponse.data.status);
    
    // 2. 음성 처리 상태 확인
    console.log('\n2️⃣ 음성 처리 상태 확인...');
    const voiceStatusResponse = await axios.get(`${baseURL}/api/voice/status`);
    console.log('✅ 음성 처리 상태:', voiceStatusResponse.data.data.status);
    
    // 3. AI 서비스 상태 확인
    console.log('\n3️⃣ AI 서비스 상태 확인...');
    const aiStatusResponse = await axios.get(`${baseURL}/api/voice/ai-status`);
    const aiStatus = aiStatusResponse.data.data;
    console.log('✅ AI 서비스 상태:', {
      isReady: aiStatus.isReady,
      provider: aiStatus.provider,
      model: aiStatus.model,
      hasApiKey: aiStatus.hasApiKey
    });
    
    // 4. AI 모델 테스트
    console.log('\n4️⃣ AI 모델 테스트...');
    
    for (let i = 0; i < testCommands.length; i++) {
      const command = testCommands[i];
      console.log(`\n📝 테스트 ${i + 1}: "${command}"`);
      
      try {
        const startTime = Date.now();
        const response = await axios.post(`${baseURL}/api/voice/test-ai`, {
          text: command
        });
        const endTime = Date.now();
        
        if (response.data.success) {
          const analysis = response.data.data.analysis;
          console.log(`✅ 성공 (${endTime - startTime}ms)`);
          console.log(`   의도: ${analysis.intent}`);
          console.log(`   아이템 수: ${analysis.items.length}`);
          console.log(`   총 가격: ${analysis.totalPrice}원`);
          console.log(`   응답: ${analysis.response}`);
          console.log(`   다음 액션: ${analysis.nextAction}`);
        } else {
          console.log('❌ 실패:', response.data.error);
        }
      } catch (error) {
        console.log('❌ 오류:', error.response?.data?.error || error.message);
      }
      
      // 요청 간 간격
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 AI 모델 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 해결 방법:');
      console.log('   1. 백엔드 서버가 실행 중인지 확인하세요');
      console.log('   2. cd backend && npm start');
      console.log('   3. .env 파일에서 HUGGINGFACE_API_KEY가 설정되어 있는지 확인하세요');
    }
  }
}

// 테스트 실행
testAI();
