const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class OrderService {
  constructor() {
    this.ordersPath = path.join(__dirname, '../data/orders');
    this.ordersFile = path.join(this.ordersPath, 'orders.json');
    this.initializeOrdersFile();
  }

  async initializeOrdersFile() {
    try {
      await fs.ensureDir(this.ordersPath);
      
      if (!await fs.pathExists(this.ordersFile)) {
        await fs.writeJson(this.ordersFile, {
          orders: [],
          lastOrderId: 0,
          statistics: {
            totalOrders: 0,
            totalRevenue: 0,
            popularItems: {}
          }
        });
        logger.info('Orders file initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize orders file:', error);
    }
  }

  /**
   * 새로운 주문 생성
   * @param {Object} orderData - 주문 데이터
   * @returns {Object} 생성된 주문 정보
   */
  async createOrder(orderData) {
    try {
      const ordersData = await this.loadOrdersData();
      
      const order = {
        id: uuidv4(),
        orderNumber: this.generateOrderNumber(ordersData.lastOrderId + 1),
        items: orderData.items || [],
        totalPrice: orderData.totalPrice || 0,
        status: 'pending',
        paymentMethod: orderData.paymentMethod || null,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerInfo: {
          name: orderData.customerName || null,
          phone: orderData.customerPhone || null
        },
        notes: orderData.notes || ''
      };

      ordersData.orders.push(order);
      ordersData.lastOrderId += 1;
      
      // 통계 업데이트
      this.updateStatistics(ordersData, order);
      
      await this.saveOrdersData(ordersData);
      
      logger.info('Order created:', { orderId: order.id, orderNumber: order.orderNumber });
      return order;
    } catch (error) {
      logger.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * 주문 조회
   * @param {string} orderId - 주문 ID
   * @returns {Object} 주문 정보
   */
  async getOrder(orderId) {
    try {
      const ordersData = await this.loadOrdersData();
      const order = ordersData.orders.find(o => o.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      logger.error('Failed to get order:', error);
      throw error;
    }
  }

  /**
   * 주문 번호로 조회
   * @param {string} orderNumber - 주문 번호
   * @returns {Object} 주문 정보
   */
  async getOrderByNumber(orderNumber) {
    try {
      const ordersData = await this.loadOrdersData();
      const order = ordersData.orders.find(o => o.orderNumber === orderNumber);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      logger.error('Failed to get order by number:', error);
      throw error;
    }
  }

  /**
   * 주문 상태 업데이트
   * @param {string} orderId - 주문 ID
   * @param {string} status - 새로운 상태
   * @param {Object} updateData - 추가 업데이트 데이터
   * @returns {Object} 업데이트된 주문 정보
   */
  async updateOrderStatus(orderId, status, updateData = {}) {
    try {
      const ordersData = await this.loadOrdersData();
      const orderIndex = ordersData.orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }
      
      const order = ordersData.orders[orderIndex];
      order.status = status;
      order.updatedAt = new Date().toISOString();
      
      // 추가 데이터 업데이트
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          order[key] = updateData[key];
        }
      });
      
      await this.saveOrdersData(ordersData);
      
      logger.info('Order status updated:', { orderId, status });
      return order;
    } catch (error) {
      logger.error('Failed to update order status:', error);
      throw error;
    }
  }

  /**
   * 결제 완료 처리
   * @param {string} orderId - 주문 ID
   * @param {string} paymentMethod - 결제 방법
   * @param {Object} paymentInfo - 결제 정보
   * @returns {Object} 업데이트된 주문 정보
   */
  async completePayment(orderId, paymentMethod, paymentInfo = {}) {
    try {
      const updateData = {
        paymentMethod,
        paymentStatus: 'completed',
        paymentInfo,
        status: 'confirmed'
      };
      
      return await this.updateOrderStatus(orderId, 'confirmed', updateData);
    } catch (error) {
      logger.error('Failed to complete payment:', error);
      throw error;
    }
  }

  /**
   * 주문 취소
   * @param {string} orderId - 주문 ID
   * @param {string} reason - 취소 사유
   * @returns {Object} 취소된 주문 정보
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const updateData = {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelReason: reason
      };
      
      return await this.updateOrderStatus(orderId, 'cancelled', updateData);
    } catch (error) {
      logger.error('Failed to cancel order:', error);
      throw error;
    }
  }

  /**
   * 최근 주문 목록 조회
   * @param {number} limit - 조회할 주문 수
   * @returns {Array} 주문 목록
   */
  async getRecentOrders(limit = 10) {
    try {
      const ordersData = await this.loadOrdersData();
      
      return ordersData.orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get recent orders:', error);
      throw error;
    }
  }

  /**
   * 주문 통계 조회
   * @returns {Object} 주문 통계
   */
  async getOrderStatistics() {
    try {
      const ordersData = await this.loadOrdersData();
      return ordersData.statistics;
    } catch (error) {
      logger.error('Failed to get order statistics:', error);
      throw error;
    }
  }

  /**
   * 주문 데이터 로드
   * @returns {Object} 주문 데이터
   */
  async loadOrdersData() {
    try {
      if (!await fs.pathExists(this.ordersFile)) {
        await this.initializeOrdersFile();
      }
      
      return await fs.readJson(this.ordersFile);
    } catch (error) {
      logger.error('Failed to load orders data:', error);
      throw error;
    }
  }

  /**
   * 주문 데이터 저장
   * @param {Object} ordersData - 저장할 주문 데이터
   */
  async saveOrdersData(ordersData) {
    try {
      await fs.writeJson(this.ordersFile, ordersData, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save orders data:', error);
      throw error;
    }
  }

  /**
   * 주문 번호 생성
   * @param {number} orderId - 주문 ID
   * @returns {string} 주문 번호
   */
  generateOrderNumber(orderId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = orderId.toString().padStart(4, '0');
    
    return `TK${year}${month}${day}${sequence}`;
  }

  /**
   * 통계 업데이트
   * @param {Object} ordersData - 주문 데이터
   * @param {Object} order - 새 주문
   */
  updateStatistics(ordersData, order) {
    const stats = ordersData.statistics;
    
    // 총 주문 수 증가
    stats.totalOrders += 1;
    
    // 결제 완료된 주문만 매출에 포함
    if (order.paymentStatus === 'completed') {
      stats.totalRevenue += order.totalPrice;
    }
    
    // 인기 메뉴 통계 업데이트
    order.items.forEach(item => {
      const itemName = item.name;
      if (!stats.popularItems[itemName]) {
        stats.popularItems[itemName] = 0;
      }
      stats.popularItems[itemName] += item.quantity;
    });
  }

  /**
   * 주문 검증
   * @param {Object} orderData - 주문 데이터
   * @returns {Object} 검증 결과
   */
  validateOrder(orderData) {
    const errors = [];
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('주문 항목이 필요합니다.');
    }
    
    if (!orderData.totalPrice || orderData.totalPrice <= 0) {
      errors.push('올바른 총 가격이 필요합니다.');
    }
    
    // 각 주문 항목 검증
    if (orderData.items) {
      orderData.items.forEach((item, index) => {
        if (!item.menuId || !item.name) {
          errors.push(`주문 항목 ${index + 1}: 메뉴 ID와 이름이 필요합니다.`);
        }
        
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`주문 항목 ${index + 1}: 올바른 수량이 필요합니다.`);
        }
        
        if (!item.price || item.price <= 0) {
          errors.push(`주문 항목 ${index + 1}: 올바른 가격이 필요합니다.`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new OrderService();
