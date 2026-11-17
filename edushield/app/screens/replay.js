'use strict';
/* U8: layar Replay (langkah 4). Semua angka dari D.replay / D.meta; judul dan label mengikuti D.meta.tingkat_data (TRD 4.4). */
(function(){
const SK=['kemiskinan','greedy','proporsional','edushield','aktual'];
const NAMA={...labels,aktual:'Aktual (penerima PIP 2025, diskalakan ke pagu)'};
const sg=(v,d=1)=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),d)+'%';
function judul(R){const t=R.tingkat_data;
 if(t===1)return ['Replay pada data Dapodik','Data nyata · kurva manfaat asumsi'];
 if(t===2)return [`Validasi pada ${fmt(R.n_wilayah)} wilayah`,'Data nyata sebagian'];
 return [`Replay simulasi: rencana tahun ${R.tahun_rencana}, dinilai pada tahun ${R.tahun_hasil}`,'Simulasi · belum ada data kabupaten/kota terbuka'];}
function chart(R){const g=R.gain_vs_merata_pct,lo=Math.min(0,...SK.map(k=>g[k].p5)),hi=Math.max(0,...SK.map(k=>g[k].p95));
 const step=5,a=Math.floor(lo/step)*step,b=Math.ceil(hi/step)*step,L=190,W=700,Rr=24,T=30,row=44,H=T+row*SK.length+34,X=v=>L+(v-a)/(b-a)*(W-L-Rr);
 let o=`<svg class="rp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Keunggulan tiap skema atas alokasi merata pada hasil tahun ${R.tahun_hasil}: median dan rentang p5 sampai p95 dari ${R.n_seed} ulangan simulasi. Angka lengkap ada pada tabel di bawah grafik.">`;
 for(let v=a;v<=b;v+=step)o+=`<line x1="${X(v)}" x2="${X(v)}" y1="${T-8}" y2="${H-30}" class="rp-grid${v===0?' rp-zero':''}"/><text x="${X(v)}" y="${H-12}" text-anchor="middle" class="rp-tick">${v>0?'+':v<0?'−':''}${Math.abs(v)}%</text>`;
 SK.forEach((k,j)=>{const y=T+row*j+row/2,m=g[k];
  o+=`<text x="${L-10}" y="${y+4}" text-anchor="end" class="rp-lab${k==='edushield'?' rp-main':''}">${esc(k==='aktual'?'Aktual (PIP 2025)':labels[k])}</text>`+
   `<line x1="${X(m.p5)}" x2="${X(m.p95)}" y1="${y}" y2="${y}" class="rp-whisk"/><line x1="${X(m.p5)}" x2="${X(m.p5)}" y1="${y-6}" y2="${y+6}" class="rp-whisk"/><line x1="${X(m.p95)}" x2="${X(m.p95)}" y1="${y-6}" y2="${y+6}" class="rp-whisk"/>`+
   `<rect x="${Math.min(X(0),X(m.median))}" y="${y-9}" width="${Math.abs(X(m.median)-X(0))}" height="18" rx="3" class="rp-bar${k==='edushield'?' rp-hi':k==='aktual'?' rp-neg':''}"/>`+
   (m.p95>b-3?`<text x="${X(m.p95)-6}" y="${y-12}" text-anchor="end" class="rp-val">`:`<text x="${Math.max(X(m.p95),X(m.median))+6}" y="${y+4}" class="rp-val">`)+`${sg(m.median)}</text>`;});
 return o+`<text x="${X(0)}" y="${T-14}" text-anchor="middle" class="rp-tick">Merata = 0%</text></svg>`;}
function tabel(R){return `<div class="table-wrap"><table><thead><tr><th>Skema</th><th class="num">Siswa tercegah (median)</th><th class="num">Keunggulan atas merata</th><th class="num">Rentang p5–p95</th></tr></thead><tbody>`+
 `<tr><td>${esc(labels.merata)}</td><td class="num">${fmt(R.skema.merata)}</td><td class="num">acuan</td><td class="num">–</td></tr>`+
 SK.map(k=>{const m=R.gain_vs_merata_pct[k];return `<tr><td>${esc(NAMA[k])}</td><td class="num">${fmt(R.skema[k])}</td><td class="num"><strong>${sg(m.median)}</strong></td><td class="num">${sg(m.p5)} s.d. ${sg(m.p95)}</td></tr>`;}).join('')+`</tbody></table></div>`;}
function replay(){const R=D.replay,[h,lab]=judul(R),sp=D.meta.sumber_pip,c=R.corr_laju,s=R.sisa_pagu_aktual,t1=R.rata_laju_t1;
 return `<div class="peta-head"><span class="page-context">Langkah 4 · ${EduApp.role==="B"?"Ruang Dinas Pendidikan":"Ruang analis pusat"}</span><h1>${esc(h)}</h1><p class="sub">Bagaimana aturan ini bila dijalankan tahun lalu?</p></div>`+
 `<p class="peta-sim"><b>${esc(lab)}.</b> Median ${fmt(R.n_seed)} ulangan seed pada ${fmt(R.n_wilayah)} kabupaten / kota; manfaat dihitung dengan kurva asumsi κ = ${fmt(D.meta.kappa.nilai,2)}.</p>`+
 `<div data-tour="replay">`+
 `<section class="panel"><h2>Dua titik waktu</h2><div class="rp-time"><div><b>${R.tahun_rencana}</b><span>Model dilatih dan kuota dibagi</span></div><span class="rp-arrow" aria-hidden="true">→</span><div><b>${R.tahun_hasil}</b><span>Skema dinilai pada laju tahun ini</span></div></div>`+
 `<p>Setiap skema membagi pagu yang sama memakai data tahun ${R.tahun_rencana}. Hasilnya dinilai pada laju putus sekolah tahun ${R.tahun_hasil}, yang tidak dilihat model saat membagi kuota.${R.tingkat_data===3?' Pada tingkat data 3 kedua tahun adalah realisasi simulasi dari proses pembangkit data yang dikalibrasi ke angka nasional BPS.':''}</p></section>`+
 `<section class="panel"><h2>Keunggulan atas alokasi merata pada hasil tahun ${R.tahun_hasil}</h2><p class="muted">Batang: median. Garis: rentang p5–p95 dari ${fmt(R.n_seed)} ulangan.</p>${chart(R)}`+
 `<p class="rp-must"><strong>${esc(R.catatan.split('. ')[0])}.</strong></p>${tabel(R)}<p class="muted rp-src">Skema aktual: ${esc(sp.nama)}. ${esc(sp.catatan)} Satuan: ${esc(R.satuan)}.</p></section>`+
 `<div class="grid rp-grid3"><div class="panel"><span>Korelasi laju ${R.tahun_rencana} dan ${R.tahun_hasil}</span><strong class="metric">${fmt(c.median,3)}</strong><small>Rentang p5–p95: ${fmt(c.p5,3)}–${fmt(c.p95,3)}. Peringkat risiko bertahan antar tahun.</small></div>`+
 `<div class="panel"><span>Rata-rata laju tahun ${R.tahun_hasil}</span><strong class="metric">${pct(t1.median,2)}</strong><small>Terkalibrasi ke ${pct(D.meta.target_kalibrasi.nilai,2)}: ${esc(D.meta.target_kalibrasi.sumber)}.</small></div>`+
 `<div class="panel"><span>Sisa pagu skema aktual</span><strong class="metric">Rp${fmt(s.median/1000,1)} miliar</strong><small>Pemotongan ke kapasitas wilayah tidak diredistribusi, sehingga sebagian pagu tidak terpakai.</small></div></div>`+
 `<div class="notice"><b>Cara membaca.</b> ${esc(R.catatan.split('. ').slice(1).join('. '))}</div>`+
 `</div><div class="peta-next"><a class="pill primary" href="#usulan">Lanjut ke usulan &amp; koreksi →</a></div>`;}
EduScreens.replay=replay;
})();
