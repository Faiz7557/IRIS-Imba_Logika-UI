'use strict';
/* Hero 3D Beranda: 514 kabupaten/kota diekstrusi dari EDU_GEO (three.js r159, UMD). Tinggi = h(i), warna = kelas --pk0..3. */
(function(){
const TILT0=50*Math.PI/180,TMIN=35*Math.PI/180,TMAX=65*Math.PI/180,SPIN=.04;
let live=null,ok=null;
/* Satu ring per subpath M, pasangan angka diambil seperti viz/peta.js geom(). */
function rings(d){return String(d||'').split('M').slice(1).map(r=>[...r.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]));}
function heights(v){const s=v.map(x=>Number.isFinite(x)&&x>0?Math.sqrt(x):0),m=Math.max(0,...s);return s.map(x=>m?x/m:0);}
function supported(){
 if(ok!==null)return ok;if(!window.THREE)return ok=false;
 try{const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');ok=!!g;const l=g&&g.getExtension('WEBGL_lose_context');if(l)l.loseContext();}catch(e){ok=false;}
 return ok;
}
const theme=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
/* Gabung BufferGeometry non-indexed (ExtrudeGeometry) jadi satu: cukup position + normal. */
function merge(list){
 const T=window.THREE;let n=0;list.forEach(g=>{n+=g.attributes.position.array.length;});
 const p=new Float32Array(n),q=new Float32Array(n);let o=0;
 list.forEach(g=>{p.set(g.attributes.position.array,o);q.set(g.attributes.normal.array,o);o+=g.attributes.position.array.length;});
 const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(p,3));m.setAttribute('normal',new T.BufferAttribute(q,3));return m;
}
/* o: {h(i)->0..1, cls(i)->0..3, label, tip(i)->teks, select(i)} */
function mount(root,o){
 if(live)live.dispose();
 const T=window.THREE,D=window.EDUSHIELD_DATA,paths=window.EDU_GEO.paths;
 const wrap=document.createElement('div');wrap.className='peta3d peta-panel';
 const mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true}),canvas=renderer.domElement;
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 canvas.style.touchAction='pan-y';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',o.label);
 const tip=document.createElement('div');tip.className='peta-tip';tip.setAttribute('role','tooltip');tip.hidden=true;
 wrap.append(canvas,tip);root.appendChild(wrap);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,2,1,6000);
 scene.add(new T.AmbientLight(0xffffff,1.6));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(300,900,500);scene.add(sun);
 // ponytail: tiap ring jadi Shape sendiri (lubang ikut terisi); pakai Path.holes bila ada wilayah berlubang yang terlihat salah.
 const geoms=D.kab.map((d,i)=>{
  const shapes=rings(paths[d.id]).filter(r=>r.length>=3).map(r=>new T.Shape(r.map(([x,y])=>new T.Vector2(x-500,-(y-190)))));
  const g=new T.ExtrudeGeometry(shapes,{depth:2+38*(+o.h(i)||0),bevelEnabled:false});g.rotateX(-Math.PI/2);return g;});
 const mats=[0,1,2,3].map(()=>new T.MeshLambertMaterial()),hlMat=new T.MeshLambertMaterial({polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const byCls=[[],[],[],[]];geoms.forEach((g,i)=>byCls[Math.max(0,Math.min(3,o.cls(i)|0))].push(g));
 const merged=byCls.map(l=>merge(l));merged.forEach((g,k)=>scene.add(new T.Mesh(g,mats[k])));
 const picks=geoms.map((g,i)=>{const m=new T.Mesh(g);m.userData.i=i;return m;}); // tidak masuk scene: hanya untuk raycast
 const hl=new T.Mesh(geoms[0],hlMat);hl.visible=false;scene.add(hl);
 let az=0,tilt=TILT0,inView=true,over=false,down=null,dragged=false,dirty=true,seen=false,raf=0,last=0,hover=-1;
 function recolor(){const cs=getComputedStyle(wrap);mats.forEach((m,k)=>m.color.set(cs.getPropertyValue('--pk'+k).trim()||'#888'));hlMat.color.set(cs.getPropertyValue('--psel').trim()||'#c2410c');wrap.dataset.builtTheme=theme();dirty=true;}
 function spin(){wrap.dataset.spin=mq.matches?'off':'on';}
 function resize(){const w=wrap.clientWidth||1,h=wrap.clientHeight||Math.round(w*5/12);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;}
 function place(){
  // jarak kamera mengikuti jejak peta 1000×380 pada azimut ini (elips halus, tanpa sentakan saat berputar)
  const c=Math.cos(az)**2,s=1-c,wx=Math.sqrt(500*500*c+190*190*s),wz=Math.sqrt(500*500*s+190*190*c);
  const vf=Math.tan(camera.fov*Math.PI/360),r=Math.max(wx/(vf*camera.aspect),(wz*Math.sin(tilt)+40)/vf)*1.05;
  camera.position.set(r*Math.cos(tilt)*Math.sin(az),r*Math.sin(tilt),r*Math.cos(tilt)*Math.cos(az));camera.lookAt(0,0,0);
 }
 const ray=new T.Raycaster(),ndc=new T.Vector2();
 function pick(e){const b=canvas.getBoundingClientRect();ndc.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(picks,false)[0];return h?h.object.userData.i:-1;}
 function setHover(i,e){
  if(i!==hover){hover=i;hl.visible=i>=0;if(i>=0)hl.geometry=geoms[i];canvas.style.cursor=i>=0?'pointer':'';dirty=true;}
  if(i<0){tip.hidden=true;return;}
  tip.textContent=o.tip(i);tip.hidden=false;const b=wrap.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
  tip.style.left=Math.max(0,Math.min(x+12,b.width-tip.offsetWidth))+'px';tip.style.top=(y>tip.offsetHeight+20?y-tip.offsetHeight-12:y+16)+'px';
 }
 const on={
  pointerdown(e){down={x:e.clientX,y:e.clientY,az,tilt};dragged=false;try{canvas.setPointerCapture(e.pointerId);}catch(_){}},
  pointermove(e){
   if(down){const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>4)dragged=true;
    if(dragged){az=down.az-dx*.008;az=Math.atan2(Math.sin(az),Math.cos(az));tilt=Math.max(TMIN,Math.min(TMAX,down.tilt+dy*.004));dirty=true;setHover(-1,e);return;}}
   setHover(pick(e),e);},
  pointerenter(){over=true;},pointerup(){down=null;},pointercancel(){down=null;},pointerleave(){over=false;if(!down)setHover(-1);},
  click(e){if(dragged){dragged=false;return;}const i=pick(e);if(i>=0)o.select(i);}
 };
 Object.keys(on).forEach(k=>canvas.addEventListener(k,on[k]));
 const ro=new ResizeObserver(resize);ro.observe(root);
 const mo=new MutationObserver(recolor);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 if(mq.addEventListener)mq.addEventListener('change',spin);
 const io=new IntersectionObserver(e=>{inView=e[e.length-1].isIntersecting;if(inView){last=0;dirty=true;}});io.observe(wrap);
 function frame(t){
  raf=requestAnimationFrame(frame);
  if(canvas.isConnected)seen=true;else{if(seen)inst.dispose();return;}
  const dt=last?Math.min(.1,(t-last)/1000):0;last=t;
  if(!mq.matches&&!document.hidden&&inView&&!over&&!down){az+=SPIN*dt;if(az>Math.PI)az-=2*Math.PI;dirty=true;}
  if(!dirty||!inView)return;dirty=false;place();renderer.render(scene,camera);
 }
 const inst={dispose(){
  if(!raf&&!wrap.isConnected&&live!==inst)return;
  cancelAnimationFrame(raf);raf=0;ro.disconnect();mo.disconnect();io.disconnect();if(mq.removeEventListener)mq.removeEventListener('change',spin);
  Object.keys(on).forEach(k=>canvas.removeEventListener(k,on[k]));
  geoms.forEach(g=>g.dispose());merged.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());hlMat.dispose();
  renderer.dispose();renderer.forceContextLoss();wrap.remove();if(live===inst)live=null;
 }};
 recolor();spin();resize();raf=requestAnimationFrame(frame);live=inst;
 return inst;
}
window.EduViz=window.EduViz||{};window.EduViz.peta3d={rings,heights,supported,mount};
})();
