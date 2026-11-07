/*
  TRANG QUẢN TRỊ CHỢ DUUDUU
  =========================
  Chợ là trang tĩnh, không có máy chủ riêng. Trang này đọc và ghi thẳng vào kho GitHub của chợ
  bằng mã truy cập của shop:
    - data/san-pham.js : danh sách mẫu, khu, quy định đơn hàng
    - anh/             : ảnh mẫu (ảnh được thu nhỏ trên máy trước khi tải lên)
  Mỗi lần bấm Lưu là một commit. Trước khi lưu, trang luôn đọc lại bản mới nhất trên kho rồi mới
  áp thay đổi vào, nên sửa trên hai máy cùng lúc không đè mất của nhau.
*/
'use strict';

const FILE = 'data/san-pham.js';
const GIU = ['anh/logo.png', 'anh/logo-64.png', 'anh/logo-180.png', 'anh/van-go.jpg']; // ảnh của chợ, không bao giờ xoá
const ANH_MAX = 1200;     // cạnh dài nhất của ảnh sau khi thu nhỏ (px)
const ANH_CL = 0.85;      // chất lượng JPEG

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem('duu.qt.' + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('duu.qt.' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('duu.qt.' + k); } catch (e) {} }
};
const ICON = {
  trai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  phai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  len: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  xuong: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  cong: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  xoa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* ---------- Cấu hình kho ---------- */
function cfgMacDinh() {
  // Chạy trên GitHub Pages (ten.github.io/kho/) thì tự đoán tài khoản và kho
  const h = location.hostname.match(/^([^.]+)\.github\.io$/i);
  const seg = location.pathname.split('/').filter(Boolean)[0];
  return {
    owner: h ? h[1] : 'vquangtran',
    repo: h && seg && !/\.html?$/i.test(seg) ? seg : (h ? h[1] + '.github.io' : '3d-duu-duu'),
    branch: 'main',
    token: ''
  };
}
let C = Object.assign(cfgMacDinh(), ls.get('cfg') || {});

/* ---------- Đọc đoạn chữ Zalo: giữ giống hàm docChu trong src/main.js ---------- */
function docChu(t) {
  const s = String(t || '').toLowerCase().replace(/[–—]/g, '-'), o = {};
  let m = s.match(/(\d{2,3})\s*k\s*\/\s*(\d+)\s*([^\s\d,.!]*)/);
  if (m) { o.gia = +m[1]; o.combo = +m[2]; o.comboDv = m[3] || 'cái'; }
  else { const all = [...s.matchAll(/(\d{2,3})\s?k(?!g)/g)]; if (all.length) o.gia = +all[all.length - 1][1]; }
  m = s.match(/còn\s*(?:size\s*)?(\d{1,2})\s*-\s*(\d{1,2})\s*kg/) || s.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*kg/);
  if (m) { o.tu = +m[1]; o.den = +m[2]; }
  m = s.match(/(?:ko|không|k|hết)\s*(?:có\s*)?size\s*(\d{1,2})(?:\s*-\s*(\d{1,2}))?/);
  if (m) { const a = +m[1], b = m[2] ? +m[2] : a; o.thieu = []; for (let k = a; k <= b; k++) o.thieu.push(k); }
  if (/lẻ size/.test(s)) o.tinhTrang = 'le'; else if (/vài ri|sale nốt|sắp hết/.test(s)) o.tinhTrang = 'it';
  return o;
}
/* Mẫu sẽ hiện trên chợ thế nào (cùng cách tính với src/main.js) */
function tinh(x) {
  const d = docChu(x.chu);
  return {
    gia: x.gia ?? d.gia, combo: x.combo ?? d.combo, comboDv: x.comboDv || d.comboDv || 'cái',
    tu: x.tu ?? d.tu, den: x.den ?? d.den, thieu: x.thieu || d.thieu || [],
    tt: x.het ? 'het' : (x.tinhTrang || d.tinhTrang || 'con')
  };
}
const giaChu = t => t.gia ? (t.combo ? `${t.gia}k/${t.combo} ${t.comboDv}` : `${t.gia}k`) : '';
const dayThieu = a => a.length > 1 ? `${a[0]}–${a[a.length - 1]}` : String(a[0]);

/* ---------- GitHub ---------- */
const nhanh = () => C.branch.split('/').map(encodeURIComponent).join('/');
async function gh(path, { method = 'GET', body, raw } = {}) {
  let r;
  try {
    r = await fetch(`https://api.github.com/repos/${encodeURIComponent(C.owner)}/${encodeURIComponent(C.repo)}${path}`, {
      method, cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + C.token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json' },
        body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) { const er = new Error('Không kết nối được GitHub. Mẹ kiểm tra mạng rồi thử lại nha.'); er.mang = true; throw er; }
  if (!r.ok) {
    let info = {}; try { info = await r.json(); } catch (e) {}
    const er = new Error(info.message || ('GitHub báo lỗi ' + r.status)); er.status = r.status; throw er;
  }
  return raw ? r : r.json();
}
function loiDe(e) {
  if (e.mang || e.de) return e.message;
  if (e.status === 401) return 'Mã truy cập sai hoặc đã hết hạn. Mẹ tạo mã mới rồi dán lại nha.';
  if (e.status === 403) return 'Mã truy cập chưa được quyền ghi vào kho. Khi tạo mã, mục Contents phải chọn Read and write.';
  if (e.status === 404) return `Không tìm thấy kho ${C.owner}/${C.repo} (nhánh ${C.branch}), hoặc mã chưa được chọn kho này.`;
  if (e.status === 422) return 'Kho vừa có thay đổi khác, mẹ bấm lưu lại lần nữa nha.';
  return e.message || 'Có lỗi, mẹ thử lại nha.';
}

/* Đọc bản mới nhất trên kho: commit đầu nhánh, danh sách file, nội dung data/san-pham.js */
async function docKho() {
  const ref = await gh('/git/ref/heads/' + nhanh());
  const head = ref.object.sha;
  const cm = await gh('/git/commits/' + head);
  const tr = await gh('/git/trees/' + cm.tree.sha + '?recursive=1');
  const files = new Map(tr.tree.filter(t => t.type === 'blob').map(t => [t.path, t.sha]));
  if (!files.has(FILE)) { const e = new Error(`Kho chưa có file ${FILE}. Mẹ kiểm tra lại nhánh trong mục Nâng cao.`); e.de = true; throw e; }
  const text = await (await gh('/git/blobs/' + files.get(FILE), { raw: true })).text();
  return { head, treeSha: cm.tree.sha, files, text, data: docData(text) };
}
function docData(text) {
  const w = {};
  try { new Function('window', text)(w); } catch (e) {
    const er = new Error('File data/san-pham.js đang bị lỗi cú pháp (' + e.message + '). Cần sửa tay file này trước.'); er.de = true; throw er;
  }
  const d = w.DUU_CHO;
  if (!d || typeof d !== 'object') { const er = new Error('File data/san-pham.js không có window.DUU_CHO.'); er.de = true; throw er; }
  d.shop = d.shop || {}; d.khu = Array.isArray(d.khu) ? d.khu : []; d.sanPham = (d.sanPham || []).filter(x => x && typeof x === 'object');
  return d;
}

/* Lưu: đọc bản mới nhất, áp thay đổi `sua(d, ctx)`, ghi một commit. Nhánh bị đổi giữa chừng thì làm lại. */
async function luu(msg, sua) {
  ban(true, 'Đang lưu lên chợ…');
  try {
    for (let lan = 0; ; lan++) {
      const k = await docKho();
      const d = JSON.parse(JSON.stringify(k.data));
      const ctx = {
        them: [], bo: new Set(), dat: new Set(),
        // Tên file ảnh mới không trùng file đã có: anh/<mã>-<số>.jpg
        tenMoi(ma, duoi = 'jpg', them = '') {
          const g = String(ma || 'mau').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mau';
          for (let n = 1; ; n++) { const p = `anh/${g}${them}-${n}.${duoi}`; if (!k.files.has(p) && !ctx.dat.has(p)) { ctx.dat.add(p); return p; } }
        }
      };
      await sua(d, ctx);
      const text = vietData(d);
      const dung = new Set(); d.sanPham.forEach(x => { (x.anh || []).forEach(a => dung.add(a)); if (x.anhTreo) dung.add(x.anhTreo); });
      const tree = [{ path: FILE, mode: '100644', type: 'blob', content: text }];
      for (let i = 0; i < ctx.them.length; i++) {
        const t = ctx.them[i];
        ban(true, `Đang tải ảnh ${i + 1}/${ctx.them.length}…`);
        if (!t.sha) t.sha = (await gh('/git/blobs', { method: 'POST', body: { content: await b64(t.blob), encoding: 'base64' } })).sha;
        tree.push({ path: t.path, mode: '100644', type: 'blob', sha: t.sha });
      }
      const xoa = [...ctx.bo].filter(p => !dung.has(p) && k.files.has(p) && p.startsWith('anh/') && !GIU.includes(p));
      xoa.forEach(p => tree.push({ path: p, mode: '100644', type: 'blob', sha: null }));
      ban(true, 'Đang lưu lên chợ…');
      const t = await gh('/git/trees', { method: 'POST', body: { base_tree: k.treeSha, tree } });
      const c = await gh('/git/commits', { method: 'POST', body: { message: msg, tree: t.sha, parents: [k.head] } });
      try { await gh('/git/refs/heads/' + nhanh(), { method: 'PATCH', body: { sha: c.sha, force: false } }); }
      catch (e) { if (e.status === 422 && lan < 3) continue; throw e; }
      const files = new Map(k.files);
      ctx.them.forEach(x => files.set(x.path, x.sha)); xoa.forEach(p => files.delete(p));
      K = { head: c.sha, treeSha: t.sha, files, text, data: d };
      return true;
    }
  } finally { ban(false); }
}
function b64(blob) {
  return new Promise((ok, loi) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = loi; r.readAsDataURL(blob); });
}

/* ---------- Ghi lại data/san-pham.js cho dễ đọc, dễ sửa tay ---------- */
const THU_TU = ['ma', 'ten', 'khu', 'chu', 'gia', 'tu', 'den', 'thieu', 'combo', 'comboDv', 'tinhTrang', 'anh', 'anhTreo', 'mau', 'het', 'an'];
const chuoi = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16)) + "'";
const khoa = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : chuoi(k);
function lit(v, ind = '') {
  if (v === null) return 'null';
  if (typeof v === 'string') return chuoi(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const in2 = ind + '  ';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const mot = '[' + v.map(x => lit(x, in2)).join(', ') + ']';
    if (!mot.includes('\n') && mot.length <= 96) return mot;
    return '[\n' + v.map(x => in2 + lit(x, in2)).join(',\n') + '\n' + ind + ']';
  }
  if (typeof v === 'object') {
    const ks = Object.keys(v).filter(k => v[k] !== undefined);
    ks.sort((a, b) => { const i = THU_TU.indexOf(a), j = THU_TU.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
    if (!ks.length) return '{}';
    const mot = '{ ' + ks.map(k => khoa(k) + ': ' + lit(v[k], in2)).join(', ') + ' }';
    if (!mot.includes('\n') && mot.length <= 72 && !('chu' in v)) return mot;
    return '{\n' + ks.map(k => in2 + khoa(k) + ': ' + lit(v[k], in2)).join(',\n') + '\n' + ind + '}';
  }
  return 'null';
}
function vietData(d) {
  const khac = Object.keys(d).filter(k => !['shop', 'mauThu', 'khu', 'sanPham'].includes(k) && d[k] !== undefined);
  let s = `/*
  DỮ LIỆU CHỢ DUUDUU
  ===================
  Sửa ở trang quản trị (quan-tri.html) cho dễ, hoặc sửa tay file này như cũ. Xem HUONG-DAN.md.

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

  Nếu chợ đọc sai giá hoặc size, ghi đè bằng tay:
    gia: 129, tu: 10, den: 30, thieu: [18, 19]
*/
window.DUU_CHO = {
  // zalo: số Zalo nhận đơn. ship: phí ship dự kiến theo số bộ (nghìn đồng), { tu: 4, tien: 25 } là từ 4 bộ ship 25k.
  // donToiThieu: đi đơn từ mấy bộ. coc: tiền cọc theo số bộ (nghìn đồng).
  shop: ${lit(d.shop, '  ')},
`;
  if (d.mauThu !== undefined) s += `\n  mauThu: ${lit(d.mauThu)},   // CHỈ ĐỂ XEM THỬ: chợ lặp lại các mẫu có sẵn cho đủ số này. Xoá dòng này khi đã nhập đủ hàng thật.\n`;
  s += `
  // Các khu trong chợ, theo thứ tự. Màu là màu của khối trưng. Mỗi khối trưng được 3 mẫu, khu nhiều mẫu hơn thì chợ tự thêm khối.
  khu: [
${d.khu.map(k => '    ' + lit(k, '    ')).join(',\n')}
  ],
`;
  khac.forEach(k => { s += `\n  ${khoa(k)}: ${lit(d[k], '  ')},\n`; });
  s += `
  sanPham: [
${d.sanPham.map(x => '    ' + lit(x, '    ')).join(',\n')}
  ]
};
`;
  return s;
}

/* ---------- Ảnh ---------- */
const anhCache = new Map();
async function anhKho(path) {
  if (anhCache.has(path)) return anhCache.get(path);
  const sha = K && K.files.get(path); if (!sha) throw new Error('no file');
  const u = URL.createObjectURL(await (await gh('/git/blobs/' + sha, { raw: true })).blob());
  anhCache.set(path, u); return u;
}
// Ưu tiên ảnh trên trang chợ; ảnh mới lưu chưa kịp lên chợ (hoặc mở trang từ nơi khác) thì lấy thẳng từ kho
function ganAnh(img, path) {
  if (anhCache.has(path)) { img.src = anhCache.get(path); return; }
  img.onerror = () => {
    img.onerror = null;
    anhKho(path).then(u => { img.src = u; }).catch(() => { img.alt = 'Không mở được ảnh'; img.classList.add('hong'); });
  };
  img.src = path;
}
async function nenAnh(file) {
  let src, w, h;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; }
  catch (e) {
    src = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => loi(new Error('Không đọc được ảnh ' + file.name)); i.src = URL.createObjectURL(file); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const s = Math.min(1, ANH_MAX / Math.max(w, h)), cv = document.createElement('canvas');
  cv.width = Math.round(w * s); cv.height = Math.round(h * s);
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0, cv.width, cv.height);
  return await new Promise((ok, loi) => cv.toBlob(b => b ? ok(b) : loi(new Error('Không nén được ảnh')), 'image/jpeg', ANH_CL));
}

// Ảnh treo sào: giữ nền trong suốt, cắt bỏ phần trong suốt thừa quanh bộ đồ, cạnh dài tối đa 900px, xuất PNG
async function nenTreo(file) {
  let src, w, h;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; }
  catch (e) {
    src = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => loi(new Error('Không đọc được ảnh ' + file.name)); i.src = URL.createObjectURL(file); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const s0 = Math.min(1, 1600 / Math.max(w, h)), cv = document.createElement('canvas');
  cv.width = Math.round(w * s0); cv.height = Math.round(h * s0);
  const g = cv.getContext('2d'); g.drawImage(src, 0, 0, cv.width, cv.height);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1, trong = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const a = d[(y * cv.width + x) * 4 + 3];
    if (a < 250) trong++;
    if (a > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error('Ảnh này trong suốt hết, không thấy bộ đồ.');
  const coNen = trong < cv.width * cv.height * 0.02;
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(cv.width - 1, x1 + pad); y1 = Math.min(cv.height - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, s1 = Math.min(1, 900 / Math.max(cw, ch)), out = document.createElement('canvas');
  out.width = Math.round(cw * s1); out.height = Math.round(ch * s1);
  out.getContext('2d').drawImage(cv, x0, y0, cw, ch, 0, 0, out.width, out.height);
  const blob = await new Promise((ok, loi) => out.toBlob(b => b ? ok(b) : loi(new Error('Không nén được ảnh')), 'image/png'));
  return { blob, coNen };
}

/* ---------- Lớp chờ, thông báo ---------- */
function ban(on, t) { $('#ban').hidden = !on; if (t) $('#banT').textContent = t; }
let baoT = 0;
function bao(t, loi) {
  const b = $('#bao'); b.textContent = t; b.classList.toggle('loi', !!loi); b.hidden = false;
  clearTimeout(baoT); baoT = setTimeout(() => { b.hidden = true; }, loi ? 6500 : 4000);
}
const DA_LUU = 'Đã lưu. Chợ cập nhật sau vài phút.';

/* ---------- Đăng nhập ---------- */
let K = null;   // bản đang xem: { head, treeSha, files, text, data }
function hienVao(loi) {
  $('#chinh').hidden = true; $('#vao').hidden = false;
  $('#vaoToken').value = C.token || '';
  $('#vaoLoi').hidden = !loi; $('#vaoLoi').textContent = loi || '';
}
$('#vaoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const tk = $('#vaoToken').value.trim();
  if (!tk) { $('#vaoLoi').hidden = false; $('#vaoLoi').textContent = 'Mẹ dán mã truy cập vào ô trên nha.'; $('#vaoToken').focus(); return; }
  C = Object.assign({}, C, { token: tk });
  await batDau();
});
async function batDau() {
  ban(true, 'Đang mở kho hàng…');
  try { K = await docKho(); }
  catch (e) { ban(false); hienVao(loiDe(e)); return; }
  ban(false);
  ls.set('cfg', C);
  $('#vao').hidden = true; $('#chinh').hidden = false;
  caiDoi = false; doiTab('Mau'); veTatCa();
}

/* ---------- Thẻ ---------- */
const TABS = ['Mau', 'Khu', 'Cai'];
let tabNay = 'Mau';
TABS.forEach(t => $('#tb' + t).addEventListener('click', () => doiTab(t)));
function doiTab(t) {
  if (t !== tabNay && tabNay === 'Cai' && caiDoi && !confirm('Mẹ chưa bấm lưu, bỏ các thay đổi vừa sửa?')) return;
  tabNay = t;
  TABS.forEach(x => { $('#tb' + x).setAttribute('aria-selected', x === t); $('#tp' + x).hidden = x !== t; });
  const ten = { Mau: 'Mẫu', Khu: 'Khu', Cai: 'Cài đặt' }[t];
  $('#tieuDe').textContent = ten; $('#navT').textContent = ten;
  $('#themMau').hidden = t !== 'Mau'; $('#luuCai').hidden = t !== 'Cai';
  if (t === 'Khu') veKhu(); if (t === 'Cai') veCai();
  window.scrollTo(0, 0); vienNav();
}
// Nút Lưu ở góc trên chỉ sáng khi có thay đổi chưa lưu
function capNhatNut() { $('#luuCai').disabled = !caiDoi; }
// Cuộn qua tiêu đề lớn thì hiện tên nhỏ và đường viền trên thanh tiêu đề
function vienNav() { $('#chinh .nav').classList.toggle('vien', window.scrollY > 36); }
window.addEventListener('scroll', vienNav, { passive: true });
function veTatCa() { veDS(); if (tabNay === 'Khu') veKhu(); if (tabNay === 'Cai') veCai(); }

/* ---------- Danh sách mẫu ---------- */
let loc = '*';
const mauKhu = ten => (K.data.khu.find(k => k.ten === ten) || {}).mau || '#DCCFEF';
// Chữ trắng trên màu khu đậm, chữ tím trên màu khu nhạt
const chuTren = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#1C1C1E'; const n = parseInt(m[1], 16), l = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; return l < 0.6 ? '#fff' : '#1C1C1E'; };
function veDS() {
  const sp = K.data.sanPham, q = $('#tim').value.trim().toLowerCase();
  const dem = {}; sp.forEach(x => { dem[x.khu] = (dem[x.khu] || 0) + 1; });
  const soAn = sp.filter(x => x.an).length;
  const khuLa = [...new Set(sp.map(x => x.khu).filter(k => k && !K.data.khu.some(z => z.ten === k)))];
  const nut = [['*', `Tất cả (${sp.length})`, '']]
    .concat(K.data.khu.map(k => [k.ten, `${k.ten} (${dem[k.ten] || 0})`, k.mau]))
    .concat(khuLa.map(k => [k, `${k} (${dem[k]})`, '#ccc']))
    .concat(soAn ? [['~an', `Đang ẩn (${soAn})`, '']] : []);
  if (!nut.some(n => n[0] === loc)) loc = '*';
  $('#loc').innerHTML = nut.map(([v, t, m]) => `<button type="button" data-loc="${esc(v)}" aria-pressed="${v === loc}">${m ? `<i style="background:${esc(m)}"></i>` : ''}${esc(t)}</button>`).join('');
  const ra = sp.map((x, i) => [x, i]).filter(([x]) =>
    (loc === '*' || (loc === '~an' ? x.an : x.khu === loc)) &&
    (!q || String(x.ma || '').toLowerCase().includes(q) || String(x.ten || '').toLowerCase().includes(q)));
  $('#dsTrong').hidden = ra.length > 0;
  $('#ds').innerHTML = ra.map(([x, i]) => {
    const t = tinh(x), nh = [];
    if (x.an) nh.push('<span class="nhan do">Đang ẩn</span>');
    if (t.tt === 'het') nh.push('<span class="nhan do">Hết hàng</span>');
    else if (t.tt === 'le') nh.push('<span class="nhan vang">Lẻ size</span>');
    else if (t.tt === 'it') nh.push('<span class="nhan vang">Còn vài ri</span>');
    if (!K.data.khu.some(k => k.ten === x.khu)) nh.push('<span class="nhan do">Chưa có khu</span>');
    if (!(x.anh || []).length) nh.push('<span class="nhan">Chưa có ảnh</span>');
    const gia = giaChu(t) || 'Chưa có giá', size = t.tu && t.den ? `${t.tu}–${t.den}kg` : 'chưa có size';
    const anh = (x.anh || [])[0];
    return `<li><button type="button" data-i="${i}" class="${x.an ? 'an' : ''}">
      ${anh ? `<img class="anhNho" data-anh="${esc(anh)}" alt="" loading="lazy">` : `<span class="anhGia" style="background:${esc(mauKhu(x.khu))};color:${chuTren(mauKhu(x.khu))}">${esc(x.ma || '?')}</span>`}
      <span class="dsC"><b>${esc(x.ten || x.ma || 'Mẫu chưa đặt tên')}</b><span class="ma">${esc(x.ma)} · ${esc(x.khu || '')}</span>
      <span class="tt">${esc(gia)} · ${esc(size)}${t.thieu.length ? ` · hết ${esc(dayThieu(t.thieu))}kg` : ''}</span>${nh.length ? `<span class="nhans">${nh.join('')}</span>` : ''}</span>
      <span class="mui" aria-hidden="true"></span>
    </button></li>`;
  }).join('');
  $('#ds').querySelectorAll('img[data-anh]').forEach(im => ganAnh(im, im.dataset.anh));
}
$('#tim').addEventListener('input', veDS);
$('#loc').addEventListener('click', e => { const b = e.target.closest('[data-loc]'); if (b) { loc = b.dataset.loc; veDS(); } });
$('#ds').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) moSua(+b.dataset.i); });
$('#themMau').addEventListener('click', () => moSua(-1));

/* ---------- Màn trượt lên (sửa mẫu, sửa khu, chọn mẫu) ---------- */
function moMan(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; $(id + ' .suaB').scrollTop = 0; }
function dongMan(id) { $(id).hidden = true; if (![...document.querySelectorAll('.man')].some(m => !m.hidden)) document.body.style.overflow = ''; }

/* ---------- Sửa một mẫu ---------- */
let E = null;   // { moi, ma0, goc, imgs:[{path}|{moi,blob,url}], mau:[{ten,img}], bo:Set, doi }
function moSua(i) {
  const goc = i >= 0 ? K.data.sanPham[i] : null;
  const x = goc || { khu: loc !== '*' && loc !== '~an' ? loc : (K.data.khu[0] || {}).ten };
  const imgs = (x.anh || []).map(p => ({ path: p }));
  E = {
    moi: !goc, ma0: goc ? goc.ma : null, goc: goc || {}, imgs, bo: new Set(), doi: false,
    treo: x.anhTreo ? { path: x.anhTreo } : null,
    mau: (x.mau || []).map(m => typeof m === 'string' ? { ten: m, img: null } : { ten: m.ten || '', img: Number.isInteger(m.anh) ? imgs[m.anh] || null : null, them: m })
  };
  $('#suaT').textContent = goc ? (goc.ma || 'Sửa mẫu') : 'Mẫu mới';
  $('#fMa').value = x.ma || ''; $('#fTen').value = x.ten || ''; $('#fChu').value = x.chu || '';
  const khus = K.data.khu.map(k => k.ten); if (x.khu && !khus.includes(x.khu)) khus.push(x.khu);
  $('#fKhu').innerHTML = khus.map(k => `<option${k === x.khu ? ' selected' : ''}>${esc(k)}</option>`).join('');
  $('#fGia').value = x.gia ?? ''; $('#fTu').value = x.tu ?? ''; $('#fDen').value = x.den ?? '';
  $('#fThieu').value = Array.isArray(x.thieu) ? x.thieu.join(', ') : '';
  $('#fTayW').open = x.gia != null || x.tu != null || x.den != null || Array.isArray(x.thieu);
  $('#fHet').checked = !!x.het; $('#fAn').checked = !!x.an;
  $('#xoaW').hidden = !goc;
  veAnh(); veTreo(); veMauSac(); veDoc();
  moMan('#suaWrap');
  if (!goc) setTimeout(() => $('#fMa').focus(), 50);
}
function dongSua(hoi) {
  if (hoi && E && E.doi && !confirm('Mẹ chưa lưu mẫu này. Đóng và bỏ các thay đổi?')) return;
  if (E) { E.imgs.forEach(it => { if (it.url) URL.revokeObjectURL(it.url); }); if (E.treo && E.treo.url) URL.revokeObjectURL(E.treo.url); }
  E = null; dongMan('#suaWrap');
}
$('#suaDong').addEventListener('click', () => dongSua(true));
$('#suaWrap').addEventListener('click', e => { if (e.target === $('#suaWrap')) dongSua(true); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#chonWrap').hidden) dongChon(); else if (KE) dongKhu(true); else if (E) dongSua(true);
});
$('#suaWrap .suaB').addEventListener('input', () => { if (E) E.doi = true; });
$('#suaWrap .suaB').addEventListener('change', () => { if (E) E.doi = true; });
window.addEventListener('beforeunload', e => { if ((E && E.doi) || (KE && KE.doi) || caiDoi) { e.preventDefault(); e.returnValue = ''; } });

function veAnh() {
  const n = E.imgs.length;
  $('#anhs').innerHTML = E.imgs.map((it, i) => `<li>
      <img alt="Ảnh ${i + 1}"${it.url ? ` src="${it.url}"` : ''} data-i="${i}">
      <span class="so${i === 0 ? ' sap' : ''}">${i === 0 ? '1 · treo sạp' : i + 1}</span>${it.moi ? '<span class="moi">Mới</span>' : ''}
      <span class="nuts"><button type="button" data-l="${i}" aria-label="Đưa ảnh ${i + 1} lên trước"${i === 0 ? ' disabled' : ''}>${ICON.trai}</button>
      <button type="button" class="xoaI" data-x="${i}" aria-label="Bỏ ảnh ${i + 1}">${ICON.xoa}</button>
      <button type="button" data-r="${i}" aria-label="Đưa ảnh ${i + 1} ra sau"${i === n - 1 ? ' disabled' : ''}>${ICON.phai}</button></span>
    </li>`).join('') + `<li><button type="button" class="themA" id="themAnh">${ICON.cong}Thêm ảnh</button></li>`;
  $('#anhs').querySelectorAll('img[data-i]').forEach(im => { const it = E.imgs[+im.dataset.i]; if (it.path && !it.url) ganAnh(im, it.path); });
}
$('#anhs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !E) return;
  if (b.id === 'themAnh') { $('#anhFile').click(); return; }
  const a = E.imgs;
  if (b.dataset.l) { const i = +b.dataset.l; [a[i - 1], a[i]] = [a[i], a[i - 1]]; }
  else if (b.dataset.r) { const i = +b.dataset.r; [a[i + 1], a[i]] = [a[i], a[i + 1]]; }
  else if (b.dataset.x) {
    const i = +b.dataset.x, it = a[i];
    if (!confirm(`Bỏ ảnh ${i + 1} khỏi mẫu này?`)) return;
    a.splice(i, 1);
    if (it.path) E.bo.add(it.path); if (it.url) URL.revokeObjectURL(it.url);
    E.mau.forEach(m => { if (m.img === it) m.img = null; });
  } else return;
  E.doi = true; veAnh(); veMauSac();
});
$('#anhFile').addEventListener('change', async e => {
  const fs = [...e.target.files]; e.target.value = '';
  if (!fs.length || !E) return;
  ban(true, 'Đang thu nhỏ ảnh…');
  try {
    for (const f of fs) { const blob = await nenAnh(f); E.imgs.push({ moi: true, blob, url: URL.createObjectURL(blob) }); }
    E.doi = true;
  } catch (er) { bao(er.message || 'Không mở được ảnh này.', true); }
  ban(false); veAnh(); veMauSac();
});

function veTreo() {
  const t = E.treo, im = $('#treoImg');
  im.hidden = !t; $('#treoTrong').hidden = !!t; $('#treoBo').hidden = !t;
  $('#treoChonT').textContent = t ? 'Đổi ảnh khác' : 'Chọn ảnh đã tách nền';
  im.onerror = null; im.removeAttribute('src');
  if (t) { if (t.url) im.src = t.url; else ganAnh(im, t.path); }
}
$('#treoChon').addEventListener('click', () => $('#treoFile').click());
$('#treoBo').addEventListener('click', () => {
  if (!E || !E.treo) return;
  if (E.treo.path && !E.treo.moi) E.bo.add(E.treo.path);
  if (E.treo.url) URL.revokeObjectURL(E.treo.url);
  E.treo = null; E.doi = true; veTreo();
});
$('#treoFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || !E) return;
  ban(true, 'Đang xử lý ảnh…');
  let r;
  try { r = await nenTreo(f); } catch (er) { ban(false); bao(er.message || 'Không mở được ảnh này.', true); return; }
  ban(false);
  if (r.coNen && !confirm('Ảnh này hình như chưa tách nền (không có phần trong suốt), treo lên sào sẽ thấy cả nền. Vẫn dùng ảnh này?')) return;
  if (E.treo) { if (E.treo.path && !E.treo.moi) E.bo.add(E.treo.path); if (E.treo.url) URL.revokeObjectURL(E.treo.url); }
  E.treo = { moi: true, blob: r.blob, url: URL.createObjectURL(r.blob) };
  E.doi = true; veTreo();
});

function veMauSac() {
  const op = i => `<option value="-1">Không có ảnh</option>` + E.imgs.map((_, j) => `<option value="${j}"${j === i ? ' selected' : ''}>Ảnh ${j + 1}</option>`).join('');
  $('#dsMau').innerHTML = E.mau.map((m, i) => `<li class="dong">
      <button type="button" class="boDong" data-mx="${i}" aria-label="Bỏ màu ${i + 1}"><i class="tru" aria-hidden="true"></i></button>
      <input class="gian" data-m="${i}" value="${esc(m.ten)}" placeholder="Tên màu, VD: Hồng" aria-label="Tên màu ${i + 1}">
      <select data-ma="${i}" aria-label="Ảnh của màu ${i + 1}">${op(m.img ? E.imgs.indexOf(m.img) : -1)}</select></li>`).join('');
}
$('#dsMau').addEventListener('input', e => { const i = e.target.dataset.m; if (i != null) E.mau[+i].ten = e.target.value; });
$('#dsMau').addEventListener('change', e => { const i = e.target.dataset.ma; if (i != null) { const j = +e.target.value; E.mau[+i].img = j >= 0 ? E.imgs[j] : null; } });
$('#dsMau').addEventListener('click', e => { const b = e.target.closest('[data-mx]'); if (b) { E.mau.splice(+b.dataset.mx, 1); E.doi = true; veMauSac(); } });
$('#themMauSac').addEventListener('click', () => { E.mau.push({ ten: '', img: null }); E.doi = true; veMauSac(); $('#dsMau').lastElementChild.querySelector('input').focus(); });

/* Cho thấy chợ sẽ đọc đoạn chữ ra sao */
const soO = id => { const v = $(id).value.trim(); return v === '' ? undefined : Math.max(0, parseInt(v, 10) || 0); };
function docThieu(s) {
  s = String(s || '').replace(/[–—]/g, '-').trim(); if (!s) return undefined;
  const r = [];
  s.split(/[,;\s]+/).forEach(p => {
    const m = p.match(/^(\d{1,2})(?:-(\d{1,2}))?$/); if (!m) return;
    const a = +m[1], b = m[2] ? +m[2] : a; for (let k = Math.min(a, b); k <= Math.max(a, b); k++) if (!r.includes(k)) r.push(k);
  });
  return r.sort((a, b) => a - b);
}
function veDoc() {
  const x = { chu: $('#fChu').value, gia: soO('#fGia'), tu: soO('#fTu'), den: soO('#fDen'), thieu: docThieu($('#fThieu').value), het: $('#fHet').checked };
  const t = tinh(x), bits = [];
  bits.push(t.gia ? `<span class="nhan ok">Giá ${esc(giaChu(t))}</span>` : '<span class="nhan do">Chưa thấy giá</span>');
  bits.push(t.tu && t.den ? `<span class="nhan ok">Size ${t.tu}–${t.den}kg</span>` : '<span class="nhan do">Chưa thấy size, chợ tạm hiểu 10–28kg</span>');
  if (t.thieu.length) bits.push(`<span class="nhan vang">Hết size ${esc(dayThieu(t.thieu))}kg</span>`);
  if (t.tt === 'le') bits.push('<span class="nhan vang">Lẻ size</span>');
  if (t.tt === 'it') bits.push('<span class="nhan vang">Còn vài ri</span>');
  if (t.tt === 'het') bits.push('<span class="nhan do">Hết hàng</span>');
  $('#fDoc').innerHTML = '<b>Chợ đọc được:</b> ' + bits.join('');
}
['#fChu', '#fGia', '#fTu', '#fDen', '#fThieu'].forEach(id => $(id).addEventListener('input', veDoc));
$('#fHet').addEventListener('change', veDoc);

$('#luuMau').addEventListener('click', async () => {
  const ma = $('#fMa').value.trim(), ten = $('#fTen').value.trim(), khu = $('#fKhu').value, chu = $('#fChu').value.trim();
  if (!ma) { bao('Mẹ ghi mã mẫu trước nha.', true); $('#fMa').focus(); return; }
  if (K.data.sanPham.some(x => x.ma === ma && (E.moi || x !== E.goc))) { bao(`Đã có mẫu mã ${ma} rồi, mẹ đặt mã khác nha.`, true); $('#fMa').focus(); return; }
  const gia = soO('#fGia'), tu = soO('#fTu'), den = soO('#fDen'), thieu = docThieu($('#fThieu').value);
  if (tu && den && tu > den) { bao('Size "từ" đang lớn hơn size "đến".', true); return; }
  const tenMau = E.mau.filter(m => m.ten.trim());
  if (new Set(tenMau.map(m => m.ten.trim().toLowerCase())).size < tenMau.length) { bao('Có hai màu trùng tên.', true); return; }
  const e0 = E;
  try {
    await luu(`${e0.moi ? 'Thêm' : 'Sửa'} mẫu ${ma}`, (d, ctx) => {
      const anh = e0.imgs.map(it => { if (it.moi) { it.path = ctx.tenMoi(ma); ctx.them.push(it); } return it.path; });
      e0.bo.forEach(p => ctx.bo.add(p));
      const t = e0.treo; if (t && t.moi) { t.path = ctx.tenMoi(ma, 'png', '-treo'); ctx.them.push(t); }
      const mau = tenMau.map(m => { const j = m.img ? e0.imgs.indexOf(m.img) : -1; return j >= 0 ? Object.assign({}, m.them, { ten: m.ten.trim(), anh: j }) : m.ten.trim(); });
      const x = Object.assign({}, e0.goc, { ma, ten: ten || undefined, khu, chu: chu || undefined, gia, tu, den, thieu,
        anh: anh.length ? anh : undefined, anhTreo: t ? t.path : undefined, mau: mau.length ? mau : undefined, het: $('#fHet').checked || undefined, an: $('#fAn').checked || undefined });
      Object.keys(x).forEach(k => { if (x[k] === undefined) delete x[k]; });
      const i = e0.moi ? -1 : d.sanPham.findIndex(y => y.ma === e0.ma0);
      if (i >= 0) d.sanPham[i] = x; else d.sanPham.unshift(x);
    });
    // giữ ảnh vừa tải lên trong bộ nhớ để xem ngay, không phải chờ chợ cập nhật
    e0.imgs.forEach(it => { if (it.moi && it.url) { anhCache.set(it.path, it.url); it.url = null; } });
    if (e0.treo && e0.treo.moi && e0.treo.url) { anhCache.set(e0.treo.path, e0.treo.url); e0.treo.url = null; }
    dongSua(false); veTatCa(); bao(DA_LUU);
  } catch (er) { e0.imgs.forEach(it => { if (it.moi) it.path = undefined; }); if (e0.treo && e0.treo.moi) e0.treo.path = undefined; bao(loiDe(er), true); }
});
$('#xoaMau').addEventListener('click', async () => {
  if (!E || E.moi) return;
  const e0 = E;
  if (!confirm(`Xoá hẳn mẫu ${e0.ma0} khỏi chợ? Ảnh của mẫu cũng bị xoá.\n\nNếu chỉ tạm hết hàng, mẹ chọn "Hết hàng" hoặc "Ẩn khỏi chợ" thay vì xoá.`)) return;
  try {
    await luu(`Xoá mẫu ${e0.ma0}`, (d, ctx) => {
      const i = d.sanPham.findIndex(y => y.ma === e0.ma0);
      if (i >= 0) { (d.sanPham[i].anh || []).forEach(p => ctx.bo.add(p)); if (d.sanPham[i].anhTreo) ctx.bo.add(d.sanPham[i].anhTreo); d.sanPham.splice(i, 1); }
    });
    dongSua(false); veTatCa(); bao('Đã xoá mẫu. Chợ cập nhật sau vài phút.');
  } catch (er) { bao(loiDe(er), true); }
});

/* ---------- Khu ---------- */
const mauHop = m => /^#[0-9a-f]{6}$/i.test(m || '') ? m : '#DCCFEF';
const anhDong = x => { const anh = (x.anh || [])[0], m = mauKhu(x.khu);
  return anh ? `<img class="anhNho nho" data-anh="${esc(anh)}" alt="">` : `<span class="anhGia nho" style="background:${esc(m)};color:${chuTren(m)}">${esc(x.ma || '?')}</span>`; };
const ganAnhTrong = el => el.querySelectorAll('img[data-anh]').forEach(im => ganAnh(im, im.dataset.anh));

// Danh sách khu: chạm vào một khu để mở màn sửa khu
function veKhu() {
  const dem = {}; K.data.sanPham.forEach(x => { dem[x.khu] = (dem[x.khu] || 0) + 1; });
  $('#dsKhu').innerHTML = K.data.khu.map((k, i) => `<li><button type="button" data-k="${i}">
      <span class="cham" style="background:${esc(mauHop(k.mau))}"></span>
      <span class="dsC"><b>${esc(k.ten)}</b><span class="ma">${dem[k.ten] || 0} mẫu</span></span>
      <span class="mui" aria-hidden="true"></span></button></li>`).join('');
}
$('#dsKhu').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) moKhu(+b.dataset.k); });
$('#themKhu').addEventListener('click', () => moKhu(-1));

/* Sửa một khu: tên, màu, vị trí trong chợ, các mẫu trong khu và thứ tự của chúng.
   ds: các mẫu đang hiện trong màn, theo thứ tự muốn trưng. khuMoi rỗng là ở lại khu này. */
let KE = null;
function moKhu(i) {
  const k = i >= 0 ? K.data.khu[i] : null;
  KE = { moi: !k, ten0: k ? k.ten : null, doi: false,
    ds: k ? K.data.sanPham.filter(x => x.khu === k.ten).map(x => ({ ma: x.ma, x, khuMoi: '' })) : [] };
  $('#kT').textContent = k ? k.ten : 'Khu mới';
  $('#kTen').value = k ? k.ten : '';
  const mau = mauHop(k ? k.mau : '#FFD3E0'); $('#kMau').value = mau; $('#kMau').style.background = mau;
  const n = K.data.khu.length + (k ? 0 : 1), nay = k ? i : n - 1;
  $('#kViTri').innerHTML = Array.from({ length: n }, (_, j) =>
    `<option value="${j}"${j === nay ? ' selected' : ''}>${j + 1}${n > 1 && j === 0 ? ' · đầu chợ' : n > 1 && j === n - 1 ? ' · cuối chợ' : ''}</option>`).join('');
  veKhuDs();
  moMan('#khuWrap');
  if (!k) setTimeout(() => $('#kTen').focus(), 50);
}
function veKhuDs() {
  const tenNay = $('#kTen').value.trim() || 'Khu này';
  const khac = K.data.khu.filter(k => k.ten !== KE.ten0).map(k => k.ten);
  const o = KE.ds, conLai = o.filter(r => !r.khuMoi).length;
  $('#kDsT').textContent = `Mẫu trong khu (${conLai})`;
  $('#kDs').innerHTML = o.length ? o.map((r, i) => {
    const x = r.x, di = !!r.khuMoi;
    return `<li class="dong spK${di ? ' di' : ''}">
      ${anhDong(x)}
      <span class="dsC"><b>${esc(x.ten || x.ma)}</b><span class="ma">${di ? 'Sẽ chuyển sang ' + esc(r.khuMoi) : esc(x.ma)}</span></span>
      <button type="button" class="doiCho" data-ku="${i}" aria-label="Đưa ${esc(x.ma)} lên trước"${i === 0 || di ? ' disabled' : ''}>${ICON.len}</button>
      <button type="button" class="doiCho" data-kd="${i}" aria-label="Đưa ${esc(x.ma)} ra sau"${i === o.length - 1 || di ? ' disabled' : ''}>${ICON.xuong}</button>
      <select class="chuyen" data-kc="${i}" aria-label="Khu của mẫu ${esc(x.ma)}"><option value=""${di ? '' : ' selected'}>${esc(tenNay)}</option>${khac.map(t => `<option${r.khuMoi === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
    </li>`;
  }).join('') : '<li class="trongK">Khu chưa có mẫu nào. Chạm "Thêm mẫu vào khu này" để chọn mẫu.</li>';
  ganAnhTrong($('#kDs'));
  const xoaDuoc = !KE.moi && conLai === 0;
  $('#kXoaW').hidden = KE.moi; $('#kXoa').disabled = !xoaDuoc;
  $('#kXoaGhi').hidden = KE.moi || xoaDuoc;
  $('#kXoaGhi').textContent = 'Chuyển hết mẫu sang khu khác thì mới xoá được khu.';
}
function dongKhu(hoi) {
  if (hoi && KE && KE.doi && !confirm('Mẹ chưa lưu khu này. Đóng và bỏ các thay đổi?')) return;
  KE = null; dongMan('#khuWrap');
}
$('#kHuy').addEventListener('click', () => dongKhu(true));
$('#khuWrap').addEventListener('click', e => { if (e.target === $('#khuWrap')) dongKhu(true); });
$('#kTen').addEventListener('input', () => {
  KE.doi = true; const t = $('#kTen').value.trim();
  $('#kT').textContent = t || 'Khu mới';
  $('#kDs').querySelectorAll('select.chuyen option[value=""]').forEach(o => { o.textContent = t || 'Khu này'; });
});
$('#kMau').addEventListener('input', e => { e.target.style.background = e.target.value; KE.doi = true; });
$('#kViTri').addEventListener('change', () => { KE.doi = true; });
$('#kDs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !KE) return;
  const a = KE.ds;
  if (b.dataset.ku) { const i = +b.dataset.ku; [a[i - 1], a[i]] = [a[i], a[i - 1]]; }
  else if (b.dataset.kd) { const i = +b.dataset.kd; [a[i + 1], a[i]] = [a[i], a[i + 1]]; }
  else return;
  KE.doi = true; veKhuDs();
});
$('#kDs').addEventListener('change', e => {
  const i = e.target.dataset.kc; if (i == null || !KE) return;
  KE.ds[+i].khuMoi = e.target.value; KE.doi = true; veKhuDs();
});

// Chọn mẫu ở khu khác để chuyển vào khu đang sửa
let CH = null;
$('#kThem').addEventListener('click', () => {
  const co = new Set(KE.ds.map(r => r.x));
  const ds = K.data.sanPham.filter(x => !co.has(x));
  CH = new Set();
  $('#cT').textContent = 'Thêm vào ' + ($('#kTen').value.trim() || 'khu mới');
  $('#cTrong').hidden = ds.length > 0;
  $('#cDs').innerHTML = ds.map(x => `<li><button type="button" data-ci="${K.data.sanPham.indexOf(x)}" aria-pressed="false">
      ${anhDong(x)}
      <span class="dsC"><b>${esc(x.ten || x.ma)}</b><span class="ma">${esc(x.ma)} · ${esc(x.khu || 'chưa có khu')}</span></span>
      <span class="tick" aria-hidden="true"></span></button></li>`).join('');
  ganAnhTrong($('#cDs'));
  capNhatChon(); moMan('#chonWrap');
});
function capNhatChon() { $('#cXong').disabled = !CH.size; $('#cXong').textContent = CH.size ? `Thêm (${CH.size})` : 'Thêm'; }
function dongChon() { CH = null; dongMan('#chonWrap'); }
$('#cDs').addEventListener('click', e => {
  const b = e.target.closest('[data-ci]'); if (!b) return;
  const x = K.data.sanPham[+b.dataset.ci];
  if (CH.has(x)) CH.delete(x); else CH.add(x);
  b.setAttribute('aria-pressed', CH.has(x)); capNhatChon();
});
$('#cHuy').addEventListener('click', dongChon);
$('#chonWrap').addEventListener('click', e => { if (e.target === $('#chonWrap')) dongChon(); });
$('#cXong').addEventListener('click', () => {
  K.data.sanPham.filter(x => CH.has(x)).forEach(x => KE.ds.push({ ma: x.ma, x, khuMoi: '' }));
  KE.doi = true; dongChon(); veKhuDs();
});

const loiDe2 = t => { const e = new Error(t); e.de = true; return e; };
$('#kLuu').addEventListener('click', async () => {
  const ten = $('#kTen').value.trim(), mau = $('#kMau').value.toUpperCase(), viTri = +$('#kViTri').value;
  if (!ten) { bao('Mẹ đặt tên cho khu nha.', true); $('#kTen').focus(); return; }
  if (K.data.khu.some(k => k.ten.toLowerCase() === ten.toLowerCase() && k.ten !== KE.ten0)) { bao(`Đã có khu tên ${ten} rồi.`, true); $('#kTen').focus(); return; }
  const k0 = KE, ds = k0.ds.map(r => ({ ma: r.ma, khuMoi: r.khuMoi }));
  try {
    await luu(`${k0.moi ? 'Thêm' : 'Sửa'} khu ${ten}`, d => {
      let k = {};
      if (!k0.moi) {
        const i = d.khu.findIndex(z => z.ten === k0.ten0);
        if (i < 0) throw loiDe2('Khu này vừa bị xoá ở máy khác. Mẹ tải lại trang nha.');
        k = d.khu.splice(i, 1)[0];
      }
      Object.assign(k, { ten, mau });
      d.khu.splice(Math.min(viTri, d.khu.length), 0, k);
      if (!k0.moi && k0.ten0 !== ten) d.sanPham.forEach(x => { if (x.khu === k0.ten0) x.khu = ten; });
      ds.forEach(r => { const x = d.sanPham.find(y => y.ma === r.ma); if (x) x.khu = r.khuMoi || ten; });
      // Xếp lại các mẫu của khu theo thứ tự đã chọn, giữ nguyên chỗ của mẫu thuộc khu khác
      const cho = []; d.sanPham.forEach((x, j) => { if (x.khu === ten) cho.push(j); });
      const trong = cho.map(j => d.sanPham[j]), muon = ds.filter(r => !r.khuMoi).map(r => r.ma);
      const xep = muon.map(ma => trong.find(x => x.ma === ma)).filter(Boolean);
      trong.forEach(x => { if (!xep.includes(x)) xep.push(x); });
      cho.forEach((j, n) => { d.sanPham[j] = xep[n]; });
    });
    dongKhu(false); veTatCa(); bao(DA_LUU);
  } catch (er) { bao(loiDe(er), true); }
});
$('#kXoa').addEventListener('click', async () => {
  if (!KE || KE.moi) return;
  const k0 = KE, ds = k0.ds.filter(r => r.khuMoi).map(r => ({ ma: r.ma, khuMoi: r.khuMoi }));
  if (!confirm(`Xoá khu ${k0.ten0} khỏi chợ?`)) return;
  try {
    await luu(`Xoá khu ${k0.ten0}`, d => {
      ds.forEach(r => { const x = d.sanPham.find(y => y.ma === r.ma); if (x) x.khu = r.khuMoi; });
      if (d.sanPham.some(x => x.khu === k0.ten0)) throw loiDe2('Khu này vẫn còn mẫu. Mẹ chuyển hết mẫu sang khu khác trước nha.');
      if (d.khu.length <= 1) throw loiDe2('Chợ cần ít nhất một khu.');
      d.khu = d.khu.filter(z => z.ten !== k0.ten0);
    });
    dongKhu(false); veTatCa(); bao('Đã xoá khu. Chợ cập nhật sau vài phút.');
  } catch (er) { bao(loiDe(er), true); }
});

/* ---------- Cài đặt ---------- */
let CAI = null, caiDoi = false;
function veCai() {
  const s = K.data.shop;
  CAI = { ship: (s.ship || []).map(x => ({ ...x })), coc: (s.coc || []).map(x => ({ ...x })) };
  $('#caiZalo').value = s.zalo || ''; $('#caiToiThieu').value = s.donToiThieu ?? 2;
  $('#caiThu').checked = K.data.mauThu > 0; $('#caiThuSo').value = K.data.mauThu > 0 ? K.data.mauThu : 20;
  $('#caiThuSo').disabled = !$('#caiThu').checked;
  $('#caiKho').textContent = `Đang sửa kho ${C.owner}/${C.repo}, nhánh ${C.branch}.`;
  caiDoi = false; veMoc(); capNhatNut();
}
function veMoc() {
  ['ship', 'coc'].forEach(loai => {
    $(loai === 'ship' ? '#dsShip' : '#dsCoc').innerHTML = CAI[loai].map((m, i) => `<li class="dong">
      <button type="button" class="boDong" data-loai="${loai}" data-x="${i}" aria-label="Bỏ mốc này"><i class="tru" aria-hidden="true"></i></button>
      <span class="dv">Từ</span><input class="so" type="number" inputmode="numeric" min="1" data-loai="${loai}" data-i="${i}" data-f="tu" value="${esc(m.tu)}" aria-label="Từ bao nhiêu bộ">
      <span class="dv">bộ</span><span class="gian"></span>
      <input class="so" type="number" inputmode="numeric" min="0" data-loai="${loai}" data-i="${i}" data-f="tien" value="${esc(m.tien)}" aria-label="Số tiền (nghìn đồng)"><span class="dv">k</span></li>`).join('');
  });
}
$('#tpCai').addEventListener('input', e => {
  const t = e.target; caiDoi = true;
  if (t.dataset.loai && t.dataset.f) CAI[t.dataset.loai][+t.dataset.i][t.dataset.f] = t.value === '' ? '' : +t.value;
  if (t.id === 'caiThu') $('#caiThuSo').disabled = !t.checked;
});
$('#tpCai').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.them) { CAI[b.dataset.them].push({ tu: '', tien: '' }); caiDoi = true; veMoc(); }
  else if (b.dataset.x != null && b.dataset.loai) { CAI[b.dataset.loai].splice(+b.dataset.x, 1); caiDoi = true; veMoc(); }
});
$('#luuCai').addEventListener('click', async () => {
  const sach = a => a.filter(m => m.tu !== '' && m.tien !== '').map(m => Object.assign({}, m, { tu: +m.tu, tien: +m.tien }));
  const ship = sach(CAI.ship).sort((a, b) => a.tu - b.tu), coc = sach(CAI.coc).sort((a, b) => b.tu - a.tu);
  const zalo = $('#caiZalo').value.trim(), toiThieu = Math.max(1, parseInt($('#caiToiThieu').value, 10) || 1);
  const thu = $('#caiThu').checked ? Math.max(1, parseInt($('#caiThuSo').value, 10) || 20) : undefined;
  if (zalo && zalo.replace(/\D/g, '').length < 9) { bao('Số Zalo có vẻ chưa đủ số.', true); return; }
  try {
    await luu('Sửa cài đặt đơn hàng', d => {
      Object.assign(d.shop, { zalo, donToiThieu: toiThieu, ship, coc });
      if (thu) d.mauThu = thu; else delete d.mauThu;
    });
    veTatCa(); bao(DA_LUU);
  } catch (er) { bao(loiDe(er), true); }
});
$('#dangXuat').addEventListener('click', () => {
  if (!confirm('Đăng xuất? Lần sau vào phải dán lại mã truy cập.')) return;
  C.token = ''; ls.set('cfg', Object.assign({}, C, { token: '' })); K = null; hienVao();
});

['#tpCai'].forEach(id => ['input', 'change', 'click'].forEach(ev => $(id).addEventListener(ev, () => setTimeout(capNhatNut))));

/* ---------- Bắt đầu ---------- */
if (C.token) batDau(); else hienVao();
