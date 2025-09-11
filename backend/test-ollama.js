const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testOllama() {
  console.log('🦙 Ollama 로컬 AI 모델 테스트 시작...\n');
  
  const ollamaUrl = 'http://localhost:11434';
  const modelName = 'gemma3:4b';
  
  try {
    // 1단계: Ollama 서버 상태 확인
    console.log('1️⃣ Ollama 서버 상태 확인...');
    try {
      const response = await axios.get(`${ollamaUrl}/api/tags`);
      console.log('✅ Ollama 서버 실행 중');
      console.log('📋 사용 가능한 모델들:');
      
      if (response.data && response.data.models) {
        response.data.models.forEach(model => {
          const sizeInGB = (model.size / 1024 / 1024 / 1024).toFixed(1);
          console.log(`   - ${model.name} (${sizeInGB}GB)`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('❌ Ollama 서버가 실행되지 않음');
      console.log('💡 Ollama 설치 및 실행 방법:');
      console.log('   1. https://ollama.ai/download 에서 다운로드');
      console.log('   2. 설치 후 터미널에서 실행:');
      console.log('      ollama serve');
      console.log('   3. Gemma 모델 다운로드:');
      console.log('      ollama pull gemma3:4b');
      console.log('   4. 모델 실행:');
      console.log('      ollama run gemma3:4b');
      return;
    }
    
    // 2단계: 메뉴 데이터 로드
    console.log('2️⃣ 메뉴 데이터 로드...');
    let menuData;
    try {
      const menuPath = path.join(__dirname, 'data', 'menu.json');
      const menuContent = fs.readFileSync(menuPath, 'utf8');
      menuData = JSON.parse(menuContent);
      console.log('✅ 메뉴 데이터 로드 완료');
      console.log(`📋 카테고리 수: ${menuData.categories.length}`);
      console.log('');
    } catch (error) {
      console.log('❌ 메뉴 데이터 로드 실패:', error.message);
      return;
    }
    
    // 3단계: 프롬프트 엔지니어링 함수
    function buildOrderAnalysisPrompt(userInput, menuData, context = {}) {
      const menuItems = flattenMenuItems(menuData);
      
      return `당신은 카페 키오스크의 AI 어시스턴트입니다. 사용자의 음성 입력을 분석하여 주문을 처리해주세요.

사용자 입력: "${userInput}"
현재 페이지: ${context.currentPage || 'menu'}

사용 가능한 메뉴:
${menuItems.map(item => `- ${item.name} (${item.id}): ${item.price}원`).join('\n')}

다음 JSON 형식으로 응답해주세요:
{
  "intent": "order" | "question" | "cancel" | "payment",
  "items": [
    {
      "menuId": "메뉴 ID",
      "name": "메뉴 이름",
      "quantity": 숫자,
      "options": {
        "temperature": "hot" | "ice",
        "size": "regular" | "large",
        "shot": "single" | "double",
        "milk": "whole" | "skim" | "oat" | "almond",
        "sweetness": "none" | "less" | "normal" | "more"
      }
    }
  ],
  "totalPrice": 총가격,
  "response": "사용자에게 들려줄 응답 메시지",
  "nextAction": "continue" | "confirm" | "payment" | "complete"
}

규칙:
1. "아아", "아메리카노" → 아이스 아메리카노로 해석
2. "뜨아", "뜨거운 아메리카노" → 핫 아메리카노로 해석
3. "두 잔", "2개" → quantity: 2
4. "큰 거", "라지" → size: "large"
5. "샷 추가" → shot: "double"
6. "우유 변경" → milk 옵션 변경
7. 가격은 메뉴 데이터의 price * quantity로 계산
8. 응답은 친근하고 자연스러운 한국어로 작성

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
    }
    
    function flattenMenuItems(menuData) {
      const items = [];
      if (menuData.categories) {
        menuData.categories.forEach(category => {
          if (category.items) {
            category.items.forEach(item => {
              items.push({
                id: item.id,
                name: item.name,
                price: item.price,
                category: category.name
              });
            });
          }
        });
      }
      return items;
    }
    
    // 4단계: 테스트 프롬프트들
    console.log('3️⃣ 프롬프트 엔지니어링 테스트...');
    const testPrompts = [
      "아메리카노 한 잔 주세요",
      "아이스 카페라떼 라지 사이즈로 두 잔 주문하고, 샷도 추가해주세요",
      "뜨거운 아메리카노에 샷 추가하고, 오트밀크로 변경해주세요"
    ];
    
    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n📝 테스트 ${i + 1}: "${prompt}"`);
      
      try {
        const startTime = Date.now();
        
        // 프롬프트 엔지니어링 적용
        const engineeredPrompt = buildOrderAnalysisPrompt(prompt, menuData, { currentPage: 'menu' });
        
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
          model: modelName,
          prompt: engineeredPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            repeat_penalty: 1.1,
            num_predict: 500
          }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ 성공 (${duration}ms)`);
        console.log(`🤖 응답: ${response.data.response}`);
        
        // JSON 파싱 시도
        try {
          const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            console.log(`📊 파싱된 결과:`);
            console.log(`   - 의도: ${parsedResponse.intent}`);
            console.log(`   - 주문 항목: ${parsedResponse.items.length}개`);
            console.log(`   - 총 가격: ${parsedResponse.totalPrice}원`);
            console.log(`   - 다음 액션: ${parsedResponse.nextAction}`);
            console.log(`   - 응답 메시지: ${parsedResponse.response}`);
          } else {
            console.log(`⚠️ JSON 형식이 아닌 응답`);
          }
        } catch (parseError) {
          console.log(`⚠️ JSON 파싱 실패: ${parseError.message}`);
        }
        
        console.log(`📊 토큰 수: ${response.data.response.split(' ').length}`);
        
      } catch (error) {
        console.log(`❌ 실패: ${error.message}`);
        if (error.response?.status === 404) {
          console.log('💡 Gemma 모델이 설치되지 않음');
          console.log('   터미널에서 실행: ollama pull gemma3:4b');
        }
        console.log('');
      }
      
      // 요청 간 간격
      if (i < testPrompts.length - 1) {
        console.log('⏳ 2초 대기 중...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 프롬프트 엔지니어링 테스트 완료!');
    console.log('\n📋 다음 단계:');
    console.log('   1. 백엔드에서 Ollama API 호출');
    console.log('   2. aiService.js를 Ollama로 수정');
    console.log('   3. 백엔드 서버 실행: npm start');
    
  } catch (error) {
    console.log('❌ 예상치 못한 오류:', error.message);
  }
}

testOllama();