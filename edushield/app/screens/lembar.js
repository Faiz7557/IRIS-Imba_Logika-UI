'use strict';
/* U4: Lembar final (F4). Kuota bulat dari rounded() (app.js), status dan log dari EduStore. Ekspor/cetak memakai handler #csv #json #print di app.js. */
const STATUS_USULAN={draf:'Draf',dikirim:'Dikirim ke dinas',koreksi:'Koreksi menunggu putusan',diputuskan:'Diputuskan, belum final',final:'Final'};
function lembarLog(st){
 const n=k=>st.koreksi.filter(x=>x.status===k).length,rows=st.log.slice(-8).reverse();
 return `<p><strong>Status usulan: <span id="lembar-status">${esc(STATUS_USULAN[st.status]||st.status)}</span></strong> · koreksi: ${fmt(n('menunggu'))} menunggu, ${fmt(n('diterima'))} diterima, ${fmt(n('ditolak'))} ditolak · ${fmt(st.log.length)} entri log.</p>`+
 (rows.length?`<div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Peran</th><th>Aksi</th><th>Status</th><th>Alasan</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="mono">${esc(e.t)}</td><td>${esc(e.peran)}</td><td>${esc(String(e.aksi).replace(/_/g,' '))}${e.wilayah?' · '+esc(e.wilayah):''}</td><td>${esc(e.status_sebelum)} → ${esc(e.status_sesudah)}</td><td>${esc(e.alasan||'')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Belum ada entri log. Usulan masih berstatus draf.</p>');
}
function lembarTabel(){
 const q=rounded(),dn=new Set(q.turun),bps=D.kab.some(d=>d.kode_bps!=null);
 return `<div class="table-wrap"><table><thead><tr>${bps?'<th>Kode BPS</th>':''}<th>Wilayah / provinsi<span class="print-only">DATA SIMULASI</span></th><th class="num">Populasi rentan (proksi)</th><th class="num">Kuota bulat</th><th class="num">Kuota kontinu</th><th class="num">Cakupan</th></tr></thead><tbody>${D.kab.map((d,i)=>`<tr>${bps?`<td>${esc(d.kode_bps??'')}</td>`:''}<td>${esc(d.nama)}<br><small class="muted">${esc(d.prov)}</small></td><td class="num">${fmt(result.V[i])}</td><td class="num"><strong>${fmt(q.z[i])}</strong>${dn.has(i)?' <small class="tag-turun">turun</small>':''}</td><td class="num muted">${fmt(result.x.edushield[i],1)}</td><td class="num">${pct(q.z[i]/result.V[i])}</td></tr>`).join('')}</tbody></table></div>`;
}
function lembar(){
 ensureFull();
 const q=rounded(),st=window.EduStore?EduStore.get():{status:'draf',koreksi:[],log:[]};
 return head('Lembar final','Periksa parameter, kuota bulat, dan status usulan, lalu cetak atau ekspor. Dokumen ini belum menetapkan penerima.')+
 `<div class="print-only banner">DATA SIMULASI — USULAN, BUKAN KEPUTUSAN FINAL</div><div class="actions no-print"><button id="print" class="primary">Cetak atau simpan PDF</button><button id="csv">Unduh kuota CSV</button><button id="json">Unduh usulan JSON</button></div>`+
 `<div class="panel"><h2>Parameter skenario</h2><div class="form-grid no-print"><div><label for="reviewer">Nama peninjau (opsional)</label><input id="reviewer" placeholder="Belum ditinjau"></div><div><label for="reason">Catatan peninjauan</label><textarea id="reason" placeholder="Alasan menerima atau meminta revisi skenario"></textarea></div></div><div id="review-text"></div><p><strong>Pagu Rp${fmt(result.B/1000,3)} miliar</strong> · porsi ${pct(params.share)} · α ${pct(params.alpha,0)} · β ${pct(params.beta,0)} · κ ${fmt(params.kappa,2)} · biaya terpencil +${pct(params.remote)}.</p><p class="mono">Model ${D.meta.versi_model}; data ${D.meta.versi_data}; seed 0; ${D.meta.tanggal}<br>SHA-256 paket data: ${window.DATA_HASH}</p></div>`+
 panel('Ringkasan kuota bulat',`<div class="round-grid"><div class="readout"><span>Total kuota</span><strong>${fmt(q.total)}</strong></div><div class="readout"><span>Biaya kuota bulat</span><strong>Rp${fmt(q.biaya/1000,3)} miliar</strong></div><div class="readout"><span>Sisa pagu</span><strong>Rp${fmt(q.sisa,2)} juta</strong></div><div class="readout"><span>Kehilangan manfaat akibat pembulatan</span><strong>${fmt(q.loss,1)} siswa (${fmt(q.lossPct,2)}%)</strong></div><div class="readout"><span>Wilayah terkena langkah turun</span><strong>${fmt(q.turun.length)}</strong></div></div>${q.layak?'':'<p class="negative">Pagu tidak cukup untuk lantai bulat; periksa parameter.</p>'}`)+
 panel('Status usulan dan log',lembarLog(st))+
 panel('Kuota per wilayah',`<p class="panel-caption">Kuota bulat adalah usulan perencanaan. Kuota kontinu hanya pembanding. Pemilihan skenario dicatat dalam ekspor, tanpa mengubah kuota individu wilayah secara manual.</p>${lembarTabel()}<div class="signature"><span>Disusun / ditinjau: __________________</span><span>Disahkan oleh pejabat berwenang: __________________</span></div>`)+
 `<div class="sim-next no-print"><a class="pill primary" href="#usulan">Kembali ke Usulan &amp; koreksi →</a></div>`;
}
EduScreens.lembar=lembar;
