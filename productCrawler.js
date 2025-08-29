const axios = require('axios');
const config = require('./config');

class ProductCrawler {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.endpoint = config.productsEndpoint;
    this.delay = config.defaultConfig.delay;
  }

  // Cho phép thay doi baseUrl dộng theo site duoc chọn
  setBaseUrl(baseUrl) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  // Tao URL API voi tham so
  buildApiUrl(page = 1, perPage = 100, orderBy = 'date', order = 'desc') {
    const params = new URLSearchParams({
      per_page: perPage,
      page: page,
      orderby: orderBy,
      order: order
    });
    
    return `${this.baseUrl}${this.endpoint}&${params.toString()}`;
  }

  // Delay giua cac request
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Thu thap du lieu tu một trang
  async fetchPage(page, perPage, orderBy, order, silent = false) {
    try {
      const url = this.buildApiUrl(page, perPage, orderBy, order);
      if (!silent) console.log(`Dang thu thap trang ${page}...`);
      
      const response = await axios.get(url, {
        timeout: 30000, // 30 giây timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        if (!silent) console.log(`Trang ${page}: Thu thap thanh cong ${response.data.length} san pham`);
        return response.data;
      } else {
        if (!silent) console.log(`⚠️ Trang ${page}: Khong có du lieu hoặc response khong hop le`);
        return [];
      }
    } catch (error) {
      if (!silent) console.error(`❌ Loi khi thu thap trang ${page}:`, error.message);
      return [];
    }
  }

  // Thu thap du lieu tu nhiều trang
  async crawlProducts(maxPages = 10, perPage = 100, orderBy = 'date', order = 'desc', silent = false) {
    const allProducts = [];
    let currentPage = 1;
    let hasMoreData = true;

    if (!silent) {
      console.log(`Bat dau thu thap du lieu tu ${maxPages} trang...`);
      console.log(`Cau hình: ${perPage} san pham/trang, sap xep theo ${orderBy} ${order}`);
    }

    while (currentPage <= maxPages && hasMoreData) {
      const products = await this.fetchPage(currentPage, perPage, orderBy, order, silent);
      
      if (products && products.length > 0) {
        allProducts.push(...products);
        if (!silent) console.log(`Tong so san pham da thu thap: ${allProducts.length}`);
        
        // Delay giua cac request de tranh bị block
        if (currentPage < maxPages) {
          if (!silent) console.log(`⏳ Doi ${this.delay}ms truoc khi thu thap trang tiep theo...`);
          await this.sleep(this.delay);
        }
      } else {
        if (!silent) console.log(`🏁 Khong còn du lieu ở trang ${currentPage}, dung thu thap`);
        hasMoreData = false;
      }
      
      currentPage++;
    }

    if (!silent) console.log(`🎉 Hoan thanh! Tong cộng thu thap duoc ${allProducts.length} san pham tu ${currentPage - 1} trang`);
    return allProducts;
  }

  // Thu thap du lieu voi retry mechanism
  async crawlProductsWithRetry(maxPages = 10, perPage = 100, orderBy = 'date', order = 'desc', maxRetries = 3, silent = false) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.crawlProducts(maxPages, perPage, orderBy, order, silent);
      } catch (error) {
        retryCount++;
        if (!silent) console.error(`❌ Lan thu ${retryCount} that bai:`, error.message);
        
        if (retryCount < maxRetries) {
          const waitTime = retryCount * 5000; // Tang thoi gian cho moi lan retry
          if (!silent) console.log(`⏳ Doi ${waitTime}ms truoc khi thu lai...`);
          await this.sleep(waitTime);
        } else {
          if (!silent) console.error(`💥 Da thu ${maxRetries} lan nhung khong thanh cong. Dung thu thap.`);
          throw error;
        }
      }
    }
  }

  // Kiem tra ket noi API
  async testConnection(silent = false) {
    try {
      const url = this.buildApiUrl(1, 1, 'date', 'desc');
      if (!silent) console.log('Dang kiem tra ket noi API...');
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200) {
        if (!silent) console.log('✅ Ket noi API thanh cong!');
        return true;
      } else {
        if (!silent) console.log('⚠️ Ket noi API khong on dịnh');
        return false;
      }
    } catch (error) {
      if (!silent) console.error('Khong the ket noi API:', error.message);
      return false;
    }
  }

  // Lay thong tin tong quan về API
  async getApiInfo() {
    try {
      const url = this.buildApiUrl(1, 1, 'date', 'desc');
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        const totalProducts = response.data.length > 0 ? 'Có du lieu' : 'Khong có du lieu';
        console.log(`Thong tin API:`);
        console.log(`   - URL: ${url}`);
        console.log(`   - Trang thai: ${response.status}`);
        console.log(`   - Du lieu: ${totalProducts}`);
        return true;
      }
    } catch (error) {
      console.error('Khong the lay thong tin API:', error.message);
      return false;
    }
  }
}

module.exports = ProductCrawler;
