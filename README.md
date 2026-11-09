# Chợ 3D DuuDuu

Khu chợ 3D mở cả ngày cho các mẹ dẫn bé đi dạo sạp, xem ảnh thật của từng mẫu, kiểm tra size theo cân nặng của bé rồi gửi đơn qua Zalo. Chợ chạy hoàn toàn trên trình duyệt bằng [three.js r128](https://threejs.org/) (tải từ CDN), không cần bước build.

**Cập nhật hàng mỗi ngày:** mở trang quản trị `quan-tri.html` để thêm, sửa, xoá mẫu ngay trên điện thoại. Xem [HUONG-DAN.md](HUONG-DAN.md).

## Cấu trúc

```
index.html          # Khung giao diện: thanh trên cùng, bảng mẫu, giỏ hàng, màn hình vào chợ
data/san-pham.js    # Danh sách mẫu, các sạp, quy định ship và cọc. Sửa mỗi ngày.
anh/                # Ảnh thật của các mẫu, logo DuuDuu (logo*.png); van-go.jpg là vân gỗ cũ, chợ không còn dùng
src/style.css       # Toàn bộ CSS
src/fonts.css       # Khai báo font Baloo 2 và Be Vietnam Pro tải từ fonts/ (không dùng Google Fonts)
fonts/              # File font woff2 (giấy phép SIL OFL), tiếng Việt và Latin
src/main.js         # Dựng cảnh 3D, nhân vật, sạp, bảng mẫu, giỏ hàng
pho-cho.html        # Bản thử: phố chợ nhìn từ trên cao kiểu sa bàn đồ chơi, chạm sạp xem mẫu
src/pho-cho.js      # Dựng phố chợ: đế nổi, đường, sạp mái sọc theo từng khu, cửa hàng DuuDuu, công viên, xe và người
src/pho-cho.css     # CSS của phố chợ (nền sáng)
quan-tri.html       # Trang quản trị cho shop: thêm, sửa, xoá mẫu, khu, cài đặt đơn hàng
src/quan-tri.js     # Đọc và ghi data/san-pham.js, tải ảnh lên anh/ qua GitHub API (mỗi lần lưu là một commit)
src/quan-tri.css    # CSS của trang quản trị
```

## Cách chợ hoạt động

- **Tạo nhân vật:** khi vào chợ, khách chọn một trong 10 mẫu nhân vật chibi có sẵn (hoặc bấm "Ngẫu nhiên"), rồi tự chỉnh: chiều cao, màu da, nét mặt (mỉm cười, cười tươi, chúm chím, nháy mắt), 9 kiểu tóc (búi thấp, xoăn bồng, tết hai bên, dài mái bằng, đuôi ngựa, hai búi, bob, dài gợn, tém) và màu tóc, kiểu đồ, hoạ tiết áo (trơn, chấm bi, kẻ sọc, ca rô), màu áo, màu váy/quần, phụ kiện trên tóc (nơ, kẹp tóc, mũ len tai mèo, băng đô, hoa cài) và màu phụ kiện, ôm gấu bông hoặc thỏ bông. Kéo trên màn hình để xoay nhân vật. Trong chợ bấm **Đổi đồ** để chỉnh lại. Nhân vật được lưu trên máy của khách.
- **Mặc thử:** bấm "Cho bé mặc thử" trên một mẫu, nhân vật giữ nguyên tóc và dáng, quần áo đổi sang màu lấy từ ảnh mẫu.
- **Khu trưng** được dựng từ danh sách `khu` và trường `khu` của từng mẫu, mỗi khối trưng 3 mẫu, khu nhiều mẫu thì tự thêm khối. Ảnh đầu tiên của mẫu được treo lên, kèm giá. Giá treo quần áo cạnh sạp hiện ảnh tách nền của mẫu (`anhTreo`, PNG nền trong suốt) treo trên móc theo 4 size; mẫu chưa có ảnh này thì vẽ bộ đồ theo màu lấy từ ảnh.
- **Giá và size** được đọc tự động từ đoạn chữ đã đăng Zalo (`chu`): `10-30kg 129k`, `ko có size 18-19`, `chỉ còn size 9-15kg`, `99k/4quần`.
- **Kiểm tra size:** khách nhập cân nặng bé, chợ báo mẫu có size cho bé hay không.
- **Giỏ hàng** tính tiền hàng, ship dự kiến theo số bộ (1–3 bộ 20k, từ 4 bộ 25k), tiền cọc (50k từ 2 bộ, 100k từ 4 bộ, 500k từ 20 bộ) và số tiền COD còn lại. Đơn dưới 2 bộ không gửi được, trừ khi khách đã cọc trước đó. Giỏ được lưu trên máy của khách.
- **Gửi đơn:** chợ chép sẵn tin chốt đơn rồi mở Zalo của shop để khách dán và gửi.
- Mẫu chưa có ảnh sẽ được vẽ hình minh hoạ.

## Phố chợ (bản thử)

`pho-cho.html` là phố chợ nhìn chéo từ trên cao kiểu sa bàn đồ chơi khối: đế nổi bo tròn, đường có xe chạy, sân gạch, mỗi khu trong `data/san-pham.js` là một sạp mái sọc theo màu khu, ảnh mẫu bày trên quầy, cửa hàng DuuDuu có áo phông lớn trên mái, công viên có cầu trượt. Kéo để xoay, chụm hai ngón hoặc cuộn chuột để phóng to, chạm vào sạp (hoặc tên sạp) để xem mẫu, giá, dải cân nặng; chạm cửa hàng hoặc nút dưới cùng để vào chợ. Ánh sáng và bóng đổ tính trực tiếp; máy chậm thì tự giảm độ nét. `docChu` ở đây là bản rút gọn, chỉ đọc giá và dải cân nặng.

## Chạy thử trên máy

Cần một web server tĩnh. Ảnh không dùng được trên cảnh 3D nếu mở thẳng file `index.html`.

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000

## Trang quản trị

Chợ không có máy chủ riêng, nên `quan-tri.html` chạy hoàn toàn trên trình duyệt và ghi thẳng vào kho GitHub bằng mã truy cập (fine-grained token, chỉ quyền Contents: Read and write với kho này) mà shop dán vào một lần. Mỗi lần lưu, trang đọc bản mới nhất của nhánh, áp thay đổi, rồi tạo một commit gồm `data/san-pham.js` và ảnh mới (Git Data API). Nhánh bị đổi giữa chừng thì tự làm lại. Ảnh được thu nhỏ còn cạnh dài 1200px trước khi tải lên. Ảnh bị bỏ khỏi mẫu mà không mẫu nào dùng nữa thì bị xoá khỏi `anh/`. Hàm `docChu` trong `src/quan-tri.js` phải giữ giống hàm cùng tên trong `src/main.js`.

## Ghi chú

- Các mẫu nhân vật có sẵn và bảng màu nằm ở đầu phần `Nhân vật` trong `src/main.js` (`AVP` và `AV`).
- Người đi chợ, lời rao và số người đang xem là minh hoạ.
- Góc giao hàng tông tím cam: thùng carton (`carton`, có băng keo tím, vận đơn, ký hiệu, tem DuuDuu), xe đẩy (`xeDay`) và loa rao (`loa`). Có ở sảnh vào chợ, mỗi sạp có thùng, sạp chẵn có loa nhỏ trên thùng, cứ 3 sạp có một xe đẩy. Nhãn dán vẽ chung trong một ảnh (`danTex`).
- Nhãn sale kiểu 3D tự lấy từ dữ liệu, shop không phải nhập thêm: khung ảnh mẫu có nhãn dán (`nhanMau`: Sắp hết size, Combo, Giá tốt, Mới về), mỗi sạp có một nhãn nổi lơ lửng (`nhanKhu`, `nhan3D`: Sắp hết, Combo, Chỉ …k, Hot sale), cạnh loa ở sảnh có nhãn Sale, cổng bóng có biển Đang mở.
- Hộp quà (`hopQua`) ở quầy tư vấn, giỏ mua hàng (`gioHang`) ở lối vào và ở các sạp.
- Trang trí Noel cho cả chợ (cùng điều kiện `NOEL`): hai cây thông lớn hai bên logo cuối chợ (`cayThong`), quả châu treo trần dọc lối đi, vòng nguyệt quế trên mỗi sạp (`vongLa`), đèn nháy dọc rào trước sạp, tất Noel ở quầy tư vấn (`tatNoel`), gấu lớn đội mũ Noel, tuyết rơi nhẹ (`tuyetRoi`), hộp quà đổi sang đỏ, xanh lá.
- Đồ Noel chi tiết: quả châu trơn và sọc có nắp, móc (`quaChau`, ảnh sọc vẽ ở `texNoel`), kẹo gậy sọc bắt chéo có nơ ở hai đầu rào sạp (`keoGay`, `noDo`), đèn quả nhót trên dây võng (`dayDen`), chuông vàng và lá nhựa ruồi treo trần, trên vòng nguyệt quế và biển Đang mở (`chuong`, `hoaLa`), tất sọc cổ lông, quả cầu tuyết, cốc ca cao, bánh gừng trên quầy (`quayNoel`), túi quà cạnh cây thông (`tuiQua`).
- Góc Noel (`gocNoel`) bên trái lối vào: bục tuyết, cây thông, người tuyết, chim cánh cụt, tuần lộc có đèn nháy, lính kẹp hạt dẻ và nhãn Giáng sinh an lành. Chỉ hiện từ tháng 11 tới hết 6/1 (`NOEL`), ngoài mùa thì tự ẩn.
- Đồ trong chợ dựng theo kiểu đồ chơi nhựa 3D tông pastel: hộp bo tròn cạnh (`roundBox`), vệt bóng và viền sáng theo góc nhìn (`glossMat`, `rim`). Ánh nắng chiếu chéo từ bên trái được nướng sẵn vào màu (mặt trên sáng, mặt bên đổ bóng tím mát) nên điện thoại chạy nhẹ. Bảng màu: trần xanh trời có sườn tím, tường ván tím nhạt chân trắng viền hồng (`wallTex`), sàn ô cờ tím nhạt, lối đi giữa thảm hồng, nền sau mỗi sạp theo màu khu, thanh treo, khung và rào bằng nhựa tím (`MC_BANG.vang`). Khử răng cưa luôn bật, màn hình nét gấp 2; máy chạy chậm thì chợ tự giảm độ nét.
