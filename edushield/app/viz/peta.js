'use strict';
/* U2: choropleth 514 kabupaten/kota dari EDU_GEO (SVG murni). Satu <path data-i> per wilayah; gugus mengubah viewBox. */
(function(){
const AREA_MIN=4; // wilayah < 4 px² (viewBox penuh) diberi penanda lingkaran yang bisa diklik
let info=null;
function geom(){
 if(info)return info;const D=window.EDUSHIELD_DATA,paths=window.EDU_GEO.paths;
 return info=D.kab.map(d=>{const p=paths[d.id]||'';let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,a=0;
  for(const ring of p.split('M').slice(1)){const pts=[...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);let s=0;
   pts.forEach(([x,y],k)=>{const [u,v]=pts[(k+1)%pts.length];s+=x*v-u*y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;});a+=Math.abs(s/2);}
  return {d:p,x0,y0,x1,y1,area:a,cx:(x0+x1)/2,cy:(y0+y1)/2};});
}
function viewBox(gugus){
 const g=geom(),D=window.EDUSHIELD_DATA;if(!gugus)return window.EDU_GEO.viewBox;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;D.kab.forEach((k,i)=>{if(k.gugus!==gugus)return;const b=g[i];x0=Math.min(x0,b.x0);y0=Math.min(y0,b.y0);x1=Math.max(x1,b.x1);y1=Math.max(y1,b.y1);});
 const px=(x1-x0)*.04+2,py=(y1-y0)*.04+2;return [x0-px,y0-py,x1-x0+2*px,y1-y0+2*py].map(v=>v.toFixed(1)).join(' ');
}
/* o: {cls(i)->0..3, dim(i)->bool, sel, gugus, label}; label sudah di-escape pemanggil */
function html(o){
 const g=geom(),D=window.EDUSHIELD_DATA,vb=viewBox(o.gugus),r=(+vb.split(' ')[2])*.005;
 let p='',m='';
 D.kab.forEach((_,i)=>{const dim=o.dim(i)?' dim':'';p+=`<path data-i="${i}" class="pk${o.cls(i)}${dim}" d="${g[i].d}"/>`;
  if(g[i].area<AREA_MIN)m+=`<circle data-i="${i}" class="peta-mk pc${o.cls(i)}${dim}" cx="${g[i].cx.toFixed(1)}" cy="${g[i].cy.toFixed(1)}" r="${r.toFixed(2)}"/>`;});
 return `<div class="peta-wrap"><svg class="peta-svg" viewBox="${vb}" role="img" aria-label="${o.label}"><defs>`+
 `<pattern id="pk-p2" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" class="pb2"/><circle cx="1.5" cy="1.5" r=".6" class="pf"/></pattern>`+
 `<pattern id="pk-p3" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" class="pb3"/><rect width="3" height="1" class="pf"/><rect width="1" height="3" class="pf"/></pattern>`+
 `</defs><g class="peta-regions">${p}</g><path class="peta-sel" d="${o.sel>=0?g[o.sel].d:''}"/><g class="peta-marks">${m}</g></svg><div class="peta-tip" role="tooltip" hidden></div></div>`;
}
/* h: {tip(i)->teks, select(i)}. Delegasi pada <svg>. Mengembalikan {select(i)} yang hanya memindahkan garis tepi. */
function mount(root,h){
 const svg=root.querySelector('svg'),tip=root.querySelector('.peta-tip'),sel=svg.querySelector('.peta-sel'),g=geom();
 const idx=e=>{const t=e.target.closest&&e.target.closest('[data-i]');return t?+t.dataset.i:-1;};
 svg.addEventListener('pointermove',e=>{const i=idx(e);if(i<0){tip.hidden=true;return;}tip.textContent=h.tip(i);tip.hidden=false;
  const b=root.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;tip.style.left=Math.max(0,Math.min(x+12,b.width-tip.offsetWidth))+'px';tip.style.top=(y>tip.offsetHeight+20?y-tip.offsetHeight-12:y+16)+'px';});
 svg.addEventListener('pointerleave',()=>{tip.hidden=true;});
 svg.addEventListener('click',e=>{const i=idx(e);if(i>=0)h.select(i);});
 return {select(i){sel.setAttribute('d',g[i].d);}};
}
/* Kelas risiko Ⅰ..Ⅳ dari laju terprediksi; dipakai Peta risiko dan hero Beranda. */
const kelas=i=>{const r=window.EDUSHIELD_DATA.kab[i].r_hat;return r<.01?0:r<.025?1:r<.05?2:3;};
window.EduViz=window.EduViz||{};window.EduViz.peta={html,mount,viewBox,areaMin:AREA_MIN,geom,kelas};
})();
