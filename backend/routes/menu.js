const express = require('express');
const router = express.Router();
const menuService = require('../services/menuService');
const logger = require('../utils/logger');

/**
 * 전체 메뉴 데이터 조회
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
    logger.error('Menu data fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu data'
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
    const menuItems = await menuService.getMenuByCategory(categoryId);
    
    if (menuItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        categoryId,
        items: menuItems
      }
    });
  } catch (error) {
    logger.error('Category menu fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category menu'
    });
  }
});

/**
 * 특정 메뉴 아이템 조회
 * GET /api/menu/item/:categoryId/:itemId
 */
router.get('/item/:categoryId/:itemId', async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;
    const menuItem = await menuService.getMenuItem(categoryId, itemId);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...menuItem,
        categoryId,
        categoryName: menuItem.categoryName
      }
    });
  } catch (error) {
    logger.error('Menu item fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item'
    });
  }
});

/**
 * 메뉴 검색
 * GET /api/menu/search?q=검색어
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchResults = await menuService.searchMenuItems(q.trim());
    
    res.json({
      success: true,
      data: {
        query: q.trim(),
        results: searchResults,
        count: searchResults.length
      }
    });
  } catch (error) {
    logger.error('Menu search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search menu'
    });
  }
});

/**
 * 결제 방법 조회
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
    logger.error('Payment methods fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
});

/**
 * 공통 옵션 조회
 * GET /api/menu/options
 */
router.get('/options', async (req, res) => {
  try {
    const commonOptions = await menuService.getCommonOptions();
    
    res.json({
      success: true,
      data: commonOptions
    });
  } catch (error) {
    logger.error('Common options fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch common options'
    });
  }
});

/**
 * 메뉴 서비스 상태 조회
 * GET /api/menu/status
 */
router.get('/status', (req, res) => {
  try {
    const status = menuService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Menu service status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get menu service status'
    });
  }
});

/**
 * 메뉴 데이터 새로고침
 * POST /api/menu/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshedData = await menuService.refreshMenuData();
    
    res.json({
      success: true,
      data: refreshedData,
      message: 'Menu data refreshed successfully'
    });
  } catch (error) {
    logger.error('Menu data refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh menu data'
    });
  }
});

module.exports = router;
