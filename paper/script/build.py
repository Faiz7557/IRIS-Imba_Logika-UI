"""Single-source builder: content.md + lampiran.md -> DOCX on the official UEC template -> PDF from that same DOCX.

Run from anywhere: python paper/script/build.py
Layout rules follow the UEC guidebook (A4, margin 4/3/3/3 cm, Times New Roman 12, spacing 1.5, chapters 14 bold on
a new page, IEEE references at spacing 1) and the template's own instructions (one blank line between paragraphs,
captions 'Tabel n.' above and 'Gambar n.' below in bold, no trailing period). Body pages carry no equations.
"""
from pathlib import Path
import io
import json
import re
from copy import deepcopy
from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from references import REFS
import figures
import checks

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
OUT = HERE.parent / 'output'
OUT.mkdir(exist_ok=True)
TEMPLATE = ROOT / 'Template UEC.docx'
LOGO = ROOT / 'LOGO LOGIKA UI.png'
ORIGINALITY = ROOT / 'drive-download-20261015T121612Z-1-001/Lembar Pernyataan Orisinalitas Karya (UEC).docx'

IDENT = {'nomor': 'UEC0032', 'tim': 'IRIS Imba', 'institusi': 'Universitas Airlangga', 'kota': 'Surabaya',
         'anggota': ['Faiz Iqbal I’tishom', 'Ida Bagus Gde Adhiaksa Mantra', 'Ferdinand Hans Sebastian'],
         'subtema': 'Pendidikan dan Sosial Masyarakat',
         'judul': 'EduShield: Sistem Pendukung Keputusan Kuota Program Indonesia Pintar Berbasis Prediksi Risiko '
                  'Putus Sekolah dan Optimasi Imbal Hasil Menurun'}
STEM = f"{IDENT['nomor']}_{IDENT['tim']}"           # guidebook: NomorPeserta_NamaTim_Esai.pdf

RES = ROOT / 'edushield/results'
load = lambda p: json.loads(p.read_text(encoding='utf8'))
S, GAP, STRESS = load(RES / 'summary.json'), load(RES / 'gap_followup.json'), load(RES / 'stress_followup.json')
BR = load(ROOT / 'edushield/verification/browser_report.json')
D = load(ROOT / 'edushield/app/app_data.json')


def f(x, n=2):
    return f'{x:,.{n}f}'.replace(',', '_').replace('.', ',').replace('_', '.')


def sci(x):
    e = int(f'{x:e}'.split('e')[1]); m = round(x / 10 ** e)
    sup = str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹')
    return f'{m} × 10{str(e).translate(sup)}'


aps = {r['provinsi']: r for r in figures.read_csv('bps_aps_provinsi_2025.csv')}
ats = {r['kuintil']: r for r in figures.read_csv('bps_ats_kuintil_2023.csv')}
pred = S['prediksi']; glm = pred['GLM laju (tanpa riwayat)']; mc = S['mc_schemes']; al = S['alokasi']
gap = GAP['gap_closed_pct']; sv = STRESS['sensitivity_V']['kebutuhan terpencil 25% lebih rendah']
sby = next(d for d in D['kab'] if d['nama'] == 'Kota Surabaya')
sup = next(d for d in D['kab'] if d['nama'] == 'Supiori')
NUM = {
    'aps_712': f(float(aps['INDONESIA']['aps_7_12'])), 'aps_nat': f(float(aps['INDONESIA']['aps_16_18'])),
    'aps_pt': f(float(aps['PAPUA TENGAH']['aps_16_18'])), 'aps_diy': f(float(aps['DI YOGYAKARTA']['aps_16_18'])),
    'ats_q1': f(float(ats['1']['sma'])), 'ats_q5': f(float(ats['5']['sma'])),
    'ats_ratio': f(float(ats['1']['sma']) / float(ats['5']['sma']), 1),
    'n_kab': str(S['n_kabkota']), 'V_total': f(S['V_total'], 0), 'B_miliar': f(S['B_miliar']),
    'mae': f(glm['mae_pp'], 3), 'mae_hist': f(pred['GLM laju (+ riwayat)']['mae_pp'], 3),
    'spearman': f(glm['spearman'], 3), 'auc': f(glm['auc_red'], 3), 'auc_pov': f(pred['Hanya kemiskinan']['auc_red'], 3),
    'sup_true': f(100 * sup['r_sim']), 'sup_hat': f(100 * sup['r_hat']),
    'gap_kkt': f(gap['EduShield (KKT)']['median'], 1), 'gap_prop': f(gap['Proporsional risiko']['median'], 1),
    'gap_pov': f(gap['Peringkat kemiskinan']['median'], 1), 'gap_greedy': f(gap['Greedy (risiko tertinggi)']['median'], 1),
    'greedy_cover': f(al['Greedy (risiko tertinggi)']['cakupan_merah_pct']), 'kkt_cover': f(al['EduShield (KKT)']['cakupan_merah_pct']),
    'greedy_gain0': f(al['Greedy (risiko tertinggi)']['gain_vs_merata_pct']), 'kkt_gain0': f(al['EduShield (KKT)']['gain_vs_merata_pct']),
    'oracle_mc': f(S['mc_oracle_share']['median']), 'merata_oracle': f(GAP['share_of_oracle_pct']['Merata']['median'], 1),
    'gain_mc': f(mc['EduShield (KKT)']['median']), 'gain_p5': f(mc['EduShield (KKT)']['p5']), 'gain_p95': f(mc['EduShield (KKT)']['p95']),
    'prop_mc': f(mc['Proporsional risiko']['median']), 'kkt_wins': str(GAP['kkt_wins_seeds']),
    'true_kkt': f(GAP['true_rate_gain_pct']['KKT']['median']), 'true_prop': f(GAP['true_rate_gain_pct']['Proporsional']['median']),
    'lambda': f(S['harga_bayangan_per_miliar']['1.74']),
    'V_low_kkt': f(sv['EduShield (KKT)']['median']), 'V_low_prop': f(sv['Proporsional risiko']['median']),
    'pagu30': f(S['mc_pagu']['0.3|EduShield (KKT)']['median']), 'pagu80': f(S['mc_pagu']['0.8|EduShield (KKT)']['median']),
    'sby_y5': f(100 * sby['hh'][-1] / sby['V'], 1), 'hh1': f(S['mc_hold_harmless'][0]['median']),
    'hhgap': f(mc['EduShield (KKT)']['median'] - S['mc_hold_harmless'][0]['median']),
    'solver_error': sci(max(c['max_relative_error'] for c in BR['browser_solver'])),
    'solve_ms': f(max(c['solve_ms'] for c in BR['browser_solver']), 0),
}
USED = []


def cite(m):
    if m.group(1) not in USED:
        USED.append(m.group(1))
    return f'[{USED.index(m.group(1)) + 1}]'


# ---------------------------------------------------------------- low-level formatting
ITALIC = re.compile(r'(?<![\w*])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![\w*])')   # *term*, but not the star in λ*


def runs(p, text, size=12, bold=False):
    pos = 0
    for m in list(ITALIC.finditer(text)) + [None]:
        end = m.start() if m else len(text)
        for chunk, italic in [(text[pos:end], False)] + ([(m.group(1), True)] if m else []):
            if chunk:
                r = p.add_run(chunk); r.font.name = 'Times New Roman'; r.font.size = Pt(size)
                r.bold = bold or None; r.italic = italic or None
                r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), 'Times New Roman')
        if m:
            pos = m.end()
    return p


def fmt(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY, after=12, before=0, spacing=1.5, keep=False):
    pf = p.paragraph_format
    p.alignment = align; pf.space_after = Pt(after); pf.space_before = Pt(before); pf.line_spacing = spacing
    pf.first_line_indent = Cm(0); pf.left_indent = Cm(0); pf.keep_with_next = keep; pf.widow_control = True
    return p


def para(doc, text):
    return fmt(runs(doc.add_paragraph(), text))


def chapter(doc, top, title=None):
    p = fmt(runs(doc.add_paragraph(), top, 14, True), WD_ALIGN_PARAGRAPH.CENTER, 0 if title else 18, keep=True)
    p.paragraph_format.page_break_before = True
    if title:
        fmt(runs(doc.add_paragraph(), title, 14, True), WD_ALIGN_PARAGRAPH.CENTER, 12, keep=True)


def subbab(doc, text):
    fmt(runs(doc.add_paragraph(), text, 12, True), WD_ALIGN_PARAGRAPH.LEFT, 0, keep=True)


def caption(doc, kind, num, text, after):
    assert not text.rstrip().endswith('.'), f'caption ends with a period: {text}'
    p = doc.add_paragraph(); runs(p, f'{kind} {num}.', bold=True); runs(p, ' ' + text)
    prev = p._p.getprevious()
    before = 12 if prev is not None and prev.tag == qn('w:tbl') else 0   # back-to-back tables must not touch
    return fmt(p, WD_ALIGN_PARAGRAPH.CENTER, after, before, spacing=1.0, keep=kind == 'Tabel')


def figure(doc, path, num, text, width=14.0):
    p = fmt(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 4, 4, 1.0, keep=True)
    p.add_run().add_picture(str(path), width=Cm(width))
    caption(doc, 'Gambar', num, text, 12)


def borders(table, header_rows=1):
    """Three-rule table (top, below header, bottom), as in the finalist reference; left aligned per the template."""
    def edge(cell, side, size):
        tcPr = cell._tc.get_or_add_tcPr()
        b = tcPr.find(qn('w:tcBorders'))
        if b is None:
            b = OxmlElement('w:tcBorders'); tcPr.append(b)
        e = OxmlElement(f'w:{side}'); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), str(size)); e.set(qn('w:color'), '000000')
        b.append(e)
    for c in table.rows[0].cells:
        edge(c, 'top', 12)
    for c in table.rows[header_rows - 1].cells:
        edge(c, 'bottom', 6)
    for c in table.rows[-1].cells:
        edge(c, 'bottom', 12)


def table(doc, num, cap, headers, rows, widths, size=12, left=1):
    assert abs(sum(widths) - 14) < 0.05, 'tables span the 14 cm text width'
    caption(doc, 'Tabel', num, cap, 4)
    t = doc.add_table(rows=1, cols=len(headers)); t.alignment = WD_TABLE_ALIGNMENT.LEFT; t.autofit = False
    for col, w in zip(t.columns, widths):              # WPS reads the grid, not only per-cell widths
        col.width = Cm(w)
    layout = OxmlElement('w:tblLayout'); layout.set(qn('w:type'), 'fixed'); t._tbl.tblPr.append(layout)
    for row_vals in [headers] + rows:
        cells = t.rows[0].cells if row_vals is headers else t.add_row().cells
        for i, v in enumerate(row_vals):
            cells[i].width = Cm(widths[i])
            p = cells[i].paragraphs[0]
            runs(p, str(v), size, bold=row_vals is headers)
            fmt(p, WD_ALIGN_PARAGRAPH.LEFT if i < left else WD_ALIGN_PARAGRAPH.CENTER, 2, 2, 1.0)
    t.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))
    for row in t.rows:                                 # keep each table on one page, together with its caption
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
        if row is not t.rows[-1]:
            for c in row.cells:
                c.paragraphs[0].paragraph_format.keep_with_next = True
    borders(t)


def equation(doc, latex, label):
    plt.rcParams['mathtext.fontset'] = 'stix'
    fig = plt.figure(figsize=(0.01, 0.01))
    fig.text(0, 0, f'${latex}$', fontsize=12)
    buf = io.BytesIO(); fig.savefig(buf, dpi=300, bbox_inches='tight', pad_inches=0.03, facecolor='white'); plt.close(fig)
    im = Image.open(buf); w_cm = min(im.width / 300 * 2.54, 10.3)   # leaves room for the label on the same line
    path = HERE / 'figures' / f'eq_{label.replace(".", "_")}.png'; im.save(path)
    p = fmt(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 8, 4, 1.0)
    p.add_run().add_picture(str(path), width=Cm(w_cm)); runs(p, f'    ({label})')


# ---------------------------------------------------------------- tables (all numbers from JSON)
def body_table(doc, key, num, cap):
    if key == 'prediksi':
        names = [('GLM tanpa riwayat', 'GLM laju (tanpa riwayat)'), ('GLM dengan riwayat', 'GLM laju (+ riwayat)'),
                 ('Kemiskinan saja', 'Hanya kemiskinan'), ('LightGBM tanpa riwayat', 'LightGBM (tanpa riwayat)')]
        rows = [[lab, f(pred[k]['mae_pp'], 3), f(pred[k]['spearman'], 3), f(pred[k]['auc_red'], 3)] for lab, k in names]
        table(doc, num, cap, ['Model', 'MAE (pp)', 'Spearman', 'AUC Zona Merah'], rows, [4.4, 2.6, 2.6, 4.4])
    elif key == 'alokasi':
        names = [('Merata', 'Merata'), ('Kemiskinan', 'Peringkat kemiskinan'), ('Greedy', 'Greedy (risiko tertinggi)'),
                 ('Proporsional', 'Proporsional risiko'), ('KKT', 'EduShield (KKT)')]
        rows = [[lab, f(al[k]['tercegah'], 0), f(mc[k]['median']) + '%', (f(gap[k]['median'], 1) if k in gap else '0,0') + '%']
                for lab, k in names]
        rows.append(['*Oracle*', f(S['oracle']['tercegah'], 0), f(GAP['true_rate_gain_pct']['KKT']['median']) + '%', '100,0%'])
        table(doc, num, cap, ['Aturan', 'Siswa tertahan, simulasi 1', 'Keunggulan atas merata, median', 'Celah tertutup, median'],
              rows, [3.2, 3.6, 3.8, 3.4])
    elif key == 'roadmap':
        rows = [['Pilot data', '0–6 bulan', 'Padankan Dapodik, DTSEN, dan BPS di NTT dan Papua Pegunungan; audit proksi kebutuhan',
                 'MAE ≤ 0,7 pp pada semester berikutnya'],
                ['Uji kebijakan', '6–18 bulan', 'Usulan proporsional dengan transisi, desain bertahap', 'Retensi teramati; κ lokal terukur'],
                ['Perluasan', '18–36 bulan', 'Siklus semesteran nasional, koreksi daerah, audit bias', 'Laporan audit terbuka']]
        table(doc, num, cap, ['Tahap', 'Waktu', 'Kegiatan utama', 'Indikator'], rows, [2.6, 2.3, 5.6, 3.5], size=11, left=4)
    elif key == 'contoh':
        rows = [[c['name'], f(100 * c['r_hat']), f(c['V'], 0), f(c['x_merata'], 1), f(c['x_edushield'], 1)] for c in S['contoh']]
        table(doc, num, cap, ['Wilayah', 'Prediksi laju (%)', 'Proksi V', 'Kuota merata', 'Kuota KKT'], rows, [3.8, 2.8, 2.2, 2.6, 2.6])
    elif key == 'celah':
        names = [('Kemiskinan', 'Peringkat kemiskinan'), ('Greedy', 'Greedy (risiko tertinggi)'),
                 ('Proporsional', 'Proporsional risiko'), ('KKT', 'EduShield (KKT)')]
        tr = {'Proporsional risiko': 'Proporsional', 'EduShield (KKT)': 'KKT'}
        rows = [[lab, f(gap[k]['median'], 1) + '%', f(mc[k]['median']) + '%',
                 f(GAP['true_rate_gain_pct'][tr[k]]['median']) + '%' if k in tr else '–'] for lab, k in names]
        table(doc, num, cap, ['Aturan', 'Celah tertutup', 'Keunggulan, laju prediksi', 'Keunggulan, laju benar'], rows, [3.4, 3.2, 3.8, 3.6])
    elif key == 'galatV':
        rows = [[name, f(v['EduShield (KKT)']['median']) + '%', f(v['Proporsional risiko']['median']) + '%',
                 f(v['Greedy (risiko tertinggi)']['median']) + '%'] for name, v in STRESS['sensitivity_V'].items()]
        table(doc, num, cap, ['Skenario galat V', 'KKT', 'Proporsional', 'Greedy'], rows, [6.2, 2.6, 2.8, 2.4])
    elif key == 'transisi':
        t = STRESS['equal_protection_transition']
        rows = [[str(i + 1), f(t['KKT'][i]['median']) + '%', f(t['Proporsional'][i]['median']) + '%'] for i in range(5)]
        table(doc, num, cap, ['Tahun', 'KKT', 'Proporsional'], rows, [4.0, 5.0, 5.0])
    else:
        raise KeyError(key)


GALLERY = [('A1', 'Ringkasan nasional', 'pagu, manfaat simulasi pertama, dan median 30 simulasi ditampilkan terpisah'),
           ('A2', 'Radar risiko', 'peta petak non-geografis 514 wilayah dengan kategori risiko yang juga dapat dibaca tanpa warna'),
           ('A3', 'Profil wilayah', 'kontribusi faktor risiko dan posisi wilayah pada kurva manfaat marjinal'),
           ('A4', 'Simulator kuota', 'kuota dihitung ulang saat pagu atau batas diubah, dan skenario tidak layak ditolak'),
           ('A5', 'Perbandingan skema', 'proyeksi model, simulasi pertama, dan ringkasan 30 simulasi dipisahkan'),
           ('A6', 'Uji ketahanan', 'keunggulan atas merata ketika kurva evaluasi berbeda dari asumsi'),
           ('A7', 'Transisi kuota', 'lintasan lima tahun dengan batas penurunan 10% per tahun'),
           ('A8', 'Lembar usulan', 'kuota, versi, kode hash, dan kolom peninjau untuk keputusan manusia'),
           ('B1', 'Ringkasan daerah', 'dinas membandingkan pembagian merata, usulan langsung, dan transisi tahun pertama'),
           ('B2', 'Penjelasan risiko', 'faktor risiko dan wilayah serupa untuk memeriksa alasan usulan'),
           ('B3', 'Koreksi data', '*mockup* formulir koreksi yang belum mengirim permohonan'),
           ('B4', 'Laporan realisasi', '*mockup* rekap agregat tanpa unggahan dan tanpa data siswa'),
           ('C1', 'Paket data semester', '*mockup* validasi wilayah dan paket data sebelum model dipakai'),
           ('C2', 'Kalibrasi model', '*mockup* tinjauan residual ekstrem dan asumsi kecepatan manfaat'),
           ('C3', 'Audit dan anomali', '*mockup* antrean pengecualian dan kebutuhan log perubahan'),
           ('L1', 'Identitas visual', 'logo, palet, dan tipografi yang konsisten'),
           ('L2', 'Arsitektur dan data', 'asal data, mesin analitik, paket berversi, dan antarmuka'),
           ('L3', 'Rencana uji coba', 'tahapan pilot yang memisahkan target dari capaian')]


def gallery(doc, prefix, counter):
    for key, title, desc in GALLERY:
        im = Image.open(ROOT / 'edushield/lampiran' / f'{key}.png').convert('RGB')
        im = im.crop((0, 0, im.width, min(im.height, int(im.width * 0.58))))
        path = HERE / 'figures' / f'screen_{key}.png'; im.save(path)
        counter[0] += 1
        figure(doc, path, f'{prefix}.{counter[0]}', f'Layar {key}, {title}: {desc}', width=13.0)


# ---------------------------------------------------------------- document
def logo_bytes():
    Image.MAX_IMAGE_PIXELS = None                      # the official logo is 15625 px square
    im = Image.open(LOGO).convert('RGB'); im.thumbnail((1000, 1000), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return buf.getvalue()


def base():
    doc = Document(TEMPLATE)
    ps = doc.paragraphs
    assert ps[4].text.strip() == 'JUDUL ESAI' and 'w:drawing' in ps[6]._p.xml, 'template layout changed'

    def set_run(p, text):
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ''
    set_run(ps[2], f"Subtema: {IDENT['subtema']}")
    set_run(ps[4], IDENT['judul'].upper())
    set_run(ps[8], f"Disusun oleh Tim {IDENT['tim']}:")
    set_run(ps[9], IDENT['anggota'][0])
    set_run(ps[10], '\n'.join(IDENT['anggota'][1:]))
    set_run(ps[11], IDENT['nomor'])
    set_run(ps[13], f"\n{IDENT['institusi'].upper()}\n{IDENT['kota'].upper()}\n2026")
    for br in list(ps[13]._p.iter(qn('w:br'))):
        if br.get(qn('w:type')) == 'page':
            br.getparent().remove(br)
    rid = ps[6]._p.xpath('.//a:blip/@r:embed')[0]
    doc.part.related_parts[rid]._blob = logo_bytes()
    for ext in ps[6]._p.xpath('.//wp:extent | .//a:ext'):   # 9 cm logo does not fit A4 with 3 cm margins
        ext.set('cx', str(Cm(6.2))); ext.set('cy', str(Cm(6.2)))
    ps[12]._p.getparent().remove(ps[12]._p)            # spacer; the institution block already opens with a blank line
    # Drop the template's sample body; keep the cover and the final section properties.
    body = doc._element.body
    children = list(body)
    for el in children[children.index(ps[13]._p) + 1:]:
        if el.tag != qn('w:sectPr'):
            body.remove(el)
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin, sec.right_margin, sec.top_margin, sec.bottom_margin = Cm(4), Cm(3), Cm(3), Cm(3)
    # Cover becomes its own section (no page number); the body restarts numbering at 1.
    cover_sect = deepcopy(sec._sectPr)
    for ref in cover_sect.findall(qn('w:headerReference')) + cover_sect.findall(qn('w:footerReference')):
        cover_sect.remove(ref)
    ps[13]._p.get_or_add_pPr().append(cover_sect)
    body_sec = doc.sections[1]
    num = OxmlElement('w:pgNumType'); num.set(qn('w:start'), '1'); body_sec._sectPr.find(qn('w:pgMar')).addnext(num)
    body_sec.footer.is_linked_to_previous = False
    fp = body_sec.footer.paragraphs[0]; fp.clear(); fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE')
    r = OxmlElement('w:r'); rpr = OxmlElement('w:rPr'); rf = OxmlElement('w:rFonts')
    rf.set(qn('w:ascii'), 'Times New Roman'); rf.set(qn('w:hAnsi'), 'Times New Roman'); rpr.append(rf)
    t = OxmlElement('w:t'); t.text = '1'; r.append(rpr); r.append(t); fld.append(r); fp._p.append(fld)
    normal = doc.styles['Normal']; normal.font.name = 'Times New Roman'; normal.font.size = Pt(12)
    return doc


def render(doc, text, appendix=False):
    fig_n, tab_n, lamp = [0], [0], None
    for line in (l.strip() for l in text.splitlines()):
        if not line:
            continue
        if line.startswith('# '):
            top, title = line[2:].split('|'); chapter(doc, top, title)
        elif line.startswith('## '):
            subbab(doc, line[3:])
            if appendix:
                lamp = re.match(r'Lampiran (\d+)', line[3:]).group(1); fig_n[0] = tab_n[0] = 0
        elif line.startswith('[FIG '):
            name, cap = line[5:-1].split('|', 1); fig_n[0] += 1
            figure(doc, HERE / 'figures' / f'{name}.png', f'L{lamp}.{fig_n[0]}' if appendix else fig_n[0], cap)
        elif line.startswith('[TABLE '):
            key, cap = line[7:-1].split('|', 1); tab_n[0] += 1
            body_table(doc, key, f'L{lamp}.{tab_n[0]}' if appendix else tab_n[0], cap)
        elif line.startswith('[EQ '):
            latex, label = line[4:-1].rsplit('|', 1); equation(doc, latex, label)
        elif line == '[GALLERY]':
            gallery(doc, f'L{lamp}', fig_n)
        else:
            p = para(doc, line)
            prev = p._p.getprevious()
            if prev is not None and prev.tag == qn('w:tbl'):   # gap after a table without an empty spacer paragraph
                p.paragraph_format.space_before = Pt(12)
    return fig_n[0], tab_n[0]


def references(doc):
    chapter(doc, 'DAFTAR PUSTAKA')
    for i, k in enumerate(USED, 1):
        title, url = REFS[k]
        p = fmt(runs(doc.add_paragraph(), f'[{i}]\t{title} [Daring]. Tersedia: {url}. Diakses: 30 Oktober 2026.'),
                WD_ALIGN_PARAGRAPH.LEFT, 6, spacing=1.0)
        p.paragraph_format.left_indent = Cm(1); p.paragraph_format.first_line_indent = Cm(-1)
        p.paragraph_format.tab_stops.add_tab_stop(Cm(1))


def originality():
    d = Document(ORIGINALITY)
    edits = {4: 'nama ketua tim\t: [isi nama ketua tim]', 5: f"nama tim\t\t: {IDENT['tim']}",
             6: f"asal institusi\t\t: {IDENT['institusi']}", 7: f"subtema esai\t\t: {IDENT['subtema']}",
             9: f'Dengan ini, saya menyatakan bahwa karya kami dengan judul “{IDENT["judul"]}” yang kami ajukan pada '
                'University Essay Competition LOGIKA UI 2026 sebagai berikut:',
             18: f"{IDENT['kota']}, [tanggal penandatanganan] 2026", 22: '[Nama Ketua Tim]'}
    for i, text in edits.items():
        d.paragraphs[i].text = text
    for i in [25, 24, 23]:                             # template note and spacers would push a second page
        p = d.paragraphs[i]._element; p.getparent().remove(p)
    out = OUT / f'{STEM}_LembarOrisinalitas_BELUM_DITANDATANGANI.docx'; d.save(out); return out


def render_word(paths):
    """Convert with the Word-compatible app registered on this machine (WPS here); same DOCX, no second source."""
    import win32com.client
    for path in paths:
        word = win32com.client.DispatchEx('Word.Application'); word.Visible = False; word.DisplayAlerts = 0
        documents = word.Documents; documents._FlagAsMethod('Open'); word._FlagAsMethod('Quit')
        try:
            doc = documents.Open(str(path.resolve()), False, True); doc._FlagAsMethod('ExportAsFixedFormat', 'Close')
            try:
                doc.ExportAsFixedFormat(str(path.with_suffix('.pdf').resolve()), 17)
            finally:
                try:
                    doc.Close(False)
                except Exception:
                    pass
        finally:
            try:
                word.Quit()
            except Exception:
                pass


def check_pdf(path, n_fig, n_tab):
    import pymupdf
    pdf = pymupdf.open(path); texts = [p.get_text() for p in pdf]
    start = next(i for i, t in enumerate(texts) if 'PENDAHULUAN' in t)
    end = next(i for i, t in enumerate(texts) if 'DAFTAR PUSTAKA' in t)
    body = end - start
    for p in OUT.glob('preview_*.png'):
        p.unlink()
    for i, page in enumerate(pdf):
        page.get_pixmap(dpi=80).save(str(OUT / f'preview_{i + 1:02}.png'))
    report = {'pages_total': len(pdf), 'body_pages': body, 'body_pdf_pages': [start + 1, end], 'figures_body': n_fig,
              'tables_body': n_tab, 'equations_body': 0, 'references': len(USED), 'identity': IDENT,
              'turnitin': 'not run; no access', 'originality': 'template filled, ketua tim and signature pending',
              'rendered_from': 'same DOCX via registered Word-compatible Office (WPS)'}
    (OUT / 'qa_report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf8')
    print(json.dumps(report, indent=2, ensure_ascii=False))
    assert start == 1, 'cover must fit on one page'
    assert body <= 10, f'body has {body} pages (max 10)'
    for i, page in enumerate(pdf):
        assert len(re.sub(r'\s|\d', '', texts[i])) > 20 or page.get_images(), f'blank page {i + 1}'
    assert '{{' not in '\n'.join(texts) and 'Lorem ipsum' not in '\n'.join(texts)
    assert '—' not in '\n'.join(texts[start:end]), 'em dash in body'


def build():
    figures.build()
    body = (HERE / 'content.md').read_text(encoding='utf8'); lamp = (HERE / 'lampiran.md').read_text(encoding='utf8')
    for name, text in [('content.md', body), ('lampiran.md', lamp)]:
        checks.check_source(name, text, NUM)
    for k, v in NUM.items():
        body = body.replace('{{' + k + '}}', v); lamp = lamp.replace('{{' + k + '}}', v)
    body = re.sub(r'\[\[(\w+)\]\]', cite, body); lamp = re.sub(r'\[\[(\w+)\]\]', cite, lamp)
    assert set(USED) == set(REFS), f'uncited or unknown references: {set(REFS) ^ set(USED)}'
    checks.check_crossrefs(body)
    (ROOT / 'edushield/angka.json').write_text(json.dumps({k: {'formatted': v, 'origin': 'summary/gap_followup/stress_followup/browser_report.json or BPS CSV'}
                                                           for k, v in NUM.items()}, indent=2, ensure_ascii=False), encoding='utf8')
    doc = base()
    n_fig, n_tab = render(doc, body)
    references(doc)
    chapter(doc, 'LAMPIRAN')
    render(doc, lamp, appendix=True)
    name = OUT / f'{STEM}_Esai.docx'; doc.save(name)
    (OUT / 'esai_terbaca.md').write_text(body + '\n\n# DAFTAR PUSTAKA\n' + '\n'.join(f'[{i}] {REFS[k][0]} {REFS[k][1]}' for i, k in enumerate(USED, 1)),
                                         encoding='utf8')
    (HERE / 'references' / 'pustaka_ieee.json').write_text(json.dumps({str(i): {'key': k, 'title': REFS[k][0], 'url': REFS[k][1], 'accessed': '2026-10-30'}
                                                                       for i, k in enumerate(USED, 1)}, indent=2, ensure_ascii=False), encoding='utf8')
    oname = originality()
    render_word([name, oname])
    check_pdf(name.with_suffix('.pdf'), n_fig, n_tab)


if __name__ == '__main__':
    build()
