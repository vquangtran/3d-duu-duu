/*
  DỮ LIỆU CHỢ DUUDUU
  ===================
  Mỗi ngày chỉ cần sửa file này. Xem hướng dẫn chi tiết trong HUONG-DAN.md.

  Mỗi mẫu là một khối { ... } trong danh sách sanPham:
    ma    : mã mẫu in trên ảnh, ví dụ 'YN-A42'
    ten   : tên ngắn để hiện trên sạp
    khu   : sạp nào trong chợ (phải trùng tên một khu ở danh sách khu bên dưới)
    chu   : DÁN NGUYÊN đoạn chữ đã đăng Zalo. Chợ tự đọc ra giá, size, size thiếu.
            Ví dụ: '... 10-30kg 129k', '... 12-28kg ko có size 18-19 ạ 69k',
                   '... chỉ còn size 9-15kg ... 79k', '... 99k/4quần ...'
    anh   : danh sách ảnh trong thư mục anh/. Ảnh đầu tiên được treo lên sạp.
    anhTreo: (không bắt buộc) ảnh bộ đồ đã tách nền (PNG nền trong suốt), chợ treo bộ đồ này lên sào theo các size.
    mau   : (không bắt buộc) các màu khách được chọn. Có thể ghi số thứ tự ảnh của màu đó.
    het   : true  -> mẫu đã hết, sạp vẫn treo nhưng khách không thêm vào giỏ được
    an    : true  -> ẩn hẳn khỏi chợ
    ngay  : ngày cập nhật mẫu (năm-tháng-ngày), trang quản trị tự ghi mỗi lần bấm Lưu

  Nếu chợ đọc sai giá hoặc size, ghi đè bằng tay:
    gia: 129, tu: 10, den: 30, thieu: [18, 19]
*/
window.DUU_CHO = {
  shop: {
    ten: 'DuuDuu',
    zalo: '0364958993',   // số Zalo nhận đơn (lấy từ tin ghim trong nhóm, nhớ kiểm tra lại)
    ship: [               // phí ship dự kiến theo số bộ (gói càng nặng ship càng cao), nghìn đồng
      { tu: 1, tien: 20 },  // 1-3 bộ: 20k   (theo đơn thật: 3 bộ ship 20k)
      { tu: 4, tien: 25 }   // từ 4 bộ: 25k  (theo đơn thật: 7 bộ ship 25k)
    ],                      // thêm mốc nếu đơn lớn ship cao hơn, ví dụ { tu: 10, tien: 30 }
    donToiThieu: 2,       // đi đơn từ 2 bộ
    coc: [                // tiền cọc theo số bộ, đơn vị nghìn đồng
      { tu: 20, tien: 500 },
      { tu: 4,  tien: 100 },
      { tu: 2,  tien: 50 }
    ]
  },

  mauThu: 20,   // CHỈ ĐỂ XEM THỬ: chợ lặp lại các mẫu có sẵn cho đủ 20 mẫu. Xóa dòng này khi đã nhập đủ hàng thật.

  // Các khu trong chợ, theo thứ tự. Màu là màu của khối trưng. Thêm khu mới thì chợ tự thêm khối và dài thêm.
  // Mỗi khối trưng được 3 mẫu, khu nhiều mẫu hơn thì chợ tự thêm khối cùng màu.
  khu: [
    { ten: 'Hàng mới về', mau: '#FF9FDC' },
    { ten: 'Set thu đông', mau: '#7C3CFF' },
    { ten: 'Giá tốt',      mau: '#ABDCE0' },
    { ten: 'Đồ ngủ',       mau: '#2060E0' }
  ],

  sanPham: [
    {
      ma: 'YN-A42',
      ten: 'Set áo dạ nơ kẻ, chân váy',
      khu: 'Hàng mới về',
      chu: 'eo ôi xinhhhh, mặc áo trong hay bỏ ra đều xinh, các bà chỉ cần xem thời tiết thế nào mà diện thuiii, miền nam mặc cũng oke luôn nhó 10-30kg 129k',
      anh: ['anh/yn-a42-1.jpg', 'anh/yn-a42-2.jpg', 'anh/yn-a42-3.jpg', 'anh/yn-a42-4.jpg'],
      ngay: '2026-11-04'
    },
    {
      ma: 'YN-A33',
      ten: 'Set gile bèo, quần ống loe',
      khu: 'Hàng mới về',
      chu: 'set này năm nay hot quá nhiều nhà làm, nhưng chất liệu thì khác nhau nên mn để ý nhé, các bà cứ zoom ảnh trải sàn cận chất đường kim mũi chỉ nhà e nhó, ảnh sao hàng vậy đẹp lắm ý 10-30kg 129k',
      anh: ['anh/yn-a33-1.jpg', 'anh/yn-a33-2.jpg', 'anh/yn-a33-3.jpg'],
      ngay: '2026-11-04'
    },
    {
      ma: 'MO-GIO',
      ten: 'Set gió cổ hoa',
      khu: 'Hàng mới về',
      chu: 'set gió quá xinh mà size nhỏ xíu 7-13kg 59k phối phối cổ hoa nhìn vintage đáng yêu lắm ý',
      anh: ['anh/gio-xanh.jpg', 'anh/gio-tim.jpg', 'anh/gio-vang.jpg'],
      mau: [{ ten: 'Xanh', anh: 0 }, { ten: 'Tím', anh: 1 }, { ten: 'Vàng', anh: 2 }],
      ngay: '2026-11-04'
    },

    /* Các mẫu dưới đây chưa có ảnh trong thư mục anh/, chợ sẽ tạm vẽ hình minh hoạ. */
    {
      ma: 'KITTY-COTTON',
      ten: 'Set cotton Kitty',
      khu: 'Set thu đông',
      chu: 'set cotton cực đẹp và dễ mặc, màu xám và màu hồng có 2 hình ở trước ngực khác nhau 1 xíu thì các bà hoan hỉ lấy hình nào cũng dc nha, các chi tiết khác n y sì nhau ạ 12-28kg ko có size 18-19 ạ 69k',
      mau: ['Xám', 'Hồng', 'Kem nâu'],
      ngay: '2026-11-04'
    },
    {
      ma: 'NI-BEO',
      ten: 'Set nỉ bèo',
      khu: 'Set thu đông',
      chu: 'các mẫu nỉ e chỉ còn size 9-15kg mướt mịn lắm ạ, đầu tháng sau lạnh r các bà ôiii 79k',
      mau: ['Xanh', 'Hồng'],
      ngay: '2026-11-04'
    },
    {
      ma: 'GILE-KE',
      ten: 'Set gile quần kẻ vintage',
      khu: 'Set thu đông',
      chu: 'hí hí có 89k đẹp như qc ý các mụ ạ 10-16kg n vintage mà n đáng iuu như bà cụ non',
      mau: ['Nâu', 'Xám'],
      ngay: '2026-11-04'
    },
    {
      ma: 'AO-QUAN-KE',
      ten: 'Set áo nỉ quần kẻ',
      khu: 'Giá tốt',
      chu: 'se se lạnh thì còn bộ nào hợp lý hơnn, bắc nam đều mặc dc nhó 10-17kg 59k e còn vài ri sale nốt',
      mau: ['Xám'],
      ngay: '2026-11-04'
    },
    {
      ma: 'LEGGING',
      ten: 'Legging xuất dư',
      khu: 'Giá tốt',
      chu: 'quần legging xuất dư chất đẹp mê mà giá ngã cây 99k/4quần về tha hồ phối đồ, e chỉ còn size 9-14kg',
      mau: ['Đen', 'Xám', 'Hồng'],
      ngay: '2026-11-04'
    },
    {
      ma: 'PIJAMA-GAU',
      ten: 'Pijama gấu',
      khu: 'Đồ ngủ',
      chu: 'cái bộ quần áo gì đâu trai gái mặc đều đẹp vs đáng iuuu hết xảy, xinh quá thì e up thôi chứ lẻ size ròi, có 59k rẻ thúi size 10-28kg nhó nhanh ko hết e thật',
      mau: ['Hồng', 'Xanh', 'Vàng', 'Đỏ'],
      ngay: '2026-11-04'
    }
  ]
};
