"""Browser acceptance checks, appendix screenshots, print-ready decision artifact."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).parent
OUT=ROOT/'lampiran'
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel='chrome')
    page=browser.new_page(viewport={'width':1500,'height':1050},device_scale_factor=1.5)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto((ROOT/'app'/'index.html').resolve().as_uri())
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('h1')
    initial_ms=page.evaluate('performance.now()')
    # Three Python references executed in the browser, not merely Node.
    fixtures=json.loads((ROOT/'app'/'solver_fixtures.json').read_text())
    parity=page.evaluate('''fixtures=>{const D=EDUSHIELD_DATA,S=EduSolver,p=D.meta.params,V=D.kab.map(d=>d.V),r=D.kab.map(d=>d.r_hat),c=V.map(()=>p.C0);return fixtures.map(f=>{const t=performance.now(),a=S.kkt(V,r,c,f.B,V.map(v=>v*p.alpha),V.map(v=>v*p.beta),p.kappa),ms=performance.now()-t,err=Math.max(...a.x.map((v,i)=>Math.abs(v-f.x[i])/Math.max(1,f.x[i])));console.assert(err<1e-6);return {share:f.share,max_relative_error:err,solve_ms:ms,budget_error:S.dot(c,a.x)-f.B};});}''',fixtures)
    assert all(c['max_relative_error']<1e-6 and c['solve_ms']<100 for c in parity)
    routes=['A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','C1','C2','C3','L1','L2','L3']
    for route in routes:
        page.evaluate('(r)=>location.hash=r',route)
        page.wait_for_function('(r)=>document.querySelector("#breadcrumb").textContent.includes(({A1:"Ringkasan nasional",A2:"Radar risiko",A3:"Profil wilayah",A4:"Simulator kuota",A5:"Perbandingan skema",A6:"Uji ketahanan",A7:"Transisi kuota",A8:"Lembar usulan",B1:"Ringkasan daerah",B2:"Penjelasan risiko",B3:"Koreksi data",B4:"Laporan realisasi",C1:"Paket data semester",C2:"Kalibrasi model",C3:"Audit & anomali",L1:"Identitas visual",L2:"Arsitektur & data",L3:"Rencana uji coba"})[r])',arg=route)
        assert page.locator('.simulation').is_visible()
        assert page.locator('h1').count()==1
        assert not any(m in page.inner_text('body') for m in ('â€','Ã','Â·','Î±')),f'mojibake on {route}'  # double-encoded UTF-8 guard
        page.evaluate('document.activeElement.blur();window.scrollTo(0,0)')
        page.screenshot(path=str(OUT/f'{route}.png'),full_page=True)
    # Exercise inputs and dependent outputs.
    page.evaluate('location.hash="A4"')
    page.wait_for_selector('#share')
    old=page.evaluate('EduApp.result.B')
    page.locator('#share').fill('0.3')
    assert page.evaluate('EduApp.params.share')==.3
    assert page.evaluate('EduApp.result.B')<old
    page.locator('#alpha').fill('0.5')
    assert page.locator('#scenario-error').inner_text()
    assert page.evaluate('EduApp.params.alpha')==.2
    page.locator('#reset').click()
    page.locator('#search').fill('Sumba')
    assert page.locator('tbody tr').count()==page.evaluate('EDUSHIELD_DATA.kab.filter(d=>d.nama.toLowerCase().includes("sumba")).length')
    page.locator('[data-district]').first.click()
    page.wait_for_selector('#district')
    page.evaluate('location.hash="A8"')
    page.wait_for_selector('#csv')
    with page.expect_download() as dl:
        page.locator('#csv').click()
    dl.value.save_as(str(OUT/'EduShield_usulan_simulasi.csv'))
    page.locator('#reviewer').fill('Pratinjau prototype — belum disahkan')
    page.pdf(path=str(OUT/'EduShield_Lembar_Usulan.pdf'),format='A4',landscape=True,print_background=True,display_header_footer=True,header_template='<div style="font-size:8px;width:100%;text-align:center">DATA SIMULASI — USULAN EDU SHIELD</div>',footer_template='<div style="font-size:8px;width:100%;text-align:center">DATA SIMULASI — halaman <span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin={'top':'15mm','bottom':'15mm','left':'12mm','right':'12mm'})
    # Mobile layout and keyboard reachability.
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('location.hash="B1"')
    page.wait_for_selector('#district')
    page.screenshot(path=str(OUT/'B1_mobile.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement!==document.body')
    assert not errors,errors
    report={'status':'PASS','browser':'Chromium headless','routes':len(routes),'browser_solver':parity,'initial_local_load_ms':initial_ms,'mobile_width':390,'page_errors':errors,'interactions':['pagu recomputed','infeasible bounds rejected','reset','search','district drilldown','CSV download','keyboard focus','print PDF']}
    (ROOT/'verification'/'browser_report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    browser.close()
    print(json.dumps(report,indent=2))
