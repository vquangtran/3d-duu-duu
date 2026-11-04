# Hướng dẫn cập nhật hàng cho chợ 3D

Mỗi ngày chỉ cần làm 2 việc:
1. Bỏ ảnh mẫu mới vào thư mục `anh/`.
2. Sửa file `data/san-pham.js`.

Không cần biết lập trình.

## 1. Thêm ảnh

- Đặt tên ảnh không dấu, không cách, ví dụ `yn-a50-1.jpg`, `yn-a50-2.jpg`.
- Nên dùng ảnh vuông hoặc dọc, rộng khoảng 1000px. Ảnh gốc từ Zalo cũng được, chỉ là tải hơi chậm.
- **Ảnh đầu tiên** của mỗi mẫu sẽ được treo lên sạp, nên chọn ảnh trải sàn rõ đồ nhất.

## 2. Thêm một mẫu mới

Mở `data/san-pham.js`, chép một khối có sẵn rồi sửa lại:

```js
{
  ma: 'YN-A50',
  ten: 'Set len cổ bèo',
  khu: 'Hàng mới về',
  chu: 'dán nguyên đoạn chữ đã đăng Zalo vào đây 10-25kg 99k',
  anh: ['anh/yn-a50-1.jpg', 'anh/yn-a50-2.jpg']
},
```

Nhớ dấu phẩy `,` sau dấu `}` của mỗi khối.

### Chợ tự đọc đoạn chữ Zalo

| Viết trong đoạn chữ | Chợ hiểu là |
|---|---|
| `10-30kg 129k` | size 10 đến 30kg, giá 129k |
| `ko có size 18-19` | hết size 18kg và 19kg |
| `chỉ còn size 9-15kg` | chỉ còn 9 đến 15kg |
| `99k/4quần` | combo 4 quần giá 99k |
| `lẻ size` | hiện chữ "lẻ size" |
| `còn vài ri`, `sale nốt` | hiện chữ "còn vài ri" |

Nếu chợ đọc sai, ghi đè bằng tay trong khối của mẫu đó:

```js
gia: 129, tu: 10, den: 30, thieu: [18, 19],
```

### Màu cho khách chọn

```js
mau: ['Xám', 'Hồng'],
```

Nếu mỗi màu có ảnh riêng, ghi số thứ tự ảnh (ảnh đầu là 0). Khách bấm màu nào, chợ lật tới ảnh màu đó:

```js
mau: [{ ten: 'Xanh', anh: 0 }, { ten: 'Tím', anh: 1 }],
```

## 3. Khi hết hàng

- Hết **một vài size**: thêm vào đoạn chữ `ko có size 18-19`, hoặc ghi `thieu: [18, 19],`.
- Hết **cả mẫu** nhưng vẫn muốn khách xem: thêm `het: true,`.
- **Bỏ hẳn** mẫu khỏi chợ: thêm `an: true,` hoặc xoá cả khối.

## Hàng hè, hàng đông

Ship hàng hè rẻ hơn hàng đông, nên chợ cần biết mẫu nào là hàng gì. Có 3 cách, cách trên được ưu tiên hơn cách dưới:
- Ghi vào mẫu: `mua: 'he',` hoặc `mua: 'dong',`.
- Ghi cho cả sạp trong danh sách `khu`: `{ ten: 'Đồ hè', mau: '#FFC93C', mua: 'he' }`.
- Không ghi gì thì lấy theo `muaMacDinh` ở phần `shop`.

Mùa đông thì để `muaMacDinh: 'dong'` và chỉ cần ghi `mua: 'he'` cho vài mẫu hè còn bán.

## 4. Sạp trong chợ

Danh sách `khu` ở đầu file là các sạp, theo thứ tự. Chợ có 6 chỗ đặt sạp: khu nào không có mẫu thì bị bỏ qua, chỗ còn trống thì tự thành sạp "Mẫu hot", "Xem thêm".

## 5. Quy định đơn hàng

Ở đầu file, phần `shop`:
- `zalo`: số Zalo nhận đơn. Nút "Chép tin và mở Zalo shop" sẽ mở số này.
- `ship`: phí ship dự kiến theo số bộ (nghìn đồng), chia hai bảng `he` (hàng hè) và `dong` (hàng đông). Ví dụ `{ tu: 4, tien: 25 }` nghĩa là từ 4 bộ ship 25k. Đơn có ít nhất một món hàng đông thì tính theo bảng hàng đông, toàn hàng hè thì theo bảng hàng hè. Khách được báo đây là phí dự kiến.
- `muaMacDinh`: mẫu không ghi mùa thì tính là mùa này. Đang mùa đông để `'dong'`, sang hè đổi thành `'he'`.
- `donToiThieu`: số bộ tối thiểu để đi đơn.
- `coc`: tiền cọc theo số bộ.

## Khách đặt hàng thế nào

1. Khách nhập cân nặng và chiều cao bé khi vào chợ.
2. Bấm vào mẫu trên sạp, chợ báo mẫu đó có size cho bé không.
3. Thêm vào giỏ. Giỏ tự tính tiền hàng, ship, tiền cọc và số tiền trả khi nhận hàng.
4. Bấm **Chép tin và mở Zalo shop**, rồi dán vào khung chat. Shop sẽ nhận được tin như sau:

```
Chốt đơn chợ Duu Duu
Tên: Mẹ Bống
Bé cao: 98cm
1. YN-A42 Set áo dạ nơ kẻ, chân váy · 14kg · 129k
2. MO-GIO Set gió cổ hoa (Tím) · 13kg · 59k
Tiền hàng: 188k
Ship dự kiến (hàng đông): 20k
Tổng: 208k
Cọc: 50k (chuyển khoản)
Còn lại khi nhận hàng (COD): 158k
```

Tin nhắn chỉ là đơn khách chọn. Shop vẫn đi kiểm tra size còn hàng như bình thường rồi xác nhận với khách.
