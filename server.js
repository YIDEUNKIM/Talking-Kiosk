const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 미들웨어 설정
app.use(cors());
app.use(express.json());

console.log('=== Web Speech API 음성 주문 서버 ===');
console.log('브라우저 내장 음성 인식/합성 사용');
console.log('===================================');

// 메모리에 주문 저장 (단순 배열)
let orders = [];
let currentOrderId = 1;

// 메뉴 데이터 (프론트엔드와 동일)
const MENU = {
  1: { id: 1, name: "아메리카노", price: 2500 },
  2: { id: 2, name: "카페라떼", price: 3900 },
  3: { id: 3, name: "카페모카", price: 4500 },
  4: { id: 4, name: "자몽에이드", price: 4500 },
  5: { id: 5, name: "망고에이드", price: 4500 },
  6: { id: 6, name: "키위주스", price: 4800 },
  7: { id: 7, name: "페퍼민트", price: 3500 },
  8: { id: 8, name: "캐모마일", price: 3500 },
  9: { id: 9, name: "복숭아티", price: 3500 },
  10: { id: 10, name: "생크림 롤케이크", price: 3500 },
  11: { id: 11, name: "쿠키 크루와상 와플", price: 4000 },
  12: { id: 12, name: "크루와상 와플", price: 2500 },
};

// 메뉴 이름 매핑 (음성 인식을 위한 별칭)
const MENU_ALIASES = {
  "아메리카노": 1,
  "아메": 1,
  "아아": 1,  // 아이스 아메리카노
  "아샷추": 1, // 아메리카노 샷 추가
  "카페라떼": 2,
  "라떼": 2,
  "카페모카": 3,
  "모카": 3,
  "자몽에이드": 4,
  "자몽": 4,
  "망고에이드": 5,
  "망고": 5,
  "키위주스": 6,
  "키위": 6,
  "페퍼민트": 7,
  "캐모마일": 8,
  "복숭아티": 9,
  "복숭아": 9,
  "생크림 롤케이크": 10,
  "롤케이크": 10,
  "쿠키 크루와상 와플": 11,
  "쿠키와플": 11,
  "크루와상 와플": 12,
  "와플": 12
};

// 음성 명령 파싱 함수 (Web Speech API용)
function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase();
  console.log('🎤 [서버] 음성 명령 파싱:', transcript);
  
  // 결제 관련 명령
  if (text.includes('결제') || text.includes('계산') || text.includes('주문완료')) {
    console.log('💳 [서버] 결제 명령 감지');
    return {
      function: "completeOrder",
      args: { confirm: true }
    };
  }
  
  // 메뉴 주문 명령 파싱
  let itemName = null;
  let quantity = 1;
  let temperature = 'hot';
  let options = {};
  
  // 수량 파싱
  const quantityMatch = text.match(/(\d+)개|(\d+)잔|한\s*잔|두\s*잔|세\s*잔/);
  if (quantityMatch) {
    if (quantityMatch[1]) quantity = parseInt(quantityMatch[1]);
    else if (quantityMatch[2]) quantity = parseInt(quantityMatch[2]);
    else if (text.includes('한')) quantity = 1;
    else if (text.includes('두')) quantity = 2;
    else if (text.includes('세')) quantity = 3;
  }
  
  // 온도 파싱
  if (text.includes('아이스') || text.includes('차가운') || text.includes('시원한') || text.includes('아아')) {
    temperature = 'ice';
  } else if (text.includes('뜨거운') || text.includes('따뜻한') || text.includes('핫')) {
    temperature = 'hot';
  }
  
  // 특별 명령어 처리
  if (text.includes('아아')) {
    itemName = '아메리카노';
    temperature = 'ice';
  } else if (text.includes('아샷추')) {
    itemName = '아메리카노';
    options.shot = 'double';
  } else {
    // 일반 메뉴 이름 찾기
    for (const [alias, menuId] of Object.entries(MENU_ALIASES)) {
      if (text.includes(alias.toLowerCase())) {
        itemName = MENU[menuId].name;
        break;
      }
    }
  }
  
  if (itemName) {
    console.log('🛒 [서버] 주문 항목 파싱됨:', { itemName, quantity, temperature, options });
    return {
      function: "addItem",
      args: {
        itemName,
        quantity,
        temperature,
        options
      }
    };
  }
  
  console.log('❓ [서버] 인식되지 않은 명령:', transcript);
  return null;
}


// WebSocket 연결 처리 (Web Speech API 버전)
wss.on('connection', (ws) => {
  console.log('✅ [서버] 클라이언트 연결됨');
  
  // 연결 성공 메시지
  ws.send(JSON.stringify({
    type: 'CONNECTION_SUCCESS',
    message: 'Web Speech API 음성 주문 서버에 연결되었습니다'
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📥 [서버] 클라이언트 메시지 수신:', data.type);
      
      switch (data.type) {
        case 'VOICE_COMMAND':
          const command = parseVoiceCommand(data.transcript);
          
          if (command) {
            if (command.function === 'addItem') {
              const result = await handleAddItem(command.args);
              ws.send(JSON.stringify({
                type: 'ITEM_ADDED',
                data: result,
                response: `${result.name}${result.temperature === 'ice' ? '(아이스)' : result.temperature === 'hot' ? '(핫)' : ''} ${result.quantity}개가 추가되었습니다.`
              }));
            } else if (command.function === 'completeOrder') {
              const result = await handleCompleteOrder(command.args);
              ws.send(JSON.stringify({
                type: 'ORDER_COMPLETED',
                data: result,
                response: '주문이 완료되었습니다. 결제를 진행해주세요.'
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'VOICE_ERROR',
              message: '죄송합니다. 명령을 이해하지 못했습니다. 다시 말씀해주세요.',
              response: '죄송합니다. 명령을 이해하지 못했습니다. 다시 말씀해주세요.'
            }));
          }
          break;
          
        case 'GET_ORDERS':
          ws.send(JSON.stringify({
            type: 'ORDERS_LIST',
            data: orders
          }));
          break;
          
        case 'CLEAR_ORDERS':
          orders = [];
          ws.send(JSON.stringify({
            type: 'ORDERS_CLEARED',
            message: '주문이 초기화되었습니다'
          }));
          break;
      }
    } catch (error) {
      console.error('❌ [서버] 메시지 처리 오류:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: '서버 오류가 발생했습니다'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 [서버] 클라이언트 연결 해제됨');
  });
});

// 메뉴 항목 추가 함수
async function handleAddItem(args) {
  const { itemName, quantity = 1, temperature, options = {} } = args;
  
  // 메뉴 ID 찾기
  const menuId = MENU_ALIASES[itemName] || 
    Object.values(MENU).find(item => item.name === itemName)?.id;
  
  if (!menuId || !MENU[menuId]) {
    throw new Error('메뉴를 찾을 수 없습니다');
  }
  
  const menuItem = MENU[menuId];
  
  // 주문 항목 생성
  const orderItem = {
    id: menuId,
    name: menuItem.name,
    price: menuItem.price,
    quantity: quantity,
    temperature: temperature || 'hot',
    options: {
      ...options,
      temperature: temperature || 'hot',
      size: options.size || 'regular',
      shot: options.shot || 'single',
      sweetness: 'none',
      milk: 'whole'
    },
    timestamp: new Date().toISOString()
  };
  
  // 메모리에 저장
  orders.push(orderItem);
  
  return orderItem;
}

// 주문 완료 함수
async function handleCompleteOrder(args) {
  if (!args.confirm) {
    throw new Error('주문 확정이 필요합니다');
  }
  
  const orderId = `order-${currentOrderId++}`;
  const orderSummary = {
    orderId,
    items: [...orders],
    total: orders.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    timestamp: new Date().toISOString(),
    status: 'completed'
  };
  
  // 주문 완료 후 초기화
  orders = [];
  
  return orderSummary;
}

// REST API 엔드포인트
app.get('/api/orders', (req, res) => {
  res.json({ orders });
});

app.post('/api/orders/clear', (req, res) => {
  orders = [];
  res.json({ message: '주문이 초기화되었습니다' });
});

app.get('/api/menu', (req, res) => {
  res.json({ menu: MENU, aliases: MENU_ALIASES });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`음성 주문 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}`);
});
