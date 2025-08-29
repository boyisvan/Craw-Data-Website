const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class KeywordBookmarkManager {
  constructor(siteKey = null) {
    this.siteKey = siteKey;
    this.bookmarkFile = this.getFilePath();
    this.bookmarks = this.loadBookmarks();
  }

  // Xây dựng đường dẫn file theo site và từ khóa
  getFilePath() {
    if (!this.siteKey) return path.join(config.dataDir, 'keyword_bookmarks.json');
    const dir = path.join(config.dataDir, this.siteKey);
    fs.ensureDirSync(dir);
    return path.join(dir, 'keyword_bookmarks.json');
  }

  // Đổi site động và tải lại
  setSite(siteKey, silent = false) {
    this.siteKey = siteKey || null;
    this.bookmarkFile = this.getFilePath();
    this.bookmarks = this.loadBookmarks(silent);
  }

  // Tải danh sách bookmark từ file
  loadBookmarks(silent = false) {
    try {
      if (fs.existsSync(this.bookmarkFile)) {
        const data = fs.readFileSync(this.bookmarkFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      if (!silent) {
        console.log('Không thể tải file keyword bookmark, tạo mới...');
      }
    }
    return [];
  }

  // Lưu bookmark vào file
  saveBookmarks() {
    try {
      fs.writeFileSync(this.bookmarkFile, JSON.stringify(this.bookmarks, null, 2));
    } catch (error) {
      console.error('Lỗi khi lưu keyword bookmark:', error.message);
    }
  }

  // Thêm bookmark mới với từ khóa
  addBookmark(product, keyword) {
    const bookmark = {
      id: product.id,
      slug: product.slug,
      permalink: product.permalink,
      name: product.name,
      keyword: keyword,
      addedAt: new Date().toISOString(),
      isDuplicate: false
    };
    
    // Thêm vào danh sách bookmark
    this.bookmarks.push(bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  // Kiểm tra xem sản phẩm có phải là duplicate không (theo từ khóa)
  isDuplicate(product, keyword) {
    return this.bookmarks.some(bookmark => 
      (bookmark.id === product.id || 
       bookmark.slug === product.slug ||
       bookmark.permalink === product.permalink) &&
      bookmark.keyword === keyword
    );
  }

  // Đánh dấu sản phẩm là duplicate
  markAsDuplicate(product, keyword) {
    const bookmark = this.bookmarks.find(b => 
      (b.id === product.id || 
       b.slug === product.slug ||
       b.permalink === product.permalink) &&
      b.keyword === keyword
    );
    
    if (bookmark) {
      bookmark.isDuplicate = true;
      bookmark.duplicateAt = new Date().toISOString();
      this.saveBookmarks();
    }
  }

  // Lấy danh sách bookmark theo từ khóa
  getBookmarksByKeyword(keyword) {
    return this.bookmarks.filter(b => b.keyword === keyword);
  }

  // Lấy tất cả bookmark
  getBookmarks() {
    return this.bookmarks;
  }

  // Xóa bookmark theo từ khóa
  removeBookmarksByKeyword(keyword) {
    this.bookmarks = this.bookmarks.filter(b => b.keyword !== keyword);
    this.saveBookmarks();
  }

  // Xóa bookmark
  removeBookmark(productId, keyword) {
    this.bookmarks = this.bookmarks.filter(b => !(b.id === productId && b.keyword === keyword));
    this.saveBookmarks();
  }

  // Xóa tất cả bookmark
  clearBookmarks() {
    this.bookmarks = [];
    this.saveBookmarks();
  }

  // Tìm bookmark theo ID và từ khóa
  findBookmark(productId, keyword) {
    return this.bookmarks.find(b => b.id === productId && b.keyword === keyword);
  }

  // Kiểm tra xem có bookmark nào không
  hasBookmarks() {
    return this.bookmarks.length > 0;
  }

  // Kiểm tra xem có bookmark cho từ khóa nào không
  hasBookmarksForKeyword(keyword) {
    return this.bookmarks.some(b => b.keyword === keyword);
  }

  // Lấy số lượng bookmark
  getBookmarkCount() {
    return this.bookmarks.length;
  }

  // Lấy số lượng bookmark theo từ khóa
  getBookmarkCountByKeyword(keyword) {
    return this.bookmarks.filter(b => b.keyword === keyword).length;
  }

  // Lấy danh sách từ khóa đã có bookmark
  getKeywords() {
    return [...new Set(this.bookmarks.map(b => b.keyword))];
  }

  // Lấy thống kê bookmark theo từ khóa
  getKeywordStats() {
    const stats = {};
    this.bookmarks.forEach(bookmark => {
      if (!stats[bookmark.keyword]) {
        stats[bookmark.keyword] = {
          total: 0,
          duplicates: 0,
          new: 0
        };
      }
      stats[bookmark.keyword].total++;
      if (bookmark.isDuplicate) {
        stats[bookmark.keyword].duplicates++;
      } else {
        stats[bookmark.keyword].new++;
      }
    });
    return stats;
  }
}

module.exports = KeywordBookmarkManager;
