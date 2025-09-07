const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class MenuService {
  constructor() {
    this.menuPath = path.join(__dirname, '../data/menu.json');
    this.menuData = null;
    this.loadMenuData();
  }

  /**
   * 메뉴 데이터 로드
   */
  async loadMenuData() {
    try {
      if (await fs.pathExists(this.menuPath)) {
        this.menuData = await fs.readJson(this.menuPath);
        logger.info('Menu data loaded successfully');
      } else {
        logger.error('Menu file not found:', this.menuPath);
        this.menuData = { categories: [], paymentMethods: [], commonOptions: {} };
      }
    } catch (error) {
      logger.error('Failed to load menu data:', error);
      this.menuData = { categories: [], paymentMethods: [], commonOptions: {} };
    }
  }

  /**
   * 메뉴 데이터 저장
   */
  async saveMenuData() {
    try {
      await fs.writeJson(this.menuPath, this.menuData, { spaces: 2 });
      logger.info('Menu data saved successfully');
    } catch (error) {
      logger.error('Failed to save menu data:', error);
      throw error;
    }
  }

  /**
   * 전체 메뉴 데이터 조회
   * @returns {Object} 메뉴 데이터
   */
  async getMenuData() {
    if (!this.menuData) {
      await this.loadMenuData();
    }
    return this.menuData;
  }

  /**
   * 카테고리 ID로 카테고리 조회
   * @param {string} categoryId - 카테고리 ID
   * @returns {Object} 카테고리 정보
   */
  async getCategoryById(categoryId) {
    const menuData = await this.getMenuData();
    return menuData.categories.find(category => category.id === categoryId);
  }

  /**
   * 메뉴 아이템 ID로 아이템 조회
   * @param {string} itemId - 메뉴 아이템 ID
   * @returns {Object} 메뉴 아이템 정보
   */
  async getItemById(itemId) {
    const menuData = await this.getMenuData();
    
    for (const category of menuData.categories) {
      const item = category.items.find(item => item.id === itemId);
      if (item) {
        return {
          ...item,
          categoryId: category.id,
          categoryName: category.name
        };
      }
    }
    
    return null;
  }

  /**
   * 메뉴 아이템 검색
   * @param {Object} searchParams - 검색 파라미터
   * @returns {Array} 검색 결과
   */
  async searchMenuItems(searchParams) {
    const menuData = await this.getMenuData();
    let results = [];

    // 모든 메뉴 아이템을 평면화
    for (const category of menuData.categories) {
      for (const item of category.items) {
        results.push({
          ...item,
          categoryId: category.id,
          categoryName: category.name
        });
      }
    }

    // 검색 필터 적용
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    if (searchParams.category) {
      results = results.filter(item => item.categoryId === searchParams.category);
    }

    if (searchParams.priceMin !== undefined) {
      results = results.filter(item => item.price >= searchParams.priceMin);
    }

    if (searchParams.priceMax !== undefined) {
      results = results.filter(item => item.price <= searchParams.priceMax);
    }

    return results;
  }

  /**
   * 결제 방법 목록 조회
   * @returns {Array} 결제 방법 목록
   */
  async getPaymentMethods() {
    const menuData = await this.getMenuData();
    return menuData.paymentMethods || [];
  }

  /**
   * 공통 옵션 조회
   * @returns {Object} 공통 옵션
   */
  async getCommonOptions() {
    const menuData = await this.getMenuData();
    return menuData.commonOptions || {};
  }

  /**
   * 메뉴 통계 조회
   * @returns {Object} 메뉴 통계
   */
  async getMenuStatistics() {
    const menuData = await this.getMenuData();
    
    const stats = {
      totalCategories: menuData.categories.length,
      totalItems: 0,
      averagePrice: 0,
      priceRange: { min: Infinity, max: 0 },
      categoryStats: []
    };

    let totalPrice = 0;
    let itemCount = 0;

    for (const category of menuData.categories) {
      const categoryStat = {
        id: category.id,
        name: category.name,
        itemCount: category.items.length,
        averagePrice: 0,
        priceRange: { min: Infinity, max: 0 }
      };

      let categoryTotalPrice = 0;

      for (const item of category.items) {
        totalPrice += item.price;
        itemCount++;
        categoryTotalPrice += item.price;
        
        stats.priceRange.min = Math.min(stats.priceRange.min, item.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, item.price);
        
        categoryStat.priceRange.min = Math.min(categoryStat.priceRange.min, item.price);
        categoryStat.priceRange.max = Math.max(categoryStat.priceRange.max, item.price);
      }

      categoryStat.averagePrice = categoryTotalPrice / category.items.length;
      stats.categoryStats.push(categoryStat);
    }

    stats.totalItems = itemCount;
    stats.averagePrice = totalPrice / itemCount;

    // 가격 범위가 설정되지 않은 경우 처리
    if (stats.priceRange.min === Infinity) {
      stats.priceRange.min = 0;
    }

    return stats;
  }

  /**
   * 메뉴 아이템 업데이트
   * @param {string} itemId - 메뉴 아이템 ID
   * @param {Object} updateData - 업데이트 데이터
   * @returns {Object} 업데이트된 메뉴 아이템
   */
  async updateMenuItem(itemId, updateData) {
    const menuData = await this.getMenuData();
    
    for (const category of menuData.categories) {
      const itemIndex = category.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        category.items[itemIndex] = {
          ...category.items[itemIndex],
          ...updateData,
          id: itemId // ID는 변경하지 않음
        };
        
        await this.saveMenuData();
        return category.items[itemIndex];
      }
    }
    
    return null;
  }

  /**
   * 메뉴 아이템 추가
   * @param {Object} itemData - 메뉴 아이템 데이터
   * @returns {Object} 추가된 메뉴 아이템
   */
  async addMenuItem(itemData) {
    const menuData = await this.getMenuData();
    
    // 카테고리 찾기
    const category = menuData.categories.find(cat => cat.id === itemData.categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // 새 아이템 생성
    const newItem = {
      id: this.generateItemId(itemData.name),
      name: itemData.name,
      description: itemData.description || '',
      price: itemData.price,
      image: itemData.image || '/menu_images/default.png',
      options: itemData.options || {},
      defaultOptions: itemData.defaultOptions || {}
    };

    category.items.push(newItem);
    await this.saveMenuData();
    
    return newItem;
  }

  /**
   * 메뉴 아이템 삭제
   * @param {string} itemId - 메뉴 아이템 ID
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteMenuItem(itemId) {
    const menuData = await this.getMenuData();
    
    for (const category of menuData.categories) {
      const itemIndex = category.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        category.items.splice(itemIndex, 1);
        await this.saveMenuData();
        return true;
      }
    }
    
    return false;
  }

  /**
   * 메뉴 아이템 ID 생성
   * @param {string} name - 메뉴 이름
   * @returns {string} 생성된 ID
   */
  generateItemId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * 메뉴 아이템 가격 계산
   * @param {Object} item - 메뉴 아이템
   * @param {Object} options - 선택된 옵션
   * @param {number} quantity - 수량
   * @returns {number} 계산된 가격
   */
  calculateItemPrice(item, options = {}, quantity = 1) {
    let basePrice = item.price;
    
    // 옵션별 가격 조정 (필요시 확장)
    if (options.size === 'large') {
      basePrice += 500; // 라지 사이즈 추가 요금
    }
    
    if (options.shot === 'double') {
      basePrice += 500; // 샷 추가 요금
    }
    
    if (options.milk && options.milk !== 'whole') {
      basePrice += 300; // 우유 변경 요금
    }
    
    return basePrice * quantity;
  }

  /**
   * 주문 아이템 검증
   * @param {Object} orderItem - 주문 아이템
   * @returns {Object} 검증 결과
   */
  validateOrderItem(orderItem) {
    const errors = [];
    
    if (!orderItem.menuId) {
      errors.push('Menu ID is required');
    }
    
    if (!orderItem.quantity || orderItem.quantity <= 0) {
      errors.push('Valid quantity is required');
    }
    
    // 메뉴 아이템 존재 확인
    const menuItem = this.getItemById(orderItem.menuId);
    if (!menuItem) {
      errors.push('Menu item not found');
    }
    
    // 옵션 검증
    if (orderItem.options && menuItem) {
      for (const [optionKey, optionValue] of Object.entries(orderItem.options)) {
        if (menuItem.options[optionKey] && !menuItem.options[optionKey].includes(optionValue)) {
          errors.push(`Invalid option value for ${optionKey}: ${optionValue}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new MenuService();
