const fs = require('fs-extra');
const config = require('./config');

class CrawlStateManager {
  constructor(siteKey = null) {
    this.siteKey = siteKey;
    this.stateFile = this.getFilePath();
    this.state = this.loadState();
  }

  getFilePath() {
    if (!this.siteKey) return config.stateFile;
    const dir = require('path').join(config.dataDir, this.siteKey);
    fs.ensureDirSync(dir);
    return require('path').join(dir, 'crawlState.json');
  }

  setSite(siteKey) {
    this.siteKey = siteKey || null;
    this.stateFile = this.getFilePath();
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      // ignore
    }
    return { lastTriplet: [] };
  }

  saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      // ignore
    }
  }

  getLastTriplet() {
    return Array.isArray(this.state.lastTriplet) ? this.state.lastTriplet : [];
  }

  saveNewTriplet(triplet) {
    if (!Array.isArray(triplet) || triplet.length !== 3) return;
    this.state.lastTriplet = [...triplet];
    this.saveState();
  }
}

module.exports = CrawlStateManager;


