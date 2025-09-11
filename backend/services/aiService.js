const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.modelName = 'gemma3:27b';
    this.initializeClient();
  }

  initializeClient() {
    try {
      logger.info('🤖 AI 서비스 초기화 시작:', {
        provider: 'ollama',
        modelName: this.modelName,
        ollamaUrl: this.ollamaUrl
      });

      logger.info('✅ Ollama 클라이언트 초기화 완료:', {
        modelName: this.modelName,
        url: this.ollamaUrl
      });

      logger.info('🎯 AI 서비스 준비 완료:', {
        provider: 'ollama',
        model: this.modelName,
        isReady: true
      });

    } catch (error) {
      logger.error('❌ AI 클라이언트 초기화 실패:', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * 음성 입력을 분석하여 주문 의도를 파악
   * @param {string} userInput - 사용자 음성 입력 텍스트
   * @param {Object} menuData - 메뉴 데이터
   * @param {Object} context - 현재 컨텍스트 정보
   * @returns {Object} 분석 결과
   */
  async analyzeIntent(userInput, menuData, context = {}) {
    try {
      logger.info('🧠 AI 주문 의도 분석 시작:', {
        userInput, 
        context,
        timestamp: new Date().toISOString()
      });

      const prompt = this.buildOrderAnalysisPrompt(userInput, menuData, context);
      logger.info('📝 AI 프롬프트 생성 완료:', { 
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...'
      });
      
      logger.info('🤗 Ollama Gemma API 호출 시작:', {
        model: this.modelName,
        promptLength: prompt.length
      });

      const response = await this.queryGemmaModel(prompt);
      
      logger.info('🤗 Ollama Gemma API 응답 받음:', {
        responseLength: response ? response.length : 0,
        responsePreview: response ? response.substring(0, 200) + '...' : 'null'
      });

      const result = this.parseAIResponse(response);
      logger.info('✅ AI 분석 결과:', {
        intent: result.intent,
        itemsCount: result.items.length,
        totalPrice: result.totalPrice,
        response: result.response,
        nextAction: result.nextAction
      });
      
      return result;
    } catch (error) {
      logger.error('❌ AI 주문 의도 분석 실패:', error);
      throw new Error('AI_MODEL_ERROR');
    }
  }

  buildOrderAnalysisPrompt(userInput, menuData, context) {
    const menuItems = this.flattenMenuItems(menuData);
    
    return `사용자 입력: "${userInput}"

입력 텍스트를 분석하여 다음 중 하나의 JSON을 정확히 반환하세요:

"아메리카노"가 포함된 경우:
{"intent": "order", "items": [{"menuId": "americano", "name": "아메리카노", "price": 2500, "quantity": 1, "options": {"temperature": "ice"}}], "totalPrice": 2500, "response": "아메리카노가 장바구니에 추가되었습니다", "nextAction": "continue"}

"라떼" 또는 "카페라떼"가 포함된 경우:
{"intent": "order", "items": [{"menuId": "cafelatte", "name": "카페라떼", "price": 3900, "quantity": 1, "options": {"temperature": "hot"}}], "totalPrice": 3900, "response": "카페라떼가 장바구니에 추가되었습니다", "nextAction": "continue"}

"모카" 또는 "카페모카"가 포함된 경우:
{"intent": "order", "items": [{"menuId": "mocha", "name": "카페모카", "price": 4500, "quantity": 1, "options": {"temperature": "hot"}}], "totalPrice": 4500, "response": "카페모카가 장바구니에 추가되었습니다", "nextAction": "continue"}

"결제", "계산", "돈", "카드"가 포함된 경우:
{"intent": "payment", "items": [], "totalPrice": 0, "response": "결제 페이지로 이동합니다", "nextAction": "payment"}

그 외의 경우:
{"intent": "question", "items": [], "totalPrice": 0, "response": "무엇을 도와드릴까요?", "nextAction": "continue"}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;
  }

  flattenMenuItems(menuData) {
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

  async queryGemmaModel(prompt) {
    try {
      logger.info('🚀 Ollama Gemma 모델 API 요청 시작:', {
        model: this.modelName,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      
      // Ollama API 호출
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
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

      logger.info('🎯 Ollama Gemma 모델 API 응답 성공:', {
        duration: `${duration}ms`,
        responseLength: response.data.response ? response.data.response.length : 0,
        model: this.modelName,
        tokensGenerated: response.data.response ? response.data.response.split(' ').length : 0
      });

      return response.data.response;
    } catch (error) {
      logger.error('❌ Ollama Gemma 모델 API 오류:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        model: this.modelName,
        promptLength: prompt.length,
        errorDetails: error.response?.data || error
      });
      
      throw error;
    }
  }

  parseAIResponse(response) {
    try {
      logger.info('🔍 AI 응답 파싱 시작:', {
        responseLength: response ? response.length : 0,
        responsePreview: response ? response.substring(0, 100) + '...' : 'null'
      });

      if (!response) {
        throw new Error('Empty response from AI model');
      }

      // JSON 부분만 추출
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      logger.info('✅ AI 응답 파싱 성공:', {
        intent: parsedResponse.intent,
        itemsCount: parsedResponse.items ? parsedResponse.items.length : 0,
        totalPrice: parsedResponse.totalPrice,
        nextAction: parsedResponse.nextAction
      });

      return {
        intent: parsedResponse.intent || 'question',
        items: parsedResponse.items || [],
        totalPrice: parsedResponse.totalPrice || 0,
        response: parsedResponse.response || '죄송합니다. 다시 말씀해 주시겠어요?',
        nextAction: parsedResponse.nextAction || 'continue'
      };
    } catch (error) {
      logger.error('❌ AI 응답 파싱 실패:', {
        error: error.message,
        response: response ? response.substring(0, 200) : 'null'
      });
      
      return {
        intent: 'question',
        items: [],
        totalPrice: 0,
        response: '죄송합니다. 다시 말씀해 주시겠어요?',
        nextAction: 'continue'
      };
    }
  }

  formatOrderMessage(orderData) {
    const itemMessages = orderData.items.map(item => {
      const options = [];
      if (item.options.temperature && item.options.temperature !== 'hot') {
        options.push(item.options.temperature === 'ice' ? '아이스' : item.options.temperature);
      }
      if (item.options.size && item.options.size !== 'regular') {
        options.push(item.options.size === 'large' ? '라지' : item.options.size);
      }
      if (item.options.shot && item.options.shot !== 'single') {
        options.push('샷 추가');
      }
      if (item.options.milk && item.options.milk !== 'whole') {
        const milkNames = { skim: '저지방', oat: '오트밀크', almond: '아몬드밀크' };
        options.push(milkNames[item.options.milk] || item.options.milk);
      }
      
      const optionText = options.length > 0 ? ` (${options.join(', ')})` : '';
      return `${item.name}${optionText} ${item.quantity}개`;
    });

    return `${itemMessages.join(', ')} 주문하시겠어요? 총 ${orderData.totalPrice.toLocaleString()}원입니다.`;
  }

  getServiceStatus() {
    return {
      isReady: true,
      provider: 'ollama',
      model: this.modelName,
      ollamaUrl: this.ollamaUrl,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AIService();