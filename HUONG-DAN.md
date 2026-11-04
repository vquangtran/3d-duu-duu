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
  chu: `dán nguyên đoạn chữ đã đăng Zalo vào đây,
dán cả nhiều dòng cũng được 10-25kg 99k`,
  anh: ['anh/yn-a50-1.jpg', 'anh/yn-a50-2.jpg']
},
```

- Đoạn chữ `chu` đặt giữa hai dấu **`** (dấu huyền, phím bên trái số 1 trên máy tính; trên điện thoại nằm ở bàn phím ký hiệu). Nhờ vậy dán nguyên bài Zalo nhiều dòng, có dấu nháy `'` hay icon đều được.
- Các mẫu cũ ghi `chu: '...'` bằng dấu nháy đơn vẫn chạy bình thường, không phải sửa lại. Chỉ là cách này không dán được nhiều dòng.
- Nhớ dấu phẩy `,` sau dấu `}` của mỗi khối.

### Lỡ gõ sai thì sao

Nếu thiếu dấu phẩy hoặc thiếu dấu nháy, chợ sẽ không mở. Khách thấy dòng *"Chợ đang cập nhật hàng, mẹ quay lại sau ít phút nha"* kèm nút nhắn Zalo shop, còn chủ shop thấy thêm *"file data/san-pham.js bị lỗi ở dòng …"*. Mở file, xem dòng đó (và dòng ngay trên nó), sửa rồi đẩy lại lên GitHub.

### Chợ tự đọc đoạn chữ Zalo

| Viết trong đoạn chữ | Chợ hiểu là |
|---|---|
| `10-30kg 129k` | size 10 đến 30kg, giá 129k |
| `129.000đ`, `129000d` | giá 129k |
| `ko có size 18-19` | hết size 18kg và 19kg |
| `ko co size 13`, `hết size 13` | hết size 13kg (gõ không dấu cũng được, ghi nhiều chỗ cũng được) |
| `chỉ còn size 9-15kg` | chỉ còn 9 đến 15kg |
| `99k/4quần` | combo 4 quần giá 99k |
| `lẻ size` | hiện chữ "lẻ size" |
| `còn vài ri`, `sale nốt` | hiện chữ "còn vài ri" |

Đoạn chữ không có giá (ví dụ quên ghi `129k`) thì chợ hiện "Hỏi giá" và khoá nút thêm vào giỏ của mẫu đó, để khách không gửi đơn 0đ.

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
- Khách đã bỏ mẫu đó vào giỏ từ trước: giỏ của khách sẽ báo "mẫu này vừa hết size" và khoá nút gửi cho tới khi khách bỏ món đó ra.
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

1. Khách nhập **tên Zalo**, cân nặng và chiều cao bé khi vào chợ. Tên Zalo giúp nhân viên khớp tin chốt với người nhắn.
2. Bấm vào mẫu trên sạp, chợ báo mẫu đó có size cho bé không. Lệch size, hết size, hết hàng thì nút thêm vào giỏ bị khoá.
3. Thêm vào giỏ. Cùng mẫu, cùng size, cùng màu thì gộp thành một dòng có số lượng (nút − / +).
4. Trong giỏ khách có thể chọn:
   - **Mẹ chuyển khoản hết, không thu COD**: tin chốt ghi "COD 0đ" và số tiền chuyển khoản.
   - **Mẹ đang dồn đơn**: ghi số tiền đã cọc và đơn trước mấy bộ. Chợ tính cọc theo tổng số bộ cả đơn và báo cọc thêm bao nhiêu. Ship và COD của cả đơn thì để shop cộng trong bảng Gom theo khách, vì chợ không biết tiền hàng của đơn trước.
5. Giỏ hiện lưu ý của shop: chưa cọc thì shop chưa giữ hàng; shop muốn chốt 1 lần rồi đi đơn luôn, dồn tối đa 2 lần chốt hoặc 1 tuần; nhớ quay video lúc bóc hàng.
6. Bấm **Chép tin và mở Zalo shop**, rồi dán vào khung chat. Nếu Zalo không tự mở (hay gặp khi mở chợ trong TikTok), giỏ hiện nút "Mở Zalo shop" và số Zalo để khách tự tìm. Nếu máy không cho chép, ô tin nhắn tự mở và bôi sẵn chữ để khách giữ tay chép.

Shop sẽ nhận được tin như sau. Thứ tự mỗi dòng món giống các cột của tab "Nhập đơn": mã, size, màu, số lượng, giá:

```
Chốt đơn Chợ 3D Duu Duu
Nguồn: Chợ 3D
Tên Zalo: Mẹ Bống
Bé: 14kg, cao 98cm
1. MO-GIO · 12kg · Tím · SL 1 · 59k · Set gió cổ hoa
2. YN-A42 · 14kg · SL 2 · 129k · Set áo dạ nơ kẻ, chân váy
Tổng: 3 bộ
Tiền hàng: 317k
Ship dự kiến (hàng đông): 20k
Cọc: 50k (chuyển khoản sau khi shop xác nhận)
COD khi nhận hàng: 287k
Tính: 59+129x2+20-50=287
```

Dòng "Tính" viết giống tin báo khách của bảng Gom đơn (giá × số bộ + ship − cọc = COD), nhân viên nhìn là so được ngay.

Tin nhắn chỉ là đơn khách chọn. Shop vẫn đi kiểm tra size còn hàng như bình thường rồi xác nhận với khách.
