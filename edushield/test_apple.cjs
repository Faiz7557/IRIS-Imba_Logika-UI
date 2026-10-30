const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process');
let pw;try{pw=require('playwright')}catch{pw=require(execFileSync('python',['-c','from pathlib import Path; import playwright; print(Path(playwright.__file__).parent / "driver" / "package")'],{encoding:'utf8'}).trim())}
const out=process.env.EDUSHIELD_UI_REPORT_DIR?path.resolve(process.env.EDUSHIELD_UI_REPORT_DIR):path.join(__dirname,'verification','apple');fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await pw.chromium.launch({channel:'chrome',headless:true,timeout:20000});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce',acceptDownloads:true});
 const errors=[],external=[],routes=['A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','C1','C2','C3','L1','L2','L3'];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
 const base=pathToFileURL(path.join(__dirname,'app','index.html')).href;await page.goto(base);await page.locator('h1').waitFor();
 let routeChecks=0;
 for(const width of [1440,1024,1023,768,390,375]){
  await page.setViewportSize({width,height:width<800?844:1050});
  for(const route of routes){
   await page.evaluate(r=>location.hash=r,route);await page.waitForFunction(r=>document.body.dataset.page===r,route);
   assert.equal(await page.locator('h1').count(),1);assert(await page.locator('.simulation').isVisible());
   assert.equal(await page.locator('.sidebar [aria-current="page"]').count(),1,route+' active nav');
   assert(!/(^|\s)[ABCL]\d\b/.test(await page.locator('.sidebar').innerText()),'Route codes visible in sidebar');
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${route} overflows at ${width}`);
   if(width===1440||width===390)await page.screenshot({path:path.join(out,`${route}-${width}.png`),fullPage:true});
   routeChecks++;
  }
 }
 console.log('PASS',routeChecks,'route/viewport checks');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#menu-toggle').click();assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
 assert(await page.locator('#app-surface').evaluate(e=>e.inert));assert.equal(await page.locator('.sidebar').getAttribute('role'),'dialog');
 await page.locator('#sidebar-close').focus();await page.keyboard.press('Shift+Tab');
 assert(await page.evaluate(()=>!!document.activeElement.closest('.sidebar')));
 const last=page.locator('.docs-nav a').last();await last.focus();await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('.sidebar')));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement));
 await page.locator('#menu-toggle').click();await page.locator('#role').selectOption('B');await page.waitForFunction(()=>document.body.dataset.page==='B1');
 assert(!(await page.locator('#app-surface').evaluate(e=>e.inert)));
 await page.locator('#menu-toggle').click();await page.locator('#role').selectOption('A');await page.waitForFunction(()=>document.body.dataset.page==='A1');
 await page.locator('#menu-toggle').click();await page.locator('#nav a[href="#A1"]').click();assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement));
 await page.locator('.hero-link').click();await page.waitForFunction(()=>document.body.dataset.page==='A4');
 const old=await page.evaluate(()=>EduApp.result.B);await page.locator('#share').fill('0.3');assert.equal(await page.evaluate(()=>EduApp.params.share),.3);assert((await page.evaluate(()=>EduApp.result.B))<old);
 await page.locator('#alpha').fill('0.5');assert(await page.locator('#scenario-error').innerText());assert.equal(await page.evaluate(()=>EduApp.params.alpha),.2);
 await page.setViewportSize({width:1440,height:1050});await page.locator('#share').scrollIntoViewIfNeeded();
 await page.locator('#share').evaluate(e=>window.__originalSlider=e);const rect=await page.locator('#share').boundingBox();
 await page.mouse.move(rect.x+rect.width*.133,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height/2,{steps:12});await page.mouse.up();
 assert(await page.evaluate(()=>window.__originalSlider===document.querySelector('#share')),'Slider was replaced during drag');
 assert((await page.evaluate(()=>EduApp.params.share))>.55,'Pointer drag did not continuously update');
 const sliderSolveMs=await page.evaluate(()=>lastSolveMs);
 await page.locator('#reset').click();assert.equal(await page.evaluate(()=>EduApp.params.share),.55);
 await page.locator('#search').fill('Sumba');assert.equal(await page.locator('tbody tr').count(),await page.evaluate(()=>EDUSHIELD_DATA.kab.filter(d=>d.nama.toLowerCase().includes('sumba')).length));
 await page.locator('[data-district]').first().click();await page.waitForFunction(()=>document.body.dataset.page==='A3');await page.locator('#district').selectOption('0');
 await page.evaluate(()=>location.hash='A5');await page.waitForFunction(()=>document.body.dataset.page==='A5');await page.locator('[data-mode="modeled"]').click();assert.equal(await page.locator('[data-mode="modeled"]').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>location.hash='B3');await page.waitForFunction(()=>document.body.dataset.page==='B3');
 await page.locator('#value').fill('12');await page.locator('#evidence').fill('Bukti contoh');await page.locator('#explanation').fill('Koreksi agregat untuk diuji.');await page.locator('#mockform button').click();assert((await page.locator('#form-status').innerText()).includes('belum dikirim'));
 await page.evaluate(()=>location.hash='C1');await page.waitForFunction(()=>document.body.dataset.page==='C1');await page.locator('#upload').setInputFiles({name:'contoh.csv',mimeType:'text/csv',buffer:Buffer.from('id,nilai\ncontoh,12')});assert((await page.locator('#upload-status').innerText()).includes('Belum divalidasi atau diunggah'));
 await page.evaluate(()=>location.hash='A8');await page.waitForFunction(()=>document.body.dataset.page==='A8');await page.locator('#reviewer').fill('Uji antarmuka — belum disahkan');
 let nativeDownload='Not checked';try{const pending=page.waitForEvent('download',{timeout:5000});await page.locator('#csv').click();const dl=await pending;nativeDownload=(await dl.failure())||'PASS';if(nativeDownload==='PASS')await dl.saveAs(path.join(out,'native.csv'));}catch(e){nativeDownload=e.message.split('\n')[0]}
 await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click;window.__blobs=new Map();URL.createObjectURL=b=>{const u=create(b);window.__blobs.set(u,b);return u};HTMLAnchorElement.prototype.click=function(){if(this.download){window.__export={name:this.download,blob:window.__blobs.get(this.href)};return}click.call(this)}});
 for(const id of ['csv','json']){await page.locator('#'+id).click();const value=await page.evaluate(async()=>({name:window.__export.name,text:await window.__export.blob.text()}));assert(value.name.endsWith('.'+id));fs.writeFileSync(path.join(out,'usulan.'+id),value.text)}
 const pack=JSON.parse(fs.readFileSync(path.join(out,'usulan.json'),'utf8').replace(/^\uFEFF/,''));assert.equal(pack.kab.length,514);assert.equal(pack.review.nama,'Uji antarmuka — belum disahkan');
 await page.evaluate(()=>window.print=()=>window.__printCalled=true);await page.locator('#print').click();assert(await page.evaluate(()=>window.__printCalled));assert((await page.locator('#review-text').innerText()).includes('Uji antarmuka'));
 await page.pdf({path:path.join(out,'Lembar-Usulan.pdf'),format:'A4',landscape:true,printBackground:true});await page.emulateMedia({media:'print'});assert(await page.locator('.print-only.banner').isVisible());assert(!(await page.locator('.sidebar').isVisible()));await page.emulateMedia({media:'screen'});
 // Larger text: preserve readable controls without global overflow.
 const textScale=await page.addStyleTag({content:'html{font-size:187.5%!important}'});
 for(const width of [1440,390]){await page.setViewportSize({width,height:1050});for(const route of ['A1','A4','B3','L2']){await page.evaluate(r=>location.hash=r,route);await page.waitForFunction(r=>document.body.dataset.page===r,route);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),route+' large text overflow at '+width)}}
 await textScale.evaluate(e=>e.remove());
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>location.hash='A1');await page.waitForFunction(()=>document.body.dataset.page==='A1');
 // Reverse a moving drawer before it reaches its destination; input remains available.
 await page.locator('#menu-toggle').click();await page.locator('#sidebar-close').click({force:true});
 await page.locator('#menu-toggle').click({force:true});await page.waitForFunction(()=>EduUI.drawer.progress>.998);
 assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');await page.screenshot({path:path.join(out,'Sidebar-mobile.png')});
 await page.locator('#sidebar-close').click();await page.waitForFunction(()=>EduUI.drawer.progress<.001);
 assert(!(await page.locator('#app-surface').evaluate(e=>e.inert)));
 await page.setViewportSize({width:1440,height:1050});assert(!(await page.locator('.sidebar').evaluate(e=>e.inert)));
 await page.locator('.overview-assumptions summary').click();assert(await page.locator('.overview-assumptions').getAttribute('open')!==null);
 await page.screenshot({path:path.join(out,'Beranda-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'Beranda-mobile.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#menu-toggle').click();assert.equal(await page.evaluate(()=>EduUI.drawer.progress),1);await page.locator('#sidebar-close').click();assert.equal(await page.evaluate(()=>EduUI.drawer.progress),0);
 await page.evaluate(()=>location.hash='unknown');await page.waitForFunction(()=>document.body.dataset.page==='A1');
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(external.length,0,JSON.stringify(external));
 const report={status:'PASS',routes:18,routeViewportChecks:routeChecks,viewports:[1440,1024,1023,768,390,375],nativeDownload,downloadScope:'Native download result above; CSV and JSON export Blobs are independently validated.',sliderSolveMs,pageErrors:errors,externalRequests:external,checks:['route code labels removed','one active sidebar link','mobile dialog focus trap','Escape and focus return','same-route focus recovery','role switch','continuous pointer slider: same DOM node','invalid bounds rejected','reset','search','district selection','comparison aria-pressed','correction preview','local file metadata','CSV/JSON generation and values','PDF and print visibility','200% text','interruptible spring reversal','responsive drawer reset','disclosure','normal and reduced motion','invalid route fallback']};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
