const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const config = require('./config');
const fs = require('fs-extra');
const path = require('path');

class CsvExporter {
  constructor() {
    this.header = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Tên sản phẩm' },
        { id: 'slug', title: 'Slug' },
        { id: 'permalink', title: 'Link sản phẩm' },
        { id: 'sku', title: 'SKU' },
        { id: 'short_description', title: 'Mô tả ngắn' },
        { id: 'description', title: 'Mô tả chi tiết' },
        { id: 'on_sale', title: 'Đang giảm giá' },
        { id: 'price', title: 'Giá' },
        { id: 'regular_price', title: 'Giá gốc' },
        { id: 'sale_price', title: 'Giá khuyến mãi' },
        { id: 'currency', title: 'Tiền tệ' },
        { id: 'average_rating', title: 'Đánh giá trung bình' },
        { id: 'review_count', title: 'Số lượng đánh giá' },
        { id: 'image_urls', title: 'URL hình ảnh' },
        { id: 'categories', title: 'Danh mục' },
        { id: 'tags', title: 'Tags' },
        { id: 'brands', title: 'Thương hiệu' },
        { id: 'is_purchasable', title: 'Có thể mua' },
        { id: 'is_in_stock', title: 'Stock' },
        { id: 'stock_status', title: 'Trạng thái kho' },
        { id: 'is_duplicate', title: 'Trùng lặp' },
        { id: 'bookmarked_at', title: 'Thời gian đánh dấu' }
    ];
  }

  // Tạo writer theo đường dẫn
  createWriter(outputFilePath) {
    const finalPath = outputFilePath || config.csvOutputFile;
    const dir = path.dirname(finalPath);
    fs.ensureDirSync(dir);
    return createCsvWriter({ path: finalPath, header: this.header });
  }

  // Chuẩn hóa tên sản phẩm: bỏ tiền tố *DUPLICATE*
  sanitizeName(name) {
    if (!name) return '';
    return String(name).replace(/^\*DUPLICATE\*\s*/i, '').trim();
  }

  // Định dạng giá từ minor units (vd: 3995 -> 39.95 với minor_unit=2)
  formatPrice(prices, field) {
    if (!prices) return '';
    const raw = prices[field];
    const minorUnit = Number.isInteger(prices.currency_minor_unit) ? prices.currency_minor_unit : 2;
    if (raw == null || raw === '') return '';
    const str = String(raw);
    if (!/^-?\d+$/.test(str)) return str; // nếu đã là dạng có dấu chấm thì giữ nguyên
    const isNegative = str.startsWith('-');
    const digits = isNegative ? str.slice(1) : str;
    const padded = digits.padStart(minorUnit + 1, '0');
    const integerPart = padded.slice(0, padded.length - minorUnit);
    const fractionalPart = padded.slice(-minorUnit);
    const formatted = `${integerPart}.${fractionalPart}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Chuẩn bị dữ liệu cho CSV
  prepareProductData(product, isDuplicate = false, bookmarkedAt = null) {
    return {
      id: product.id || '',
      name: this.sanitizeName(product.name || ''),
      slug: product.slug || '',
      permalink: product.permalink || '',
      sku: product.sku || '',
      short_description: this.cleanHtml(product.short_description || ''),
      description: this.cleanHtml(product.description || ''),
      on_sale: product.on_sale ? 'Có' : 'Không',
      price: this.formatPrice(product.prices, 'price'),
      regular_price: this.formatPrice(product.prices, 'regular_price'),
      sale_price: this.formatPrice(product.prices, 'sale_price'),
      currency: product.prices?.currency_code || '',
      average_rating: product.average_rating || '0',
      review_count: product.review_count || '0',
      image_urls: this.extractImageUrls(product.images),
      categories: this.extractCategories(product.categories),
      tags: this.extractTags(product.tags),
      brands: this.extractBrands(product.brands),
      is_purchasable: product.is_purchasable ? 'Có' : 'Không',
      is_in_stock: product.is_in_stock ? 'in_stock' : 'out_of_stock',
      stock_status: product.stock_availability?.text || '',
      is_duplicate: isDuplicate ? 'Có' : 'Không',
      bookmarked_at: bookmarkedAt || ''
    };
  }

  // Làm sạch HTML tags
  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Xóa HTML tags
      .replace(/&nbsp;/g, ' ') // Thay thế &nbsp;
      .replace(/&amp;/g, '&') // Thay thế &amp;
      .replace(/&lt;/g, '<') // Thay thế &lt;
      .replace(/&gt;/g, '>') // Thay thế &gt;
      .replace(/&quot;/g, '"') // Thay thế &quot;
      .replace(/&#8217;/g, "'") // Thay thế &#8217;
      .replace(/&#8216;/g, "'") // Thay thế &#8216;
      .replace(/&#8211;/g, '-') // Thay thế &#8211;
      .replace(/&#8212;/g, '--') // Thay thế &#8212;
      .trim();
  }

  // Trích xuất URL hình ảnh
  extractImageUrls(images) {
    if (!images || !Array.isArray(images)) return '';
    return images.map(img => img.src).join(' | ');
  }

  // Trích xuất danh mục
  extractCategories(categories) {
    if (!categories || !Array.isArray(categories)) return '';
    return categories.map(cat => cat.name).join(' | ');
  }

  // Trích xuất tags
  extractTags(tags) {
    if (!tags || !Array.isArray(tags)) return '';
    return tags.map(tag => tag.name).join(' | ');
  }

  // Trích xuất thương hiệu
  extractBrands(brands) {
    if (!brands || !Array.isArray(brands)) return '';
    return brands.map(brand => brand.name).join(' | ');
  }

  // Xuất dữ liệu ra CSV
  async exportToCsv(products, bookmarkManager, outputFilePath) {
    try {
      const csvData = products.map(product => {
        const isDuplicate = bookmarkManager.isDuplicate(product);
        const bookmark = bookmarkManager.findBookmark(product.id);
        const bookmarkedAt = bookmark ? bookmark.addedAt : '';
        
        return this.prepareProductData(product, isDuplicate, bookmarkedAt);
      });

      const writer = this.createWriter(outputFilePath);
      await writer.writeRecords(csvData);
      console.log(`✅ Đã xuất ${csvData.length} sản phẩm ra file CSV: ${outputFilePath || config.csvOutputFile}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi xuất CSV:', error.message);
      return false;
    }
  }

  // Xuất dữ liệu ra CSV với highlight cho duplicate
  async exportToCsvWithHighlight(products, bookmarkManager, outputFilePath) {
    try {
      const csvData = products.map(product => {
        const isDuplicate = bookmarkManager.isDuplicate(product);
        const bookmark = bookmarkManager.findBookmark(product.id);
        const bookmarkedAt = bookmark ? bookmark.addedAt : '';
        
        const data = this.prepareProductData(product, isDuplicate, bookmarkedAt);

        return data;
      });

      const writer = this.createWriter(outputFilePath);
      await writer.writeRecords(csvData);
      console.log(`✅ Đã xuất ${csvData.length} sản phẩm ra file CSV với highlight: ${outputFilePath || config.csvOutputFile}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi xuất CSV với highlight:', error.message);
      return false;
    }
  }
}

module.exports = CsvExporter;
