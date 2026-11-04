(function(){
'use strict';
const $=s=>document.querySelector(s);
if(!window.THREE){$('#load').textContent='Chưa tải được phần 3D. Anh kiểm tra mạng rồi mở lại giúp em.';return;}
const T=THREE, V3=T.Vector3, PI=Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t;
const angLerp=(a,b,t)=>{let d=(b-a+PI)%(2*PI);if(d<0)d+=2*PI;return a+(d-PI)*t;};
const seeded=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOW=(navigator.deviceMemory&&navigator.deviceMemory<=3)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
const mat=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>new T.Matrix4().compose(new V3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz,'YXZ')),new V3(sx,sy,sz));

/* ---------- Sản phẩm mẫu ---------- */
const SIZES=['10–12kg','13–15kg','16–18kg','19–22kg','23–25kg','26–28kg'];
const P=[
 {id:'gau',name:'Set gấu hồng',price:59,kind:'pj',tile:'#FFD3E0',base:'#FFF0F4',mark:'#E9809F',pat:'dots',bear:1},
 {id:'xanh',name:'Set kẻ xanh',price:59,kind:'pj',tile:'#CDE7FF',base:'#E6F3FF',mark:'#7EB6EC',pat:'stripe',bear:1},
 {id:'heo',name:'Set heo vàng',price:59,kind:'pj',tile:'#FFE9A8',base:'#FFF2B8',mark:'#EC7FA0',pat:'dots',bear:1},
 {id:'do',name:'Set kẻ đỏ',price:69,kind:'pj',tile:'#FFC9C4',base:'#E5484D',mark:'#FFFFFF',pat:'stripe',bear:1},
 {id:'somi',name:'Sơ mi đi học',price:69,kind:'school',tile:'#D7E3FF',base:'#FFFFFF',mark:'#BFD0F5',pat:'stripe',pant:'#2D3E86'},
 {id:'yem',name:'Set yếm bò',price:69,kind:'school',tile:'#CFEBDD',base:'#FFE27A',mark:'#F5C93F',pat:'stripe',pant:'#4B74B8'},
 {id:'khoac',name:'Áo khoác tai gấu',price:69,kind:'coat',tile:'#F2DFC8',base:'#B97A4E',mark:'#A0653C',pat:'plain',pant:'#6B4A36'},
 {id:'phao',name:'Áo khoác mint',price:69,kind:'coat',tile:'#C9F1E5',base:'#57CDB2',mark:'#3CB399',pat:'plain',pant:'#2E6F7C'},
 {id:'sao',name:'Set sao đêm',price:59,kind:'pj',tile:'#D8D2FF',base:'#5C4FC4',mark:'#FFD866',pat:'dots',bear:0},
 {id:'cam',name:'Set cam tươi',price:59,kind:'pj',tile:'#FFD9B8',base:'#FFA45C',mark:'#FFFFFF',pat:'dots',bear:0}
];
const byId=Object.fromEntries(P.map(p=>[p.id,p]));
P.forEach((p,i)=>{const r=seeded(97+i*31);p.stock=SIZES.map(()=>{const v=r();return v<.16?0:1+Math.floor(r()*6);});p.look=2+Math.floor(r()*9);});

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
P.forEach(p=>{p.tex=texOf(setCanvas(p));
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
    this.p=this.n=this.c=null;
    return new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true}));
  }
}
const seg=v=>clamp(Math.ceil(v/1.5),1,14);
const boxG=(w,h,d)=>new T.BoxGeometry(w,h,d,seg(w),seg(h),seg(d));
const LP=(x,y,z,i,r,c)=>({x,y,z,i,r2:r*r,c});
const WARM=[1,.72,.42],GOLD=[1,.84,.55];

function newScene(id,title,sub){
  const s={id,title,sub,root:new T.Group(),lit:new Batch(),glow:new Batch(),pts:[],col:[],items:[],doors:[],glows:[],npcs:[],stack:[new T.Matrix4()],tags:[]};
  s.m=()=>s.stack[s.stack.length-1];
  s.push=m=>s.stack.push(s.m().clone().multiply(m));s.pop=()=>s.stack.pop();
  s.at=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>s.m().clone().multiply(mat(x,y,z,ry,rx,rz,sx,sy,sz));
  s.box=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>s.lit.add(boxG(w,h,d),c,s.at(x,y,z,ry,rx,rz));
  s.cyl=(r1,r2,h,x,y,z,c,sg=10,rx=0,rz=0)=>s.lit.add(new T.CylinderGeometry(r1,r2,h,sg),c,s.at(x,y,z,0,rx,rz));
  s.ball=(r,x,y,z,c,sy=1,d=1)=>s.lit.add(new T.IcosahedronGeometry(r,d),c,s.at(x,y,z,0,0,0,1,sy,1));
  s.gball=(r,x,y,z,c,sy=1)=>s.glow.add(new T.SphereGeometry(r,10,8),c,s.at(x,y,z,0,0,0,1,sy,1));
  s.gbox=(w,h,d,x,y,z,c)=>s.glow.add(new T.BoxGeometry(w,h,d),c,s.at(x,y,z));
  s.world=(x,y,z)=>new V3(x,y,z).applyMatrix4(s.m());
  s.halo=(x,y,z,c,size=2.6)=>{const v=s.world(x,y,z);s.glows.push({v,c:new T.Color(c),size});};
  s.solid=(minX,maxX,minZ,maxZ,tall=true)=>s.col.push({minX,maxX,minZ,maxZ,tall});
  s.round=(x,z,r)=>s.col.push({x,z,r});
  s.plane=(tex,w,h,x,y,z,ry=0,opts={})=>{const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,...opts}));o.applyMatrix4(s.at(x,y,z,ry));s.root.add(o);return o;};
  return s;
}
function finish(s,light){
  light.pts=s.pts;s.root.add(s.lit.mesh(light));s.root.add(s.glow.mesh(null));
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
function hangSet(s,id,x,y,z,ry=0,sc=1){
  const p=byId[id],gr=.92*sc;
  const m=new T.Mesh(new T.PlaneGeometry(gr,gr*1.11),new T.MeshBasicMaterial({map:p.tex,alphaTest:.5,side:T.DoubleSide}));
  m.applyMatrix4(s.at(x,y,z,ry));m.userData.item=p;s.root.add(m);
  s.lit.add(new T.TorusGeometry(.2*sc,.016,4,12,PI),'#8A5A3C',s.at(x,y+gr*.56,z+.012,ry));
  s.box(.03,.16,.03,x,y+gr*.68,z,'#C8CCD8');
  s.items.push({mesh:m,p,grp:s.grp,pos:m.getWorldPosition(new V3()).clone()});
  m.updateMatrixWorld();s.items[s.items.length-1].pos.setFromMatrixPosition(m.matrixWorld);
}

function mannequin(s,id,x,z,ry=0,plinth=.28){
  const p=byId[id];
  s.cyl(.5,.56,plinth,x,plinth/2,z,'#FFF6E5',18);
  const m=new T.Mesh(manBody,new T.MeshLambertMaterial({map:p.cloth}));
  m.applyMatrix4(s.at(x,plinth,z,ry,0,0,1.15,1.15,1.15));m.userData.item=p;s.root.add(m);
  const m2=new T.Mesh(manLegs,new T.MeshLambertMaterial({map:p.clothB}));m2.applyMatrix4(s.at(x,plinth,z,ry,0,0,1.15,1.15,1.15));m2.userData.item=p;s.root.add(m2);
  s.lit.add(new T.SphereGeometry(.34,14,10),'#FFEBD6',s.at(x,plinth+1.16,z,ry),true);
  s.lit.add(new T.CylinderGeometry(.11,.13,.1,10),'#FFE0C2',s.at(x,plinth+.94,z));
  const v=s.world(x,plinth+.8,z);s.items.push({mesh:m,p,grp:s.grp,pos:v});s.items.push({mesh:m2,p,grp:s.grp,pos:v,dup:1});
  return v;
}
function plant(s,x,z,sc=1){
  s.cyl(.36*sc,.27*sc,.5*sc,x,.25*sc,z,'#D2704B',10);s.cyl(.05*sc,.07*sc,1.1*sc,x,.95*sc,z,'#6A4028',6);
  s.ball(.6*sc,x,1.7*sc,z,'#3F9A63');s.ball(.42*sc,x+.32*sc,1.35*sc,z+.15*sc,'#4FB071');s.ball(.42*sc,x-.3*sc,1.45*sc,z-.1*sc,'#357F52');
  s.round(x,z,.45*sc);
}

/* ---------- CẢNH 1: CHỢ ĐÊM ---------- */
function marketGround(){
  const Q=LOW?.5:1,cv=document.createElement('canvas');cv.width=cv.height=2048*Q;const c=cv.getContext('2d'),S=2048/96,X=x=>(x+48)*S,Z=z=>(z+52)*S,r=seeded(5);c.scale(Q,Q);
  c.fillStyle='#1E4C5C';c.fillRect(0,0,2048,2048);
  for(let i=0;i<9000;i++){c.fillStyle=r()<.5?'rgba(40,110,110,.5)':'rgba(16,50,70,.5)';c.fillRect(r()*2048,r()*2048,3+r()*5,2+r()*3);}
  const area=(x0,z0,x1,z1)=>{const a=X(x0),b=Z(z0),w=(x1-x0)*S,h=(z1-z0)*S;const bh=7,bw=15;
    for(let y=b,row=0;y<b+h;y+=bh,row++)for(let x=a-(row%2)*bw/2;x<a+w;x+=bw){const v=r();c.fillStyle=v<.33?'#59609E':v<.66?'#646AAA':'#6E72B0';c.fillRect(Math.max(a,x),y,Math.min(bw-1,a+w-x),bh-1);}};
  area(-14.500,-34,14.500,38);
  c.globalCompositeOperation='lighter';
  const pool=(x,z,rad,col)=>{const R=rad*S,g=c.createRadialGradient(X(x),Z(z),0,X(x),Z(z),R);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(X(x)-R,Z(z)-R,R*2,R*2);};
  for(let z=22;z>=-13;z-=7)pool(0,z,8,'rgba(255,150,70,.28)');
  for(const z of[13,3,-7]){pool(-6.500,z,6.500,'rgba(255,175,90,.5)');pool(6.500,z,6.500,'rgba(255,175,90,.5)');}
  pool(-7.500,-26,9,'rgba(255,170,90,.42)');pool(0,-22,7,'rgba(255,170,90,.2)');pool(0,-34,7,'rgba(255,200,120,.75)');pool(0,27,5,'rgba(255,170,80,.4)');pool(9.500,-22,6,'rgba(255,190,110,.32)');pool(-11,-17,5,'rgba(255,170,90,.35)');
  c.globalCompositeOperation='multiply';
  const dark=(x0,z0,x1,z1)=>{c.save();c.shadowColor='rgba(60,50,120,.75)';c.shadowBlur=26*Q;c.shadowOffsetX=4000*Q;c.fillRect(X(x0)-4000,Z(z0),(x1-x0)*S,(z1-z0)*S);c.restore();};
  for(const z of[13,3,-7]){dark(-10.800,z-3.300,-7,z+3.300);dark(7,z-3.300,10.800,z+3.300);}
  c.globalCompositeOperation='source-over';
  const t=texOf(cv);t.anisotropy=8;return t;
}
function skyTex(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,'#141A4F');g.addColorStop(.55,'#3A2F86');g.addColorStop(.8,'#A7518E');g.addColorStop(.93,'#F58A6A');g.addColorStop(1,'#FFC27A');
  c.fillStyle=g;c.fillRect(0,0,1024,512);
  const r=seeded(11);c.fillStyle='#FFFFFF';for(let i=0;i<260;i++){c.globalAlpha=.3+r()*.7;const s=r()<.1?2.4:1.4;c.fillRect(r()*1024,r()*170,s,s);}
  c.globalAlpha=1;c.fillStyle='#FFF4D6';c.beginPath();c.arc(640,86,20,0,7);c.fill();
  return texOf(cv);
}
function stall(s,name,color,ids,man,x,z,ry){
  s.grp='Sạp '+name;s.push(mat(x,0,z,ry));
  const wood='#7A4A2E';
  for(const[px,pz]of[[-2.900,-1.600],[2.900,-1.600],[-2.900,2.100],[2.900,2.100]])s.box(.14,pz<0?3.5:2.7,.14,px,(pz<0?3.5:2.7)/2,pz,wood);
  s.box(5.800,3.200,.1,0,1.600,-1.650,'#F5D796');
  s.box(5.600,.9,.1,0,.45,1.600,'#8A5A3C');
  s.box(5.800,.08,1.500,0,.92,.95,'#D49A62');
  const rnd=seeded(Math.abs(Math.floor(x*7+z*13))+3),cols=['#FF8FB3','#7EC4FF','#FFD866','#F2545B','#6FE0C4','#FFFFFF','#B9A8FF'];
  for(let i=0;i<9;i++){const px=-2.300+i*.58,h=2+Math.floor(rnd()*4);for(let k=0;k<h;k++)s.box(.48,.07,.6,px,1+k*.08,.95+(k%2)*.02,cols[Math.floor(rnd()*cols.length)]);}
  s.lit.add(new T.CylinderGeometry(.03,.03,5.400,6),'#C8CCD8',s.at(0,2.750,-1.350,0,0,PI/2));
  ids.forEach((id,i)=>hangSet(s,id,-1.950+i*1.300,2.050,-1.320,0,.98));
  const n=8,w=5.900/n,len=4.300,ang=Math.atan2(.85,3.8);
  for(let i=0;i<n;i++){const ax=-5.900/2+w*(i+.5),c=i%2?'#FFF6E5':color;
    s.box(w,.06,len,ax,3.120,.25,c,0,ang);
    s.lit.add(new T.CylinderGeometry(w/2,w/2,.05,12,1,false,0,PI),c,s.at(ax,2.670,2.240,PI/2,0,PI/2));
    s.box(w,.26,.05,ax,2.800,2.240,c);}
  s.gbox(5.400,.03,.03,0,2.620,2.180,'#FFD98A');
  for(let i=0;i<6;i++){s.gball(.07,-2.500+i,2.580,2.180,'#FFF0B0');s.halo(-2.500+i,2.580,2.180,'#FFB65C',1.8);}
  const tx=sign(name,{w:512,h:120,bg:'#1B2458',size:name.length>10?52:62});s.plane(tx,3.300,.78,0,3.950,-1.620);
  s.box(3.500,.95,.08,0,3.950,-1.700,wood);
  mannequin(s,man,1.600*(x<0?-1:1),3.000,0,.2);
  const c=s.world(0,2.400,.8);s.pts.push(LP(c.x,c.y,c.z,1.05,8,WARM));
  s.pop();
  const hx=3.5,hz=2.1;const cx=x+(x<0?-.1:.1);s.solid(x<0?cx-1.900:cx-2.300,x<0?cx+2.300:cx+1.900,z-3,z+3);
}
function house(s,x,z,w,h,d,wall,roof,side,rnd){
  s.box(d,h,w,x,h/2,z,wall);
  s.lit.add(new T.CylinderGeometry(d*.74,d*.74,w+.4,3),roof,s.at(x,h+d*.36,z,0,PI/2,0));
  const fl=Math.floor(h/3);
  for(let f=0;f<fl;f++)for(let i=0;i<2;i++){const wz=z-w/4+i*w/2,wy=2+f*3,on=rnd()<.68;
    const fx=x+side*(d/2+.04);
    if(on)s.gbox(.04,1.300,.8,fx,wy,wz,rnd()<.5?'#FFD98A':'#FFC065');else s.box(.04,1.300,.8,fx,wy,wz,'#3C4A7A');
    s.box(.08,1.400,.2,fx+side*.02,wy,wz-.5,'#2F8A7B');s.box(.08,1.400,.2,fx+side*.02,wy,wz+.5,'#2F8A7B');
    s.box(.3,.08,1.100,fx+side*.12,wy-.72,wz,'#E7E0D0');
    if(on)s.pts.push(LP(fx+side*1.2,wy,wz,.32,4.5,WARM));}
}
function banyan(s,x,z){
  s.cyl(1.0,1.700,4.800,x,2.400,z,'#6A4A38',11);
  const r=seeded(23);
  for(let i=0;i<12;i++){const a=i/12*2*PI,dd=1.2+r()*1.3;s.lit.add(new T.CylinderGeometry(.12,.32,2.400,6),'#5C3F30',s.at(x+Math.cos(a)*dd,1.100,z+Math.sin(a)*dd,0,Math.sin(a)*.35,-Math.cos(a)*.35));}
  for(let i=0;i<24;i++){const a=r()*7,rr=2+r()*4.500,fx=x+Math.cos(a)*rr,fz=z+Math.sin(a)*rr;s.cyl(.03,.03,3.600+r()*1.5,fx,3.800,fz,'#5C3F30',4);}
  const greens=['#1F6B4E','#2C8259','#17553F','#3A9666'];
  for(let i=0;i<26;i++){const a=r()*7,rr=r()*6.500,c=greens[i%4];s.ball(2+r()*1.7,x+Math.cos(a)*rr,6.300+r()*2.800,z+Math.sin(a)*rr,c,.72);}
  for(let i=0;i<36;i++){const a=r()*7,rr=3+r()*4,hy=4.600+r()*1.5,lx=x+Math.cos(a)*rr,lz=z+Math.sin(a)*rr;s.gball(.075,lx,hy,lz,'#FFE9A8');s.halo(lx,hy,lz,'#FFA94D',1.3);}
  s.pts.push(LP(x,4,z+3,.7,9,GOLD));s.round(x,z,2.300);
  s.cyl(3.200,3.400,.4,x,.2,z,'#8C8FA8',16);
}
function buildMarket(){
  const s=newScene('cho','Chợ đêm','Phố chợ, sân khấu, gốc đa và quán trà đá');
  const g=new T.Mesh(new T.PlaneGeometry(96,96),new T.MeshBasicMaterial({map:marketGround()}));g.rotation.x=-PI/2;g.position.set(0,0,-4);s.root.add(g);s.ground=g;
  const under=new T.Mesh(new T.PlaneGeometry(420,420),new T.MeshBasicMaterial({color:'#1E4C5C'}));under.rotation.x=-PI/2;under.position.y=-.05;s.root.add(under);
  const sky=new T.Mesh(new T.SphereGeometry(150,24,14),new T.MeshBasicMaterial({map:skyTex(),side:T.BackSide,fog:false}));s.root.add(sky);

  stall(s,'Đồ ngủ','#FF6F9F',['gau','xanh','heo','do'],'gau',-8.500,13,PI/2);
  stall(s,'Đồ đi học','#2FBFA0',['somi','yem','somi','yem'],'yem',8.500,13,-PI/2);
  stall(s,'Áo khoác','#3E8BFF',['khoac','phao','khoac','phao'],'phao',-8.500,3,PI/2);
  stall(s,'Giá sốc 59k','#FF8A3D',['cam','sao','gau','heo'],'cam',8.500,3,-PI/2);
  stall(s,'Bộ sao đêm','#7B6CF0',['sao','do','sao','cam'],'sao',-8.500,-7,PI/2);
  stall(s,'Đồ đôi cho bé','#E5484D',['do','xanh','cam','gau'],'do',8.500,-7,-PI/2);

  /* Cổng chợ */
  const gate='#A8352F';
  for(const px of[-6,6]){s.box(.9,6.400,.9,px,3.200,24,gate);s.box(1.300,.5,1.300,px,.25,24,'#7E8097');s.lit.add(new T.ConeGeometry(.95,.8,4),'#3B2D5C',s.at(px,6.800,24,PI/4));}
  s.box(12.800,.4,.8,0,6.100,24,gate);
  s.lit.add(new T.CylinderGeometry(1.1,1.1,14.500,3),'#7A2B3A',s.at(0,7,24,0,0,PI/2));
  s.lit.add(new T.ConeGeometry(.3,1.100,6),'#FFC93C',s.at(-7.400,7.800,24,0,0,.5));s.lit.add(new T.ConeGeometry(.3,1.100,6),'#FFC93C',s.at(7.400,7.800,24,0,0,-.5));
  s.plane(sign('CHỢ ĐÊM DUU DUU',{w:1024,h:150,bg:'#A8352F',fg:'#FFE9A8',edge:'#FFC93C',size:96}),10.400,1.520,0,5.050,24.480,0);
  s.pts.push(LP(0,4,26,1.1,10,WARM),LP(0,4,22,.8,9,WARM));
  s.solid(-6.500,-5.500,23.500,24.500);s.solid(5.500,6.500,23.500,24.500);

  /* Dây đèn lồng ngang phố */
  const lc=['#FF5A5F','#FFC93C','#FF7FA8','#4FD1B5','#FF9A3D'];
  s.lit.add(new T.CylinderGeometry(.025,.025,30,5),'#22284F',s.at(-5.700,7.700,3,0,PI/2));s.lit.add(new T.CylinderGeometry(.025,.025,30,5),'#22284F',s.at(5.700,7.700,3,0,PI/2));
  for(let z=18,k=0;z>=-12;z-=5,k++){
    for(let i=0;i<=26;i++){const t=i/26,x=lerp(-5.600,5.600,t),y=7.600-Math.sin(t*PI)*.8;s.lit.add(new T.SphereGeometry(.03,4,3),'#22284F',s.at(x,y,z));}
    if(k%2==0){s.cyl(.07,.09,7.800,-5.700,3.900,z,'#3A2E44',6);s.cyl(.07,.09,7.800,5.700,3.900,z,'#3A2E44',6);}
    for(let i=1;i<=7;i++){const t=i/8,x=lerp(-5.600,5.600,t),y=7.600-Math.sin(t*PI)*.8-.42,c=lc[(i+k)%5];
      s.gball(.26,x,y,z,c,1.2);s.box(.17,.05,.17,x,y+.32,z,'#2A2340');s.box(.17,.05,.17,x,y-.32,z,'#2A2340');s.cyl(.015,.015,.28,x,y-.47,z,'#FFE08A',4);s.halo(x,y,z,c,3);}
    if(k%2==0)s.pts.push(LP(0,5.800,z,.55,10,WARM));
  }

  /* Xe đẩy và thúng hàng giữa phố */
  const cart=(x,z,name,c1)=>{s.push(mat(x,0,z,.25));s.box(2.200,.1,1.100,0,.95,0,'#C98A52');s.box(2.200,.5,.06,0,1.200,.54,'#E8B677');s.box(2.200,.5,.06,0,1.200,-.54,'#E8B677');s.box(.06,.5,1.100,1.070,1.200,0,'#E8B677');s.box(.06,.5,1.100,-1.070,1.200,0,'#E8B677');
    const rc=seeded(Math.abs(Math.floor(x*9+z*5))+2),cc=['#FF8FB3','#7EC4FF','#FFD866','#6FE0C4','#FFFFFF','#F2545B'];for(let i=0;i<16;i++)s.ball(.16,-.9+(i%6)*.36,1.100+(i%3)*.05,-.3+(i%3)*.3,cc[Math.floor(rc()*6)],.8,0);
    for(const k of[-.8,.8])s.lit.add(new T.CylinderGeometry(.42,.42,.06,16),'#3A2E44',s.at(k,.42,.6,0,PI/2));s.box(.06,.06,1.300,-1.700,1.100,0,'#6A4028',0,0,.2);
    s.cyl(.03,.03,1.700,0,1.900,0,'#6A4028',5);s.lit.add(new T.ConeGeometry(1.450,.6,8),c1,s.at(0,2.900,0));s.gball(.1,0,2.520,0,'#FFF0B0');s.halo(0,2.520,0,'#FFB65C',3);s.pts.push(LP(0,0,0,0,1,WARM));s.pts.pop();
    const w=s.world(0,2.300,0);s.pts.push(LP(w.x,w.y,w.z,.6,5,WARM));s.plane(sign(name,{w:320,h:90,bg:'#FFF6E5',fg:'#1B2458',edge:c1,size:48}),1.300,.36,0,1.200,.59);s.pop();s.round(x,z,1.300);};
  cart(2.600,8.200,'Tất, mũ','#FF6F9F');cart(-2.700,-2.200,'Nơ, kẹp','#2FBFA0');
  const basket=(x,z)=>{s.cyl(.46,.34,.42,x,.21,z,'#C99A5E',12);s.ball(.26,x-.14,.45,z,'#FF8FB3',.7,0);s.ball(.24,x+.17,.45,z+.1,'#FFD866',.7,0);s.ball(.22,x,.46,z-.18,'#7EC4FF',.7,0);s.round(x,z,.46);};
  for(const[x,z]of[[-5.400,17.500],[5.300,17.300],[-5.300,8.100],[5.400,-2.100],[-5.200,-12.400],[5.300,-12.200]])basket(x,z);

  /* Sân khấu và quán trà đá */
  const SX=-7.500;s.cyl(4.800,5.000,.55,SX,.28,-26,'#9A5B3C',24);s.cyl(4.300,4.300,.03,SX,.57,-26,'#E5484D',24);
  s.box(8.400,5,.2,SX,2.900,-29.800,'#23306E');s.plane(sign('PHIÊN TỐI NAY',{w:1024,h:300,bg:'#2E2A86',fg:'#FFD866',edge:'#FF8FB3',size:120,sub:'Đồ ngủ cotton mới về'}),7.600,2.300,SX,3.800,-29.680);
  s.lit.add(new T.CylinderGeometry(.04,.05,1.5,6),'#30304A',s.at(SX+1.100,1.300,-24.600));s.lit.add(new T.SphereGeometry(.09,8,6),'#30304A',s.at(SX+1.100,2.060,-24.600));
  for(const px of[SX-4.200,SX+4.200]){s.cyl(.06,.08,5.600,px,2.800,-29.200,'#3A2E44',6);s.gball(.3,px,5.700,-29.200,'#FFF0B0');s.halo(px,5.700,-29.200,'#FFC070',5);s.pts.push(LP(px,4.500,-26,.75,10,GOLD));}
  s.round(SX,-26,5);s.solid(SX-4.300,SX+4.300,-30,-29.600);
  /* trà đá: ghế nhựa đỏ, bàn thấp, ấm */
  const tx=-11,tz=-17;
  s.cyl(.62,.62,.05,tx,.5,tz,'#3E8BFF',14);s.cyl(.07,.3,.48,tx,.25,tz,'#3E8BFF',8);s.lit.add(new T.SphereGeometry(.14,8,6),'#E8E4DA',s.at(tx,.66,tz));s.cyl(.05,.05,.12,tx+.18,.68,tz,'#E8E4DA',6);
  for(let i=0;i<5;i++){const a=i/5*2*PI,fx=tx+Math.cos(a)*1.150,fz=tz+Math.sin(a)*1.150;s.cyl(.21,.24,.03,fx,.31,fz,'#E5484D',10);s.cyl(.16,.22,.3,fx,.15,fz,'#C93B40',10);}
  s.plane(sign('Trà đá',{w:256,h:96,bg:'#FFF6E5',fg:'#1B2458',edge:'#E5484D',size:50}),1.500,.56,tx,2.600,tz-1.800);s.cyl(.04,.04,2.300,tx-.74,1.150,tz-1.800,'#3A2E44',5);s.cyl(.04,.04,2.300,tx+.74,1.150,tz-1.800,'#3A2E44',5);
  s.gball(.2,tx,2.100,tz,'#FFE9A8');s.halo(tx,2.100,tz,'#FFB65C',4);s.pts.push(LP(tx,2.200,tz,.6,6.500,WARM));s.cyl(.012,.012,1.5,tx,2.900,tz,'#22284F',3);s.round(tx,tz,1.700);
  banyan(s,10.200,-22);

  /* Mặt tiền cửa hàng cuối chợ */
  s.box(26,12,4,0,6,-37.500,'#F4C76B');s.box(26.800,.5,4.800,0,12.200,-37.500,'#A8352F');s.box(26,.3,.3,0,4.700,-35.350,'#FFF6E5');
  s.box(26,.8,.2,0,.4,-35.420,'#3C8F85');
  s.gbox(5.400,3.900,.1,0,2.200,-35.420,'#FFE9A8');s.box(.2,4.200,.3,-2.800,2.100,-35.350,'#7A4A2E');s.box(.2,4.200,.3,2.800,2.100,-35.350,'#7A4A2E');s.box(5.800,.25,.3,0,4.300,-35.350,'#7A4A2E');s.box(.08,3.900,.14,0,2.200,-35.340,'#7A4A2E');
  for(const dx of[-8,8]){s.gbox(6,3.200,.1,dx,2.500,-35.420,'#FFEFC2');s.box(6.300,.2,.28,dx,4.200,-35.340,'#7A4A2E');s.box(6.300,.2,.28,dx,.85,-35.340,'#7A4A2E');}
  [['gau',-9.800],['xanh',-8.600],['heo',-7.400],['do',-6.200],['sao',6.200],['cam',7.400],['somi',8.600],['phao',9.800]].forEach(([id,x])=>{const m=new T.Mesh(new T.PlaneGeometry(.95,1.050),new T.MeshBasicMaterial({map:byId[id].tex,alphaTest:.5}));m.position.set(x,2.500,-35.300);s.root.add(m);});
  s.plane(sign('CỬA HÀNG DUU DUU',{w:1024,h:170,bg:'#1B2458',size:100}),15,2.500,0,8.300,-35.440);
  for(const wx of[-9,-3,3,9]){s.gbox(2,2.200,.08,wx,10.300-.8,-35.450,'#FFD98A');}
  s.pts.push(LP(0,2.500,-33,1.3,10,GOLD),LP(-8,2.500,-33,.9,8,GOLD),LP(8,2.500,-33,.9,8,GOLD));s.halo(0,2.300,-35.200,'#FFD27A',9);
  s.solid(-13,-2.800,-36,-34.800);s.solid(2.800,13,-36,-34.800);
  s.doors.push({x:0,z:-34.300,r:2.300,to:'tiem',back:{x:0,z:13,yaw:0},label:'Vào cửa hàng',lx:0,ly:4.900,lz:-34.500});

  /* Phố nhà hai bên */
  const r=seeded(47),walls=['#E8B84F','#E9E2D2','#D97E6A','#7FB7A6','#E8B84F','#C7A1C9'],roofs=['#8E3B3A','#73304A','#9A4A38'];
  for(const side of[-1,1]){
    for(let z=34;z>-34;){const w=6+r()*3;house(s,side*(15+r()*.6+4),z-w/2,w,6+r()*6,8,walls[Math.floor(r()*6)],roofs[Math.floor(r()*3)],-side,r);z-=w+.05;}
    for(let z=40;z>-40;){const w=7+r()*4,h=9+r()*9;s.box(9,h,w,side*31,h/2,z-w/2,'#4A3F86');s.lit.add(new T.CylinderGeometry(6,6,w+.3,3),'#3B3172',s.at(side*31,h+2.900,z-w/2,0,PI/2,0));for(let i=0;i<4;i++){if(r()<.6)s.gbox(.05,.9,.7,side*31-side*4.540,2+r()*(h-3),z-w*r(),'#FFCE82');}z-=w;}
  }
  for(const[x,z]of[[-13,-10],[13,-1.500],[-13,8],[13,18],[-13,20],[-12,-29],[13,-30],[11,31],[-11,31]])treeSmall(s,x,z);
  s.bounds={minX:-14,maxX:14,minZ:-34.500,maxZ:36};
  s.spawn={x:0,z:34.800,yaw:0};
  const L=PI/2,N=[['Đồ ngủ',-4.400,13,L],['Đồ đi học',4.400,13,-L],['Áo khoác',-4.400,3,L],['Giá sốc 59k',4.400,3,-L],['Bộ sao đêm',-4.400,-7,L],['Đồ đôi cho bé',4.400,-7,-L],['Sân khấu',-1.600,-22.500,1.170],['Vào cửa hàng',0,-34.300,0]];
  s.nav=N.map(n=>({l:n[0],x:n[1],z:n[2],yaw:n[3]}));
  s.fog=new T.Fog('#7A4A8C',34,132);
  s.bg=new T.Color('#3A2F86');
  s.hemi=[new T.Color('#C9B8FF'),new T.Color('#E8A070'),.82];s.sun=['#FFC890',.72,[.2,.8,.5]];
  finish(s,{sky:[.62,.58,.92],ground:[.55,.4,.55],sun:[.16,.12,.2],dir:[.45,.8,.4],aoH:1.2,aoMin:.72});
  s.wander=()=>{const t=Math.random();return t<.7?{x:(Math.random()-.5)*9.500,z:-13+Math.random()*44}:{x:(Math.random()-.5)*22,z:-33+Math.random()*19};};
  return s;
}
function treeSmall(s,x,z){s.cyl(.17,.26,2.600,x,1.300,z,'#5C3F30',7);s.ball(1.400,x,3.700,z,'#22765A',.95);s.ball(1,x+.8,3.200,z+.3,'#2C8A65',.9);s.ball(1,x-.7,3.300,z-.4,'#1B6650',.9);s.round(x,z,.5);}

/* ---------- CẢNH 2: CỬA HÀNG BÊN TRONG ---------- */
function shopFloor(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=2048;const c=cv.getContext('2d'),S=1024/32,X=x=>(x+16)*S,Z=z=>(z+26)*S,r=seeded(9);
  c.fillStyle='#B98A56';c.fillRect(0,0,1024,2048);
  for(let x=0;x<1024;x+=26){let y=-r()*120;while(y<2048){const h=90+r()*140,v=r();c.fillStyle=v<.33?'#D9A66E':v<.66?'#CF9A62':'#E2B27C';c.fillRect(x,y,25,h-1);y+=h;}}
  /* lối gạch bông giữa nhà */
  const tile=(x0,z0,x1,z1)=>{const tw=48;for(let y=Z(z0),j=0;y<Z(z1);y+=tw,j++)for(let x=X(x0),i=0;x<X(x1);x+=tw,i++){c.fillStyle='#FFF6E5';c.fillRect(x,y,tw-1,tw-1);c.save();c.translate(x+tw/2,y+tw/2);c.fillStyle=(i+j)%2?'#2FA090':'#E5634F';c.rotate(PI/4);c.fillRect(-11,-11,22,22);c.fillStyle='#FFD866';c.fillRect(-4.500,-4.500,9,9);c.restore();c.fillStyle='#2FA090';for(const[a,b]of[[0,0],[tw,0],[0,tw],[tw,tw]]){c.beginPath();c.arc(x+a,y+b,8,0,7);c.fill();}}};
  tile(-3.700,-24.500,3.700,18);
  c.strokeStyle='#1F7E72';c.lineWidth=6;c.strokeRect(X(-3.700),Z(-24.500),7.400*S,42.500*S);
  /* thảm tròn cho khu trưng bày */
  const rug=(x,z,rad,a,b)=>{c.fillStyle=a;c.beginPath();c.arc(X(x),Z(z),rad*S,0,7);c.fill();c.fillStyle=b;c.beginPath();c.arc(X(x),Z(z),rad*.72*S,0,7);c.fill();c.fillStyle=a;c.beginPath();c.arc(X(x),Z(z),rad*.4*S,0,7);c.fill();};
  rug(-9,-17,4.700,'#FF8FB3','#FFD3E0');rug(9.200,-18,4.200,'#6FE0C4','#CFF5EA');
  /* nắng từ cửa sổ bên trái */
  c.globalCompositeOperation='lighter';c.save();c.shadowColor='rgba(255,226,160,.46)';c.shadowBlur=12;c.shadowOffsetX=4000;
  for(let i=0;i<6;i++){const z=14-i*7.300,o=4000;c.beginPath();c.moveTo(X(-16)-o,Z(z+1.600));c.lineTo(X(-16)-o,Z(z-1.600));c.lineTo(X(-5)-o,Z(z-3.600));c.lineTo(X(-5)-o,Z(z-.4));c.fill();}
  c.restore();c.globalCompositeOperation='multiply';c.save();c.shadowColor='rgba(130,100,80,.55)';c.shadowBlur=60;c.shadowOffsetX=4000;c.strokeStyle='#000';c.lineWidth=40;c.strokeRect(-4000,0,1024,2048);c.restore();c.globalCompositeOperation='source-over';
  const t=texOf(cv);t.anisotropy=8;return t;
}
function winTex(){
  const cv=document.createElement('canvas');cv.width=256;cv.height=512;const c=cv.getContext('2d'),g=c.createLinearGradient(0,0,0,512);g.addColorStop(0,'#7CCBFF');g.addColorStop(.7,'#D9F3FF');c.fillStyle=g;c.fillRect(0,0,256,512);
  const r=seeded(4);for(let i=0;i<24;i++){c.fillStyle=['#5CB97B','#49A56C','#74CC8D'][i%3];c.beginPath();c.arc(r()*256,330+r()*170,30+r()*44,0,7);c.fill();}
  c.fillStyle='#fff';c.beginPath();c.arc(70,90,26,0,7);c.arc(106,84,34,0,7);c.arc(144,94,24,0,7);c.fill();return texOf(cv);
}
function rail(s,x,z,ry,ids){
  s.push(mat(x,0,z,ry));const n=ids.length,len=n*1.180+.5;
  for(const px of[-len/2,len/2]){s.cyl(.04,.04,2.300,px,1.150,0,'#2E3A66',8);s.box(.9,.06,.09,px,.03,0,'#2E3A66');}
  s.lit.add(new T.CylinderGeometry(.03,.03,len,8),'#2E3A66',s.at(0,2.250,0,0,0,PI/2));
  ids.forEach((id,i)=>hangSet(s,id,-(n-1)*.590+i*1.180,1.530,0,0,1.02));
  s.pop();
  const hl=len/2+.25,hd=.5;ry===0?s.solid(x-hl,x+hl,z-hd,z+hd,false):s.solid(x-hd,x+hd,z-hl,z+hl,false);
}
function bear(s,x,z,sc=1,ry=0){
  s.push(mat(x,0,z,ry,0,0,sc,sc,sc));const b='#B8834F',l='#E8C49C';
  s.lit.add(new T.SphereGeometry(.9,16,12),b,s.at(0,.95,0,0,0,0,1,1.05,.9),true);s.lit.add(new T.SphereGeometry(.55,14,10),l,s.at(0,.92,.5,0,0,0,1,1.1,.6),true);
  s.lit.add(new T.SphereGeometry(.72,16,12),b,s.at(0,2.150,.05),true);for(const k of[-1,1]){s.lit.add(new T.SphereGeometry(.26,10,8),b,s.at(k*.55,2.730,0),true);s.lit.add(new T.SphereGeometry(.13,8,6),l,s.at(k*.55,2.730,.15),true);s.lit.add(new T.SphereGeometry(.34,12,8),b,s.at(k*.7,.28,.65,0,0,0,1,.8,1.3),true);s.lit.add(new T.SphereGeometry(.28,10,8),b,s.at(k*.92,1.220,.25,0,0,0,1,1.4,1),true);s.lit.add(new T.SphereGeometry(.06,6,5),'#2B1B17',s.at(k*.26,2.280,.68),true);}
  s.lit.add(new T.SphereGeometry(.26,10,8),l,s.at(0,2.000,.66,0,0,0,1.15,.85,.7),true);s.lit.add(new T.SphereGeometry(.08,6,5),'#2B1B17',s.at(0,2.080,.87),true);
  s.lit.add(new T.TorusGeometry(.4,.09,8,14),'#E5484D',s.at(0,1.560,.25,0,PI/2.3));
  s.pop();
}
function buildShop(){
  const s=newScene('tiem','Cửa hàng','Sảnh rộng, giá treo, gạch bông và góc bé chơi');
  const W=16,F=18,B=-26,H=8.2;
  const g=new T.Mesh(new T.PlaneGeometry(32,44),new T.MeshBasicMaterial({map:shopFloor()}));g.rotation.x=-PI/2;g.position.set(0,0,-4);s.root.add(g);s.ground=g;
  const wall='#FFE9BE',wain='#3FA99A',beam='#9A6A44',white='#FFFDF6';
  s.box(.4,H,44,W+.2,H/2,-4,wall);s.box(.1,1.500,44,W-.05,.75,-4,wain);s.box(.14,.1,44,W-.09,1.530,-4,white);
  s.box(32,H,.4,0,H/2,B-.2,wall);s.box(32,1.500,.1,0,.75,B+.05,wain);
  s.box(32,H,.4,0,H/2,F+.2,wall);s.box(32,1.500,.1,0,.75,F-.05,wain);
  s.box(32.8,.3,44.8,0,H+.15,-4,'#FFF8EA');
  for(let z=F-2;z>B;z-=5.500){s.box(32,.42,.42,0,H-.3,z,beam);}
  for(const x of[-10.500,0,10.500])s.box(.32,.3,44,x,H-.62,-4,beam);
  /* cửa sổ cao bên trái */
  const wt=winTex();s.box(.4,1.500,44,-W-.2,.75,-4,wain);s.box(.4,H-1.500,44,-W-.2,(H+1.500)/2,-4,wall);
  for(let i=0;i<6;i++){const z=14-i*7.300;
    const pl=new T.Mesh(new T.PlaneGeometry(3.400,5.100),new T.MeshBasicMaterial({map:wt}));pl.position.set(-W+.03,4.450,z);pl.rotation.y=PI/2;s.root.add(pl);
    s.box(.14,5.300,.16,-W+.1,4.450,z-1.750,white);s.box(.14,5.300,.16,-W+.1,4.450,z+1.750,white);s.box(.14,.18,3.660,-W+.1,7.050,z,white);s.box(.22,.18,3.900,-W+.14,1.850,z,white);s.box(.1,5.100,.08,-W+.08,4.450,z,white);s.box(.1,.08,3.500,-W+.08,4.800,z,white);
    s.pts.push(LP(-W+2,4,z,.75,13,[1,.95,.82]));
  }
  /* cột và đèn thả */
  for(const x of[-10.500,10.500])for(let z=12;z>=-20;z-=10.500){s.cyl(.34,.4,H,x,H/2,z,'#2FA090',14);s.cyl(.56,.6,.32,x,.16,z,'#FFF6E5',14);s.round(x,z,.55);}
  for(const x of[-5.300,5.300])for(let z=13;z>=-22;z-=7){s.cyl(.012,.012,1.900,x,H-1.450,z,'#3A2E44',3);s.lit.add(new T.ConeGeometry(.62,.5,14,1,true),'#E5634F',s.at(x,5.900,z));s.gball(.18,x,5.580,z,'#FFF6D8');s.halo(x,5.500,z,'#FFD27A',3);s.pts.push(LP(x,5.400,z,.42,10,GOLD));}
  /* tường phải: kệ gỗ */
  const r=seeded(31),cols=['#FF8FB3','#7EC4FF','#FFD866','#F2545B','#6FE0C4','#FFFFFF','#B9A8FF','#FFA45C'];
  for(let z=13;z>-22;z-=7){s.box(.7,4.700,6.300,W-.4,3.850,z,'#B97E50');
    for(let f=0;f<4;f++){const y=2.250+f*1.120;s.box(.72,.06,6.100,W-.76,y,z,'#E8C49C');for(let i=0;i<8;i++){const h=3+Math.floor(r()*4),c=cols[Math.floor(r()*8)];for(let k=0;k<h;k++)s.box(.5,.09,.6,W-.82,y+.09+k*.1,z-2.600+i*.74,c);}}
    s.solid(W-.85,W,z-3.300,z+3.300);}
  /* giá treo hai bên lối đi */
  s.grp='Khu đồ ngủ';rail(s,-8,11.500,0,['gau','xanh','heo','do']);rail(s,-8,6.200,0,['sao','cam','gau','xanh']);rail(s,-8,.8,0,['heo','do','sao','cam']);
  s.grp='Đồ đi học';rail(s,8,11.500,0,['somi','yem','somi','yem']);s.grp='Áo khoác';rail(s,8,6.200,0,['khoac','phao','khoac','phao']);s.grp='Giá tốt';rail(s,8,.8,0,['cam','heo','gau','do']);
  s.grp='Mẫu nổi bật';
  s.box(3.300,.8,.05,-8,3.500,14.360,'#FF8FB3');s.plane(sign('Khu đồ ngủ',{w:512,h:110,bg:'#FF8FB3',fg:'#1B2458',edge:'',size:60}),3.200,.7,-8,3.500,14.400,0);s.cyl(.02,.02,4.400,-8,6,14.400,'#3A2E44',3);
  s.box(4.100,.8,.05,8,3.500,14.360,'#6FE0C4');s.plane(sign('Đồ đi học · Áo khoác',{w:640,h:110,bg:'#6FE0C4',fg:'#1B2458',edge:'',size:58}),4,.7,8,3.500,14.400,0);s.cyl(.02,.02,4.400,8,6,14.400,'#3A2E44',3);
  /* trưng bày trên thảm */
  mannequin(s,'gau',-9,-14.500,.3);mannequin(s,'do',-11.200,-17.600,.7);mannequin(s,'sao',-7,-18.600,-.3);
  mannequin(s,'phao',9.200,-15.600,-.3);mannequin(s,'yem',7,-18.400,.4);mannequin(s,'khoac',11.200,-19,-.6);
  for(const[x,z]of[[-9,-14.500],[-11.200,-17.600],[-7,-18.600],[9.200,-15.600],[7,-18.400],[11.200,-19]])s.round(x,z,.62);
  /* gấu khổng lồ và góc chơi */
  bear(s,-12.200,-23,1.350,.6);s.round(-12.200,-23,1.700);
  s.lit.add(new T.ConeGeometry(2,3,4),'#FFD866',s.at(12.300,1.500,-23,PI/4));s.lit.add(new T.ConeGeometry(.6,1.800,4),'#E5634F',s.at(12.300,.9,-21.750,PI/4));s.round(12.300,-23,1.800);
  /* quầy thu ngân và tường thương hiệu */
  s.box(9,1.150,1.300,0,.575,-22.200,'#3FA99A');s.box(9.400,.1,1.600,0,1.200,-22.200,'#FFF6E5');s.solid(-4.700,4.700,-23,-21.400);
  s.plane(sign('DUU DUU',{w:1024,h:360,bg:'#FF8FB3',fg:'#1B2458',edge:'#FFD866',size:190,sub:'Mặc đẹp, chơi vui, ngủ ngoan'}),12,4.200,0,4.600,B+.06);
  for(const x of[-4.500,4.500])plant(s,x*1.900,15.500,1.300);plant(s,-14.200,-12,1.500);plant(s,14,-24.300,1.400);plant(s,-14.300,16.200,1.200);
  s.pts.push(LP(0,6,-20,1,15,GOLD),LP(0,5.500,8,.6,15,GOLD));
  /* cửa ra chợ */
  s.box(5,4.200,.14,0,2.100,F-.1,'#3A4A9E');s.glow.add(new T.BoxGeometry(4.600,3.900,.06),'#3A2F86',s.at(0,2.050,F-.2));s.box(.2,4.300,.3,-2.550,2.150,F-.2,beam);s.box(.2,4.300,.3,2.550,2.150,F-.2,beam);s.box(5.300,.24,.3,0,4.350,F-.2,beam);
  s.plane(sign('Ra chợ đêm',{w:512,h:100,bg:'#1B2458',size:58}),2.700,.53,0,4.900,F-.28);
  s.doors.push({x:0,z:F-1.200,r:1.900,to:'cho',back:{x:0,z:-29,yaw:PI},label:'Ra chợ đêm',lx:0,ly:4.700,lz:F-.5});
  s.bounds={minX:-15.300,maxX:15,minZ:-25.400,maxZ:17.400};
  s.spawn={x:0,z:13,yaw:0};
  s.nav=[['Khu đồ ngủ',-8,8.700,0],['Đồ đi học',8,14,0],['Áo khoác',8,8.700,0],['Giá tốt',8,3.300,0],['Mẫu nổi bật',-4.200,-13,.8],['Gấu khổng lồ',-7.500,-20,.9],['Quầy thu ngân',0,-20,0],['Ra chợ đêm',0,16.800,PI]].map(n=>({l:n[0],x:n[1],z:n[2],yaw:n[3]}));
  s.fog=new T.Fog('#FFEBC8',46,110);s.bg=new T.Color('#FFEBC8');
  s.hemi=[new T.Color('#FFFFFF'),new T.Color('#FFD9A8'),.95];s.sun=['#FFF0D0',.5,[-.6,.7,.3]];
  finish(s,{sky:[.86,.84,.82],ground:[.74,.66,.6],sun:[.1,.09,.07],dir:[-.7,.5,.2],aoH:.9,aoMin:.84});
  s.wander=()=>({x:-3.500+Math.random()*7,z:-20+Math.random()*34});
  return s;
}

/* ---------- Nhân vật ---------- */
const capsule=(r,h,sg=8)=>{const pts=[];for(let i=0;i<=5;i++){const a=-PI/2+i/5*PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r-h));}for(let i=0;i<=5;i++){const a=i/5*PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r));}return new T.LatheGeometry(pts,sg);};
const torsoProfile=[[.001,.34],[.25,.34],[.285,.40],[.26,.55],[.215,.72],[.145,.84],[.001,.86]].map(p=>new T.Vector2(p[0],p[1]));
const GEO={};
function headTex(hair,style){
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#FBD2AC';c.fillRect(0,0,512,256);
  c.fillStyle=hair;c.beginPath();c.moveTo(0,0);for(let x=0;x<=512;x+=8){const u=x/512,fr=style==='long'?205:190;const y=lerp(82,fr,(1-Math.cos(2*PI*(u-.25)))/2)+Math.sin(x*.09)*3;c.lineTo(x,y);}c.lineTo(512,0);c.closePath();c.fill();
  const cx=128;c.fillStyle='#3A2A22';for(const k of[-1,1]){c.beginPath();c.ellipse(cx+k*30,136,7,9,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(cx+k*30+2,132,2.400,0,7);c.fill();c.fillStyle='#3A2A22';}
  c.fillStyle='rgba(255,130,150,.55)';for(const k of[-1,1]){c.beginPath();c.ellipse(cx+k*49,155,14,8,0,0,7);c.fill();}
  c.strokeStyle='#8A4A3A';c.lineWidth=4;c.lineCap='round';c.beginPath();c.arc(cx,152,10,.25,PI-.25);c.stroke();
  return new T.CanvasTexture(cv);
}
const heads={};
function headFor(hair,style){const k=hair+style;return heads[k]||(heads[k]=headTex(hair,style));}
class Char{
  constructor(o){
    this.o=o;const g=this.g=new T.Group();this.body=new T.Group();g.add(this.body);this.speed=0;this.phase=Math.random()*6;this.yaw=0;this.wave=0;this.dance=0;
    this.mTop=new T.MeshLambertMaterial({color:o.top||'#FFFFFF'});this.mPant=new T.MeshLambertMaterial({color:o.pant||o.top||'#FFFFFF'});
    const skin=new T.MeshLambertMaterial({color:'#FBD2AC'}),hair=new T.MeshLambertMaterial({color:o.hair});
    const t=new T.Mesh(GEO.torso,this.mTop);this.body.add(t);
    const c=new T.Mesh(GEO.collar,new T.MeshLambertMaterial({color:'#FFFFFF'}));c.position.y=.82;c.rotation.x=PI/2;this.body.add(c);
    this.head=new T.Mesh(GEO.head,new T.MeshLambertMaterial({map:headFor(o.hair,o.style)}));this.head.position.y=1.11;this.head.rotation.y=PI/2;this.body.add(this.head);
    /* Xoay đầu 0 vì mặt đã vẽ ở phía trước (+z) */
    this.head.rotation.y=0;
    if(o.style==='bun')for(const k of[-1,1]){const b=new T.Mesh(GEO.bun,hair);b.position.set(k*.25,1.41,-.02);this.body.add(b);}
    if(o.style==='long'){const b=new T.Mesh(GEO.bun,hair);b.scale.set(1.2,1.2,1.2);b.position.set(0,1.46,-.16);this.body.add(b);}
    const limb=(x,y,geo,m,rz)=>{const p=new T.Group();p.position.set(x,y,0);p.rotation.z=rz;const l=new T.Mesh(geo,m);p.add(l);this.body.add(p);return p;};
    this.aL=limb(-.25,.74,GEO.arm,this.mTop,-.32);this.aR=limb(.25,.74,GEO.arm,this.mTop,.32);
    for(const a of[this.aL,this.aR]){const h=new T.Mesh(GEO.hand,skin);h.position.y=-.33;a.add(h);}
    this.lL=limb(-.12,.36,GEO.leg,this.mPant,0);this.lR=limb(.12,.36,GEO.leg,this.mPant,0);
    for(const l of[this.lL,this.lR]){const f=new T.Mesh(GEO.foot,new T.MeshLambertMaterial({color:o.shoe||'#F2F2F7'}));f.position.set(0,-.3,.05);l.add(f);}
    const sh=new T.Mesh(GEO.blob,new T.MeshBasicMaterial({map:BLOB,transparent:true,depthWrite:false,fog:false}));sh.rotation.x=-PI/2;sh.position.y=.02;g.add(sh);
    g.scale.setScalar(o.scale||1);
    if(o.ring){const rg=new T.Mesh(new T.RingGeometry(.42,.5,28),new T.MeshBasicMaterial({color:'#FFC93C',transparent:true,opacity:.9,depthWrite:false}));rg.rotation.x=-PI/2;rg.position.y=.03;g.add(rg);}
    this.tag=document.createElement('div');this.tag.className='tag'+(o.me?' me':'');this.tag.innerHTML='<span class="bb" hidden></span><span class="nm"></span>';this.tag.querySelector('.nm').textContent=o.name;$('#tags').appendChild(this.tag);this.bb=this.tag.querySelector('.bb');
    if(o.outfit)this.wear(byId[o.outfit]);
  }
  wear(p){this.mTop.map=p.cloth;this.mTop.color.set('#FFFFFF');this.mTop.needsUpdate=true;this.mPant.map=p.clothB;this.mPant.color.set('#FFFFFF');this.mPant.needsUpdate=true;this.outfit=p;}
  say(t,ms=3200){this.bb.textContent=t;this.bb.hidden=false;clearTimeout(this._t);this._t=setTimeout(()=>{this.bb.hidden=true;},ms);}
  update(dt){
    const s=this.speed,mv=clamp(s/3,0,1);this.phase+=dt*(6+s*3);
    const sw=Math.sin(this.phase)*.85*mv;
    this.lL.rotation.x=sw;this.lR.rotation.x=-sw;
    let aL=-sw*.8,aR=sw*.8,zR=.32,zL=-.32;
    if(this.wave>0){this.wave-=dt;aR=0;zR=2.700+Math.sin(this.wave*11)*.3;}
    let by=Math.abs(Math.cos(this.phase))*.045*mv,ry=0;
    if(this.dance>0){this.dance-=dt;const d=this.dance*7;by=Math.abs(Math.sin(d))*.2;ry=this.dance*5;aL=0;aR=0;zL=-2.500+Math.sin(d)*.4;zR=2.500-Math.sin(d)*.4;}
    else if(mv<.05){by=Math.sin(this.phase*.35)*.008;}
    this.aL.rotation.x=aL;this.aR.rotation.x=aR;this.aL.rotation.z=zL;this.aR.rotation.z=zR;
    this.body.position.y=by;this.body.rotation.y=ry;this.g.rotation.y=this.yaw;
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
try{renderer=new T.WebGLRenderer({canvas:cv,antialias:!LOW,powerPreference:'high-performance'});}
catch(e){$('#load').textContent='Máy này chưa mở được 3D. Anh thử trên trình duyệt Chrome hoặc Safari giúp em.';return;}
let PR=Math.min(devicePixelRatio||1,LOW?1.25:1.75);renderer.setPixelRatio(PR);
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(58,1,.1,400);
const hemi=new T.HemisphereLight('#fff','#888',1);const dirL=new T.DirectionalLight('#fff',.6);scene.add(hemi,dirL);
const view={lookY:1.2,port:false};let STATE=null;
function applyView(){view.port=app.clientHeight>app.clientWidth;view.lookY=view.port?1.900:1.200;if(STATE&&!STATE.zoomed){STATE.dist=view.port?5.200:6.800;STATE.pitch=view.port?.2:.34;}}
function resize(){const w=app.clientWidth,h=app.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?78:56;camera.updateProjectionMatrix();applyView();}
addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(app);resize();
GLOW=new T.CanvasTexture(radial(128,[[0,'rgba(255,255,255,.95)'],[.2,'rgba(255,255,255,.5)'],[.55,'rgba(255,255,255,.1)'],[1,'rgba(255,255,255,0)']]));
BLOB=new T.CanvasTexture(radial(96,[[0,'rgba(10,8,40,.55)'],[.6,'rgba(10,8,40,.32)'],[1,'rgba(10,8,40,0)']]));
GEO.torso=new T.LatheGeometry(torsoProfile,14);GEO.collar=new T.TorusGeometry(.14,.04,8,16);GEO.head=new T.SphereGeometry(.36,20,14);GEO.bun=new T.SphereGeometry(.13,10,8);
GEO.arm=capsule(.075,.29);GEO.leg=capsule(.095,.26);GEO.hand=new T.SphereGeometry(.078,8,6);GEO.foot=new T.SphereGeometry(.1,8,6);GEO.foot.scale(1,.62,1.5);GEO.blob=new T.PlaneGeometry(1.300,1.300);
/* thân ma-nơ-canh gộp */
const manBody=(()=>new T.LatheGeometry(torsoProfile,14))();
const manLegs=(()=>{const a=capsule(.1,.3),m=new T.Matrix4();const pa=[],uv=[],no=[];for(const x of[-.12,.12]){const g=a.index?a.toNonIndexed():a.clone();g.applyMatrix4(m.makeTranslation(x,.36,0));pa.push(...g.attributes.position.array);uv.push(...g.attributes.uv.array);no.push(...g.attributes.normal.array);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pa,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(no,3));return g;})();


const scenes={};
let cur,player;
const NAMES=[['Mẹ Tít','#7EC4FF','#4A2C20','short','xanh'],['Mẹ Bin','#FFD866','#2B1B17','bun','heo'],['Mẹ Na','#FF8FB3','#2B1B17','long','gau'],['Mẹ Cún','#6FE0C4','#6A4028','short','phao'],['Mẹ Mít','#B9A8FF','#2B1B17','bun','sao'],['Mẹ Gạo','#FFA45C','#4A2C20','short','cam'],['Mẹ Bơ','#7EC4FF','#2B1B17','long','do'],['Mẹ Nấm','#E5484D','#6A4028','bun','yem'],['Mẹ Tôm','#FFFFFF','#2B1B17','short','somi']];
const CHAT=['Mẫu này đẹp quá','Còn size 16kg không ạ?','Vải mềm ghê','Bé nhà em mặc vừa in','Chốt một bộ nha','Giá sốc thật đấy','Lấy màu hồng cho bé','Sạp này đông quá'];
const OWNER=['Set gấu hồng còn 2 bộ size 16kg, các mẹ nhanh tay nha!','Đồ ngủ cotton mới về tối nay, các mẹ ghé xem ạ','Mẹ nào cần tư vấn size cứ hỏi em nha','Cảm ơn các mẹ đã ghé chợ Duu Duu'];
function populate(s,n,seedShift){
  for(let i=0;i<n;i++){const d=NAMES[(i+seedShift)%NAMES.length],c=new Char({name:d[0],top:d[1],hair:d[2],style:d[3],outfit:d[4],scale:1.08});s.root.add(c.g);
    const p=s.wander();resolve(s,p);c.pos=p;c.g.position.set(p.x,0,p.z);c.wait=Math.random()*4;c.tgt=null;s.npcs.push(c);c.tag.style.display='none';}
}
function owner(s,x,y,z,yaw){const c=new Char({name:'Chủ chợ',top:'#E5484D',pant:'#2D3E86',hair:'#2B1B17',style:'long',scale:1.2});c.pos={x,z};c.g.position.set(x,y,z);c.yaw=yaw;c.fixed=true;s.root.add(c.g);s.npcs.push(c);s.owner=c;c.tag.style.display='none';s.col.push({x,z,r:.3});return c;}

function build(){
  scenes.cho=buildMarket();scenes.tiem=buildShop();
  populate(scenes.cho,LOW?5:9,0);populate(scenes.tiem,LOW?3:6,3);
  owner(scenes.cho,-7.500,.57,-25.200,.25);owner(scenes.tiem,0,0,-23.200,0);
  player=new Char({name:$('#who').value||'Bé Bống',top:'#FFD866',pant:'#3E8BFF',hair:'#2B1B17',style:'short',me:true,ring:true,scale:1,shoe:'#FF8FB3'});
  player.tag.style.display='none';
  go('cho',false);
}
const state={mode:'intro',pos:{x:0,z:0},vel:{x:0,z:0},yaw:0,pitch:.36,dist:6.800,tgt:null,joy:{x:0,y:0,on:false},keys:{},drag:null,lock:0,moved:0,trip:0};
STATE=state;applyView();
const cam={p:new V3(),look:new V3(),t:0,from:new V3(),fromLook:new V3()};
const marker=new T.Mesh(new T.RingGeometry(.24,.34,24),new T.MeshBasicMaterial({color:'#FFC93C',transparent:true,depthWrite:false,fog:false}));marker.rotation.x=-PI/2;marker.position.y=.04;marker.visible=false;scene.add(marker);

function go(id,fromDoor=true,door){
  const s=scenes[id];
  if(cur){cur.root.visible=false;cur.npcs.forEach(n=>n.tag.style.display='none');}
  cur=s;s.root.visible=true;s.root.add(player.g);
  const sp=door||s.spawn;state.pos.x=sp.x;state.pos.z=sp.z;state.yaw=sp.yaw;state.vel.x=state.vel.z=0;state.tgt=null;marker.visible=false;player.yaw=sp.yaw+PI;
  scene.fog=s.fog;scene.background=s.bg;hemi.color.copy(s.hemi[0]);hemi.groundColor.copy(s.hemi[1]);hemi.intensity=s.hemi[2];dirL.color.set(s.sun[0]);dirL.intensity=s.sun[1];dirL.position.set(...s.sun[2]);
  $('#roomName').textContent=s.title;
  if(state.mode==='play'){s.npcs.forEach(n=>n.tag.style.display='');snapCam();}
  doorTag.textContent=s.doors[0].label;
  $('#rooms').querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.r===id));
  state.goal=null;state.wantYaw=null;stripGrp=null;$('#strip').hidden=true;renderNav();
}
function snapCam(){const t=camTarget();cam.p.copy(t.p);cam.look.copy(t.l);}
const rc=new T.Raycaster(),tmp=new V3();
function camTarget(){
  const {yaw,pitch}=state;let dist=state.dist;const px=state.pos.x,pz=state.pos.z,sx=Math.sin(yaw)*Math.cos(pitch),sz=Math.cos(yaw)*Math.cos(pitch),sy=Math.sin(pitch);
  for(let t=.9;t<=dist;t+=.3){const x=px+sx*t,z=pz+sz*t,y=1.300+sy*t;let hit=false;
    for(const c of cur.col){if(c.r!==undefined){if(y<4.200&&Math.hypot(x-c.x,z-c.z)<c.r+.5){hit=true;break;}}else if(c.tall&&y<5.500&&x>c.minX-.5&&x<c.maxX+.5&&z>c.minZ-.5&&z<c.maxZ+.5){hit=true;break;}}
    if(!hit&&cur.id==='tiem'&&(z>17.700||x<-15.700||x>15.700||z<-25.700))hit=true;
    if(!hit&&cur.id==='cho'&&(z<-34.600||Math.abs(x)>14.600))hit=true;
    if(hit){dist=t-.3;break;}}
  const full=state.dist;dist=Math.max(dist,2.500);
  const b=cur.id==='tiem'?7.600:99,lift=(full-dist)*.26;
  return{p:new V3(px+sx*dist,Math.min(b,1.300+sy*dist+lift),pz+sz*dist),l:new V3(px,view.lookY,pz)};
}

/* ---------- Giao diện ---------- */
const doorTag=document.createElement('div');doorTag.className='door';$('#tags').appendChild(doorTag);doorTag.style.display='none';
const SC=new V3();
function project(v,offY=0){SC.set(v.x,v.y+offY,v.z).project(camera);return{x:(SC.x*.5+.5)*app.clientWidth,y:(-SC.y*.5+.5)*app.clientHeight,ok:SC.z<1};}
$('#rooms').innerHTML='';
[['cho','Chợ đêm','Phố chợ, sân khấu, gốc đa và quán trà đá'],['tiem','Cửa hàng','Sảnh rộng, giá treo, gạch bông và góc bé chơi']].forEach(([id,t,s])=>{const b=document.createElement('button');b.dataset.r=id;b.innerHTML=`<span></span><small></small>`;b.children[0].textContent=t;b.children[1].textContent=s;b.addEventListener('click',()=>{close();if(cur.id!==id)portal(id);});$('#rooms').appendChild(b);});
const close=()=>{$('#sheetWrap').hidden=true;$('#roomWrap').hidden=true;state.lock=0;};
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
['#sheetWrap','#roomWrap'].forEach(id=>$(id).addEventListener('pointerdown',e=>{if(e.target===$(id))close();}));
$('#room').addEventListener('click',()=>{$('#roomWrap').hidden=false;state.lock=1;});
let openP=null,pickSize=2;
function openSheet(p){
  openP=p;state.lock=1;state.tgt=null;marker.visible=false;$('#sName').textContent=p.name;$('#sPrice').textContent=p.price+'k';$('#sLook').textContent=p.look+' mẹ đang xem mẫu này';
  pickSize=p.stock.findIndex((v,i)=>v>0&&i>=2);if(pickSize<0)pickSize=p.stock.findIndex(v=>v>0);
  renderSizes();$('#sheetWrap').hidden=false;
  const h=$('#sThumb');h.width=h.clientWidth*2;h.height=h.clientHeight*2;drawThumb(h,p);
}
function renderSizes(){
  const w=$('#sizes');w.innerHTML='';SIZES.forEach((sz,i)=>{const b=document.createElement('button'),n=openP.stock[i];b.disabled=!n;b.setAttribute('aria-pressed',i===pickSize);b.innerHTML='<span></span><small></small>';b.children[0].textContent=sz;b.children[1].textContent=n?('Còn '+n):'Hết hàng';b.addEventListener('click',()=>{pickSize=i;renderSizes();});w.appendChild(b);});
  $('#buy').textContent='Chốt '+SIZES[pickSize];
}
$('#tryOn').addEventListener('click',()=>{const p=openP;close();player.wear(p);player.dance=1.6;ticker(`${player.o.name} đang mặc thử ${p.name}`);});
let cartN=0;
$('#buy').addEventListener('click',()=>{const p=openP,sz=SIZES[pickSize],i=pickSize;if(p.stock[i]>0)p.stock[i]--;close();player.wear(p);player.dance=2.2;cartN++;$('#cartN').textContent=cartN;burst();
  ticker(`Đã chốt ${p.name}, size ${sz}`);if(cur.owner)cur.owner.say('Cảm ơn mẹ nha, shop nhắn xác nhận ngay ạ!',4000);});
function burst(){for(let i=0;i<9;i++)setTimeout(()=>heart(player),i*70);}
const HEART='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.600 4.600 0 0 1 8-3 4.600 4.600 0 0 1 8 3c0 6-8 11-8 11z"/></svg>';
function heart(c){const v=project({x:c.g.position.x,y:1.900,z:c.g.position.z}),d=document.createElement('div');d.className='hrt';d.innerHTML=HEART;d.style.left=v.x-13+(Math.random()-.5)*50+'px';d.style.top=v.y+'px';d.style.setProperty('--dx',(Math.random()-.5)*80+'px');$('#tags').appendChild(d);setTimeout(()=>d.remove(),1600);}
let tickT;function ticker(t){const e=$('#ticker');e.textContent=t;e.classList.add('on');clearTimeout(tickT);tickT=setTimeout(()=>e.classList.remove('on'),3800);}
document.querySelectorAll('#acts button').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.a;
  if(a==='wave')player.wave=1.400;
  if(a==='heart')for(let i=0;i<5;i++)setTimeout(()=>heart(player),i*90);
  if(a==='dance')player.dance=2.400;
  if(a==='ask'){player.say('Còn size 16kg không ạ?');if(cur.owner)setTimeout(()=>cur.owner.say('Còn ạ, mẹ chạm vào mẫu để xem size nha',3600),1100);}
}));
$('#cart').addEventListener('click',()=>ticker(cartN?`Giỏ của mẹ có ${cartN} bộ`:'Giỏ đang trống. Chạm vào quần áo để xem nha'));
function portal(id,door){
  if(state.mode==='fade')return;const prev=state.mode;state.mode='fade';const f=$('#fade');f.textContent=id==='tiem'?'Vào cửa hàng…':'Ra chợ đêm…';f.style.opacity=1;
  setTimeout(()=>{state.mode=prev==='fade'?'play':prev;go(id,true,door);setTimeout(()=>{f.style.opacity=0;},140);},REDUCED?0:420);
}
let stripGrp=null;
function thumbOf(p){if(!p.thumb){const c=document.createElement('canvas');c.width=224;c.height=156;drawThumb(c,p);p.thumb=c.toDataURL('image/png');}return p.thumb;}
function showStrip(grp){
  if(grp===stripGrp)return;stripGrp=grp;const w=$('#strip');if(!grp){w.hidden=true;return;}
  $('#stripT').textContent=grp;const box=$('#cards');box.innerHTML='';box.scrollLeft=0;
  [...new Set(cur.items.filter(i=>i.grp===grp).map(i=>i.p))].forEach(p=>{const b=document.createElement('button');b.className='card';b.setAttribute('aria-label',p.name+', '+p.price+'k');
    const im=document.createElement('img');im.src=thumbOf(p);im.alt='';const t=document.createElement('span');t.textContent=p.name;const sm=document.createElement('small');sm.textContent=p.price+'k';t.append(sm);b.append(im,t);b.addEventListener('click',()=>openSheet(p));box.appendChild(b);});
  w.hidden=false;
}
function renderNav(){
  const box=$('#nav');box.innerHTML='';box.scrollLeft=0;(cur.nav||[]).forEach(n=>{const b=document.createElement('button');b.textContent=n.l;b.addEventListener('click',()=>{if(state.lock||state.mode!=='play')return;box.querySelectorAll('button').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','true');
    state.tgt={x:n.x,z:n.z};state.goal=n;state.wantYaw=null;state.stuck=0;marker.position.set(n.x,.04,n.z);marker.visible=true;hideHint();});box.appendChild(b);});
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
  if(ptr.size===1&&p.moved>8&&state.mode==='play'&&!state.lock){if(e.pointerType==='mouse'){state.yaw-=dx*.0062;state.pitch=clamp(state.pitch+dy*.004,.04,1.150);state.drag=performance.now();hideHint();}else stick(p,e);}
  if(ptr.size===2){stickEnd();const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch){state.dist=clamp(state.dist*pinch/d,3,11);state.zoomed=true;}pinch=d;}
});
const pEnd=e=>{const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);stickEnd();if(p&&p.moved<9&&performance.now()-p.t<400&&state.mode==='play'&&!state.lock)tap(e.clientX,e.clientY);};
cv.addEventListener('pointerup',pEnd);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);stickEnd();});
cv.addEventListener('wheel',e=>{e.preventDefault();state.zoomed=true;state.dist=clamp(state.dist*(1+e.deltaY*.001),3,11);},{passive:false});
function tap(x,y){
  const r=app.getBoundingClientRect(),m=new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);rc.setFromCamera(m,camera);
  const list=cur.items.filter(i=>i.pos.distanceTo(player.g.position)<16).map(i=>i.mesh),hit=rc.intersectObjects(list,false)[0];
  if(hit&&hit.object.userData.item){openSheet(hit.object.userData.item);return;}
  const g=rc.intersectObject(cur.ground,false)[0];
  if(g){const t={x:g.point.x,z:g.point.z};resolve(cur,t,.34);state.tgt=t;state.goal=null;state.wantYaw=null;marker.position.set(t.x,.04,t.z);marker.visible=true;state.stuck=0;hideHint();}
}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;state.keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape')close();});
addEventListener('keyup',e=>{state.keys[e.code]=false;});

$('#enter').addEventListener('submit',e=>{e.preventDefault();const n=($('#who').value||'').trim()||'Bé Bống';player.o.name=n;player.tag.querySelector('.nm').textContent=n;
  $('#intro').style.opacity=0;setTimeout(()=>$('#intro').remove(),600);
  cam.from.copy(camera.position);cam.fromLook.copy(cam.look);cam.t=REDUCED?1:0;state.mode='fly';$('#hud').hidden=false;
  $('#hint').textContent=matchMedia('(hover:hover) and (pointer:fine)').matches?'Bấm xuống nền để đi, kéo chuột để nhìn quanh. Bấm tên sạp ở dưới để tự đi tới.':'Kéo một ngón để đi. Chạm tên sạp ở dưới để tự đi tới.';setTimeout(hideHint,8000);
  player.tag.style.display='';cur.npcs.forEach(n=>n.tag.style.display='');
  setTimeout(()=>ticker('Mẹ Tít vừa chốt Set gấu hồng, size 16kg'),5000);
});

/* ---------- Vòng lặp ---------- */
const clock=new T.Clock();let bubbleT=4,ownerT=2,ownerI=0,tickerT=20,slow=0,time=0;
const TICK=['Mẹ Bin vừa chốt Set heo vàng','Sạp Giá sốc 59k đang đông nhất chợ','Mẹ Na đang ở quán trà đá','Chủ chợ sắp giới thiệu đồ mới ở sân khấu'];
function stepPlayer(dt){
  let ix=state.joy.x,iy=state.joy.y;const k=state.keys;
  if(k.KeyW||k.ArrowUp)iy=-1;if(k.KeyS||k.ArrowDown)iy=1;if(k.KeyA||k.ArrowLeft)ix=-1;if(k.KeyD||k.ArrowRight)ix=1;
  const sin=Math.sin(state.yaw),cos=Math.cos(state.yaw);let dx=0,dz=0;
  if(ix||iy){state.tgt=null;state.goal=null;state.wantYaw=null;marker.visible=false;dx=ix*cos+iy*sin;dz=-ix*sin+iy*cos;const l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}
    if(Math.abs(ix)>.2&&performance.now()-(state.drag||0)>500)state.yaw-=ix*dt*1.700;}
  else if(state.tgt){const tx=state.tgt.x-state.pos.x,tz=state.tgt.z-state.pos.z,d=Math.hypot(tx,tz);if(d<.25){if(state.goal)state.wantYaw=state.goal.yaw;state.goal=null;state.tgt=null;marker.visible=false;}else{dx=tx/d;dz=tz/d;}}
  const sp=state.goal?5.600:3.700,a=1-Math.exp(-dt*11);state.vel.x=lerp(state.vel.x,dx*sp,a);state.vel.z=lerp(state.vel.z,dz*sp,a);
  const ox=state.pos.x,oz=state.pos.z;state.pos.x+=state.vel.x*dt;state.pos.z+=state.vel.z*dt;resolve(cur,state.pos);
  const moved=Math.hypot(state.pos.x-ox,state.pos.z-oz);player.speed=moved/Math.max(dt,.001);
  if(state.tgt){state.stuck=moved/dt<.5?(state.stuck||0)+dt:0;if(state.stuck>(state.goal?1.2:.5)){if(state.goal)state.wantYaw=state.goal.yaw;state.goal=null;state.tgt=null;marker.visible=false;}
    if(performance.now()-(state.drag||0)>900&&moved>.002)state.yaw=angLerp(state.yaw,Math.atan2(-state.vel.x,-state.vel.z),dt*(state.goal?2.200:.9));}
  if(state.wantYaw!==null&&state.wantYaw!==undefined){state.yaw=angLerp(state.yaw,state.wantYaw,1-Math.exp(-dt*3.500));let e=(state.yaw-state.wantYaw)%(2*PI);if(Math.min(Math.abs(e),2*PI-Math.abs(e))<.02)state.wantYaw=null;}
  if(moved>.001)player.yaw=angLerp(player.yaw,Math.atan2(state.vel.x,state.vel.z),1-Math.exp(-dt*12));
  player.g.position.set(state.pos.x,0,state.pos.z);player.update(dt);
  for(const d of cur.doors)if(Math.hypot(state.pos.x-d.x,state.pos.z-d.z)<d.r&&!state.lock){portal(d.to,d.back);return;}
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
function stepHud(){
  placeTag(player,1.920);cur.npcs.forEach(n=>placeTag(n,n.fixed?2.350:1.850));
  const pp=player.g.position;let best=null,bd=view.port?6:6.500;
  for(const it of cur.items){if(it.dup||!it.grp)continue;const d=Math.hypot(it.pos.x-pp.x,it.pos.z-pp.z);if(d<bd){bd=d;best=it;}}
  showStrip(state.lock?stripGrp:(best?best.grp:null));
  const d=cur.doors[0],dd=Math.hypot(d.x-pp.x,d.z-pp.z);if(dd<26){const v=project({x:d.lx,y:d.ly,z:d.lz});if(v.ok){doorTag.style.display='';doorTag.style.transform=`translate(${v.x}px,${v.y}px) translate(-50%,-100%)`;}else doorTag.style.display='none';}else doorTag.style.display='none';
}
function frame(){
  requestAnimationFrame(frame);if(document.hidden)return;
  const dt=Math.min(clock.getDelta(),.05);time+=dt;
  if(state.mode==='intro'){
    const a=time*.05+.3;camera.position.set(Math.sin(a)*2.5,10.500+Math.sin(time*.12)*.5,33);cam.look.set(0,3,-8);camera.lookAt(cam.look);
    cur.npcs.forEach(n=>stepNpc(n,dt));
  }else{
    if(state.mode==='play'&&!state.lock)stepPlayer(dt);else{player.speed=0;player.update(dt);}
    cur.npcs.forEach(n=>stepNpc(n,dt));
    if(state.mode==='fly'){cam.t=Math.min(1,cam.t+dt/2.400);const e=cam.t<.5?4*cam.t**3:1-Math.pow(-2*cam.t+2,3)/2,t=camTarget();camera.position.lerpVectors(cam.from,t.p,e);cam.look.lerpVectors(cam.fromLook,t.l,e);camera.lookAt(cam.look);if(cam.t>=1){state.mode='play';snapCam();}}
    else{const t=camTarget(),a=1-Math.exp(-dt*9);cam.p.lerp(t.p,a);cam.look.lerp(t.l,1-Math.exp(-dt*13));camera.position.copy(cam.p);camera.lookAt(cam.look);}
    stepHud();
    bubbleT-=dt;if(bubbleT<=0){bubbleT=3+Math.random()*4;const l=cur.npcs.filter(n=>!n.fixed&&n.g.position.distanceTo(player.g.position)<14);if(l.length){const c=l[Math.floor(Math.random()*l.length)];c.say(CHAT[Math.floor(Math.random()*CHAT.length)]);if(Math.random()<.3)c.wave=1.200;}}
    ownerT-=dt;if(ownerT<=0&&cur.owner){ownerT=9;cur.owner.say(OWNER[ownerI++%OWNER.length],6000);cur.owner.wave=1.200;}
    tickerT-=dt;if(tickerT<=0&&state.mode==='play'){tickerT=16+Math.random()*12;ticker(TICK[Math.floor(Math.random()*TICK.length)]);}
    if(marker.visible)marker.scale.setScalar(1+Math.sin(time*7)*.14);
  }
  renderer.render(scene,camera);
  /* tự giảm độ nét nếu máy chậm */
  slow=dt>.03?slow+1:Math.max(0,slow-.5);if(slow>70&&PR>1){PR=Math.max(1,PR-.4);renderer.setPixelRatio(PR);resize();slow=0;}
}
function boot(){
  try{build();}catch(err){$('#load').textContent='Dựng cảnh bị lỗi: '+err.message;console.error(err);return;}
  camera.position.set(0,12,40);frame();$('#load').style.opacity=0;setTimeout(()=>$('#load').remove(),420);
}
const fonts=document.fonts?Promise.race([Promise.all([document.fonts.load('800 60px "Baloo 2"','Chợ đêm'),document.fonts.load('600 20px "Be Vietnam Pro"','Chợ đêm')]),new Promise(r=>setTimeout(r,1800))]):Promise.resolve();
fonts.then(boot,boot);
})();
