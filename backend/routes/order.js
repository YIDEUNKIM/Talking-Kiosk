const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const logger = require('../utils/logger');

/**
 * 새로운 주문 생성
 * POST /api/order
 */
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;

    // 주문 데이터 검증
    const validation = orderService.validateOrder(orderData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        details: validation.errors
      });
    }

    // 주문 생성
    const order = await orderService.createOrder(orderData);

    logger.info('Order created successfully:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice
    });

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * 주문 조회
 * GET /api/order/:orderId
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Order retrieval error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve order'
    });
  }
});

/**
 * 주문 번호로 조회
 * GET /api/order/number/:orderNumber
 */
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Order retrieval by number error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve order'
    });
  }
});

/**
 * 주문 상태 업데이트
 * PUT /api/order/:orderId/status
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, ...updateData } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }

    const order = await orderService.updateOrderStatus(orderId, status, updateData);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Order status update error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * 결제 완료 처리
 * POST /api/order/:orderId/payment
 */
router.post('/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, paymentInfo } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required'
      });
    }

    const order = await orderService.completePayment(orderId, paymentMethod, paymentInfo);

    logger.info('Payment completed:', {
      orderId,
      orderNumber: order.orderNumber,
      paymentMethod,
      totalPrice: order.totalPrice
    });

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Payment completion error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to complete payment'
    });
  }
});

/**
 * 주문 취소
 * POST /api/order/:orderId/cancel
 */
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(orderId, reason);

    logger.info('Order cancelled:', {
      orderId,
      orderNumber: order.orderNumber,
      reason
    });

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Order cancellation error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

/**
 * 최근 주문 목록 조회
 * GET /api/order/recent
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const orders = await orderService.getRecentOrders(parseInt(limit));

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    logger.error('Recent orders retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent orders'
    });
  }
});

/**
 * 주문 통계 조회
 * GET /api/order/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Order statistics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve order statistics'
    });
  }
});

/**
 * 주문 영수증 생성
 * GET /api/order/:orderId/receipt
 */
router.get('/:orderId/receipt', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

    // 영수증 데이터 생성
    const receipt = {
      orderNumber: order.orderNumber,
      items: order.items,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      status: order.status
    };

    res.json({
      success: true,
      data: receipt
    });

  } catch (error) {
    logger.error('Receipt generation error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt'
    });
  }
});

module.exports = router;
