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

  // Intro banner với hiệu ứng đánh chữ
  async showIntroBanner() {
    console.clear();
    const message = '          tool craw by ducvancoder - trumpany';
    const border = '══════════════════════════════════════════════════════════════';
    console.log(chalk.blue.bold('╔' + border + '╗'));
    process.stdout.write(chalk.blue.bold('║ '));
    for (const ch of message) {
      process.stdout.write(chalk.white.bold(ch));
      await this.sleep(70);
    }
    const padLen = border.length - message.length - 1; // -1 vì đã có khoảng trắng đầu
    if (padLen > 0) process.stdout.write(' '.repeat(padLen));
    console.log(chalk.blue.bold('║'));
    console.log(chalk.blue.bold('╚' + border + '╝'));
    console.log('');
    await this.sleep(300);
  }

  // Hiển thị banner
  showBanner() {
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    const title = this.currentSite?.banner || 'TORUNSTYLE CRAWLER';
    console.log(chalk.blue.bold(`║                    ${title.padEnd(42)}║`));
    console.log(chalk.blue.bold('║              Thu thập dữ liệu sản phẩm tự động               ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  // Chọn website trước khi vào menu chính
  async selectSite() {
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
      { name: 'Thêm website khác (nhập thủ công)...', value: '__custom__' }
    ];
    let selected;
    while (true) {
      const ans = await inquirer.prompt([
        { type: 'list', name: 'selected', message: 'Chọn website:', choices }
      ]);
      if (ans.selected === '__header__') continue;
      selected = ans.selected;
      break;
    }
    if (selected === '__custom__') {
      const input = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Tên website (hiển thị):', validate: v => v && v.trim().length > 0 ? true : 'Nhập tên' },
        { type: 'input', name: 'baseUrl', message: 'Base URL (ví dụ https://example.com):', validate: v => /^https?:\/\//i.test(v) ? true : 'URL phải bắt đầu bằng http(s)://' },
        { type: 'input', name: 'key', message: 'Mã key (không dấu cách, a-z0-9-_):', filter: v => String(v||'').toLowerCase().replace(/\s+/g,'-'), validate: v => /^[a-z0-9-_]+$/.test(v) ? true : 'Chỉ a-z 0-9 - _' },
        { type: 'input', name: 'banner', message: 'Banner (tùy chọn):', default: '' }
      ]);
      const customSite = { key: input.key, name: input.name, baseUrl: input.baseUrl.replace(/\/$/, ''), banner: input.banner || `${input.name.toUpperCase()} CRAWLER` };
      // Thử kết nối trước khi chấp nhận
      this.crawler.setBaseUrl(customSite.baseUrl);
      const ok = await this.crawler.testConnection();
      if (!ok) {
        console.log(chalk.red('Không thể kết nối API với site mới. Vui lòng kiểm tra URL.'));
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

  // Menu chính
  async showMainMenu() {
    const choices = [
      { name: 'Bắt đầu thu thập dữ liệu', value: 'crawl' },
      { name: 'Xem thống kê bookmark', value: 'stats' },
      { name: 'Kiểm tra kết nối API', value: 'test' },
      { name: 'Xem danh sách bookmark', value: 'list' },
      { name: 'Xóa tất cả bookmark', value: 'clear' },
      { name: 'Xuất dữ liệu ra CSV', value: 'export' },
      { name: 'Đổi website', value: 'switch_site' },
      { name: 'Thoát', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Chọn hành động:',
        choices: choices
      }
    ]);

    return action;
  }

  // Hiển thị separator
  showSeparator() {
    console.log(chalk.gray('────────────────────────────────────────────────────────────────────────────'));
  }

  // Render chỉ banner + tóm tắt hành động gần nhất
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
      { type: 'input', name: 'continue', message: 'Nhấn Enter để tiếp tục...' }
    ]);
  }

  // Hiển thị hộp thoại SaveFile (Windows PowerShell). Trả về path hoặc '' nếu hủy.
  async showWindowsSaveFileDialog(defaultPath) {
    try {
      if (process.platform !== 'win32') return '';
      const psScript = [
        "Add-Type -AssemblyName System.Windows.Forms | Out-Null",
        "$dlg = New-Object System.Windows.Forms.SaveFileDialog",
        `$dlg.Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*"`,
        `$dlg.Title = "Chọn nơi lưu file CSV"`,
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

  // Cấu hình thu thập dữ liệu
  async getCrawlConfig() {
    const questions = [
      {
        type: 'input',
        name: 'maxPages',
        message: 'Số trang tối đa cần thu thập:',
        default: config.defaultConfig.maxPages.toString(),
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= 100 ? true : 'Vui lòng nhập số từ 1-100';
        }
      },
      {
        type: 'input',
        name: 'perPage',
        message: 'Số sản phẩm mỗi trang:',
        default: config.defaultConfig.perPage.toString(),
        validate: (value) => {
          const num = parseInt(value);
          return num > 0 && num <= 100 ? true : 'Vui lòng nhập số từ 1-100';
        }
      },
      {
        type: 'list',
        name: 'orderBy',
        message: 'Sắp xếp theo:',
        choices: [
          { name: 'Ngày tạo (mới nhất)', value: 'date' },
          { name: 'Tên sản phẩm', value: 'title' },
          { name: 'Giá', value: 'price' },
          { name: 'ID', value: 'id' }
        ],
        default: 'date'
      },
      {
        type: 'list',
        name: 'order',
        message: 'Thứ tự sắp xếp:',
        choices: [
          { name: 'Giảm dần (mới nhất)', value: 'desc' },
          { name: 'Tăng dần (cũ nhất)', value: 'asc' }
        ],
        default: 'desc'
      }
    ];

    return await inquirer.prompt(questions);
  }

  // Thu thập dữ liệu
  async crawlData() {
    try {
      console.log(chalk.yellow('Đang kiểm tra kết nối API...'));
      const isConnected = await this.crawler.testConnection();
      
      if (!isConnected) {
        console.log(chalk.red('❌ Không thể kết nối API. Vui lòng kiểm tra lại.'));
        return;
      }

      const config = await this.getCrawlConfig();
      console.log(chalk.green('✅ Kết nối thành công! Bắt đầu thu thập dữ liệu...'));
      
      this.collectedProducts = await this.crawler.crawlProductsWithRetry(
        parseInt(config.maxPages),
        parseInt(config.perPage),
        config.orderBy,
        config.order
      );

      if (this.collectedProducts.length > 0) {
        console.log(chalk.green(`🎉 Thu thập thành công ${this.collectedProducts.length} sản phẩm!`));
        
        // Kiểm tra duplicate và xử lý bookmark
        const dupStats = await this.processDuplicates();
        
        // Hỏi có muốn xuất CSV không
        const { exportCsv } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'exportCsv',
            message: 'Bạn có muốn xuất dữ liệu ra CSV không?',
            default: true
          }
        ]);

        if (exportCsv) {
          await this.exportToCsv();
        }
        this.lastActionSummary = {
          title: 'Tóm tắt lần thu thập',
          lines: [
            chalk.green(`🎉 Thu thập: ${this.collectedProducts.length} sản phẩm`),
            chalk.white(`🆕 Mới: ${dupStats.newBookmarkCount}`),
            chalk.yellow(`🔄 Trùng lặp: ${dupStats.duplicateCount}`),
            chalk.white(`📌 Tổng bookmark: ${dupStats.totalBookmarks}`)
          ]
        };
      } else {
        console.log(chalk.yellow('⚠️ Không thu thập được dữ liệu nào.'));
        this.lastActionSummary = {
          title: 'Thu thập dữ liệu',
          lines: [chalk.yellow('⚠️ Không có dữ liệu')]
        };
      }
    } catch (error) {
      console.error(chalk.red('❌ Lỗi khi thu thập dữ liệu:'), error.message);
      this.lastActionSummary = {
        title: 'Thu thập dữ liệu',
        lines: [chalk.red(`Lỗi: ${error.message}`)]
      };
    }
  }

  // Xử lý duplicate và bookmark
  async processDuplicates() {
    let duplicateCount = 0;
    let newBookmarkCount = 0;
    const lastTriplet = this.crawlState.getLastTriplet();
    const duplicateWindow = [];
    const currentTripletNew = [];
    const recentBookmarks = this.bookmarkManager.getBookmarks().map(b => b.permalink);
    let askedOnRecentBookmark = false;

    for (const product of this.collectedProducts) {
      if (this.bookmarkManager.isDuplicate(product)) {
        duplicateCount++;
        this.bookmarkManager.markAsDuplicate(product);
        // Nếu trùng với danh sách 5 bookmark gần nhất, hỏi một lần
        if (!askedOnRecentBookmark && recentBookmarks.includes(product.permalink)) {
          const { stopRecent } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'stopRecent',
              message: chalk.yellow('🔁 Đã gặp link nằm trong 5 bookmark gần nhất. Dừng lại không?'),
              default: true
            }
          ]);
          askedOnRecentBookmark = true;
          if (stopRecent) {
            console.log(chalk.yellow('⏹️ Dừng do đã tới danh sách bookmark gần nhất.'));
            break;
          }
        }
        // Cửa sổ 3 link duplicate gần nhất
        duplicateWindow.push(product.permalink);
        if (duplicateWindow.length > 3) duplicateWindow.shift();
        // Nếu trùng khớp 3 link liên tiếp với state trước đó -> hỏi dừng
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
              message: chalk.yellow('🔁 Đã gặp các link trùng khớp với lần crawl trước. Dừng lại không?'),
              default: true
            }
          ]);
          if (stopHere) {
            console.log(chalk.yellow('⏹️ Dừng do đã tới mốc lần thu thập trước.'));
            break;
          }
        }
      } else {
        // Thêm bookmark mới
        this.bookmarkManager.addBookmark(product);
        newBookmarkCount++;
        // Lưu 3 link đầu tiên của lần crawl hiện tại
        if (currentTripletNew.length < 3) {
          currentTripletNew.push(product.permalink);
        }
        // Reset cửa sổ duplicate liên tiếp vì đã gặp hàng mới
        duplicateWindow.length = 0;
      }
    }

    console.log(chalk.blue(`📊 Thống kê:`));
    console.log(chalk.blue(`   - Sản phẩm mới: ${newBookmarkCount}`));
    console.log(chalk.blue(`   - Sản phẩm trùng lặp: ${duplicateCount}`));
    console.log(chalk.blue(`   - Tổng bookmark: ${this.bookmarkManager.getBookmarkCount()}`));

    // Sau khi kết thúc nếu có đủ 3 link mới đầu tiên thì lưu lại làm mốc cho lần sau
    if (currentTripletNew.length === 3) {
      this.crawlState.saveNewTriplet(currentTripletNew);
      console.log(chalk.gray('🔖 Đã lưu mốc 3 link đầu tiên cho lần crawl sau.'));
    }
    return {
      newBookmarkCount,
      duplicateCount,
      totalBookmarks: this.bookmarkManager.getBookmarkCount()
    };
  }

  // Xuất dữ liệu ra CSV
  async exportToCsv() {
    try {
      if (this.collectedProducts.length === 0) {
        console.log(chalk.yellow('⚠️ Không có dữ liệu để xuất.'));
        return;
      }

      const { exportType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'exportType',
          message: 'Chọn kiểu xuất CSV:',
          choices: [
            { name: '📄 Xuất thường', value: 'normal' },
            { name: '🌟 Xuất với highlight duplicate', value: 'highlight' }
          ]
        }
      ]);

      // Chọn nơi lưu file: thử mở SaveFile dialog (Windows). Nếu hủy, fallback hỏi input.
      let customPath = await this.showWindowsSaveFileDialog('products.csv');
      if (!customPath) {
        const ask = await inquirer.prompt([
          {
            type: 'input',
            name: 'customPath',
            message: `Nhập đường dẫn lưu file CSV (Enter để dùng mặc định: ${config.csvOutputFile}):`,
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
        console.log(chalk.green(`✅ Xuất CSV thành công! File: ${finalPath}`));
        // Mở thư mục chứa file trên Windows
        try {
          const folder = path.dirname(finalPath);
          if (process.platform === 'win32') {
            spawn('explorer', [folder], { detached: true, stdio: 'ignore' }).unref();
          }
        } catch (_) {}
        this.lastActionSummary = {
          title: 'Xuất CSV',
          lines: [chalk.green(`✅ Đã xuất file: ${finalPath}`)]
        };
      }
    } catch (error) {
      console.error(chalk.red('❌ Lỗi khi xuất CSV:'), error.message);
      this.lastActionSummary = {
        title: 'Xuất CSV',
        lines: [chalk.red(`Lỗi: ${error.message}`)]
      };
    }
  }

  // Hiển thị thống kê
  showStats() {
    const bookmarks = this.bookmarkManager.getBookmarks();
    const totalBookmarks = bookmarks.length;
    const duplicates = bookmarks.filter(b => b.isDuplicate).length;
    const newBookmarks = totalBookmarks - duplicates;

    console.log(chalk.blue('📊 THỐNG KÊ BOOKMARK'));
    console.log(chalk.blue('═══════════════════════'));
    console.log(chalk.white(`📌 Tổng số bookmark: ${totalBookmarks}`));
    console.log(chalk.green(`🆕 Bookmark mới: ${newBookmarks}`));
    console.log(chalk.yellow(`🔄 Bookmark trùng lặp: ${duplicates}`));
    
    if (totalBookmarks > 0) {
      const duplicateRate = ((duplicates / totalBookmarks) * 100).toFixed(2);
      console.log(chalk.blue(`📈 Tỷ lệ trùng lặp: ${duplicateRate}%`));
    }
    this.lastActionSummary = {
      title: 'Thống kê bookmark',
      lines: [
        chalk.white(`📌 Tổng: ${totalBookmarks}`),
        chalk.green(`🆕 Mới: ${newBookmarks}`),
        chalk.yellow(`🔄 Trùng: ${duplicates}`)
      ]
    };
  }

  // Hiển thị danh sách bookmark
  async showBookmarkList() {
    const bookmarks = this.bookmarkManager.getBookmarks();
    
    if (bookmarks.length === 0) {
      console.log(chalk.yellow('📭 Không có bookmark nào.'));
      this.lastActionSummary = { title: 'Danh sách bookmark', lines: [chalk.yellow('📭 Không có bookmark')] };
      return;
    }

    console.log(chalk.blue(`📋 BOOKMARK (${bookmarks.length})`));
    this.showSeparator();
    bookmarks.forEach((bookmark, index) => {
      console.log(chalk.white(`${index + 1}. ${bookmark.permalink}`));
    });
    this.showSeparator();
    this.lastActionSummary = { title: 'Danh sách bookmark', lines: [chalk.white(`Tổng permalink: ${bookmarks.length}`)] };
    // Để người dùng đọc list ngay, tạm thời không clear lại màn hình cho prompt Enter tiếp theo
    this.skipClearOnce = true;
  }

  // Xóa bookmark
  async clearBookmarks() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red('⚠️ Bạn có chắc chắn muốn xóa TẤT CẢ bookmark không?'),
        default: false
      }
    ]);

    if (confirm) {
      this.bookmarkManager.clearBookmarks();
      console.log(chalk.green('✅ Đã xóa tất cả bookmark!'));
      this.lastActionSummary = { title: 'Xóa bookmark', lines: [chalk.green('✅ Đã xóa tất cả')] };
    } else {
      console.log(chalk.yellow('❌ Hủy xóa bookmark.'));
      this.lastActionSummary = { title: 'Xóa bookmark', lines: [chalk.yellow('❌ Đã hủy')] };
    }
  }

  // Chạy ứng dụng
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
                title: 'Kiểm tra kết nối API',
                lines: [
                  ok
                    ? chalk.green('✅ Kết nối API thành công!')
                    : chalk.yellow('⚠️ Kết nối API không ổn định hoặc lỗi')
                ]
              };
            }
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
            // Sau khi đổi site, refresh banner và đặt tóm tắt
            console.clear();
            this.showBanner();
            this.lastActionSummary = {
              title: 'Đổi website',
              lines: [chalk.white(`Đã chuyển sang: ${this.currentSite?.name} (${this.currentSite?.baseUrl})`)]
            };
            break;
          case 'exit':
            console.log(chalk.blue('👋 Tạm biệt!'));
            process.exit(0);
            break;
        }
        
        // Đợi người dùng nhấn Enter để tiếp tục
        if (action !== 'exit') {
          if (this.skipClearOnce) {
            // Hành động đã tự hiển thị và tự prompt, không clear lại
            this.skipClearOnce = false;
          } else {
            await this.renderContinueScreen();
          }
        }
      } catch (error) {
        console.error(chalk.red('❌ Lỗi không mong muốn:'), error.message);
        await inquirer.prompt([
          {
            type: 'input',
            name: 'continue',
            message: 'Nhấn Enter để tiếp tục...'
          }
        ]);
      }
    }
  }
}

// Chạy ứng dụng
if (require.main === module) {
  const app = new TorunstyleCrawlerApp();
  app.run().catch(error => {
    console.error(chalk.red('💥 Lỗi nghiêm trọng:'), error);
    process.exit(1);
  });
}

module.exports = TorunstyleCrawlerApp;
