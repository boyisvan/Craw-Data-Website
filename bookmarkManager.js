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

  // Đổi site động và tai lai
  setSite(siteKey, silent = false) {
    this.siteKey = siteKey || null;
    this.bookmarkFile = this.getFilePath();
    this.bookmarks = this.loadBookmarks(silent);
  }

  // Tai danh sách bookmark từ file
  loadBookmarks(silent = false) {
    try {
      if (fs.existsSync(this.bookmarkFile)) {
        const data = fs.readFileSync(this.bookmarkFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      if (!silent) {
        console.log('Khong the tai file bookmark, tao moi...');
      }
    }
    return [];
  }

  // Lưu bookmark vào file
  saveBookmarks() {
    try {
      fs.writeFileSync(this.bookmarkFile, JSON.stringify(this.bookmarks, null, 2));
    } catch (error) {
      console.error('Loi khi lưu bookmark:', error.message);
    }
  }

  // Thêm bookmark moi
  addBookmark(product) {
    const bookmark = {
      id: product.id,
      slug: product.slug,
      permalink: product.permalink,
      name: product.name,
      addedAt: new Date().toISOString(),
      isDuplicate: false
    };
    
    // Thêm vào danh sách bookmark
    this.bookmarks.push(bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  // Kiem tra xem san phẩm có phai là duplicate khong
  isDuplicate(product) {
    return this.bookmarks.some(bookmark => 
      bookmark.id === product.id || 
      bookmark.slug === product.slug ||
      bookmark.permalink === product.permalink
    );
  }

  // Đánh dấu san phẩm là duplicate
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

  // Xóa tất ca bookmark
  clearBookmarks() {
    this.bookmarks = [];
    this.saveBookmarks();
  }

  // Tìm bookmark theo ID
  findBookmark(productId) {
    return this.bookmarks.find(b => b.id === productId);
  }

  // Kiem tra xem có bookmark nào khong
  hasBookmarks() {
    return this.bookmarks.length > 0;
  }

  // Lấy số lượng bookmark
  getBookmarkCount() {
    return this.bookmarks.length;
  }
}

module.exports = BookmarkManager;
