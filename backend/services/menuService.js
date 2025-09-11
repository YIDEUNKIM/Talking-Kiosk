const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class MenuService {
  constructor() {
    this.menuData = null;
    this.menuFilePath = path.join(__dirname, '../data/menu.json');
    this.loadMenuData();
  }

  /**
   * 메뉴 데이터를 파일에서 로드
   */
  loadMenuData() {
    try {
      if (fs.existsSync(this.menuFilePath)) {
        const rawData = fs.readFileSync(this.menuFilePath, 'utf8');
        this.menuData = JSON.parse(rawData);
        logger.info('Menu data loaded successfully', {
          categories: this.menuData?.categories?.length || 0,
          totalItems: this.getTotalItemsCount()
        });
      } else {
        logger.warn('Menu file not found, using empty menu');
        this.menuData = { categories: [], paymentMethods: [], commonOptions: {} };
      }
    } catch (error) {
      logger.error('Failed to load menu data:', error);
      this.menuData = { categories: [], paymentMethods: [], commonOptions: {} };
    }
  }

  /**
   * 메뉴 데이터 반환
   */
  getMenuData() {
    if (!this.menuData) {
      this.loadMenuData();
    }
    return this.menuData;
  }

  /**
   * 카테고리별 메뉴 아이템 반환
   */
  getMenuByCategory(categoryId) {
    const menuData = this.getMenuData();
    const category = menuData.categories?.find(cat => cat.id === categoryId);
    return category ? category.items : [];
  }

  /**
   * 특정 메뉴 아이템 반환
   */
  getMenuItem(categoryId, itemId) {
    const items = this.getMenuByCategory(categoryId);
    return items.find(item => item.id === itemId);
  }

  /**
   * 모든 메뉴 아이템 반환 (플랫 구조)
   */
  getAllMenuItems() {
    const menuData = this.getMenuData();
    const allItems = [];
    
    menuData.categories?.forEach(category => {
      category.items?.forEach(item => {
        allItems.push({
          ...item,
          categoryId: category.id,
          categoryName: category.name
        });
      });
    });
    
    return allItems;
  }

  /**
   * 메뉴 아이템 검색
   */
  searchMenuItems(query) {
    const allItems = this.getAllMenuItems();
    const searchQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery) ||
      item.categoryName.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * 결제 방법 반환
   */
  getPaymentMethods() {
    const menuData = this.getMenuData();
    return menuData.paymentMethods || [];
  }

  /**
   * 공통 옵션 반환
   */
  getCommonOptions() {
    const menuData = this.getMenuData();
    return menuData.commonOptions || {};
  }

  /**
   * 총 메뉴 아이템 수 반환
   */
  getTotalItemsCount() {
    const menuData = this.getMenuData();
    return menuData.categories?.reduce((total, category) => {
      return total + (category.items?.length || 0);
    }, 0) || 0;
  }

  /**
   * 메뉴 데이터 새로고침
   */
  refreshMenuData() {
    this.loadMenuData();
    return this.menuData;
  }

  /**
   * 메뉴 데이터 유효성 검사
   */
  validateMenuData() {
    const menuData = this.getMenuData();
    
    if (!menuData.categories || !Array.isArray(menuData.categories)) {
      return { valid: false, error: 'Invalid categories structure' };
    }

    for (const category of menuData.categories) {
      if (!category.id || !category.name || !category.items) {
        return { valid: false, error: `Invalid category structure: ${category.id || 'unknown'}` };
      }

      for (const item of category.items) {
        if (!item.id || !item.name || typeof item.price !== 'number') {
          return { valid: false, error: `Invalid item structure: ${item.id || 'unknown'}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * 서비스 상태 반환
   */
  getServiceStatus() {
    const validation = this.validateMenuData();
    return {
      isReady: validation.valid,
      menuLoaded: !!this.menuData,
      categoriesCount: this.menuData?.categories?.length || 0,
      totalItems: this.getTotalItemsCount(),
      lastError: validation.valid ? null : validation.error,
      menuFilePath: this.menuFilePath
    };
  }
}

// 싱글톤 인스턴스 생성
const menuService = new MenuService();

module.exports = menuService;
