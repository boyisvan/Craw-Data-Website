const axios = require('axios');
const config = require('./config');

class ProductCrawler {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.endpoint = config.productsEndpoint;
    this.delay = config.defaultConfig.delay;
  }

  // Cho phép thay đổi baseUrl động theo site được chọn
  setBaseUrl(baseUrl) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  // Tạo URL API với tham số
  buildApiUrl(page = 1, perPage = 100, orderBy = 'date', order = 'desc') {
    const params = new URLSearchParams({
      per_page: perPage,
      page: page,
      orderby: orderBy,
      order: order
    });
    
    return `${this.baseUrl}${this.endpoint}&${params.toString()}`;
  }

  // Delay giữa các request
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Thu thập dữ liệu từ một trang
  async fetchPage(page, perPage, orderBy, order) {
    try {
      const url = this.buildApiUrl(page, perPage, orderBy, order);
      console.log(`📄 Đang thu thập trang ${page}...`);
      
      const response = await axios.get(url, {
        timeout: 30000, // 30 giây timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        console.log(`✅ Trang ${page}: Thu thập thành công ${response.data.length} sản phẩm`);
        return response.data;
      } else {
        console.log(`⚠️ Trang ${page}: Không có dữ liệu hoặc response không hợp lệ`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Lỗi khi thu thập trang ${page}:`, error.message);
      return [];
    }
  }

  // Thu thập dữ liệu từ nhiều trang
  async crawlProducts(maxPages = 10, perPage = 100, orderBy = 'date', order = 'desc') {
    const allProducts = [];
    let currentPage = 1;
    let hasMoreData = true;

    console.log(`Bắt đầu thu thập dữ liệu từ ${maxPages} trang...`);
    console.log(`Cấu hình: ${perPage} sản phẩm/trang, sắp xếp theo ${orderBy} ${order}`);

    while (currentPage <= maxPages && hasMoreData) {
      const products = await this.fetchPage(currentPage, perPage, orderBy, order);
      
      if (products && products.length > 0) {
        allProducts.push(...products);
        console.log(`📈 Tổng số sản phẩm đã thu thập: ${allProducts.length}`);
        
        // Delay giữa các request để tránh bị block
        if (currentPage < maxPages) {
          console.log(`⏳ Đợi ${this.delay}ms trước khi thu thập trang tiếp theo...`);
          await this.sleep(this.delay);
        }
      } else {
        console.log(`🏁 Không còn dữ liệu ở trang ${currentPage}, dừng thu thập`);
        hasMoreData = false;
      }
      
      currentPage++;
    }

    console.log(`🎉 Hoàn thành! Tổng cộng thu thập được ${allProducts.length} sản phẩm từ ${currentPage - 1} trang`);
    return allProducts;
  }

  // Thu thập dữ liệu với retry mechanism
  async crawlProductsWithRetry(maxPages = 10, perPage = 100, orderBy = 'date', order = 'desc', maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        return await this.crawlProducts(maxPages, perPage, orderBy, order);
      } catch (error) {
        retryCount++;
        console.error(`❌ Lần thử ${retryCount} thất bại:`, error.message);
        
        if (retryCount < maxRetries) {
          const waitTime = retryCount * 5000; // Tăng thời gian chờ mỗi lần retry
          console.log(`⏳ Đợi ${waitTime}ms trước khi thử lại...`);
          await this.sleep(waitTime);
        } else {
          console.error(`💥 Đã thử ${maxRetries} lần nhưng không thành công. Dừng thu thập.`);
          throw error;
        }
      }
    }
  }

  // Kiểm tra kết nối API
  async testConnection() {
    try {
      const url = this.buildApiUrl(1, 1, 'date', 'desc');
      console.log('Đang kiểm tra kết nối API...');
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200) {
        console.log('✅ Kết nối API thành công!');
        return true;
      } else {
        console.log('⚠️ Kết nối API không ổn định');
        return false;
      }
    } catch (error) {
      console.error('Không thể kết nối API:', error.message);
      return false;
    }
  }

  // Lấy thông tin tổng quan về API
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
        const totalProducts = response.data.length > 0 ? 'Có dữ liệu' : 'Không có dữ liệu';
        console.log(`Thông tin API:`);
        console.log(`   - URL: ${url}`);
        console.log(`   - Trạng thái: ${response.status}`);
        console.log(`   - Dữ liệu: ${totalProducts}`);
        return true;
      }
    } catch (error) {
      console.error('Không thể lấy thông tin API:', error.message);
      return false;
    }
  }
}

module.exports = ProductCrawler;
