// Tangkapan layar slide final (brief §8): 1440 px, mode terang, dari file://. Keluaran: lampiran/final/.
// Tidak menyentuh lampiran/ lama (gambar esai penyisihan).
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
let pw;try{pw=require('playwright')}catch{pw=require(execFileSync('python',['-c','from pathlib import Path; import playwright; print(Path(playwright.__file__).parent / "driver" / "package")'],{encoding:'utf8'}).trim())}
const out=path.join(__dirname,'lampiran','final');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await pw.chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'app','index.html')).href);await p.locator('h1').waitFor();await p.evaluate(()=>EduStore.reset());
 await p.addStyleTag({content:'.toolbar{position:static!important}#toast{display:none!important}'}); // toolbar lengket tidak menimpa tangkapan elemen
 const go=async r=>{await p.evaluate(r=>location.hash=r,r);await p.waitForFunction(r=>document.body.dataset.page===r,r);await p.waitForTimeout(200)};
 const shot=async(name,sel)=>{const el=p.locator(sel).first();await el.scrollIntoViewIfNeeded();await el.screenshot({path:path.join(out,name)})};
 await go('peta');await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'1_peta.png')});
 await go('simulator');for(const [s,n] of [[.3,'2a_bejana_pagu30.png'],[.8,'2b_bejana_pagu80.png']]){await p.locator('#share').fill(String(s));await p.locator('#share').dispatchEvent('change');await p.waitForTimeout(150);await shot(n,'#main .bejana-panel')}
 await p.locator('#reset').click();
 await go('audit');const run=p.locator('#main button.primary').first();if(await run.count())await run.click().catch(()=>{});await p.waitForTimeout(3000);await shot('3_audit.png','#main .au-hero, #main .panel');
 await go('replay');await shot('4_replay.png','#main [data-tour], #main .panel');
 // Alur usulan sampai koreksi diterima.
 await go('usulan');const role=async r=>{await p.locator('#role').selectOption(r);await p.waitForFunction(r=>document.body.dataset.role===r,r)};
 await role('A');await p.locator('[data-u="kirim"]').click();await role('B');
 const i=await p.evaluate(()=>EduApp.data.kab.findIndex(d=>d.nama==='Sumba Tengah')),V=await p.evaluate(i=>EduApp.data.kab[i].V,i);
 await p.locator('#u-wil').selectOption(String(i));await p.locator('#u-bid').selectOption('V');await p.locator('#u-val').fill(String(Math.round(V*1.6)));await p.locator('#u-why').fill('Data lapangan dinas menunjukkan populasi rentan lebih besar.');await p.locator('#u-form button.primary').click();
 await role('A');const kid=await p.evaluate(()=>EduStore.get().koreksi[0].id);await p.locator(`#u-a-${kid}`).fill('Bukti dinas diterima setelah diperiksa.');await p.locator('[data-u="terima"]').click();
 await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'5_usulan.png'),fullPage:true});
 await p.evaluate(()=>EduStore.reset());if(errors.length)throw new Error(errors.join('\n'));
 console.log(fs.readdirSync(out).join('\n'));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
