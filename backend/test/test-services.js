/**
 * Talking Kiosk Backend Services Test
 * 서비스 레이어 테스트
 */

const menuService = require('../services/menuService');
const orderService = require('../services/orderService');

describe('Menu Service Tests', () => {
  
  test('should load menu data', async () => {
    const menuData = await menuService.getMenuData();
    expect(menuData).toBeDefined();
    expect(menuData.categories).toBeDefined();
    expect(Array.isArray(menuData.categories)).toBe(true);
  });

  test('should get category by ID', async () => {
    const category = await menuService.getCategoryById('coffee');
    expect(category).toBeDefined();
    expect(category.id).toBe('coffee');
    expect(category.items).toBeDefined();
  });

  test('should get menu item by ID', async () => {
    const item = await menuService.getItemById('americano');
    expect(item).toBeDefined();
    expect(item.id).toBe('americano');
    expect(item.name).toBe('아메리카노');
    expect(item.price).toBeDefined();
  });

  test('should search menu items', async () => {
    const results = await menuService.searchMenuItems({ query: '아메리카노' });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test('should get payment methods', async () => {
    const paymentMethods = await menuService.getPaymentMethods();
    expect(Array.isArray(paymentMethods)).toBe(true);
    expect(paymentMethods.length).toBeGreaterThan(0);
  });

  test('should get menu statistics', async () => {
    const stats = await menuService.getMenuStatistics();
    expect(stats).toBeDefined();
    expect(stats.totalCategories).toBeDefined();
    expect(stats.totalItems).toBeDefined();
    expect(stats.averagePrice).toBeDefined();
  });

});

describe('Order Service Tests', () => {
  
  test('should validate order data', () => {
    const validOrder = {
      items: [
        {
          menuId: 'americano',
          name: '아메리카노',
          quantity: 1,
          price: 4500
        }
      ],
      totalPrice: 4500
    };

    const validation = orderService.validateOrder(validOrder);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should reject invalid order data', () => {
    const invalidOrder = {
      items: [],
      totalPrice: 0
    };

    const validation = orderService.validateOrder(invalidOrder);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should create order', async () => {
    const orderData = {
      items: [
        {
          menuId: 'americano',
          name: '아메리카노',
          quantity: 1,
          price: 4500
        }
      ],
      totalPrice: 4500
    };

    const order = await orderService.createOrder(orderData);
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBeDefined();
    expect(order.items).toHaveLength(1);
    expect(order.totalPrice).toBe(4500);
  });

  test('should get order by ID', async () => {
    const orderData = {
      items: [
        {
          menuId: 'americano',
          name: '아메리카노',
          quantity: 1,
          price: 4500
        }
      ],
      totalPrice: 4500
    };

    const createdOrder = await orderService.createOrder(orderData);
    const retrievedOrder = await orderService.getOrder(createdOrder.id);
    
    expect(retrievedOrder).toBeDefined();
    expect(retrievedOrder.id).toBe(createdOrder.id);
    expect(retrievedOrder.orderNumber).toBe(createdOrder.orderNumber);
  });

  test('should update order status', async () => {
    const orderData = {
      items: [
        {
          menuId: 'americano',
          name: '아메리카노',
          quantity: 1,
          price: 4500
        }
      ],
      totalPrice: 4500
    };

    const order = await orderService.createOrder(orderData);
    const updatedOrder = await orderService.updateOrderStatus(order.id, 'confirmed');
    
    expect(updatedOrder.status).toBe('confirmed');
    expect(updatedOrder.updatedAt).toBeDefined();
  });

  test('should complete payment', async () => {
    const orderData = {
      items: [
        {
          menuId: 'americano',
          name: '아메리카노',
          quantity: 1,
          price: 4500
        }
      ],
      totalPrice: 4500
    };

    const order = await orderService.createOrder(orderData);
    const paidOrder = await orderService.completePayment(order.id, 'card', { transactionId: 'test123' });
    
    expect(paidOrder.paymentStatus).toBe('completed');
    expect(paidOrder.paymentMethod).toBe('card');
    expect(paidOrder.status).toBe('confirmed');
  });

  test('should get order statistics', async () => {
    const stats = await orderService.getOrderStatistics();
    expect(stats).toBeDefined();
    expect(stats.totalOrders).toBeDefined();
    expect(stats.totalRevenue).toBeDefined();
    expect(stats.popularItems).toBeDefined();
  });

});
