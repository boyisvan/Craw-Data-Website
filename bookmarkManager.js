const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class BookmarkManager {
  constructor(siteKey = null) {
    this.siteKey = siteKey;
    this.bookmarkFile = this.getFilePath();
    this.bookmarks = this.loadBookmarks();
  }

  // Xây dựng đường dẫn file theo site
  getFilePath() {
    if (!this.siteKey) return config.bookmarkFile;
    const dir = path.join(config.dataDir, this.siteKey);
    fs.ensureDirSync(dir);
    return path.join(dir, 'bookmarks.json');
  }

  // Đổi site động và tải lại
  setSite(siteKey) {
    this.siteKey = siteKey || null;
    this.bookmarkFile = this.getFilePath();
    this.bookmarks = this.loadBookmarks();
  }

  // Tải danh sách bookmark từ file
  loadBookmarks() {
    try {
      if (fs.existsSync(this.bookmarkFile)) {
        const data = fs.readFileSync(this.bookmarkFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Không thể tải file bookmark, tạo mới...');
    }
    return [];
  }

  // Lưu bookmark vào file
  saveBookmarks() {
    try {
      fs.writeFileSync(this.bookmarkFile, JSON.stringify(this.bookmarks, null, 2));
    } catch (error) {
      console.error('Lỗi khi lưu bookmark:', error.message);
    }
  }

  // Thêm bookmark mới
  addBookmark(product) {
    const bookmark = {
      id: product.id,
      slug: product.slug,
      permalink: product.permalink,
      name: product.name,
      addedAt: new Date().toISOString(),
      isDuplicate: false
    };
    
    // Chỉ giữ 5 link mới nhất: thêm vào cuối và cắt bớt đầu nếu vượt quá 5
    // Thêm vào đầu danh sách để ưu tiên mới nhất đứng trước
    this.bookmarks.unshift(bookmark);
    // Chỉ giữ 5 phần tử đầu tiên
    if (this.bookmarks.length > 5) this.bookmarks.length = 5;
    this.saveBookmarks();
    return bookmark;
  }

  // Kiểm tra xem sản phẩm có phải là duplicate không
  isDuplicate(product) {
    return this.bookmarks.some(bookmark => 
      bookmark.id === product.id || 
      bookmark.slug === product.slug ||
      bookmark.permalink === product.permalink
    );
  }

  // Đánh dấu sản phẩm là duplicate
  markAsDuplicate(product) {
    const bookmark = this.bookmarks.find(b => 
      b.id === product.id || 
      b.slug === product.slug ||
      b.permalink === product.permalink
    );
    
    if (bookmark) {
      bookmark.isDuplicate = true;
      bookmark.duplicateAt = new Date().toISOString();
      this.saveBookmarks();
    }
  }

  // Lấy danh sách bookmark
  getBookmarks() {
    return this.bookmarks;
  }

  // Xóa bookmark
  removeBookmark(productId) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== productId);
    this.saveBookmarks();
  }

  // Xóa tất cả bookmark
  clearBookmarks() {
    this.bookmarks = [];
    this.saveBookmarks();
  }

  // Tìm bookmark theo ID
  findBookmark(productId) {
    return this.bookmarks.find(b => b.id === productId);
  }

  // Kiểm tra xem có bookmark nào không
  hasBookmarks() {
    return this.bookmarks.length > 0;
  }

  // Lấy số lượng bookmark
  getBookmarkCount() {
    return this.bookmarks.length;
  }
}

module.exports = BookmarkManager;
