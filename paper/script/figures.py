"""All essay figures, generated from the project's JSON/CSV. One function per figure; build() runs them all.

Body figures carry no equations: the mathematics is shown visually, formulas live in the appendix.
Every figure built from simulated outcomes gets a 'DATA SIMULASI' stamp; figures from BPS tables do not.
"""
import csv
import json
from pathlib import Path
import numpy as np
import matplotlib
import matplotlib.ticker
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / 'figures'
OUT.mkdir(exist_ok=True)
RES = ROOT / 'edushield/results'
D = json.loads((ROOT / 'edushield/app/app_data.json').read_text(encoding='utf8'))
S = json.loads((RES / 'summary.json').read_text(encoding='utf8'))
GAP = json.loads((RES / 'gap_followup.json').read_text(encoding='utf8'))
STRESS = json.loads((RES / 'stress_followup.json').read_text(encoding='utf8'))

plt.rcParams.update({'font.family': 'Arial', 'font.size': 9, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.titlesize': 9.5, 'axes.titleweight': 'bold', 'axes.titlelocation': 'left',
                     'axes.edgecolor': '#555', 'xtick.color': '#333', 'ytick.color': '#333', 'legend.frameon': False})
GREEN, BLUE, INK, AMBER, RED, GREY = '#086558', '#235a91', '#172e3a', '#b07a1e', '#b23a48', '#9aa5ad'
W = 6.3  # inches; inserted at 14 cm, the text width between 4 cm and 3 cm margins
NUM = lambda x, n=1: f'{x:.{n}f}'.replace('.', ',')


def overlaps(fig):
    """Return pairs of visible text labels whose boxes intersect (shrunk 1 px to ignore touching)."""
    fig.canvas.draw()
    r = fig.canvas.get_renderer()
    boxes = []
    for t in fig.findobj(matplotlib.text.Text):
        if t.get_visible() and t.get_text().strip() and t.get_alpha() != 0:
            b = matplotlib.text.Text.get_window_extent(t, r)  # text box only, not an annotation's arrow
            if b.width > 0 and b.height > 0:
                boxes.append((t.get_text(), b.x0 + 1, b.y0 + 1, b.x1 - 1, b.y1 - 1))
    bad = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            if a[1] < b[3] and b[1] < a[3] and a[2] < b[4] and b[2] < a[4]:
                bad.append((a[0], b[0]))
    return bad


def save(fig, name, sim=True):
    if sim:
        fig.text(0.995, -0.01, 'DATA SIMULASI', ha='right', va='top', fontsize=7, color=AMBER, weight='bold')  # below axes labels
    bad = overlaps(fig)
    assert not bad, f'{name}: overlapping labels {bad[:4]}'
    fig.savefig(OUT / f'{name}.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)


def read_csv(name):
    with open(ROOT / 'edushield/data/raw' / name, encoding='utf8') as fh:
        return list(csv.DictReader(line for line in fh if not line.startswith('#')))


def fig01_urgensi():
    aps = read_csv('bps_aps_provinsi_2025.csv')
    nat = next(r for r in aps if r['provinsi'] == 'INDONESIA')
    prov = sorted((r for r in aps if r['provinsi'] != 'INDONESIA'), key=lambda r: float(r['aps_16_18']))
    q = read_csv('bps_ats_kuintil_2023.csv')
    fig, ax = plt.subplots(1, 3, figsize=(W, 2.15), layout='constrained', gridspec_kw={'width_ratios': [1.05, 2.3, 1.25]})
    ages = ['7–12', '13–15', '16–18']
    vals = [float(nat['aps_7_12']), float(nat['aps_13_15']), float(nat['aps_16_18'])]
    ax[0].bar(ages, vals, color=[GREY, GREY, RED], width=0.65)
    for i, v in enumerate(vals):
        ax[0].text(i, v + 1.5, NUM(v, 1), ha='center', fontsize=8)
    ax[0].set(ylim=(0, 112), ylabel='APS 2025 (%)', title='(a) Nasional', xlabel='Kelompok umur')
    y = [float(r['aps_16_18']) for r in prov]
    col = [RED if v < 60 else (GREEN if v > 90 else BLUE) for v in y]
    ax[1].bar(range(len(y)), y, color=col, width=0.8)
    ax[1].axhline(float(nat['aps_16_18']), ls='--', lw=0.9, color=INK)
    ax[1].text(3.0, float(nat['aps_16_18']) + 2.5, f"Indonesia {NUM(float(nat['aps_16_18']), 2)}", fontsize=7.5, color=INK)
    ax[1].annotate(f'Papua Tengah {NUM(y[0], 1)}', (0, y[0]), xytext=(-0.4, 97), fontsize=7, color=RED,
                   arrowprops=dict(arrowstyle='->', color=RED, lw=0.8, relpos=(0, 0)))  # vertical arrow, clear of labels
    ax[1].text(len(y) - 1, y[-1] + 2, 'DIY', ha='center', fontsize=7, color=GREEN)
    ax[1].set(xticks=[], ylim=(0, 108), ylabel='APS umur 16–18 (%)', xlabel='38 provinsi, terendah ke tertinggi',
              title='(b) Ketimpangan antarprovinsi')
    k = [float(r['sma']) for r in q]
    ax[2].bar(['K1', 'K2', 'K3', 'K4', 'K5'], k, color=[RED, BLUE, BLUE, BLUE, GREEN], width=0.65)
    for i, v in enumerate(k):
        ax[2].text(i, v + 0.8, NUM(v, 1), ha='center', fontsize=7.5)
    ax[2].set(ylim=(0, 36), ylabel='ATS usia SMA (%)', xlabel='Kuintil pengeluaran', title='(c) Kemiskinan')
    save(fig, 'fig01_urgensi', sim=False)


def fig02_bejana():
    fig, ax = plt.subplots(1, 2, figsize=(W, 2.3), layout='constrained', gridspec_kw={'width_ratios': [1.15, 1]})
    a = ax[0]
    bottoms = [0.0, 0.5, 1.1, 1.7, 2.6, 3.3]          # deeper vessel = higher predicted risk
    level, top, floor, cap = 2.35, 4.2, 0.35, 1.85
    for i, b in enumerate(bottoms):
        x = i * 1.25
        fill = cap if i == 0 else max(level, b + floor)
        a.add_patch(Rectangle((x, b), 0.95, fill - b, color='#8fc3b8', zorder=1))
        a.add_patch(Rectangle((x, b), 0.95, top - b, fill=False, lw=1.1, ec=INK, zorder=3))
        if i == 0:
            a.plot([x, x + 0.95], [cap] * 2, color=RED, lw=1.6, zorder=4)
        if level < b + floor:
            a.plot([x, x + 0.95], [b + floor] * 2, color=AMBER, lw=1.6, zorder=4)
    a.plot([1.2, 6.1], [level] * 2, ls='--', color=BLUE, lw=1, zorder=5)
    a.text(6.35, 1.75, 'tinggi air =\nharga bayangan', va='center', fontsize=7.5, color=BLUE)
    a.annotate('batas atas 95%', (0.47, cap), xytext=(-0.2, 4.75), fontsize=7, color=RED,
               arrowprops=dict(arrowstyle='->', color=RED, lw=0.8))
    a.annotate('lantai 20%', (7.2, 3.3 + floor), xytext=(7.6, 2.95), fontsize=7, color=AMBER,
               arrowprops=dict(arrowstyle='->', color=AMBER, lw=0.8, relpos=(0, 0.5)))
    a.text(0.47, -0.2, 'risiko\ntinggi', ha='center', va='top', fontsize=7.5)
    a.text(6.72, 4.35, 'risiko\nrendah', ha='center', va='bottom', fontsize=7.5)
    a.set(xlim=(-0.3, 9.4), ylim=(-1.2, 5.1), title='(a) Analogi mengisi bejana')
    a.axis('off')
    b = ax[1]
    k = D['kab']
    lam = S['harga_bayangan_per_miliar']['1.74']
    t = np.linspace(0.2, 0.95, 120)
    picks = [('Supiori', RED), ('Brebes', BLUE), ('Garut', GREEN), ('Kota Surabaya', AMBER)]
    for name, colr in picks:
        d = next(d for d in k if d['nama'] == name)
        mb = 1.74 * d['r_hat'] * np.exp(-1.74 * t) / 1.8 * 1000
        b.plot(t * 100, mb, color=colr, lw=1.3, label=name)
        cov = d['x']['edushield'] / d['V']
        b.plot(cov * 100, 1.74 * d['r_hat'] * np.exp(-1.74 * cov) / 1.8 * 1000, 'o', ms=4, color=colr)
    b.axhline(lam, ls='--', color=INK, lw=0.9)
    b.text(94, lam * 1.15, f'harga bayangan {NUM(lam, 2)}', fontsize=7.5, color=INK, ha='right', va='bottom')
    b.set_yscale('log')
    b.set_yticks([2, 5, 10, 20, 50, 100, 200])
    b.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f'{v:g}'))
    b.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
    b.set(xlabel='Cakupan kuota wilayah (%)', ylabel='Siswa tertahan per Rp1 miliar', title='(b) Manfaat marjinal')
    b.legend(fontsize=7, loc='upper right', ncol=2)
    b.set_ylim(top=b.get_ylim()[1] * 4)
    save(fig, 'fig02_bejana')


def fig03_alur():
    fig, ax = plt.subplots(figsize=(W, 1.7))
    ax.set(xlim=(0, 101), ylim=(0, 32))
    ax.axis('off')
    steps = [('Data agregat', 'Kemiskinan BPS,\npenduduk 15–19,\n514 kab/kota', GREY),
             ('Prediksi risiko', 'GLM, diuji pada\nprovinsi yang\ndisembunyikan', BLUE),
             ('Alokasi kuota', 'Imbal hasil\nmenurun, pagu tetap,\nbatas 20–95%', GREEN),
             ('Transisi', 'Penurunan kuota\nmaks. 10% per\ntahun', GREEN),
             ('Keputusan', 'Dasbor, lembar\nusulan, ditetapkan\npejabat', INK)]
    w, gap = 17.2, 3.4
    for i, (head, body, colr) in enumerate(steps):
        x = 0.5 + i * (w + gap)
        ax.add_patch(FancyBboxPatch((x, 8), w, 19, boxstyle='round,pad=0.3,rounding_size=1.5', fc='white', ec=colr, lw=1.4))
        ax.add_patch(Rectangle((x, 21.5), w, 5.5, color=colr))
        ax.text(x + w / 2, 24.2, head, ha='center', va='center', color='white', fontsize=8, weight='bold')
        ax.text(x + w / 2, 14.5, body, ha='center', va='center', fontsize=6.6, linespacing=1.25)
        if i < 4:
            ax.annotate('', xy=(x + w + gap - 0.2, 17), xytext=(x + w + 0.3, 17),
                        arrowprops=dict(arrowstyle='-|>', color=INK, lw=1))
    ax.plot([91.3, 91.3, 9.1], [7.4, 4.6, 4.6], color=AMBER, lw=1.1)   # feedback loop routed under the boxes
    ax.annotate('', xy=(9.1, 7.6), xytext=(9.1, 4.6), arrowprops=dict(arrowstyle='-|>', color=AMBER, lw=1.1))
    ax.text(50, 0.6, 'Kalibrasi semesteran: realisasi dan koreksi daerah memperbarui data dan model', ha='center',
            fontsize=7.5, color=AMBER, style='italic')
    for x, lab in [(19.5, 'CERDAS'), (50, 'ADAPTIF'), (80.6, 'BERKELANJUTAN')]:
        ax.text(x, 30.3, lab, ha='center', fontsize=7, color=GREEN, weight='bold')
    save(fig, 'fig03_alur', sim=False)


def fig04_prediksi():
    k = D['kab']
    fig, ax = plt.subplots(figsize=(W, 2.35), layout='constrained')
    red = np.array([d['r_sim'] for d in k]) > 0.025
    x = np.array([100 * d['r_sim'] for d in k]); y = np.array([100 * d['r_hat'] for d in k])
    ax.scatter(x[~red], y[~red], s=9, alpha=.55, color=BLUE, label='Di bawah rerata', lw=0)
    ax.scatter(x[red], y[red], s=9, alpha=.65, color=RED, label='Zona Merah', lw=0)
    ax.plot([0, 40], [0, 40], ls='--', color='#555', lw=0.8)
    ax.text(31, 33.5, 'prediksi = laju benar', fontsize=7.5, color='#555', rotation=20)
    sup = next(d for d in k if d['nama'] == 'Supiori')
    ax.annotate('Supiori: risiko ekstrem\ndiremehkan', (100 * sup['r_sim'], 100 * sup['r_hat']), xytext=(22, 7),
                arrowprops={'arrowstyle': '->', 'color': INK}, fontsize=7.5)
    ax.set(xlabel='Laju putus sekolah benar (%)', ylabel='Prediksi lintas provinsi (%)', xlim=(0, 40), ylim=(0, 40))
    ax.legend(fontsize=7.5, loc='upper left')
    save(fig, 'fig04_prediksi')


def fig05_skema():
    g = GAP['gap_closed_pct']
    names = [('Peringkat kemiskinan', 'Kemiskinan'), ('Greedy (risiko tertinggi)', 'Greedy'),
             ('Proporsional risiko', 'Proporsional'), ('EduShield (KKT)', 'KKT')]
    fig, ax = plt.subplots(1, 2, figsize=(W, 2.2), layout='constrained', gridspec_kw={'width_ratios': [1.2, 1]})
    a = ax[0]
    v = np.array([g[n]['median'] for n, _ in names]); lo = np.array([g[n]['p5'] for n, _ in names]); hi = np.array([g[n]['p95'] for n, _ in names])
    y = np.arange(len(names))
    a.barh(y, v, color=[GREY, GREY, BLUE, GREEN], height=0.6)
    a.errorbar(v, y, xerr=[v - lo, hi - v], fmt='none', ecolor=INK, capsize=2.5, lw=0.8)
    for i, val in enumerate(v):
        a.text(hi[i] + 2, i, NUM(val, 1) + '%', va='center', fontsize=7.5)
    a.set(yticks=y, yticklabels=[s for _, s in names], xlim=(-8, 112), xlabel='Celah merata–oracle yang tertutup (%)',
          title='(a) Seberapa dekat ke optimum')
    a.axvline(0, color='#555', lw=0.7); a.axvline(100, color='#555', lw=0.7, ls=':')
    a.text(99, -0.55, 'oracle', ha='right', fontsize=7, color='#555')
    a.invert_yaxis()
    b = ax[1]
    al = S['alokasi']
    pts = [('Merata', 'Merata', GREY), ('Peringkat kemiskinan', 'Kemiskinan', GREY), ('Greedy (risiko tertinggi)', 'Greedy', AMBER),
           ('Proporsional risiko', 'Proporsional', BLUE), ('EduShield (KKT)', 'KKT', GREEN)]
    offs = {'Merata': (1.5, 0, 'left'), 'Kemiskinan': (-1.5, 0, 'right'), 'Greedy': (-1.5, 0, 'right'),
            'Proporsional': (-1.5, 0.35, 'right'), 'KKT': (1.5, -0.45, 'left')}
    for key, lab, colr in pts:
        xx, yy = al[key]['cakupan_merah_pct'], al[key]['gain_vs_merata_pct']
        b.plot(xx, yy, 'o', color=colr, ms=6)
        dx, dy, ha = offs[lab]
        b.text(xx + dx, yy + dy, lab, fontsize=7.5, ha=ha, va='center')
    b.set(xlabel='Kuota yang menjangkau Zona Merah (%)', ylabel='Keunggulan atas merata (%)', xlim=(50, 95), ylim=(-2, 11),
          title='(b) Menjangkau tidak sama dengan menahan')
    save(fig, 'fig05_skema')


def fig06_ketahanan():
    reg = S['mc_regret']
    rows = [('Kurva κ=0,8', 'exp k=0.8'), ('Kurva κ=1,74 (asumsi)', 'exp k=1.74'), ('Kurva κ=3', 'exp k=3.0'),
            ('Kurva akar', 'pangkat (gamma=0,5)'), ('Kurva logaritmik', 'logaritmik'), ('κ beragam per wilayah', 'exp kappa_i heterogen')]
    data = [(lab, reg[f'KKT k_opt=1.74|{k}']['median'], reg[f'Proporsional risiko|{k}']['median']) for lab, k in rows]
    sv = STRESS['sensitivity_V']
    vrows = [('V acak ±25%', 'galat lognormal sigma=0,25'), ('V terpencil +25%', 'kebutuhan terpencil 25% lebih tinggi'),
             ('V terpencil −25%', 'kebutuhan terpencil 25% lebih rendah'), ('V gugus + wilayah', 'galat berbeda gugus dan wilayah')]
    data += [(lab, sv[k]['EduShield (KKT)']['median'], sv[k]['Proporsional risiko']['median']) for lab, k in vrows]
    fig, ax = plt.subplots(figsize=(W, 2.15), layout='constrained')
    y = np.arange(len(data))
    for i, (lab, kk, pp) in enumerate(data):
        ax.plot([kk, pp], [i, i], color='#c5ccd1', lw=2.2, zorder=1)
    ax.scatter([d[1] for d in data], y, color=GREEN, s=22, zorder=2, label='KKT')
    ax.scatter([d[2] for d in data], y, color=BLUE, s=22, zorder=2, marker='D', label='Proporsional')
    ax.set(yticks=y, yticklabels=[d[0] for d in data], xlabel='Median keunggulan atas merata, 30 simulasi (%)', xlim=(0, 16))
    ax.axhline(5.5, color='#ddd', lw=0.8)
    for yy, lab in [(0, 'kurva manfaat salah'), (6, 'kebutuhan V salah ukur')]:
        ax.text(0.15, yy, lab, ha='left', va='center', fontsize=7.5, color='#555', style='italic')
    ax.invert_yaxis()
    ax.legend(loc='lower center', bbox_to_anchor=(0.5, 1.0), ncol=2, fontsize=7.5)
    save(fig, 'fig06_ketahanan')


def fig07_transisi():
    k = D['kab']
    # Same-risk districts share identical paths, so one representative each: with vs without the 10% floor.
    fig, ax = plt.subplots(figsize=(W, 1.75), layout='constrained')
    for n, colr, lab in [('Sumba Tengah', GREEN, 'Sumba Tengah (risiko tinggi)'), ('Kota Surabaya', RED, 'Kota Surabaya (risiko rendah)')]:
        d = next(d for d in k if d['nama'] == n); v = d['V']
        start = 100 * d['x']['merata'] / v
        ax.plot(range(6), [start] + [100 * x / v for x in d['hh']], marker='o', ms=3.5, color=colr, lw=1.4, label=f'{lab}, bertahap')
        ax.plot(range(6), [start] + [100 * d['x']['edushield'] / v] * 5, ls='--', color=colr, lw=1, alpha=.7, label=f'{lab}, langsung')
    ax.axhline(95, ls=':', color='#777', lw=0.8); ax.axhline(20, ls=':', color='#777', lw=0.8)
    ax.set(xlabel='Tahun (0 = pembagian merata saat ini)', ylabel='Cakupan kuota (%)', ylim=(0, 105), xticks=range(6))
    ax.legend(fontsize=7, ncol=2, loc='lower center', bbox_to_anchor=(0.5, 1.0))
    save(fig, 'fig07_transisi')


def fig08_aplikasi():
    keys = [('A2', 'Radar risiko'), ('A4', 'Simulator kuota'), ('A3', 'Profil wilayah'), ('A7', 'Transisi kuota')]
    tiles = []
    for key, _ in keys:
        im = Image.open(ROOT / 'edushield/lampiran' / f'{key}.png').convert('RGB')
        tiles.append(im.crop((0, 0, im.width, int(im.width * 0.6))))   # full width: layout-agnostic, keeps the top ribbon
    fig, ax = plt.subplots(2, 2, figsize=(W, 3.3), layout='constrained')
    for a, im, (key, title), tag in zip(ax.flat, tiles, keys, 'abcd'):
        a.imshow(im)
        a.set_xticks([]); a.set_yticks([])
        for s in a.spines.values():
            s.set_visible(True); s.set_color('#9aa5ad'); s.set_linewidth(0.8)
        a.set_title(f'({tag}) {title}', fontsize=8.5)
    save(fig, 'fig08_aplikasi')


def lamp_marginal():
    k = D['kab']
    fig, ax = plt.subplots(figsize=(W, 2.4), layout='constrained')
    t = np.linspace(.2, .95, 100)
    for n in ['Sumba Tengah', 'Nduga', 'Kota Yogyakarta', 'Kota Surabaya', 'Supiori']:
        d = next(d for d in k if d['nama'] == n)
        ax.plot(t * 100, 1.74 * d['r_hat'] * np.exp(-1.74 * t) / 1.8 * 1000, label=n)
    ax.axhline(S['harga_bayangan_per_miliar']['1.74'], ls='--', color=INK, label='λ* nasional')
    ax.set_yscale('log')
    ax.set_yticks([2, 5, 10, 20, 50, 100, 200])
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f'{v:g}'))
    ax.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
    ax.set(xlabel='Cakupan kuota (%)', ylabel='Manfaat marjinal per Rp1 miliar')
    ax.legend(fontsize=7, ncol=3)
    save(fig, 'lamp_marginal')


def lamp_robustness():
    ts = ['exp k=0.8', 'exp k=1.74', 'exp k=3.0', 'pangkat (gamma=0,5)', 'logaritmik', 'exp kappa_i heterogen']
    ks = ['0.8', '1.74', '3.0']
    a = np.array([[S['mc_regret'][f'KKT k_opt={ko}|{t}']['median'] for t in ts] for ko in ks])
    fig, ax = plt.subplots(figsize=(W, 2.2), layout='constrained')
    ax.imshow(a, cmap='YlGnBu', vmin=-1, vmax=15, aspect='auto')
    ax.set(xticks=range(6), xticklabels=['exp 0,8', 'exp 1,74', 'exp 3', 'akar', 'log', 'κ beragam'], yticks=range(3),
           yticklabels=['0,8', '1,74', '3'], xlabel='Kurva evaluasi', ylabel='κ optimasi')
    for i in range(3):
        for j in range(6):
            ax.text(j, i, NUM(a[i, j], 2) + '%', ha='center', va='center', color='white' if a[i, j] > 9 else INK, fontsize=8)
    save(fig, 'lamp_robustness')


def build():
    for f in [fig01_urgensi, fig02_bejana, fig03_alur, fig04_prediksi, fig05_skema, fig06_ketahanan, fig07_transisi,
              fig08_aplikasi, lamp_marginal, lamp_robustness]:
        f()


if __name__ == '__main__':
    build()
