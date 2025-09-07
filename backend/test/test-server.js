/**
 * Talking Kiosk Backend Server Test
 * 간단한 서버 테스트 스크립트
 */

const request = require('supertest');
const app = require('../server');

describe('Talking Kiosk Backend API Tests', () => {
  
  // 헬스 체크 테스트
  test('GET /health should return server status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  // 메뉴 API 테스트
  test('GET /api/menu should return menu data', async () => {
    const response = await request(app)
      .get('/api/menu')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.categories).toBeDefined();
    expect(Array.isArray(response.body.data.categories)).toBe(true);
  });

  // 결제 방법 조회 테스트
  test('GET /api/menu/payment-methods should return payment methods', async () => {
    const response = await request(app)
      .get('/api/menu/payment-methods')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // 음성 처리 상태 확인 테스트
  test('GET /api/voice/status should return voice service status', async () => {
    const response = await request(app)
      .get('/api/voice/status')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('active');
    expect(response.body.data.supportedFormats).toBeDefined();
  });

  // 주문 통계 조회 테스트
  test('GET /api/order/statistics should return order statistics', async () => {
    const response = await request(app)
      .get('/api/order/statistics')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.totalOrders).toBeDefined();
  });

  // 404 에러 테스트
  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe('Not Found');
  });

  // 잘못된 주문 데이터 테스트
  test('POST /api/order with invalid data should return 400', async () => {
    const invalidOrderData = {
      items: [], // 빈 아이템 배열
      totalPrice: 0
    };

    const response = await request(app)
      .post('/api/order')
      .send(invalidOrderData)
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid order data');
  });

});

// 서버 종료
afterAll(() => {
  if (app && app.server) {
    app.server.close();
  }
});
