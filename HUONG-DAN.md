# Hướng dẫn cập nhật hàng cho chợ 3D

## Cách dễ nhất: trang quản trị

Mở trang `quan-tri.html` của chợ (ví dụ `https://<địa chỉ chợ>/quan-tri.html`) trên điện thoại hoặc máy tính. Nên lưu trang này vào màn hình chính cho tiện. Khách không thấy đường vào trang này.

Trang quản trị trông như một ứng dụng trên iPhone: ba thẻ **Mẫu**, **Khu**, **Cài đặt** ở dưới cùng, nút **Thêm** và **Lưu** ở góc trên bên phải. Ở trang quản trị có thể:
- **Thêm mẫu**: bấm **+ Thêm** ở góc trên, chụp hoặc chọn ảnh từ máy (ảnh tự thu nhỏ trước khi tải lên), ghi mã, tên, chọn khu, dán đoạn chữ đã đăng Zalo. Ngay dưới ô chữ, trang báo chợ đọc ra giá, size, size hết thế nào. Đọc sai thì mở **Chợ đọc sai? Sửa tay**.
- **Sửa mẫu**: bấm vào mẫu trong danh sách. Đổi thứ tự ảnh bằng hai nút mũi tên (ảnh số 1 được treo lên sạp), bỏ ảnh, thêm màu và chọn ảnh cho từng màu, đánh dấu **Hết hàng** hoặc **Ẩn khỏi chợ**.
- **Ảnh treo sào**: trong màn sửa mẫu, mục **Ảnh treo sào (đã tách nền)** → **Chọn ảnh đã tách nền**. Chợ treo bộ đồ này lên sào cạnh sạp, lớn dần theo các size. Mẫu chưa có ảnh này thì chợ vẽ bộ đồ theo màu của ảnh mẫu. Cách có ảnh tách nền:
  - **iPhone** (iOS 16 trở lên): mở ảnh trong app **Ảnh**, chạm giữ vào bộ đồ đến khi viền sáng lên, chọn **Chia sẻ** → **Lưu ảnh**. Ảnh vừa lưu là ảnh đã tách nền.
  - **Android**: dùng tính năng tách nền có sẵn của máy (ví dụ máy Samsung: mở ảnh trong Bộ sưu tập, chạm giữ vào bộ đồ rồi lưu thành ảnh), hoặc tách nền trên trang web như remove.bg rồi tải về.
  - Nên chụp bộ đồ trải phẳng hoặc treo trên nền trơn, đủ cả áo và quần. Trang tự cắt sát bộ đồ và thu nhỏ trước khi tải lên. Chọn nhầm ảnh còn nền thì trang hỏi lại.
- **Xoá mẫu**: trong màn sửa mẫu, bấm **Xoá mẫu**. Ảnh của mẫu cũng bị xoá.
- **Khu**: chạm vào một khu để sửa tên, màu, vị trí trong chợ, và các mẫu trong khu: đổi thứ tự trưng bằng mũi tên, chuyển mẫu sang khu khác (chạm tên khu ở cuối dòng của mẫu), hoặc **Thêm mẫu vào khu này** để chọn mẫu từ khu khác. Khu hết mẫu thì xoá được. Đổi tên khu thì các mẫu trong khu tự đổi theo.
- **Cài đặt**: số Zalo nhận đơn, đi đơn từ mấy bộ, phí ship, tiền cọc, bật tắt chế độ xem thử.

Mỗi lần bấm **Lưu** ở góc trên bên phải, trang ghi thẳng vào kho GitHub của chợ. Chợ cập nhật sau vài phút. Trang luôn đọc bản mới nhất trước khi lưu, nên hai người sửa trên hai máy cũng không đè mất của nhau.

### Lần đầu vào: lấy mã truy cập GitHub

Trang quản trị cần một mã truy cập để được ghi vào kho. Chỉ làm một lần trên mỗi máy:

1. Đăng nhập GitHub (tài khoản có quyền sửa kho chợ), mở https://github.com/settings/personal-access-tokens/new
2. **Token name**: ghi `Quản trị chợ`. **Expiration**: chọn thời hạn dài, ví dụ 1 năm.
3. **Repository access**: chọn **Only select repositories**, rồi chọn kho `3d-duu-duu`.
4. **Permissions** → **Repository permissions** → **Contents**: chọn **Read and write**.
5. Bấm **Generate token**, chép mã (bắt đầu bằng `github_pat_`) rồi dán vào trang quản trị.

Người dùng hằng ngày không cần tài khoản GitHub. Người giữ tài khoản tạo mã, nhắn riêng (tin nhắn 1-1, không gửi vào nhóm) cho người dùng. Người dùng chạm giữ vào tin nhắn để chép mã, mở trang quản trị bằng Safari hoặc Chrome, dán vào ô **Mã truy cập** rồi bấm **Vào quản trị**. Dán xong thì cả hai bên xoá tin nhắn chứa mã.

Máy sẽ nhớ mã. Mã hết hạn thì trang báo, chỉ cần tạo mã mới và dán lại. Mất máy thì vào lại trang trên của GitHub để xoá mã đó. Muốn thôi dùng trên một máy, vào **Cài đặt** → **Đăng xuất khỏi máy này**.

Mã chỉ có quyền với đúng kho chợ. Không gửi mã này cho ai, không dán vào nhóm chat.

Trang quản trị sửa nhánh `main` của kho `vquangtran/3d-duu-duu`.

## Cách sửa tay

Vẫn có thể sửa tay như trước. Trang quản trị và sửa tay dùng chung file `data/san-pham.js`. Khi trang quản trị lưu, file được viết lại gọn gàng, các ghi chú tự viết thêm trong file sẽ mất.

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

### Ảnh treo sào

```js
anhTreo: 'anh/yn-a50-treo-1.png',
```

Ảnh PNG bộ đồ đã tách nền (nền trong suốt). Có ảnh này thì giá treo cạnh sạp hiện chính bộ đồ, không có thì chợ vẽ bộ đồ theo màu ảnh mẫu.

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

Dòng `ngay: '2026-11-08',` là ngày cập nhật mẫu. Sửa ở trang quản trị thì mỗi lần bấm **Lưu** chợ tự ghi ngày hôm nay, danh sách mẫu hiện "Cập nhật hôm nay", "hôm qua" hoặc ngày cụ thể. Sửa tay file này thì có thể tự ghi dòng đó, không ghi cũng được.

## 4. Khu trong chợ

Danh sách `khu` ở đầu file là các khu, theo thứ tự. Màu của mỗi khu là màu khối trưng. Mỗi khối trưng được 3 mẫu: khu nhiều mẫu hơn thì chợ tự thêm khối cùng màu, thêm khu mới thì chợ tự dài thêm.

Dòng `mauThu: 20` chỉ để xem thử: chợ lặp lại các mẫu có sẵn cho đủ 20 mẫu. **Xoá dòng này khi đã nhập đủ hàng thật.**

## 5. Quy định đơn hàng

Ở đầu file, phần `shop`:
- `zalo`: số Zalo nhận đơn. Nút "Chép tin và mở Zalo shop" sẽ mở số này.
- `ship`: phí ship dự kiến theo số bộ (nghìn đồng). Ví dụ `{ tu: 4, tien: 25 }` nghĩa là từ 4 bộ ship 25k. Khách được báo đây là phí dự kiến.
- `donToiThieu`: số bộ tối thiểu để đi đơn.
- `coc`: tiền cọc theo số bộ.

## Khách đặt hàng thế nào

1. Khách chọn nhân vật (mẫu có sẵn, chiều cao, tóc, quần áo, màu), nhập cân nặng và chiều cao bé rồi vào chợ.
2. Bấm vào mẫu trên sạp, chợ báo mẫu đó có size cho bé không.
3. Thêm vào giỏ. Giỏ tự tính tiền hàng, ship, tiền cọc và số tiền trả khi nhận hàng.
4. Bấm **Chép tin và mở Zalo shop**, rồi dán vào khung chat. Shop sẽ nhận được tin như sau:

```
Chốt đơn chợ DuuDuu
Tên: Mẹ Bống
Bé cao: 98cm
1. YN-A42 Set áo dạ nơ kẻ, chân váy · 14kg · 129k
2. MO-GIO Set gió cổ hoa (Tím) · 13kg · 59k
Tiền hàng: 188k
Ship (dự kiến): 20k
Tổng: 208k
Cọc: 50k (chuyển khoản)
Còn lại khi nhận hàng (COD): 158k
```

Tin nhắn chỉ là đơn khách chọn. Shop vẫn đi kiểm tra size còn hàng như bình thường rồi xác nhận với khách.
