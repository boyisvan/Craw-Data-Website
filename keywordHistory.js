const fs = require('fs');
const path = require('path');

class KeywordHistory {
  constructor() {
    this.historyFile = path.join(__dirname, 'keyword_history.json');
    this.history = this.loadHistory();
  }

  // Tai lich su tu khoa
  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Loi khi tai lich su tu khoa:', error.message);
    }
    return [];
  }

  // Luu lich su tu khoa
  saveHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (error) {
      console.error('Loi khi luu lich su tu khoa:', error.message);
    }
  }

  // Them tu khoa vao lich su
  addKeyword(keyword, siteKey, resultCount) {
    const entry = {
      keyword: keyword,
      siteKey: siteKey,
      resultCount: resultCount,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('vi-VN')
    };

    // Kiem tra xem tu khoa da ton tai chua
    const existingIndex = this.history.findIndex(item => 
      item.keyword.toLowerCase() === keyword.toLowerCase() && 
      item.siteKey === siteKey
    );

    if (existingIndex !== -1) {
      // Cap nhat entry cu
      this.history[existingIndex] = entry;
    } else {
      // Them entry moi
      this.history.unshift(entry);
    }

    // Gioi han so luong entry (chi giu 50 entry gan nhat)
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveHistory();
  }

  // Lay lich su tu khoa theo site
  getHistoryBySite(siteKey) {
    return this.history.filter(item => item.siteKey === siteKey);
  }

  // Lay tat ca lich su
  getAllHistory() {
    return this.history;
  }

  // Xoa lich su
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  // Lay tu khoa pho bien (top 10)
  getPopularKeywords(siteKey = null) {
    const filteredHistory = siteKey 
      ? this.history.filter(item => item.siteKey === siteKey)
      : this.history;

    const keywordCount = {};
    filteredHistory.forEach(item => {
      const keyword = item.keyword.toLowerCase();
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });

    return Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }
}

module.exports = KeywordHistory;
