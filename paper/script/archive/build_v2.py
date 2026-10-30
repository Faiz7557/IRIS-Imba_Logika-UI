"""Single source DOCX/PDF builder. Template preserved as base; Word renders the DOCX."""
from pathlib import Path
import sys,json,re,math,shutil
from copy import deepcopy
import numpy as np
from docx import Document
from docx.shared import Cm,Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image,ImageDraw,ImageFont
from references import REFS
import figures

ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).parent; OUT=HERE.parent/'output';OUT.mkdir(exist_ok=True)
D=json.loads((ROOT/'edushield/app/app_data.json').read_text(encoding='utf8'));S=D['nasional']; BR=json.loads((ROOT/'edushield/verification/browser_report.json').read_text())
TEMPLATE=ROOT/'drive-download-20261015T121612Z-1-001/Template UEC.docx'
def f(x,n=2):return f'{x:,.{n}f}'.replace(',','_').replace('.',',').replace('_','.')
metrics=S['prediksi']['GLM laju (tanpa riwayat)'];mc=S['mc_schemes']['EduShield (KKT)']
NUM={ 'n_kab':str(len(D['kab'])),'V_total':f(S['V_total'],0),'B_miliar':f(S['B_miliar']), 'mae':f(metrics['mae_pp'],3),'spearman':f(metrics['spearman'],3),'auc':f(metrics['auc_red'],3), 'gain_mc':f(mc['median']), 'gain_p5':f(mc['p5']),'gain_p95':f(mc['p95']),'prop_mc':f(S['mc_schemes']['Proporsional risiko']['median']), 'oracle_mc':f(S['mc_oracle_share']['median']), 'lambda':f(S['harga_bayangan_per_miliar']['1.74']), 'greedy_cover':f(S['alokasi']['Greedy (risiko tertinggi)']['cakupan_merah_pct']), 'kkt_cover':f(S['alokasi']['EduShield (KKT)']['cakupan_merah_pct']), 'pagu30':f(S['mc_pagu']['0.3|EduShield (KKT)']['median']), 'pagu80':f(S['mc_pagu']['0.8|EduShield (KKT)']['median']), 'remote_mc':f(S['mc_biaya_terpencil']['EduShield (KKT)']['median']), 'hh1':f(S['mc_hold_harmless'][0]['median']), 'hhgap':f(mc['median']-S['mc_hold_harmless'][0]['median']), 'solver_error':'3 × 10⁻¹⁵','solve_ms':f(max(c['solve_ms'] for c in BR['browser_solver']),1)}
REG={k:{'formatted':v,'origin':'summary.json / browser_report.json','kind':'simulation / prototype benchmark'} for k,v in NUM.items()}
(ROOT/'edushield/angka.json').write_text(json.dumps(REG,indent=2,ensure_ascii=False),encoding='utf8')
USED=[]
def cite(m):
 key=m.group(1)
 if key not in USED:USED.append(key)
 return '['+str(USED.index(key)+1)+']'

def base():
 doc=Document(TEMPLATE)
 defaults=Document()
 for style in defaults.styles:
  if style.name not in doc.styles:doc.styles.element.append(deepcopy(style.element))
 for child in list(doc._element.body):
  if child.tag!=qn('w:sectPr'):doc._element.body.remove(child)
 sec=doc.sections[0];sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.left_margin=Cm(4);sec.right_margin=Cm(3);sec.top_margin=Cm(3);sec.bottom_margin=Cm(3)
 normal=doc.styles['Normal'];normal.font.name='Times New Roman';normal.font.size=Pt(12);normal.paragraph_format.line_spacing=1.5;normal.paragraph_format.space_after=Pt(6);normal.paragraph_format.space_before=Pt(0)
 for name,size in [('Heading 1',14),('Heading 2',12),('Caption',12)]:
  if name not in doc.styles:doc.styles.add_style(name,WD_STYLE_TYPE.PARAGRAPH)
  style=doc.styles[name];style.font.name='Times New Roman';style.font.size=Pt(size);style.font.color.rgb=__import__('docx').shared.RGBColor(0,0,0);style.paragraph_format.line_spacing=1.5;style.paragraph_format.space_before=Pt(6);style.paragraph_format.space_after=Pt(3)
 doc.styles['Heading 1'].font.bold=True;doc.styles['Heading 2'].font.bold=True
 for head in [sec.header,sec.footer]:
  for p in head.paragraphs:p.clear()
 foot=sec.footer.paragraphs[0];foot.alignment=WD_ALIGN_PARAGRAPH.CENTER
 field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');foot._p.append(field)
 return doc

def para(doc,text,center=False):
 p=doc.add_paragraph(text);p.alignment=WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.JUSTIFY
 # Required italic foreign terms, without changing the source text or numbers.
 terms=['water-filling','hold-harmless','out-of-province','predict-then-optimize','marginal effect','proportional fairness']
 if any(t in text for t in terms):
  p.clear();pattern='('+'|'.join(map(re.escape,terms))+')'
  for chunk in re.split(pattern,text):p.add_run(chunk).italic=chunk in terms
 return p

def equation(doc,text):
 p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 mathxml=OxmlElement('m:oMath');r=OxmlElement('m:r');t=OxmlElement('m:t');t.text=text;r.append(t);mathxml.append(r);p._p.append(mathxml)

def table(doc,headers,rows,caption):
 para(doc,caption,True)
 t=doc.add_table(rows=1,cols=len(headers));t.style='Table Grid';t.autofit=False
 for i,h in enumerate(headers):t.rows[0].cells[i].text=h
 for row in rows:
  cells=t.add_row().cells
  for i,v in enumerate(row):cells[i].text=str(v)
 for row in t.rows:
  for cell in row.cells:
   cell.width=Cm(14/len(headers))
   for p in cell.paragraphs:
    p.paragraph_format.line_spacing=1;p.paragraph_format.space_after=Pt(3);p.paragraph_format.space_before=Pt(3)
    for r in p.runs:r.font.name='Times New Roman';r.font.size=Pt(12)
 # Repeat heading after page breaks.
 trpr=t.rows[0]._tr.get_or_add_trPr();repeat=OxmlElement('w:tblHeader');trpr.append(repeat)

def add_table(doc,kind):
 if kind=='prediction':
  rows=[[k.replace('GLM laju ','GLM ').replace(' (tanpa riwayat)',' tanpa riwayat').replace(' (+ riwayat)',' + riwayat'),f(v['mae_pp'],3),f(v['spearman'],3)] for k,v in S['prediksi'].items()]
  table(doc,['Model','MAE (pp)','Spearman'],rows,'Tabel 1. Kinerja prediksi rata-rata sepuluh pembagian lipatan dalam simulasi seed 0')
 elif kind=='allocation':
  rows=[[k.replace('Peringkat kemiskinan','Kemiskinan').replace('Greedy (risiko tertinggi)','Greedy').replace('Proporsional risiko','Proporsional').replace('EduShield (KKT)','KKT'),f(v['tercegah'],0),f(S['mc_schemes'][k]['median'])+'%'] for k,v in S['alokasi'].items()]
  table(doc,['Skema','Tertahan, seed 0','Gain median MC'],rows,'Tabel 2. Evaluasi skema pada laju benar simulasi; seed 0 dan median Monte Carlo disajikan terpisah')
 else:table(doc,['Masalah / tujuan','Komponen','Keputusan'],[['M1 / T1','S1 Radar','Tinjau laju dan faktor risiko'],['M2 / T2','S2 Simulator','Bandingkan kuota dan λ'],['M3 / T3','S3 Transisi','Batasi penurunan tahunan'],['M4 / T4','S4 Kalibrasi','Rancang koreksi dan audit']],'Tabel 3. Hubungan masalah, tujuan, dan komponen EduShield')

def fig(doc,name,caption,width=14):
 p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True
 p.add_run().add_picture(str(HERE/'figures'/(name+'.png')),width=Cm(width));p.paragraph_format.space_after=Pt(0)
 cap=doc.add_paragraph(caption,style='Caption');cap.alignment=WD_ALIGN_PARAGRAPH.CENTER

def cover(doc):
 for t in ['UNIVERSITY ESSAY COMPETITION','LOGIKA UI 2026','Peran Ilmu Matematika dalam Mewujudkan Sistem yang Cerdas, Adaptif, dan Berkelanjutan','Subtema: Pendidikan dan Sosial Masyarakat','', 'EDUSHIELD: SISTEM PENDUKUNG KEPUTUSAN KUOTA PIP BERBASIS PREDIKSI LAJU PUTUS SEKOLAH DAN OPTIMASI IMBAL HASIL MENURUN','', 'Disusun oleh:',"Faiz Iqbal I’tishom (164231059)",'Ida Bagus Gde Adhiaksa Mantra (164251066)','Ferdinand Hans Sebastian (164251036)','Nomor peserta: UEC0032','', 'Nama tim: [belum diberikan]','Institusi dan kota: [belum diberikan]','2026']:
  p=para(doc,t,True)
  if t.startswith('EDUSHIELD'):p.runs[0].bold=True
 doc.add_page_break()

def originality():
 path=ROOT/'drive-download-20261015T121612Z-1-001/Lembar Pernyataan Orisinalitas Karya (UEC).docx'
 d=Document(path)
 edits={4:'nama ketua tim\t: [perlu konfirmasi ketua tim]',5:'nama tim\t\t: [belum diberikan]',6:'asal institusi\t\t: [belum diberikan]',9:'Dengan ini, saya menyatakan bahwa karya kami dengan judul “EduShield: Sistem Pendukung Keputusan Kuota PIP Berbasis Prediksi Laju Putus Sekolah dan Optimasi Imbal Hasil Menurun” yang kami ajukan pada University Essay Competition LOGIKA UI 2026 sebagai berikut:',18:'[Kota], [tanggal penandatanganan]',22:'[Nama ketua tim; tanda tangan belum dibubuhkan]',25:'DRAF UEC0032 — lengkapi identitas, periksa pernyataan, dan tandatangani sesuai ketentuan panitia.'}
 for i,text in edits.items():d.paragraphs[i].text=text
 # Remove the template's trailing instruction/spacer paragraphs, which create a second page.
 for i in [25,24,23]:
  p=d.paragraphs[i]._element;p.getparent().remove(p)
 out=OUT/'UEC0032_LembarOrisinalitas_BELUM_DITANDATANGANI.docx';d.save(out);return out

def appendix_math(doc):
 blocks=[('LM1. Perumusan dan penurunan KKT',[
 'Tetapkan ρᵢ=r̂ᵢ, tanpa perkalian peluang klasifikasi. Kendala: Σcᵢxᵢ=B, αVᵢ≤xᵢ≤βVᵢ. Fungsi sᵢ memiliki sᵢ′=κρᵢ exp(−κxᵢ/Vᵢ)>0 dan sᵢ″=−κ²ρᵢ/Vᵢ exp(−κxᵢ/Vᵢ)<0. Pada himpunan layak kompak, optimum ada; untuk κ,ρ,V positif, tujuan ketat cekung memberi optimum unik.',
 'Lagrangian interior L=Σsᵢ(xᵢ)−λ(Σcᵢxᵢ−B). Persamaan stasioner sᵢ′=λcᵢ menghasilkan xᵢ=(Vᵢ/κ)ln[κρᵢ/(λcᵢ)]. Kendala kotak menghasilkan clipping seperti persamaan (2). Karena biaya total monoton menurun terhadap λ, bagi-dua memperoleh pengali yang memakai pagu. Pada pagu tepat di batas bawah/atas, pengali dapat tidak unik walaupun alokasinya unik.',
 'Biaya memakai juta rupiah; λ × 1.000 berarti tambahan siswa tertahan per Rp1 miliar. Ini turunan lokal model dan tidak berlaku sebagai estimasi kausal anggaran baru pada semua besaran perubahan.'
 ]),('LM2. Pembangkit data dan validasi',[
 'zᵢ adalah kemiskinan yang distandardisasi; zyᵢ adalah proporsi usia 15–19 yang distandardisasi. Rᵢ=1 untuk Nusa Tenggara dan Maluku–Papua; Kᵢ=1 untuk kota. Efek provinsi uₚ~Normal(0;0,25²); galat wilayah εᵢ~Normal(0;0,20²).',
 'ηᵢ = 0,30zᵢ + 0,30max(0,(p0ᵢ−15)/10) + 0,15Rᵢ + 0,10Rᵢzᵢ − 0,20Kᵢ + 0,10zyᵢ + uₚ + εᵢ. Intersep a dicari dengan bagi-dua sehingga rata-rata tertimbang V dari sigmoid(a+ηᵢ)=0,025. Laju benar rᵢ=sigmoid(a+ηᵢ); outcome obsᵢ~Binomial(Vᵢ,rᵢ)/Vᵢ.',
 'Riwayat lagᵢ dibangkitkan dari Binomial(Vᵢ,clip(rᵢ exp(νᵢ),0,1))/Vᵢ, dengan νᵢ~Normal(0;0,10²). Generator membuat lag sebelum obs; urutan ini perlu dipertahankan untuk reproduksi seed. Rincian seed 0 memakai rng(0), lipatan rng(100+rep), rep=0,…,9. Monte Carlo memakai rng(1000+s), s=0,…,29.',
 'GLM tanpa riwayat memakai konstanta, z, zy, kota, dan indikator gugus (Sumatera sebagai acuan). Normalisasi global kovariat merupakan pilihan transduktif; outcome uji tidak dipakai melatih model. Pilot perlu praproses latih saja dan evaluasi temporal.'
 ]),('LM3. Asumsi κ dan batas interpretasi',[
 'Versi v2 memilih κ=1,74 dari target efek 0,028 per penerima dalam skenario merata. Pada cakupan h=0,55 dan rerata tertimbang r=0,025, manfaat rata-rata per penerima adalah 0,025[1−exp(−κh)]/h. Memasukkan κ=1,74 memberi sekitar 0,028.',
 'Pembalikan target menghasilkan κ=−ln(1−0,028×0,55/0,025)/0,55≈1,74. Penurunan ini adalah kecocokan aljabar pada asumsi skenario; ia bukan estimasi kurva respons dari data percobaan.',
 'Abstrak Listiyanto–Qibthiyyah menyebut 2,8 persen dan marginal effect. Teks penuh belum berhasil diakses pada audit ini. Karena itu penafsiran 2,8 poin persentase belum dinyatakan terverifikasi. Jika angka itu relatif, kalibrasi harus diganti dan seluruh eksperimen diulang. Studi sekarang mempertahankan hasil v2 dengan menyebut κ sebagai asumsi dan menampilkan κ 0,8; 1,74; 3 serta kurva evaluasi alternatif.'
 ]),('LM4. Proporsional dan batas klaim optimal',[
 'Untuk max Σwᵢ ln xᵢ dengan Σcᵢxᵢ=B, syarat interior wᵢ/xᵢ=λcᵢ memberi xᵢ=wᵢ/(λcᵢ). Clipping terhadap batas kotak dan pencarian λ mempertahankan pagu. Bila cᵢ sama dan wᵢ=Vᵢρᵢ, kuota proporsional terhadap Vᵢρᵢ.',
 'Implementasi pembanding proporsional v2 menggunakan clip(mVᵢρᵢ,lo,hi). Penjelasan utilitas log eksak untuk biaya seragam. Pada eksperimen biaya berbeda, pembanding yang sama bukan lagi optimum utilitas log berbobot wᵢ=Vᵢρᵢ; optimum tersebut memerlukan pembagian cᵢ. Perbandingan biaya terpencil perlu dibaca dengan definisi ini.',
 'KKT eksponensial optimal untuk tujuan laju prediksi. Ketika dinilai dengan laju benar, proporsional dapat unggul. Oracle hanyalah optimum pada laju benar dan kurva eksponensial evaluasi yang sama; ia bukan batas universal untuk semua bentuk respons.'
 ]),('LM5. Lima wilayah dan contoh marjinal',[
 'Seluruh laju dan kuota berikut adalah simulasi seed 0. Lihat tabel dan kurva di bawah. Untuk wilayah interior sᵢ′/cᵢ=λ; pada lantai ≤λ, sedangkan pada batas atas ≥λ. Kuota pecahan belum dibulatkan menjadi penerima.'
 ]),('LM6. Reproduksi dan pemeriksaan',[
 'Urutan: validasi data lokal → bangkitkan r, lag, obs → bangun fitur → pisahkan provinsi → latih GLM → rata-rata prediksi sepuluh lipatan ulang → hitung skema → nilai memakai laju benar simulasi → uji sensitivitas dan transisi → ekspor paket dan hash → antarmuka → uji Python–JavaScript.',
 'Reproduksi analisis: python edushield/edushield.py 30. Ekspor: python edushield/edushield.py --export. Uji: python edushield/test_kkt.py dan node edushield/test_app.cjs. Tangkapan layar: python edushield/capture_app.py. Dokumen: python paper/script/build.py. Pustaka dan batas akses dicatat dalam source_audit.md.',
 'Hasil aktual tercatat dalam edushield/verification/solver_report.json dan browser_report.json. Keunikan ID, jumlah wilayah, pemakaian pagu, batas alokasi, kesetaraan marjinal interior, dan transisi enam skenario diuji. Browser menguji 18 layar, perubahan pagu, skenario tidak layak, pencarian, drilldown, CSV, cetak PDF, dan lebar seluler 390 px.'
 ])]
 for title,paras in blocks:
  doc.add_page_break();doc.add_heading(title,1)
  for text in paras:para(doc,text)
  if title.startswith('LM5'):
   rows=[[c['name'],f(c['r_hat']*100),f(c['x_merata'],1),f(c['x_edushield'],1)] for c in S['contoh']]
   table(doc,['Wilayah','r̂ (%)','Merata','KKT'],rows,'Tabel LM5. Contoh kuota kontinu seed 0, seluruhnya simulasi')
   fig(doc,'marginal','Gambar LM5. Kurva manfaat marjinal dan harga bayangan nasional pada simulasi dasar')

CAPTIONS={
'A1':('Beranda nasional','Meninjau pagu, manfaat seed 0, dan median Monte Carlo secara terpisah. Menjawab M2/T2 dan kriteria keterlacakan.'),
'A2':('Radar risiko','Petak non-geografis mencakup 514 wilayah; simbol kategori dan filter melengkapi warna. Menjawab M1/T1 dan aksesibilitas.'),
'A3':('Profil wilayah','Kontribusi logit dan kurva marjinal menjelaskan alasan risiko serta batas kuota. Menjawab M1–M2 dan kriteria setiap angka punya alasan.'),
'A4':('Simulator kuota','Penggeser menghitung ulang kuota; kombinasi pagu dan batas yang tidak layak ditolak. Menjawab M2/T2.'),
'A5':('Bandingkan skema','Proyeksi model, evaluasi seed 0 dan ringkasan 30 ulangan dipisahkan. Menjawab M2 dan kejujuran ketidakpastian.'),
'A6':('Uji ketahanan','Matriks gain terhadap merata memakai eksperimen tersimpan dengan kurva evaluasi berbeda. Menjawab T2.'),
'A7':('Peta jalan transisi','Lintasan dihitung dengan lantai 90% kuota tahun sebelumnya pada pagu tetap. Menjawab M3/T3.'),
'A8':('Lembar keputusan','Kuota kontinu, versi, hash, dan kolom peninjauan dicetak untuk keputusan manusia. Menjawab kriteria audit.'),
'B1':('Beranda daerah','Dinas membandingkan merata, KKT langsung, dan transisi pertama; merata bukan riwayat PIP riil. Menjawab M3.'),
'B2':('Mengapa skor kami','Faktor logit dan daerah serupa membantu pemeriksaan alasan usulan. Menjawab M1.'),
'B3':('Ajukan koreksi','Mockup formulir bukti dan penjelasan; belum mengirim permohonan. Menjawab M4.'),
'B4':('Lapor realisasi','Mockup pemilihan rekap agregat, tanpa unggah atau data siswa. Menjawab M4/T4.'),
'C1':('Muat data semester','Mockup validasi wilayah dan paket sebelum penggunaan model. Menjawab M4.'),
'C2':('Kalibrasi','Mockup tinjauan residual ekstrem dan asumsi κ, tanpa pelatihan ulang riil. Menjawab T4.'),
'C3':('Audit dan anomali','Mockup antrean pengecualian serta kebutuhan log perubahan produksi. Menjawab M4.'),
'L1':('Identitas visual','Perisai, garis alokasi, palet dan tipografi konsisten mendukung keterbacaan.'),
'L2':('Arsitektur empat lapis','Asal data, mesin analitik, paket berversi dan antarmuka memisahkan tanggung jawab audit.'),
'L3':('Rencana uji coba','Tahapan pilot memisahkan target masa depan dari capaian prototype.')}
def prototype_appendix(doc):
 for n,key in enumerate(['L1','A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','C1','C2','C3','L2','L3'],1):
  doc.add_page_break();title,body=CAPTIONS[key];doc.add_heading(f'Lampiran prototype {n}. {title} ({key})',1)
  source=ROOT/'edushield/lampiran'/(key+'.png');im=Image.open(source).convert('RGB')
  # One numbered callout, identifying the primary decision surface on each screen.
  draw=ImageDraw.Draw(im);x=int(im.width*.29);y=min(int(im.height*.28),450);rad=30
  draw.ellipse((x-rad,y-rad,x+rad,y+rad),fill='#172e3a',outline='white',width=3)
  font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',28);draw.text((x,y),'1',fill='white',font=font,anchor='mm')
  annotated=HERE/'figures'/('screen_'+key+'.png');im.save(annotated)
  w,h=im.size;width=min(14,16*w/h)
  p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True;p.add_run().add_picture(str(annotated),width=Cm(width))
  para(doc,f'Gambar L{n}. {title} ({key}). Anotasi 1 menandai area keputusan utama. {body} Seluruh angka risiko, kuota, dan manfaat bersifat simulasi.',True)
  if key=='L1':para(doc,'Logo satu warna dapat dibuat dengan seluruh isian menjadi hitam. Makna perisai dan susunan garis tetap terbaca tanpa perbedaan warna.')

def additional_audit(doc):
 path=ROOT/'edushield/results/stress_followup.json'
 if not path.exists():return
 a=json.loads(path.read_text(encoding='utf8'))
 doc.add_page_break();doc.add_heading('Audit tambahan 1. Salah ukur kebutuhan',1)
 para(doc,'Seluruh hasil berikut adalah simulasi 30 ulangan. Kuota dan batas memakai V proksi; evaluasi memakai V benar skenario yang totalnya dinormalisasi tetap, dengan laju benar tidak berubah. Manfaat dinilai pada min(kuota,V benar); kuota di atas kapasitas tidak dialihkan diam-diam. Ini mengisolasi salah ukur kebutuhan, tanpa pelatihan ulang model.')
 rows=[[name,f(v['EduShield (KKT)']['median'])+'%',f(v['Proporsional risiko']['median'])+'%'] for name,v in a['sensitivity_V'].items()]
 table(doc,['Skenario galat V','KKT gain','Proporsional gain'],rows,'Tabel A1. Median gain terhadap merata, seluruhnya simulasi')
 para(doc,'Pada galat kebutuhan terpencil lebih rendah 25%, median gain KKT turun menjadi '+f(a['sensitivity_V']['kebutuhan terpencil 25% lebih rendah']['EduShield (KKT)']['median'])+'%. Hasil ini menunjukkan pentingnya validasi V; KKT belum mengungguli proporsional secara universal.')
 rows=[[name,f(v['EduShield (KKT)']['median'])+'%',f(v['Proporsional risiko']['median'])+'%'] for name,v in a['corrected_need_quota_reallocation_pct'].items()]
 table(doc,['Koreksi V skenario','Pindah kuota KKT','Pindah proporsional'],rows,'Tabel A2. Perubahan keputusan jika ukuran kebutuhan dikoreksi')
 para(doc,'Perpindahan = setengah jumlah selisih absolut kuota dibagi total kuota, setelah optimasi ulang dengan V skenario dan rho tetap. Lihat stress_followup.json untuk P5–P95 serta kuota di atas kapasitas evaluasi. Skenario galat bukan perkiraan galat BPS yang sebenarnya.')
 doc.add_page_break();doc.add_heading('Audit tambahan 2. Perlindungan setara',1)
 para(doc,'KKT dan proporsional memakai α=20%, β=95%, pagu dan biaya sama, serta lantai 90% kuota tahun sebelumnya. Keduanya berangkat dari merata. Semua batas dan pagu diuji pada 30 ulangan × lima tahun.')
 rows=[[str(t+1),f(a['equal_protection_transition']['KKT'][t]['median'])+'%',f(a['equal_protection_transition']['Proporsional'][t]['median'])+'%'] for t in range(5)]
 table(doc,['Tahun','KKT median gain','Proporsional median gain'],rows,'Tabel A3. Manfaat simulasi pada transisi dengan perlindungan yang sama')
 para(doc,'Kedua lintasan sangat berdekatan. Temuan ini mempertahankan proporsional sebagai pembanding serius dan membatasi alasan memilih KKT pada tujuan eksplisit, pengali marjinal serta fleksibilitas kendala, bukan janji manfaat selalu lebih tinggi. Rumus proporsional log di sini berlaku pada biaya seragam.')

def render_word(paths):
 import win32com.client
 for path in paths:
  word=win32com.client.DispatchEx('Word.Application');word.Visible=False;word.DisplayAlerts=0
  documents=word.Documents
  documents._FlagAsMethod('Open');word._FlagAsMethod('Quit')
  try:
   doc=documents.Open(str(path.resolve()),False,True)
   doc._FlagAsMethod('ExportAsFixedFormat','Close')
   try:doc.ExportAsFixedFormat(str(path.with_suffix('.pdf').resolve()),17)
   finally:
    try:doc.Close(False)
    except Exception:pass
  finally:
   try:word.Quit()
   except Exception:pass

def check_pdf(path):
 import pymupdf
 pdf=pymupdf.open(path);texts=[p.get_text() for p in pdf]
 start=next(i for i,t in enumerate(texts) if 'PENDAHULUAN' in t)
 end=next(i for i,t in enumerate(texts) if 'DAFTAR PUSTAKA' in t)
 body=end-start
 assert body<=10,f'Body has {body} pages'
 for i,page in enumerate(pdf):
  assert len(re.sub(r'\s|\d','',texts[i]))>20,f'Blank page {i+1}'
  pix=page.get_pixmap(matrix=pymupdf.Matrix(.7,.7));pix.save(str(OUT/f'preview_{i+1:02}.png'))
 alltext='\n'.join(texts)
 assert '{{' not in alltext and 'Lorem ipsum' not in alltext
 report={'pages_total':len(pdf),'body_pages':body,'body_pdf_pages':[start+1,end],'references':len(USED),'figures_body':6,'prototype_screens':18,'identity_missing':['nama tim','institusi','kota'],'turnitin':'not run; no access','court':'see .court/LATEST','numbers_registry':len(NUM),'rendered_from':'same DOCX via registered Word-compatible Office (WPS)'}
 (OUT/'qa_report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
 print(json.dumps(report,indent=2));return report

def build():
 figures.build()
 im=Image.open(ROOT/'edushield/lampiran/A4.png');im.crop((0,0,im.width,min(im.height,1050))).save(HERE/'figures/app.png')
 text=(HERE/'content_compact.md').read_text(encoding='utf8');usedkeys=set(re.findall(r'\{\{(.*?)\}\}',text));assert usedkeys<=NUM.keys()
 for k in usedkeys:text=text.replace('{{'+k+'}}',NUM[k])
 text=re.sub(r'\[\[(\w+)\]\]',cite,text)
 assert set(USED)==set(REFS),'Uncited reference or missing source'
 doc=base();cover(doc);new_page=False
 for line in text.splitlines():
  if not line:continue
  if line=='[PAGE]':new_page=True
  elif line.startswith('## '):
   p=doc.add_heading(line[3:],2);p.paragraph_format.page_break_before=new_page;new_page=False
  elif line.startswith('# '):
   p=doc.add_heading(line[2:],1);p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.page_break_before=new_page;new_page=False
  elif line.startswith('[EQ] '):equation(doc,line[5:])
  elif line.startswith('[TABLE '):add_table(doc,line[7:-1])
  elif line.startswith('[FIG '):name,caption=line[5:-1].split('|',1);fig(doc,name,caption)
  else:para(doc,line)
 doc.add_page_break();doc.add_heading('DAFTAR PUSTAKA',1)
 for i,k in enumerate(USED,1):
  title,url=REFS[k];p=para(doc,f'[{i}] {title} [Daring]. Tersedia: {url}. Diakses: 30 Oktober 2026.');p.paragraph_format.line_spacing=1
 appendix_math(doc);additional_audit(doc);prototype_appendix(doc)
 name=OUT/'UEC0032_EduShield_Esai_DRAF.docx';doc.save(name)
 ap=base();ap.add_heading('Lampiran prototype EduShield',1);para(ap,'DATA SIMULASI. Kumpulan layar, alasan desain, arsitektur, dan rencana pilot. Kuota merupakan usulan kontinu.');prototype_appendix(ap);aname=OUT/'UEC0032_EduShield_Lampiran_Prototype.docx';ap.save(aname)
 # Final content source with numbered citations, useful for review without Word.
 (OUT/'esai_terbaca.md').write_text(text+'\n\nDAFTAR PUSTAKA\n'+'\n'.join(f'[{i}] {REFS[k][0]} {REFS[k][1]}' for i,k in enumerate(USED,1)),encoding='utf8')
 (HERE/'references'/'pustaka_ieee.json').write_text(json.dumps({str(i):{'key':k,'title':REFS[k][0],'url':REFS[k][1],'accessed':'2026-10-30'} for i,k in enumerate(USED,1)},indent=2,ensure_ascii=False),encoding='utf8')
 # QA checks compare source substitutions with the actual DOCX text.
 alltext='\n'.join(p.text for p in doc.paragraphs)
 for k in usedkeys:assert NUM[k] in alltext,f'Missing registered number {k}'
 assert len(re.findall(r'<m:oMath',doc._element.xml))>=2
 oname=originality()
 render_word([name,aname,oname]);check_pdf(name.with_suffix('.pdf'))

if __name__=='__main__':build()
