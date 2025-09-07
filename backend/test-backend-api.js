const axios = require('axios');

async function testBackendAPI() {
  console.log('�� 백엔드 API 테스트 시작...\n');
  
  try {
    // 1단계: 서버 상태 확인
    console.log('1️⃣ 서버 상태 확인...');
    const statusResponse = await axios.get('http://localhost:3001/api/voice/status');
    console.log('✅ 서버 상태:', statusResponse.data.data.status);
    
    // 2단계: AI 서비스 상태 확인
    console.log('\n2️⃣ AI 서비스 상태 확인...');
    const aiStatusResponse = await axios.get('http://localhost:3001/api/voice/ai-status');
    console.log('✅ AI 서비스 상태:', aiStatusResponse.data.data);
    
    // 3단계: AI 테스트
    console.log('\n3️⃣ AI 모델 테스트...');
    const testResponse = await axios.post('http://localhost:3001/api/voice/test-ai', {
      text: '아메리카노 한 잔 주세요'
    });
    
    console.log('✅ AI 테스트 결과:');
    console.log('   📊 전체 응답:', JSON.stringify(testResponse.data, null, 2));
    
    if (testResponse.data.data) {
      const result = testResponse.data.data;
      console.log('\n📋 상세 분석:');
      console.log('   🎯 의도:', result.intent);
      console.log('   📦 주문 항목 수:', result.items ? result.items.length : 0);
      
      if (result.items && result.items.length > 0) {
        console.log('   📦 주문 항목 상세:');
        result.items.forEach((item, index) => {
          console.log(`      ${index + 1}. 메뉴 ID: ${item.menuId}`);
          console.log(`         이름: ${item.name}`);
          console.log(`         수량: ${item.quantity}`);
          console.log(`         옵션:`, JSON.stringify(item.options, null, 8));
        });
      } else {
        console.log('   ⚠️ 주문 항목이 비어있습니다!');
      }
      
      console.log('   💰 총 가격:', result.totalPrice, '원');
      console.log('   💬 응답 메시지:', result.response);
      console.log('   ⏭️ 다음 액션:', result.nextAction);
    }
    
  } catch (error) {
    console.log('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.log('📊 응답 상태:', error.response.status);
      console.log('📊 응답 데이터:', error.response.data);
    }
  }
}

testBackendAPI();
