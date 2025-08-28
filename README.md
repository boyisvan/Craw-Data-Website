## Crawdata – Multi‑site WooCommerce Crawler

Ứng dụng Node.js crawl dữ liệu sản phẩm từ nhiều website WooCommerce có API tương tự, hỗ trợ đánh dấu (bookmark), phát hiện trùng lặp, và xuất CSV theo định dạng sẵn. Ứng dụng chạy tương tác qua CLI với khả năng chọn website trước khi thao tác.

### Tác giả
- Tên: Ducvancoder
- Phone: 058728280
- Email: ducvan05102002@gmail.com

## Tính năng chính

- Multi‑site: chọn website trước khi thao tác; mỗi site có banner riêng và `baseUrl` riêng. Danh sách mẫu cấu hình sẵn: Torunstyle, GotYourStyle, Midtintee, GrowKOC, CreativTeeShop, Inspirdg, Fanaticity, BrutifulStore, FashionsSport, MerchSport.
- Crawl sản phẩm: gọi API Store API (`/?rest_route=/wc/store/v1/products`) với tham số `per_page`, `page`, `orderby`, `order` và delay tránh rate‑limit.
- Định dạng dữ liệu xuất:
  - Tên sản phẩm được làm sạch, tự loại bỏ tiền tố phụ như "*DUPLICATE*".
  - Giá từ minor units về dạng thập phân theo `currency_minor_unit` (ví dụ 3995 -> 39.95).
  - Trạng thái kho xuất `in_stock` hoặc `out_of_stock`.
- Bookmark theo site: lưu tối đa 5 permalink mới nhất trong `data/<siteKey>/bookmarks.json`.
- Phát hiện trùng lặp thông minh:
  - Dừng khi gặp 3 permalink trùng liên tiếp với mốc lần crawl trước (`data/<siteKey>/crawlState.json`).
  - Hỏi dừng khi gặp permalink nằm trong 5 bookmark gần nhất của site.
- Xuất CSV:
  - Chọn kiểu “Thường” hoặc “Highlight duplicate” trước.
  - Hộp thoại Save File trên Windows cho phép chọn thư mục và tên tệp, sau đó tự mở thư mục chứa tệp.
- Giao diện CLI gọn: chỉ hiển thị banner và tóm tắt hành động gần nhất giữa các bước.
- Chuyển site nhanh: menu có mục “Đổi website” để quay lại chọn site khác mà không cần thoát ứng dụng.

## Yêu cầu hệ thống

- Node.js 14+ (khuyến nghị 18+)
- npm
- Windows để sử dụng hộp thoại Save File (PowerShell). Trên hệ điều hành khác, bạn có thể nhập đường dẫn lưu file bằng tay.

## Cài đặt

```bash
npm install
npm start
```

### Sử dụng nhanh (không cần biết lập trình)

- Chỉ cần double‑click file `run.bat` trong thư mục dự án.
- Script sẽ tự kiểm tra Node.js, tự cài thư viện còn thiếu và chạy chương trình.
- Làm theo hướng dẫn hiển thị trên màn hình.

## Sử dụng

1. Chọn website cần crawl từ danh sách cấu hình.
   - Hoặc chọn mục "Thêm website khác (nhập thủ công)..." để nhập site mới (Base URL, Name, Key).
2. Chọn hành động:
   - Bắt đầu thu thập dữ liệu
   - Xem thống kê bookmark
   - Kiểm tra kết nối API
   - Xem danh sách bookmark (hiển thị tổng và toàn bộ permalink)
   - Xóa tất cả bookmark của site đang chọn
   - Xuất dữ liệu ra CSV
   - Đổi website
3. Khi “Bắt đầu thu thập dữ liệu”, nhập cấu hình:
   - Số trang tối đa (1–100)
   - Số sản phẩm mỗi trang (1–100)
   - Sắp xếp theo: `date`, `title`, `price`, `id`
   - Thứ tự: `desc` hoặc `asc`
4. Sau khi crawl:
   - 5 permalink mới nhất được lưu trong `data/<siteKey>/bookmarks.json`.
   - 3 permalink đầu tiên của phiên crawl được lưu làm “mốc” trong `data/<siteKey>/crawlState.json` để so khớp ở lần sau.
5. Khi “Xuất dữ liệu ra CSV”, ứng dụng hỏi kiểu xuất rồi mở hộp thoại chọn nơi lưu file CSV.

## Cấu hình

Sửa `config.js` để thay đổi:

- `sites`: danh sách site (key, name, baseUrl, banner).
- `productsEndpoint`: endpoint Store API sản phẩm.
- `defaultConfig`: `perPage`, `orderBy`, `order`, `maxPages`, `delay`.
- `dataDir`: thư mục gốc lưu dữ liệu theo site (`data/<siteKey>/...`).
- `csvOutputFile`: đường dẫn mặc định nếu không chọn qua hộp thoại.

## Dữ liệu xuất CSV

- Các cột chính: `ID`, `Tên sản phẩm`, `Slug`, `Link sản phẩm`, `SKU`, `Mô tả ngắn`, `Mô tả chi tiết`, `Đang giảm giá`, `Giá`, `Giá gốc`, `Giá khuyến mãi`, `Tiền tệ`, `Đánh giá trung bình`, `Số lượng đánh giá`, `URL hình ảnh`, `Danh mục`, `Tags`, `Thương hiệu`, `Có thể mua`, `Stock`, `Trạng thái kho`, `Trùng lặp`, `Thời gian đánh dấu`.
- Giá được chuẩn hóa theo `currency_minor_unit`.
- `Stock` là `in_stock` hoặc `out_of_stock`.

## Dòng công việc sau thu thập: GPMCrawler

Sau khi đã thu thập và xuất CSV, dữ liệu có thể được dùng làm input cho GPMCrawler để tiếp tục xử lý, ví dụ:

- Deep crawling/chi tiết hơn theo permalink đã thu thập.
- Bổ sung thuộc tính, ảnh, biến thể hoặc đồng bộ về hệ thống khác.
- Xử lý song song và quản lý lịch chạy với GPMCrawler.

(Phần tích hợp GPMCrawler phụ thuộc cấu hình môi trường của bạn; thông thường chỉ cần cung cấp danh sách `permalink` hoặc file CSV đầu ra.)

## Ủng hộ tác giả

Nếu bạn thấy công cụ hữu ích và muốn ủng hộ:

- Ngân hàng: MBBANK
- Số tài khoản: 0587282880
- Chủ tài khoản: HOANG DUC VAN

## Cấu trúc thư mục

```
Crawdata/
├── index.js
├── productCrawler.js
├── csvExporter.js
├── bookmarkManager.js
├── crawlStateManager.js
├── config.js
├── data/
│   └── <siteKey>/
│       ├── bookmarks.json
│       └── crawlState.json
├── package.json
└── README.md
```

## Ghi chú kỹ thuật

- Retry tối đa 3 lần khi gọi API thất bại; có delay giữa các trang để tránh bị chặn.
- User‑Agent mô phỏng trình duyệt phổ biến.
- Giao diện CLI tối giản, chỉ giữ banner và phần tóm tắt hành động gần nhất để dễ quan sát.

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra kết nối Internet, endpoint, file log đầu ra của ứng dụng và liên hệ tác giả.
