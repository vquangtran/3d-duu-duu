(function(){
'use strict';
const $=s=>document.querySelector(s);
document.documentElement.lang='vi';
/* Logo nhúng một lần trong màn tải, các chỗ khác dùng lại cùng ảnh */
const LOGO=$('#logoImg');document.querySelectorAll('[data-logo]').forEach(i=>{i.src=LOGO.src;});
if(!window.THREE){$('#loadT').textContent='Chưa tải được phần 3D. Mẹ kiểm tra mạng rồi mở lại giúp em nha.';return;}
const T=THREE, V3=T.Vector3, PI=Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t;
const angLerp=(a,b,t)=>{let d=(b-a+PI)%(2*PI);if(d<0)d+=2*PI;return a+(d-PI)*t;};
const seeded=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOW=(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
const mat=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>new T.Matrix4().compose(new V3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz,'YXZ')),new V3(sx,sy,sz));

/* ---------- Sản phẩm: đọc từ data/san-pham.js ---------- */
const DATA=window.DUU_CHO||{};
const SHOP=Object.assign({ten:'DuuDuu',zalo:'',ship:[{tu:1,tien:20},{tu:4,tien:25}],donToiThieu:2,coc:[{tu:20,tien:500},{tu:4,tien:100},{tu:2,tien:50}]},DATA.shop||{});
/* Đọc giá, dải cân nặng, size thiếu từ đoạn chữ đã đăng Zalo */
function docChu(t){
  const s=String(t||'').toLowerCase().replace(/[–—]/g,'-'),o={};
  let m=s.match(/(\d{2,3})\s*k\s*\/\s*(\d+)\s*([^\s\d,.!]*)/);
  if(m){o.gia=+m[1];o.combo=+m[2];o.comboDv=m[3]||'cái';}
  else{const all=[...s.matchAll(/(\d{2,3})\s?k(?!g)/g)];if(all.length)o.gia=+all[all.length-1][1];}
  m=s.match(/còn\s*(?:size\s*)?(\d{1,2})\s*-\s*(\d{1,2})\s*kg/)||s.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*kg/);
  if(m){o.tu=+m[1];o.den=+m[2];}
  m=s.match(/(?:ko|không|k|hết)\s*(?:có\s*)?size\s*(\d{1,2})(?:\s*-\s*(\d{1,2}))?/);
  if(m){const a=+m[1],b=m[2]?+m[2]:a;o.thieu=[];for(let k=a;k<=b;k++)o.thieu.push(k);}
  if(/lẻ size/.test(s))o.tinhTrang='le';else if(/vài ri|sale nốt|sắp hết/.test(s))o.tinhTrang='it';
  return o;
}
const BANG={'hồng':['#FFD3E0','#FFF0F4','#E9809F'],'xanh':['#CDE7FF','#E6F3FF','#7EB6EC'],'vàng':['#FFE9A8','#FFF2B8','#EC7FA0'],'đỏ':['#FFC9C4','#E5484D','#FFFFFF'],
  'tím':['#D8D2FF','#B9A8FF','#7B6CF0'],'xám':['#E3E4EA','#C9CBD6','#7D8198'],'nâu':['#F2DFC8','#B97A4E','#7A4A2E'],'kem':['#FFF1DC','#F6E7CF','#C9A27A'],'đen':['#D5D7E0','#3A3E52','#8E92A8']};
function veMau(p,i){
  const ten=(p.name+' '+p.mau.map(m=>m.ten).join(' ')).toLowerCase();
  const kind=/ngủ|pijama|pyjama/.test(ten)?'pj':/váy|đầm|yếm/.test(ten)?'school':/khoác|dạ|nỉ|len|gile/.test(ten)?'coat':'pj';
  const keys=Object.keys(BANG);let c=null;for(const k of keys)if(ten.includes(k)){c=BANG[k];break;}
  c=c||BANG[keys[i%keys.length]];
  return{kind,tile:c[0],base:c[1],mark:c[2],pat:kind==='pj'?'dots':(i%2?'stripe':'plain'),bear:kind==='pj'?1:0,pant:kind==='pj'?null:c[2]};
}
const P=[],byId={};
(DATA.sanPham||[]).forEach((x,i)=>{
  if(!x||x.an===true)return;const d=docChu(x.chu);
  let id=String(x.ma||('mau-'+i)).toLowerCase().replace(/[^a-z0-9]+/g,'-');if(byId[id])id+='-'+i;
  const p={id,ma:x.ma||'',name:x.ten||x.ma||('Mẫu '+(i+1)),price:x.gia??d.gia??0,combo:x.combo??d.combo??0,comboDv:x.comboDv||d.comboDv||'cái',
    tu:x.tu??d.tu??10,den:x.den??d.den??28,thieu:x.thieu||d.thieu||[],tinhTrang:x.het?'het':(x.tinhTrang||d.tinhTrang||'con'),
    khu:x.khu||'Hàng mới về',chu:x.chu||'',anh:(x.anh||[]).filter(Boolean),treo:x.anhTreo||'',mau:(x.mau||[]).map(m=>typeof m==='string'?{ten:m}:m),look:2+(i*7)%9};
  Object.assign(p,veMau(p,i));P.push(p);byId[id]=p;
});
if(!P.length){$('#loadT').textContent='Chưa có mẫu nào trong data/san-pham.js';throw new Error('no products');}
/* Xem thử: lặp mẫu có sẵn cho đủ số ghi ở mauThu, chia đều vào các khu */
if(DATA.mauThu>P.length){const goc=[...P].sort((a,b)=>(b.anh.length?1:0)-(a.anh.length?1:0)),khu=(DATA.khu||[]).map(k=>k.ten);for(let n=0;P.length<DATA.mauThu;n++){const a=goc[n%goc.length],p=Object.assign({},a,{id:a.id+'-t'+n,khu:khu.length?khu[n%khu.length]:a.khu,thu:true});P.push(p);byId[p.id]=p;}}
const giaChu=p=>p.combo?`${p.price}k/${p.combo} ${p.comboDv}`:`${p.price}k`;
const dayKg=p=>p.tu===p.den?`${p.tu}kg`:`${p.tu}–${p.den}kg`;
/* Bé nặng kg này có mặc được mẫu không */
function hopSize(p,kg){if(p.tinhTrang==='het')return'het';if(kg<p.tu||kg>p.den)return'ngoai';if(p.thieu.includes(kg))return'thieu';return'ok';}
/* Gom mẫu theo khu (sạp) */
const KHU_MAU=['#FF9FDC','#7C3CFF','#ABDCE0','#2060E0','#FF9FDC','#7C3CFF'];
function nhomKhu(){
  const khu=DATA.khu||[],ten=[...new Set([...khu.map(k=>k.ten),...P.map(p=>p.khu)])],g=[];
  ten.forEach(n=>{const ps=P.filter(p=>p.khu===n),mau=(khu.find(k=>k.ten===n)||{}).mau||KHU_MAU[g.length%6];for(let i=0;i<ps.length;i+=3)g.push({ten:i?`${n} ${i/3+1}`:n,mau,ps:ps.slice(i,i+3)});});
  const noi=[...P].sort((a,b)=>(b.anh.length?1:0)-(a.anh.length?1:0)),them=['Mẫu hot','Xem thêm','Đồ mới'];let k=0;
  while(g.length<4){const off=k*4;g.push({ten:them[k%3],mau:KHU_MAU[g.length%6],ps:noi.map((_,j)=>noi[(j+off)%noi.length])});k++;}
  return g;
}
const NHOM=nhomKhu();
const tint=(hex,k)=>'#'+new T.Color(hex).lerp(new T.Color('#FFFFFF'),k).getHexString();
/* Bộ màu: nền, màu tương phản, màu điểm xuyết. Khu mới tự nhận một bộ. */
const PHOI=[['#FF9FDC','#7C3CFF','#ABDCE0','#FDEEF7'],['#7C3CFF','#FF9FDC','#ABDCE0','#F1ECFB'],['#ABDCE0','#2060E0','#FF9FDC','#E9F5F6'],['#2060E0','#ABDCE0','#FF9FDC','#EAF1FB']];
const toi=hex=>{const c=new T.Color(hex);return .3*c.r+.59*c.g+.11*c.b<.55;};
NHOM.forEach((g,i)=>{const f=PHOI.find(p=>p[0].toLowerCase()===String(g.mau).toLowerCase())||PHOI[i%4];g.mau=f[0];g.mau2=f[1];g.mau3=f[2];g.nen=f[3];g.chu='#7C3CFF';});

/* ---------- Vẽ quần áo ---------- */
const SHIRT='M30 10 l14 -8 q16 8 32 0 l14 8 l18 22 l-14 12 l-10 -8 v38 h-48 v-38 l-10 8 l-14 -12 z';
const PANT='M38 78 h44 l4 48 h-20 l-6 -30 l-6 30 h-20 z';
const SHORT='M36 78 h48 l4 26 h-22 l-6 -12 l-6 12 h-22 z';
function fillPat(c,p,w,h){
  c.fillStyle=p.base;c.fillRect(0,0,w,h);c.fillStyle=p.mark;
  if(p.pat==='stripe')for(let x=4;x<w;x+=11)c.fillRect(x,0,3,h);
  if(p.pat==='dots')for(let y=6,o=0;y<h;y+=15,o++)for(let x=(o%2)*8+4;x<w;x+=16){c.beginPath();c.arc(x,y,3.4,0,7);c.fill();}
}
function paintSet(c,p,w,h){
  const s=Math.min(w/120,h/132);c.save();c.translate((w-120*s)/2,(h-132*s)/2);c.scale(s,s);c.lineJoin='round';
  const pant=new Path2D(p.kind==='pj'?PANT:(p.kind==='school'?SHORT:PANT));
  c.save();c.clip(pant);if(p.pant){c.fillStyle=p.pant;c.fillRect(0,0,120,132);}else fillPat(c,p,120,132);c.restore();
  c.strokeStyle='rgba(30,30,70,.2)';c.lineWidth=1.2;c.stroke(pant);
  const sh=new Path2D(SHIRT);c.save();c.clip(sh);fillPat(c,p,120,132);
  c.fillStyle='rgba(20,20,60,.08)';c.fillRect(0,0,34,132);c.fillRect(86,0,34,132);c.restore();
  c.stroke(sh);
  if(p.kind==='coat'){
    c.fillStyle=p.mark;c.beginPath();c.arc(60,12,17,PI,0);c.fill();
    c.beginPath();c.arc(45,-1,6,0,7);c.arc(75,-1,6,0,7);c.fill();
    c.fillStyle='#FFF6E5';c.fillRect(58.500,14,3,60);
  }else{
    c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(44,2);c.lineTo(60,16);c.lineTo(50,25);c.lineTo(40,6);c.moveTo(76,2);c.lineTo(60,16);c.lineTo(70,25);c.lineTo(80,6);c.fill();c.stroke();
    for(const y of[34,48,62]){c.beginPath();c.arc(60,y,2.4,0,7);c.fillStyle=p.base==='#FFFFFF'?'#7EB6EC':'#FFFFFF';c.fill();}
  }
  if(p.bear){c.fillStyle='#8A5A3C';c.beginPath();c.arc(69,42,3,0,7);c.arc(79,42,3,0,7);c.fill();c.fillStyle='#A9744F';c.beginPath();c.arc(74,48,8,0,7);c.fill();c.fillStyle='#2B1B17';c.beginPath();c.arc(71.500,47,1.200,0,7);c.arc(76.500,47,1.200,0,7);c.fill();}
  if(p.id==='yem'){c.fillStyle='#4B74B8';c.fillRect(42,46,36,30);c.fillRect(44,20,6,28);c.fillRect(70,20,6,28);}
  c.restore();
}
function setCanvas(p,w=256,h=284,tile=false){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');if(tile){c.fillStyle=p.tile;c.fillRect(0,0,w,h);paintSet(c,p,w*.86,h*.86);}else paintSet(c,p,w,h);return cv;}
function drawThumb(cv,p){const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.fillStyle=p.tile;c.fillRect(0,0,w,h);c.save();c.translate(w*.08,h*.07);paintSet(c,p,w*.84,h*.86);c.restore();}
function texOf(cv){const t=new T.CanvasTexture(cv);t.anisotropy=4;return t;}
/* ---------- Ảnh thật: thẻ treo trên sạp, màu áo khi mặc thử ---------- */
function loadImg(src,cb){const im=new Image();im.decoding='async';im.onload=()=>cb(im);im.src=src;}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function cover(c,im,x,y,w,h){const s=Math.max(w/im.width,h/im.height),iw=im.width*s,ih=im.height*s;c.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
/* ---------- Nhãn sale kiểu 3D: lấy từ dữ liệu có sẵn, không cần shop nhập thêm ---------- */
const NHAN_MAU={hot:['#FFA04D','#F2581F','#B8360E','#FFFFFF','#FFE066'],gia:['#A57CFF','#6B35E8','#4A1FB8','#FFFFFF','#FFE066'],moi:['#FF8CC0','#E8488F','#B02866','#FFFFFF','#FFF2A8'],
  het:['#FF6B6B','#D93636','#9E1F1F','#FFFFFF','#FFE066'],combo:['#FFD36B','#F5A11F','#C2700A','#4A1FB8','#7C3CFF'],tot:['#6FE3B4','#1FB57D','#0E7A52','#FFFFFF','#FFF2A8']};
const GIA_RE=Math.min(...P.filter(p=>p.price>0&&!p.combo).map(p=>p.price),...P.map(p=>p.price||999));
function nhanMau(p){
  if(p.tinhTrang==='het')return null;
  if(p.tinhTrang==='it'||p.tinhTrang==='le')return{k:'het',t:'SẮP HẾT',s:'SIZE'};
  if(p.combo)return{k:'combo',t:'COMBO',s:`${p.price}K/${p.combo}`};
  if(p.price===GIA_RE)return{k:'tot',t:'GIÁ TỐT',s:''};
  if(/mới/i.test(p.khu))return{k:'moi',t:'MỚI VỀ',s:''};
  return null;
}
/* Mặt nhãn: khối nổi (mép tối phía dưới), mặt chuyển màu, viền trắng, vệt bóng, chữ có bóng khối. day=true vẽ cả phần dày (dùng trên ảnh phẳng). */
function veNhan(c,o,w,h,day){
  const[a,b,d,chu,phu]=NHAN_MAU[o.k],r=h*.32,dz=h*.13,font=f=>`800 ${f}px "Baloo 2","Be Vietnam Pro",sans-serif`;
  c.save();c.lineJoin='round';
  if(day){c.shadowColor='rgba(40,20,60,.35)';c.shadowBlur=h*.25;c.shadowOffsetY=h*.12;c.fillStyle=d;rr(c,-w/2,-h/2+dz,w,h,r);c.fill();c.shadowColor='transparent';}
  const g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;rr(c,-w/2,-h/2,w,h,r);c.fill();
  c.lineWidth=h*.08;c.strokeStyle='rgba(255,255,255,.95)';rr(c,-w/2+h*.06,-h/2+h*.06,w-h*.12,h-h*.12,r*.8);c.stroke();
  c.save();rr(c,-w/2,-h/2,w,h,r);c.clip();c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.ellipse(-w*.12,-h*.52,w*.55,h*.36,-.05,0,7);c.fill();c.restore();
  c.textAlign='center';c.textBaseline='middle';
  const viet=(t,y,f,col)=>{c.font=font(f);const mx=w*.84;let sz=f;if(c.measureText(t).width>mx){sz=f*mx/c.measureText(t).width;c.font=font(sz);}
    for(let k=3;k>0;k--){c.fillStyle=d;c.fillText(t,0,y+sz*.03*k);}c.fillStyle=col;c.fillText(t,0,y);};
  if(o.s){viet(o.t,-h*.17,h*.42,chu);viet(o.s,h*.24,h*.3,phu);}else viet(o.t,h*.02,h*.55,chu);
  c.restore();
}
/* Khung ảnh hình vòm: ảnh lớn ở trên, dải giá ở dưới. Vẽ độ phân giải cao để ảnh nét khi lại gần. */
function boardTex(p){
  const W=LOW?512:720,u=W/100,H=Math.round(129.5*u),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const vom=(x,y,w,h)=>{const r=w/2;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+r);c.arc(x+r,y+r,r,PI,0);c.lineTo(x+w,y+h);c.closePath();};
  const px=4.5*u,py=4.5*u,pw=W-9*u,ph=103*u-py;
  const draw=im=>{c.clearRect(0,0,W,H);
    c.fillStyle='#FFFFFF';vom(0,0,W,H);c.fill();
    c.save();vom(px,py,pw,ph);c.clip();
    if(im)cover(c,im,px,py,pw,ph);else{c.fillStyle=p.tile;c.fillRect(px,py,pw,ph);c.translate(px+pw*.1,py+ph*.14);paintSet(c,p,pw*.8,ph*.8);}
    c.restore();
    const nh=nhanMau(p);if(nh){c.save();c.translate(px+19*u,py+ph-11*u);c.rotate(-.1);veNhan(c,nh,34*u,15*u,true);c.restore();}
    c.textAlign='center';c.textBaseline='middle';c.font=`800 ${14*u}px "Baloo 2","Be Vietnam Pro",sans-serif`;const gt=giaChu(p),gw=Math.min(pw*.94,c.measureText(gt).width+16*u);
    c.fillStyle='#7C3CFF';rr(c,W/2-gw/2,107*u,gw,19*u,9.5*u);c.fill();c.fillStyle='#FFFFFF';c.fillText(gt,W/2,117*u,gw-8*u);};
  draw(null);const t=texOf(cv);t.anisotropy=8;t.generateMipmaps=false;t.minFilter=T.LinearFilter;
  if(p.anh.length)loadImg(p.anh[0],im=>{c.imageSmoothingQuality='high';draw(im);t.needsUpdate=true;mauTuAnh(p,im);});
  return t;
}
/* Lấy màu áo (nửa trên) và quần (nửa dưới) ở giữa ảnh để bé mặc thử */
function mauTuAnh(p,im){
  try{const n=32,cv=document.createElement('canvas');cv.width=cv.height=n;const c=cv.getContext('2d');cover(c,im,0,0,n,n);const d=c.getImageData(0,0,n,n).data;
    const avg=(y0,y1)=>{let r=0,g=0,b=0,k=0;for(let y=y0;y<y1;y++)for(let x=11;x<21;x++){const i=(y*n+x)*4;r+=d[i];g+=d[i+1];b+=d[i+2];k++;}return`rgb(${r/k|0},${g/k|0},${b/k|0})`;};
    const fill=(t,col)=>{const ctx=t.image.getContext('2d');ctx.fillStyle=col;ctx.fillRect(0,0,128,128);t.needsUpdate=true;};
    p.c1=avg(10,16);p.c2=avg(21,27);fill(p.cloth,p.c1);fill(p.clothB,p.c2);if(p.veRack)p.veRack();}catch(e){}
}
P.forEach(p=>{const g=NHOM.find(n=>n.ten===p.khu);p.acc=g?g.mau2:'#7C3CFF';p.acc2=g?g.mau:'#2A1670';p.tex=boardTex(p);
  const a=document.createElement('canvas');a.width=a.height=128;fillPat(a.getContext('2d'),p,128,128);p.cloth=texOf(a);p.cloth.wrapS=p.cloth.wrapT=T.RepeatWrapping;
  const b=document.createElement('canvas');b.width=b.height=128;fillPat(b.getContext('2d'),p.pant?{base:p.pant,mark:p.pant,pat:'plain'}:p,128,128);p.clothB=texOf(b);});

/* ---------- Gộp hình tĩnh, nướng sẵn ánh sáng để điện thoại chạy nhẹ ---------- */
class Batch{
  constructor(){this.p=[];this.n=[];this.c=[];}
  add(geo,color,m,smooth){
    const g=(geo.index?geo.toNonIndexed():geo.clone());if(!smooth)g.computeVertexNormals();g.applyMatrix4(m);
    const pa=g.attributes.position,na=g.attributes.normal,col=new T.Color(color);
    for(let i=0;i<pa.count;i++){this.p.push(pa.getX(i),pa.getY(i),pa.getZ(i));this.n.push(na.getX(i),na.getY(i),na.getZ(i));this.c.push(col.r,col.g,col.b);}
  }
  mesh(light){
    const n=this.p.length/3,col=new Float32Array(n*3);
    if(light){const{sky,ground,sun,dir,pts,aoH=1.3,aoMin=.7}=light;
      for(let i=0;i<n;i++){const x=this.p[i*3],y=this.p[i*3+1],z=this.p[i*3+2],nx=this.n[i*3],ny=this.n[i*3+1],nz=this.n[i*3+2];
        const t=ny*.5+.5;let r=lerp(ground[0],sky[0],t),g=lerp(ground[1],sky[1],t),b=lerp(ground[2],sky[2],t);
        const sd=Math.max(0,nx*dir[0]+ny*dir[1]+nz*dir[2]);r+=sun[0]*sd;g+=sun[1]*sd;b+=sun[2]*sd;
        for(const L of pts){const dx=L.x-x,dy=L.y-y,dz=L.z-z,d2=dx*dx+dy*dy+dz*dz;if(d2>L.r2)continue;const f=1-d2/L.r2,d=Math.sqrt(d2)||1,ndl=(nx*dx+ny*dy+nz*dz)/d,k=L.i*f*f*(.35+.65*Math.max(0,ndl));r+=L.c[0]*k;g+=L.c[1]*k;b+=L.c[2]*k;}
        const ao=lerp(aoMin,1,clamp(y/aoH,0,1));
        col[i*3]=Math.min(1,this.c[i*3]*r*ao);col[i*3+1]=Math.min(1,this.c[i*3+1]*g*ao);col[i*3+2]=Math.min(1,this.c[i*3+2]*b*ao);}
    }else col.set(this.c);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(this.p),3));geo.setAttribute('color',new T.BufferAttribute(col,3));
    if(light)geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(this.n),3));
    this.p=this.n=this.c=null;
    return new T.Mesh(geo,light?glossMat(light.dir):new T.MeshBasicMaterial({vertexColors:true}));
  }
  /* vật liệu ánh kim, sứ: chỉ một lần tra ảnh nên máy yếu vẫn chạy mượt */
  meshMc(tex){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(this.p),3));geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(this.n),3));this.p=this.n=this.c=null;return new T.Mesh(geo,new T.MeshMatcapMaterial({matcap:tex}));}
}
const MC={};
const MC_BANG={bh:['#FFFFFF','#FFD6EF','#FF9FDC','#D45E9C'],bt:['#FFFFFF','#E2D8FF','#A98BFF','#6A48D2'],bx:['#FFFFFF','#D9F3F3','#8ED2D6','#4C9DA3'],bd:['#FFFFFF','#D7E5FF','#86AAF2','#4A6EC2'],bv:['#FFFFFF','#FFF1C4','#FFD45C','#D6A21E'],bw:['#FFFFFF','#FFFFFF','#F4EFF9','#CEC5DE'],den:['#7A7A86','#3A3A44','#24242C','#141418'],vang:['#FFFFFF','#C7B2FF','#8E63F2','#5326C4'],su:['#FFFFFF','#FBF8FC','#E7E1EE','#CFC8DC'],bac:['#FFFFFF','#E9EDF4','#8E97AA','#3E4558'],ndo:['#FFFFFF','#FF9A9A','#E5322D','#8E1414'],nvang:['#FFFFFF','#FFE9A3','#E8B83A','#9A6B10'],nxanh:['#FFFFFF','#9BE3B5','#2F9E5B','#145A30'],trang:['#FFFFFF','#FFFFFF','#EEEAF2','#A9A3B8']};
function matcap(k){
  if(MC[k])return MC[k];const n=128,cv=document.createElement('canvas');cv.width=cv.height=n;const c=cv.getContext('2d'),[a,b,d,e]=MC_BANG[k];
  c.fillStyle=e;c.fillRect(0,0,n,n);const g=c.createRadialGradient(n*.42,n*.34,2,n*.5,n*.5,n*.56);g.addColorStop(0,a);g.addColorStop(.28,b);g.addColorStop(.72,d);g.addColorStop(1,e);c.fillStyle=g;c.fillRect(0,0,n,n);
  return MC[k]=new T.CanvasTexture(cv);
}
/* Bóng nhựa: ánh sáng đã nướng sẵn vào màu, chỉ cộng thêm vệt sáng bóng và viền sáng theo góc nhìn */
const GLOSS={};
function glossMat(dir){
  const k=dir.join(',');if(GLOSS[k])return GLOSS[k];
  const m=new T.MeshBasicMaterial({vertexColors:true}),sun={value:new V3(...dir).normalize()};
  m.onBeforeCompile=sh=>{
    sh.uniforms.uSun=sun;
    sh.vertexShader=sh.vertexShader.replace('void main() {','varying vec3 vGN;varying vec3 vGV;\nvoid main() {').replace('#include <project_vertex>','#include <project_vertex>\nvGN=normalize(normalMatrix*normal);vGV=-mvPosition.xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform vec3 uSun;varying vec3 vGN;varying vec3 vGV;\nvoid main() {').replace('#include <envmap_fragment>',`#include <envmap_fragment>
      vec3 gn=normalize(vGN),gv=normalize(vGV),gl=normalize((viewMatrix*vec4(uSun,0.)).xyz),gh=normalize(gl+gv);
      float nh=max(dot(gn,gh),0.),nv=max(dot(gn,gv),0.);
      outgoingLight+=vec3(pow(nh,60.)*.22+pow(nh,8.)*.05)+pow(1.-nv,4.)*.1*outgoingLight;`);
  };
  return GLOSS[k]=m;
}
/* Nhân vật: viền sáng nhẹ quanh mép như đất sét bóng */
function rim(m){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <envmap_fragment>','#include <envmap_fragment>\noutgoingLight+=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.)*.22*outgoingLight;');};return m;}
const seg=v=>clamp(Math.ceil(v/1.5),1,14);
/* Hộp bo tròn cạnh như đồ nhựa: 2 đoạn cong ở mỗi cạnh, phần phẳng chia theo seg() để ánh đèn nướng mịn */
const RB={};
function roundBox(w,h,d,r){
  const key=[w,h,d,r].map(v=>v.toFixed(3)).join('|');if(RB[key])return RB[key];
  const D=[w,h,d],m=D.map(seg),N=m.map(v=>v+4),g=new T.BoxGeometry(1,1,1,N[0],N[1],N[2]),pa=g.attributes.position,na=g.attributes.normal,c=[0,0,0],q=[0,0,0],v=new V3();
  for(let i=0;i<pa.count;i++){
    for(let a=0;a<3;a++){const n=N[a],j=Math.round((pa.array[i*3+a]+.5)*n),e=D[a]/2-r;
      if(j<2){c[a]=-e;q[a]=-(2-j)/2;}else if(j>n-2){c[a]=e;q[a]=(j-n+2)/2;}else{c[a]=-e+(j-2)/m[a]*2*e;q[a]=0;}}
    v.set(q[0],q[1],q[2]).normalize();na.setXYZ(i,v.x,v.y,v.z);pa.setXYZ(i,c[0]+v.x*r,c[1]+v.y*r,c[2]+v.z*r);
  }
  return RB[key]=g;
}
const boxG=(w,h,d)=>{const mn=Math.min(w,h,d);return mn<.025?new T.BoxGeometry(w,h,d,seg(w),seg(h),seg(d)):roundBox(w,h,d,Math.min(mn*.2,.09));};
const LP=(x,y,z,i,r,c)=>({x,y,z,i,r2:r*r,c});
const WARM=[1,.86,.8],GOLD=[1,.94,.9];

function newScene(id,title,sub){
  const s={id,title,sub,dec:[],root:new T.Group(),lit:new Batch(),glow:new Batch(),hop:new Batch(),vl:{den:new Batch(),vang:new Batch(),su:new Batch()},pts:[],col:[],items:[],glows:[],npcs:[],stack:[new T.Matrix4()],tags:[],taps:[]};
  s.m=()=>s.stack[s.stack.length-1];
  s.push=m=>s.stack.push(s.m().clone().multiply(m));s.pop=()=>s.stack.pop();
  s.at=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>s.m().clone().multiply(mat(x,y,z,ry,rx,rz,sx,sy,sz));
  s.box=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>s.lit.add(boxG(w,h,d),c,s.at(x,y,z,ry,rx,rz),true);
  s.cyl=(r1,r2,h,x,y,z,c,sg=16,rx=0,rz=0)=>s.lit.add(new T.CylinderGeometry(r1,r2,h,sg),c,s.at(x,y,z,0,rx,rz),sg>=12);
  s.ball=(r,x,y,z,c,sy=1,d=2)=>s.lit.add(new T.IcosahedronGeometry(r,Math.max(d,2)),c,s.at(x,y,z,0,0,0,1,sy,1),true);
  s.uv=(k,geo,m)=>((s.uvb=s.uvb||{})[k]=s.uvb[k]||[]).push([geo,m]);
  s.mc=(k,geo,m)=>(s.vl[k]||(s.vl[k]=new Batch())).add(geo,'#FFFFFF',m,true);
  s.gball=(r,x,y,z,c,sy=1)=>s.glow.add(new T.SphereGeometry(r,10,8),c,s.at(x,y,z,0,0,0,1,sy,1));
  s.gbox=(w,h,d,x,y,z,c)=>s.glow.add(new T.BoxGeometry(w,h,d),c,s.at(x,y,z));
  s.world=(x,y,z)=>new V3(x,y,z).applyMatrix4(s.m());
  s.halo=(x,y,z,c,size=2.6)=>{const v=s.world(x,y,z);s.glows.push({v,c:new T.Color(c),size});};
  s.solid=(minX,maxX,minZ,maxZ,tall=true)=>s.col.push({minX,maxX,minZ,maxZ,tall});
  s.round=(x,z,r)=>s.col.push({x,z,r});
  /* Nhãn dán (giấy vận đơn, ký hiệu thùng, tem DuuDuu): gom hết vào một lưới, một ảnh */
  s.dan=(k,w,h,x,y,z,ry=0,rx=0,rz=0)=>{const[u0,v0,u1,v1]=DAN_VUNG[k],g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));s.dec.push([g,s.at(x,y,z,ry,rx,rz)]);};
  s.plane=(tex,w,h,x,y,z,ry=0,opts={})=>{const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,...opts}));o.applyMatrix4(s.at(x,y,z,ry));s.root.add(o);return o;};
  return s;
}
function finish(s,light){
  light.pts=s.pts;s.root.add(s.lit.mesh(light));s.root.add(s.glow.mesh(null));if(s.hop.p.length)s.root.add(s.hop.mesh({sky:[1.02,1.02,1.05],ground:[.8,.78,.92],sun:[.08,.08,.06],dir:[-.42,.8,.43],pts:[],aoH:.9,aoMin:.82}));for(const k in s.vl)if(s.vl[k].p.length)s.root.add(s.vl[k].meshMc(matcap(k)));
  if(s.uvb)for(const k in s.uvb)s.root.add(new T.Mesh(merge(s.uvb[k]),new T.MeshMatcapMaterial({matcap:matcap('trang'),map:texNoel(k)})));
  if(s.dec.length)s.root.add(new T.Mesh(merge(s.dec),new T.MeshBasicMaterial({map:danTex(),color:'#F4EEE6',transparent:true,alphaTest:.05,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})));
  if(s.glows.length){
    const n=s.glows.length,pos=new Float32Array(n*3),col=new Float32Array(n*3);
    s.glows.forEach((g,i)=>{pos.set([g.v.x,g.v.y,g.v.z],i*3);col.set([g.c.r,g.c.g,g.c.b],i*3);});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));
    s.root.add(new T.Points(geo,new T.PointsMaterial({map:GLOW,size:3,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.55})));
  }
  s.root.visible=false;scene.add(s.root);
}
function radial(size,stops){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,cl])=>gr.addColorStop(o,cl));g.fillStyle=gr;g.fillRect(0,0,size,size);return c;}
let GLOW,BLOB;

/* ---------- Biển hiệu ---------- */
function sign(text,{w=512,h=128,bg='#1B2458',fg='#FFD866',size=64,edge='#FFC93C',sub=''}={}){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  c.fillStyle=bg;c.fillRect(0,0,w,h);if(edge){c.strokeStyle=edge;c.lineWidth=8;c.strokeRect(10,10,w-20,h-20);}
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
  const fit=(t,wt,sz,fam)=>{c.font=`${wt} ${sz}px ${fam}`;const m=c.measureText(t).width,mx=w-56;if(m>mx){sz=Math.floor(sz*mx/m);c.font=`${wt} ${sz}px ${fam}`;}};
  fit(text,800,size,'"Baloo 2","Be Vietnam Pro",sans-serif');c.fillText(text,w/2,sub?h*.42:h*.54);
  if(sub){fit(sub,600,size*.42,'"Be Vietnam Pro",sans-serif');c.fillText(sub,w/2,h*.76);}
  return texOf(cv);
}

/* ---------- Chi tiết dùng chung ---------- */
const INK='#2A1670';
const BOARD={w:2.1,h:2.72};let BOARD_G;
/* Đặt một khung ảnh sản phẩm hình vòm lên kệ. */
function board(s,id,x,y,z,ry,sc=1,area){
  const p=byId[id];BOARD_G=BOARD_G||new T.PlaneGeometry(BOARD.w,BOARD.h);
  p.mat=p.mat||new T.MeshBasicMaterial({map:p.tex,transparent:true,alphaTest:.03,depthWrite:false});
  const m=new T.Mesh(BOARD_G,p.mat);m.applyMatrix4(s.at(x,y,z,ry,0,0,sc,sc,1));m.userData.item=p;s.root.add(m);
  s.items.push({mesh:m,p,grp:s.grp,pos:s.world(x,y,z),hot:true,area});
}
function plant(s,x,z,sc=1){
  s.cyl(.42*sc,.42*sc,.9*sc,x,.45*sc,z,'#FFFFFF',18);s.cyl(.05*sc,.07*sc,1.1*sc,x,1.4*sc,z,'#6A4028',6);
  s.ball(.72*sc,x,2.3*sc,z,'#3F9A63');s.ball(.5*sc,x+.36*sc,1.95*sc,z+.15*sc,'#4FB071');s.ball(.5*sc,x-.34*sc,2.05*sc,z-.1*sc,'#357F52');
  s.round(x,z,.55*sc);
}
/* Chữ phát sáng gắn thẳng lên tường */
function haloSign(text,{w=1024,h=200,size=120,fg='#1B2458',glow='rgba(255,226,160,.95)',wt=800,sub=''}={}){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;c.shadowColor=glow;c.shadowBlur=size*.28;
  const fit=(t,sz,we,fam)=>{c.font=`${we} ${sz}px ${fam}`;const m=c.measureText(t).width,mx=w-60;if(m>mx){sz=Math.floor(sz*mx/m);c.font=`${we} ${sz}px ${fam}`;}};
  fit(text,size,wt,'"Baloo 2","Be Vietnam Pro",sans-serif');for(let i=0;i<3;i++)c.fillText(text,w/2,sub?h*.38:h*.54);
  if(sub){fit(sub,size*.3,600,'"Be Vietnam Pro",sans-serif');c.shadowBlur=0;c.fillText(sub,w/2,h*.8);}
  const t=texOf(cv);t.anisotropy=8;return t;
}
/* Biển tròn chìa ra lối đi, nhìn dọc hành lang vẫn đọc được */
function bladeTex(name,color){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d');
  c.fillStyle='#FFFFFF';c.beginPath();c.arc(256,256,244,0,7);c.fill();c.strokeStyle=color;c.lineWidth=24;c.beginPath();c.arc(256,256,226,0,7);c.stroke();
  c.fillStyle='#1B2458';c.textAlign='center';c.textBaseline='middle';
  const w=name.split(' '),a=Math.ceil(w.length/2),L=w.length>1?[w.slice(0,a).join(' '),w.slice(a).join(' ')]:[name];let sz=96;c.font=`800 ${sz}px "Baloo 2","Be Vietnam Pro",sans-serif`;
  const mx=Math.max(...L.map(t=>c.measureText(t).width));if(mx>370){sz=Math.floor(sz*370/mx);c.font=`800 ${sz}px "Baloo 2","Be Vietnam Pro",sans-serif`;}
  L.forEach((t,i)=>c.fillText(t,256,256+(i-(L.length-1)/2)*sz*1.12));
  const t=texOf(cv);t.anisotropy=8;return t;
}
/* Sàn: nền đá sáng, phần còn lại do từng cảnh vẽ thêm */
/* Mảnh đá màu kiểu terrazzo, to và đậm để nhìn rõ trên điện thoại */
function manhDa(c,r,x0,x1,z0,z1,mm,md){
  for(let i=0,n=Math.round((x1-x0)*(z1-z0)*md);i<n;i++){const x=x0+r()*(x1-x0),z=z0+r()*(z1-z0),q=.07+r()*.13,a0=r()*7;c.fillStyle=mm[i%mm.length];c.beginPath();for(let k=0;k<5;k++){const a=a0+k/5*2*PI,d=q*(.6+r()*.5);c[k?'lineTo':'moveTo'](x+Math.cos(a)*d,z+Math.sin(a)*d);}c.closePath();c.fill();}
}
function floorTex(x0,x1,z0,z1,base,paint){
  const Q=LOW?.5:1.5,cv=document.createElement('canvas');cv.width=1024*Q;cv.height=2048*Q;const c=cv.getContext('2d'),r=seeded(5);
  c.scale(cv.width/(x1-x0),cv.height/(z1-z0));c.translate(-x0,-z0);
  c.fillStyle=base;c.fillRect(x0,z0,x1-x0,z1-z0);
  manhDa(c,r,x0,x1,z0,z1,['#FFFFFF','#F7ECC9','#F8DFEF','#E2DAF5','#FFFFFF','#D9EBF2'],.8);
  const glow=(x,z,R,col)=>{const g=c.createRadialGradient(x,z,0,x,z,R);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-R,z-R,2*R,2*R);};
  paint(c,glow,r);
  const t=texOf(cv);t.anisotropy=8;return t;
}
/* Bục bậc thang có đèn hắt dưới chân */
function stepsPlinth(s,x,z,ry){
  s.push(mat(x,0,z,ry));
  for(const[w,h,d,bx,bz,col]of[[2.8,1,2.8,0,0,'#FFFFFF'],[1.5,.62,1.5,2.1,.5,'#EFE9FA'],[1.5,.32,1.6,1.1,2.1,'#FFFFFF']]){s.box(w,h,d,bx,h/2,bz,col);s.gbox(w+.14,.03,d+.14,bx,.02,bz,'#E9E3F7');}
  s.pop();
}
function bear(s,x,z,sc=1,ry=0,y=0,b='#B9A8FF',l='#EDE7FF'){
  s.push(mat(x,y,z,ry,0,0,sc,sc,sc));
  s.lit.add(new T.SphereGeometry(.9,32,24),b,s.at(0,.95,0,0,0,0,1,1.05,.9),true);s.lit.add(new T.SphereGeometry(.55,24,16),l,s.at(0,.92,.5,0,0,0,1,1.1,.6),true);
  s.lit.add(new T.SphereGeometry(.72,32,24),b,s.at(0,2.15,.05),true);
  for(const k of[-1,1]){s.lit.add(new T.SphereGeometry(.26,10,8),b,s.at(k*.55,2.73,0),true);s.lit.add(new T.SphereGeometry(.13,8,6),l,s.at(k*.55,2.73,.15),true);s.lit.add(new T.SphereGeometry(.34,12,8),b,s.at(k*.7,.28,.65,0,0,0,1,.8,1.3),true);s.lit.add(new T.SphereGeometry(.06,6,5),'#2B1B17',s.at(k*.26,2.28,.68),true);}
  /* một tay giơ lên vẫy */
  s.lit.add(new T.SphereGeometry(.28,10,8),b,s.at(-.92,1.22,.25,0,0,0,1,1.4,1),true);s.lit.add(new T.SphereGeometry(.28,10,8),b,s.at(1.15,1.95,.2,0,0,-.5,1,1.7,1),true);
  s.lit.add(new T.SphereGeometry(.26,10,8),l,s.at(0,2,.66,0,0,0,1.15,.85,.7),true);s.lit.add(new T.SphereGeometry(.08,6,5),'#2B1B17',s.at(0,2.08,.87),true);
  /* má hồng, miệng cười */
  for(const k of[-1,1])s.lit.add(new T.SphereGeometry(.11,14,10),'#FFB8CB',s.at(k*.37,2.02,.62,k*.5,0,0,1,.62,.35),true);
  s.lit.add(new T.TorusGeometry(.075,.016,6,14,PI),'#2B1B17',s.at(0,1.96,.84,0,-.25,PI),true);
  /* khăn len quàng cổ: vòng quanh cổ và hai vạt buông trước ngực */
  s.lit.add(new T.TorusGeometry(.56,.17,14,36),'#E8473C',s.at(0,1.62,.06,0,PI/2.25),true);
  s.lit.add(roundBox(.28,.72,.1,.045),'#E8473C',s.at(.24,1.2,.9,0,-.32,.1),true);
  s.lit.add(roundBox(.26,.56,.1,.045),'#D93A30',s.at(.02,1.3,.9,0,-.3,-.12),true);
  for(const[x,y,z,rz]of[[.27,.87,1.03,.1],[.05,1.04,1.01,-.12]])s.lit.add(roundBox(.27,.045,.11,.02),'#FFFFFF',s.at(x,y,z,0,-.32,rz),true);
  if(NOEL){s.lit.add(new T.ConeGeometry(.6,1,28),'#E5322D',s.at(.12,3.08,0,0,0,-.38),true);s.lit.add(new T.TorusGeometry(.58,.15,14,40),'#FFFFFF',s.at(0,2.66,.02,0,PI/2.1,-.1),true);s.lit.add(new T.SphereGeometry(.15,20,14),'#FFFFFF',s.at(.33,3.55,0),true);}
  s.pop();
}

/* Bộ họa tiết riêng của DuuDuu: hoa, sao, vòng cung, khối bo tròn và hai chữ u trong tên */
const VE={
  hoa(c,x,y,r,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;for(let i=0;i<6;i++){const a=i/6*2*PI;c.beginPath();c.arc(Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.42,0,7);c.fill();}c.beginPath();c.arc(0,0,r*.5,0,7);c.fill();c.restore();},
  sao(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+r*.1,y-r*.1,x+r,y);c.quadraticCurveTo(x+r*.1,y+r*.1,x,y+r);c.quadraticCurveTo(x-r*.1,y+r*.1,x-r,y);c.quadraticCurveTo(x-r*.1,y-r*.1,x,y-r);c.fill();},
  cung(c,x,y,R,w,a0,a1,col){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.arc(x,y,R,a0,a1);c.stroke();},
  vuong(c,x,y,d,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;rr(c,-d/2,-d/2,d,d,d*.18);c.fill();c.restore();},
  tamgiac(c,x,y,r,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;c.strokeStyle=col;c.lineWidth=r*.26;c.lineJoin='round';c.beginPath();for(let i=0;i<3;i++){const a=i/3*2*PI-PI/2;c[i?'lineTo':'moveTo'](Math.cos(a)*r*.8,Math.sin(a)*r*.8);}c.closePath();c.fill();c.stroke();c.restore();},
  uu(c,x,y,r,w,col){VE.cung(c,x-r*1.25,y,r,w,.15,PI-.15,col);VE.cung(c,x+r*1.25,y,r,w,.15,PI-.15,col);}
};
/* Tường màu của gian: họa tiết lớn nằm ở mép và trên cao, chừa phần giữa cho bảng sản phẩm */
function muralTex(g,i){
  const q=LOW?.5:1,cv=document.createElement('canvas');cv.width=1024*q;cv.height=512*q;const c=cv.getContext('2d');c.scale(q,q);
  const a=g.mau2,b=g.mau3;c.fillStyle=g.mau;c.fillRect(0,0,1024,512);
  [()=>{VE.cung(c,512,235,446,84,.06,PI-.06,a);VE.hoa(c,158,112,84,b,.3);VE.sao(c,872,112,84,'#FFFFFF');VE.uu(c,512,64,40,20,a);},
   ()=>{VE.cung(c,512,560,470,84,PI+.08,-.08,a);VE.hoa(c,106,392,78,b,.2);VE.sao(c,916,392,78,'#FFFFFF');},
   ()=>{VE.vuong(c,108,366,150,.12,a);VE.tamgiac(c,926,372,94,.35,a);VE.cung(c,150,70,96,50,.2,PI*1.2,a);VE.sao(c,888,118,62,'#FFFFFF');VE.hoa(c,512,84,44,b);},
   ()=>{VE.cung(c,0,0,250,76,.08,PI/2-.08,a);VE.cung(c,1024,512,216,76,PI+.08,PI*1.5-.08,a);VE.hoa(c,884,106,80,b,.5);VE.sao(c,106,398,70,'#FFFFFF');if(!g.logo)VE.uu(c,512,64,40,20,b);}][i%4]();
  const t=texOf(cv);t.anisotropy=8;return t;
}

/* ---------- Bày hàng trong khu: bục, kệ, khung ảnh, giá treo, ma-nơ-canh ---------- */
const KE=1.95,TAY=1.86,KHOI=.3;   /* mặt kệ, thanh treo, mặt bục */
const mkCv=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return[cv,cv.getContext('2d')];};
/* Bóng đổ mềm chỉ dùng shadowBlur để Safari cũng vẽ được */
function bong(c,ve,blur,dx,dy,col){const off=c.canvas.width*2;c.save();c.shadowColor=col;c.shadowBlur=blur;c.shadowOffsetX=off+dx;c.shadowOffsetY=dy;c.translate(-off,0);c.fillStyle='#000';c.beginPath();ve();c.fill();c.restore();}
const vomVe=(c,x,y,w,h)=>{const r=w/2;c.moveTo(x-r,y+h);c.lineTo(x-r,y+r);c.arc(x,y+r,r,PI,0);c.lineTo(x+r,y+h);c.closePath();};
/* Lớp bóng nhẹ của kệ, khung, quần áo in lên khối màu. Cắt theo đúng hình khối để không rơi ra ngoài. */
function lopBong(k,xs,sc,giaX){
  const W2=5.2,H2=7,q=LOW?40:64,[cv,c]=mkCv(2*W2*q,H2*q),X=x=>(x+W2)*q,Y=y=>(H2-y)*q,mau='rgba(50,40,90,.3)';
  const fw=BOARD.w*sc,fh=BOARD.h*sc;
  bong(c,()=>c.rect(X(-4),Y(KE),8*q,.1*q),.2*q,0,.16*q,mau);
  xs.forEach(x=>bong(c,()=>vomVe(c,X(x),Y(KE+fh),fw*q,fh*q),.16*q,0,.09*q,mau));
  giaX.forEach(x=>{for(let n=0;n<3;n++)bong(c,()=>c.rect(X(x-.95+n*.7),Y(TAY-.46),.5*q,.95*q),.14*q,0,0,'rgba(50,40,90,.16)');});
  c.globalCompositeOperation='destination-in';c.fillStyle='#000';c.beginPath();nenKhu().getPoints(30).forEach((p,i)=>c[i?'lineTo':'moveTo'](X(p.x),Y(p.y)));c.closePath();c.fill();c.globalCompositeOperation='source-over';
  const t=texOf(cv);return t;
}
const hinhVom=(w,h)=>{const S=new T.Shape(),r=w/2;S.moveTo(-r,0);S.lineTo(-r,h-r);S.absarc(0,h-r,r,PI,0,true);S.lineTo(r,0);S.closePath();return S;};
const ong=(s,kind,r,a,b)=>{const A=new V3(...a),B=new V3(...b),d=B.clone().sub(A),L=d.length(),q=new T.Quaternion().setFromUnitVectors(new V3(0,1,0),d.clone().normalize());s.mc(kind,new T.CylinderGeometry(r,r,L,8),s.m().clone().multiply(new T.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),q,new V3(1,1,1))));};
/* Giá treo gỗ sáng mảnh đứng trên bục */
function giaTreo(s,x,w,yb,z){
  const R=.14,a=x-w/2,b=x+w/2,t=arguments[5]||TAY;
  ong(s,'vang',.018,[a+R,t,z],[b-R,t,z]);for(const q of[a,b])ong(s,'vang',.018,[q,yb,z],[q,t-R,z]);
  s.mc('vang',new T.TorusGeometry(R,.018,6,6,PI/2),s.at(b-R,t-R,z));s.mc('vang',new T.TorusGeometry(R,.018,6,6,PI/2),s.at(a+R,t-R,z,0,0,PI/2));
  for(const q of[a,b])s.mc('vang',new T.CylinderGeometry(.16,.17,.02,14),s.at(q,yb+.01,z));
}
/* Ma-nơ-canh trắng, váy theo màu khu */
const THAN=[[.001,1.0],[.12,1.0],[.2,1.12],[.17,1.28],[.215,1.5],[.18,1.62],[.075,1.68],[.06,1.76],[.001,1.77]].map(p=>new T.Vector2(p[0],p[1]));
const VAY=[[.13,1.14],[.22,1.06],[.42,.8],[.6,.62],[.56,.58],[.001,.58]].map(p=>new T.Vector2(p[0],p[1]));
function manoCanh(s,x,y,z,col,ry=0){
  s.push(mat(x,y,z,ry));s.mc('su',new T.LatheGeometry(THAN,12),s.at(0,0,0));
  s.lit.add(new T.LatheGeometry(VAY,14),col,s.at(0,0,0),true);
  ong(s,'vang',.022,[0,.03,0],[0,.8,0]);s.mc('vang',new T.CylinderGeometry(.22,.24,.03,12),s.at(0,.02,0));
  s.pop();
}
/* Quần áo treo trên giá, tô bằng màu lấy từ ảnh sản phẩm */
function rackTex(p){
  if(p.rack)return p.rack;
  const W=LOW?360:512,H=Math.round(W*.68),[cv,c]=mkCv(W,H),u=W/200;
  const mot=(x,a,b,lech,kg)=>{
    c.save();c.translate(x*u,0);c.scale(u*.8,u*.8);c.lineJoin='round';
    c.strokeStyle='#D9AE7C';c.lineWidth=1.3;c.beginPath();c.arc(0,4,3.4,PI*.9,PI*2.2);c.lineTo(0,10);c.stroke();
    const ao=new Path2D('M-9 11 Q0 17 9 11 L24 18 L33 44 L22 48 L17 34 L17 66 L-17 66 L-17 34 L-22 48 L-33 44 L-24 18 Z');
    const duoi=p.kind==='school'||/váy|đầm|yếm/.test(p.name)?new Path2D('M-16 64 L16 64 L31 114 Q0 122 -31 114 Z'):new Path2D('M-16 64 L16 64 L20 118 L4 118 L0 84 L-4 118 L-20 118 Z');
    const to=(pa,col)=>{c.save();c.clip(pa);c.fillStyle=col;c.fillRect(-40,0,80,130);
      for(const[q,al,w]of[[-13,.1,6],[-3,.07,4],[8,.1,7],[19,.08,5]]){c.fillStyle=`rgba(40,20,60,${al})`;c.fillRect(q+lech,0,w,130);}
      for(const[q,al,w]of[[-8,.14,3],[3,.12,3],[14,.1,3]]){c.fillStyle=`rgba(255,255,255,${al})`;c.fillRect(q+lech,0,w,130);}
      c.restore();c.strokeStyle='rgba(50,40,90,.24)';c.lineWidth=.7;c.stroke(pa);};
    to(duoi,b);to(ao,a);
    c.fillStyle='#FFFFFF';rr(c,-11,20,22,11,3);c.fill();c.strokeStyle='rgba(50,40,90,.3)';c.lineWidth=.6;c.stroke();c.fillStyle='#3A2C6E';c.font='700 7.5px "Be Vietnam Pro",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(kg+'kg',0,25.8);
    c.restore();
  };
  /* Có ảnh đã tách nền (anhTreo): treo chính bộ đồ đó lên móc, lớn dần theo size, thay cho hình vẽ */
  const moc=(x,y0,hw,yv)=>{c.save();c.translate(x,0);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#C99A63';
    c.lineWidth=1.4*u;c.beginPath();c.arc(0,y0+3*u,2.6*u,PI*.9,PI*2.2);c.lineTo(0,y0+7*u);c.stroke();
    c.lineWidth=1.8*u;c.beginPath();c.moveTo(-hw,yv);c.lineTo(0,y0+7*u);c.lineTo(hw,yv);c.stroke();c.restore();};
  const the=(x,y,kg)=>{c.save();c.translate(x,y);c.fillStyle='#FFFFFF';rr(c,-8*u,0,16*u,8*u,2*u);c.fill();c.strokeStyle='rgba(50,40,90,.3)';c.lineWidth=.5*u;c.stroke();
    c.fillStyle='#3A2C6E';c.font=`700 ${5.4*u}px "Be Vietnam Pro",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(kg+'kg',0,4.2*u);c.restore();};
  const veAnh=(im,kg)=>{[28,76,124,172].forEach((x,q)=>{const k=.8+.065*q,bw=46*u*k,bh=(H-14*u)*k,s=Math.min(bw/im.width,bh/im.height),iw=im.width*s,ih=im.height*s,y=10*u;
    moc(x*u,1.5*u,iw*.36,y+ih*.06);c.drawImage(im,x*u-iw/2,y,iw,ih);the(x*u+iw*.22,y+ih*.05,kg[q]);});};
  const ve=()=>{c.clearRect(0,0,W,H);const a=p.c1||p.base,b=p.c2||p.pant||p.mark;const kg=[0,1,2,3].map(q=>Math.round(p.tu+(p.den-p.tu)*q/3));
    if(p.imTreo){c.imageSmoothingQuality='high';veAnh(p.imTreo,kg);return;}
    [[28,0],[76,3],[124,-3],[172,2]].forEach(([x,l],q)=>mot(x,a,b,l,kg[q]));};
  ve();const t=texOf(cv);t.anisotropy=8;p.veRack=()=>{ve();t.needsUpdate=true;};p.rack=t;
  if(p.treo)loadImg(p.treo,im=>{p.imTreo=im;p.veRack();});
  return t;
}

/* ---------- Chiều sâu: đồ đời thường quanh khu hàng ---------- */
/* Đổi tọa độ trong khu (lx dọc khu, lz từ tường ra lối đi) sang tọa độ chợ */
const veTheGioi=(d,lx,lz)=>d.side<0?{x:d.x+lz,z:d.z-lx}:{x:d.x-lz,z:d.z+lx};
/* Mỗi khu bày vài món khác nhau, đặt lệch, không khu nào giống khu nào */
function keHoachRac(d){
  const r=seeded(101+d.i*37),dau=r()<.5?-1:1,L=[];
  L.push({k:'thung',lx:dau*(3.5+r()*.8),lz:2.45,n:1+Math.floor(r()*3)});
  L.push({k:'tui',lx:dau*(2.5+r()*.5),lz:2.3});
  if(r()<.75)L.push({k:'ghe',lx:-dau*(3.9+r()*.6),lz:2.4,mau:r()<.5?'#E8574A':'#4A7BD9'});
  if(d.i%3===1)L.push({k:'quat',lx:-dau*(2.6+r()*.4),lz:2.35});
  if(d.i%3===0)L.push({k:'gio',lx:-dau*(2.6+r()*.3),lz:2.35,ry:(r()-.5)*.6});
  if(d.i%3===2)L.push({k:'xe',lx:-dau*(2.5+r()*.3),lz:2.25,ry:(r()-.5)*.4});
  L.push({k:'bien',lx:(r()-.5)*2.2,lz:2.06,ry:(r()-.5)*.25});
  return L;
}
/* Biển bìa các-tông viết bút dạ, nội dung lấy từ dữ liệu của khu */
function bienBia(g,i){
  const ps=g.ps,gia=Math.min(...ps.map(p=>p.price||999)),tu=Math.min(...ps.map(p=>p.tu)),den=Math.max(...ps.map(p=>p.den));
  const it=ps.some(p=>p.tinhTrang==='it'||p.tinhTrang==='le');
  const dong=[[`Chỉ từ ${gia}k`,`Size ${tu}–${den}kg`],[`Đi đơn từ ${SHOP.donToiThieu} bộ`,`Chỉ từ ${gia}k`],[it?'Sắp hết size':'Hàng mới về',`Size ${tu}–${den}kg`]][i%3];
  const cv=document.createElement('canvas');cv.width=320;cv.height=240;const c=cv.getContext('2d'),r=seeded(7+i);
  c.fillStyle='#CFA36C';c.beginPath();c.moveTo(6,10);c.lineTo(312,4);c.lineTo(316,232);c.lineTo(4,236);c.closePath();c.fill();
  for(let k=0;k<40;k++){c.fillStyle=`rgba(120,80,40,${r()*.08})`;c.fillRect(0,r()*240,320,1+r()*3);}
  c.strokeStyle='rgba(110,70,35,.35)';c.lineWidth=3;c.stroke();
  c.textAlign='center';c.textBaseline='middle';
  dong.forEach((t,k)=>{c.save();c.translate(160,k?160:82);c.rotate((r()-.5)*.08);c.fillStyle=k?'#2A1F1A':'#C0322B';c.font=`800 ${k?46:58}px "Baloo 2","Be Vietnam Pro",sans-serif`;c.fillText(t,0,0,290);c.restore();});
  c.strokeStyle='#C0322B';c.lineWidth=4;c.beginPath();c.moveTo(60,118);c.quadraticCurveTo(160,112,262,120);c.stroke();
  return texOf(cv);
}
function datRac(s,d){
  const{g,i}=d,L=s.lit;s.lit=s.hop;
  for(const o of keHoachRac(d)){
    const w=veTheGioi(d,o.lx,o.lz),ry=d.ry;s.push(mat(w.x,0,w.z,ry+(o.ry||0)));
    if(o.k==='thung'){let y=0;for(let q=0;q<o.n;q++){const sz=.62-q*.08,h=sz*.74;carton(s,sz,h,sz*.8,q%2?.08:-.05,y,0,(q%2?.22:-.12)+q*.1,q+i);y+=h;}
      if(i%2===0)loa(s,0,y+.11,0,.5,-.12,.42);s.round(w.x,w.z,.5);}
    if(o.k==='xe'){xeDay(s,0,0,0,i);s.round(w.x,w.z,.62);}
    if(o.k==='gio'){gioHang(s,0,0,0,0,true,i);hopQua(s,.24,.42,0,.12,.4,i);s.round(w.x,w.z,.45);}
    if(o.k==='tui'){s.lit.add(new T.SphereGeometry(.26,10,8),'#F6D3E4',s.at(0,.24,0,0,0,0,1,1.05,.8),true);s.lit.add(new T.TorusGeometry(.09,.02,5,10,PI),'#F6D3E4',s.at(0,.5,0));s.lit.add(new T.SphereGeometry(.2,10,8),'#FFFFFF',s.at(.3,.18,.08,0,0,0,1,1,.8),true);}
    if(o.k==='ghe'){s.cyl(.2,.25,.42,0,.21,0,o.mau,4);s.cyl(.24,.24,.04,0,.44,0,o.mau,16);s.round(w.x,w.z,.32);}
    if(o.k==='quat'){s.cyl(.22,.24,.05,0,.025,0,'#FFFFFF',16);s.cyl(.025,.025,1.05,0,.55,0,'#FFFFFF',6);s.lit.add(new T.CylinderGeometry(.28,.28,.08,20),'#DCE7F5',s.at(0,1.15,.04,0,PI/2.2),true);s.lit.add(new T.TorusGeometry(.29,.02,5,20),'#FFFFFF',s.at(0,1.15,.09,0,PI/2.2+PI/2));s.round(w.x,w.z,.3);}
    if(o.k==='bien'){s.push(mat(0,.47,0,0,-.18));s.plane(bienBia(g,i),.72,.54,0,0,0,0,{transparent:true});s.pop();s.lit.add(new T.BoxGeometry(.04,.5,.04),'#9C7446',s.at(.18,.25,-.1,0,.25));}
    s.pop();
  }
  s.lit=L;
}
/* Nhãn nổi trên sạp */
function nhanTex(o,w,h,pad){const q=360,cv=document.createElement('canvas');cv.width=Math.round((w+2*pad)*q);cv.height=Math.round((h+2*pad)*q);const c=cv.getContext('2d');c.fillStyle=NHAN_MAU[o.k][1];c.fillRect(0,0,cv.width,cv.height);c.translate(cv.width/2,cv.height/2);veNhan(c,o,w*q,h*q,false);const t=texOf(cv);t.anisotropy=8;return t;}
/* Nhãn nổi 3D: khối bo tròn có độ dày, mặt trước in chữ, mép bóng như nhựa; lơ lửng nhẹ */
function nhan3D(s,o,w,h,x,y,z,ry=0,rz=0,dung=false){
  const r=h*.32,sh=new T.Shape();sh.moveTo(-w/2+r,-h/2);sh.lineTo(w/2-r,-h/2);sh.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);sh.lineTo(w/2,h/2-r);sh.quadraticCurveTo(w/2,h/2,w/2-r,h/2);sh.lineTo(-w/2+r,h/2);sh.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);sh.lineTo(-w/2,-h/2+r);sh.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const bv=h*.06,geo=new T.ExtrudeGeometry(sh,{depth:h*.12,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:3,curveSegments:10}),t=nhanTex(o,w,h,bv);
  t.repeat.set(1/(w+2*bv),1/(h+2*bv));t.offset.set(.5,.5);
  const mc='nh_'+o.k;if(!MC_BANG[mc]){const[a,b,d]=NHAN_MAU[o.k];MC_BANG[mc]=['#FFFFFF',a,b,d];}
  const m=new T.Mesh(geo,[new T.MeshBasicMaterial({map:t}),new T.MeshMatcapMaterial({matcap:matcap(mc)})]);
  const v=s.world(x,y,z);m.position.copy(v);m.rotation.set(0,ry,rz,'YXZ');m.userData.y=v.y;m.userData.ph=x*1.7+z;
  s.root.add(m);if(!dung)(s.bob=s.bob||[]).push(m);return m;
}
/* Nhãn cho từng sạp: chọn theo hàng trong sạp, đổi lần lượt để các sạp không giống nhau */
function nhanKhu(g,i){
  const ps=g.ps,gia=Math.min(...ps.map(p=>p.price||999)),L=[];
  if(ps.some(p=>p.tinhTrang==='it'||p.tinhTrang==='le'))L.push({k:'het',t:'SẮP HẾT',s:'NHANH TAY'});
  const cb=ps.find(p=>p.combo);if(cb)L.push({k:'combo',t:'COMBO',s:`${cb.price}K/${cb.combo} ${String(cb.comboDv).toUpperCase()}`});
  if(gia<999)L.push({k:'gia',t:`CHỈ ${gia}K`,s:'GIÁ TẠI CHỢ'});
  L.push({k:'hot',t:'HOT SALE',s:'MẪU ĐANG HOT'});
  return L[i%L.length];
}
/* Hộp quà bo cạnh, ruy băng chéo, nơ hai vòng; y là đáy */
function hopQua(s,w,x,y,z,ry=0,mau=0){
  const[A,R]=(NOEL?[['#E5322D','#FFD45C'],['#2F9E5B','#E5322D'],['#FFFFFF','#2F9E5B']]:[['#8C5CF5','#FF9A4A'],['#FF7EB6','#8C5CF5'],['#F27A2E','#FFD36B']])[mau%3],h=w*.8,rb=w*.17;
  s.push(mat(x,y,z,ry));
  s.lit.add(roundBox(w,h*.82,w,w*.07),A,s.at(0,h*.41,0),true);
  s.lit.add(roundBox(w*1.08,h*.26,w*1.08,w*.07),A,s.at(0,h*.87,0),true);
  s.lit.add(roundBox(rb,h*1.02,w*1.1,rb*.25),R,s.at(0,h*.5,0),true);
  s.lit.add(roundBox(w*1.1,h*1.02,rb,rb*.25),R,s.at(0,h*.5,0),true);
  for(const q of[0,PI/2])for(const k of[-1,1])s.lit.add(new T.TorusGeometry(w*.14,w*.045,10,24),R,s.at(k*w*.15*Math.cos(q),h*1.1,-k*w*.15*Math.sin(q),q,0,k*.6,1,.75,1.5),true);
  for(const k of[-1,1])s.lit.add(roundBox(rb*.8,h*.32,w*.02+.006,.004),R,s.at(k*w*.1,h*.92,w*.55,0,-.15,k*.35),true);
  s.ball(w*.08,0,h*1.05,0,R);
  s.pop();
}
/* Giỏ mua hàng tím, khe thoáng, quai cam; day=true có quần áo gấp bên trong */
function gioHang(s,x,y,z,ry=0,day=true,mau=0,khe=true){
  const B='#8C5CF5',K='#5B2FD0',w=.62,d=.42,h=.3,t=.04;
  s.push(mat(x,y,z,ry));
  s.lit.add(roundBox(w-.04,t,d-.04,.015),B,s.at(0,t/2,0),true);
  for(const q of[-1,1]){
    s.lit.add(roundBox(w,h,t,.016),B,s.at(0,h/2,q*(d/2-t/2)),true);
    s.lit.add(roundBox(t,h,d,.016),B,s.at(q*(w/2-t/2),h/2,0),true);
    s.lit.add(roundBox(w+.03,.045,.06,.02),B,s.at(0,h,q*(d/2-t/2)),true);
    s.lit.add(roundBox(.06,.045,d+.03,.02),B,s.at(q*(w/2-t/2),h,0),true);
    if(khe)for(let k=0;k<3;k++)s.lit.add(roundBox(.1,h*.46,.026,.012),K,s.at(-.15+k*.15,h*.52,q*(d/2-.006)),true);
    if(khe)for(let k=0;k<2;k++)s.lit.add(roundBox(.026,h*.46,.1,.012),K,s.at(q*(w/2-.006),h*.52,-.075+k*.15),true);
    if(khe)s.lit.add(new T.TorusGeometry(.16,.024,8,18,PI),'#F27A2E',s.at(0,h+.02,q*(d/2-.02),0,q*.7),true);
  }
  if(day){const ao=[['#FFB3CF','#9CC8FF','#FFE58A'],['#B9F0D8','#FFB3CF','#C9B8FF']][mau%2];
    ao.forEach((c,k)=>s.lit.add(roundBox(.44-k*.04,.07,.28-k*.02,.03),c,s.at(-.02+k*.02,h*.78+k*.075,0,k*.12-.1),true));}
  s.pop();
}
/* ---------- Góc Noel: chỉ dựng từ tháng 11 tới hết 6/1 ---------- */
const NOEL=(()=>{const d=new Date(),m=d.getMonth();return m>=10||(m===0&&d.getDate()<=6);})();
function gocNoel(s,x,z,ry){
  const W0='#FFFFFF',DEN='#23262F',NAU='#7A4A2E',CAM='#F28A2E',DO='#E5322D',top=.16;
  const sp=(r,x,y,z,c,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0)=>s.lit.add(new T.SphereGeometry(r,24,16),c,s.at(x,y,z,ry,rx,rz,sx,sy,sz),true);
  const cy=(r1,r2,h,x,y,z,c,rx=0,rz=0)=>s.lit.add(new T.CylinderGeometry(r1,r2,h,20),c,s.at(x,y,z,0,rx,rz),true);
  const non=(r,h,x,y,z,c,rx=0,rz=0)=>s.lit.add(new T.ConeGeometry(r,h,20),c,s.at(x,y,z,0,rx,rz),true);
  const mat2=(x,y,z,k=1)=>{for(const q of[-1,1])s.lit.add(new T.TorusGeometry(.038*k,.009*k,6,12,PI),DEN,s.at(x+q*.09*k,y,z),true);};
  const khan=(y,R,c,tx,tz)=>{s.lit.add(new T.TorusGeometry(R,.065,10,28),c,s.at(0,y,0,0,PI/2),true);s.lit.add(roundBox(.12,.34,.06,.025),c,s.at(tx,y-.19,tz,0,-.25,.08),true);};
  s.push(mat(x,0,z,ry));
  /* bục tuyết, gò tuyết, hai cây thông phủ tuyết */
  cy(1.3,1.38,top,0,top/2,0,W0);
  for(const[a,b,r]of[[-1,.6,.22],[1.05,.45,.18],[-.5,-.95,.2],[.6,-1,.16],[0,1.08,.15]])sp(r,a,top,b,W0,1.4,.45,1.2);
  for(const[a,b,k]of[[-.95,-.7,1],[.9,-.78,.85]]){cy(.04,.05,.2*k,a,top+.1*k,b,NAU);
    [[.34,.42,.4],[.27,.36,.66],[.19,.3,.88]].forEach(([r,h,y])=>{non(r*k,h*k,a,top+y*k,b,'#2F9E5B');non(r*k*.72,h*k*.4,a,top+(y+h*.32)*k,b,W0);});sp(.05*k,a,top+1.06*k,b,'#FFD45C');}
  hopQua(s,.2,-.62,top,.78,.4,1);hopQua(s,.16,.7,top,.8,-.3,0);
  keoGay(s,-.08,top,1.0,0,-.22,.7,.026);keoGay(s,.08,top,1.03,PI,-.22,.7,.026);noDo(s,0,top+.3,1.07,0,1);
  /* người tuyết */
  s.push(mat(-.9,0,.1,.25));
  sp(.36,0,top+.34,0,W0,1,.95,1);sp(.25,0,top+.82,0,W0);
  for(const q of[-1,1])s.lit.add(new T.SphereGeometry(.026,10,8),DEN,s.at(q*.085,top+.88,.22),true);
  non(.04,.17,0,top+.82,.3,CAM,PI/2);
  for(const[y,zz]of[[.62,.34],[.48,.36],[.34,.33]])s.lit.add(new T.SphereGeometry(.03,10,8),DEN,s.at(0,top+y,zz),true);
  s.lit.add(new T.SphereGeometry(.255,22,12,0,2*PI,0,PI/2),'#3E9C6A',s.at(0,top+.86,0,0,0,0,1,1.15,1),true);
  s.lit.add(new T.TorusGeometry(.24,.055,10,28),'#358A5C',s.at(0,top+.9,0,0,PI/2),true);sp(.075,0,top+1.18,0,'#3E9C6A');
  khan(top+.64,.21,'#3E9C6A',.13,.3);
  for(const q of[-1,1]){s.lit.add(new T.CylinderGeometry(.016,.024,.44,8),NAU,s.at(q*.52,top+.6,0,0,0,-q*1.1),true);s.lit.add(new T.CylinderGeometry(.012,.016,.14,8),NAU,s.at(q*.66,top+.74,0,0,0,-q*.3),true);}
  s.pop();
  /* chim cánh cụt đội mũ Noel */
  s.push(mat(-.3,0,.2,.08));
  sp(.34,0,top+.42,0,DEN,1,1.3,.95);sp(.28,0,top+.39,.1,W0,1,1.22,.85);
  mat2(0,top+.6,.3);non(.05,.12,0,top+.5,.36,CAM,PI/2);
  for(const q of[-1,1]){sp(.1,q*.34,top+.4,0,DEN,.35,1.4,.8,0,0,q*.25);sp(.075,q*.1,top+.04,.12,DO,1,.6,1.4);}
  non(.22,.4,.02,top+.92,0,DO,0,-.25);s.lit.add(new T.TorusGeometry(.21,.06,10,28),W0,s.at(0,top+.76,0,0,PI/2),true);sp(.07,.07,top+1.12,0,W0);
  s.pop();
  /* tuần lộc mũi đỏ, đèn nháy trên gạc */
  s.push(mat(.3,0,.2,-.08));
  sp(.32,0,top+.36,0,'#9A5B34',1,1.15,.95);sp(.24,0,top+.82,0,'#A8673C',1,1,.95);
  sp(.12,0,top+.74,.17,'#EBCDA4',1.2,.8,.8);s.lit.add(new T.SphereGeometry(.065,16,12),DO,s.at(0,top+.78,.28),true);
  mat2(0,top+.88,.21);
  for(const q of[-1,1]){sp(.07,q*.22,top+.96,0,'#A8673C',1.6,.6,.5,0,0,q*.4);
    s.lit.add(new T.CylinderGeometry(.018,.026,.36,8),NAU,s.at(q*.13,top+1.16,0,0,0,-q*.35),true);
    s.lit.add(new T.CylinderGeometry(.013,.018,.17,8),NAU,s.at(q*.25,top+1.2,0,0,0,-q*1.15),true);
    s.lit.add(new T.CylinderGeometry(.013,.018,.15,8),NAU,s.at(q*.15,top+1.32,0,0,0,q*.4),true);}
  [['#FF5A5A',-.3,1.2],['#FFD45C',-.2,1.3],['#6FE3B4',-.07,1.35],['#7EC4FF',.07,1.35],['#FF8CC0',.2,1.3],['#FFD45C',.3,1.2]].forEach(([c,a,y])=>{s.gball(.03,a,top+y,0,c);});
  khan(top+.6,.19,DO,.12,.28);
  s.pop();
  /* lính kẹp hạt dẻ trên đế tròn */
  s.push(mat(.92,0,.08,-.25));
  const V='#E8C35A',XD='#2E4FB8';
  cy(.2,.22,.08,0,top+.04,0,XD);cy(.205,.205,.02,0,top+.085,0,V);
  for(const q of[-1,1]){cy(.05,.05,.3,q*.07,top+.36,0,XD);cy(.06,.065,.15,q*.07,top+.17,0,DEN);}
  cy(.14,.17,.38,0,top+.69,0,DO);cy(.146,.146,.04,0,top+.56,0,XD);
  for(const y of[.66,.74,.82])for(const q of[-1,1])s.lit.add(new T.SphereGeometry(.018,10,8),V,s.at(q*.05,top+y,.135),true);
  for(const q of[-1,1]){sp(.05,q*.15,top+.86,0,V,1,.6,1);cy(.04,.04,.3,q*.19,top+.72,0,DO);sp(.045,q*.19,top+.55,0,'#F2C6A0');}
  cy(.11,.11,.2,0,top+.98,0,'#F2C6A0');s.lit.add(new T.SphereGeometry(.028,12,10),'#E07A6A',s.at(0,top+.98,.115),true);
  mat2(0,top+1.03,.105,.6);for(const q of[-1,1])sp(.055,q*.045,top+.94,.1,'#2B2B33',1.3,.45,.5,0,0,-q*.25);
  s.lit.add(roundBox(.16,.15,.06,.03),W0,s.at(0,top+.86,.09),true);
  cy(.13,.13,.02,0,top+1.09,0,XD);cy(.118,.118,.05,0,top+1.12,0,DO);cy(.112,.112,.24,0,top+1.26,0,XD);sp(.035,0,top+1.4,0,V);
  s.pop();
  s.pop();
  nhan3D(s,{k:'het',t:'NOEL',s:'GIÁNG SINH AN LÀNH'},1.3,.58,x,2.05,z,ry,0);
  s.round(x,z,1.42);
}
/* Cây thông Noel: bốn tầng lá, quả châu, đèn nháy xoắn quanh cây, sao vàng trên đỉnh, quà dưới gốc */
function cayThong(s,x,z,h=3){
  s.push(mat(x,0,z));
  s.cyl(.14,.17,.4,0,.2,0,'#7A4A2E',16);
  const T4=[[1,.0],[.8,.2],[.6,.4],[.4,.6]],mc=['ndo','nvang','bac','ndo','nxanh','nvang'];let k=0;
  T4.forEach(([f,o],i)=>{const r=h*.36*f,th=h*.34,yc=.35+o*h+th/2;
    s.lit.add(new T.ConeGeometry(r,th,28),i%2?'#2A8F52':'#2F9E5B',s.at(0,yc,0),true);
    s.lit.add(new T.TorusGeometry(r*.92,r*.06,8,32),'#FFFFFF',s.at(0,yc-th*.47,0,0,PI/2),true);
    const n=Math.round(5+r*4);for(let j=0;j<n;j++){const a=j/n*2*PI+i*.7,rr=r*.84,yy=yc-th*.36;
      quaChau(s,Math.sin(a)*rr,yy,Math.cos(a)*rr,.075*h/3,CHAU[k++%CHAU.length]);}
  });
  const DEN=['#FF5A5A','#FFD45C','#6FE3B4','#7EC4FF','#FF8CC0'];
  for(let j=0;j<46;j++){const t=j/46,y=.45+t*h*.95,r=h*.36*(1-t*.88)*.98,a=t*PI*7;s.gball(.03,Math.sin(a)*r,y,Math.cos(a)*r,DEN[j%5]);}
  const sao5=r=>{const S=new T.Shape();for(let i=0;i<10;i++){const a=i/10*2*PI,q=i%2?r*.45:r;S[i?'lineTo':'moveTo'](Math.sin(a)*q,Math.cos(a)*q);}S.closePath();return S;};
  s.mc('nvang',new T.ExtrudeGeometry(sao5(.3*h/3),{depth:.06,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2,curveSegments:6}).center(),s.at(0,.35+h*1.02+.12,0));
  [[.62,.5,.36,0],[-.6,.55,.3,1],[.05,.8,.42,2],[-.35,-.6,.28,0],[.5,-.5,.26,1]].forEach(([a,b,w,m])=>hopQua(s,w*h/3,a*h/3,0,b*h/3,a+b,m));
  s.pop();s.round(x,z,h*.38);
}
/* Vòng nguyệt quế: lá xanh, quả đỏ, chuông vàng, nơ đỏ */
function vongLa(s,x,y,z,ry=0,R=.34){
  s.push(mat(x,y,z,ry));
  s.lit.add(new T.TorusGeometry(R,R*.26,10,36),'#24784A',s.at(0,0,0),true);
  for(let j=0;j<30;j++){const a=j/30*2*PI,o=j%2?R*1.12:R*.88,t=a+(j%2?.5:-.5);s.lit.add(new T.SphereGeometry(R*.15,10,8),['#2F9E5B','#3FB06A','#2A8F52'][j%3],s.at(Math.cos(a)*o,Math.sin(a)*o,R*.14+(j%3)*R*.03,0,0,t,1.7,.62,.5),true);}
  for(let j=0;j<5;j++){const a=j/5*2*PI+PI/2+.6;quaChau(s,Math.cos(a)*R,Math.sin(a)*R,R*.32,R*.1,CHAU[j*2%CHAU.length]);}
  for(let j=0;j<4;j++){const a=j/4*2*PI+.2;s.lit.add(new T.SphereGeometry(R*.07,10,8),'#E02B2B',s.at(Math.cos(a)*R*1.02,Math.sin(a)*R*1.02,R*.33),true);}
  noDo(s,0,-R*.95,R*.32,0,R*2.2);chuong(s,-R*.2,-R*1.55,R*.25,0,.15,R*.45);chuong(s,R*.2,-R*1.52,R*.25,0,-.15,R*.45);
  s.pop();
}
/* Tất Noel treo: thân đỏ, mũi chân, cổ trắng */
function tatNoel(s,x,y,z,ry=0,c='#E5322D',kieu=0){
  s.push(mat(x,y,z,ry));
  if(kieu===1){s.uv('tat|1|2',new T.CylinderGeometry(.085,.085,.3,20),s.at(0,-.17,0));s.uv('tat|2|1',new T.SphereGeometry(.1,18,12),s.at(.06,-.33,0,0,0,0,1.5,.85,1));}
  else{s.cyl(.085,.085,.3,0,-.17,0,c,20);s.lit.add(new T.SphereGeometry(.1,18,12),c,s.at(.06,-.33,0,0,0,0,1.5,.85,1),true);}
  s.lit.add(new T.TorusGeometry(.088,.04,10,24),'#FFFFFF',s.at(0,-.02,0,0,PI/2),true);for(let i=0;i<10;i++){const a=i/10*2*PI;s.lit.add(new T.SphereGeometry(.034,10,8),'#FFFFFF',s.at(Math.cos(a)*.09,-.0+(i%2)*.02,Math.sin(a)*.09),true);}
  if(kieu===1)keoGay(s,.02,-.12,-.02,.3,-.2,.3,.012);else hopQua(s,.09,-.01,-.02,0,.3,kieu);
  s.mc('nvang',new T.TorusGeometry(.025,.008,6,12),s.at(-.07,.05,0));
  s.pop();
}
/* Tuyết rơi nhẹ khắp chợ */
function tuyetRoi(s,x0,x1,z0,z1,H,n){
  const pos=new Float32Array(n*3),r=seeded(77);for(let i=0;i<n;i++){pos[i*3]=x0+r()*(x1-x0);pos[i*3+1]=r()*H;pos[i*3+2]=z0+r()*(z1-z0);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
  const tex=new T.CanvasTexture(radial(64,[[0,'rgba(255,255,255,1)'],[.45,'rgba(255,255,255,.85)'],[1,'rgba(255,255,255,0)']]));
  const m=new T.Points(geo,new T.PointsMaterial({map:tex,size:.11,transparent:true,depthWrite:false,opacity:.9,color:'#FFFFFF'}));m.userData.tuyet={H,n};s.root.add(m);s.tuyet=m;
}
function buocTuyet(m,dt,time){
  const a=m.geometry.attributes.position,{H,n}=m.userData.tuyet;
  for(let i=0;i<n;i++){let y=a.array[i*3+1]-dt*(.35+(i%7)*.05);if(y<0)y+=H;a.array[i*3+1]=y;a.array[i*3]+=Math.sin(time*.8+i)*dt*.12;}
  a.needsUpdate=true;
}
/* ---------- Đồ Noel chi tiết: hoạ tiết sọc, kẹo gậy, chuông, lá nhựa ruồi, quả châu ---------- */
const TEXN={};
function texNoel(k){
  if(TEXN[k])return TEXN[k];const[ten,rx,ry]=k.split('|'),n=128,cv=document.createElement('canvas');cv.width=cv.height=n;const c=cv.getContext('2d');
  const xien=(nen,soc,w)=>{c.fillStyle=nen;c.fillRect(0,0,n,n);c.strokeStyle=soc;c.lineWidth=w;for(let k=-4;k<=4;k++){c.beginPath();c.moveTo(k*64,0);c.lineTo(k*64+n,n);c.stroke();}};
  if(ten==='xoan')xien('#FFFFFF','#E5322D',22);
  else if(ten==='xoanx')xien('#FFFFFF','#2F9E5B',22);
  else if(ten==='xoanv'){xien('#E5322D','#F2C14E',20);}
  else if(ten==='bang'){c.fillStyle='#E5322D';c.fillRect(0,0,n,n);for(const[y,h,col]of[[38,12,'#F2C14E'],[54,6,'#FFFFFF'],[68,6,'#FFFFFF'],[78,12,'#F2C14E']]){c.fillStyle=col;c.fillRect(0,y,n,h);}}
  else if(ten==='bangx'){c.fillStyle='#2F9E5B';c.fillRect(0,0,n,n);for(const y of[30,58,86]){c.fillStyle='#FFFFFF';c.fillRect(0,y,n,12);}}
  else if(ten==='tat'){for(let y=0;y<n;y+=32){c.fillStyle='#E5322D';c.fillRect(0,y,n,16);c.fillStyle='#FFFFFF';c.fillRect(0,y+16,n,16);}}
  else if(ten==='coc'){c.fillStyle='#D9302B';c.fillRect(0,0,n,n);c.fillStyle='#FFFFFF';c.fillRect(0,44,n,4);c.fillRect(0,80,n,4);c.strokeStyle='#FFFFFF';c.lineWidth=3;c.lineCap='round';
    for(let x=16;x<n;x+=32){c.save();c.translate(x,64);for(let a=0;a<3;a++){c.rotate(PI/3);c.beginPath();c.moveTo(-9,0);c.lineTo(9,0);c.stroke();}c.restore();}}
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(+rx||1,+ry||1);t.anisotropy=4;return TEXN[k]=t;
}
/* Quả châu: trơn bóng (đỏ, vàng, xanh, bạc) hoặc sọc; có nắp vàng và móc */
const CHAU=['ndo','xoan|2|1','nvang','bang|1|1','nxanh','xoanx|2|1','bac','xoanv|2|1','bangx|1|1'];
function quaChau(s,x,y,z,r,kieu){
  const g=new T.SphereGeometry(r,22,16);if(kieu.includes('|'))s.uv(kieu,g,s.at(x,y,z));else s.mc(kieu,g,s.at(x,y,z));
  s.mc('nvang',new T.CylinderGeometry(r*.26,r*.3,r*.26,12),s.at(x,y+r*.98,z));s.mc('nvang',new T.TorusGeometry(r*.11,r*.03,6,12),s.at(x,y+r*1.2,z));
}
/* Kẹo gậy sọc đỏ trắng; y là chân kẹo */
const KEO_G={};
function keoGay(s,x,y,z,ry=0,rz=0,h=.8,tk=.035){
  const k=h+'|'+tk;let g=KEO_G[k];
  if(!g){const p=[],a=h*.78,r=h*.15;for(let i=0;i<=8;i++)p.push(new V3(0,i/8*a,0));for(let i=1;i<=12;i++){const t=PI-i/12*PI;p.push(new V3(r+r*Math.cos(t),a+r*Math.sin(t),0));}p.push(new V3(2*r+.001,a-r*.35,0));
    g=KEO_G[k]=new T.TubeGeometry(new T.CatmullRomCurve3(p),56,tk,12);}
  s.uv('xoan|7|1',g,s.at(x,y,z,ry,0,rz));
  for(const q of[0,1]){const v=q?new V3(2*h*.15+.001,h*.78-h*.15*.35,0):new V3(0,0,0);s.lit.add(new T.SphereGeometry(tk,12,8),'#FFFFFF',s.at(x,y,z,ry,0,rz).multiply(mat(v.x,v.y,v.z)),true);}
}
/* Nơ đỏ nhỏ: 2 vòng, nút giữa, 2 vạt */
function noDo(s,x,y,z,ry=0,sc=1,c='#E5322D'){
  s.push(mat(x,y,z,ry,0,0,sc,sc,sc));
  for(const k of[-1,1]){s.lit.add(new T.TorusGeometry(.07,.024,8,18),c,s.at(k*.075,0,0,0,0,k*.5,1,.72,1.3),true);s.lit.add(roundBox(.05,.13,.02,.008),c,s.at(k*.04,-.08,.01,0,0,k*.4),true);}
  s.lit.add(new T.SphereGeometry(.032,12,10),c,s.at(0,0,.015),true);
  s.pop();
}
/* Chuông vàng (cao = sc) */
const CHUONG_G=new T.LatheGeometry([[.001,1],[.16,.98],[.27,.88],[.32,.7],[.35,.45],[.4,.2],[.52,.07],[.56,0],[.5,-.02],[.001,.02]].map(([a,b])=>new T.Vector2(a,b)),28);
function chuong(s,x,y,z,ry=0,rz=0,sc=.2){
  const m=s.at(x,y,z,ry,0,rz,sc,sc,sc);s.mc('nvang',CHUONG_G,m);
  s.mc('nvang',new T.SphereGeometry(.12,10,8),m.clone().multiply(mat(0,-.02,0)));s.mc('nvang',new T.TorusGeometry(.09,.025,6,14),m.clone().multiply(mat(0,1.06,0)));
}
/* Cụm lá nhựa ruồi: 3 lá răng cưa, 3 quả đỏ */
let LA_G;
function hoaLa(s,x,y,z,ry=0,sc=1){
  if(!LA_G){const S=new T.Shape(),L=.22;S.moveTo(0,0);const tren=[[.06,.05],[.1,.03],[.15,.06],[.19,.03]],duoi=[[.19,-.03],[.15,-.06],[.1,-.03],[.06,-.05]];
    S.quadraticCurveTo(.02,.05,.06,.05);for(let i=1;i<tren.length;i++)S.quadraticCurveTo((tren[i-1][0]+tren[i][0])/2,tren[i][1]-.03,tren[i][0],tren[i][1]);S.quadraticCurveTo(.21,.02,L,0);
    S.quadraticCurveTo(.21,-.02,.19,-.03);for(let i=1;i<duoi.length;i++)S.quadraticCurveTo((duoi[i-1][0]+duoi[i][0])/2,duoi[i][1]+.03,duoi[i][0],duoi[i][1]);S.quadraticCurveTo(.02,-.05,0,0);
    LA_G=new T.ExtrudeGeometry(S,{depth:.012,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:6});}
  s.push(mat(x,y,z,ry,0,0,sc,sc,sc));
  [[.35,'#2F8F4E'],[PI-.35,'#2A7F45'],[PI/2+.2,'#36A05A']].forEach(([a,c])=>s.lit.add(LA_G,c,s.at(0,0,-.01,0,0,a),false));
  for(const[a,b]of[[-.035,.01],[.035,.012],[0,.045]])s.lit.add(new T.SphereGeometry(.03,14,10),'#E02B2B',s.at(a,b,.03),true);
  s.pop();
}
/* Đèn quả nhót treo trên dây võng giữa hai điểm (toạ độ đang dùng) */
function dayDen(s,a,b,sag=.08,buoc=.13){
  const DEN=['#FF4D4D','#FFD45C','#4FD18B','#5FB0FF','#FF8CC0'],n=Math.max(2,Math.round(a.distanceTo(b)/buoc)),p=[];
  for(let i=0;i<=16;i++){const t=i/16,v=a.clone().lerp(b,t);v.y-=Math.sin(t*PI)*sag;p.push(v);}
  s.lit.add(new T.TubeGeometry(new T.CatmullRomCurve3(p),24,.006,5),'#1F5E3A',s.at(0,0,0),true);
  for(let i=1;i<n;i++){const t=i/n,v=a.clone().lerp(b,t);v.y-=Math.sin(t*PI)*sag;const c=DEN[i%DEN.length];
    s.lit.add(new T.CylinderGeometry(.013,.015,.03,8),'#1F5E3A',s.at(v.x,v.y-.016,v.z),true);
    s.glow.add(new T.SphereGeometry(.024,10,8),c,s.at(v.x,v.y-.058,v.z,0,0,0,1,1.65,1));}
}
/* Đồ Noel trên quầy: quả cầu tuyết, cốc ca cao, bánh gừng */
function quayNoel(s,x,y,z){
  s.push(mat(x,y,z));
  /* quả cầu tuyết */
  s.cyl(.14,.16,.07,0,.035,0,'#D9302B',24);s.mc('nvang',new T.TorusGeometry(.142,.012,6,28),s.at(0,.07,0,0,PI/2));s.cyl(.12,.12,.02,0,.08,0,'#2F9E5B',24);
  s.lit.add(new T.SphereGeometry(.11,20,10,0,2*PI,0,PI/2),'#FFFFFF',s.at(0,.085,0,0,0,0,1,.35,1),true);
  s.lit.add(new T.ConeGeometry(.045,.12,14),'#2F9E5B',s.at(-.03,.15,-.01),true);s.lit.add(new T.SphereGeometry(.026,10,8),'#FFFFFF',s.at(.045,.12,.02),true);s.lit.add(new T.SphereGeometry(.018,10,8),'#FFFFFF',s.at(.045,.158,.02),true);
  {const v=s.world(0,.21,0),m=new T.Mesh(new T.SphereGeometry(.15,28,20),new T.MeshBasicMaterial({color:'#D3E9FF',transparent:true,opacity:.32,depthWrite:false}));m.position.copy(v);s.root.add(m);
   const hl=new T.Mesh(new T.SphereGeometry(.152,20,14,4.1,.9,.5,.7),new T.MeshBasicMaterial({color:'#FFFFFF',transparent:true,opacity:.75,depthWrite:false}));hl.position.copy(v);s.root.add(hl);}
  /* cốc ca cao có kẹo dẻo và kẹo gậy */
  s.uv('coc|2|1',new T.CylinderGeometry(.075,.066,.13,24),s.at(.36,.065,0));
  s.lit.add(new T.TorusGeometry(.038,.013,8,16),'#D9302B',s.at(.44,.07,0,0,0,0),true);
  s.cyl(.068,.068,.012,.36,.124,0,'#6B3B22',24);
  for(const[a,b,r]of[[.33,.01,.2],[.38,-.02,-.3],[.37,.03,.6]])s.lit.add(roundBox(.034,.03,.034,.01),'#FFFFFF',s.at(a,.14,b,r),true);
  keoGay(s,.4,.1,-.02,.4,-.25,.22,.009);
  /* bánh gừng tựa vào cốc */
  s.push(mat(.2,.0,.06,-.2,-.2));const N='#C98A4B';
  s.lit.add(new T.SphereGeometry(.045,16,12),N,s.at(0,.19,0,0,0,0,1,1,.45),true);s.lit.add(roundBox(.075,.09,.03,.014),N,s.at(0,.12,0),true);
  for(const k of[-1,1]){s.lit.add(roundBox(.07,.032,.028,.013),N,s.at(k*.055,.14,0,0,0,k*.35),true);s.lit.add(roundBox(.034,.075,.028,.013),N,s.at(k*.025,.05,0,0,0,k*.25),true);
    s.lit.add(new T.SphereGeometry(.007,8,6),'#2B1B17',s.at(k*.015,.198,.02),true);}
  for(const[c,yy]of[['#E5322D',.14],['#2F9E5B',.11]])s.lit.add(new T.SphereGeometry(.008,8,6),c,s.at(0,yy,.017),true);
  s.lit.add(new T.TorusGeometry(.014,.003,5,10,PI),'#FFFFFF',s.at(0,.182,.02,0,0,PI),true);
  s.pop();
  s.pop();
}
/* Túi quà ông già Noel */
function tuiQua(s,x,z,ry=0){
  s.push(mat(x,0,z,ry));
  s.lit.add(new T.SphereGeometry(.34,26,20),'#D9302B',s.at(0,.33,0,0,0,.1,1.05,1,.9),true);
  s.cyl(.09,.14,.16,0,.68,0,'#D9302B',18);s.mc('nvang',new T.TorusGeometry(.1,.018,6,18),s.at(0,.66,0,0,PI/2));
  s.lit.add(new T.TorusGeometry(.13,.06,10,24),'#FFFFFF',s.at(0,.77,0,0,PI/2),true);for(let i=0;i<9;i++){const a=i/9*2*PI;s.lit.add(new T.SphereGeometry(.05,10,8),'#FFFFFF',s.at(Math.cos(a)*.13,.79,Math.sin(a)*.13),true);}
  hopQua(s,.16,.03,.78,0,.3,2);
  s.pop();s.round(x,z,.4);
}
/* ---------- Đồ giao hàng kiểu nhựa 3D: thùng carton, xe đẩy, loa ---------- */
/* Ảnh nhãn dán: vận đơn (nửa trái), ký hiệu thùng (phải trên), tem DuuDuu (phải dưới) */
const DAN_VUNG={nhan:[0,0,.5,1],ky:[.5,.5,1,1],tem:[.5,0,1,.5]};let DAN_TEX;
function danTex(){
  if(DAN_TEX)return DAN_TEX;const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d');c.lineCap=c.lineJoin='round';
  /* vận đơn: giấy trắng hơi cong, góc dưới quăn lên, các dòng chữ xám */
  c.save();c.shadowColor='rgba(80,50,20,.35)';c.shadowBlur=14;c.shadowOffsetY=6;c.fillStyle='#FFFFFF';
  c.beginPath();c.moveTo(60,58);c.quadraticCurveTo(256,40,452,58);c.lineTo(452,370);c.lineTo(370,454);c.quadraticCurveTo(220,468,60,452);c.closePath();c.fill();c.restore();
  c.fillStyle='#D9D9DE';c.beginPath();c.moveTo(452,370);c.quadraticCurveTo(400,380,370,454);c.quadraticCurveTo(420,410,452,370);c.fill();
  c.fillStyle='#7A7F8C';for(let k=0;k<7;k++){const y=110+k*44,w=k%3===2?240:330;rr(c,100,y,w,18,9);c.fill();}
  c.fillStyle='#7C3CFF';rr(c,100,72,120,20,10);c.fill();
  /* ký hiệu: tái chế, tránh lửa, hướng lên */
  c.save();c.translate(512,0);c.strokeStyle=c.fillStyle='rgba(92,58,28,.88)';
  c.save();c.translate(90,128);for(let k=0;k<3;k++){c.rotate(2*PI/3);c.lineWidth=17;c.beginPath();c.arc(0,0,58,-.55,1.25);c.stroke();
    const a=1.25,x=Math.cos(a)*58,y=Math.sin(a)*58,tx=-Math.sin(a),ty=Math.cos(a);c.beginPath();c.moveTo(x+tx*30,y+ty*30);c.lineTo(x+ty*24,y-tx*24);c.lineTo(x-ty*24,y+tx*24);c.closePath();c.fill();}c.restore();
  c.save();c.translate(256,132);c.beginPath();c.moveTo(0,-78);c.bezierCurveTo(36,-30,62,0,56,30);c.bezierCurveTo(50,70,-50,70,-56,30);c.bezierCurveTo(-60,4,-34,-12,-24,-40);c.bezierCurveTo(-14,-14,-4,-6,6,-12);c.bezierCurveTo(14,-34,8,-56,0,-78);c.fill();c.restore();
  c.save();c.translate(420,128);for(const x of[-30,30]){c.fillRect(x-9,-36,18,92);c.beginPath();c.moveTo(x-34,-30);c.lineTo(x,-78);c.lineTo(x+34,-30);c.closePath();c.fill();}c.fillRect(-72,70,144,14);c.restore();
  /* tem DuuDuu đóng dấu mực tím */
  c.strokeStyle=c.fillStyle='rgba(124,60,255,.82)';c.lineWidth=12;rr(c,26,290,460,168,40);c.stroke();
  c.textAlign='center';c.textBaseline='middle';c.font='800 112px "Baloo 2","Be Vietnam Pro",sans-serif';c.fillText('DuuDuu',256,378,410);
  c.restore();
  DAN_TEX=texOf(cv);DAN_TEX.anisotropy=8;return DAN_TEX;
}
/* Thùng carton bo cạnh, băng keo, vận đơn, ký hiệu; y là đáy thùng */
function carton(s,w,h,d,x,y,z,ry=0,tone=0){
  const k=['#F2AE63','#EBA257','#F6B972'][tone%3],keo='#8C5CF5',tw=w*.22;
  s.push(mat(x,y,z,ry));
  s.lit.add(roundBox(w,h,d,Math.min(w,h,d)*.07),k,s.at(0,h/2,0),true);
  s.lit.add(roundBox(tw,.014,d+.008,.005),keo,s.at(0,h,0),true);
  for(const q of[-1,1])s.lit.add(roundBox(tw,h*.28,.014,.005),keo,s.at(0,h*.86,q*(d/2+.002)),true);
  s.lit.add(roundBox(w+.006,.012,.04,.004),'#D98C45',s.at(0,h*.06,d/2-.012),true);
  const f=d/2+.011;
  s.dan('nhan',w*.38,w*.38,-w*.2,h*.5,f,0,0,.18-tone%2*.3);
  s.dan('ky',w*.38,w*.19,w*.24,h*.16,f);
  s.dan('tem',d*.56,d*.2,w/2+.004,h*.55,0,PI/2);
  s.pop();
}
/* Xe đẩy hàng sàn tím, tay cầm inox, bánh cam, chở thùng */
function xeDay(s,x,z,ry=0,tone=0){
  const B='#8C5CF5',B2='#6A3BD9';s.push(mat(x,0,z,ry));
  s.lit.add(roundBox(1.06,.075,.66,.032),B,s.at(0,.22,0),true);
  s.lit.add(roundBox(.98,.02,.58,.008),B2,s.at(0,.175,0),true);
  for(const[a,b]of[[.4,.23],[.4,-.23],[-.4,.23],[-.4,-.23]]){
    s.lit.add(roundBox(.075,.07,.06,.018),B,s.at(a,.15,b),true);
    s.cyl(.068,.068,.048,a,.072,b,'#F27A2E',18,0,PI/2);
    s.mc('bac',new T.CylinderGeometry(.032,.032,.056,12),s.at(a,.072,b,0,0,PI/2));
  }
  for(const b of[-.26,.26]){ong(s,'bac',.022,[-.5,.24,b],[-.5,1.08,b]);s.mc('bac',new T.SphereGeometry(.024,10,8),s.at(-.5,1.08,b));}
  ong(s,'bac',.022,[-.5,1.08,-.26],[-.5,1.08,.26]);
  s.cyl(.036,.036,.34,-.5,1.08,0,'#F27A2E',16,PI/2,0);
  carton(s,.64,.46,.52,.06,.258,0,.06,tone);carton(s,.5,.38,.42,.1,.718,0,-.18,tone+1);
  s.pop();
}
/* Loa cầm tay: thân tím, viền inox, màng cam, tay cầm cam, ba vạch âm thanh; hướng loa là +z */
function loa(s,x,y,z,ry=0,rx=0,sc=1){
  const B='#8C5CF5',O='#F27A2E',Y='#FF9A4A';s.push(mat(x,y,z,ry,rx,0,sc,sc,sc));
  s.cyl(.3,.12,.5,0,0,0,B,28,PI/2,0);
  s.cyl(.275,.275,.02,0,0,.235,'#5A2FC2',28,PI/2,0);
  s.ball(.105,0,0,.22,O);
  s.mc('bac',new T.TorusGeometry(.29,.036,10,36),s.at(0,0,.25));
  s.mc('bac',new T.CylinderGeometry(.13,.15,.1,20),s.at(0,0,-.29,0,PI/2));
  s.cyl(.1,.13,.08,0,0,-.37,B,20,PI/2,0);
  s.box(.1,.3,.13,0,-.24,-.13,Y,0,-.28);
  s.box(.05,.09,.06,0,-.15,-.02,B,0,-.28);
  for(const a of[-.55,0,.55])s.box(.045,.045,.22,0,Math.sin(a)*.5,.25+Math.cos(a)*.5,Y,0,-a);
  s.pop();
}
/* Đèn rọi tranh nhỏ gắn trên mỗi ô hàng */
function denRoi(s,xs,top){
  for(const x of xs){ong(s,'den',.012,[x,top+.24,.12],[x,top+.24,.46]);s.mc('den',new T.CylinderGeometry(.055,.075,.2,10),s.at(x,top+.2,.5,0,.7));s.glow.add(new T.CylinderGeometry(.06,.06,.01,10),'#FFF4D6',s.at(x,top+.135,.56,0,.7));}
}
/* Vũng sáng và bóng đổ vẽ sẵn xuống sàn */
function sanSauBong(c,zm){
  const toa=(x,z,R,col)=>{const g=c.createRadialGradient(x,z,0,x,z,R);g.addColorStop(0,col);g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)'));c.fillStyle=g;c.fillRect(x-R,z-R,2*R,2*R);};
  /* tối dần ra hai bên tường để lối giữa nổi lên */
  for(const k of[-1,1]){const a=k*M.W,b=k*2.2,g=c.createLinearGradient(a,0,b,0);g.addColorStop(0,'rgba(90,70,170,.12)');g.addColorStop(1,'rgba(90,70,170,0)');c.fillStyle=g;c.fillRect(Math.min(a,b),M.ZS-2,Math.abs(b-a),M.ZE-M.ZS+4);}
  DAO.forEach(d=>{
    /* vũng sáng trước từng ô hàng */
    for(const lx of[-3.05,0,3.05]){const w=veTheGioi(d,lx,2.9);toa(w.x,w.z,1.8,'rgba(255,255,255,.45)');}
    /* bóng chân bục */
    const a=veTheGioi(d,-5,1.99),b=veTheGioi(d,5,1.99),e=veTheGioi(d,0,2.55);
    const g=c.createLinearGradient(a.x,0,e.x,0);g.addColorStop(0,'rgba(70,50,150,.26)');g.addColorStop(1,'rgba(70,50,150,0)');c.fillStyle=g;c.fillRect(Math.min(a.x,e.x),Math.min(a.z,b.z),Math.abs(e.x-a.x),Math.abs(b.z-a.z));
    for(const o of keHoachRac(d)){const w=veTheGioi(d,o.lx,o.lz+.06);toa(w.x,w.z,{thung:.62,tui:.42,ghe:.36,quat:.32,bien:.4,xe:.78,gio:.5}[o.k],'rgba(70,50,150,.4)');}
  });
  toa(0,zm,2.1,'rgba(70,50,150,.28)');
  if(NOEL){toa(-2.9,M.ZE-2.2,1.75,'rgba(70,50,150,.3)');for(const q of[-1,1])toa(q*2.6,M.ZS+1.7,1.4,'rgba(70,50,150,.32)');}
  /* bóng góc giao hàng ở sảnh */
  [[-5.2,M.ZR+5.4,.85],[-6.2,M.ZR+4,.85],[5.3,M.ZR+5.2,.5],[6.2,M.ZR+4.5,.5],[2.5,M.ZR+7.4,.55],[M.W-1.2,M.ZR-M.R*11-5+1.55,.8]].forEach(([x,z,R])=>toa(x,z,R,'rgba(70,50,150,.38)'));
  toa(-(M.W-2.6),M.ZR-M.R*11-5,2.8,'rgba(70,50,150,.3)');toa(M.W-3,M.ZR-M.R*11-5,2.9,'rgba(70,50,150,.26)');
}

/* ---------- CẢNH 1: CHỢ ---------- */
/* Một không gian mở, một lối đi thẳng từ cửa vào tới tường logo, các khu xếp đều hai bên.
   Toàn bộ sáng bằng đèn nên ngày hay tối vào đều như nhau. */
const M=(()=>{const R=Math.ceil(NHOM.length/2),ZR=14;return{R,ZR,ZE:24,ZS:ZR-R*11-10,W:7.8,H:7};})();
const DAO=NHOM.map((g,i)=>{const side=i%2?1:-1;return{g,i,side,x:side*(M.W-.4),z:M.ZR-5.5-11*(i>>1),ry:side<0?PI/2:-PI/2};});
const taoHinh=pts=>{const S=new T.Shape();pts.forEach((p,i)=>S[i?'lineTo':'moveTo'](p[0],p[1]));S.closePath();return S;};
const hinhHoa=(r,b=.18)=>{const a=[];for(let i=0;i<72;i++){const t=i/72*2*PI,q=r*(1-b+b*Math.cos(6*t));a.push([Math.cos(t)*q,Math.sin(t)*q]);}return taoHinh(a);};
const hinhSao=r=>{const S=new T.Shape();S.moveTo(0,r);S.quadraticCurveTo(r*.1,r*.1,r,0);S.quadraticCurveTo(r*.1,-r*.1,0,-r);S.quadraticCurveTo(-r*.1,-r*.1,-r,0);S.quadraticCurveTo(-r*.1,r*.1,0,r);return S;};
const hinhCung=(R,w)=>{const S=new T.Shape();S.absarc(0,0,R,0,PI,false);S.absarc(0,0,R-w,PI,0,true);S.closePath();return S;};
/* Tấm nền trắng phía sau mỗi khu, viền gỗ sáng */
const nenKhu=(h=6.2)=>{const S=new T.Shape(),w=4.85,r=.5;S.moveTo(-w,0);S.lineTo(-w,h-r);S.quadraticCurveTo(-w,h,-w+r,h);S.lineTo(w-r,h);S.quadraticCurveTo(w,h,w,h-r);S.lineTo(w,0);S.closePath();return S;};
/* Khối hình lớn phía sau sản phẩm: vòm, hoa, ngôi nhà, khung bo tròn */
function hinhKhoi(k){
  const S=new T.Shape();
  if(k===0){S.moveTo(-4.9,0);S.lineTo(-4.9,1.75);S.absarc(0,1.75,4.9,PI,0,true);S.lineTo(4.9,0);S.closePath();return S;}
  if(k===1){const a=[];for(let i=0;i<=96;i++){const t=i/96*2*PI,q=3.68-.58*Math.cos(6*t);a.push([Math.cos(t)*q,2.72+Math.sin(t)*q]);}return taoHinh(a);}
  if(k===2)return taoHinh([[-4.8,0],[-4.8,4.3],[0,6.7],[4.8,4.3],[4.8,0]]);
  const w=4.9,h=6.5,r=1.7;S.moveTo(-w,0);S.lineTo(-w,h-r);S.quadraticCurveTo(-w,h,-w+r,h);S.lineTo(w-r,h);S.quadraticCurveTo(w,h,w,h-r);S.lineTo(w,0);S.closePath();return S;
}
const BAY='A';
/* Bày hàng ngang tầm mắt và tầm tay của khách.
   BAY 'A': ảnh trên kệ thấp, giá treo các size ngay dưới ảnh.
   BAY 'B': mỗi mẫu một ô, ảnh đứng trên bục thấp, giá treo các size đứng ngay cạnh ảnh. */
/* Nền từng ô hàng như thẻ chọn nhân vật: màu pastel nhạt, vòng cung lớn phía sau */
const O_MAU=[['#FFF1F9','#FFB3E1'],['#F4F0FF','#BBA6FF'],['#EEF9FA','#93D6DC'],['#EFF4FF','#97B7F2']];const O_TEX={};
function oTex(k,w,h){
  const key=k+'|'+w.toFixed(2)+'|'+h.toFixed(2);if(O_TEX[key])return O_TEX[key];
  const q=LOW?60:96,cv=document.createElement('canvas');cv.width=Math.round(w*q);cv.height=Math.round(h*q);const c=cv.getContext('2d'),W=cv.width,H=cv.height,[nen,vong]=O_MAU[k];
  c.fillStyle=nen;c.fillRect(0,0,W,H);
  const R=Math.min(W,H)*.52,t=R*.26;c.strokeStyle=vong;c.lineWidth=t;c.beginPath();c.arc(W*.55,H*.74,R-t/2,0,7);c.stroke();
  let gr=c.createRadialGradient(W/2,-H*.05,0,W/2,-H*.05,H*1.15);gr.addColorStop(0,'rgba(255,250,236,.45)');gr.addColorStop(.5,'rgba(255,250,240,0)');gr.addColorStop(1,'rgba(255,250,240,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);
  gr=c.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(60,40,70,0)');gr.addColorStop(1,'rgba(60,40,70,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);
  return O_TEX[key]=texOf(cv);
}
function khuHang(s,d){
  const{g,i,side,x,z,ry}=d,A=BAY==='A',ps=g.ps.slice(0,3),n=ps.length,nv={x:Math.sin(ry),z:Math.cos(ry)};
  s.grp='Sạp '+g.ten;s.push(mat(x,0,z,ry));
  const L=s.lit;s.lit=s.hop;s.push(mat(0,0,.17));
  for(const[c0,h,y0,dp]of[['#FFFFFF',.1,.2,1.75],['#C9B6FF',.1,.1,1.82],['#FFFFFF',.1,0,1.72]])s.box(9.9,h,dp,0,y0+h/2,dp/2,c0);
  const khung=(px,base,sc,p)=>{const w=BOARD.w*sc,h=BOARD.h*sc,ex={depth:.05,bevelEnabled:false,curveSegments:14};
    s.lit.add(new T.ExtrudeGeometry(hinhVom(w+.24,h+.12),ex),g.mau,s.at(px,base-.06,.06));
    s.lit.add(new T.ExtrudeGeometry(hinhVom(w+.1,h+.05),{...ex,depth:.08}),'#FFFFFF',s.at(px,base-.02,.1));
    board(s,p.id,px,base+h/2,.2,0,sc,nv);return base+h;};
  const treo=(px,rail,w,p,k)=>{giaTreo(s,px,w,KHOI,.98,rail);const m=s.plane(rackTex(p),2*k,1.36*k,px,rail-.62*k,.98,0,{transparent:true,alphaTest:.04,depthWrite:false});m.renderOrder=2;};
  let top;
  if(A){
    const sc=.86,pitch=3.05,xs=ps.map((_,j)=>(j-(n-1)/2)*pitch),ke=1.32;
    s.box(9,.07,.46,0,ke-.035,.26,'#FFFFFF');s.mc('vang',new T.BoxGeometry(9.04,.075,.02),s.at(0,ke-.035,.5));
    top=ke+BOARD.h*sc+.16;
    ps.forEach((p,j)=>{khung(xs[j],ke,sc,p);treo(xs[j],1.16,2.3,p,.8);});
  }else{
    const pitch=3.15,xs=ps.map((_,j)=>(j-(n-1)/2)*pitch),sc=.76,bo=.66;
    ps.forEach((p,j)=>{const px=xs[j]-.78,rx=xs[j]+.86;
      s.box(1.72,bo-KHOI,.62,px,(bo+KHOI)/2,.34,'#FFFFFF');s.box(1.74,.03,.64,px,bo-.015,.34,'#C9B6FF');
      top=khung(px,bo,sc,p)+.18;treo(rx,1.42,1.5,p,.78);});
    top=Math.max(top,bo+BOARD.h*.76+.18);
  }
  s.pop();
  /* Tấm tường màu khu liền một khối phía sau hàng, viền nhựa tím */
  const HB=5.2,geo=new T.ExtrudeGeometry(nenKhu(HB),{depth:.3,bevelEnabled:false,curveSegments:8});
  s.mc('vang',geo,s.at(0,-.01,-.42,0,0,0,1.02,1.016,1));s.glow.add(geo,['#FFD9F0','#E4DAFF','#CDEEF0','#D8E5FF'][(i*3)%4],s.at(0,0,-.1));
  mainHien(s,g,L,HB);
  /* Biển tên đứng trên mái hiên, nhãn sale lơ lửng bên cạnh */
  {const yb=4.86,zb=1.22;s.lit=L;s.box(4.75,1.02,.12,0,yb+.5,zb,g.mau);s.box(4.5,.84,.14,0,yb+.5,zb+.02,'#FFFFFF');s.lit=s.hop;
   s.plane(haloSign(g.ten,{w:1024,h:180,size:118,fg:g.chu,glow:'rgba(0,0,0,0)'}),4.3,.76,0,yb+.5,zb+.1,0,{transparent:true,depthWrite:false});
   nhan3D(s,nhanKhu(g,i),1.4,.62,-side*3.25,yb+.62,zb+.1,ry,side*.1);}
  if(NOEL)vongLa(s,side*3.4,4.25,.3);
  manoCanh(s,-4.35,KHOI,1.09,tint('#7C3CFF',.7),.5);manoCanh(s,4.35,KHOI,1.09,tint('#7C3CFF',.7),-.5);
  /* Rào gỗ thấp trước sạp: khách đứng sau rào, đủ xa để nhìn trọn giá treo */
  {const RZ=3,cot=[-4.7,-1.6,1.6,4.7];for(const q of cot){ong(s,'vang',.035,[q,0,RZ],[q,.66,RZ]);s.mc('vang',new T.CylinderGeometry(.13,.15,.03,12),s.at(q,.015,RZ));s.mc('vang',new T.SphereGeometry(.06,10,8),s.at(q,.68,RZ));}
   for(let j=0;j<cot.length-1;j++)for(const h of[.32,.58])ong(s,'vang',.016,[cot[j],h,RZ],[cot[j+1],h,RZ]);
   if(NOEL){for(let j=0;j<cot.length-1;j++)dayDen(s,new V3(cot[j],.64,RZ),new V3(cot[j+1],.64,RZ),.09);
     for(const q of[-4.7,4.7]){const o=Math.sign(q);keoGay(s,q+o*.2,0,RZ+.14,o>0?0:PI,-.22,.95,.032);keoGay(s,q+o*.2,0,RZ+.2,o>0?PI:0,-.22,.95,.032);noDo(s,q+o*.2,.42,RZ+.26,0,1.2);hoaLa(s,q+o*.2,.5,RZ+.24,0,.9);}}
   chumGoc(s,side*4.5,4.05,.4,i+1);}
  s.lit=L;s.pop();
  s.solid(side<0?-M.W:x-.5,side<0?x+.5:M.W,z-5.2,z+5.2);
  s.solid(side<0?-M.W:x-3.2,side<0?x+3.2:M.W,z-5.2,z+5.2,false);
  s.pts.push(LP(x-side*2,5,z,.12,8,GOLD));
}
/* Mái hiên sọc màu khu và trắng, nghiêng ra lối đi, diềm lượn sóng, dây bóng đèn dưới mép */
function mainHien(s,g,lit,hb){
  const W=10.1,n=12,sw=W/n,y0=hb-.05,z0=.25,y1=4.62,z1=1.62,dz=z1-z0,dy=y0-y1,len=Math.hypot(dz,dy),rx=Math.atan2(dy,dz);
  const L=s.lit;s.lit=lit;
  SONG_G=SONG_G||{};const kg=sw.toFixed(3);if(!SONG_G[kg])SONG_G[kg]=new T.CylinderGeometry(sw/2,sw/2,.07,18,1,false,-PI/2,PI);
  for(let k=0;k<n;k++){const x=-W/2+sw*(k+.5),c=k%2?'#FFFFFF':g.mau;
    s.box(sw+.004,.08,len,x,(y0+y1)/2,(z0+z1)/2,c,0,rx);
    s.lit.add(SONG_G[kg],c,s.at(x,y1-.01,z1+.01,0,PI/2),true);
    s.gball(.055,x,y1-sw/2-.08,z1+.03,k%2?'#FFE7A0':'#FFFFFF');}
  /* thanh đỡ hai bên */
  for(const q of[-W/2+.06,W/2-.06])ong(s,'vang',.03,[q,y1-.02,z1-.05],[q,y0-.4,z0]);
  s.lit=L;
}
let SONG_G;
/* Đồ treo trần lơ lửng ở nhiều độ cao, xoay chậm */
function treoTran(s,H,list){
  s.spin=s.spin||[];const ex={depth:.14,bevelEnabled:false,curveSegments:14};
  for(const[k,x,y,z,r,col]of list){
    const sh=k==='hoa'?hinhHoa(r):k==='sao'?hinhSao(r):k==='cung'?hinhCung(r,r*.34):null;
    s.cyl(.012,.012,H-y-r*.9,x,(H+y+r*.9)/2,z,'#2A1670',3);
    const m=sh?new T.Mesh(new T.ExtrudeGeometry(sh,ex).center(),new T.MeshBasicMaterial({color:col})):new T.Mesh(new T.SphereGeometry(r,18,14),new T.MeshLambertMaterial({color:col,emissive:col,emissiveIntensity:.55}));
    m.position.set(x,y,z);m.rotation.y=x+z;s.root.add(m);s.spin.push(m);}
}
/* Đĩa màu lớn gắn trần, viền đèn */
function diaTran(s,H,list){
  for(const[x,z,R,col]of list){s.glow.add(new T.CylinderGeometry(R,R,.2,48),col,s.at(x,H-.1,z));s.glow.add(new T.TorusGeometry(R+.06,.05,6,56),'#FFFFFF',s.at(x,H-.22,z,0,PI/2));}
}
function marketFloor(x0,x1,z0,z1){
  const Q=LOW?.5:1.4,cv=document.createElement('canvas');cv.width=1024*Q;cv.height=2048*Q;const c=cv.getContext('2d'),r=seeded(7),zm=(M.ZE+M.ZS)/2;
  c.scale(cv.width/(x1-x0),cv.height/(z1-z0));c.translate(-x0,-z0);
  c.fillStyle='#F2EFFA';c.fillRect(x0,z0,x1-x0,z1-z0);
  const O=2.4;
  for(let x=Math.floor(x0/O)*O;x<x1;x+=O)for(let z=Math.floor(z0/O)*O;z<z1;z+=O){const v=r();c.fillStyle=((Math.round(x/O)+Math.round(z/O))&1)?'rgba(255,255,255,.75)':v<.5?'rgba(214,203,246,.55)':'rgba(222,212,248,.45)';c.fillRect(x,z,O,O);}
  c.strokeStyle='rgba(200,188,236,.8)';c.lineWidth=.03;for(let x=Math.floor(x0/O)*O;x<x1;x+=O){c.beginPath();c.moveTo(x,z0);c.lineTo(x,z1);c.stroke();}for(let z=Math.floor(z0/O)*O;z<z1;z+=O){c.beginPath();c.moveTo(x0,z);c.lineTo(x1,z);c.stroke();}
  /* lối đi giữa: thảm hồng viền trắng chạy từ cửa vào tới tường logo */
  c.fillStyle='#FFFFFF';c.fillRect(-1.45,z0,2.9,z1-z0);c.fillStyle='#FFD3EC';c.fillRect(-1.25,z0,2.5,z1-z0);
  c.fillStyle='rgba(255,255,255,.55)';for(let z=Math.floor(z0);z<z1;z+=1.2)c.fillRect(-.07,z,.14,.6);
  /* vũng sáng của đèn trần */
  for(let z=M.ZE-3;z>M.ZS+3;z-=6.5){const g=c.createRadialGradient(0,z,0,0,z,5);g.addColorStop(0,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-5,z-5,10,10);}
  /* vòng đá xanh giữa chợ */
  const da=(ve,base)=>{c.save();c.beginPath();ve();c.clip('evenodd');c.fillStyle=base;c.fillRect(-6,zm-6,12,12);
    for(let i=0;i<46;i++){let x=-5+r()*10,z=zm-5+r()*10,a=r()*7;c.strokeStyle=`rgba(255,255,255,${.25+r()*.35})`;c.lineWidth=.015+r()*.03;c.beginPath();c.moveTo(x,z);for(let k=0;k<6;k++){a+=(r()-.5)*1.4;x+=Math.cos(a)*.5;z+=Math.sin(a)*.5;c.lineTo(x,z);}c.stroke();}c.restore();};
  da(()=>{c.arc(0,zm,4.7,0,7);c.moveTo(4.2,zm);c.arc(0,zm,4.2,0,7,true);},'#7C3CFF');
  da(()=>{c.moveTo(0,zm-3.6);c.quadraticCurveTo(1.9,zm,0,zm+3.6);c.quadraticCurveTo(-1.9,zm,0,zm-3.6);},'#9670FF');
  c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(0,zm-1.3);c.lineTo(.5,zm);c.lineTo(0,zm+1.3);c.lineTo(-.5,zm);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=.08;c.beginPath();c.arc(0,zm,4.75,0,7);c.stroke();
  sanSauBong(c,zm);
  const t=texOf(cv);t.anisotropy=8;return t;
}
/* Tấm biển ở tường cổng: logo ở giữa, tên phiên chợ hai bên */
function logoTex(){
  const q=LOW?1:2,cv=document.createElement('canvas');cv.width=1024*q;cv.height=320*q;const c=cv.getContext('2d');c.scale(q,q);
  c.fillStyle='#FFFFFF';rr(c,0,0,1024,320,64);c.fill();c.strokeStyle='#C9B6FF';c.lineWidth=8;rr(c,4,4,1016,312,60);c.stroke();
  c.drawImage(LOGO,372,20,280,280);
  c.fillStyle='#3A2C6E';c.textBaseline='middle';c.font='800 92px "Baloo 2","Be Vietnam Pro",sans-serif';c.textAlign='right';c.fillText('DuuDuu',346,172);c.textAlign='left';c.fillText('họp chợ',678,172);
  const t=texOf(cv);t.anisotropy=8;return t;
}
let LOGO_TEX;
const logoRound=()=>{if(LOGO_TEX)return LOGO_TEX;const n=LOW?512:1024,cv=document.createElement('canvas');cv.width=cv.height=n;cv.getContext('2d').drawImage(LOGO,0,0,n,n);LOGO_TEX=texOf(cv);LOGO_TEX.anisotropy=8;return LOGO_TEX;};
/* Bảng tròn mang logo, có viền tím nhạt. d là đường kính phần logo.
   Gắn tường: lưng tấm nằm tại z. Treo (hai=true): tâm tấm nằm tại z, có logo cả hai mặt. */
function logoDisc(s,x,y,z,ry,d,hai=false){
  const R=d/2,th=Math.max(.05,d*.05),vien=d*.035,o={transparent:true,alphaTest:.03,depthWrite:false},z0=hai?0:th/2;
  s.push(mat(x,y,z,ry));
  s.mc('vang',new T.CylinderGeometry(R+vien,R+vien,th,48),s.at(0,0,z0,0,PI/2));
  s.plane(logoRound(),d,d,0,0,z0+th/2+.012,0,o);
  if(hai)s.plane(logoRound(),d,d,0,0,-th/2-.012,PI,o);
  s.pop();
}
/* Biển logo treo ngang lối đi bằng hai dây từ trần */
function logoTreo(s,x,y,z,d,H){
  const R=d/2,yt=y+R*.82;logoDisc(s,x,y,z,0,d,true);
  for(const k of[-1,1])s.cyl(.02,.02,H-yt,x+k*R*.56,(H+yt)/2,z,INK,6);
}
/* Tường bao: mảng màu xen kẽ độ rộng khác nhau, đoạn nền kem để treo khung nhân vật */
/* Tường pastel: ván dọc kẻ rãnh nhạt, chân tường trắng, viền hồng. Màu phẳng như đồ chơi nhựa. */
const TUONG_TEX={};
function wallTex(L=46,H=7){
  const k=L+'|'+H;if(TUONG_TEX[k])return TUONG_TEX[k];
  const q=LOW?40:64,cv=document.createElement('canvas');cv.width=Math.min(4096,Math.round(L*q));cv.height=Math.round(H*q);
  const c=cv.getContext('2d'),W=cv.width,Hh=cv.height,u=W/L;
  const g=c.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#E8DEFF');g.addColorStop(1,'#D3C4FA');c.fillStyle=g;c.fillRect(0,0,W,Hh);
  c.fillStyle='rgba(120,90,210,.18)';for(let x=0;x<W;x+=.9*u)c.fillRect(x,0,Math.max(1,.035*u),Hh);
  c.fillStyle='rgba(255,255,255,.55)';for(let x=.04*u;x<W;x+=.9*u)c.fillRect(x,0,Math.max(1,.025*u),Hh);
  c.fillStyle='#FFFFFF';c.fillRect(0,Hh-.42*u,W,.42*u);c.fillStyle='#FF9FDC';c.fillRect(0,Hh-.47*u,W,.05*u);
  c.fillStyle='#FFFFFF';c.fillRect(0,Hh-2.66*u,W,.14*u);
  const t=texOf(cv);t.anisotropy=8;return TUONG_TEX[k]=t;
}
/* Mảng tròn trang trí trên tường: xanh có kệ nhỏ bày đồ, trắng có viền xanh nhạt */
function manhTron(s,x,y,z,ry,d,xanh){
  const R=d/2;s.push(mat(x,y,z,ry));const L=s.lit;s.lit=s.hop;
  s.glow.add(new T.CylinderGeometry(R,R,.06,40),xanh?'#7C3CFF':'#FFFFFF',s.at(0,0,.03,0,PI/2));
  if(xanh){const mau=['#FFFFFF','#F6D7D2','#FFE9A8','#D6ECD9'];[-.28,.22].forEach((q,j)=>{s.box(R*1.1,.035,.22,0,q*d,.17,'#FFFFFF');for(let n=0;n<2;n++)s.box(.2,.12,.14,(n-.5)*R*.55,q*d+.08,.17,mau[(j*2+n)%4]);});}
  else s.glow.add(new T.TorusGeometry(R-.02,.025,6,40),'#D9CBFF',s.at(0,0,.065));
  s.lit=L;s.pop();
}
function hangTron(s,list,ry,d){list.forEach(([x,y,z],i)=>manhTron(s,x,y,z,ry,d,i%2===0));}
/* Cuối lối đi: tường logo lớn */
function tuongCuoi(s){
  const{H,ZS,W}=M,f=ZS+.03;
  s.box(2*W+1,H+2.2,.4,0,(H+2.2)/2,ZS-.2,'#FFFFFF');
  s.plane(wallTex(2*W,H),2*W,H,0,H/2,ZS+.01,0,{color:'#F6F4FB'});
  hangTron(s,[[-6.2,3.7,f],[-3.7,4.2,f],[3.7,4.2,f],[6.2,3.7,f]],0,1.7);
  logoDisc(s,0,3.7,f,0,3.8);
}
/* Trần vòm cong từ tường này sang tường kia */
const VOM={rise:1.9};
function vomY(x){const{W,H}=M,c=W,h=VOM.rise,r=(c*c+h*h)/(2*h);return H+Math.sqrt(r*r-x*x)-(r-h);}
function tranVom(s){
  const{W,ZE,ZS}=M,L=ZE-ZS,zm=(ZE+ZS)/2,N=10,geo=new T.PlaneGeometry(2*W,L,48,1),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x,vomY(x),zm-y);}geo.computeVertexNormals();
  const cv=document.createElement('canvas');cv.width=1024;cv.height=16;const c=cv.getContext('2d'),sw=1024/N;
  for(let i=0;i<N;i++){const g=c.createLinearGradient(i*sw,0,(i+1)*sw,0);g.addColorStop(0,'#A9D2F6');g.addColorStop(.15,'#CFE6FB');g.addColorStop(.85,'#CFE6FB');g.addColorStop(1,'#A9D2F6');c.fillStyle=g;c.fillRect(i*sw,0,sw,16);}
  const m=new T.Mesh(geo,new T.MeshBasicMaterial({map:texOf(cv),side:T.DoubleSide}));m.userData.tran=1;s.root.add(m);
  /* sườn dọc */
  for(let i=1;i<N;i++){const x=-W+i*2*W/N;s.mc('vang',new T.BoxGeometry(.07,.07,L),s.at(x,vomY(x)-.04,zm));}
  /* sườn ngang theo vòm */
  for(let z=ZE-3;z>ZS+2;z-=6.5){const pts=[];for(let k=0;k<=24;k++){const x=-W+k*2*W/24;pts.push(new V3(x,vomY(x)-.05,z));}s.mc('vang',new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.035,4),s.at(0,0,0));}
  /* đèn âm tròn trên các ô trần */
  for(let z=ZE-6.25;z>ZS+2;z-=6.5)for(const x of[-W+W*.3,W-W*.3]){s.glow.add(new T.CylinderGeometry(.2,.2,.03,16),'#E3DCF5',s.at(x,vomY(x)-.02,z));s.glow.add(new T.CylinderGeometry(.15,.15,.05,16),'#FFFFFF',s.at(x,vomY(x)-.03,z));}
  /* vòng trần giữa chợ, ngay trên vòng đá */
  const y=vomY(4.6)-.25;
  s.glow.add(new T.CylinderGeometry(4.6,4.6,.06,64),'#7C3CFF',s.at(0,y+.08,zm));
  s.glow.add(new T.CylinderGeometry(4.1,4.1,.1,64),'#FFFFFF',s.at(0,y,zm));
  s.mc('vang',new T.TorusGeometry(4.15,.05,6,64),s.at(0,y-.04,zm,0,PI/2));
  for(let k=0;k<12;k++){const a=k/12*2*PI;s.glow.add(new T.CylinderGeometry(.1,.1,.02,10),'#FFFFFF',s.at(Math.cos(a)*3.4,y-.06,zm+Math.sin(a)*3.4));}
  return y;
}
/* Bàn trưng trắng thấp, trên có các xấp đồ gấp */
function bucTron(s,x,z,ry){
  const R=2.15,h=.9,cv=document.createElement('canvas');cv.width=2048;cv.height=128;const c=cv.getContext('2d');
  c.fillStyle='#7C3CFF';c.fillRect(0,0,2048,128);c.fillStyle='#FFFFFF';c.font='800 74px "Baloo 2","Be Vietnam Pro",sans-serif';c.textAlign='center';c.textBaseline='middle';for(let i=0;i<4;i++)c.fillText('DuuDuu',256+i*512,68);
  const t=texOf(cv);t.anisotropy=8;const m=new T.Mesh(new T.CylinderGeometry(R,R,h,64,1,true),new T.MeshBasicMaterial({map:t}));m.position.set(x,h/2,z);m.rotation.y=ry+PI;s.root.add(m);
  s.glow.add(new T.CylinderGeometry(R,R,.02,64),'#9A6BFF',s.at(x,h-.01,z));s.glow.add(new T.TorusGeometry(R,.03,6,64),'#FFFFFF',s.at(x,h,z,0,PI/2));
}
/* Giá tròn giữa chợ: bục trắng, thanh treo gỗ vòng quanh, bốn mẫu treo bốn phía */
function giaTron(s,x,z){
  const L=s.lit;s.lit=s.hop;s.cyl(1.5,1.55,.28,x,.14,z,'#FFFFFF',40);s.lit=L;s.mc('vang',new T.TorusGeometry(1.52,.03,6,48),s.at(x,.27,z,0,PI/2));
  ong(s,'vang',.035,[x,.28,z],[x,TAY+.3,z]);s.mc('vang',new T.TorusGeometry(1.08,.024,6,40),s.at(x,TAY,z,0,PI/2));
  for(let k=0;k<4;k++){const a=k*PI/2+PI/4;ong(s,'vang',.016,[x,TAY+.3,z],[x+Math.sin(a)*1.08,TAY,z+Math.cos(a)*1.08]);}
  const noi=[...P].sort((a,b)=>(b.anh.length?1:0)-(a.anh.length?1:0));
  for(let k=0;k<4;k++){const a=k*PI/2,p=noi[k%noi.length],m=s.plane(rackTex(p),1.46,.99,x+Math.sin(a)*1.1,TAY-.45,z+Math.cos(a)*1.1,a,{transparent:true,alphaTest:.04,depthWrite:false});m.renderOrder=2;}
  s.round(x,z,1.75);
}
function banThap(s,x,z,ry){
  s.push(mat(x,0,z,ry));const L=s.lit;s.lit=s.hop;
  s.box(1.5,.62,1.1,0,.31,0,'#FFFFFF');s.box(1,.42,.8,1.05,.21,.35,'#FFFFFF');
  const mau=['#F3C9C4','#E2D6FF','#EFE3C8','#CFE3D2','#E7D3EA'];
  [[-.42,.62,0],[.3,.62,-.15],[1.05,.42,.35]].forEach(([a,y,b],k)=>{for(let q=0;q<4;q++)s.box(.46,.055,.36,a,y+.03+q*.06,b,mau[(k*2+q)%5]);});
  s.lit=L;s.pop();s.solid(x-1.2,x+1.7,z-.9,z+.9);
}
/* Đèn âm trần hắt thành vệt sáng trắng hình vỏ sò lên tường */
let SO_TEX;
function soTex(){
  if(SO_TEX)return SO_TEX;const cv=document.createElement('canvas');cv.width=256;cv.height=512;const c=cv.getContext('2d');
  c.save();c.translate(128,-10);c.scale(1,2.6);let g=c.createRadialGradient(0,0,0,0,0,128);g.addColorStop(0,'rgba(255,255,255,.42)');g.addColorStop(.35,'rgba(255,250,255,.2)');g.addColorStop(1,'rgba(255,250,255,0)');c.fillStyle=g;c.fillRect(-128,0,256,260);c.restore();
  c.save();c.translate(128,-10);c.scale(.55,1.9);g=c.createRadialGradient(0,0,0,0,0,128);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-128,0,256,280);c.restore();
  return SO_TEX=texOf(cv);
}
function vetSo(s,x,y,z,ry,w=2.5,h=4.4){
  const m=s.plane(soTex(),w,h,x,y-h/2,z,ry,{transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false});m.userData.giu=1;m.renderOrder=3;
}
function denAm(s,x,z){const y=vomY(x);s.glow.add(new T.CylinderGeometry(.16,.16,.03,14),'#E3DCF5',s.at(x,y-.02,z));s.glow.add(new T.CylinderGeometry(.11,.11,.05,14),'#FFFFFF',s.at(x,y-.03,z));}

/* ---------- Bóng bay và poster trang trí ---------- */
const BONG=['bh','bt','bx','bw','bd','bv'];
let BONG_G,CAU_G;
const vlk=(s,k)=>s.vl[k]||(s.vl[k]=new Batch());
/* Một quả bóng: thân giọt nước, núm buộc, dây */
function quaBong(s,k,x,y,z,sc=1,day=null){
  BONG_G=BONG_G||new T.LatheGeometry([[.001,-.2],[.05,-.19],[.11,-.14],[.155,-.06],[.17,.02],[.16,.1],[.125,.165],[.07,.2],[.001,.212]].map(q=>new T.Vector2(q[0],q[1])),14);
  vlk(s,k).add(BONG_G,'#FFFFFF',s.at(x,y,z,0,0,0,sc,sc,sc),true);
  vlk(s,k).add(new T.ConeGeometry(.028,.05,8),'#FFFFFF',s.at(x,y-.215*sc,z,0,PI),true);
  if(day)ong(s,'su',.004,[x,y-.23*sc,z],day);
}
/* Chùm bóng buộc vào một điểm */
function chumBong(s,x,y0,z,n=5,seed=1,cao=1.35){
  const r=seeded(seed*97+13),buoc=[x,y0,z];
  for(let i=0;i<n;i++){const a=i/n*2*PI+r()*.6,d=i?.16+r()*.12:0,h=cao+(i?r()*.35:.45);
    quaBong(s,BONG[(seed+i*2)%BONG.length],x+Math.cos(a)*d,y0+h,z+Math.sin(a)*d,.92+r()*.22,buoc);}
}
/* Cụm bóng gắn ở góc trên khung sạp, cao hơn ảnh mẫu nên không che hàng */
function chumGoc(s,x,y,z,seed){
  [[0,.22,0,1.05],[-.2,.02,.05,.95],[.2,.02,.05,.95],[0,-.16,.12,.85]].forEach(([dx,dy,dz,sc],k)=>quaBong(s,BONG[(seed+k*2)%BONG.length],x+dx,y+dy,z+dz,sc));
}
/* Cổng bóng bay vòm qua lối đi */
function congBong(s,z,rx,ry){
  CAU_G=CAU_G||new T.SphereGeometry(.2,10,8);
  const L=PI*Math.sqrt((rx*rx+ry*ry)/2),n=Math.round(L/.3),mau=['bh','bw','bt','bx','bh','bd'];
  for(let i=0;i<=n;i++){const t=i/n*PI,x=-Math.cos(t)*rx,y=Math.sin(t)*ry,nx=-Math.cos(t)/rx,ny=Math.sin(t)/ry,l=Math.hypot(nx,ny);
    for(let j=0;j<3;j++){const a=j/3*2*PI+i*.9,o=.17,dx=nx/l*Math.cos(a)*o,dy=ny/l*Math.cos(a)*o,dz=Math.sin(a)*o,k=mau[(i+j*2)%mau.length],sc=.9+((i*7+j*3)%5)*.05;
      vlk(s,k).add(CAU_G,'#FFFFFF',s.at(x+dx,Math.max(.18,y+dy+.15),z+dz,0,0,0,sc,sc*1.1,sc),true);}}
  for(const q of[-rx,rx]){s.mc('su',new T.CylinderGeometry(.24,.28,.16,16),s.at(q,.08,z));s.round(q,z,.45);}
}
/* Poster: ảnh mẫu thật, tên, giá; hoặc chữ to */
function chuXuong(c,t,x,y,w,lh,max=2){const ws=t.split(' ');let dong=[],cur='';for(const w0 of ws){const th=cur?cur+' '+w0:w0;if(c.measureText(th).width>w&&cur){dong.push(cur);cur=w0;}else cur=th;}dong.push(cur);
  if(dong.length>max){dong=dong.slice(0,max);dong[max-1]=dong[max-1].replace(/\s*\S*$/,'')+'…';}dong.forEach((d,i)=>c.fillText(d,x,y+i*lh));return dong.length;}
function posterTex(W,H,ve,src){
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),t=texOf(cv);
  try{t.anisotropy=renderer.capabilities.getMaxAnisotropy();}catch(e){t.anisotropy=8;}
  ve(c,W,H,null);if(src){const im=new Image();im.onload=()=>{ve(c,W,H,im);t.needsUpdate=true;};im.src=src;}return t;
}
const anhPhu=(c,im,x,y,w,h)=>{c.fillStyle='#F3E9FB';c.fillRect(x,y,w,h);if(!im)return;const k=Math.max(w/im.width,h/im.height),iw=im.width*k,ih=im.height*k;c.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);};
const vom=(c,x,y,w,h)=>{const r=w/2;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+r);c.arc(x+r,y+r,r,PI,0);c.lineTo(x+w,y+h);c.closePath();};
function nenPoster(c,W,H,toi){
  const g=c.createLinearGradient(0,0,W,H);if(toi){g.addColorStop(0,'#4F2BC9');g.addColorStop(1,'#7C3CFF');}else{g.addColorStop(0,'#FFF4FA');g.addColorStop(1,'#F1ECFF');}
  c.fillStyle=g;c.fillRect(0,0,W,H);c.lineWidth=W*.05;
  [[toi?'rgba(255,159,220,.35)':'#FFE0F3',W*.94,H*.08,W*.16],[toi?'rgba(171,220,224,.28)':'#DDF0F2',W*.05,H*.97,W*.18]].forEach(([col,x,y,r])=>{c.strokeStyle=col;c.beginPath();c.arc(x,y,r,0,2*PI);c.stroke();});
  c.strokeStyle='#FFFFFF';c.lineWidth=Math.min(W,H)*.03;c.strokeRect(c.lineWidth/2,c.lineWidth/2,W-c.lineWidth,H-c.lineWidth);
}
const F_TO='"Baloo 2","Be Vietnam Pro",sans-serif',F_TH='"Be Vietnam Pro",sans-serif';
/* Poster mẫu: ảnh thật thật to, tên, giá. Chữ ít và to để đứng xa vẫn đọc được */
function posterMau(p,nhan,W,H){
  return posterTex(W,H,(c,W,H,im)=>{
    nenPoster(c,W,H,false);const ngang=W>H,u=ngang?H/680:W/600;let ax,ay,aw,ah,tx,ty,tw;
    if(ngang){ax=W*.05;ay=H*.08;aw=W*.42;ah=H*.84;tx=W*.52;ty=H*.11;tw=W*.44;}else{ax=W*.1;ay=H*.06;aw=W*.8;ah=H*.5;tx=W*.09;ty=H*.6;tw=W*.82;}
    c.save();vom(c,ax,ay,aw,ah);c.clip();anhPhu(c,im,ax,ay,aw,ah);c.restore();vom(c,ax,ay,aw,ah);c.strokeStyle='#FFFFFF';c.lineWidth=12*u;c.stroke();
    c.textAlign='left';c.font=`800 ${Math.round((ngang?34:30)*u)}px ${F_TH}`;const ph=(ngang?60:52)*u,pw=c.measureText(nhan).width+40*u;
    rr(c,tx,ty,pw,ph,ph/2);c.fillStyle='#7C3CFF';c.fill();c.fillStyle='#FFFFFF';c.textBaseline='middle';c.fillText(nhan,tx+20*u,ty+ph/2+2*u);
    c.textBaseline='alphabetic';c.fillStyle=INK;const fs=(ngang?62:54)*u,lh=fs*1.06;c.font=`800 ${Math.round(fs)}px ${F_TO}`;
    const y1=ty+ph+fs*1.15,nd=chuXuong(c,p.name,tx,y1,tw,lh,ngang?3:2);
    const gs=(ngang?(nd>2?150:170):112)*u,yg=y1+(nd-1)*lh+gs*.92;c.fillStyle='#6A2BE8';c.font=`800 ${Math.round(gs)}px ${F_TO}`;const gia=giaChu(p);c.fillText(gia,tx,yg);
    c.fillStyle='#4F2BC9';c.font=`800 ${Math.round((ngang?50:38)*u)}px ${F_TH}`;
    if(ngang)c.fillText('Size '+dayKg(p),tx,yg+70*u,tw);else{const gw=c.measureText(gia).width;c.textAlign='right';c.fillText(dayKg(p),tx+tw,yg-8*u);}
  },thumbOf(p));
}
/* Poster chữ: một câu to, một dòng phụ ngắn */
function posterChu(dau,duoi,W,H){
  return posterTex(W,H,(c,W,H)=>{nenPoster(c,W,H,true);const ngang=W>H,u=ngang?H/680:W/600;
    c.textAlign='center';c.textBaseline='alphabetic';const hs=(ngang?150:118)*u,hl=hs*1.02,ss=(ngang?60:48)*u,sl=ss*1.25;
    c.font=`800 ${Math.round(hs)}px ${F_TO}`;const tam=document.createElement('canvas').getContext('2d');tam.font=c.font;
    const dem=(ctx,t,w)=>{const ws=t.split(' ');let n=1,cur='';for(const w0 of ws){const th=cur?cur+' '+w0:w0;if(ctx.measureText(th).width>w&&cur){n++;cur=w0;}else cur=th;}return n;};
    const nh=Math.min(2,dem(tam,dau,W*.86));tam.font=`700 ${Math.round(ss)}px ${F_TH}`;const ns=Math.min(2,dem(tam,duoi,W*.82));
    const tong=nh*hl+ss*.6+ns*sl,y0=(H-tong)/2+hs*.8;
    c.fillStyle='#FFFFFF';chuXuong(c,dau,W/2,y0,W*.86,hl,2);
    c.fillStyle='#FFD3EF';c.font=`700 ${Math.round(ss)}px ${F_TH}`;chuXuong(c,duoi,W/2,y0+(nh-1)*hl+ss*.6+sl,W*.82,sl,2);});
}
/* Poster treo trên lối đi, hai mặt */
function posterTreo(s,z,truoc,sau,pTruoc){
  const w=3.3,h=2.2,y=4.75;
  for(const[t,ry,dz]of[[truoc,0,.012],[sau,PI,-.012]]){const m=s.plane(t,w,h,0,y,z+dz,ry);m.userData.giu=1;if(pTruoc&&t===truoc)s.taps.push({mesh:m,k:'mau',p:pTruoc,pos:s.world(0,y,z)});}
  s.lit.add(boxG(w+.08,h+.08,.02),'#FFFFFF',s.at(0,y,z),true);
  for(const x of[-w/2+.15,w/2-.15])ong(s,'den',.006,[x,y+h/2,z],[x,vomY(x)-.05,z]);
}
/* Poster đứng trên giá vẽ gỗ */
function posterDung(s,x,z,ry,t,tap){
  s.push(mat(x,0,z,ry));const w=.95,h=1.36,y=1.35;
  const m=s.plane(t,w,h,0,y,.04,0);m.userData.giu=1;if(tap)s.taps.push(Object.assign({mesh:m,pos:s.world(0,y-h/2+.12,.06)},tap));s.lit.add(boxG(w+.06,h+.06,.03),'#FFFFFF',s.at(0,y,.015),true);
  ong(s,'vang',.022,[-.56,0,.16],[-.51,y+h/2+.1,0]);ong(s,'vang',.022,[.56,0,.16],[.51,y+h/2+.1,0]);ong(s,'vang',.02,[0,0,-.42],[0,y+h/2,-.02]);
  ong(s,'vang',.018,[-.5,y-h/2-.02,.07],[.5,y-h/2-.02,.07]);
  s.pop();s.round(x,z,.55);
}
function trangTri(s){
  const{ZR,W,ZE,ZS}=M,co=P.filter(p=>p.anh.length&&!p.thu),lay=(i)=>co.length?co[i%co.length]:P[i%P.length];
  const ship=(SHOP.ship&&SHOP.ship[0])?`Ship chỉ từ ${SHOP.ship[0].tien}k`:'Chốt đơn qua Zalo shop';
  const tu=Math.min(...P.map(p=>p.tu)),den=Math.max(...P.map(p=>p.den)),re=P.reduce((a,b)=>(b.price&&b.price<a.price?b:a),P[0]);
  /* cổng bóng ở sảnh vào, chân sát tường, không che sạp nào */
  congBong(s,ZR+3.6,6.5,5.5);
  /* biển "Đang mở" treo giữa cổng bóng, đi vào hay đi ra đều đọc được */
  {const z=ZR+3.6,y=4.8,o={k:'tot',t:'ĐANG MỞ',s:'CHỢ MỞ CẢ NGÀY'};nhan3D(s,o,1.6,.78,0,y,z,0,0,true);nhan3D(s,o,1.6,.78,0,y,z,PI,0,true);
   for(const k of[-1,1])ong(s,'den',.012,[k*.55,y+.42,z],[k*.25,5.55,z]);
   if(NOEL)for(const f of[1,-1]){hoaLa(s,-.62,y+.33,z+f*.12,f>0?0:PI,1.5);}}
  /* chùm bóng ở bốn góc và quầy tư vấn */
  [[-W+2.2,ZE-2.4],[W-2.2,ZE-2.4],[W-3+2.6,ZR-M.R*11-5+.9]].forEach(([x,z],i)=>{s.mc('su',new T.CylinderGeometry(.12,.15,.2,12),s.at(x,.1,z));chumBong(s,x,.2,z,7,20+i,1.6);s.round(x,z,.35);});
  /* poster treo giữa các dãy sạp */
  const zT=[];for(let r=0;r<M.R-1;r++)if(r!==1)zT.push(ZR-5.5-11*r-5.5);
  const pa=[[posterMau(lay(0),(lay(0).khu||'Hàng mới về').toUpperCase(),2048,1360),posterChu(`Đi đơn từ ${SHOP.donToiThieu} bộ`,ship,2048,1360),lay(0)],
            [posterMau(re,(re.khu||'Giá tốt').toUpperCase(),2048,1360),posterChu(`Size ${tu}–${den}kg`,'Chợ đánh dấu mẫu vừa bé',2048,1360),re]];
  zT.forEach((z,i)=>posterTreo(s,z,...pa[i%pa.length]));
  /* hai poster đứng ở sảnh vào */
  posterDung(s,-4.4,ZR+2.2,.42,posterChu('Bé lên sàn diễn','Mặc thử trước, ưng thì mua',1200,1720),{k:'dien'});
  posterDung(s,4.4,ZR+2.2,-.42,posterMau(lay(1),(lay(1).khu||'Hàng mới về').toUpperCase(),1200,1720),{k:'mau',p:lay(1)});
  /* góc Noel bên trái lối vào (chỉ có vào mùa Noel) */
  if(NOEL)gocNoel(s,-2.9,ZE-2.2,2.6);
  /* chồng giỏ mua hàng ở lối vào, giỏ trên cùng có sẵn quần áo */
  {const x=2.5,z=ZR+7.4;for(let k=0;k<3;k++)gioHang(s,x,k*.06,z,.3,k===2,k,k===2);s.round(x,z,.45);}
  /* góc giao hàng ở sảnh: xe đẩy chở thùng, chồng thùng và loa rao trên chân đứng */
  xeDay(s,-5.2,ZR+5.4,.55,0);s.round(-5.2,ZR+5.4,.65);
  carton(s,.7,.52,.56,-6.4,0,ZR+4.3,.3,1);carton(s,.56,.42,.46,-6.36,.52,ZR+4.32,-.1,2);carton(s,.6,.45,.5,-5.7,0,ZR+3.5,-.5,0);s.round(-6.2,ZR+4,.7);
  {const x=5.3,z=ZR+5.2;s.cyl(.3,.34,.08,x,.04,z,'#FFFFFF',24);ong(s,'bac',.035,[x,.08,z],[x,1.62,z]);loa(s,x,1.78,z,-1.45,-.22,1.15);nhan3D(s,{k:'hot',t:'SALE',s:`CHỈ TỪ ${GIA_RE}K`},.95,.5,x-.95,2.35,z+.15,-1.45+PI/2,.12);s.round(x,z,.45);
    carton(s,.62,.46,.5,x+.9,0,z-.7,-.4,2);carton(s,.5,.38,.42,x+.92,.46,z-.68,.1,0);s.round(x+.9,z-.7,.45);}
}
function buildMarket(){
  const s=newScene('cho','Chợ','Một lối đi thẳng, các khu hàng hai bên, gấu lớn và quầy tư vấn');
  const{H,ZE,ZS,W,ZR,R}=M,cream='#FBFAF6',x0=-W-1,x1=W+1,z0=ZS-1,z1=ZE+1,L=ZE-ZS,zm=(ZE+ZS)/2,zb=ZR-R*11-5;
  const g=new T.Mesh(new T.PlaneGeometry(x1-x0,z1-z0),new T.MeshBasicMaterial({map:marketFloor(x0,x1,z0,z1)}));g.rotation.x=-PI/2;g.position.set(0,0,(z0+z1)/2);s.root.add(g);s.ground=g;
  /* trần: hai dải đèn thẳng theo lối đi, đĩa đèn trên từng khu */
  const yVong=tranVom(s);
  /* tường bao chỉ có họa tiết */
  const nS=Math.round(L/8);s.box(2*W+1,H+2.2,.4,0,(H+2.2)/2,ZE+.2,'#FFFFFF');s.plane(wallTex(2*W,H),2*W,H,0,H/2,ZE-.01,PI,{color:'#F6F4FB'});
  for(const k of[-1,1]){s.box(.4,H,L,k*(W+.2),H/2,zm,cream);s.plane(wallTex(L,H),L,H,k*(W-.01),H/2,zm,-k*PI/2,{color:k<0?'#FFFFFF':'#E9E5F4'});  /* nắng chiếu từ trái: tường phải tối hơn một chút */}
  s.plane(logoTex(),11.5,3.6,0,3.3,ZE-.02,PI,{transparent:true,alphaTest:.03,depthWrite:false});
  /* biển logo treo đầu lối đi, nhìn thấy ngay khi vào chợ, đi chiều nào cũng đọc được */
  logoTreo(s,0,5.25,zm,2.6,yVong);
  giaTron(s,0,zm);
  for(const k of[-1,1]){const xw=k*(W-.02),ry=-k*PI/2,zs=[];for(let z=ZE-2.6;z>ZR+.6;z-=2.1)zs.push(z);for(let z=ZR-5.5-11*(R-1)-6.2;z>ZS+1.5;z-=2.1)zs.push(z);hangTron(s,zs.map((z,i)=>[xw,i%2?3.2:3.7,z]),ry,1.55);}
    /* các khu hàng */
  DAO.forEach(d=>{khuHang(s,d);datRac(s,d);});
  trangTri(s);
  /* cuối lối đi: gấu lớn bên trái, quầy tư vấn bên phải */
  const bx=-(W-2.6),br=.66;bucTron(s,bx,zb,br);bear(s,bx,zb,1.3,br,.9,'#FBFAF6','#FFFFFF');s.round(bx,zb,2.3);
  {const v=[[2.1,.5],[1.1,2.1]].map(([a,b])=>new V3(bx+a*Math.cos(br)+b*Math.sin(br),0,zb-a*Math.sin(br)+b*Math.cos(br)));s.round(v[0].x,v[0].z,1);s.round(v[1].x,v[1].z,.95);}
  const cx=W-3;s.box(4.6,1.05,1.3,cx,.525,zb,'#FFFFFF');s.box(4.8,.08,1.5,cx,1.09,zb,'#C9B6FF');s.gbox(4.74,.03,1.44,cx,.02,zb,'#E9E3F7');s.solid(cx-2.3,cx+2.3,zb-.65,zb+.65,false);for(const k of[-1,1])logoDisc(s,cx+k*1.3,.56,zb+.65,0,.84);
  s.ownerAt={x:cx,z:zb-1.25,yaw:0};
  /* quà tặng: trên quầy và chồng quà cạnh tường */
  hopQua(s,.34,cx+1.45,1.13,zb-.1,.3,0);hopQua(s,.24,cx+1.85,1.13,zb+.15,-.4,1);
  hopQua(s,.56,W-1,0,zb+1.3,.25,2);hopQua(s,.36,W-1.02,.46,zb+1.28,-.3,1);hopQua(s,.4,W-1.6,0,zb+1.9,.6,0);s.round(W-1.2,zb+1.55,.75);
  if(NOEL){
    cayThong(s,-2.6,ZS+1.7,3);cayThong(s,2.6,ZS+1.7,3);
    for(const[k,c,q]of[[-.45,'#E5322D',1],[0,'#2F9E5B',2],[.45,'#E5322D',0]])tatNoel(s,cx+k,1.0,zb+.68,0,c,q);
    quayNoel(s,cx-1.75,1.13,zb-.05);
    tuiQua(s,-1.15,ZS+2.7,.4);hopQua(s,.42,1.25,0,ZS+2.6,.5,0);hopQua(s,.3,1.3,.42*.82*.82+.06,ZS+2.6,-.2,2);hopQua(s,.28,1.7,0,ZS+3.0,.9,1);s.round(1.4,ZS+2.75,.5);
    const MC=['ndo','nvang','nxanh','ndo','bac','nvang'];let k=0;
    for(let z=ZE-4.5;z>ZS+3;z-=3.3)for(const x of[-2.4,2.4]){const y=5+((k*3)%4)*.28,r=.2+(k%3)*.04,yt=vomY(x)-.05;
      if(k%5===4){ong(s,'vang',.006,[x,y+.32,z],[x,yt,z]);hoaLa(s,x,y+.26,z,0,1.3);noDo(s,x,y+.18,z+.04,0,1.1);chuong(s,x-.1,y-.12,z,0,.2,.28);chuong(s,x+.1,y-.1,z,0,-.2,.28);}
      else{ong(s,'vang',.006,[x,y+r*1.25,z],[x,yt,z]);quaChau(s,x,y,z,r,CHAU[k%CHAU.length]);}k++;}
    tuyetRoi(s,-W+.5,W-.5,ZS+.5,ZE-.5,7,LOW?380:760);
  }
  plant(s,-W+1.4,ZE-1.6,1.4);plant(s,W-1.4,ZE-1.6,1.4);plant(s,-W+1.4,ZS+1.6,1.4);plant(s,W-1.4,ZS+1.6,1.4);
  tuongCuoi(s);
  s.bounds={minX:-W+.7,maxX:W-.7,minZ:ZS+.6,maxZ:ZE-.6};s.camB={x:W-.4,zMin:ZS+.5,zMax:ZE-.5};
  s.spawn={x:0,z:ZE-8,yaw:0};
  s.nav=[...DAO.map(d=>({l:d.g.ten,x:d.side*(M.W-4.75),z:d.z,yaw:d.ry})),{l:'Gấu lớn',x:bx+3.4,z:zb+4.4,yaw:br},{l:'Tư vấn Phanh Phanh',x:cx-2.6,z:zb+3,yaw:.3}];
  s.fog=new T.Fog('#DCEBFB',40,160);s.bg=new T.Color('#DCEBFB');
  for(const k of[-1,1]){for(let z=ZE-1.6;z>ZS+1;z-=3.05){denAm(s,k*(W-.9),z);vetSo(s,k*(W-.04),vomY(k*(W-.04))-.05,z,-k*PI/2);}}
  for(const x of[-6,-2,2,6]){denAm(s,x*.95,ZS+.9);vetSo(s,x,vomY(x)-.05,ZS+.05,0);denAm(s,x*.95,ZE-.9);vetSo(s,x,vomY(x)-.05,ZE-.05,PI);}
  s.hemi=[new T.Color('#FFFFFF'),new T.Color('#B4AADB'),.9];s.sun=['#FFF6EC',.55,[-.42,.8,.43]];
  finish(s,{sky:[1.02,1.02,1.05],ground:[.72,.7,.88],sun:[.16,.15,.12],dir:[-.42,.8,.43],aoH:1.1,aoMin:.8});
  s.wander=()=>({x:(Math.random()-.5)*5,z:ZS+3+Math.random()*(L-8)});
  return s;
}

/* ---------- Nhân vật ---------- */
const capsule=(r,h,sg=8)=>{const pts=[];for(let i=0;i<=5;i++){const a=-PI/2+i/5*PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r-h));}for(let i=0;i<=5;i++){const a=i/5*PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r));}return new T.LatheGeometry(pts,sg);};
const torsoProfile=[[.001,.34],[.25,.34],[.285,.40],[.26,.55],[.215,.72],[.145,.84],[.001,.86]].map(p=>new T.Vector2(p[0],p[1]));
const GEO={};
/* Tuỳ chọn cho khách tự tạo nhân vật. Màu ghi theo mã màu, tên hiện khi rê chuột / đọc màn hình. */
const AV={
  dang:[['thap','Thấp'],['vua','Vừa'],['cao','Cao']],
  da:[['#FFE3CF','Trắng hồng'],['#F9CFAE','Sáng'],['#E8B48C','Ngăm nhẹ'],['#C68C64','Bánh mật']],
  mat:[['cuoi','Mỉm cười'],['toet','Cười tươi'],['chum','Chúm chím'],['nhay','Nháy mắt']],
  toc:[['buithap','Búi thấp'],['xoan','Xoăn bồng'],['tet','Tết hai bên'],['mai','Dài mái bằng'],['duoi','Đuôi ngựa'],['haibui','Hai búi'],['bob','Ngắn bob'],['dai','Dài gợn'],['tem','Tóc tém']],
  mauToc:[['#2B1B17','Đen'],['#3A2420','Nâu đen'],['#7A4A2E','Nâu'],['#B57A45','Nâu sáng'],['#E3B23C','Vàng'],['#F2A7BB','Hồng phấn'],['#A9A9B6','Muối tiêu']],
  do:[['dam','Đầm'],['vay','Áo + váy'],['quan','Áo + quần'],['short','Quần short']],
  hoa:[['tron','Trơn'],['bi','Chấm bi'],['soc','Kẻ sọc'],['caro','Ca rô']],
  mau:[['#F2644E','Cam san hô'],['#FF8FB3','Hồng'],['#FFC9DA','Hồng phấn'],['#E5484D','Đỏ'],['#FFD866','Vàng'],['#8FD694','Xanh lá'],['#3CCFC0','Xanh ngọc'],['#7EC4FF','Xanh trời'],['#3E5BA9','Xanh jean'],['#B9A8FF','Tím'],['#FFFFFF','Trắng'],['#E9D3B0','Be'],['#2B2F45','Đen']],
  pk:[['khong','Không'],['no','Nơ'],['kep','Kẹp tóc'],['mumeo','Mũ tai mèo'],['bangdo','Băng đô'],['hoa','Hoa cài']],
  om:[['khong','Không'],['gau','Gấu bông'],['tho','Thỏ bông']]
};
const L0={dang:'vua',da:'#F9CFAE',mat:'cuoi',toc:'buithap',mauToc:'#3A2420',do:'dam',hoa:'tron',ao:'#F2644E',duoi:'#F2644E',pk:'khong',mauPk:'#FF8FB3',om:'khong'};
const mkLook=o=>Object.assign({},L0,o);
const AVP=[
  {id:'cam',ten:'Váy cam',look:mkLook({})},
  {id:'xoan',ten:'Xoăn nơ hồng',look:mkLook({dang:'thap',da:'#FFE3CF',mat:'chum',toc:'xoan',mauToc:'#2B1B17',hoa:'bi',ao:'#FF8FB3',duoi:'#FF8FB3',pk:'no',mauPk:'#FF8FB3'})},
  {id:'tho',ten:'Ôm thỏ',look:mkLook({dang:'thap',da:'#FFE3CF',toc:'mai',mauToc:'#2B1B17',hoa:'bi',ao:'#FFC9DA',duoi:'#FFC9DA',pk:'kep',mauPk:'#FF8FB3',om:'tho'})},
  {id:'meo',ten:'Mũ tai mèo',look:mkLook({mat:'toet',toc:'tet',mauToc:'#E3B23C',do:'quan',ao:'#7EC4FF',duoi:'#3E5BA9',pk:'mumeo',mauPk:'#2B2F45'})},
  {id:'duoi',ten:'Đuôi ngựa',look:mkLook({dang:'thap',da:'#FFE3CF',toc:'duoi',mauToc:'#2B1B17',do:'vay',ao:'#FFFFFF',duoi:'#FF8FB3',pk:'bangdo',mauPk:'#FF8FB3'})},
  {id:'bui',ten:'Hai búi',look:mkLook({dang:'thap',da:'#E8B48C',mat:'toet',toc:'haibui',mauToc:'#2B1B17',do:'short',hoa:'soc',ao:'#3CCFC0',duoi:'#FFFFFF',pk:'hoa',mauPk:'#FFFFFF'})},
  {id:'bob',ten:'Tóc bob',look:mkLook({da:'#FFE3CF',mat:'nhay',toc:'bob',mauToc:'#B57A45',hoa:'caro',ao:'#B9A8FF',duoi:'#B9A8FF',pk:'kep',mauPk:'#FFD866'})},
  {id:'gau',ten:'Ôm gấu',look:mkLook({dang:'thap',da:'#E8B48C',toc:'xoan',mauToc:'#7A4A2E',do:'short',ao:'#FFD866',duoi:'#3E5BA9',om:'gau'})},
  {id:'tem',ten:'Tóc tém',look:mkLook({dang:'cao',da:'#C68C64',mat:'toet',toc:'tem',mauToc:'#2B1B17',do:'quan',hoa:'soc',ao:'#7EC4FF',duoi:'#2B2F45'})},
  {id:'dai',ten:'Tóc dài',look:mkLook({dang:'cao',mat:'chum',toc:'dai',mauToc:'#7A4A2E',do:'quan',ao:'#FFD866',duoi:'#3E5BA9',pk:'hoa',mauPk:'#FF8FB3'})}
];
const LOOK0=AVP[0].look,OWNER_LOOK=mkLook({dang:'cao',da:'#F7DCCB',mat:'dd',toc:'song',mauToc:'#231614',do:'vay',inAo:'ve',rong:1,daiTay:1,ao:'#DDD3C1',duoi:'#1F1F24',giay:'#FFFFFF',pk:'nolon',mauPk:'#B69874',moi:'#C0453F',ma:.26,mui:.28});
const LOOK_ENUM=['dang','da','mat','toc','mauToc','do','hoa','pk','om'],LOOK_COL=['ao','duoi','mauPk'],LOOK_KEYS=[...LOOK_ENUM,...LOOK_COL];
const okLook=l=>{const o=Object.assign({},LOOK0);if(l){for(const k of LOOK_ENUM)if(AV[k].some(v=>v[0]===l[k]))o[k]=l[k];
  for(const k of LOOK_COL)if(/^#[0-9a-f]{6}$/i.test(l[k]||''))o[k]=l[k];}return o;};
function randLook(r=Math.random){const p=a=>a[Math.floor(r()*a.length)][0],ao=p(AV.mau);let duoi=p(AV.mau);if(duoi===ao)duoi=AV.mau[(AV.mau.findIndex(v=>v[0]===ao)+5)%AV.mau.length][0];
  return{dang:p(AV.dang),da:p(AV.da),mat:p(AV.mat),toc:p(AV.toc),mauToc:p(AV.mauToc.slice(0,5)),do:p(AV.do),hoa:r()<.55?'tron':p(AV.hoa),ao,duoi,
    pk:r()<.4?'khong':p(AV.pk.slice(1)),mauPk:p(AV.mau),om:r()<.75?'khong':p(AV.om.slice(1))};}

const HR=.19;                                 /* bán kính đầu */
const DANG={thap:.44,vua:.52,cao:.62};         /* chiều dài chân theo dáng */
const TORSO=[[0,-.075],[.08,-.07],[.115,-.03],[.122,.03],[.11,.11],[.095,.18],[.1,.25],[.107,.3],[.098,.34],[.072,.37],[.042,.39],[.027,.403],[0,.408]];
const BAND=[[0,-.088],[.07,-.086],[.11,-.06],[.124,-.025],[.128,.02],[.123,.075]];
const lathe=(pts,seg=16)=>new T.LatheGeometry(pts.map(p=>new T.Vector2(Math.max(p[0],0),p[1])),seg);
/* Tay chân thuôn, hai đầu tròn, treo từ khớp xuống */
function rod(r1,r2,len,seg=10){const p=[];for(let i=0;i<=4;i++){const a=-PI/2+i/4*PI/2;p.push([Math.cos(a)*r2,-len+Math.sin(a)*r2]);}for(let i=1;i<=4;i++){const a=i/4*PI/2;p.push([Math.cos(a)*r1,Math.sin(a)*r1]);}return lathe(p,seg);}
function merge(parts){const pos=[],nor=[],uv=[];for(const[g,m]of parts){const x=g.index?g.toNonIndexed():g.clone();x.applyMatrix4(m);const a=x.attributes.position.array,n=x.attributes.normal.array,u=x.attributes.uv?x.attributes.uv.array:null;for(let i=0;i<a.length;i++){pos.push(a[i]);nor.push(n[i]);}for(let i=0;i<a.length/3;i++)uv.push(u?u[i*2]:0,u?u[i*2+1]:0);}
  const b=new T.BufferGeometry();b.setAttribute('position',new T.Float32BufferAttribute(pos,3));b.setAttribute('normal',new T.Float32BufferAttribute(nor,3));b.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return b;}
const gc={},gget=(k,f)=>gc[k]||(gc[k]=f());
function skirtGeo(kind,L){return gget('sk'+kind+L,()=>{
  const top=kind==='dam'?[.097,.19]:[.106,.135],hy=-.06-L*(kind==='dam'?.44:kind==='midi'?.56:.36),hr=kind==='midi'?.16+L*.12:.2+L*.07,p=[[hr-.014,hy+.014]];
  for(let i=0;i<=10;i++){const t=i/10;p.push([lerp(hr,top[0],Math.pow(t,.85)),lerp(hy,top[1],t)]);}
  return lathe(p,24);});}
function initCharGeo(){
  GEO.ctorso=lathe(TORSO,22);GEO.band=lathe(BAND,22);GEO.neck=new T.CylinderGeometry(.029,.035,.15,12);
  initHeadGeo();
  GEO.upper=rod(.032,.028,.22);GEO.fore=rod(.028,.023,.2);GEO.hand=new T.SphereGeometry(.037,10,8);GEO.hand.scale(.8,1.15,.6);
  GEO.foot=new T.SphereGeometry(.046,12,8);GEO.foot.scale(1,.6,1.9);GEO.foot.translate(0,0,.035);
  GEO.tail=merge([[new T.SphereGeometry(HR*.3,14,10),mat(0,-HR*.62,0,0,0,0,1,2.3,1)],[new T.SphereGeometry(HR*.2,12,8),mat(0,-HR*1.25,-HR*.03,0,0,0,1,1.5,1)]]);
  GEO.blob=new T.PlaneGeometry(1.1,1.1);
}
const thighG=L=>gget('th'+L,()=>rod(.06,.045,L*.5,12)),shinG=L=>gget('sh'+L,()=>rod(.045,.033,L*.5,12));
const mix=(a,b,t)=>'#'+new T.Color(a).lerp(new T.Color(b),t).getHexString();
/* Đầu to kiểu chibi, hơi thuôn. Mặt, tóc, tai, phụ kiện đều đặt theo cùng tỉ lệ này. */
const HS=[.97,1.0,.96];
const hdir=(th,a)=>new V3(Math.sin(th)*Math.sin(a),Math.cos(th),Math.sin(th)*Math.cos(a));
/* Ma trận đặt một chi tiết lên mặt đầu: trục z của chi tiết hướng ra ngoài */
function onHead(th,a,d,sx=1,sy=1,sz=1,roll=0){
  const v=hdir(th,a),p=new V3(v.x*HS[0],v.y*HS[1],v.z*HS[2]).multiplyScalar(HR*d),n=new V3(v.x/HS[0],v.y/HS[1],v.z/HS[2]).normalize();
  const up=Math.abs(n.y)>.97?new V3(0,0,-1):new V3(0,1,0),m=new T.Matrix4().lookAt(n,new V3(),up);
  if(roll)m.multiply(new T.Matrix4().makeRotationZ(roll));m.scale(new V3(sx,sy,sz));m.setPosition(p);return m;}
const mul=(a,b)=>a.clone().multiply(b);
/* Nét cong mảnh (lông mày, mí mắt, miệng): cung tròn uốn theo mặt */
function arcGeo(rad,tube,arc,mid,center){const g=new T.TorusGeometry(rad,tube,8,32,arc);g.rotateZ(mid-arc/2);if(!center)g.translate(-rad*Math.cos(mid),-rad*Math.sin(mid),0);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)-(x*x+y*y)/(2*HR));}g.computeVertexNormals();return g;}
const mergeOr=l=>l.length?merge(l):null;
/* Mặt theo nét mặt: mắt to có mí và lông mi, chấm sáng trong mắt, mũi nhỏ, miệng */
function faceGeo(ex){return gget('f'+ex,()=>{
  const R=HR,F=[],S=[],K=[],L=[],E=.545*PI,A=.38;
  const eye=new T.SphereGeometry(R*.125,20,16),lash=new T.SphereGeometry(R*.024,8,6);lash.scale(.55,1.7,.5);lash.translate(0,R*.035,0);
  const shine=new T.SphereGeometry(R*.036,10,8),shine2=new T.SphereGeometry(R*.017,8,6);
  if(ex==='dd'){/* nét mặt người lớn: mắt hạnh nhân hai mí có kẻ viền, mày đậm dài gần ngang, mũi nhỏ, môi đỏ cam đầy */
    for(const k of[-1,1]){const a=k*A;
      F.push([eye,onHead(E+.012,a,.972,.95,.84,.42)]);F.push([arcGeo(R*.115,R*.03,2.05,PI/2,1),onHead(E-.002,a,1.012,.95,1.0)]);
      F.push([lash,onHead(E-.035,a+k*.12,1.006,1.1,1.05,1,-k*1.3)]);
      S.push([shine,onHead(E-.055,a-.035,1.018,.85,.85,.45)]);
      F.push([arcGeo(R*.2,R*.032,.85,PI/2),onHead(.45*PI,k*(A+.035),1.014,1,1,1,k*.12)]);}
    K.push([new T.SphereGeometry(R*.04,12,9),onHead(.607*PI,0,.99,1,.8,.7)]);
    /* miệng cười: môi trên mảnh, môi dưới đầy, cong lên hai khoé */
    L.push([arcGeo(R*.15,R*.024,1.3,-PI/2),onHead(.655*PI,0,1.012)]);L.push([arcGeo(R*.115,R*.036,1.85,-PI/2),onHead(.665*PI,0,1.014)]);
    return{feat:merge(F),shine:mergeOr(S),pink:merge(K),lip:mergeOr(L)};
  }
  for(const k of[-1,1]){const a=k*A;
    if(ex==='nhay'&&k>0){F.push([arcGeo(R*.1,R*.03,2.3,PI/2,1),onHead(E+.03,a,1.0)]);}
    else{F.push([eye,onHead(E,a,.972,.82,1,.42)]);F.push([arcGeo(R*.105,R*.026,2.1,PI/2,1),onHead(E,a,1.012,.86,1.12)]);
      S.push([shine,onHead(E-.075,a-.04,1.018,1,1,.45)]);S.push([shine2,onHead(E+.06,a+.035,1.016,1,1,.45)]);}
    F.push([lash,onHead(E-.105,a+k*.075,1.005,1,1,1,-k*.55)]);F.push([lash,onHead(E-.07,a+k*.105,1.005,1,1,1,-k*1.05)]);
    F.push([arcGeo(R*.1,R*.019,1.1,PI/2),onHead(.44*PI,k*(A+.02),1.012,1,1,1,-k*.12)]);
  }
  K.push([new T.SphereGeometry(R*.072,14,10),onHead(.605*PI,0,.985,1,.85,.8)]);
  if(ex==='toet'){L.push([new T.SphereGeometry(R*.115,18,10,0,2*PI,PI/2,PI/2),onHead(.665*PI,0,.99,1.15,1,.32)]);K.push([new T.SphereGeometry(R*.06,12,8),onHead(.705*PI,0,.996,1.25,.6,.28)]);}
  else if(ex==='chum')K.push([new T.SphereGeometry(R*.045,12,10),onHead(.672*PI,0,1.0,1.35,.85,.45)]);
  else F.push([arcGeo(R*.13,R*.03,1.7,-PI/2),onHead(.67*PI,0,1.02)]);
  return{feat:merge(F),shine:mergeOr(S),pink:merge(K),lip:mergeOr(L)};});}
/* Tóc: chỏm, phần sau, lọn gợn sóng cho bồng, mái, búi, bím */
function hairGeo(st){return gget('h'+st,()=>{
  const R=HR,P=[],add=(g,m)=>P.push([g,m]);
  const shell=(r,ps,pl,ts,tl,rx=0,rz=0,hs=12)=>add(new T.SphereGeometry(R*r,32,hs,ps,pl,ts,tl),mat(0,0,0,0,rx,rz,HS[0],HS[1],HS[2]));
  const cap=(t=.37,r=1.06)=>shell(r,0,2*PI,0,PI*t,.08,.1);
  const back=(t1,r=1.07,o=1.05)=>shell(r,PI/2+o,2*PI-2*o,PI*.16,PI*(t1-.16));
  const nape=(r=1.055)=>shell(r,PI/2+1.85,2*PI-3.7,PI*.6,PI*.24);
  const lump=(th,a,r,d=.87,f=.62,sx=1,roll=0,sg=16)=>add(new T.SphereGeometry(R*r,sg,Math.round(sg*.75)),onHead(th,a,d,sx,1,f,roll));
  const waves=(full=1)=>{lump(.04*PI,0,.36,.84);
    for(let i=0;i<6;i++)lump(.2*PI,-2.6+i*1.04,.34,.86);
    if(full)for(let i=0;i<5;i++)lump(.36*PI,1.55+i*.8,.32,.88);};
  const bang=()=>{lump(.34*PI,-.42,.4,.93,.5,1.45,.5);lump(.3*PI,.32,.33,.93,.5,1.3,-.35);lump(.38*PI,-.92,.3,.95,.55,1,.9);};
  if(st==='tem'){cap(.38,1.05);back(.64,1.05,1.12);nape(1.045);waves(0);for(let i=0;i<4;i++)lump(.36*PI,1.9+i*.83,.28,.88);lump(.33*PI,-.35,.32,.93,.45,1.4,.5);}
  else if(st==='bob'){cap();back(.7,1.1,.92);shell(1.13,PI/2+.98,2*PI-1.96,PI*.56,PI*.18,0,0,4);waves();bang();}
  else if(st==='dai'){cap();back(.7,1.1,.92);waves();bang();add(new T.SphereGeometry(R,20,14),mat(0,-R*1.2,-R*.72,0,0,0,1.0,1.8,.5));
    for(const k of[-1,1])add(new T.SphereGeometry(R*.3,14,10),mat(k*R*.84,-R*.75,-R*.08,0,0,0,.9,2.2,.85));}
  else if(st==='song'){/* dài ngang eo, xoăn sóng lơi, rẽ ngôi, không mái, lọn trước buông qua vai */
    cap(.27,1.06);back(.72,1.1,.9);waves();
    lump(.27*PI,-.6,.36,.95,.55,1.45,.75);lump(.28*PI,.64,.32,.95,.55,1.35,-.75);
    lump(.42*PI,-1.08,.3,.96,.6,1,.3);lump(.42*PI,1.08,.3,.96,.6,1,-.3);
    add(new T.SphereGeometry(R,20,14),mat(0,-R*1.7,-R*.74,0,0,0,1.2,2.5,.56));
    for(const k of[-1,1]){for(let j=0;j<4;j++)add(new T.SphereGeometry(R*.3,16,12),mat(k*R*(.92+.1*Math.sin(j*2.1)),-R*(.5+j*.64),R*(.04-j*.03),0,0,k*(j%2?.22:-.22),1,2.05,.85));
      add(new T.SphereGeometry(R*.28,14,10),mat(k*R*.84,-R*2.95,R*.0,0,0,0,1.1,1,.9));}
    for(let j=0;j<5;j++)add(new T.SphereGeometry(R*.32,12,9),mat((j-2)*R*.36,-R*(3.9+.14*Math.sin(j*2)),-R*.62,0,0,0,1,1.15,.8));}
  else if(st==='mai'){shell(1.06,0,2*PI,0,PI*.38);shell(1.09,PI/2-1.2,2.4,PI*.16,PI*.29);back(.72,1.1,.95);
    add(new T.SphereGeometry(R,20,14),mat(0,-R*1.15,-R*.7,0,0,0,1.05,1.85,.5));
    for(const k of[-1,1])add(new T.SphereGeometry(R*.3,14,10),mat(k*R*.88,-R*.6,R*.05,0,0,0,.75,2.1,.85));}
  else if(st==='xoan'){cap(.37,1.04);back(.7,1.05,1.0);nape(1.04);
    const N=96;for(let i=0;i<N;i++){const th=Math.acos(1-2*((i+.5)/N)*.86),aa=((i*2.39996+PI)%(2*PI))-PI;
      if(th>.33*PI&&Math.abs(aa)<1.05)continue;lump(th,aa,.21,1.0+.05*Math.sin(i*1.7),.8,1,0,10);}
    for(let i=0;i<6;i++)lump((.33+(i%2)*.025)*PI,-.9+i*.36,.17,1.0,.7,1,0,10);}
  else{cap();back(.66,1.06,1.08);nape();waves();bang();
    if(st==='buithap'){lump(.68*PI,-2.3,.4,1.12,.85);lump(.76*PI,-2.5,.3,1.08,.85);}
    if(st==='duoi')lump(.34*PI,PI,.16,1.05,1);
    if(st==='haibui')for(const k of[-1,1]){lump(.22*PI,k*1.5,.38,1.12,.95);lump(.3*PI,k*1.45,.14,1.0,1);}
    if(st==='tet')for(const k of[-1,1]){for(let j=0;j<8;j++){const s=1-j*.04;add(new T.SphereGeometry(R*.175*s,14,10),mat(k*R*(.96+j*.03),-R*(.25+j*.2),-R*(.2-j*.045),0,0,k*(j%2?.5:-.5),1.2,.78,1));}
      add(new T.SphereGeometry(R*.1,10,8),mat(k*R*1.2,-R*1.95,R*.16,0,0,0,1,1.5,1));}
  }
  return merge(P);});}
const EARS={buithap:1,duoi:1,haibui:1,tem:1,tet:1};
/* Phụ kiện trên đầu: a dùng màu khách chọn, b là chi tiết phụ (chấm, sao, nhuỵ hoa) */
function bowParts(list,m){const R=HR,lobe=new T.SphereGeometry(R*.17,16,12);
  for(const k of[-1,1]){list.push([lobe,mul(m,mat(k*R*.17,0,0,0,0,-k*.35,1.35,.8,.55))]);list.push([new T.SphereGeometry(R*.06,10,8),mul(m,mat(k*R*.08,-R*.17,0,0,0,k*.3,.8,1.8,.4))]);}
  list.push([new T.SphereGeometry(R*.08,12,10),mul(m,mat(0,0,R*.03,0,0,0,1,1,.7))]);}
function accGeo(pk){return gget('pk'+pk,()=>{
  const R=HR,A=[],B=[];
  if(pk==='no')bowParts(A,onHead(.27*PI,-1.0,1.1,1,1,1,.4));
  if(pk==='kep'){const m=onHead(.31*PI,.95,1.09,1,1,1,-.75);A.push([new T.SphereGeometry(R*.075,14,10),mul(m,mat(0,0,0,0,0,0,3.0,1,.6))]);
    for(const x of[-.13,0,.13])B.push([new T.SphereGeometry(R*.022,8,6),mul(m,mat(x*R,0,R*.04,0,0,0,1,1,.5))]);}
  if(pk==='mumeo'){const hm=mat(0,R*.05,-R*.03,0,-.12,0,HS[0],HS[1],HS[2]);A.push([new T.SphereGeometry(R*1.13,32,12,0,2*PI,0,PI*.4),hm]);
    const t=PI*.4,rim=new T.TorusGeometry(R*1.13*Math.sin(t),R*.07,8,40);A.push([rim,mul(hm,mat(0,R*1.13*Math.cos(t),0,0,PI/2,0))]);
    const ear=new T.ConeGeometry(R*.27,R*.42,4);ear.rotateY(PI/4);ear.rotateX(PI/2);ear.translate(0,0,R*.16);for(const k of[-1,1])A.push([ear,mul(mat(0,R*.05,-R*.03,0,-.12,0),onHead(.15*PI,k*1.25,1.06,1,.75,1))]);
    const st=new T.SphereGeometry(R*.05,8,6);for(const[th,a]of[[.06,0],[.15,-.7],[.15,.75],[.2,2.3],[.22,-2.1],[.27,-.25],[.27,.45],[.3,1.5],[.3,-1.3],[.26,3.0]])B.push([st,mul(mat(0,R*.05,-R*.03,0,-.12,0),onHead(th*PI,a,1.135,1,1,.35))]);}
  if(pk==='bangdo'){A.push([new T.TorusGeometry(R*1.1,R*.055,8,40,PI),mat(0,R*.06,0,0,-.42,0,HS[0],HS[1],HS[2])]);bowParts(A,mul(onHead(.24*PI,.85,1.12,1,1,1,-.3),mat(0,0,0,0,0,0,.55,.55,.55)));}
  if(pk==='mulu'){/* mũ lưỡi trai vải kẻ sọc, đội lệch ra sau một chút, có nhãn trắng phía trước */
    const hm=mat(0,R*.1,-R*.04,0,-.2,0,HS[0]*1.04,HS[1]*.96,HS[2]*1.06);A.push([new T.SphereGeometry(R*1.16,32,14,0,2*PI,0,PI*.46),hm]);
    const yr=R*1.16*Math.cos(PI*.46),b=new T.CylinderGeometry(R*.78,R*.78,R*.09,28,1,false,-PI/2,PI);b.scale(1.05,1,.9);
    A.push([b,mul(hm,mat(0,yr,R*1.0,0,.32,0))]);
    B.push([new T.BoxGeometry(R*.6,R*.24,R*.04),mul(hm,onHead(.33*PI,0,1.17))]);}
  if(pk==='nolon'){/* băng đô lông to bản, nơ thắt lớn trên đỉnh */
    A.push([new T.TorusGeometry(R*1.13,R*.1,10,40,PI),mat(0,R*.08,-R*.02,0,-.38,0,HS[0],HS[1],HS[2])]);
    bowParts(A,mul(onHead(.1*PI,-.25,1.2,1,1,1,.15),mat(0,0,0,0,0,0,2.1,2.0,1.7)));}
  if(pk==='ngoc'){const pe=new T.SphereGeometry(R*.046,12,10);for(let i=0;i<=16;i++){const u=i/8-1,th=Math.abs(u)*.44*PI+.03,a=(u<0?-1:1)*(PI/2-.5);A.push([pe,onHead(th,a,1.205-.1*u*u,1,1,1)]);}}
  if(pk==='hoa'){const m=onHead(.3*PI,-1.05,1.1),pt=new T.SphereGeometry(R*.085,12,10);
    for(let i=0;i<5;i++){const g=i/5*2*PI;A.push([pt,mul(m,mat(Math.cos(g)*R*.1,Math.sin(g)*R*.1,0,0,0,g-PI/2,1,1.25,.5))]);}
    B.push([new T.SphereGeometry(R*.055,10,8),mul(m,mat(0,0,R*.035,0,0,0,1,1,.6))]);}
  return{a:mergeOr(A),b:mergeOr(B)};});}
/* Thú bông ôm trước ngực: a màu chính, b phần sáng, c mắt mũi */
function plushGeo(kind){return gget('om'+kind,()=>{
  const A=[],B=[],C=[],s=(r,x,y,z,sx=1,sy=1,sz=1,rz=0)=>[new T.SphereGeometry(r,14,10),mat(x,y,z,0,0,rz,sx,sy,sz)];
  A.push(s(.075,0,0,0,1,1.05,.85),s(.066,0,.105,.01));
  for(const k of[-1,1])A.push(s(.026,k*.072,.015,.025,1,1.6,1,k*.4),s(.03,k*.042,-.07,.035));
  if(kind==='gau'){for(const k of[-1,1])A.push(s(.026,k*.05,.16,0));B.push(s(.026,0,.088,.062,1.25,.9,.7),s(.045,0,-.005,.058,1,1.1,.4));}
  else{for(const k of[-1,1])A.push(s(.022,k*.03,.2,-.005,1,3.2,.6,-k*.18));B.push(s(.04,0,-.005,.058,1,1.1,.4),s(.022,0,.085,.064,1.2,.85,.6));}
  for(const k of[-1,1])C.push(s(.009,k*.023,.118,.068));C.push(s(.008,0,.098,.083));
  return{a:merge(A),b:merge(B),c:merge(C)};});}
const PLUSH={gau:['#B8834F','#F0D3AE'],tho:['#FFB8CC','#FFFFFF']};
/* Vải kẻ sọc nhỏ xám trắng cho mũ */
let SOC2;function soc2Tex(){if(SOC2)return SOC2;const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');x.fillStyle='#F4F4F6';x.fillRect(0,0,64,64);x.fillStyle='#3A3D48';for(let i=0;i<64;i+=16)x.fillRect(i,0,5,64);
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(14,1);t.anisotropy=4;return SOC2=t;}
/* Áo phông in hình trước ngực: ngôi sao vàng lớn, sao nhỏ nhiều màu, chữ nhỏ. Hình tự vẽ. */
const inAoT={};
function inAoTex(nen){if(inAoT[nen])return inAoT[nen];const W=1024,H=512,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const t=new T.CanvasTexture(cv);t.wrapS=T.RepeatWrapping;t.offset.x=.5;t.anisotropy=8;
  const ve=()=>{c.fillStyle=nen;c.fillRect(0,0,W,H);const L=$('#logoImg');if(!L||!L.naturalWidth)return;
    /* in logo DuuDuu trước ngực như áo đồng phục của shop; nén dọc để bù độ giãn của vải trên thân */
    const d=150,cx=W/2,cy=H*.4;c.save();c.translate(cx,cy);c.scale(1,.62);c.beginPath();c.arc(0,0,d/2+6,0,2*PI);c.fillStyle='#FFFFFF';c.fill();c.beginPath();c.arc(0,0,d/2,0,2*PI);c.clip();c.drawImage(L,-d/2,-d/2,d,d);c.restore();
    t.needsUpdate=true;};
  ve();const L=$('#logoImg');if(L&&!L.complete)L.addEventListener('load',ve,{once:true});
  return inAoT[nen]=t;}
/* Áo nỉ in hình vẽ tay: nơ hồng lớn, sao, tim, nơ nhỏ, nét viền đen. Hình tự vẽ, không dùng nhân vật có bản quyền */
const veT={};
function veTayTex(nen){if(veT[nen])return veT[nen];const W=1024,H=512,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  c.fillStyle=nen;c.fillRect(0,0,W,H);const cx=W/2,cy=H*.44,K='#2B2B2B';
  c.save();c.translate(cx,cy+18);c.scale(1.55,.62*1.55);c.lineJoin='round';c.lineCap='round';
  const no=(x,y,s,col)=>{c.save();c.translate(x,y);c.scale(s,s);c.lineWidth=3.2/s*1.2;c.strokeStyle=K;
    for(const k of[-1,1]){c.beginPath();c.moveTo(0,0);c.bezierCurveTo(k*38,-34,k*70,-22,k*62,8);c.bezierCurveTo(k*58,30,k*30,26,0,0);c.fillStyle=col;c.fill();c.stroke();
      c.beginPath();c.moveTo(k*6,6);c.lineTo(k*22,44);c.lineTo(k*34,38);c.closePath();c.fill();c.stroke();}
    c.beginPath();c.ellipse(0,2,11,13,0,0,7);c.fillStyle=col;c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=4/s;c.beginPath();c.moveTo(-40,-8);c.quadraticCurveTo(-30,-20,-18,-14);c.stroke();c.restore();};
  const sao=(x,y,r,col)=>{c.beginPath();for(let i=0;i<10;i++){const a=i/10*2*PI-PI/2,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=K;c.lineWidth=2.4;c.stroke();};
  const tim=(x,y,s,col)=>{c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-14,-2,-10,-14,0,-6);c.bezierCurveTo(10,-14,14,-2,0,8);c.fillStyle=col;c.fill();c.strokeStyle=K;c.lineWidth=2.4/s;c.stroke();c.restore();};
  no(0,-6,1.15,'#F6A9C6');
  sao(-112,-62,15,'#FFE27A');sao(-86,-92,9,'#FFFFFF');sao(118,-70,12,'#FFE27A');
  tim(104,44,1.5,'#F6A9C6');tim(-120,40,1.2,'#A8D8F0');tim(128,-14,.9,'#FFFFFF');
  no(-96,92,.42,'#F6A9C6');no(96,104,.36,'#A8D8F0');
  c.strokeStyle=K;c.lineWidth=2.4;for(const[x,y]of[[-60,-104],[64,-110],[-150,0]]){c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.moveTo(x,y-6);c.lineTo(x,y+6);c.stroke();}
  c.fillStyle='#A8D8F0';for(const[x,y]of[[-30,-112],[-16,-120]]){c.beginPath();c.ellipse(x,y,4,6,.4,0,7);c.fill();}
  c.restore();
  const t=new T.CanvasTexture(cv);t.wrapS=T.RepeatWrapping;t.offset.x=.5;t.anisotropy=8;return veT[nen]=t;}
/* Vải có hoạ tiết: chấm bi, kẻ sọc, ca rô */
const pats={};
function patTex(c,k){const key=c+k;if(pats[key])return pats[key];const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,64,64);
  x.fillStyle=c.toUpperCase()==='#FFFFFF'?'#FF8FB3':'#FFFFFF';
  if(k==='bi')for(const[px,py]of[[16,16],[48,48]]){x.beginPath();x.arc(px,py,7,0,7);x.fill();}
  if(k==='soc')x.fillRect(0,22,64,18);
  if(k==='caro'){x.globalAlpha=.42;x.fillRect(0,0,32,64);x.fillRect(0,0,64,32);x.globalAlpha=1;}
  if(k==='mat'){/* chấm vàng mặt cười xen sao trắng nhỏ */
    for(const[px,py,r]of[[17,18,11],[49,50,11]]){x.fillStyle='#FCEF55';x.beginPath();x.arc(px,py,r,0,7);x.fill();x.fillStyle='#2B2B2B';
      for(const dx of[-4,4]){x.beginPath();x.arc(px+dx,py-2,1.9,0,7);x.fill();}x.strokeStyle='#2B2B2B';x.lineWidth=1.6;x.lineCap='round';x.beginPath();x.arc(px,py+1,4.2,.2*Math.PI,.8*Math.PI);x.stroke();}
    x.fillStyle='#FFFFFF';for(const[px,py]of[[49,15],[15,49]]){x.beginPath();for(let i=0;i<10;i++){const a=i/10*2*Math.PI-Math.PI/2,rr=i%2?2.2:5;x.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr);}x.closePath();x.fill();}}
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;if(k==='mat')t.repeat.set(7,4);else t.repeat.set(12,7);t.anisotropy=4;return pats[key]=t;}
function initHeadGeo(){
  const g=new T.SphereGeometry(HR,40,28);g.scale(HS[0],HS[1],HS[2]);
  /* má phúng phính, cằm nhỏ lại một chút */
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/(HR*HS[1]);if(y<0){const k=1+.05*Math.sin(-y*PI)-.1*y*y;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*(1-.04*y*y));}}
  g.computeVertexNormals();GEO.chead=g;
  const ear=new T.SphereGeometry(HR*.16,12,10);GEO.ears=merge([[ear,onHead(.53*PI,-PI/2,1.0,.6,1,.5)],[ear,onHead(.53*PI,PI/2,1.0,.6,1,.5)]]);
  GEO.collar=new T.TorusGeometry(.052,.017,8,24);GEO.collar.rotateX(PI/2);
}
/* Da và má hồng; mắt, mày, miệng là khối 3D riêng cho nét sắc */
const heads={};
function faceTex(skin,ma=.42){const key=skin+ma;return heads[key]||(heads[key]=(()=>{
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const c=cv.getContext('2d');c.fillStyle=skin;c.fillRect(0,0,512,256);
  for(const k of[-1,1]){const x=128+k*47,y=156,g=c.createRadialGradient(x,y,0,x,y,24);g.addColorStop(0,`rgba(255,105,130,${ma})`);g.addColorStop(.6,`rgba(255,105,130,${ma/2.1})`);g.addColorStop(1,'rgba(255,105,130,0)');c.fillStyle=g;c.fillRect(x-26,y-26,52,52);}
  const t=new T.CanvasTexture(cv);t.anisotropy=4;return t;})());}
class Char{
  constructor(o){
    this.o=o;const g=this.g=new T.Group();this.body=new T.Group();g.add(this.body);this.speed=0;this.phase=Math.random()*6;this.t=Math.random()*9;this.yaw=0;this.wave=0;this.dance=0;
    const ph=(sh,sp)=>rim(new T.MeshPhongMaterial({color:'#FFFFFF',shininess:sh,specular:sp}));
    this.M={shine:new T.MeshBasicMaterial({color:'#FFFFFF'}),lip:ph(30,'#333333'),pk:ph(40,'#333333'),pk2:ph(40,'#333333'),p1:ph(4,'#0A0A0A'),p2:ph(4,'#0A0A0A'),collar:ph(8,'#111111'),feat:ph(90,'#5A5A5A'),skin:ph(14,'#1C1C1C'),head:ph(14,'#1C1C1C'),nose:ph(30,'#333333'),hair:ph(38,'#383838'),top:ph(6,'#121212'),bot:ph(6,'#121212'),shoe:ph(30,'#333333')};
    this.M.hair.side=this.M.top.side=this.M.bot.side=T.DoubleSide;
    const sh=new T.Mesh(GEO.blob,new T.MeshBasicMaterial({map:BLOB,transparent:true,depthWrite:false,fog:false}));sh.rotation.x=-PI/2;sh.position.y=.02;g.add(sh);
    g.scale.setScalar(o.scale||1);
    if(o.ring){const rg=new T.Mesh(new T.RingGeometry(.4,.47,32),new T.MeshBasicMaterial({color:'#7C3CFF',transparent:true,opacity:.9,depthWrite:false}));rg.rotation.x=-PI/2;rg.position.y=.03;g.add(rg);}
    if(!o.noTag){this.tag=document.createElement('div');this.tag.className='tag'+(o.me?' me':'');this.tag.innerHTML='<span class="bb" hidden></span><span class="nm"></span>';this.tag.querySelector('.nm').textContent=o.name;$('#tags').appendChild(this.tag);this.bb=this.tag.querySelector('.bb');}
    this.setLook(o.look);
  }
  setLook(l){this.look=okLook(l);this.outfit=null;this.build(this.look);}
  /* Mặc thử một mẫu trong chợ: giữ tóc, dáng, màu da; quần áo lấy màu từ ảnh mẫu */
  wear(p){const M=this.M;this.build(Object.assign({},this.look,{do:p.kind==='school'?'vay':'quan'}));
    M.top.map=p.cloth;M.bot.map=p.clothB;M.top.color.set('#FFFFFF');M.bot.color.set('#FFFFFF');M.top.needsUpdate=M.bot.needsUpdate=true;this.outfit=p;}
  build(lk){
    const b=this.body,M=this.M;for(let i=b.children.length-1;i>=0;i--)b.remove(b.children[i]);
    const L=DANG[lk.dang]||DANG.vua,H0=L+.045,sc=this.o.scale||1,HY=H0+.43+HR*.95;this.h=HY+HR*(lk.pk==='mumeo'||lk.toc==='haibui'||lk.toc==='xoan'?1.5:1.25);this.tagY=(this.h+.06)*sc;
    M.skin.color.set(lk.da);M.head.color.set('#FFFFFF');M.head.map=faceTex(lk.da,lk.ma);M.nose.color.set(mix(lk.da,'#E5574A',lk.mui??.6));M.feat.color.set('#2E1C18');M.hair.color.set(lk.mauToc);
    const skirt=lk.do==='dam'||lk.do==='vay'||lk.do==='midi';
    M.top.map=lk.inAo==='ve'?veTayTex(lk.ao):lk.inAo?inAoTex(lk.ao):lk.hoa!=='tron'?patTex(lk.ao,lk.hoa):null;M.top.color.set(M.top.map?'#FFFFFF':lk.ao);M.tay=M.tay||rim(new T.MeshPhongMaterial({color:'#FFFFFF',shininess:6,specular:'#121212',side:T.DoubleSide}));M.tay.color.set(lk.ao);M.bot.map=null;M.bot.color.set(lk.duoi);
    M.shoe.color.set(lk.giay||(skirt?(lk.ao==='#FF8FB3'||lk.duoi==='#FF8FB3'?'#E5484D':'#FF8FB3'):'#FFFFFF'));M.lip.color.set(lk.moi||'#A2333F');M.collar.color.set(lk.ao==='#FFFFFF'?'#FF8FB3':'#FFFFFF');
    M.pk.color.set(lk.pk==='mulu'?'#FFFFFF':lk.mauPk);M.pk.map=lk.pk==='mulu'?soc2Tex():null;M.pk.shininess=lk.pk==='mulu'||lk.pk==='nolon'?3:40;M.pk.specular.set(lk.pk==='mulu'?'#111111':'#333333');M.pk2.color.set(lk.pk==='mumeo'?(lk.mauPk==='#FFD866'?'#3E5BA9':'#FFD866'):lk.pk==='hoa'?(lk.mauPk==='#FFD866'?'#FF8FB3':'#FFD866'):'#FFFFFF');
    if(PLUSH[lk.om]){M.p1.color.set(PLUSH[lk.om][0]);M.p2.color.set(PLUSH[lk.om][1]);}
    for(const k in M)M[k].needsUpdate=true;
    const add=(geo,m,x,y,z,par=b)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);par.add(o);return o;};
    const pants=lk.do==='quan'||lk.do==='short',sleeve=lk.do!=='dam';
    {const tr=add(GEO.ctorso,M.top,0,H0,0);tr.scale.z=.78;if(lk.rong)tr.scale.set(1.12,1.02,.86);}
    if(lk.polo){/* áo polo: cổ bẻ hai vạt trắng, nẹp trước có hai cúc */
      const nep=add(new T.BoxGeometry(.03,.13,.008),M.collar,0,H0+.315,.084);nep.rotation.x=-.12;
      for(const y of[.335,.29])add(new T.SphereGeometry(.007,8,6),M.feat,0,H0+y,.091);
      for(const k of[-1,1]){const v=add(new T.BoxGeometry(.06,.045,.008),M.collar,k*.03,H0+.372,.066);v.rotation.set(-.55,k*.35,k*.55);}}
    if(pants)add(GEO.band,M.bot,0,H0,0).scale.set(lk.rong?.9:.98,1,lk.rong?.72:.83);
    if(skirt){const sk=add(skirtGeo(lk.do,L),lk.do==='dam'?M.top:M.bot,0,H0,0);sk.scale.z=.86;if(lk.rong){sk.position.y=H0-.05;sk.scale.set(.95,.8,.82);}}
    if(lk.rong&&skirt){/* gấu áo nỉ bo chun phủ lên cạp váy */const g=new T.TorusGeometry(.112,.026,8,32);g.rotateX(PI/2);const h=add(g,M.tay,0,H0+.012,0);h.scale.set(1.12,1,.9);}
    add(GEO.neck,M.skin,0,H0+.45,0);if(skirt&&!this.outfit)add(GEO.collar,M.collar,0,H0+.392,0).scale.z=.85;
    const hd=this.head=new T.Group();hd.position.set(0,HY,0);b.add(hd);if(lk.mat==='dd')hd.scale.set(.94,1.03,.96);
    const F=faceGeo(lk.mat);add(GEO.chead,M.head,0,0,0,hd);add(F.feat,M.feat,0,0,0,hd);add(F.pink,M.nose,0,0,0,hd);if(F.shine)add(F.shine,M.shine,0,0,0,hd);if(F.lip)add(F.lip,M.lip,0,0,0,hd);
    add(hairGeo(lk.toc),M.hair,0,0,0,hd);if(EARS[lk.toc])add(GEO.ears,M.skin,0,0,0,hd);
    if(lk.pk!=='khong'){const A=accGeo(lk.pk);if(A.a)add(A.a,M.pk,0,0,0,hd);if(A.b)add(A.b,M.pk2,0,0,0,hd);}
    this.om=!!PLUSH[lk.om];if(this.om){const G=plushGeo(lk.om),pg=new T.Group();pg.position.set(0,H0+.19,.135);b.add(pg);add(G.a,M.p1,0,0,0,pg);add(G.b,M.p2,0,0,0,pg);add(G.c,M.feat,0,0,0,pg);}
    this.tail=null;if(lk.toc==='duoi'){const tg=this.tail=new T.Group();tg.position.set(0,HR*.52,-HR*.95);hd.add(tg);add(GEO.tail,M.hair,0,0,0,tg);}
    this.zr=skirt?.19:.12;
    const arm=k=>{const p=new T.Group();p.position.set(k*.112,H0+.34,0);b.add(p);const u=add(GEO.upper,sleeve?(lk.inAo?M.tay:M.top):M.skin,0,0,0,p);if(sleeve)u.scale.set(lk.rong?1.45:1.2,lk.rong?.8:1,lk.rong?1.45:1.2);
      const e=new T.Group();e.position.y=-.22;p.add(e);{const f=add(GEO.fore,lk.daiTay?M.tay:M.skin,0,0,0,e);if(lk.daiTay)f.scale.set(1.35,1,1.35);}add(GEO.hand,M.skin,0,-.215,0,e);return[p,e];};
    [this.aL,this.eL]=arm(-1);[this.aR,this.eR]=arm(1);
    const leg=k=>{const p=new T.Group();p.position.set(k*.064,H0,0);b.add(p);const th=add(thighG(L),pants?M.bot:M.skin,0,0,0,p);if(pants){const k=lk.do==='short'?1.12:1.1;th.scale.set(k,1,k);}
      const kn=new T.Group();kn.position.y=-L*.5;p.add(kn);const s=add(shinG(L),lk.do==='quan'?M.bot:M.skin,0,0,0,kn);if(lk.do==='quan')s.scale.set(1.3,1,1.3);
      add(GEO.foot,M.shoe,0,-L*.5-.02,0,kn);return[p,kn];};
    [this.lL,this.kL]=leg(-1);[this.lR,this.kR]=leg(1);
    this.update(0);
  }
  say(t,ms=3200){if(!this.bb)return;this.bb.textContent=t;this.bb.hidden=false;clearTimeout(this._t);this._t=setTimeout(()=>{this.bb.hidden=true;},ms);}
  update(dt){
    this.t+=dt;const s=this.speed,mv=clamp(s/2.6,0,1);this.phase+=dt*(4.5+s*2.4);
    const p=this.phase,sw=Math.sin(p)*.6*mv,cp=Math.cos(p);
    this.lL.rotation.x=sw;this.lR.rotation.x=-sw;
    this.kL.rotation.x=mv*(.08+.8*Math.max(0,-cp));this.kR.rotation.x=mv*(.08+.8*Math.max(0,cp));
    let axL=-sw*.85,axR=sw*.85,zL=-this.zr,zR=this.zr,eL=-.18-.25*mv,eR=eL,ezL=0,ezR=0;
    let by=Math.abs(cp)*.03*mv,ry=Math.sin(p)*.07*mv,hz=Math.sin(this.t*.9)*.03*(1-mv);
    if(this.om){axL=axR=-.75+sw*.06;zL=.22;zR=-.22;eL=eR=-1.05;ezL=.42;ezR=-.42;}
    if(this.wave>0){this.wave-=dt;axR=-.1;zR=1.35;eR=-.15;ezR=1.25+Math.sin(this.wave*12)*.35;}
    if(this.dance>0){this.dance-=dt;const d=this.dance*7;by=Math.abs(Math.sin(d))*.16;ry=this.dance*5;axL=axR=0;zL=-2.3+Math.sin(d)*.35;zR=2.3-Math.sin(d)*.35;eL=eR=-.2;ezL=-.4;ezR=.4;}
    else if(mv<.05)by=Math.sin(this.t*1.6)*.006;
    this.aL.rotation.set(axL,0,zL);this.aR.rotation.set(axR,0,zR);this.eL.rotation.set(eL,0,ezL);this.eR.rotation.set(eR,0,ezR);
    this.body.position.y=by;this.body.rotation.y=ry;this.head.rotation.set(Math.sin(this.t*.7)*.025,-ry*.6,hz);
    if(this.tail)this.tail.rotation.set(.32+Math.sin(p*2)*.14*mv+(this.dance>0?.5:0),0,Math.sin(p)*.12*mv+Math.sin(this.t*1.3)*.04);
    this.g.rotation.y=this.yaw;
  }
}
function resolve(sc,p,rad=.32){
  const b=sc.bounds;p.x=clamp(p.x,b.minX,b.maxX);p.z=clamp(p.z,b.minZ,b.maxZ);
  for(const c of sc.col){
    if(c.r!==undefined){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=c.r+rad;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
    else if(p.x>c.minX-rad&&p.x<c.maxX+rad&&p.z>c.minZ-rad&&p.z<c.maxZ+rad){const l=p.x-(c.minX-rad),r=(c.maxX+rad)-p.x,t=p.z-(c.minZ-rad),o=(c.maxZ+rad)-p.z,m=Math.min(l,r,t,o);if(m===l)p.x=c.minX-rad;else if(m===r)p.x=c.maxX+rad;else if(m===t)p.z=c.minZ-rad;else p.z=c.maxZ+rad;}
  }
}

/* ---------- Khởi tạo đồ hoạ ---------- */
const app=$('#app'),cv=$('#gl');
let renderer;
try{renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}
catch(e){$('#loadT').textContent='Máy này chưa mở được 3D. Mẹ thử trên trình duyệt Chrome hoặc Safari giúp em nha.';return;}
let PR=Math.min(devicePixelRatio||1,LOW?1.5:2);renderer.setPixelRatio(PR);
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(58,1,.1,400);
const hemi=new T.HemisphereLight('#fff','#888',1);const dirL=new T.DirectionalLight('#fff',.6);scene.add(hemi,dirL);
const view={lookY:1.2,port:false};let STATE=null;
function applyView(){view.port=app.clientHeight>app.clientWidth;view.lookY=view.port?1.900:2.100;if(STATE&&!STATE.zoomed){STATE.dist=view.port?5.200:6.200;STATE.pitch=view.port?.2:.16;}}
function resize(){const w=app.clientWidth,h=app.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?78:56;camera.updateProjectionMatrix();applyView();}
addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(app);resize();
GLOW=new T.CanvasTexture(radial(128,[[0,'rgba(255,255,255,.95)'],[.2,'rgba(255,255,255,.5)'],[.55,'rgba(255,255,255,.1)'],[1,'rgba(255,255,255,0)']]));
BLOB=new T.CanvasTexture(radial(96,[[0,'rgba(70,40,170,.4)'],[.6,'rgba(70,40,170,.22)'],[1,'rgba(70,40,170,0)']]));
initCharGeo();


const scenes={};
let cur,player;
const NAMES=['Mẹ Tít','Mẹ Bin','Mẹ Na','Mẹ Cún','Mẹ Mít','Mẹ Gạo','Mẹ Bơ','Mẹ Nấm','Mẹ Tôm'];
const CHAT=['Chào cả nhà','Đi chợ vui ghê','Gấu trắng to quá','Để em xem thêm','Bé ơi ra đây','Hôm nay chọn đồ cho bé'];
const OWNER=[...P.slice(0,5).map(p=>`${p.name} ${giaChu(p)}, size ${dayKg(p)}${p.thieu.length?' (hết '+p.thieu[0]+(p.thieu.length>1?'–'+p.thieu[p.thieu.length-1]:'')+'kg)':''}, các mẹ ghé sạp ${p.khu} nha!`),
  `Shop đi đơn từ ${SHOP.donToiThieu} bộ, cọc ${SHOP.coc[SHOP.coc.length-1].tien}k khi chốt từ ${SHOP.coc[SHOP.coc.length-1].tu} bộ ạ`,'Mẹ nào cần tư vấn size cứ hỏi em nha, nhắn cân nặng chiều cao của bé là được','Cảm ơn các mẹ đã ghé chợ DuuDuu'];
function populate(s,n,seedShift){
  for(let i=0;i<n;i++){const k=i+seedShift,c=new Char({name:NAMES[k%NAMES.length],look:k<AVP.length&&k%2?AVP[(k+2)%AVP.length].look:randLook(seeded(31+k*17)),scale:1.2});s.root.add(c.g);
    const p=s.wander();resolve(s,p);c.pos=p;c.g.position.set(p.x,0,p.z);c.wait=Math.random()*4;c.tgt=null;s.npcs.push(c);c.tag.style.display='none';}
}
const TV_LOOK=mkLook({dang:'cao',da:'#FBE0CF',mat:'toet',toc:'duoi',mauToc:'#3A2420',do:'quan',inAo:1,rong:1,ao:'#FFFFFF',duoi:'#3E5BA9',giay:'#FFFFFF',pk:'kep',mauPk:'#FCEF55'});
const TV_ZALO=String((DATA.shop&&DATA.shop.zaloTuVan)||SHOP.zalo||'');
function tuVan(s,x,y,z,yaw){const c=new Char({name:'Phanh Phanh · Tư vấn',look:TV_LOOK,scale:1.22});c.look=TV_LOOK;c.build(TV_LOOK);c.pos={x,z};c.g.position.set(x,y,z);c.yaw=yaw;c.fixed=true;s.root.add(c.g);s.npcs.push(c);s.tuvan=c;c.tag.style.display='none';s.col.push({x,z,r:.3});
  const b=document.createElement('button');b.className='tvb';b.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>Chat Zalo tư vấn';
  b.addEventListener('click',()=>{if(!state.lock&&state.mode==='play')moTuVan();});c.tag.insertBefore(b,c.tag.querySelector('.nm'));return c;}
function owner(s,x,y,z,yaw){const c=new Char({name:'Dương Dương',look:OWNER_LOOK,scale:1.3});c.look=OWNER_LOOK;c.build(OWNER_LOOK);c.pos={x,z};c.g.position.set(x,y,z);c.yaw=yaw;c.fixed=true;s.root.add(c.g);s.npcs.push(c);s.owner=c;c.tag.style.display='none';s.col.push({x,z,r:.3});return c;}

function build(){
  scenes.cho=buildMarket();
  populate(scenes.cho,LOW?3:6,0);
  /* Chủ chợ Dương Dương đứng đón khách ngay đầu dãy sạp, vừa vào chợ là thấy */
  owner(scenes.cho,1.8,0,M.ZR-1.4,-.5);
  /* Tư vấn viên Phanh Phanh đứng trước quầy tư vấn cuối chợ */
  tuVan(scenes.cho,M.W-3-2.9,0,M.ZR-M.R*11-5+.5,.25);
  player=new Char({name:$('#who').value||'Bé Bống',look:LOOK,me:true,ring:true,scale:1.15});
  player.tag.style.display='none';
  go('cho',false);
  player.yaw=studio.yaw;player.g.position.set(state.pos.x,0,state.pos.z);
  thumbs();
}
const state={mode:'intro',pos:{x:0,z:0},vel:{x:0,z:0},yaw:0,pitch:.36,dist:6.800,tgt:null,joy:{x:0,y:0,on:false},keys:{},drag:null,lock:0,moved:0,trip:0};
STATE=state;applyView();
const cam={p:new V3(),look:new V3(),t:0,from:new V3(),fromLook:new V3()};
const marker=new T.Mesh(new T.RingGeometry(.24,.34,24),new T.MeshBasicMaterial({color:'#7C3CFF',transparent:true,depthWrite:false,fog:false}));marker.rotation.x=-PI/2;marker.position.y=.04;marker.visible=false;scene.add(marker);

function go(id,fromDoor=true,door){
  const s=scenes[id];
  if(cur){cur.root.visible=false;cur.npcs.forEach(n=>n.tag.style.display='none');}
  cur=s;s.root.visible=true;s.root.add(player.g);
  const sp=door||s.spawn;state.pos.x=sp.x;state.pos.z=sp.z;state.yaw=sp.yaw;state.vel.x=state.vel.z=0;state.tgt=null;marker.visible=false;player.yaw=sp.yaw+PI;
  scene.fog=s.fog;scene.background=s.bg;hemi.color.copy(s.hemi[0]);hemi.groundColor.copy(s.hemi[1]);hemi.intensity=s.hemi[2];dirL.color.set(s.sun[0]);dirL.intensity=s.sun[1];dirL.position.set(...s.sun[2]);
  if(state.mode==='play'){s.npcs.forEach(n=>n.tag.style.display='');snapCam();}
  state.goal=null;state.wantYaw=null;stripGrp=null;$('#strip').hidden=true;renderNav();
}
function snapCam(){const t=camTarget();cam.p.copy(t.p);cam.look.copy(t.l);}
const rc=new T.Raycaster(),tmp=new V3();
function camTarget(){
  const {yaw,pitch}=state,xem=stripGrp&&!state.zoomed&&state.mode==='play';let dist=xem?Math.min(state.dist,4.6):state.dist;const px=state.pos.x,pz=state.pos.z,sx=Math.sin(yaw)*Math.cos(pitch),sz=Math.cos(yaw)*Math.cos(pitch),sy=Math.sin(pitch);
  for(let t=.9;t<=dist;t+=.3){const x=px+sx*t,z=pz+sz*t,y=1.300+sy*t;let hit=false;
    for(const c of cur.col){if(c.r!==undefined){if(y<4.200&&Math.hypot(x-c.x,z-c.z)<c.r+.5){hit=true;break;}}else if(c.tall&&y<5.500&&x>c.minX-.5&&x<c.maxX+.5&&z>c.minZ-.5&&z<c.maxZ+.5){hit=true;break;}}
    const B=cur.camB;if(!hit&&(z>B.zMax||z<B.zMin||Math.abs(x)>B.x))hit=true;
    if(hit){dist=t-.3;break;}}
  const full=state.dist;dist=Math.max(dist,1.500);
  const b=5.400,lift=(full-dist)*.26;
  return{p:new V3(px+sx*dist,Math.min(b,1.300+sy*dist+lift),pz+sz*dist),l:new V3(px,xem?1.6:view.lookY,pz)};
}

/* ---------- Giao diện ---------- */
const SC=new V3();
function project(v,offY=0){SC.set(v.x,v.y+offY,v.z).project(camera);return{x:(SC.x*.5+.5)*app.clientWidth,y:(-SC.y*.5+.5)*app.clientHeight,ok:SC.z<1};}
const close=()=>{$('#dienWrap').hidden=true;$('#sheetWrap').hidden=true;$('#cartWrap').hidden=true;$('#thuWrap').hidden=true;$('#tvWrap').hidden=true;state.lock=0;};
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
['#sheetWrap','#cartWrap','#dienWrap'].forEach(id=>$(id).addEventListener('pointerdown',e=>{if(e.target===$(id))close();}));

/* ---------- Lưu trên máy khách (giỏ, thông tin bé) ---------- */
const store={get(k,d){try{const v=localStorage.getItem('duu.'+k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('duu.'+k,JSON.stringify(v));}catch(e){}}};
const BE=Object.assign({kg:0,cao:0},store.get('be',{}));
const saveBe=()=>store.set('be',BE);
let GIO=store.get('gio',[]).filter(l=>byId[l.id]);
const saveGio=()=>{store.set('gio',GIO);$('#cartN').textContent=GIO.length;};
$('#cartN').textContent=GIO.length;
if(BE.kg)$('#beKg').value=BE.kg;if(BE.cao)$('#beCao').value=BE.cao;

/* ---------- Tạo nhân vật: mẫu có sẵn, dáng, tóc, quần áo, màu ---------- */
let LOOK=okLook(store.get('nv',null));
const studio={on:false,yaw:.35,base:0,rect:null,off:{x:0,y:0},snap:true};
const sameLook=(a,b)=>LOOK_KEYS.every(k=>a[k]===b[k]);
const DICE='<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.500" y="3.500" width="17" height="17" rx="4"/><circle cx="8.500" cy="8.500" r="1.100" fill="currentColor"/><circle cx="15.500" cy="15.500" r="1.100" fill="currentColor"/><circle cx="15.500" cy="8.500" r="1.100" fill="currentColor"/><circle cx="8.500" cy="15.500" r="1.100" fill="currentColor"/><circle cx="12" cy="12" r="1.100" fill="currentColor"/></svg>';
function setLook(l,hi){LOOK=okLook(l);store.set('nv',LOOK);if(player){player.setLook(LOOK);if(hi)player.wave=1.2;}renderAv();}
function avUI(){
  const pre=$('#avPre');pre.innerHTML='';
  AVP.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='pc';b.dataset.p=v.id;b.innerHTML='<img alt=""><span></span>';b.lastChild.textContent=v.ten;b.addEventListener('click',()=>setLook(v.look,1));pre.appendChild(b);});
  const rnd=document.createElement('button');rnd.type='button';rnd.className='pc rnd';rnd.innerHTML=DICE+'<span>Ngẫu nhiên</span>';rnd.addEventListener('click',()=>setLook(randLook(),1));pre.appendChild(rnd);
  const group=(id,key,list,sw)=>{const w=$(id);w.innerHTML='';list.forEach(([v,t])=>{const b=document.createElement('button');b.type='button';b.dataset.v=v;
    if(sw){b.style.setProperty('--c',v);b.setAttribute('aria-label',t);b.title=t;}else b.textContent=t;
    b.addEventListener('click',()=>setLook(Object.assign({},LOOK,{[key]:v})));w.appendChild(b);});};
  group('#avDang','dang',AV.dang);group('#avDa','da',AV.da,1);group('#avToc','toc',AV.toc);group('#avMauToc','mauToc',AV.mauToc,1);
  group('#avDo','do',AV.do);group('#avAo','ao',AV.mau,1);group('#avDuoi','duoi',AV.mau,1);
  group('#avMat','mat',AV.mat);group('#avHoa','hoa',AV.hoa);group('#avPk','pk',AV.pk);group('#avMauPk','mauPk',AV.mau,1);group('#avOm','om',AV.om);
}
function renderAv(){
  const pick=(id,v)=>$(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));
  pick('#avDang',LOOK.dang);pick('#avDa',LOOK.da);pick('#avToc',LOOK.toc);pick('#avMauToc',LOOK.mauToc);pick('#avDo',LOOK.do);pick('#avAo',LOOK.ao);pick('#avDuoi',LOOK.duoi);
  pick('#avMat',LOOK.mat);pick('#avHoa',LOOK.hoa);pick('#avPk',LOOK.pk);pick('#avMauPk',LOOK.mauPk);pick('#avOm',LOOK.om);$('#avMauPkW').hidden=LOOK.pk==='khong';
  $('#avPre').querySelectorAll('[data-p]').forEach(b=>b.setAttribute('aria-pressed',sameLook(AVP.find(v=>v.id===b.dataset.p).look,LOOK)));
  $('#avAoT').textContent=LOOK.do==='dam'?'Màu đầm':'Màu áo';$('#avDuoiW').hidden=LOOK.do==='dam';$('#avDuoiT').textContent=LOOK.do==='vay'?'Màu váy':'Màu quần';
}
const TABS=[...document.querySelectorAll('#avTabs [role="tab"]')];
function selTab(i){TABS.forEach((t,j)=>{t.setAttribute('aria-selected',i===j);t.tabIndex=i===j?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=i!==j;});}
TABS.forEach((t,i)=>{t.addEventListener('click',()=>selTab(i));t.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const j=(i+(e.key==='ArrowRight'?1:TABS.length-1))%TABS.length;selTab(j);TABS[j].focus();});});
avUI();renderAv();selTab(0);
{const n=store.get('ten','');if(n)$('#who').value=n;}
/* Ảnh nhỏ cho các mẫu nhân vật: vẽ bằng chính nhân vật 3D */
function thumbs(){
  try{
    const W=270,H=324,S=2,w=W*S,h=H*S,rt=new T.WebGLRenderTarget(w,h),sc=new T.Scene(),cm=new T.PerspectiveCamera(30,W/H,.1,20);
    sc.add(new T.HemisphereLight('#FFFFFF','#D8C2B0',.95));const dl=new T.DirectionalLight('#FFFFFF',.55);dl.position.set(.5,.9,.7);sc.add(dl);
    cm.position.set(.85,.98,2.75);cm.lookAt(0,.8,0);
    const buf=new Uint8Array(w*h*4),big=document.createElement('canvas');big.width=w;big.height=h;const bc=big.getContext('2d'),img=bc.createImageData(w,h);
    const out=document.createElement('canvas');out.width=W;out.height=H;const oc=out.getContext('2d');
    const ca=renderer.getClearAlpha(),cc=renderer.getClearColor(new T.Color());renderer.setClearColor(0x000000,0);
    AVP.forEach(v=>{const c=new Char({name:'',look:v.look,noTag:true});c.yaw=.35;c.update(0);sc.add(c.g);
      renderer.setRenderTarget(rt);renderer.render(sc,cm);renderer.readRenderTargetPixels(rt,0,0,w,h,buf);
      const row=w*4;for(let y=0;y<h;y++)img.data.set(buf.subarray((h-1-y)*row,(h-y)*row),y*row);
      bc.putImageData(img,0,0);oc.clearRect(0,0,W,H);oc.drawImage(big,0,0,W,H);
      const im=$(`#avPre [data-p="${v.id}"] img`);if(im)im.src=out.toDataURL('image/png');sc.remove(c.g);});
    renderer.setRenderTarget(null);renderer.setClearColor(cc,ca);rt.dispose();
  }catch(e){console.warn(e);}
}
/* Khung tạo nhân vật che một phần màn hình: dời hình 3D sang phần còn trống */
function measureStudio(){const el=$('#enter'),st=$('#studio');if(!el||st.hidden){studio.rect=null;return;}const a=el.getBoundingClientRect(),r=app.getBoundingClientRect();studio.rect={left:a.left-r.left,top:a.top-r.top};}
if(window.ResizeObserver)new ResizeObserver(measureStudio).observe($('#enter'));addEventListener('resize',measureStudio);
function studioView(){const w=app.clientWidth,h=app.clientHeight,r=studio.rect;if(!r)return{x:0,y:0,v:1,hz:1};
  if(r.left>w*.3)return{x:(w-r.left)/2,y:0,v:1,hz:r.left/w};
  const top=Math.max(r.top,h*.22);return{x:0,y:(h-top)/2,v:top/h,hz:1};}
const sP=new V3(),sL=new V3();
function studioCam(dt){
  const v=studioView(),sc=player.g.scale.x,Hc=player.h*sc,t=Math.tan(camera.fov*PI/360);
  const d=clamp(Math.max(Hc/(.6*v.v*2*t),.9*sc/(v.hz*2*t*camera.aspect)),1.6,9);
  const base=studio.on?studio.base:(REDUCED?0:Math.sin(time*.22)*.12);
  sP.set(state.pos.x+Math.sin(base)*d,Hc*.55+d*.07,state.pos.z+Math.cos(base)*d);sL.set(state.pos.x,Hc*.5,state.pos.z);
  if(studio.snap){cam.p.copy(sP);cam.look.copy(sL);}else{const a=1-Math.exp(-dt*6);cam.p.lerp(sP,a);cam.look.lerp(sL,a);}
  camera.position.copy(cam.p);camera.lookAt(cam.look);
}
function applyOffset(dt){
  const on=state.mode==='intro'||studio.on,v=on?studioView():{x:0,y:0},o=studio.off;
  if(studio.snap){o.x=v.x;o.y=v.y;studio.snap=false;}else{const a=1-Math.exp(-dt*(state.mode==='fly'?2.4:7));o.x=lerp(o.x,v.x,a);o.y=lerp(o.y,v.y,a);}
  if(!on&&Math.abs(o.x)<.5&&Math.abs(o.y)<.5){if(camera.view&&camera.view.enabled)camera.clearViewOffset();}
  else{const w=app.clientWidth,h=app.clientHeight;camera.setViewOffset(w,h,o.x,o.y,w,h);}
}
function openStudio(){
  if(state.mode!=='play'||state.lock)return;studio.on=true;state.lock=1;state.tgt=null;state.goal=null;marker.visible=false;stickEnd();
  $('#beKg').value=BE.kg||'';studio.base=state.yaw;studio.yaw=state.yaw+.35;$('#hud').hidden=true;$('#studio').hidden=false;renderAv();measureStudio();
}
function closeStudio(){studio.on=false;state.lock=0;$('#studio').hidden=true;$('#hud').hidden=false;studio.rect=null;}

/* ---------- Bảng chi tiết mẫu ---------- */
let openP=null,pickKg=14,pickMau=0;
function galFor(p){
  const g=$('#sGal');g.innerHTML='';g.scrollLeft=0;
  if(p.anh.length)p.anh.forEach((src,i)=>{const im=document.createElement('img');im.src=src;im.alt=`${p.name}, ảnh ${i+1}`;im.loading=i?'lazy':'eager';g.appendChild(im);});
  else{const c=document.createElement('canvas');c.className='draw';g.appendChild(c);requestAnimationFrame(()=>{c.width=c.clientWidth*2;c.height=c.clientHeight*2;drawThumb(c,p);});
    const n=document.createElement('span');n.className='noimg';n.textContent='Hình minh hoạ, shop chưa thêm ảnh';g.appendChild(n);}
  g.dataset.n=p.anh.length;
}
function openSheet(p){
  openP=p;state.lock=1;state.tgt=null;marker.visible=false;
  $('#sName').textContent=p.name;$('#sPrice').textContent=giaChu(p);
  const meta=[p.ma,'Size '+dayKg(p)];if(p.thieu.length)meta.push('hết '+(p.thieu.length>1?p.thieu[0]+'–'+p.thieu[p.thieu.length-1]:p.thieu[0])+'kg');
  if(p.tinhTrang==='le')meta.push('lẻ size');if(p.tinhTrang==='it')meta.push('còn vài ri');
  $('#sMeta').textContent=meta.filter(Boolean).join(' · ');
  $('#sCap').textContent=p.chu;$('#sCap').hidden=!p.chu;
  pickMau=0;renderMau();
  pickKg=BE.kg||clamp(14,p.tu,p.den);$('#sHao').checked=false;
  galFor(p);renderKg();$('#sheetWrap').hidden=false;$('#sheetWrap .sheet').scrollTop=0;
}
function renderMau(){
  const p=openP,w=$('#sMau');w.innerHTML='';$('#sMauWrap').hidden=!p.mau.length;
  p.mau.forEach((m,i)=>{const b=document.createElement('button');b.textContent=m.ten;b.setAttribute('aria-pressed',i===pickMau);
    b.addEventListener('click',()=>{pickMau=i;renderMau();if(m.anh!==undefined){const im=$('#sGal').children[m.anh];if(im)$('#sGal').scrollTo({left:im.offsetLeft-$('#sGal').offsetLeft,behavior:REDUCED?'auto':'smooth'});}});w.appendChild(b);});
}
function renderKg(){
  const p=openP,f=hopSize(p,pickKg);$('#kgVal').textContent=pickKg+'kg';
  $('#kgMinus').disabled=pickKg<=3;$('#kgPlus').disabled=pickKg>=50;
  const thieu=p.thieu.length>1?`${p.thieu[0]}–${p.thieu[p.thieu.length-1]}kg`:`${p.thieu[0]}kg`;
  const msg={ok:`Mẫu này có size cho bé ${pickKg}kg`+(p.tinhTrang==='le'?'. Hàng lẻ size, shop sẽ nhắn lại nếu hết.':''),
    ngoai:`Mẫu này chỉ có size ${dayKg(p)}, chưa có cho bé ${pickKg}kg`,thieu:`Mẫu này hết size ${thieu} rồi mẹ ơi`,het:'Mẫu này đã hết hàng'}[f];
  const e=$('#sFit');e.textContent=msg;e.dataset.ok=f==='ok';
  $('#buy').disabled=f!=='ok';$('#buy').textContent=f==='ok'?`Thêm ${pickKg}kg vào giỏ`:'Chưa có size này';
}
$('#kgMinus').addEventListener('click',()=>{pickKg=Math.max(3,pickKg-1);renderKg();});
$('#kgPlus').addEventListener('click',()=>{pickKg=Math.min(50,pickKg+1);renderKg();});
$('#tryOn').addEventListener('click',()=>{const p=openP;close();player.wear(p);batDauDien(p);});

/* ---------- Poster "Bé lên sàn diễn": chọn một mẫu để bé mặc thử ngay ---------- */
function moSanDien(){
  if(state.lock||state.mode!=='play')return;state.lock=1;state.tgt=null;state.goal=null;marker.visible=false;
  const kg=BE.kg,ds=P.filter(p=>!p.thu&&p.tinhTrang!=='het'),hang=p=>!kg?0:hopSize(p,kg)==='ok'?0:1;
  ds.sort((a,b)=>hang(a)-hang(b)||(b.anh.length?1:0)-(a.anh.length?1:0));
  const huong='Chạm một mẫu, bé mặc vào đi một vòng sàn diễn để mẹ xem có ưng không.';
  $('#dSub').textContent=kg?`Mẫu vừa bé ${kg}kg xếp lên trước. ${huong}`:huong;
  const box=$('#dList');box.innerHTML='';
  ds.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='dc'+(p.anh.length?' photo':'');
    const im=document.createElement('img');im.src=thumbOf(p);im.alt='';im.loading='lazy';const t=document.createElement('span');t.textContent=p.name;const sm=document.createElement('small');sm.textContent=giaChu(p);t.append(sm);b.append(im,t);
    let nhan=p.name+', '+giaChu(p);
    if(kg){const f=hopSize(p,kg),e=document.createElement('em');e.className='fitb';e.textContent=f==='ok'?'Vừa bé':`Không có ${kg}kg`;b.append(e);if(f!=='ok')b.classList.add('ko');nhan+=', '+e.textContent;}
    b.setAttribute('aria-label','Mặc thử '+nhan);
    b.addEventListener('click',()=>{close();player.wear(p);batDauDien(p);});box.appendChild(b);});
  $('#dienWrap').hidden=false;$('#dienWrap .sheet').scrollTop=0;
}
const dienHot=document.createElement('button');dienHot.className='hot';dienHot.style.display='none';dienHot.setAttribute('aria-label','Bé lên sàn diễn: chọn mẫu mặc thử');
dienHot.innerHTML='Mặc thử<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
dienHot.addEventListener('click',moSanDien);$('#tags').appendChild(dienHot);

/* ---------- Sàn diễn: bé đi vài bước về phía máy quay, tạo dáng, rồi mẹ quyết có mua không ---------- */
let THAM=null;
function thamTex(){
  if(THAM)return THAM;const cv=document.createElement('canvas');cv.width=128;cv.height=512;const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,128,0);g.addColorStop(0,'#FF8FD3');g.addColorStop(.5,'#FFC9EC');g.addColorStop(1,'#FF8FD3');c.fillStyle=g;c.fillRect(0,0,128,512);
  c.fillStyle='#FFFFFF';c.fillRect(0,0,9,512);c.fillRect(119,0,9,512);
  for(let y=16;y<512;y+=40){for(const x of[22,106]){c.beginPath();c.arc(x,y,5,0,2*PI);c.fillStyle='#FFF6C9';c.fill();}}
  return THAM=texOf(cv);
}
function batDauDien(p){
  if(state.show)return;
  const L=3.2,dx=Math.sin(state.yaw),dz=Math.cos(state.yaw),m=new T.Mesh(new T.PlaneGeometry(1.2,L),new T.MeshBasicMaterial({map:thamTex(),fog:false}));
  m.rotation.order='YXZ';m.rotation.set(-PI/2,state.yaw,0);
  m.position.set(state.pos.x+dx*(L/2-.6),.016,state.pos.z+dz*(L/2-.6));cur.root.add(m);
  state.show={t:0,p,m,pitch:state.pitch,di:1.35};state.pitch=.24;state.lock=1;state.tgt=null;state.goal=null;marker.visible=false;
  $('#hud').classList.add('show');ticker(`${player.o.name} lên sàn diễn với ${p.name}`);
}
function stepShow(dt){
  const sh=state.show;sh.t+=dt;const dx=Math.sin(state.yaw),dz=Math.cos(state.yaw),di=sh.t<sh.di;
  const ox=state.pos.x,oz=state.pos.z;if(di){state.pos.x+=dx*1.45*dt;state.pos.z+=dz*1.45*dt;resolve(cur,state.pos);}
  player.speed=Math.hypot(state.pos.x-ox,state.pos.z-oz)/Math.max(dt,.001);
  player.yaw=angLerp(player.yaw,Math.atan2(dx,dz),1-Math.exp(-dt*9));
  if(!sh.wv&&sh.t>sh.di+.2){sh.wv=1;player.wave=1.4;}
  if(!sh.ht&&sh.t>sh.di+.6){sh.ht=1;for(let i=0;i<6;i++)setTimeout(()=>heart(player),i*90);}
  player.g.position.set(state.pos.x,0,state.pos.z);player.update(dt);
  if(sh.t>sh.di+1.9){cur.root.remove(sh.m);sh.m.geometry.dispose();sh.m.material.dispose();state.pitch=sh.pitch;state.show=null;state.lock=0;$('#hud').classList.remove('show');moThu(sh.p);}
}
/* Vẽ riêng nhân vật lên nền trong suốt */
function anhNhanVat(W,H,ch=player){
  const S=2,w=W*S,h=H*S,rt=new T.WebGLRenderTarget(w,h),sc=new T.Scene();
  sc.add(new T.HemisphereLight('#FFFFFF','#D8C2B0',.95));const dl=new T.DirectionalLight('#FFFFFF',.6);dl.position.set(.5,.9,.8);sc.add(dl);
  const g=ch.g,par=g.parent,pos=g.position.clone(),ry=g.rotation.y,an=[];
  g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.type==='RingGeometry'&&o.visible){o.visible=false;an.push(o);}});
  sc.add(g);g.position.set(0,0,0);g.rotation.y=.28;g.updateMatrixWorld(true);
  const b=new T.Box3().setFromObject(g),hh=b.max.y-b.min.y,cy=(b.max.y+b.min.y)/2,fov=28,d=(hh*1.16/2)/Math.tan(fov/2*PI/180);
  const cm=new T.PerspectiveCamera(fov,W/H,.1,30);cm.position.set(0,cy+.05,d);cm.lookAt(0,cy,0);
  const ca=renderer.getClearAlpha(),cc=renderer.getClearColor(new T.Color());renderer.setClearColor(0x000000,0);
  renderer.setRenderTarget(rt);renderer.render(sc,cm);const buf=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(rt,0,0,w,h,buf);
  renderer.setRenderTarget(null);renderer.setClearColor(cc,ca);rt.dispose();
  par.add(g);g.position.copy(pos);g.rotation.y=ry;an.forEach(o=>o.visible=true);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d'),im=c.createImageData(w,h),row=w*4;
  for(let y=0;y<h;y++)im.data.set(buf.subarray((h-1-y)*row,(h-y)*row),y*row);c.putImageData(im,0,0);return cv;
}
/* Sau sàn diễn: đặt hình bé mặc thử cạnh ảnh thật để mẹ quyết có mua không.
   Bé 3D chỉ là hình minh hoạ, không phải ảnh con thật, nên không có nút lưu hay gửi ảnh. */
let THU=null;
function moThu(p){
  THU=p;state.lock=1;state.tgt=null;marker.visible=false;
  let be='';try{be=anhNhanVat(300,420).toDataURL('image/png');}catch(e){console.warn(e);}
  const ib=$('#thBe');ib.src=be;ib.alt=`${player.o.name} mặc thử ${p.name}`;ib.parentElement.hidden=!be;$('#thBeCap').textContent=`${player.o.name} mặc thử`;
  const is=$('#thSP');is.src=thumbOf(p);is.alt=p.anh.length?`Ảnh thật ${p.name}`:`Hình minh hoạ ${p.name}`;$('#thSPCap').textContent=p.anh.length?'Ảnh thật của shop':'Hình minh hoạ';
  $('#thName').textContent=p.name;$('#thPrice').textContent=giaChu(p);$('#thMeta').textContent=[p.ma,'Size '+dayKg(p)].filter(Boolean).join(' · ');
  const kg=BE.kg,f=kg?hopSize(p,kg):p.tinhTrang==='het'?'het':'',e=$('#thFit');
  e.hidden=!f;e.dataset.ok=f==='ok';
  e.textContent={ok:`Mẫu này có size cho bé ${kg}kg`,ngoai:`Mẫu này chỉ có size ${dayKg(p)}, chưa có cho bé ${kg}kg`,thieu:`Mẫu này hết size ${kg}kg rồi mẹ ơi`,het:'Mẫu này đã hết hàng'}[f]||'';
  const mua=!f||f==='ok';$('#thMua').textContent=mua?'Chọn size, thêm giỏ':'Xem chi tiết mẫu';
  $('#thMua').className='btn '+(mua?'main':'ghost');$('#thKhac').className='btn '+(mua?'ghost':'main');
  $('#thuWrap').hidden=false;$('#thuWrap .sheet').scrollTop=0;
}
$('#thMua').addEventListener('click',()=>{const p=THU;close();if(p)openSheet(p);});
$('#thKhac').addEventListener('click',()=>{close();moSanDien();});

/* ---------- Bảng chat Zalo với tư vấn viên ---------- */
const soDep=v=>{const d=v.replace(/\D/g,'');return d.length===10?d.replace(/(\d{4})(\d{3})(\d{3})/,'$1 $2 $3'):v;};
function tinTuVan(){
  const l=['Chào Phanh Phanh, mình cần tư vấn ở Chợ DuuDuu ạ.'];
  if(BE.kg)l.push(`Bé nhà mình nặng ${BE.kg}kg${BE.cao?`, cao ${BE.cao}cm`:''}.`);
  const p=openP||THU||(GIO.length?byId[GIO[GIO.length-1].id]:null);
  if(p)l.push(`Mình đang xem mẫu ${p.name}${p.ma?` (${p.ma})`:''}, giá ${giaChu(p)}.`);
  l.push(p?(BE.kg?'Bé mặc size nào vừa, mẫu này còn màu nào ạ?':'Shop tư vấn giúp mình chọn size với ạ.'):'Shop tư vấn giúp mình mẫu và size cho bé với ạ.');
  return l.join('\n');
}
let TV_ANH=null;
function moTuVan(){
  if(!cur.tuvan)return;state.lock=1;state.tgt=null;marker.visible=false;
  if(!TV_ANH){try{TV_ANH=anhNhanVat(160,200,cur.tuvan).toDataURL('image/png');}catch(e){}}
  if(TV_ANH)$('#tvAv').src=TV_ANH;
  $('#tvSo').textContent=TV_ZALO?soDep(TV_ZALO):'Chưa có số';
  const z=$('#tvZalo');z.hidden=!TV_ZALO;if(TV_ZALO)z.href='https://zalo.me/'+TV_ZALO.replace(/\D/g,'');
  $('#tvMsg').value=tinTuVan();$('#tvCopy').textContent='Chép tin nhắn';$('#tvWrap').hidden=false;
  cur.tuvan.say('Mẹ nhắn em qua Zalo nha!',3000);
}
$('#tvCopy').addEventListener('click',async()=>{const t=$('#tvMsg').value;let ok=false;
  try{await navigator.clipboard.writeText(t);ok=true;}catch(e){}
  if(!ok){const a=$('#tvMsg');a.focus();a.select();try{ok=document.execCommand('copy');}catch(e){}}
  $('#tvCopy').textContent=ok?'Đã chép ✓':'Mẹ chép tay giúp em';});
$('#buy').addEventListener('click',()=>{const p=openP;if(hopSize(p,pickKg)!=='ok')return;
  const m=p.mau[pickMau];GIO.push({id:p.id,kg:pickKg,mau:m?m.ten:'',hao:$('#sHao').checked});saveGio();
  if(!BE.kg){BE.kg=pickKg;saveBe();capNhatBe();}
  close();player.wear(p);player.dance=2.2;burst();
  ticker(`Đã thêm ${p.name} ${pickKg}kg vào giỏ (${GIO.length} bộ)`);if(cur.owner)cur.owner.say(GIO.length<SHOP.donToiThieu?`Shop đi đơn từ ${SHOP.donToiThieu} bộ, mẹ chọn thêm nha!`:'Cảm ơn mẹ nha, mở giỏ để gửi đơn cho shop ạ!',4000);});

/* ---------- Giỏ hàng và tin chốt đơn ---------- */
const theoMoc=(moc,n)=>{for(const r of [...moc].sort((a,b)=>b.tu-a.tu))if(n>=r.tu)return r.tien;return 0;};
const cocCan=n=>theoMoc(SHOP.coc,n);
const shipCan=n=>!n?0:typeof SHOP.ship==='number'?SHOP.ship:theoMoc(SHOP.ship,n);
function tinhGio(){
  const n=GIO.length,hang=GIO.reduce((t,l)=>t+byId[l.id].price,0),ship=shipCan(n),tong=hang+ship;
  const daCoc=Math.max(0,parseInt($('#cDaCoc').value,10)||0),can=cocCan(n),them=Math.max(0,can-daCoc),cod=Math.max(0,tong-daCoc-them);
  return{n,hang,ship,tong,daCoc,can,them,cod};
}
function tinNhan(t){
  const L=[`Chốt đơn chợ ${SHOP.ten}`,`Tên: ${player.o.name}`];
  const cao=parseInt($('#cCao').value,10);if(cao)L.push(`Bé cao: ${cao}cm`);
  GIO.forEach((l,i)=>{const p=byId[l.id];L.push(`${i+1}. ${p.ma?p.ma+' ':''}${p.name}${l.mau?' ('+l.mau+')':''} · ${l.kg}kg${l.hao?' (trừ hao)':''} · ${giaChu(p)}`);});
  L.push(`Tiền hàng: ${t.hang}k`,`Ship (dự kiến): ${t.ship}k`,`Tổng: ${t.tong}k`);
  if(t.daCoc)L.push(`Đã cọc trước: ${t.daCoc}k`);
  if(t.them)L.push(`${t.daCoc?'Cọc thêm':'Cọc'}: ${t.them}k (chuyển khoản)`);
  L.push(`Còn lại khi nhận hàng (COD): ${t.cod}k`);
  return L.join('\n');
}
function renderGio(){
  const box=$('#cList');box.innerHTML='';const has=GIO.length>0;
  $('#cEmpty').hidden=has;['#cFields','#cSum','#cMsgWrap','#cAct','#cHow','#cClear'].forEach(s=>$(s).hidden=!has);
  GIO.forEach((l,i)=>{const p=byId[l.id],li=document.createElement('li');
    const mm=p.mau.find(m=>m.ten===l.mau),im=document.createElement('img');im.src=mm&&mm.anh!==undefined&&p.anh[mm.anh]?p.anh[mm.anh]:thumbOf(p);im.alt='';
    const d=document.createElement('div');const b=document.createElement('b');b.textContent=p.name;const sm=document.createElement('small');
    sm.textContent=[p.ma,l.kg+'kg'+(l.hao?' (trừ hao)':''),l.mau].filter(Boolean).join(' · ');d.append(b,sm);
    const pr=document.createElement('span');pr.className='pr';pr.textContent=giaChu(p);
    const x=document.createElement('button');x.className='rm';x.setAttribute('aria-label','Bỏ '+p.name+' '+l.kg+'kg');x.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.addEventListener('click',()=>{GIO.splice(i,1);saveGio();renderGio();});
    li.append(im,d,pr,x);box.appendChild(li);});
  if(!has)return;
  const t=tinhGio(),sum=$('#cSum');sum.innerHTML='';
  const row=(k,v,cls)=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;if(cls){dt.className=dd.className=cls;}sum.append(dt,dd);};
  row(`Tiền hàng (${t.n} bộ)`,t.hang+'k');row('Ship dự kiến',t.ship+'k');row('Tổng',t.tong+'k','big');
  if(t.daCoc)row('Đã cọc trước','−'+t.daCoc+'k');
  if(t.them)row(t.daCoc?'Cọc thêm (chuyển khoản)':'Cọc (chuyển khoản)',t.them+'k','hl');
  row('Còn lại khi nhận hàng',t.cod+'k','big');
  const thieu=t.n<SHOP.donToiThieu&&!t.daCoc,w=$('#cWarn');
  w.hidden=!thieu;w.textContent=`Shop đi đơn từ ${SHOP.donToiThieu} bộ, mẹ chọn thêm ${SHOP.donToiThieu-t.n} bộ nữa nha. Nếu đã có đơn cọc trước đó, mẹ điền số tiền đã cọc ở trên.`;
  $('#cSend').disabled=thieu;$('#cZalo').hidden=thieu||!SHOP.zalo;if(SHOP.zalo)$('#cZalo').href='https://zalo.me/'+String(SHOP.zalo).replace(/\D/g,'');
  $('#cMsg').value=tinNhan(t);
  $('#cHow').textContent=(SHOP.zalo?`Mẹ chạm Chép tin nhắn, chạm Mở Zalo shop rồi dán vào khung chat và gửi. Zalo shop: ${SHOP.zalo}. `:'Mẹ chạm Chép tin nhắn rồi dán vào Zalo của shop và gửi. ')+'Shop kiểm tra lại size còn hàng và báo phí ship chính xác, mẹ chuyển khoản cọc sau khi shop xác nhận nha.';
}
['#cCao','#cDaCoc'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='#cCao'){BE.cao=parseInt($('#cCao').value,10)||0;saveBe();}renderGio();}));
async function chep(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){}
  const ta=$('#cMsg');$('#cMsgWrap').open=true;ta.focus();ta.select();try{return document.execCommand('copy');}catch(e){return false;}
}
$('#cSend').addEventListener('click',async()=>{
  const ok=await chep($('#cMsg').value);
  ticker(ok?'Đã chép tin. Mẹ chạm Mở Zalo shop rồi dán vào khung chat nha':'Chưa chép được, mẹ giữ tay vào ô tin nhắn để chép giúp em');
  if(!ok)$('#cMsgWrap').open=true;
});
let xoaT;$('#cClear').addEventListener('click',e=>{const b=e.currentTarget,dat=()=>{delete b.dataset.ok;b.textContent='Xoá giỏ';};if(b.dataset.ok){clearTimeout(xoaT);dat();GIO=[];saveGio();renderGio();return;}b.dataset.ok='1';b.textContent='Chạm lần nữa để xoá hết';xoaT=setTimeout(dat,3000);});
function openCart(){$('#cCao').value=BE.cao||'';renderGio();$('#cartWrap').hidden=false;state.lock=1;state.tgt=null;marker.visible=false;}
function burst(){for(let i=0;i<9;i++)setTimeout(()=>heart(player),i*70);}
const HEART='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.600 4.600 0 0 1 8-3 4.600 4.600 0 0 1 8 3c0 6-8 11-8 11z"/></svg>';
function heart(c){const v=project({x:c.g.position.x,y:1.900,z:c.g.position.z}),d=document.createElement('div');d.className='hrt';d.innerHTML=HEART;d.style.left=v.x-13+(Math.random()-.5)*50+'px';d.style.top=v.y+'px';d.style.setProperty('--dx',(Math.random()-.5)*80+'px');$('#tags').appendChild(d);setTimeout(()=>d.remove(),1600);}
let tickT;function ticker(t){const e=$('#ticker');e.textContent=t;e.classList.add('on');clearTimeout(tickT);tickT=setTimeout(()=>e.classList.remove('on'),3800);}
document.querySelectorAll('#acts button').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.a;
  if(a==='dress'){openStudio();return;}
  if(a==='wave')player.wave=1.400;
  if(a==='heart')for(let i=0;i<5;i++)setTimeout(()=>heart(player),i*90);
  if(a==='dance')player.dance=2.400;
  if(a==='ask'){player.say(`Còn size ${BE.kg||16}kg không ạ?`);if(cur.owner)setTimeout(()=>cur.owner.say('Mẹ chạm nút Xem rồi chọn cân nặng của bé để xem size nha',3600),1100);}
}));
$('#cart').addEventListener('click',openCart);
let stripGrp=null;
function thumbOf(p){if(p.anh.length)return p.anh[0];if(!p.thumb){const c=document.createElement('canvas');c.width=224;c.height=156;drawThumb(c,p);p.thumb=c.toDataURL('image/png');}return p.thumb;}
function showStrip(grp){
  if(grp===stripGrp)return;stripGrp=grp;const w=$('#strip');if(!grp){w.hidden=true;return;}
  $('#stripT').textContent=grp;const box=$('#cards');box.innerHTML='';box.scrollLeft=0;
  ((NHOM.find(n=>'Sạp '+n.ten===grp)||{}).ps||[...new Set(cur.items.filter(i=>i.grp===grp).map(i=>i.p))]).forEach(p=>{const b=document.createElement('button');b.className='card'+(p.anh.length?' photo':'');b.setAttribute('aria-label',p.name+', '+giaChu(p));
    const im=document.createElement('img');im.src=thumbOf(p);im.alt='';const t=document.createElement('span');t.textContent=p.name;const sm=document.createElement('small');sm.textContent=giaChu(p);t.append(sm);b.append(im,t);
    if(BE.kg){const f=hopSize(p,BE.kg),e=document.createElement('em');e.className='fitb';e.textContent=f==='ok'?'Vừa bé':f==='het'?'Hết hàng':`Không có ${BE.kg}kg`;b.append(e);if(f!=='ok')b.classList.add('ko');b.setAttribute('aria-label',p.name+', '+giaChu(p)+', '+e.textContent);}
    b.addEventListener('click',()=>openSheet(p));box.appendChild(b);});
  w.hidden=false;
}
/* Tự đi: tìm đường trên lưới 1m, tránh các khối, bục và quầy */
const biChan=(s,x,z)=>{for(const c of s.col){if(c.r!==undefined){if(Math.hypot(x-c.x,z-c.z)<c.r+.5)return true;}else if(x>c.minX-.5&&x<c.maxX+.5&&z>c.minZ-.5&&z<c.maxZ+.5)return true;}return false;};
function thay(s,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/.35);for(let i=1;i<n;i++){const t=i/n;if(biChan(s,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
function timDuong(a,b){
  const s=cur,B=s.bounds,nx=Math.floor(B.maxX-B.minX)+1,nz=Math.floor(B.maxZ-B.minZ)+1,id=(i,j)=>j*nx+i,px=i=>B.minX+i,pz=j=>B.minZ+j;
  if(!s.luoi){s.luoi=new Uint8Array(nx*nz);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)s.luoi[id(i,j)]=biChan(s,px(i),pz(j))?1:0;}
  const gan=p=>{const ci=clamp(Math.round(p.x-B.minX),0,nx-1),cj=clamp(Math.round(p.z-B.minZ),0,nz-1);for(let r=0;r<8;r++)for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++)if(i>=0&&j>=0&&i<nx&&j<nz&&!s.luoi[id(i,j)])return id(i,j);return-1;};
  const from=gan(a),to=gan(b);if(from<0||to<0)return[];
  const prev=new Int32Array(nx*nz).fill(-1);prev[from]=from;const q=[from];let h=0;
  while(h<q.length){const c=q[h++];if(c===to)break;const i=c%nx,j=(c-i)/nx;
    for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const u=i+di,v=j+dj;if(u<0||v<0||u>=nx||v>=nz)continue;const k=id(u,v);if(prev[k]>=0||s.luoi[k])continue;if(di&&dj&&(s.luoi[id(u,j)]||s.luoi[id(i,v)]))continue;prev[k]=c;q.push(k);}}
  if(prev[to]<0)return[];
  const pts=[];for(let c=to;;c=prev[c]){pts.unshift({x:px(c%nx),z:pz((c-c%nx)/nx)});if(c===from)break;}
  /* rút gọn: bỏ các điểm nhìn thẳng tới được */
  const out=[];let cur0=a,k=0;while(k<pts.length){let n=pts.length-1;while(n>k&&!thay(s,cur0,pts[n]))n--;out.push(pts[n]);cur0=pts[n];k=n+1;}
  return out;
}
function diToi(t){
  const r=thay(cur,state.pos,t)?[]:timDuong(state.pos,t);
  r.push(t);state.tgt=r.shift();state.route=r;
}
function renderNav(){
  const box=$('#nav');box.innerHTML='';box.scrollLeft=0;let kg=0;try{kg=BE.kg;}catch(e){}(cur.nav||[]).forEach(n=>{const b=document.createElement('button');b.textContent=n.l;
    const ng=kg&&NHOM.find(g=>g.ten===n.l);if(ng){const c=ng.ps.filter(p=>hopSize(p,kg)==='ok').length;if(c){const t=document.createElement('span');t.className='n';t.textContent=c;b.append(t);b.setAttribute('aria-label',`${n.l}, ${c} mẫu vừa bé ${kg}kg`);}else b.classList.add('ko');}
   b.addEventListener('click',()=>{if(state.lock||state.mode!=='play')return;box.querySelectorAll('button').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','true');
    diToi({x:n.x,z:n.z});state.goal=n;state.wantYaw=null;state.stuck=0;marker.position.set(n.x,.04,n.z);marker.visible=true;hideHint();});box.appendChild(b);});
}
function hideHint(){const h=$('#hint');if(h)h.style.opacity=0;}

/* ---------- Điều khiển ---------- */
const joy=$('#joy'),knob=$('#knob');
function stick(p,e){const dx=e.clientX-p.sx,dy=e.clientY-p.sy,d=Math.min(44,Math.hypot(dx,dy)),a=Math.atan2(dy,dx),x=Math.cos(a)*d,y=Math.sin(a)*d;
  if(!state.joy.on){state.joy.on=true;joy.hidden=false;const r=app.getBoundingClientRect();joy.style.transform=`translate(${p.sx-r.left}px,${p.sy-r.top}px)`;state.tgt=null;state.goal=null;state.wantYaw=null;marker.visible=false;hideHint();$('#nav').querySelectorAll('[aria-current]').forEach(b=>b.removeAttribute('aria-current'));}
  knob.style.transform=`translate(${x}px,${y}px)`;state.joy.x=x/44;state.joy.y=y/44;}
function stickEnd(){if(!state.joy.on)return;state.joy.on=false;state.joy.x=state.joy.y=0;knob.style.transform='';joy.hidden=true;}
const ptr=new Map();let pinch=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);cv.focus({preventScroll:true});ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),moved:0});pinch=0;});
cv.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.moved+=Math.abs(dx)+Math.abs(dy);
  if(ptr.size===1&&p.moved>4&&(state.mode==='intro'||studio.on)){studio.yaw+=dx*.012;return;}
  if(ptr.size===1&&p.moved>8&&state.mode==='play'&&!state.lock){if(e.pointerType==='mouse'){state.yaw-=dx*.0062;state.pitch=clamp(state.pitch+dy*.004,.04,1.150);state.drag=performance.now();hideHint();}else stick(p,e);}
  if(ptr.size===2){stickEnd();const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch){state.dist=clamp(state.dist*pinch/d,3,11);state.zoomed=true;}pinch=d;}
});
const pEnd=e=>{const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);stickEnd();if(p&&p.moved<9&&performance.now()-p.t<400&&state.mode==='play'&&!state.lock)tap(e.clientX,e.clientY);};
cv.addEventListener('pointerup',pEnd);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);stickEnd();});
cv.addEventListener('wheel',e=>{e.preventDefault();if(state.mode==='intro'||studio.on)return;state.zoomed=true;state.dist=clamp(state.dist*(1+e.deltaY*.001),3,11);},{passive:false});
const g0=r=>r.intersectObject(cur.ground,false)[0];
function tap(x,y){
  const r=app.getBoundingClientRect(),m=new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);rc.setFromCamera(m,camera);
  const list=cur.items.filter(i=>i.pos.distanceTo(player.g.position)<16&&trongGian(i,player.g.position)).map(i=>i.mesh),hit=rc.intersectObjects(list,false)[0];
  if(hit&&hit.object.userData.item){openSheet(hit.object.userData.item);return;}
  const tp=cur.taps.filter(t=>t.pos.distanceTo(player.g.position)<16),th=rc.intersectObjects(tp.map(t=>t.mesh),false)[0];
  if(th&&(!g0(rc)||th.distance<=g0(rc).distance)){const t=tp.find(t=>t.mesh===th.object);if(t.k==='dien')moSanDien();else if(t.p)openSheet(t.p);return;}
  if(cur.tuvan&&cur.tuvan.g.position.distanceTo(player.g.position)<18&&rc.intersectObject(cur.tuvan.g,true)[0]){moTuVan();return;}
  const g=rc.intersectObject(cur.ground,false)[0];
  if(g){const t={x:g.point.x,z:g.point.z};resolve(cur,t,.34);diToi(t);state.goal=null;state.wantYaw=null;marker.position.set(t.x,.04,t.z);marker.visible=true;state.stuck=0;hideHint();}
}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;state.keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(studio.on)closeStudio();else close();}});
addEventListener('keyup',e=>{state.keys[e.code]=false;});

$('#enter').addEventListener('submit',e=>{e.preventDefault();if(!player)return;const n=($('#who').value||'').trim()||'Bé Bống';player.o.name=n;player.tag.querySelector('.nm').textContent=n;store.set('ten',n);
  if(studio.on){BE.kg=parseInt($('#beKg').value,10)||0;saveBe();closeStudio();capNhatBe();return;}
  if(state.mode!=='intro')return;
  BE.kg=parseInt($('#beKg').value,10)||BE.kg||0;BE.cao=parseInt($('#beCao').value,10)||BE.cao||0;saveBe();capNhatBe();
  const st=$('#studio');st.style.opacity=0;setTimeout(()=>{st.hidden=true;st.style.opacity='';st.classList.add('play');},REDUCED?0:600);
  cam.from.copy(camera.position);cam.fromLook.copy(cam.look);cam.t=REDUCED?1:0;state.mode='fly';$('#hud').hidden=false;
  $('#hint').textContent=matchMedia('(hover:hover) and (pointer:fine)').matches?'Bấm xuống nền để đi, kéo chuột để nhìn quanh. Bấm tên sạp ở dưới để tự đi tới.':'Kéo một ngón để đi. Chạm tên khu ở dưới để tới nhanh, chạm nút Xem trên ảnh để xem giá và size.';setTimeout(hideHint,8000);
  player.tag.style.display='';cur.npcs.forEach(n=>n.tag.style.display='');
  setTimeout(()=>ticker('Chạm nút Xem trên ảnh để xem giá và size nha'),5000);
});

/* ---------- Vòng lặp ---------- */
const clock=new T.Clock();let bubbleT=4,ownerT=2,ownerI=0,tickerT=20,slow=0,time=0;
const TICK=['Chạm nút Xem trên ảnh để xem giá và size nha',`Shop đi đơn từ ${SHOP.donToiThieu} bộ`,'Chọn cân nặng của bé, chợ báo ngay mẫu có vừa không','Gấu tím giữa chợ đang vẫy tay chào bé'];
function stepPlayer(dt){
  if(state.show){stepShow(dt);return;}
  let ix=state.joy.x,iy=state.joy.y;const k=state.keys;
  if(k.KeyW||k.ArrowUp)iy=-1;if(k.KeyS||k.ArrowDown)iy=1;if(k.KeyA||k.ArrowLeft)ix=-1;if(k.KeyD||k.ArrowRight)ix=1;
  const sin=Math.sin(state.yaw),cos=Math.cos(state.yaw);let dx=0,dz=0;
  if(ix||iy){state.tgt=null;state.goal=null;state.wantYaw=null;marker.visible=false;dx=ix*cos+iy*sin;dz=-ix*sin+iy*cos;const l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}
    if(Math.abs(ix)>.2&&performance.now()-(state.drag||0)>500)state.yaw-=ix*dt*1.700;}
  else if(state.tgt){const tx=state.tgt.x-state.pos.x,tz=state.tgt.z-state.pos.z,d=Math.hypot(tx,tz);if(state.route&&state.route.length&&d<1){state.tgt=state.route.shift();}else if(d<.25){if(state.goal)state.wantYaw=state.goal.yaw;state.goal=null;state.tgt=null;marker.visible=false;}else{dx=tx/d;dz=tz/d;}}
  const sp=state.goal?5.600:3.700,a=1-Math.exp(-dt*11);state.vel.x=lerp(state.vel.x,dx*sp,a);state.vel.z=lerp(state.vel.z,dz*sp,a);
  const ox=state.pos.x,oz=state.pos.z;state.pos.x+=state.vel.x*dt;state.pos.z+=state.vel.z*dt;resolve(cur,state.pos);
  const moved=Math.hypot(state.pos.x-ox,state.pos.z-oz);player.speed=moved/Math.max(dt,.001);
  if(state.tgt){state.stuck=moved/dt<.5?(state.stuck||0)+dt:0;if(state.stuck>(state.goal?1.2:.5)){if(state.goal)state.wantYaw=state.goal.yaw;state.goal=null;state.tgt=null;marker.visible=false;}
    if(performance.now()-(state.drag||0)>900&&moved>.002)state.yaw=angLerp(state.yaw,Math.atan2(-state.vel.x,-state.vel.z),dt*(state.goal?2.200:.9));}
  if(state.wantYaw!==null&&state.wantYaw!==undefined){state.yaw=angLerp(state.yaw,state.wantYaw,1-Math.exp(-dt*3.500));let e=(state.yaw-state.wantYaw)%(2*PI);if(Math.min(Math.abs(e),2*PI-Math.abs(e))<.02)state.wantYaw=null;}
  if(moved>.001)player.yaw=angLerp(player.yaw,Math.atan2(state.vel.x,state.vel.z),1-Math.exp(-dt*12));
  player.g.position.set(state.pos.x,0,state.pos.z);player.update(dt);
}
function stepNpc(c,dt){
  if(c.fixed){c.speed=0;c.update(dt);return;}
  if(!c.tgt){c.speed=0;c.wait-=dt;if(c.wait<=0){const t=cur.wander();resolve(cur,t);c.tgt=t;c.stuck=0;}}
  else{const dx=c.tgt.x-c.pos.x,dz=c.tgt.z-c.pos.z,d=Math.hypot(dx,dz);if(d<.35){c.tgt=null;c.wait=1.500+Math.random()*5;c.speed=0;}
    else{const ox=c.pos.x,oz=c.pos.z,sp=1.700;c.pos.x+=dx/d*sp*dt;c.pos.z+=dz/d*sp*dt;resolve(cur,c.pos);const m=Math.hypot(c.pos.x-ox,c.pos.z-oz)/dt;c.speed=m;c.yaw=angLerp(c.yaw,Math.atan2(dx,dz),dt*6);if(m<.5){c.stuck+=dt;if(c.stuck>.8){c.tgt=null;c.wait=.3;}}else c.stuck=0;}}
  c.g.position.set(c.pos.x,0,c.pos.z);c.update(dt);
}
function placeTag(c,top){
  const dist=c.g.position.distanceTo(camera.position);
  if(dist>(view.port?13:24)){c.tag.style.visibility='hidden';return;}const v=project({x:c.g.position.x,y:c.g.position.y+top,z:c.g.position.z});
  if(!v.ok||v.x<-40||v.x>app.clientWidth+40||v.y<70){c.tag.style.visibility='hidden';return;}c.tag.style.visibility='visible';c.tag.style.transform=`translate(${v.x}px,${v.y}px) translateY(-100%)`;
}
const trongGian=(it,p)=>!it.area||(p.x-it.pos.x)*it.area.x+(p.z-it.pos.z)*it.area.z>0;
const hots=[];
function hotBtn(i){
  if(!hots[i]){const b=document.createElement('button');b.className='hot';b.innerHTML='Xem<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';b.addEventListener('click',()=>{if(b.item&&!state.lock)openSheet(b.item);});$('#tags').appendChild(b);hots[i]=b;}
  return hots[i];
}
/* Nút thật nổi trên từng ảnh của gian đang đứng, để khách biết chạm vào được */
let MO=1;
function moNhanVat(){/* Nhân vật luôn hiện rõ, không làm mờ khi vào gian */}
function stepHots(){moNhanVat();
  let n=0;
  if(stripGrp&&!state.lock&&!studio.on&&state.mode==='play'){const W=app.clientWidth,done=[],pp=player.g.position;
    const list=cur.items.filter(i=>i.hot&&i.grp===stripGrp&&trongGian(i,pp)).sort((a,b)=>a.pos.distanceTo(camera.position)-b.pos.distanceTo(camera.position));
    for(const it of list){if(n>=5)break;const v=project({x:it.pos.x,y:it.pos.y-.6,z:it.pos.z});if(!v.ok||v.x<14||v.x>W-30)continue;
      v.x=clamp(v.x,46,W-92);if(done.some(q=>Math.abs(q.x-v.x)<76&&Math.abs(q.y-v.y)<48))continue;done.push(v);
      const b=hotBtn(n++);b.item=it.p;const f=BE.kg?hopSize(it.p,BE.kg):null;b.classList.toggle('ok',f==='ok');b.classList.toggle('no',!!f&&f!=='ok');b.setAttribute('aria-label','Xem mẫu '+it.p.name);b.style.display='';b.style.transform=`translate(${v.x}px,${v.y}px) translate(-50%,-50%)`;}}
  for(let i=n;i<hots.length;i++)hots[i].style.display='none';
  let dh=false;const dp=state.mode==='play'&&!state.lock&&!studio.on&&cur.taps.find(t=>t.k==='dien');
  if(dp&&dp.pos.distanceTo(player.g.position)<11){const v=project(dp.pos);if(v.ok&&v.x>40&&v.x<app.clientWidth-40&&v.y>70&&v.y<app.clientHeight-150){dh=true;dienHot.style.transform=`translate(${v.x}px,${v.y}px) translate(-50%,-50%)`;}}
  dienHot.style.display=dh?'':'none';
}
/* Bảng nổi trên tên sạp: sạp có bao nhiêu mẫu vừa cân nặng của bé */
const KB=[];
function stepKb(){
  const kg=BE.kg,on=kg&&state.mode==='play'&&!studio.on&&!state.lock;
  DAO.forEach((d,i)=>{let e=KB[i];
    if(!on){if(e)e.style.display='none';return;}
    if(!e){e=KB[i]=document.createElement('div');e.className='kb';$('#tags').appendChild(e);const w=veTheGioi(d,0,.6);e.w={x:w.x,y:(BAY==='A'?4.37:3.46)+.66,z:w.z};}
    if(e.kg!==kg){const c=d.g.ps.filter(p=>hopSize(p,kg)==='ok').length;e.kg=kg;e.textContent=c?`✓ ${c} mẫu vừa bé ${kg}kg`:`Chưa có size ${kg}kg`;e.classList.toggle('no',!c);}
    const cx=camera.position.x-e.w.x,cz=camera.position.z-e.w.z,dd=Math.hypot(cx,cz);
    if('Sạp '+d.g.ten===stripGrp||dd>26||-d.side*cx/(dd||1)<.3){e.style.display='none';return;}
    const v=project(e.w);if(!v.ok||v.y<80||v.y>app.clientHeight-230||v.x<60||v.x>app.clientWidth-60){e.style.display='none';return;}
    e.style.display='';e.style.transform=`translate(${v.x}px,${v.y}px) translate(-50%,-50%)`;});
}
function capNhatBe(){
  const c=$('#beChip');c.innerHTML=BE.kg?`<i>Bé</i><b>${BE.kg}kg</b>`:'<i>Nhập cân bé</i>';
  renderNav();const g=stripGrp;stripGrp=null;if(g)showStrip(g);
}
$('#beChip').addEventListener('click',()=>{openStudio();setTimeout(()=>{if(studio.on)$('#beKg').focus();},80);});
function stepHud(){stepKb();
  if(cur.tuvan&&state.mode==='play'){const d=cur.tuvan.g.position.distanceTo(player.g.position);if(d<7&&!cur.tuvan.chao){cur.tuvan.chao=1;cur.tuvan.say('Mẹ cần tư vấn size cho bé thì chạm vào em nha!',4200);}else if(d>12)cur.tuvan.chao=0;}
  if(studio.on)player.tag.style.visibility='hidden';else placeTag(player,player.tagY);cur.npcs.forEach(n=>placeTag(n,n.tagY));
  const pp=player.g.position;let best=null,bd=7.500;
  for(const it of cur.items){if(it.dup||!it.grp||!trongGian(it,pp))continue;const d=Math.hypot(it.pos.x-pp.x,it.pos.z-pp.z)+(it.hot?0:3.500);if(d<bd){bd=d;best=it;}}
  showStrip(state.lock?stripGrp:(best?best.grp:null));stepHots();
}
function frame(){
  requestAnimationFrame(frame);if(document.hidden)return;
  const dt=Math.min(clock.getDelta(),.05);time+=dt;
  if(state.mode==='intro'){
    player.yaw=angLerp(player.yaw,studio.yaw,1-Math.exp(-dt*10));player.speed=0;player.update(dt);player.g.position.set(state.pos.x,0,state.pos.z);
    cur.npcs.forEach(n=>stepNpc(n,dt));studioCam(dt);
  }else{
    if(studio.on){player.yaw=angLerp(player.yaw,studio.yaw,1-Math.exp(-dt*10));player.speed=0;player.update(dt);}
    else if(state.mode==='play'&&(!state.lock||state.show))stepPlayer(dt);else{player.speed=0;player.update(dt);}
    cur.npcs.forEach(n=>stepNpc(n,dt));
    if(state.mode==='fly'){player.yaw=angLerp(player.yaw,state.yaw+PI,1-Math.exp(-dt*4));cam.t=Math.min(1,cam.t+dt/2.400);const e=cam.t<.5?4*cam.t**3:1-Math.pow(-2*cam.t+2,3)/2,t=camTarget();camera.position.lerpVectors(cam.from,t.p,e);cam.look.lerpVectors(cam.fromLook,t.l,e);camera.lookAt(cam.look);if(cam.t>=1){state.mode='play';snapCam();}}
    else if(studio.on)studioCam(dt);
    else{const t=camTarget(),a=1-Math.exp(-dt*9);cam.p.lerp(t.p,a);cam.look.lerp(t.l,1-Math.exp(-dt*13));camera.position.copy(cam.p);camera.lookAt(cam.look);}
    stepHud();
    bubbleT-=dt;if(bubbleT<=0){bubbleT=3+Math.random()*4;const l=cur.npcs.filter(n=>!n.fixed&&n.g.position.distanceTo(player.g.position)<14);if(l.length){const c=l[Math.floor(Math.random()*l.length)];c.say(CHAT[Math.floor(Math.random()*CHAT.length)]);if(Math.random()<.3)c.wave=1.200;}}
    ownerT-=dt;if(ownerT<=0&&cur.owner){ownerT=9;cur.owner.say(OWNER[ownerI++%OWNER.length],6000);cur.owner.wave=1.200;}
    tickerT-=dt;if(tickerT<=0&&state.mode==='play'){tickerT=16+Math.random()*12;ticker(TICK[Math.floor(Math.random()*TICK.length)]);}
    if(marker.visible)marker.scale.setScalar(1+Math.sin(time*7)*.14);
  }
  if(cur.spin&&!REDUCED)for(const o of cur.spin)o.rotation.y+=dt*.5;
  if(cur.tuyet&&!REDUCED)buocTuyet(cur.tuyet,dt,time);
  if(cur.bob&&!REDUCED)for(const o of cur.bob)o.position.y=o.userData.y+Math.sin(time*1.6+o.userData.ph)*.05;
  applyOffset(dt);
  renderer.render(scene,camera);
  /* tự giảm độ nét nếu máy chậm */
  slow=dt>.03?slow+1:Math.max(0,slow-.5);if(slow>70&&PR>1){PR=Math.max(1,PR-.4);renderer.setPixelRatio(PR);resize();slow=0;}
}
function boot(){
  try{build();}catch(err){$('#loadT').textContent='Dựng cảnh bị lỗi: '+err.message;console.error(err);return;}
  camera.position.set(0,3,M.ZE-2);frame();$('#load').style.opacity=0;setTimeout(()=>$('#load').remove(),420);
}
/* Chữ trên biển, nhãn, giá được vẽ một lần lúc dựng chợ, nên chờ font thật tải xong (tối đa 6 giây) để không dính font dự phòng */
const fonts=document.fonts?Promise.race([Promise.all(['800 60px "Baloo 2"','700 60px "Baloo 2"','600 20px "Be Vietnam Pro"','700 20px "Be Vietnam Pro"'].map(f=>document.fonts.load(f,'Chợ DuuDuu 129k Size 7–30kg'))),new Promise(r=>setTimeout(r,6000))]):Promise.resolve();
const logoSan=LOGO.decode?LOGO.decode().catch(()=>{}):Promise.resolve();
Promise.all([fonts,logoSan]).then(boot,boot);
})();
