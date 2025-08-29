const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const config = require('./config');
const fs = require('fs-extra');
const path = require('path');

class CsvExporter {
  constructor() {
    this.header = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Ten san pham' },
        { id: 'slug', title: 'Slug' },
        { id: 'permalink', title: 'Link san pham' },
        { id: 'sku', title: 'SKU' },
        { id: 'short_description', title: 'Mo ta ngan' },
        { id: 'description', title: 'Mo ta chi tiet' },
        { id: 'on_sale', title: 'dang giam gia' },
        { id: 'price', title: 'Gia' },
        { id: 'regular_price', title: 'Gia goc' },
        { id: 'sale_price', title: 'Gia khuyen mai' },
        { id: 'currency', title: 'Tien te' },
        { id: 'average_rating', title: 'Danh gia trung bình' },
        { id: 'review_count', title: 'So luong danh gia' },
        { id: 'image_urls', title: 'URL hình anh' },
        { id: 'categories', title: 'Danh mục' },
        { id: 'tags', title: 'Tags' },
        { id: 'brands', title: 'Thuong hieu' },
        { id: 'is_purchasable', title: 'Co the mua' },
        { id: 'is_in_stock', title: 'Stock' },
        { id: 'stock_status', title: 'Trạng thai kho' },
        { id: 'is_duplicate', title: 'Trung lap' },
        { id: 'bookmarked_at', title: 'Thoi gian danh dau' }
    ];
  }

  // Tạo writer theo duong dẫn
  createWriter(outputFilePath) {
    const finalPath = outputFilePath || config.csvOutputFile;
    const dir = path.dirname(finalPath);
    fs.ensureDirSync(dir);
    return createCsvWriter({ path: finalPath, header: this.header });
  }

  // Chuan hoa ten san pham: bỏ tien to *DUPLICATE*
  sanitizeName(name) {
    if (!name) return '';
    return String(name).replace(/^\*DUPLICATE\*\s*/i, '').trim();
  }

  // dịnh dạng gia từ minor units (vd: 3995 -> 39.95 với minor_unit=2)
  formatPrice(prices, field) {
    if (!prices) return '';
    const raw = prices[field];
    const minorUnit = Number.isInteger(prices.currency_minor_unit) ? prices.currency_minor_unit : 2;
    if (raw == null || raw === '') return '';
    const str = String(raw);
    if (!/^-?\d+$/.test(str)) return str; // neu da là dạng co dau cham thì giữ nguyen
    const isNegative = str.startsWith('-');
    const digits = isNegative ? str.slice(1) : str;
    const padded = digits.padStart(minorUnit + 1, '0');
    const integerPart = padded.slice(0, padded.length - minorUnit);
    const fractionalPart = padded.slice(-minorUnit);
    const formatted = `${integerPart}.${fractionalPart}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Chuan bị dữ lieu cho CSV
  prepareProductData(product, isDuplicate = false, bookmarkedAt = null) {
    return {
      id: product.id || '',
      name: this.sanitizeName(product.name || ''),
      slug: product.slug || '',
      permalink: product.permalink || '',
      sku: product.sku || '',
      short_description: this.cleanHtml(product.short_description || ''),
      description: this.cleanHtml(product.description || ''),
      on_sale: product.on_sale ? 'Co' : 'Khong',
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
      is_purchasable: product.is_purchasable ? 'Co' : 'Khong',
      is_in_stock: product.is_in_stock ? 'in_stock' : 'out_of_stock',
      stock_status: product.stock_availability?.text || '',
      is_duplicate: isDuplicate ? 'Co' : 'Khong',
      bookmarked_at: bookmarkedAt || ''
    };
  }

  // Làm sạch HTML tags
  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Xoa HTML tags
      .replace(/&nbsp;/g, ' ') // Thay the &nbsp;
      .replace(/&amp;/g, '&') // Thay the &amp;
      .replace(/&lt;/g, '<') // Thay the &lt;
      .replace(/&gt;/g, '>') // Thay the &gt;
      .replace(/&quot;/g, '"') // Thay the &quot;
      .replace(/&#8217;/g, "'") // Thay the &#8217;
      .replace(/&#8216;/g, "'") // Thay the &#8216;
      .replace(/&#8211;/g, '-') // Thay the &#8211;
      .replace(/&#8212;/g, '--') // Thay the &#8212;
      .trim();
  }

  // Trích xuat URL hình anh
  extractImageUrls(images) {
    if (!images || !Array.isArray(images)) return '';
    return images.map(img => img.src).join(' | ');
  }

  // Trích xuat danh mục
  extractCategories(categories) {
    if (!categories || !Array.isArray(categories)) return '';
    return categories.map(cat => cat.name).join(' | ');
  }

  // Trích xuat tags
  extractTags(tags) {
    if (!tags || !Array.isArray(tags)) return '';
    return tags.map(tag => tag.name).join(' | ');
  }

  // Trích xuat thuong hieu
  extractBrands(brands) {
    if (!brands || !Array.isArray(brands)) return '';
    return brands.map(brand => brand.name).join(' | ');
  }

  // Xuat dữ lieu ra CSV
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
      console.log(`Da xuat ${csvData.length} san pham ra file CSV: ${outputFilePath || config.csvOutputFile}`);
      return true;
    } catch (error) {
      console.error('Lỗi khi xuat CSV:', error.message);
      return false;
    }
  }

  // Xuat dữ lieu ra CSV với highlight cho duplicate
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
      console.log(`Da xuat ${csvData.length} san pham ra file CSV với highlight: ${outputFilePath || config.csvOutputFile}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi xuat CSV với highlight:', error.message);
      return false;
    }
  }

  // Xuat dữ lieu ra CSV với thong tin tu khoa
  async exportToCsvWithKeyword(products, bookmarkManager, keyword, outputFilePath) {
    try {
      // Tao header moi voi thong tin tu khoa
      const keywordHeader = [
        ...this.header,
        { id: 'search_keyword', title: 'Tu khoa tim kiem' },
        { id: 'keyword_match_type', title: 'Loai khop tu khoa' }
      ];

      const csvData = products.map(product => {
        // Kiểm tra xem bookmarkManager có phải là keywordBookmarkManager không
        const isDuplicate = bookmarkManager.isDuplicate && bookmarkManager.isDuplicate.length === 2 
          ? bookmarkManager.isDuplicate(product, keyword)
          : bookmarkManager.isDuplicate(product);
        
        const bookmark = bookmarkManager.findBookmark && bookmarkManager.findBookmark.length === 2
          ? bookmarkManager.findBookmark(product.id, keyword)
          : bookmarkManager.findBookmark(product.id);
        
        const bookmarkedAt = bookmark ? bookmark.addedAt : '';
        
        const data = this.prepareProductData(product, isDuplicate, bookmarkedAt);
        
        // Them thong tin tu khoa
        data.search_keyword = keyword || '';
        data.keyword_match_type = this.getKeywordMatchType(product, keyword);

        return data;
      });

      // Tao writer voi header moi
      const finalPath = outputFilePath || config.csvOutputFile;
      const dir = path.dirname(finalPath);
      fs.ensureDirSync(dir);
      const writer = createCsvWriter({ path: finalPath, header: keywordHeader });
      
      await writer.writeRecords(csvData);
      console.log(`Da xuat ${csvData.length} san pham ra file CSV voi tu khoa "${keyword}": ${finalPath}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi xuat CSV voi tu khoa:', error.message);
      return false;
    }
  }

  // Xac dinh loai khop tu khoa
  getKeywordMatchType(product, keyword) {
    if (!keyword) return '';
    
    const keywordLower = keyword.toLowerCase();
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const shortDescription = (product.short_description || '').toLowerCase();
    const categories = Array.isArray(product.categories) 
      ? product.categories.map(cat => (cat.name || '').toLowerCase()).join(' ')
      : '';
    const tags = Array.isArray(product.tags)
      ? product.tags.map(tag => (tag.name || '').toLowerCase()).join(' ')
      : '';

    const matchTypes = [];
    
    if (name.includes(keywordLower)) matchTypes.push('Ten san pham');
    if (description.includes(keywordLower)) matchTypes.push('Mo ta');
    if (shortDescription.includes(keywordLower)) matchTypes.push('Mo ta ngan');
    if (categories.includes(keywordLower)) matchTypes.push('Danh muc');
    if (tags.includes(keywordLower)) matchTypes.push('Tags');

    return matchTypes.join(', ');
  }
}

module.exports = CsvExporter;
