const inquirer = require('inquirer');
// Compatibility shim for Inquirer v9 (ESM default export)
if (typeof inquirer.prompt !== 'function') {
  inquirer.prompt = async (...args) => {
    const mod = await import('inquirer');
    const realPrompt = (mod.default && mod.default.prompt) || mod.prompt;
    return realPrompt(...args);
  };
}
const chalk = require('chalk');
const ProductCrawler = require('./productCrawler');
const BookmarkManager = require('./bookmarkManager');
const CsvExporter = require('./csvExporter');
const CrawlStateManager = require('./crawlStateManager');
const config = require('./config');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

class TorunstyleCrawlerApp {
  constructor() {
    this.crawler = new ProductCrawler();
    this.bookmarkManager = new BookmarkManager();
    this.csvExporter = new CsvExporter();
    this.crawlState = new CrawlStateManager();
    this.collectedProducts = [];
    this.lastActionSummary = null;
    this.skipClearOnce = false;
    this.currentSite = null;
  }

  // Sleep utility
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Intro banner voi hieu ung danh chu
  async showIntroBanner() {
    console.clear();
    const message = '          tool craw by trumpany';
    const border = '══════════════════════════════════════════════════════════════';
    console.log(chalk.blue.bold('╔' + border + '╗'));
    process.stdout.write(chalk.blue.bold('║ '));
    for (const ch of message) {
      process.stdout.write(chalk.white.bold(ch));
      await this.sleep(10);
    }
    const padLen = border.length - message.length - 1; // -1 vì da co khoang trang dau
    if (padLen > 0) process.stdout.write(' '.repeat(padLen));
    console.log(chalk.blue.bold('║'));
    console.log(chalk.blue.bold('╚' + border + '╝'));
    console.log('');
    await this.sleep(300);
  }

  // Hien thi banner
  showBanner() {
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    const title = this.currentSite?.banner || 'TORUNSTYLE CRAWLER';
    console.log(chalk.blue.bold(`║                    ${title.padEnd(42)}║`));
    console.log(chalk.blue.bold('║              Thu thap du lieu san pham tu dong               ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  // Kiem tra san pham moi cho tat ca website
  async checkAllSitesForNewProducts() {
    console.log(chalk.blue('🔍 Dang kiem tra san pham moi tren tat ca website...'));
    
    const results = [];
    const allSites = [...config.sites];
    
    for (const site of allSites) {
      // Hien thị dòng đang kiem tra
      process.stdout.write(chalk.gray(`   Dang kiem tra: ${site.name}... `));
      
      try {
        // Tam thời set crawler cho site này
        this.crawler.setBaseUrl(site.baseUrl);
        
        // Kiem tra kết nối
        const isConnected = await this.crawler.testConnection(true); // silent mode
        if (!isConnected) {
          results.push({
            site: site.name,
            status: 'error',
            message: 'Khong the kết nối API'
          });
          console.log(chalk.red('❌'));
          continue;
        }
        
        // Lay 5 san pham đầu tiên đe so sanh
        const products = await this.crawler.crawlProductsWithRetry(1, 5, 'date', 'desc', 3, true); // silent mode
        
        if (products.length === 0) {
          results.push({
            site: site.name,
            status: 'error',
            message: 'Khong co san pham'
          });
          console.log(chalk.red('❌'));
          continue;
        }
        
        // Tam thời set bookmark manager cho site này
        const originalSiteKey = this.bookmarkManager.siteKey;
        this.bookmarkManager.setSite(site.key, true); // silent mode
        
        // Kiem tra xem co bookmark khong
        const bookmarks = this.bookmarkManager.getBookmarks();
        
        if (bookmarks.length === 0) {
          results.push({
            site: site.name,
            status: 'new',
            message: 'Chua co bookmark - co the co san pham moi'
          });
          console.log(chalk.green('✅'));
        } else {
          // So sanh voi bookmark đầu tiên
          const firstProduct = products[0];
          const firstBookmark = bookmarks[0];
          
          const isDuplicate = this.bookmarkManager.isDuplicate(firstProduct);
          
          if (isDuplicate) {
            results.push({
              site: site.name,
              status: 'no_new',
              message: 'Chua co san pham moi'
            });
            console.log(chalk.yellow('⚠️'));
          } else {
            results.push({
              site: site.name,
              status: 'new',
              message: 'Co san pham moi!'
            });
            console.log(chalk.green('✅'));
          }
        }
        
        // Khoi phục bookmark manager về site gốc
        this.bookmarkManager.setSite(originalSiteKey);
        
      } catch (error) {
        results.push({
          site: site.name,
          status: 'error',
          message: `Loi: ${error.message}`
        });
        console.log(chalk.red('❌'));
      }
    }
    
    console.log(''); // Dòng trống
    // Hien thị kết qua dang bang
    this.displaySiteStatusTable(results);
    
    return results;
  }
  
  // Hien thị bang trang thai website
  displaySiteStatusTable(results) {
    console.log(chalk.blue.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║                    TRaNG THaI WEBSITE                      ║'));
    console.log(chalk.blue.bold('╠════════════════════════════════════════════════════════════╣'));
    
    const maxSiteName = Math.max(...results.map(r => r.site.length), 'Website'.length);
    const maxMessage = Math.max(...results.map(r => r.message.length), 'Trang thai'.length);
    
    // Header
    console.log(chalk.blue.bold(`║ ${'Website'.padEnd(maxSiteName)} │ ${'Trang thai'.padEnd(maxMessage)} ║`));
    console.log(chalk.blue.bold('╟' + '─'.repeat(maxSiteName + 2) + '┼' + '─'.repeat(maxMessage + 2) + '╢'));
    
    // Rows
    results.forEach(result => {
      const siteName = result.site.padEnd(maxSiteName);
      const message = result.message.padEnd(maxMessage);
      
      let statusColor;
      switch (result.status) {
        case 'new':
          statusColor = chalk.green;
          break;
        case 'no_new':
          statusColor = chalk.yellow;
          break;
        case 'error':
          statusColor = chalk.red;
          break;
        default:
          statusColor = chalk.white;
      }
      
      console.log(`║ ${chalk.white(siteName)} │ ${statusColor(message)} ║`);
    });
    
    console.log(chalk.blue.bold('╚' + '═'.repeat(maxSiteName + 2) + '┴' + '═'.repeat(maxMessage + 2) + '╝'));
    console.log('');
  }

  // Menu lựa chon cach chon website
  async showSiteSelectionMenu() {
    console.log(chalk.blue('Chon cach kiem tra website:'));
    console.log('');
    
    const choices = [
      { name: '1️.Kiem tra tat ca website truoc (xem trang thai)', value: 'check_first' },
      { name: '2️.Chon website luon (bo qua kiem tra)', value: 'select_direct' }
    ];
    
    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Chon hanh dong:',
        choices: choices
      }
    ]);
    
    return selection;
  }

  // Chon website truoc khi vao menu chinh
  async selectSite() {
    // Hien thị menu lựa chon
    const selection = await this.showSiteSelectionMenu();
    
    if (selection === 'check_first') {
      // Kiem tra san pham moi truoc
      await this.checkAllSitesForNewProducts();
    }
    
    const sites = config.sites;
    const maxName = Math.max(...sites.map(s => s.name.length), 'Site'.length);
    const maxUrl = Math.max(...sites.map(s => s.baseUrl.length), 'Base URL'.length);
    const header = `${'Site'.padEnd(maxName)}  ${'Base URL'.padEnd(maxUrl)}  Key`;
    const choices = [
      { name: header, value: '__header__', disabled: ' ' },
      ...sites.map(s => {
        const row = `${s.name.padEnd(maxName)}  ${s.baseUrl.padEnd(maxUrl)}  ${s.key}`;
        return { name: row, value: s.key };
      }),
      new inquirer.Separator(),
      { name: 'Them website khac (nhap thu cong)...', value: '__custom__' }
    ];
    let selected;
    while (true) {
      const ans = await inquirer.prompt([
        { type: 'list', name: 'selected', message: 'Chon website:', choices }
      ]);
      if (ans.selected === '__header__') continue;
      selected = ans.selected;
      break;
    }
    if (selected === '__custom__') {
      const input = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Ten website (hien thi):', validate: v => v && v.trim().length > 0 ? true : 'Nhap ten' },
        { type: 'input', name: 'baseUrl', message: 'Base URL (vi du https://example.com):', validate: v => /^https?:\/\//i.test(v) ? true : 'URL phai bat dau bang http(s)://' },
        { type: 'input', name: 'key', message: 'Ma key (vidu keeptee):', filter: v => String(v||'').toLowerCase().replace(/\s+/g,'-'), validate: v => /^[a-z0-9-_]+$/.test(v) ? true : 'Chỉ a-z 0-9 - _' },
        { type: 'input', name: 'banner', message: 'Ten Banner (vidu KEEPTEE CRAWL):', default: '' }
      ]);
      const customSite = { key: input.key, name: input.name, baseUrl: input.baseUrl.replace(/\/$/, ''), banner: input.banner || `${input.name.toUpperCase()} CRAWLER` };
      // Thử ket noi truoc khi chap nhan
      this.crawler.setBaseUrl(customSite.baseUrl);
      const ok = await this.crawler.testConnection();
      if (!ok) {
        console.log(chalk.red('Khong the ket noi API voi site moi. Vui long kiem tra URL.'));
        return await this.selectSite();
      }
      this.currentSite = customSite;
      this.bookmarkManager.setSite(this.currentSite.key);
      this.crawlState.setSite(this.currentSite.key);
      return;
    }
    this.currentSite = config.sites.find(s => s.key === selected) || null;
    if (this.currentSite) {
      this.crawler.setBaseUrl(this.currentSite.baseUrl);
      this.bookmarkManager.setSite(this.currentSite.key);
      this.crawlState.setSite(this.currentSite.key);
    }
  }

  // Menu chinh
  async showMainMenu() {
    const choices = [
      { name: 'Bat dau thu thap du lieu', value: 'crawl' },
      { name: 'Xem thong ke bookmark', value: 'stats' },
      { name: 'Kiem tra ket noi API', value: 'test' },
      { name: 'Kiem tra tat ca website', value: 'check_all_sites' },
      { name: 'Xem danh sach bookmark', value: 'list' },
      { name: 'Xoa tat ca bookmark', value: 'clear' },
      { name: 'Xuat du lieu ra CSV', value: 'export' },
      { name: 'Doi website', value: 'switch_site' },
      { name: 'Thoat', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Chon hanh dong:',
        choices: choices
      }
    ]);

    return action;
  }

  // Hien thi separator
  showSeparator() {
    console.log(chalk.gray('────────────────────────────────────────────────────────────────────────────'));
  }

  // Render chỉ banner + tom tat hanh dong gan nhat
  async renderContinueScreen() {
    console.clear();
    this.showBanner();
    if (this.lastActionSummary) {
      const { title, lines } = this.lastActionSummary;
      console.log(chalk.white.bold(title));
      this.showSeparator();
      if (Array.isArray(lines)) {
        lines.forEach(l => console.log(l));
      }
      this.showSeparator();
    }
    await inquirer.prompt([
      { type: 'input', name: 'continue', message: 'Nhan Enter de tiep tuc...' }
    ]);
  }

  // Hien thi hop thoai SaveFile (Windows PowerShell). Tra về path hoac '' neu huy.
  async showWindowsSaveFileDialog(defaultPath) {
    try {
      if (process.platform !== 'win32') return '';
      const psScript = [
        "Add-Type -AssemblyName System.Windows.Forms | Out-Null",
        "$dlg = New-Object System.Windows.Forms.SaveFileDialog",
        `$dlg.Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*"`,
        `$dlg.Title = "Chon nơi luu file CSV"`,
        defaultPath ? `$dlg.FileName = "${defaultPath.replace(/`/g, '``').replace(/"/g, '``"')}"` : '',
        "if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {",
        "  Write-Output $dlg.FileName",
        "}"
      ].filter(Boolean).join('; ');
      const output = execFileSync('powershell.exe', ['-NoProfile', '-STA', '-Command', psScript], { encoding: 'utf8' });
      return (output || '').trim();
    } catch (_) {
      return '';
    }
  }

  // Cau hình thu thap du lieu
  async getCrawlConfig() {
    const questions = [
      {
        type: 'input',
        name: 'maxPages',
        message: 'So trang toi da can thu thap:',
        default: config.defaultConfig.maxPages.toString(),
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= 100 ? true : 'Vui long nhap so tu 1-100';
        }
      },
      {
        type: 'input',
        name: 'perPage',
        message: 'So san pham moi trang:',
        default: config.defaultConfig.perPage.toString(),
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= 100 ? true : 'Vui long nhap so tu 1-100';
        }
      },
      {
        type: 'list',
        name: 'orderBy',
        message: 'Sap xep theo:',
        choices: [
          { name: 'Ngay tao (moi nhat)', value: 'date' },
          { name: 'Ten san pham', value: 'title' },
          { name: 'Gia', value: 'price' },
          { name: 'ID', value: 'id' }
        ],
        default: 'date'
      },
      {
        type: 'list',
        name: 'order',
        message: 'Thu tu sap xep:',
        choices: [
          { name: 'Giam dan (moi nhat)', value: 'desc' },
          { name: 'Tăng dan (cũ nhat)', value: 'asc' }
        ],
        default: 'desc'
      }
    ];

    return await inquirer.prompt(questions);
  }

  // Thu thap du lieu
  async crawlData() {
    try {
      console.log(chalk.yellow('Dang kiem tra ket noi API...'));
      const isConnected = await this.crawler.testConnection();
      
      if (!isConnected) {
        console.log(chalk.red('Khong the ket noi API. Vui long kiem tra lai.'));
        return;
      }

      const config = await this.getCrawlConfig();
      console.log(chalk.green('Ket noi thanh cong! Bat dau thu thap du lieu...'));
      
      this.collectedProducts = await this.crawler.crawlProductsWithRetry(
        parseInt(config.maxPages),
        parseInt(config.perPage),
        config.orderBy,
        config.order
      );

      if (this.collectedProducts.length > 0) {
        console.log(chalk.green(`🎉 Thu thap thanh cong ${this.collectedProducts.length} san pham!`));
        
        // Kiem tra duplicate va xử lý bookmark
        const dupStats = await this.processDuplicates();
        
        // Hoi co muon xuat CSV khong
        const { exportCsv } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'exportCsv',
            message: 'Ban co muon xuat du lieu ra CSV khong?',
            default: true
          }
        ]);

        if (exportCsv) {
          await this.exportToCsv();
        }
        this.lastActionSummary = {
          title: 'Tom tat lan thu thap',
          lines: [
            chalk.green(`🎉 Thu thap: ${this.collectedProducts.length} san pham`),
            chalk.white(`Moi: ${dupStats.newBookmarkCount}`),
            chalk.yellow(`Trung lap: ${dupStats.duplicateCount}`),
            chalk.white(`Tong bookmark: ${dupStats.totalBookmarks}`)
          ]
        };
      } else {
        console.log(chalk.yellow('⚠️ Khong thu thap duợc du lieu nao.'));
        this.lastActionSummary = {
          title: 'Thu thap du lieu',
          lines: [chalk.yellow('⚠️ Khong co du lieu')]
        };
      }
    } catch (error) {
      console.error(chalk.red('Loi khi thu thap du lieu:'), error.message);
      this.lastActionSummary = {
        title: 'Thu thap du lieu',
        lines: [chalk.red(`Loi: ${error.message}`)]
      };
    }
  }

  // Xử lý duplicate va bookmark
  async processDuplicates() {
    let duplicateCount = 0;
    let newBookmarkCount = 0;
    const lastTriplet = this.crawlState.getLastTriplet();
    const duplicateWindow = [];
    const currentTripletNew = [];
    const recentBookmarks = this.bookmarkManager.getBookmarks().map(b => b.permalink);
    let askedOnRecentBookmark = false;
    let shouldStopAtBookmark = false;

    for (const product of this.collectedProducts) {
      if (this.bookmarkManager.isDuplicate(product)) {
        duplicateCount++;
        this.bookmarkManager.markAsDuplicate(product);
        // Neu trung voi danh sach 5 bookmark dau tien, hoi mot lan
        if (!askedOnRecentBookmark && recentBookmarks.includes(product.permalink)) {
          const { stopRecent } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'stopRecent',
              message: chalk.yellow('Da gap link nam trong 5 bookmark dau tien. Dung lai khong?'),
              default: true
            }
          ]);
          askedOnRecentBookmark = true;
          if (stopRecent) {
            console.log(chalk.yellow('⏹️ Dung do da toi danh sach bookmark dau tien.'));
            shouldStopAtBookmark = true;
            break;
          }
        }
        // Cửa so 3 link duplicate gan nhat
        duplicateWindow.push(product.permalink);
        if (duplicateWindow.length > 3) duplicateWindow.shift();
        // Neu trung khop 3 link lien tiep voi state truoc do -> hoi dung
        if (
          lastTriplet.length === 3 &&
          duplicateWindow.length === 3 &&
          duplicateWindow[0] === lastTriplet[0] &&
          duplicateWindow[1] === lastTriplet[1] &&
          duplicateWindow[2] === lastTriplet[2]
        ) {
          const { stopHere } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'stopHere',
              message: chalk.yellow('Da gap cac link trung khop voi lan crawl truoc. Dung lai khong?'),
              default: true
            }
          ]);
          if (stopHere) {
            console.log(chalk.yellow('⏹️ Dung do da toi moc lan thu thap truoc.'));
            break;
          }
        }
      } else {
        // San pham khong phai duplicate
        newBookmarkCount++;
        // Luu 3 link dau tien cua lan crawl hien tai
        if (currentTripletNew.length < 3) {
          currentTripletNew.push(product.permalink);
        }
        // Reset cửa so duplicate lien tiep vì da gap hang moi
        duplicateWindow.length = 0;
      }
    }

    // Chỉ luu 5 bookmark đầu tiên nếu nguời dùng chon dừng lai
    if (shouldStopAtBookmark) {
      // Giữ nguyên bookmark hiện tai (đa co sẵn)
    } else {
      // Nếu khong dừng, chỉ luu 5 san pham đầu tiên của lần crawl này
      this.bookmarkManager.clearBookmarks(); // Xoa bookmark cũ
      const firstFiveProducts = this.collectedProducts.slice(0, 5);
      for (const product of firstFiveProducts) {
        this.bookmarkManager.addBookmark(product);
      }
    }

    console.log(chalk.blue(`Thong ke:`));
    console.log(chalk.blue(`   - San pham moi: ${newBookmarkCount}`));
    console.log(chalk.blue(`   - San pham trung lap: ${duplicateCount}`));
    console.log(chalk.blue(`   - Tong bookmark: ${this.bookmarkManager.getBookmarkCount()}`));

    // Sau khi ket thúc neu co du 3 link moi dau tien thì luu lai lam moc cho lan sau
    if (currentTripletNew.length === 3) {
      this.crawlState.saveNewTriplet(currentTripletNew);
      console.log(chalk.gray('Da luu moc 5 link dau tien cho lan crawl sau.'));
    }
    return {
      newBookmarkCount,
      duplicateCount,
      totalBookmarks: this.bookmarkManager.getBookmarkCount()
    };
  }

  // Xuat du lieu ra CSV
  async exportToCsv() {
    try {
      if (this.collectedProducts.length === 0) {
        console.log(chalk.yellow('⚠️ Khong co du lieu de xuat.'));
        return;
      }

      const { exportType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'exportType',
          message: 'Chon kieu xuat CSV:',
          choices: [
            { name: '📄 Xuat thuong', value: 'normal' },
            { name: '🌟 Xuat voi highlight duplicate', value: 'highlight' }
          ]
        }
      ]);

      // Chon nơi luu file: thử mở SaveFile dialog (Windows). Neu huy, fallback hoi input.
      let customPath = await this.showWindowsSaveFileDialog('products.csv');
      if (!customPath) {
        const ask = await inquirer.prompt([
          {
            type: 'input',
            name: 'customPath',
            message: `Nhap duong dan luu file CSV (Enter de dung mac dinh: ${config.csvOutputFile}):`,
            default: '',
          }
        ]);
        customPath = ask.customPath;
      }

      let success = false;
      if (exportType === 'highlight') {
        success = await this.csvExporter.exportToCsvWithHighlight(this.collectedProducts, this.bookmarkManager, customPath || undefined);
      } else {
        success = await this.csvExporter.exportToCsv(this.collectedProducts, this.bookmarkManager, customPath || undefined);
      }

      if (success) {
        const finalPath = customPath || config.csvOutputFile;
        console.log(chalk.green(`Xuat CSV thanh cong! File: ${finalPath}`));
        // Mở thu muc chua file tren Windows
        try {
          const folder = path.dirname(finalPath);
          if (process.platform === 'win32') {
            spawn('explorer', [folder], { detached: true, stdio: 'ignore' }).unref();
          }
        } catch (_) {}
        this.lastActionSummary = {
          title: 'Xuat CSV',
          lines: [chalk.green(`Da xuat file: ${finalPath}`)]
        };
      }
    } catch (error) {
      console.error(chalk.red('Loi khi xuat CSV:'), error.message);
      this.lastActionSummary = {
        title: 'Xuat CSV',
        lines: [chalk.red(`Loi: ${error.message}`)]
      };
    }
  }

  // Hien thi thong ke
  showStats() {
    const bookmarks = this.bookmarkManager.getBookmarks();
    const totalBookmarks = bookmarks.length;
    const duplicates = bookmarks.filter(b => b.isDuplicate).length;
    const newBookmarks = totalBookmarks - duplicates;

    console.log(chalk.blue('THoNG Ke BOOKMARK'));
    console.log(chalk.blue('═══════════════════════'));
    console.log(chalk.white(`Tong so bookmark: ${totalBookmarks}`));
    console.log(chalk.green(`Bookmark moi: ${newBookmarks}`));
    console.log(chalk.yellow(`Bookmark trung lap: ${duplicates}`));
    
    if (totalBookmarks > 0) {
      const duplicateRate = ((duplicates / totalBookmarks) * 100).toFixed(2);
      console.log(chalk.blue(`📈 Ty le trung lap: ${duplicateRate}%`));
    }
    this.lastActionSummary = {
      title: 'Thong ke bookmark',
      lines: [
        chalk.white(`Tong: ${totalBookmarks}`),
        chalk.green(`Moi: ${newBookmarks}`),
        chalk.yellow(`Trung: ${duplicates}`)
      ]
    };
  }

  // Hien thi danh sach bookmark
  async showBookmarkList() {
    const bookmarks = this.bookmarkManager.getBookmarks();
    
    if (bookmarks.length === 0) {
      console.log(chalk.yellow('📭 Khong co bookmark nao.'));
      this.lastActionSummary = { title: 'Danh sach bookmark', lines: [chalk.yellow('📭 Khong co bookmark')] };
      return;
    }

    console.log(chalk.blue(`BOOKMARK (${bookmarks.length})`));
    this.showSeparator();
    bookmarks.forEach((bookmark, index) => {
      console.log(chalk.white(`${index + 1}. ${bookmark.permalink}`));
    });
    this.showSeparator();
    this.lastActionSummary = { title: 'Danh sach bookmark', lines: [chalk.white(`Tong permalink: ${bookmarks.length}`)] };
    // de nguoi dung doc list ngay, tam thoi khong clear lai man hình cho prompt Enter tiep theo
    this.skipClearOnce = true;
  }

  // Xoa bookmark
  async clearBookmarks() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red('⚠️ Ban co chac chan muon xoa TaT Ca bookmark khong?'),
        default: false
      }
    ]);

    if (confirm) {
      this.bookmarkManager.clearBookmarks();
      console.log(chalk.green('Da xoa tat ca bookmark!'));
      this.lastActionSummary = { title: 'Xoa bookmark', lines: [chalk.green('Da xoa tat ca')] };
    } else {
      console.log(chalk.yellow('❌ Huy xoa bookmark.'));
      this.lastActionSummary = { title: 'Xoa bookmark', lines: [chalk.yellow('❌ da huy')] };
    }
  }

  // Chay ung dung
  async run() {
    await this.showIntroBanner();
    await this.selectSite();
    this.showBanner();
    
    while (true) {
      try {
        const action = await this.showMainMenu();
        
        switch (action) {
          case 'crawl':
            await this.crawlData();
            break;
          case 'stats':
            this.showStats();
            break;
          case 'test':
            {
              const ok = await this.crawler.testConnection();
              this.lastActionSummary = {
                title: 'Kiem tra ket noi API',
                lines: [
                  ok
                    ? chalk.green('✅ Ket noi API thanh cong!')
                    : chalk.yellow('⚠️ Ket noi API khong on dinh hoac loi')
                ]
              };
            }
            break;
          case 'check_all_sites':
            await this.checkAllSitesForNewProducts();
            this.lastActionSummary = {
              title: 'Kiem tra tat ca website',
              lines: [chalk.blue('Đa kiem tra trang thai tat ca website')]
            };
            break;
          case 'list':
            await this.showBookmarkList();
            break;
          case 'clear':
            await this.clearBookmarks();
            break;
          case 'export':
            await this.exportToCsv();
            break;
          case 'switch_site':
            await this.selectSite();
            // Sau khi doi site, refresh banner va dat tom tat
            console.clear();
            this.showBanner();
            this.lastActionSummary = {
              title: 'Doi website',
              lines: [chalk.white(`Da chuyen sang: ${this.currentSite?.name} (${this.currentSite?.baseUrl})`)]
            };
            break;
          case 'exit':
            console.log(chalk.blue('👋 Tam biet!'));
            process.exit(0);
            break;
        }
        
        // dợi nguoi dung nhan Enter de tiep tuc
        if (action !== 'exit') {
          if (this.skipClearOnce) {
            // Hanh dong da tu hien thi va tu prompt, khong clear lai
            this.skipClearOnce = false;
          } else {
            await this.renderContinueScreen();
          }
        }
      } catch (error) {
        console.error(chalk.red('❌ Loi khong mong muon:'), error.message);
        await inquirer.prompt([
          {
            type: 'input',
            name: 'continue',
            message: 'Nhan Enter de tiep tuc...'
          }
        ]);
      }
    }
  }
}

// Chay ung dung
if (require.main === module) {
  const app = new TorunstyleCrawlerApp();
  app.run().catch(error => {
    console.error(chalk.red('💥 Loi nghiem trong:'), error);
    process.exit(1);
  });
}

module.exports = TorunstyleCrawlerApp;
