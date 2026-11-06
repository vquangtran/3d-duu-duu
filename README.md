# Chợ 3D DuuDuu

Khu chợ 3D mở cả ngày cho các mẹ dẫn bé đi dạo sạp, xem ảnh thật của từng mẫu, kiểm tra size theo cân nặng của bé rồi gửi đơn qua Zalo. Chợ chạy hoàn toàn trên trình duyệt bằng [three.js r128](https://threejs.org/) (tải từ CDN), không cần bước build.

**Cập nhật hàng mỗi ngày:** xem [HUONG-DAN.md](HUONG-DAN.md).

## Cấu trúc

```
index.html          # Khung giao diện: thanh trên cùng, bảng mẫu, giỏ hàng, màn hình vào chợ
data/san-pham.js    # Danh sách mẫu, các sạp, quy định ship và cọc. Sửa mỗi ngày.
anh/                # Ảnh thật của các mẫu, logo DuuDuu (logo*.png) và vân gỗ của chợ (van-go.jpg)
src/style.css       # Toàn bộ CSS
src/main.js         # Dựng cảnh 3D, nhân vật, sạp, bảng mẫu, giỏ hàng
```

## Cách chợ hoạt động

- **Tạo nhân vật:** khi vào chợ, khách chọn một trong 10 mẫu nhân vật chibi có sẵn (hoặc bấm "Ngẫu nhiên"), rồi tự chỉnh: chiều cao, màu da, nét mặt (mỉm cười, cười tươi, chúm chím, nháy mắt), 9 kiểu tóc (búi thấp, xoăn bồng, tết hai bên, dài mái bằng, đuôi ngựa, hai búi, bob, dài gợn, tém) và màu tóc, kiểu đồ, hoạ tiết áo (trơn, chấm bi, kẻ sọc, ca rô), màu áo, màu váy/quần, phụ kiện trên tóc (nơ, kẹp tóc, mũ len tai mèo, băng đô, hoa cài) và màu phụ kiện, ôm gấu bông hoặc thỏ bông. Kéo trên màn hình để xoay nhân vật. Trong chợ bấm **Đổi đồ** để chỉnh lại. Nhân vật được lưu trên máy của khách.
- **Mặc thử:** bấm "Cho bé mặc thử" trên một mẫu, nhân vật giữ nguyên tóc và dáng, quần áo đổi sang màu lấy từ ảnh mẫu.
- **Khu trưng** được dựng từ danh sách `khu` và trường `khu` của từng mẫu, mỗi khối trưng 3 mẫu, khu nhiều mẫu thì tự thêm khối. Ảnh đầu tiên của mẫu được treo lên, kèm giá.
- **Giá và size** được đọc tự động từ đoạn chữ đã đăng Zalo (`chu`): `10-30kg 129k`, `ko có size 18-19`, `chỉ còn size 9-15kg`, `99k/4quần`.
- **Kiểm tra size:** khách nhập cân nặng bé, chợ báo mẫu có size cho bé hay không.
- **Giỏ hàng** tính tiền hàng, ship dự kiến theo số bộ (1–3 bộ 20k, từ 4 bộ 25k), tiền cọc (50k từ 2 bộ, 100k từ 4 bộ, 500k từ 20 bộ) và số tiền COD còn lại. Đơn dưới 2 bộ không gửi được, trừ khi khách đã cọc trước đó. Giỏ được lưu trên máy của khách.
- **Gửi đơn:** chợ chép sẵn tin chốt đơn rồi mở Zalo của shop để khách dán và gửi.
- Mẫu chưa có ảnh sẽ được vẽ hình minh hoạ.

## Chạy thử trên máy

Cần một web server tĩnh. Ảnh không dùng được trên cảnh 3D nếu mở thẳng file `index.html`.

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000

## Ghi chú

- Các mẫu nhân vật có sẵn và bảng màu nằm ở đầu phần `Nhân vật` trong `src/main.js` (`AVP` và `AV`).
- Người đi chợ, lời rao và số người đang xem là minh hoạ.
