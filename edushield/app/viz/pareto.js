'use strict';
/* Pareto nilai audit (U5): batang = nilai audit N wilayah teratas (siswa tertahan, sumbu kiri),
   garis = porsi kumulatif dari seluruh nilai audit (0-100%, sumbu kanan). SVG murni, tanpa dependensi.
   Warna lewat kelas .au-* di audit.css (terang/gelap); batang dan garis dibedakan juga oleh bentuk (blok vs garis bertitik). */
(function(){
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(v,d)=>Number(v).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
// Batas atas sumbu kiri: 4 selang rapi supaya garis kisi selaras dengan sumbu kanan (0, 25, 50, 75, 100%).
function niceStep(maxv){const raw=Math.max(maxv,1e-9)/4,e=Math.pow(10,Math.floor(Math.log10(raw)));return [1,2,2.5,5,10].map(m=>m*e).find(s=>s>=raw-1e-12);}
/* o: {vals:[A menurun], names:[nama], cum:[porsi kumulatif 0..1 untuk tiap batang], unit, narrow, total}
   Mengembalikan <figure> berisi legenda, SVG, dan ringkasan teks setara. */
function html(o){
 const vals=o.vals,n=vals.length,unit=o.unit||'siswa tertahan',narrow=!!o.narrow;
 const W=narrow?360:720,H=narrow?320:380,m=narrow?{l:44,r:40,t:14,b:56}:{l:58,r:58,t:16,b:58},pw=W-m.l-m.r,ph=H-m.t-m.b;
 const step=niceStep(Math.max(...vals)),top=4*step,dg=Math.abs(step-Math.round(step))<1e-9?0:Math.abs(step*10-Math.round(step*10))<1e-9?1:2;
 const bw=pw/n,X=k=>m.l+bw*(k+.5),Y=v=>m.t+ph*(1-v/top),YC=f=>m.t+ph*(1-f);
 const every=n<=10?1:n<=20?(narrow?5:1):5;
 let g='';
 for(let t=0;t<=4;t++){const y=m.t+ph*(1-t/4);
  g+=`<line class="au-grid" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/><text class="au-t" x="${m.l-6}" y="${y+4}" text-anchor="end">${nf(step*t,dg)}</text><text class="au-t" x="${W-m.r+6}" y="${y+4}">${25*t}%</text>`;}
 const bars=vals.map((v,k)=>`<rect class="au-bar" x="${(X(k)-bw*.36).toFixed(2)}" y="${Y(v).toFixed(2)}" width="${(bw*.72).toFixed(2)}" height="${Math.max(0,m.t+ph-Y(v)).toFixed(2)}"><title>${k+1}. ${esc(o.names[k])}: ${nf(v,2)} ${unit}</title></rect>`).join('');
 const xl=vals.map((_,k)=>(k===0||(k+1)%every===0)?`<text class="au-t" x="${X(k).toFixed(2)}" y="${m.t+ph+16}" text-anchor="middle">${k+1}</text>`:'').join('');
 const pts=o.cum.map((f,k)=>`${X(k).toFixed(2)},${YC(f).toFixed(2)}`),last=n-1,lf=o.cum[last];
 const line=`<polyline class="au-line" points="${pts.join(' ')}"/>`+o.cum.map((f,k)=>n<=20||k===last?`<circle class="au-dot" cx="${X(k).toFixed(2)}" cy="${YC(f).toFixed(2)}" r="3.2"/>`:'').join('')
  +`<text class="au-t au-end" x="${(X(last)).toFixed(2)}" y="${(YC(lf)-9).toFixed(2)}" text-anchor="end">${nf(100*lf,1)}% (${n} teratas)</text>`;
 const axes=`<text class="au-t au-ax" transform="translate(12 ${m.t+ph/2}) rotate(-90)" text-anchor="middle">Nilai audit (${esc(unit)})</text><text class="au-t au-ax" transform="translate(${W-8} ${m.t+ph/2}) rotate(90)" text-anchor="middle">Porsi kumulatif dari seluruh nilai audit</text><text class="au-t au-ax" x="${m.l+pw/2}" y="${H-10}" text-anchor="middle">Peringkat wilayah (nilai audit menurun)</text>`;
 const i0=0,sum=`${n} wilayah teratas menurut nilai audit. Peringkat 1: ${esc(o.names[i0])}, ${nf(vals[i0],2)} ${unit}; peringkat ${n}: ${esc(o.names[last])}, ${nf(vals[last],2)} ${unit}. Porsi kumulatif mencapai ${nf(100*o.cum[0],1)}% pada peringkat 1 dan ${nf(100*lf,1)}% pada peringkat ${n}${o.total!=null?` dari total ${nf(o.total,1)} ${unit}`:''}. Daftar lengkap ada pada tabel peringkat di bawah.`;
 return `<figure class="au-fig"><ul class="au-legend"><li><svg width="18" height="12" aria-hidden="true"><rect class="au-bar" width="18" height="12" rx="2"/></svg>Batang: nilai audit per wilayah</li><li><svg width="26" height="12" aria-hidden="true"><line class="au-line" x1="0" x2="26" y1="6" y2="6"/><circle class="au-dot" cx="13" cy="6" r="3.2"/></svg>Garis: porsi kumulatif</li></ul>`
  +`<svg class="au-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik Pareto nilai audit; ringkasan teks ada di bawah grafik" preserveAspectRatio="xMidYMid meet">${g}${bars}${line}${xl}${axes}</svg>`
  +`<figcaption class="au-cap">${sum}</figcaption></figure>`;
}
window.EduViz=window.EduViz||{};window.EduViz.pareto={html,niceStep};
})();
