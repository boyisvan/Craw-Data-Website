# Hướng dẫn sử dụng tính năng "Tìm kiếm theo từ khóa"

## Tổng quan
Tính năng "Tìm kiếm theo từ khóa" cho phép bạn thu thập sản phẩm theo từ khóa cụ thể, giúp tìm kiếm và lọc sản phẩm một cách hiệu quả hơn.

## Cấu trúc menu

### Menu chính
- **Bat dau thu thap du lieu**: Thu thập tất cả sản phẩm
- **Tim kiem theo tu khoa**: Menu con cho các tính năng tìm kiếm
- **Xem thong ke bookmark**: Thống kê bookmark
- **Kiem tra ket noi API**: Kiểm tra kết nối
- **Kiem tra tat ca website**: Kiểm tra trạng thái tất cả website
- **Xem danh sach bookmark**: Xem danh sách bookmark
- **Xoa tat ca bookmark**: Xóa bookmark
- **Xuat du lieu ra CSV**: Xuất dữ liệu thông thường
- **Doi website**: Chuyển đổi website
- **Thoat**: Thoát chương trình

### Menu tìm kiếm theo từ khóa
- **Thu thap du lieu theo tu khoa**: Thu thập và lọc theo từ khóa
- **Xem lich su tu khoa**: Xem lịch sử từ khóa đã sử dụng
- **Xoa lich su tu khoa**: Xóa lịch sử từ khóa
- **Xuat du lieu theo tu khoa ra CSV**: Xuất dữ liệu với thông tin từ khóa
- **Quay lai menu chinh**: Trở về menu chính

## Cách sử dụng

### 1. Truy cập tính năng
- Chọn website bạn muốn thu thập dữ liệu
- Trong menu chính, chọn "Tim kiem theo tu khoa"
- Chọn "Thu thap du lieu theo tu khoa" trong menu con

### 2. Nhập từ khóa
Bạn có 3 cách để nhập từ khóa:

#### a) Chọn từ lịch sử gần đây
- Hệ thống sẽ hiển thị danh sách các từ khóa đã sử dụng gần đây
- Chọn từ khóa bạn muốn sử dụng lại

#### b) Chọn từ khóa phổ biến
- Hệ thống hiển thị các từ khóa được sử dụng nhiều nhất
- Chọn từ khóa phổ biến để thu thập

#### c) Nhập từ khóa mới
- Chọn "Nhap tu khoa moi..."
- Nhập từ khóa bạn muốn tìm kiếm

### 3. Cấu hình thu thập
Sau khi chọn từ khóa, bạn cần cấu hình:
- **Số trang tối đa**: Số trang sẽ được thu thập (1-100)
- **Số sản phẩm mỗi trang**: Số sản phẩm trên mỗi trang (1-100)
- **Sắp xếp theo**: Ngày tạo, tên sản phẩm, giá, ID
- **Thứ tự sắp xếp**: Giảm dần (mới nhất) hoặc tăng dần (cũ nhất)

### 4. Kết quả thu thập
Hệ thống sẽ:
- Thu thập tất cả sản phẩm theo cấu hình
- Lọc sản phẩm phù hợp với từ khóa
- Hiển thị thống kê chi tiết:
  - Tổng số sản phẩm thu thập
  - Số sản phẩm phù hợp từ khóa
  - Chi tiết tìm thấy trong: tên, mô tả, danh mục, tags
  - 5 sản phẩm đầu tiên phù hợp

### 5. Xử lý bookmark
- **Bookmark thông thường**: Sử dụng cho thu thập dữ liệu bình thường
- **Bookmark theo từ khóa**: Riêng biệt cho từng từ khóa, không ảnh hưởng lẫn nhau
- Hệ thống tự động kiểm tra trùng lặp với bookmark tương ứng
- Lưu sản phẩm mới vào bookmark theo từ khóa
- Hiển thị thống kê trùng lặp chi tiết

### 6. Xuất dữ liệu
Bạn có thể xuất dữ liệu ra CSV với 2 tùy chọn:
- **Xuất thường**: Dữ liệu cơ bản
- **Xuất với highlight duplicate**: Đánh dấu sản phẩm trùng lặp

**Lưu ý**: Xuất dữ liệu theo từ khóa được tách riêng trong menu "Tim kiem theo tu khoa" → "Xuat du lieu theo tu khoa ra CSV"

## Tính năng bổ sung

### Menu tìm kiếm theo từ khóa
Khi chọn "Tim kiem theo tu khoa" từ menu chính, bạn sẽ thấy các tùy chọn:
- **Thu thap du lieu theo tu khoa**: Thu thập và lọc sản phẩm theo từ khóa
- **Xem lich su tu khoa**: Hiển thị tất cả từ khóa đã sử dụng
- **Xoa lich su tu khoa**: Xóa toàn bộ lịch sử từ khóa
- **Xuat du lieu theo tu khoa ra CSV**: Xuất dữ liệu với thông tin từ khóa
- **Xem thong ke bookmark tu khoa**: Thống kê bookmark theo từ khóa
- **Xem danh sach bookmark tu khoa**: Xem danh sách bookmark của từ khóa cụ thể
- **Xoa bookmark tu khoa**: Xóa tất cả bookmark theo từ khóa
- **Quay lai menu chinh**: Trở về menu chính

### Lọc thông minh
Hệ thống tìm kiếm từ khóa trong:
- Tên sản phẩm
- Mô tả chi tiết
- Mô tả ngắn
- Danh mục sản phẩm
- Tags sản phẩm

## Ví dụ sử dụng

### Ví dụ 1: Tìm áo thun
1. Chọn website (ví dụ: Torunstyle)
2. Chọn "Tim kiem theo tu khoa"
3. Chọn "Thu thap du lieu theo tu khoa"
4. Nhập từ khóa: "áo thun"
5. Cấu hình: 10 trang, 50 sản phẩm/trang
6. Kết quả: Tất cả sản phẩm có chứa "áo thun" trong tên, mô tả, danh mục

### Ví dụ 2: Tìm sản phẩm giảm giá
1. Chọn "Tim kiem theo tu khoa"
2. Chọn "Thu thap du lieu theo tu khoa"
3. Nhập từ khóa: "sale" hoặc "giảm giá"
4. Kết quả: Sản phẩm có thông tin giảm giá

### Ví dụ 3: Tìm theo thương hiệu
1. Chọn "Tim kiem theo tu khoa"
2. Chọn "Thu thap du lieu theo tu khoa"
3. Nhập từ khóa: "Nike" hoặc "Adidas"
4. Kết quả: Sản phẩm của thương hiệu đó

## Lưu ý quan trọng

1. **Từ khóa không phân biệt hoa thường**: "Áo thun" và "áo thun" cho kết quả giống nhau
2. **Tìm kiếm một phần**: Từ khóa "áo" sẽ tìm được "áo thun", "áo sơ mi", v.v.
3. **Lịch sử tự động**: Từ khóa được lưu tự động sau mỗi lần thu thập
4. **Bookmark riêng biệt**: Bookmark theo từ khóa tách biệt hoàn toàn với bookmark thông thường
5. **Xuất CSV riêng biệt**: Xuất dữ liệu theo từ khóa được tách riêng với thông tin từ khóa chi tiết

## Troubleshooting

### Không tìm thấy sản phẩm
- Kiểm tra chính tả từ khóa
- Thử từ khóa ngắn hơn
- Kiểm tra kết nối API

### Kết quả quá ít
- Tăng số trang thu thập
- Sử dụng từ khóa rộng hơn
- Kiểm tra từ khóa phổ biến trong lịch sử

### Lỗi thu thập
- Kiểm tra kết nối internet
- Thử lại sau vài phút
- Kiểm tra cấu hình website
