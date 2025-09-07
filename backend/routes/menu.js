const express = require('express');
const router = express.Router();
const menuService = require('../services/menuService');
const logger = require('../utils/logger');

/**
 * 전체 메뉴 조회
 * GET /api/menu
 */
router.get('/', async (req, res) => {
  try {
    const menuData = await menuService.getMenuData();

    res.json({
      success: true,
      data: menuData
    });

  } catch (error) {
    logger.error('Menu retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve menu data'
    });
  }
});

/**
 * 카테고리별 메뉴 조회
 * GET /api/menu/category/:categoryId
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await menuService.getCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    logger.error('Category retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category'
    });
  }
});

/**
 * 특정 메뉴 아이템 조회
 * GET /api/menu/item/:itemId
 */
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await menuService.getItemById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    logger.error('Menu item retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve menu item'
    });
  }
});

/**
 * 메뉴 검색
 * GET /api/menu/search
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, priceMin, priceMax } = req.query;

    if (!q && !category && !priceMin && !priceMax) {
      return res.status(400).json({
        success: false,
        error: 'At least one search parameter is required'
      });
    }

    const searchResults = await menuService.searchMenuItems({
      query: q,
      category,
      priceMin: priceMin ? parseInt(priceMin) : undefined,
      priceMax: priceMax ? parseInt(priceMax) : undefined
    });

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    logger.error('Menu search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search menu items'
    });
  }
});

/**
 * 결제 방법 목록 조회
 * GET /api/menu/payment-methods
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await menuService.getPaymentMethods();

    res.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    logger.error('Payment methods retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods'
    });
  }
});

/**
 * 메뉴 옵션 조회
 * GET /api/menu/options
 */
router.get('/options', async (req, res) => {
  try {
    const options = await menuService.getCommonOptions();

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    logger.error('Menu options retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve menu options'
    });
  }
});

/**
 * 메뉴 통계 조회
 * GET /api/menu/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await menuService.getMenuStatistics();

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Menu statistics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve menu statistics'
    });
  }
});

/**
 * 메뉴 업데이트 (관리자용)
 * PUT /api/menu/item/:itemId
 */
router.put('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const updatedItem = await menuService.updateMenuItem(itemId, updateData);

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    logger.info('Menu item updated:', { itemId, updateData });

    res.json({
      success: true,
      data: updatedItem
    });

  } catch (error) {
    logger.error('Menu item update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item'
    });
  }
});

/**
 * 메뉴 아이템 추가 (관리자용)
 * POST /api/menu/item
 */
router.post('/item', async (req, res) => {
  try {
    const itemData = req.body;

    // 필수 필드 검증
    if (!itemData.name || !itemData.price || !itemData.categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Name, price, and categoryId are required'
      });
    }

    const newItem = await menuService.addMenuItem(itemData);

    logger.info('Menu item added:', { itemId: newItem.id, name: newItem.name });

    res.status(201).json({
      success: true,
      data: newItem
    });

  } catch (error) {
    logger.error('Menu item addition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add menu item'
    });
  }
});

/**
 * 메뉴 아이템 삭제 (관리자용)
 * DELETE /api/menu/item/:itemId
 */
router.delete('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const deleted = await menuService.deleteMenuItem(itemId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    logger.info('Menu item deleted:', { itemId });

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    logger.error('Menu item deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item'
    });
  }
});

module.exports = router;
