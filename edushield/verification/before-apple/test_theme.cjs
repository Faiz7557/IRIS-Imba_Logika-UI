const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
let playwright;
try{playwright=require('playwright');}catch{
  const root=execFileSync('python',['-c','from pathlib import Path; import playwright; print(Path(playwright.__file__).parent / "driver" / "package")'],{encoding:'utf8'}).trim();
  playwright=require(root);
}
const out=path.join(__dirname,'verification','onda');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true,timeout:20000});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  const base=pathToFileURL(path.join(__dirname,'app','index.html')).href;
  await page.goto(base);await page.locator('h1').waitFor();
  const routes=['A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','C1','C2','C3','L1','L2','L3'];
  const routeChecks=[];
  for(const width of [1440,768,390,375]){
   await page.setViewportSize({width,height:width<800?844:1000});
   for(const route of routes){
    await page.evaluate(r=>location.hash=r,route);
    await page.waitForFunction(r=>document.body.dataset.page===r,route);
    assert.equal(await page.locator('h1').count(),1);
    assert(await page.locator('.simulation').isVisible());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert(!overflow,`${route} overflows at ${width}`);
    routeChecks.push({route,width,overflow});
    if(width===1440||width===390){await page.screenshot({path:path.join(out,`${route}-${width}.png`),fullPage:true});}
   }
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#menu-toggle').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#role').selectOption('B');
  await page.waitForFunction(()=>document.body.dataset.page==='B1');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  await page.locator('#menu-toggle').click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement));
  await page.locator('#menu-toggle').click();await page.locator('#role').selectOption('A');
  await page.waitForFunction(()=>document.body.dataset.page==='A1');
  await page.locator('.hero-link').click();await page.waitForFunction(()=>document.body.dataset.page==='A4');
  const old=await page.evaluate(()=>EduApp.result.B);
  await page.locator('#share').fill('0.3');
  assert.equal(await page.evaluate(()=>EduApp.params.share),.3);
  assert((await page.evaluate(()=>EduApp.result.B))<old);
  await page.locator('#alpha').fill('0.5');assert(await page.locator('#scenario-error').innerText());
  assert.equal(await page.evaluate(()=>EduApp.params.alpha),.2);
  await page.locator('#reset').click();assert.equal(await page.evaluate(()=>EduApp.params.share),.55);
  await page.locator('#search').fill('Sumba');
  assert.equal(await page.locator('tbody tr').count(),await page.evaluate(()=>EDUSHIELD_DATA.kab.filter(d=>d.nama.toLowerCase().includes('sumba')).length));
  await page.locator('[data-district]').first().click();await page.waitForFunction(()=>document.body.dataset.page==='A3');
  await page.locator('#district').selectOption('0');
  await page.evaluate(()=>location.hash='A5');await page.waitForFunction(()=>document.body.dataset.page==='A5');
  await page.locator('[data-mode="modeled"]').click();assert(await page.locator('[data-mode="modeled"]').evaluate(e=>e.classList.contains('primary')));
  await page.evaluate(()=>location.hash='A8');await page.waitForFunction(()=>document.body.dataset.page==='A8');
  await page.locator('#reviewer').fill('Uji tema — belum disahkan');
  // Downloads from every Blob are canceled by this host's Chrome policy.
  // Capture the browser-created Blob to verify the real export handlers and contents.
  await page.evaluate(()=>{
   const create=URL.createObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click;
   window.__exportBlobs=new Map();
   URL.createObjectURL=blob=>{const url=create(blob);window.__exportBlobs.set(url,blob);return url;};
   HTMLAnchorElement.prototype.click=function(){if(this.download){window.__exported={name:this.download,blob:window.__exportBlobs.get(this.href)};return;}click.call(this);};
  });
  for(const [id,ext] of [['csv','csv'],['json','json']]){
   await page.locator('#'+id).click();
   const exported=await page.evaluate(async()=>({name:window.__exported.name,text:await window.__exported.blob.text()}));
   assert(exported.name.endsWith('.'+ext));fs.writeFileSync(path.join(out,`usulan.${ext}`),exported.text);
  }
  const pack=JSON.parse(fs.readFileSync(path.join(out,'usulan.json'),'utf8').replace(/^\uFEFF/,''));
  assert.equal(pack.kab.length,514);assert.equal(pack.review.nama,'Uji tema — belum disahkan');
  await page.pdf({path:path.join(out,'Lembar-Usulan.pdf'),format:'A4',landscape:true,printBackground:true});
  await page.emulateMedia({media:'print'});assert(await page.locator('.print-only.banner').isVisible());assert(!(await page.locator('.masthead').isVisible()));await page.emulateMedia({media:'screen'});
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>location.hash='A1');await page.waitForFunction(()=>document.body.dataset.page==='A1');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();
  await page.locator('.hero h1').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished));});
  await page.screenshot({path:path.join(out,'Beranda-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'Beranda-mobile.png'),fullPage:true});
  await page.evaluate(()=>location.hash='invalid');await page.waitForFunction(()=>document.body.dataset.page==='A1');
  assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(external.length,0,JSON.stringify(external));
  const report={status:'PASS',downloadLimitation:'Host Chrome canceled native Blob downloads, including a minimal plain-text control. CSV/JSON handlers and contents verified by capturing their generated Blobs; native save-to-disk is not verified.',routeChecks:routeChecks.length,viewports:[1440,768,390,375],routes:routes.length,pageErrors:errors,externalRequests:external,interactions:['mobile menu','Escape focus','role switch','hero CTA','slider recompute','invalid bounds','reset','search','district drilldown','scheme toggle','CSV Blob generation','JSON Blob contents','print visibility','PDF','reduced motion','normal motion','invalid-route fallback']};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
