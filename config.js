module.exports = {
  // Base URL của API
  baseUrl: 'https://torunstyle.com',
  
  // Endpoint API sản phẩm
  productsEndpoint: '/?rest_route=/wc/store/v1/products',

  // Danh sach website (API tuơng tự, khac baseUrl và thuơng hieu)
  sites: [
    { key: 'keeptee', name: 'Keeptee', baseUrl: 'https://keeptee.com', banner: 'KEEPTEE CRAWLER' },
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
  
  // Cấu hình mac định
  defaultConfig: {
    perPage: 100,
    orderBy: 'date',
    order: 'desc',
    maxPages: 10, // So trang toi đa mac định
    delay: 1000, // Delay giua cac request (ms)
  },
  
  // Cac truong du lieu cần thu thập
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
  
  // File luu tru link đanh dấu
  bookmarkFile: './bookmarks.json',
  
  // File CSV output
  csvOutputFile: './products.csv',
  
  // File luu trang thai giua cac lần crawl (triplet 3 link đầu tiên)
  stateFile: './crawlState.json',

  // Thu muc goc luu du lieu theo site
  dataDir: './data',
  
  // Thong bao khi gap du lieu trung lap
  duplicateMessage: 'Phat hien du lieu trung lap! Ban co muon tiep tuc khong?'
};
