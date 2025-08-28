module.exports = {
  // Base URL của API
  baseUrl: 'https://torunstyle.com',
  
  // Endpoint API sản phẩm
  productsEndpoint: '/?rest_route=/wc/store/v1/products',

  // Danh sách website (API tương tự, khác baseUrl và thương hiệu)
  sites: [
    { key: 'torunstyle', name: 'Torunstyle', baseUrl: 'https://torunstyle.com', banner: 'TORUNSTYLE CRAWLER' },
    { key: 'gotyourstyle', name: 'GotYourStyle', baseUrl: 'https://gotyourstyle.com', banner: 'GOTYOURSTYLE CRAWLER' },
    { key: 'midtintee', name: 'Midtintee', baseUrl: 'https://midtintee.com', banner: 'MIDTINTEE CRAWLER' },
    { key: 'growkoc', name: 'GrowKOC', baseUrl: 'https://growkoc.com', banner: 'GROWKOC CRAWLER' },
    { key: 'creativteeshop', name: 'CreativTeeShop', baseUrl: 'https://creativteeshop.com', banner: 'CREATIVTEESHOP CRAWLER' },
    { key: 'inspirdg', name: 'Inspirdg', baseUrl: 'https://inspirdg.com', banner: 'INSPIRDG CRAWLER' },
    { key: 'fanaticity', name: 'Fanaticity', baseUrl: 'https://fanaticity.com', banner: 'FANATICITY CRAWLER' },
    { key: 'brutifulstore', name: 'BrutifulStore', baseUrl: 'https://brutifulstore.com', banner: 'BRUTIFULSTORE CRAWLER' },
    { key: 'fashionssport', name: 'FashionsSport', baseUrl: 'https://fashionssport.com', banner: 'FASHIONSSPORT CRAWLER' },
    { key: 'merchsport', name: 'MerchSport', baseUrl: 'https://merchsport.net', banner: 'MERCHSPORT CRAWLER' }
  ],
  
  // Cấu hình mặc định
  defaultConfig: {
    perPage: 100,
    orderBy: 'date',
    order: 'desc',
    maxPages: 10, // Số trang tối đa mặc định
    delay: 1000, // Delay giữa các request (ms)
  },
  
  // Các trường dữ liệu cần thu thập
  fields: [
    'id',
    'name', 
    'slug',
    'permalink',
    'sku',
    'short_description',
    'description',
    'on_sale',
    'prices',
    'average_rating',
    'review_count',
    'images',
    'categories',
    'tags',
    'brands',
    'is_purchasable',
    'is_in_stock',
    'stock_availability'
  ],
  
  // File lưu trữ link đánh dấu
  bookmarkFile: './bookmarks.json',
  
  // File CSV output
  csvOutputFile: './products.csv',
  
  // File lưu trạng thái giữa các lần crawl (triplet 3 link đầu tiên)
  stateFile: './crawlState.json',

  // Thư mục gốc lưu dữ liệu theo site
  dataDir: './data',
  
  // Thông báo khi gặp dữ liệu trùng lặp
  duplicateMessage: 'Phát hiện dữ liệu trùng lặp! Bạn có muốn tiếp tục không?'
};
