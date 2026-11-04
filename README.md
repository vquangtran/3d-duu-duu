# Chợ 3D Duu Duu

Khu chợ đêm 3D cho bé dạo sạp, xem và mặc thử quần áo. Chạy hoàn toàn trên trình duyệt bằng [three.js r128](https://threejs.org/) (tải từ CDN), không cần bước build.

## Cấu trúc

```
index.html      # Khung giao diện (HUD, bảng chọn size, chọn phòng, màn hình vào chợ)
src/style.css   # Toàn bộ CSS
src/main.js     # Dựng cảnh 3D, nhân vật, NPC, giỏ hàng, vòng lặp game
```

## Chạy thử trên máy

Cần một web server tĩnh (mở trực tiếp file:// cũng chạy, nhưng nên dùng server):

```bash
npx serve .
# hoặc
python3 -m http.server 8000
```

Rồi mở http://localhost:8000

## Ghi chú

- Đây là bản minh hoạ: người trong chợ, tồn kho và số liệu đều là mẫu.
