# Chợ 3D Duu Duu

Khu chợ đêm 3D cho các mẹ dẫn bé đi dạo sạp, xem ảnh thật của từng mẫu, kiểm tra size theo cân nặng của bé rồi gửi đơn qua Zalo. Chợ chạy hoàn toàn trên trình duyệt bằng [three.js r128](https://threejs.org/) (tải từ CDN), không cần bước build.

**Cập nhật hàng mỗi ngày:** xem [HUONG-DAN.md](HUONG-DAN.md).

## Cấu trúc

```
index.html          # Khung giao diện: thanh trên cùng, bảng mẫu, giỏ hàng, màn hình vào chợ
data/san-pham.js    # Danh sách mẫu, các sạp, quy định ship và cọc. Sửa mỗi ngày.
anh/                # Ảnh thật của các mẫu
src/style.css       # Toàn bộ CSS
src/main.js         # Dựng cảnh 3D, nhân vật, sạp, bảng mẫu, giỏ hàng
docs/quy-trinh/      # Sơ đồ quy trình bán hàng của shop (swimlane + mã Mermaid)
```

## Cách chợ hoạt động

- **Sạp** được dựng từ danh sách `khu` và trường `khu` của từng mẫu. Ảnh đầu tiên của mẫu được treo lên sạp, kèm giá.
- **Giá và size** được đọc tự động từ đoạn chữ đã đăng Zalo (`chu`): `10-30kg 129k`, `ko có size 18-19`, `chỉ còn size 9-15kg`, `99k/4quần`.
- **Kiểm tra size:** khách nhập cân nặng bé, chợ báo mẫu có size cho bé hay không.
- **Giỏ hàng** tính tiền hàng, ship dự kiến theo số bộ và theo hàng hè / hàng đông (hàng hè 20k kể cả 7–10 bộ; hàng đông 20k cho 1–3 bộ, 25k từ 4 bộ, 30k từ 10 bộ), tiền cọc (50k từ 2 bộ, 100k từ 4 bộ, 500k từ 20 bộ) và số tiền COD còn lại. Đơn dưới 2 bộ không gửi được, trừ khi khách đã cọc trước đó. Giỏ được lưu trên máy của khách.
- **Gửi đơn:** chợ chép sẵn tin chốt đơn rồi mở Zalo của shop để khách dán và gửi.
- Mẫu chưa có ảnh sẽ được vẽ hình minh hoạ.

## Chạy thử trên máy

Cần một web server tĩnh. Ảnh không dùng được trên cảnh 3D nếu mở thẳng file `index.html`.

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000

## Ghi chú

- Người đi chợ, lời rao và số người đang xem là minh hoạ.
