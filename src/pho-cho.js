/* Phố chợ DuuDuu: sa bàn 3D nhìn từ trên cao kiểu đồ chơi khối.
   Mỗi khu trong data/san-pham.js là một sạp mái sọc, ảnh mẫu bày trên quầy. Chạm sạp để xem mẫu. */
'use strict';
const $=s=>document.querySelector(s);
const T=THREE,PI=Math.PI;
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Dữ liệu ---------- */
const DATA=window.DUU_CHO||{};
/* Đọc giá và dải cân nặng từ đoạn chữ Zalo. Bản rút gọn của docChu trong src/main.js, chỉ lấy phần cần hiện. */
function docChu(t){
  const s=String(t||'').toLowerCase().replace(/[–—]/g,'-'),o={};
  let m=s.match(/(\d{2,3})\s*k\s*\/\s*(\d+)\s*([^\s\d,.!]*)/);
  if(m){o.gia=+m[1];o.combo=+m[2];o.comboDv=m[3]||'cái';}
  else{const all=[...s.matchAll(/(\d{2,3})\s?k(?!g)/g)];if(all.length)o.gia=+all[all.length-1][1];}
  m=s.match(/còn\s*(?:size\s*)?(\d{1,2})\s*-\s*(\d{1,2})\s*kg/)||s.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*kg/);
  if(m){o.tu=+m[1];o.den=+m[2];}
  return o;
}
const SP=(DATA.sanPham||[]).filter(x=>x&&x.an!==true).map(x=>{const d=docChu(x.chu);return{
  ten:x.ten||x.ma||'Mẫu',khu:x.khu||'Hàng mới về',anh:(x.anh||[]).filter(Boolean),het:!!x.het,
  gia:x.gia??d.gia??0,combo:x.combo??d.combo??0,comboDv:x.comboDv||d.comboDv||'cái',tu:x.tu??d.tu,den:x.den??d.den};});
const KHU_MAU=['#FF9FDC','#7C3CFF','#ABDCE0','#2060E0','#FFC94D','#5FCB8A'];
const KHU=(()=>{const ds=DATA.khu||[],ten=[...new Set([...ds.map(k=>k.ten),...SP.map(p=>p.khu)])];
  return ten.map((n,i)=>({ten:n,mau:(ds.find(k=>k.ten===n)||{}).mau||KHU_MAU[i%KHU_MAU.length],ps:SP.filter(p=>p.khu===n)})).filter(k=>k.ps.length);})();
const giaChu=p=>!p.gia?'Hỏi giá':p.combo?`${p.gia}k/${p.combo} ${p.comboDv}`:`${p.gia}k`;

/* ---------- Bảng màu: sáng, sạch, hợp màu DuuDuu ---------- */
const C={
  nen:'#F4F1FB',canh:'#E3DDF2',day:'#CFC6E6',
  duong:'#545B73',vach:'#FFFFFF',le:'#EEF0F7',vien:'#D9DCE8',
  san:'#F2C79A',gach:'#E9B482',co:'#8CD98F',co2:'#73C97E',
  hong:'#FF9FDC',hongNhat:'#FFD0EC',tim:'#7C3CFF',timNhat:'#B9A0FF',ngoc:'#7FD0D6',lam:'#2F6BE8',vang:'#FFD45C',cam:'#FF8A4C',do:'#F2545B',
  trang:'#FFFFFF',kinh:'#BFE3FF',go:'#C98B5B',than:'#9A6A45',la:'#5DC46E',la2:'#48B05C',xam:'#8C93A8'
};
const MATS={};
function mat(col,o){const k=col+(o?JSON.stringify(o):'');return MATS[k]||(MATS[k]=new T.MeshLambertMaterial(Object.assign({color:col},o||{})));}
const BASIC={};
function glow(col){return BASIC[col]||(BASIC[col]=new T.MeshBasicMaterial({color:col}));}

/* ---------- Hình khối dùng lại ---------- */
const GEO={};
const box=(w,h,d)=>{const k=`b${w},${h},${d}`;if(!GEO[k]){GEO[k]=new T.BoxGeometry(w,h,d);GEO[k].translate(0,h/2,0);}return GEO[k];};
/* Khối bo tròn bốn cạnh đứng, đáy ở y=0 */
function rbox(w,h,d,r){
  const k=`r${w},${h},${d},${r}`;if(GEO[k])return GEO[k];
  r=Math.min(r,w/2-.001,d/2-.001);const S=new T.Shape(),x=-w/2,y=-d/2;
  S.moveTo(x+r,y);S.lineTo(x+w-r,y);S.quadraticCurveTo(x+w,y,x+w,y+r);S.lineTo(x+w,y+d-r);S.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
  S.lineTo(x+r,y+d);S.quadraticCurveTo(x,y+d,x,y+d-r);S.lineTo(x,y+r);S.quadraticCurveTo(x,y,x+r,y);
  const g=new T.ExtrudeGeometry(S,{depth:h,bevelEnabled:false,curveSegments:6});g.rotateX(-PI/2);return GEO[k]=g;
}
const cyl=(rt,rb,h,n=16)=>{const k=`c${rt},${rb},${h},${n}`;if(!GEO[k]){GEO[k]=new T.CylinderGeometry(rt,rb,h,n);GEO[k].translate(0,h/2,0);}return GEO[k];};
const sph=(r,n=14)=>{const k=`s${r},${n}`;return GEO[k]||(GEO[k]=new T.SphereGeometry(r,n,Math.max(6,n*.7|0)));};

function mesh(g,m,x=0,y=0,z=0,parent){const o=new T.Mesh(g,typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;(parent||scene).add(o);return o;}
function group(x=0,y=0,z=0,ry=0,parent){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;(parent||scene).add(g);return g;}

/* ---------- Cảnh ---------- */
const canvas=$('#gl');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const cam=new T.OrthographicCamera(-10,10,10,-10,1,200);

scene.add(new T.HemisphereLight(0xFFFFFF,0xB9AEDD,.55));
const sun=new T.DirectionalLight(0xFFF0DC,.78);
sun.position.set(14,26,10);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;sun.shadow.radius=3;
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:70});
scene.add(sun);

/* Kích thước sa bàn */
const W=25,D=19,X0=-W/2,X1=W/2,Z0=-D/2,Z1=D/2;
const ROAD=[5.6,8.6];   /* đường chạy dọc phía trước */
const WALK=[4.2,5.6];   /* vỉa hè */

/* Tấm nền nổi: viền bo tròn, mặt trên sáng, cạnh dày như đế đồ chơi */
mesh(rbox(W+.6,1.3,D+.6,1.1),C.day,0,-1.75);
mesh(rbox(W+.4,.45,D+.4,1),C.canh,0,-.45);
mesh(rbox(W,.02,D,.9),C.nen,0,-.02);
/* Bóng mờ dưới đế */
(()=>{const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d'),g=c.createRadialGradient(128,128,10,128,128,128);
  g.addColorStop(0,'rgba(60,40,120,.28)');g.addColorStop(1,'rgba(60,40,120,0)');c.fillStyle=g;c.fillRect(0,0,256,256);
  const m=new T.Mesh(new T.PlaneGeometry(W*1.7,D*1.7),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false}));
  m.rotation.x=-PI/2;m.position.y=-3.4;scene.add(m);})();

/* Đường, vạch kẻ, vỉa hè */
mesh(box(W,.06,ROAD[1]-ROAD[0]),C.duong,0,0,(ROAD[0]+ROAD[1])/2);
mesh(box(W,.04,.35),C.vien,0,0,ROAD[1]+.2);
for(let x=X0+.8;x<X1-.6;x+=2)if(Math.abs(x-1.5)>1.6)mesh(box(1,.075,.14),C.vach,x+.5,0,(ROAD[0]+ROAD[1])/2);
for(let i=0;i<6;i++)mesh(box(.32,.075,(ROAD[1]-ROAD[0])-.5),C.vach,.3+i*.5,0,(ROAD[0]+ROAD[1])/2);
mesh(box(W,.2,WALK[1]-WALK[0]),C.le,0,0,(WALK[0]+WALK[1])/2);
mesh(box(W,.21,.12),C.vien,0,0,WALK[1]-.06);

/* Sân chợ lát gạch ấm */
const PLAZA={x0:X0+.5,x1:2.6,z0:Z0+.5,z1:WALK[0]};
(()=>{const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d');c.fillStyle=C.san;c.fillRect(0,0,512,512);
  c.fillStyle=C.gach;for(let i=0;i<8;i++)for(let j=0;j<8;j++)if((i+j)%2)c.fillRect(i*64+3,j*64+3,58,58);
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set((PLAZA.x1-PLAZA.x0)/6,(PLAZA.z1-PLAZA.z0)/6);
  const m=mesh(box(PLAZA.x1-PLAZA.x0,.12,PLAZA.z1-PLAZA.z0),new T.MeshLambertMaterial({map:t}),(PLAZA.x0+PLAZA.x1)/2,0,(PLAZA.z0+PLAZA.z1)/2);m.castShadow=false;})();

/* Công viên nhỏ bên phải */
const PARK={x0:3.2,x1:X1-.5,z0:-1.2,z1:WALK[0]-.3};
mesh(rbox(PARK.x1-PARK.x0,.18,PARK.z1-PARK.z0,.6),C.co,(PARK.x0+PARK.x1)/2,0,(PARK.z0+PARK.z1)/2).castShadow=false;
/* Lối đi lát đá qua công viên */
for(let i=0;i<6;i++)mesh(cyl(.32,.32,.2,12),C.le,PARK.x0+1.2+i*.95,.02,PARK.z1-.9-Math.sin(i*.9)*.6).castShadow=false;

/* ---------- Đồ trang trí ---------- */
function tree(x,z,s=1){
  const g=group(x,0,z);g.scale.setScalar(s);
  mesh(cyl(.12,.16,1,8),C.than,0,0,0,g);
  if(!GEO.ico){GEO.ico=new T.IcosahedronGeometry(.8,1);GEO.ico.computeVertexNormals();}const ico=GEO.ico;  /* hình không đánh chỉ số nên tính lại pháp tuyến là ra mặt phẳng từng ô */
  const a=mesh(ico,C.la,0,1.55,0,g);a.scale.set(1,.95,1);
  const b=mesh(ico,C.la2,.35,1.1,.2,g);b.scale.setScalar(.6);
  return g;
}
function lamp(x,z){const g=group(x,0,z);mesh(cyl(.05,.07,2.6,8),'#3B3560',0,0,0,g);mesh(sph(.16,10),glow('#FFF1B8'),0,2.7,0,g);mesh(cyl(.2,.08,.12,10),'#3B3560',0,2.82,0,g);return g;}
function bench(x,z,ry=0){const g=group(x,0,z,ry);mesh(box(1.3,.08,.4),C.go,0,.42,0,g);mesh(box(1.3,.36,.06),C.go,0,.5,-.2,g);
  [-.55,.55].forEach(a=>mesh(box(.06,.42,.36),'#3B3560',a,0,0,g));return g;}

/* Ô dù và bàn ghế */
function umbrella(x,z,col){
  const g=group(x,0,z);
  mesh(cyl(.035,.035,2,6),'#F3F0FA',0,0,0,g);
  const k='u'+col;if(!GEO[k]){GEO[k]=new T.ConeGeometry(1.15,.55,8,1,true);}
  const u=mesh(GEO[k],new T.MeshLambertMaterial({color:col,side:T.DoubleSide}),0,2.1,0,g);u.rotation.y=PI/8;
  mesh(sph(.08,8),C.trang,0,2.38,0,g);
  mesh(cyl(.42,.42,.06,16),C.trang,0,.66,0,g);mesh(cyl(.05,.05,.66,6),'#D8D2E8',0,0,0,g);
  [0,PI*2/3,PI*4/3].forEach(a=>mesh(cyl(.18,.18,.38,10),col===C.trang?C.hong:C.trang,Math.cos(a)*.75,0,Math.sin(a)*.75,g));
  return g;
}

/* Dây đèn võng giữa hai điểm */
function dayDen(a,b,sag=.5,n=12){
  const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push(new T.Vector3(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-Math.sin(t*PI)*sag,a.z+(b.z-a.z)*t));}
  const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#6B6390'}));scene.add(line);
  const den=['#FFE58A','#FFB8DE','#FFE58A','#BFE8FF'];
  for(let i=1;i<n;i++){const t=i/n,p=new T.Vector3(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-Math.sin(t*PI)*sag-.08,a.z+(b.z-a.z)*t);
    const m=new T.Mesh(sph(.075,8),glow(den[i%4]));m.position.copy(p);scene.add(m);}
}
function cot(x,z,h=3.2){mesh(cyl(.05,.07,h,8),'#6B6390',x,0,z);mesh(sph(.1,8),'#6B6390',x,h,z);return new T.Vector3(x,h,z);}

/* ---------- Ảnh mẫu ---------- */
const loader=new T.TextureLoader();
function anhTex(src){const t=loader.load(src);t.anisotropy=4;return t;}
/* Ảnh minh hoạ khi mẫu chưa có ảnh: bộ đồ vẽ nét đơn trên nền màu khu */
function veAo(col){
  const cv=document.createElement('canvas');cv.width=128;cv.height=160;const c=cv.getContext('2d');
  c.fillStyle='#FFFFFF';c.fillRect(0,0,128,160);c.fillStyle=col;c.globalAlpha=.25;c.fillRect(0,0,128,160);c.globalAlpha=1;
  c.fillStyle=col;c.translate(4,20);c.fill(new Path2D('M30 10 l14 -8 q16 8 32 0 l14 8 l18 22 l-14 12 l-10 -8 v38 h-48 v-38 l-10 8 l-14 -12 z'));
  c.fillStyle='rgba(42,22,112,.55)';c.fill(new Path2D('M38 78 h44 l4 48 h-20 l-6 -30 l-6 30 h-20 z'));
  return cv;
}

/* ---------- Sạp hàng ---------- */
const chamDuoc=[],nhanSap=[];
function sap(k,x,z,ry){
  const g=group(x,0,z,ry);g.userData.khu=k;chamDuoc.push(g);
  const col=k.mau,w=3.4,d=2;
  /* Bục sạp và quầy */
  mesh(rbox(w+.4,.16,d+.6,.25),C.trang,0,.12,0,g);
  mesh(rbox(w,.95,.7,.12),col,0,.28,.55,g);
  mesh(box(w+.12,.08,.82),C.trang,0,1.23,.55,g);
  mesh(box(w-.3,.12,.03),C.trang,0,.75,.92,g);
  /* Kệ sau */
  mesh(box(w,1.5,.35),C.trang,0,.28,-.75,g);
  mesh(box(w,.06,.4),col,0,1.1,-.62,g);
  /* Cột */
  [[-w/2+.08,.86],[w/2-.08,.86],[-w/2+.08,-.92],[w/2-.08,-.92]].forEach(([a,b])=>mesh(cyl(.05,.05,2.5,8),C.trang,a,.28,b,g));
  /* Mái sọc nghiêng ra trước, mép trước lượn sóng */
  const mai=group(0,2.75,0,0,g);mai.rotation.x=.32;
  const n=8,sw=(w+.5)/n;
  for(let i=0;i<n;i++)mesh(box(sw,.08,2.4),i%2?C.trang:col,-((w+.5)/2)+sw*(i+.5),0,.15,mai);
  const vk='van'+sw;if(!GEO[vk]){GEO[vk]=new T.CylinderGeometry(sw/2,sw/2,.08,14,1,false,0,PI);GEO[vk].rotateZ(PI/2);GEO[vk].rotateY(PI/2);}
  for(let i=0;i<n;i++){const v=mesh(GEO[vk],i%2?C.trang:col,-((w+.5)/2)+sw*(i+.5),.04,1.35,mai);v.rotation.x=PI/2;}
  /* Ba ảnh mẫu dựng trên quầy */
  k.ps.slice(0,3).forEach((p,i)=>{
    const fx=(i-1)*1.05;
    const khung=mesh(box(.86,1.08,.06),C.trang,fx,1.27,.38,g);khung.rotation.x=-.12;
    const t=p.anh.length?anhTex(p.anh[0]):new T.CanvasTexture(veAo(col));
    const a=new T.Mesh(new T.PlaneGeometry(.76,.96),new T.MeshBasicMaterial({map:t}));a.position.set(0,.54,.032);khung.add(a);
  });
  /* Quần áo treo trên kệ sau */
  const ao=['#FFB8DE','#BFE8FF','#FFE58A','#C9B6FF','#FFFFFF'];
  for(let i=0;i<5;i++){const m=mesh(box(.42,.5,.08),ao[(i+k.ten.length)%5],-1.2+i*.6,1.65,-.52,g);m.rotation.y=.15;}
  mesh(cyl(.02,.02,w-.2,6),'#3B3560',0,2.17,-.52,g).rotation.z=PI/2;
  nhanSap.push({k,g,y:3.3});
  return g;
}

/* ---------- Cửa hàng DuuDuu ---------- */
function cuaHang(x,z){
  const g=group(x,0,z);g.userData.cuaHang=true;chamDuoc.push(g);
  const w=6.4,d=5,h1=2.3,h2=2.1;
  mesh(rbox(w+.3,.2,d+.3,.3),C.trang,0,0,0,g);
  mesh(box(w,h1,d),C.hongNhat,0,.2,0,g);
  mesh(box(w+.2,.18,d+.2),C.trang,0,.2+h1,0,g);
  mesh(box(w,h2,d),C.hong,0,.38+h1,0,g);
  /* Mái tím có gờ */
  mesh(rbox(w+.5,.3,d+.5,.25),C.tim,0,.38+h1+h2,0,g);
  mesh(box(w-.2,.25,d-.2),C.timNhat,0,.68+h1+h2,0,g);
  /* Cửa kính tầng trệt, ảnh mẫu bày trong tủ kính */
  const top=.38+h1+h2+.3;
  mesh(box(1.3,1.7,.06),C.kinh,0,.2,d/2+.01,g);
  mesh(box(.08,1.7,.07),C.trang,0,.2,d/2+.02,g);
  const anh=SP.filter(p=>p.anh.length);
  [-2.1,2.1].forEach((fx,i)=>{
    mesh(box(1.7,1.4,.06),C.trang,fx,.5,d/2+.01,g);
    const p=anh[i%Math.max(1,anh.length)];
    const t=p?anhTex(p.anh[0]):new T.CanvasTexture(veAo(C.hong));
    const a=new T.Mesh(new T.PlaneGeometry(1.5,1.2),new T.MeshBasicMaterial({map:t}));a.position.set(fx,1.2,d/2+.05);g.add(a);
  });
  /* Mái hiên sọc trước cửa */
  const hien=group(0,2.25,d/2+.55,0,g);hien.rotation.x=.38;
  for(let i=0;i<10;i++)mesh(box(.6,.07,1.2),i%2?C.trang:C.tim,-2.7+i*.6,0,0,hien);
  /* Cửa sổ tầng trên */
  for(let i=0;i<3;i++){mesh(box(1.1,1.1,.06),C.trang,-2+i*2,.38+h1+.5,d/2+.01,g);mesh(box(.9,.9,.07),C.kinh,-2+i*2,.38+h1+.6,d/2+.02,g);}
  for(let i=0;i<2;i++){mesh(box(.06,1.1,1.1),C.trang,w/2+.01,.38+h1+.5,-1+i*2,g);mesh(box(.07,.9,.9),C.kinh,w/2+.02,.38+h1+.6,-1+i*2,g);}
  /* Biển tên có logo */
  const bien=bienTen();bien.position.set(0,.38+h1-.05,d/2+.12);g.add(bien);
  /* Áo phông khổng lồ trên mái, quay chậm */
  const S=new T.Shape();[[-.9,.9],[-.3,1.05],[0,.9],[.3,1.05],[.9,.9],[1.35,.35],[.95,.05],[.62,.3],[.62,-1],[-.62,-1],[-.62,.3],[-.95,.05],[-1.35,.35]].forEach((p,i)=>S[i?'lineTo':'moveTo'](p[0],p[1]));S.closePath();
  const tg=new T.ExtrudeGeometry(S,{depth:.32,bevelEnabled:true,bevelSize:.07,bevelThickness:.07,bevelSegments:2});tg.center();
  const ao=group(0,top+1.35,0,0,g);mesh(tg,C.vang,0,0,0,ao);
  const tim=new T.Shape();tim.moveTo(0,-.25);tim.bezierCurveTo(-.45,.05,-.25,.38,0,.18);tim.bezierCurveTo(.25,.38,.45,.05,0,-.25);
  const hg=new T.ExtrudeGeometry(tim,{depth:.08,bevelEnabled:false});
  mesh(hg,C.do,0,.05,.24,ao);mesh(hg,C.do,0,.05,-.32,ao);
  mesh(cyl(.08,.08,.5,8),C.trang,0,top,0,g);
  /* Máy lạnh và bồn nước trên mái */
  mesh(rbox(.9,.5,.6,.1),C.trang,-2.2,top,-1.2,g);mesh(cyl(.4,.4,.8,14),C.trang,2.3,top,-1.3,g);
  return {g,ao};
}
/* Biển tên DuuDuu: logo tròn và chữ, vẽ khi font đã tải */
function bienTen(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const t=new T.CanvasTexture(cv);t.anisotropy=8;
  const m=new T.Mesh(new T.PlaneGeometry(4.4,1.1),new T.MeshBasicMaterial({map:t,transparent:true}));
  const ve=im=>{const c=cv.getContext('2d');c.clearRect(0,0,1024,256);c.fillStyle='#FFFFFF';
    c.beginPath();c.moveTo(128,16);c.arcTo(1008,16,1008,240,112);c.arcTo(1008,240,16,240,112);c.arcTo(16,240,16,16,112);c.arcTo(16,16,1008,16,112);c.fill();
    if(im){c.fillStyle='#FFF4D6';c.beginPath();c.arc(128,128,96,0,2*PI);c.fill();c.drawImage(im,40,40,176,176);}
    c.fillStyle='#2A1670';c.font='800 120px "Baloo 2",system-ui,sans-serif';c.textBaseline='middle';c.fillText('DuuDuu',250,140);t.needsUpdate=true;};
  const im=new Image();im.onload=()=>ve(im);
  (document.fonts?document.fonts.load('800 120px "Baloo 2"'):Promise.resolve()).catch(()=>{}).then(()=>{ve(null);im.src='anh/logo.png';});
  return m;
}

/* Góc giao hàng: thùng carton tím cam và xe máy */
function gocGiao(x,z){
  const g=group(x,0,z,-.4);
  mesh(rbox(2.6,1.8,1.8,.2),C.ngoc,0,0,0,g);mesh(rbox(2.9,.22,2.1,.25),C.trang,0,1.8,0,g);
  mesh(box(1.8,.9,.06),C.kinh,0,.7,.91,g);
  [[-.7,0,1.3,.5],[.1,0,1.4,.42],[-.3,.5,1.35,.36]].forEach(([a,b,c,s])=>{mesh(rbox(s,s*.8,s,.04),'#E9B97E',a,b,c,g);mesh(box(s*.98,s*.8+.005,.07),C.tim,a,b,c,g);});
  return g;
}
/* Cầu trượt, bập bênh cho bé ở công viên */
function sanChoi(x,z){
  const g=group(x,0,z,.5);
  mesh(box(.9,1.3,.9),C.vang,0,0,0,g);mesh(box(1,.1,1),C.trang,0,1.3,0,g);
  const tr=mesh(box(.7,.08,2.2),C.do,0,.68,1.35,g);tr.rotation.x=.55;
  for(let i=0;i<4;i++)mesh(box(.7,.06,.2),C.trang,0,.3*i+.15,-.55,g);
  const bb=group(2,0,.3,0,g);mesh(cyl(.12,.16,.35,10),C.tim,0,0,0,bb);const thanh=mesh(box(2.2,.1,.24),C.ngoc,0,.38,0,bb);thanh.rotation.z=.18;
  return g;
}

/* ---------- Xe chạy trên đường ---------- */
const xe=[];
function oto(col,lan,x,v,kieu){
  const g=group(x,0,lan,v>0?0:PI);
  const dai=kieu==='van'?2.1:1.6;
  mesh(rbox(dai,.55,.95,.2),col,0,.22,0,g);
  mesh(rbox(kieu==='van'?1.5:.95,kieu==='van'?.6:.48,.85,.16),kieu==='van'?col:C.trang,kieu==='van'?-.2:-.1,.77,0,g);
  mesh(box(.06,.36,.78),C.kinh,kieu==='van'?.56:.38,.84,0,g);
  [[-dai/2+.4,.48],[dai/2-.4,.48],[-dai/2+.4,-.48],[dai/2-.4,-.48]].forEach(([a,b])=>{const b2=mesh(cyl(.2,.2,.14,12),'#2E2A44',a,.2,b,g);b2.rotation.x=PI/2;b2.position.y=.2;b2.position.z=b+(b>0?-.07:.07);});
  mesh(box(.04,.12,.18),glow('#FFF6C8'),dai/2+.01,.38,.3,g);mesh(box(.04,.12,.18),glow('#FFF6C8'),dai/2+.01,.38,-.3,g);
  if(kieu==='van'){const cv=document.createElement('canvas');cv.width=256;cv.height=96;const c=cv.getContext('2d');c.fillStyle='#fff';c.font='800 54px "Baloo 2",system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('DuuDuu',128,52);
    const t=new T.CanvasTexture(cv);[1,-1].forEach(s=>{const p=new T.Mesh(new T.PlaneGeometry(1.1,.42),new T.MeshBasicMaterial({map:t,transparent:true}));p.position.set(-.2,.78,s*.43);if(s<0)p.rotation.y=PI;g.add(p);});
    document.fonts&&document.fonts.load('800 54px "Baloo 2"').then(()=>{c.clearRect(0,0,256,96);c.fillText('DuuDuu',128,52);t.needsUpdate=true;}).catch(()=>{});}
  xe.push({g,v,x});
}

/* ---------- Người đi chợ ---------- */
const nguoi=[];
const DA=['#FFE0C7','#F6CFAE','#E8B48F'],TOC=['#5A3A2A','#7A4E36','#3A2A24','#A0683E'],AO=[C.hong,C.tim,C.ngoc,C.vang,C.lam,C.cam,C.trang,C.do];
function nguoiDi(x,z,be){
  const s=be?.62:1,g=group(x,0,z);g.scale.setScalar(s);
  const ao=AO[(Math.random()*AO.length)|0];
  const than=group(0,0,0,0,g);
  mesh(cyl(.09,.09,.4,6),'#4B4766',-.1,0,0,than);mesh(cyl(.09,.09,.4,6),'#4B4766',.1,0,0,than);
  mesh(cyl(.2,.27,.62,12),ao,0,.38,0,than);
  mesh(sph(.22,12),DA[(Math.random()*3)|0],0,1.2,0,than);
  const t=mesh(sph(.235,12),TOC[(Math.random()*4)|0],0,1.27,-.06,than);t.scale.set(1,.75,.95);
  if(!be&&Math.random()<.4)mesh(rbox(.22,.24,.12,.04),C.vang,.3,.45,0,than);
  const p={g,than,x,z,tx:x,tz:z,v:(be?.7:.9)*(.8+Math.random()*.4),cho:Math.random()*3,pha:Math.random()*6};
  nguoi.push(p);return p;
}
function diemMoi(p){
  /* Đi loanh quanh trong sân chợ, tránh mép */
  p.tx=PLAZA.x0+1+Math.random()*(PLAZA.x1-PLAZA.x0-2);p.tz=PLAZA.z0+1+Math.random()*(PLAZA.z1-PLAZA.z0-1.4);
}

/* Bóng bay buộc trước cửa hàng */
const bong=[];
function chumBong(x,z){
  const cols=[C.hong,C.tim,C.vang,C.ngoc,C.do];
  cols.forEach((c,i)=>{const a=i/cols.length*2*PI,bx=x+Math.cos(a)*.3,bz=z+Math.sin(a)*.3,by=2.4+(i%2)*.35;
    const m=mesh(sph(.28,14),mat(c),bx,by,bz);m.scale.set(1,1.18,1);
    const l=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x,.3,z),new T.Vector3(bx,by-.3,bz)]),new T.LineBasicMaterial({color:'#8C83B0'}));scene.add(l);
    bong.push({m,y:by,pha:i});});
}

/* ---------- Dựng phố ---------- */
const ch=cuaHang(7.6,-5.6);
const VI=[[-9,-5.4,0],[-4.1,-5.4,0],[-9.3,-.6,.22],[-3.7,-.6,-.22],[-6.6,3.2,0],[-1.2,3.2,0]];
KHU.slice(0,VI.length).forEach((k,i)=>sap(k,VI[i][0],VI[i][1],VI[i][2]));
/* Ô dù giữa các sạp */
[[-6.5,-2.9,C.hong],[-.9,-3.3,C.vang],[-6.4,1.7,C.ngoc],[0.9,.9,C.tim]].forEach(([x,z,c])=>{if(KHU.length<5||z<1)umbrella(x,z,c);});
/* Cột đèn dây quanh sân */
const c1=cot(PLAZA.x0+.3,PLAZA.z0+.3),c2=cot(PLAZA.x1-.3,PLAZA.z0+.3),c3=cot(PLAZA.x0+.3,PLAZA.z1-.3,3),c4=cot(PLAZA.x1-.3,PLAZA.z1-.3,3);
dayDen(c1,c2,.45,18);dayDen(c3,c4,.45,18);dayDen(c1,c4,.8,20);
/* Cây và công viên */
[[PARK.x0+.8,PARK.z0+.7,1],[PARK.x1-.8,PARK.z0+.8,1.15],[PARK.x1-.9,PARK.z1-.8,.9],[PARK.x0+3.4,PARK.z0+.5,.8],[X1-.9,-8.2,1],[X0+.9,4.9,.7],[3.6,4.9,.7],[X1-1.2,4.9,.7]].forEach(([x,z,s])=>tree(x,z,s));
sanChoi(PARK.x0+2.4,PARK.z0+2.4);
bench(PARK.x0+5.2,PARK.z1-.6,PI);lamp(PARK.x0+4.2,PARK.z0+.4);lamp(-1.5,WALK[0]+.7);lamp(-8,WALK[0]+.7);
gocGiao(X1-1.8,-.1);
chumBong(7.6+3.9,-5.6+3.3);
/* Xe */
oto(C.tim,ROAD[0]+.8,-8,1.5,'van');oto(C.vang,ROAD[0]+.8,5,1.5);oto(C.do,ROAD[1]-.8,-2,-1.9);oto(C.ngoc,ROAD[1]-.8,9,-1.9,'van');
/* Người: mẹ và bé dạo chợ */
for(let i=0;i<9;i++){const p=nguoiDi(PLAZA.x0+1+Math.random()*12,PLAZA.z0+1+Math.random()*10,false);diemMoi(p);
  if(i%2===0){const b=nguoiDi(p.x+.5,p.z+.3,true);b.theo=p;}}
/* Vài người đứng trước sạp xem hàng */
chamDuoc.forEach(g=>{if(!g.userData.khu)return;const v=new T.Vector3(0,0,2.1).applyAxisAngle(new T.Vector3(0,1,0),g.rotation.y).add(g.position);
  const p=nguoiDi(v.x-.4,v.z,false);p.dung=true;p.g.rotation.y=g.rotation.y+PI;const b=nguoiDi(v.x+.3,v.z+.2,true);b.dung=true;b.g.rotation.y=g.rotation.y+PI;});

/* ---------- Tên sạp nổi ---------- */
const tags=$('#tags');
nhanSap.forEach(n=>{const el=document.createElement('button');el.className='tag';el.type='button';el.innerHTML=`<i style="background:${n.k.mau}"></i>`;
  el.appendChild(document.createTextNode(n.k.ten));el.addEventListener('click',()=>moSap(n.k));tags.appendChild(el);n.el=el;});

/* ---------- Máy quay: nhìn chéo từ trên, kéo để xoay, chụm/cuộn để phóng ---------- */
const DOC=innerHeight>innerWidth;
/* Màn dọc: nhìn cao hơn và xoay để chiều dài phố chạy dọc màn hình */
const view={yaw:DOC?1.02:.62,pitch:DOC?.82:.6,zoom:1,ranh:0};view.tYaw=view.yaw;view.tPitch=view.pitch;view.tZoom=1;
function khungNhin(){
  const w=innerWidth,h=innerHeight,a=w/h,doc=h>w;renderer.setSize(w,h,false);
  const halfW=(doc?Math.max(9.6,8.4*a):Math.max(12.4,11.8*a))/view.zoom,halfH=halfW/a;
  /* Đẩy sa bàn lên một chút để chừa chỗ cho nút ở dưới */
  const len=halfH*(doc?.1:.04);
  cam.left=-halfW;cam.right=halfW;cam.top=halfH-len;cam.bottom=-halfH-len;cam.updateProjectionMatrix();
}
function datCam(){
  const r=60;cam.position.set(Math.sin(view.yaw)*Math.cos(view.pitch)*r,Math.sin(view.pitch)*r,Math.cos(view.yaw)*Math.cos(view.pitch)*r);
  cam.lookAt(0,0,0);
}
addEventListener('resize',()=>{khungNhin();});

const ptr=new Map();let keo=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptr.size===1)keo={x:e.clientX,y:e.clientY,yaw:view.tYaw,pitch:view.tPitch,move:0,t:performance.now()};
  else if(ptr.size===2){const [a,b]=[...ptr.values()];keo={pinch:Math.hypot(a.x-b.x,a.y-b.y),zoom:view.tZoom,move:99};}
  view.ranh=performance.now();anGoiY();});
canvas.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId)||!keo)return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(keo.pinch&&ptr.size===2){const [a,b]=[...ptr.values()];view.tZoom=Math.min(2.6,Math.max(.75,keo.zoom*Math.hypot(a.x-b.x,a.y-b.y)/keo.pinch));}
  else if(!keo.pinch){const dx=e.clientX-keo.x,dy=e.clientY-keo.y;keo.move=Math.max(keo.move,Math.hypot(dx,dy));
    view.tYaw=keo.yaw-dx*.008;view.tPitch=Math.min(1.15,Math.max(.32,keo.pitch+dy*.005));}
  view.ranh=performance.now();});
const tha=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);
  if(keo&&!keo.pinch&&keo.move<8&&e.type==='pointerup')cham(e.clientX,e.clientY);
  if(!ptr.size)keo=null;};
canvas.addEventListener('pointerup',tha);canvas.addEventListener('pointercancel',tha);
canvas.addEventListener('wheel',e=>{e.preventDefault();view.tZoom=Math.min(2.6,Math.max(.75,view.tZoom*Math.exp(-e.deltaY*.0015)));view.ranh=performance.now();},{passive:false});

const ray=new T.Raycaster(),ndc=new T.Vector2();
function cham(x,y){
  ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);ray.setFromCamera(ndc,cam);
  const hit=ray.intersectObjects(chamDuoc,true)[0];if(!hit)return;
  let o=hit.object;while(o&&!o.userData.khu&&!o.userData.cuaHang)o=o.parent;if(!o)return;
  if(o.userData.khu)moSap(o.userData.khu);else location.href='index.html';
}

/* ---------- Bảng mẫu của sạp ---------- */
const wrap=$('#sheetWrap');
function moSap(k){
  $('#sTen').textContent=k.ten;$('#sSub').textContent=`${k.ps.length} mẫu ở sạp này. Vào chợ để xem ảnh thật, chọn size theo cân nặng của bé.`;
  const ul=$('#sList');ul.innerHTML='';
  k.ps.forEach(p=>{const li=document.createElement('li');
    const im=p.anh.length?Object.assign(document.createElement('img'),{src:p.anh[0],alt:'',loading:'lazy'}):Object.assign(document.createElement('div'),{className:'ph'});
    const d=document.createElement('div');const b=document.createElement('b');b.textContent=p.ten;const g=document.createElement('span');g.className='gia';g.textContent=giaChu(p);
    const s=document.createElement('small');s.textContent=p.het?'Hết hàng':(p.tu&&p.den?`Bé ${p.tu}–${p.den}kg`:'');d.append(b,g,s);li.append(im,d);ul.appendChild(li);});
  wrap.hidden=false;$('#sClose').focus();
}
const dong=()=>{wrap.hidden=true;};
$('#sClose').addEventListener('click',dong);
wrap.addEventListener('click',e=>{if(e.target===wrap)dong();});
addEventListener('keydown',e=>{if(e.key==='Escape')dong();});

let goiY=true;function anGoiY(){if(goiY){goiY=false;$('#hint').classList.add('off');}}
setTimeout(anGoiY,7000);

/* ---------- Vòng vẽ ---------- */
const tmp=new T.Vector3();let last=performance.now(),time=0,cham60=0,fps=60;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  /* Tự xoay rất chậm khi khách không chạm */
  if(!REDUCED&&!keo&&now-view.ranh>5000&&wrap.hidden)view.tYaw+=dt*.06;
  const k=1-Math.pow(.0001,dt);
  view.yaw+=(view.tYaw-view.yaw)*k;view.pitch+=(view.tPitch-view.pitch)*k;
  if(Math.abs(view.tZoom-view.zoom)>1e-4){view.zoom+=(view.tZoom-view.zoom)*k;khungNhin();}
  datCam();

  if(!REDUCED){
    xe.forEach(c=>{c.x+=c.v*dt;if(c.x>X1+.6)c.x=X0-.6;if(c.x<X0-.6)c.x=X1+.6;c.g.position.x=c.x;
      /* Thu nhỏ khi tới mép đế để xe không trồi ra ngoài */
      const e=Math.min(1,(X1+.2-Math.abs(c.x))/1.4);c.g.scale.setScalar(Math.max(0,e));c.g.visible=e>0;});
    nguoi.forEach(p=>{
      if(p.dung){p.than.position.y=Math.abs(Math.sin(time*1.5+p.pha))*.02;return;}
      if(p.theo){p.tx=p.theo.g.position.x+.55;p.tz=p.theo.g.position.z+.25;}
      const dx=p.tx-p.g.position.x,dz=p.tz-p.g.position.z,dd=Math.hypot(dx,dz);
      if(dd<.15){if(!p.theo){p.cho-=dt;if(p.cho<0){p.cho=1+Math.random()*3;diemMoi(p);}}p.than.position.y=0;return;}
      const sp=Math.min(dd,p.v*dt*(p.theo&&dd>1?1.6:1));p.g.position.x+=dx/dd*sp;p.g.position.z+=dz/dd*sp;
      const want=Math.atan2(dx,dz);let r=want-p.g.rotation.y;r=Math.atan2(Math.sin(r),Math.cos(r));p.g.rotation.y+=r*Math.min(1,dt*8);
      p.than.position.y=Math.abs(Math.sin(time*9+p.pha))*.07;});
    bong.forEach(b=>{b.m.position.y=b.y+Math.sin(time*1.3+b.pha)*.08;});
    ch.ao.rotation.y=time*.6;ch.ao.position.y=.38+2.3+2.1+.3+1.35+Math.sin(time*1.6)*.12;
  }

  renderer.render(scene,cam);

  /* Tên sạp bám theo sạp */
  nhanSap.forEach(n=>{tmp.set(0,n.y,0).applyMatrix4(n.g.matrixWorld).project(cam);
    const x=(tmp.x*.5+.5)*innerWidth,y=(-tmp.y*.5+.5)*innerHeight;
    n.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;});

  /* Máy chậm thì giảm độ nét */
  fps=fps*.95+(1/Math.max(dt,1e-3))*.05;cham60=fps<30?cham60+dt:0;
  if(cham60>2&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);khungNhin();cham60=0;}
  requestAnimationFrame(frame);
}
khungNhin();datCam();
requestAnimationFrame(t=>{last=t;frame(t);});
setTimeout(()=>$('#load').classList.add('off'),350);
