/* Local interface layer: sidebar, focus management, route motion. No dependencies. */
'use strict';
window.EduUI=(()=>{
 const icon=EduIcons.icon;
 function setTheme(theme,{persist=true}={}){
  if(theme!=='light'&&theme!=='dark')return;
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101216':'#f5f6f8');
  if(persist)try{localStorage.setItem('edushield-theme',theme);}catch{}
 }
 document.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>setTheme(button.dataset.themeChoice));
 window.addEventListener('storage',event=>{if(event.key==='edushield-theme'||event.key===null)setTheme(event.newValue==='dark'?'dark':'light',{persist:false});});
 EduIcons.decorate(document);
 setTheme(document.documentElement.dataset.theme||'light',{persist:false});
  const sidebar=document.querySelector('.sidebar'),surface=document.querySelector('#app-surface'),scrim=document.querySelector('#sidebar-scrim'),toggle=document.querySelector('#menu-toggle'),close=document.querySelector('#sidebar-close');
 const mobile=matchMedia('(max-width: 1023px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let open=false,progress=0,velocity=0,target=0,raf=0,previousTime=0,modality='pointer',viewAnimation;
 document.addEventListener('pointerdown',()=>modality='pointer',{capture:true});
 function paint(){sidebar.style.transform=mobile.matches?`translate3d(${(progress-1)*100}%,0,0)`:'';scrim.style.opacity=String(progress*.32);}
 function settle(){progress=target;velocity=0;paint();if(!open)scrim.hidden=true;}
 function spring(time){const dt=previousTime?Math.min((time-previousTime)/1000,.025):1/60;previousTime=time;
  // Critically damped spring, retaining velocity when the target reverses.
  const omega=24,offset=progress-target,c=velocity+omega*offset,decay=Math.exp(-omega*dt);
  progress=target+(offset+c*dt)*decay;velocity=(velocity-omega*c*dt)*decay;paint();
  if(Math.abs(progress-target)<.001&&Math.abs(velocity)<.01){raf=0;previousTime=0;settle();}else raf=requestAnimationFrame(spring);
 }
 function setOpen(next,{restoreFocus=true,instant=false}={}){
  if(!mobile.matches)return;
  open=next;target=next?1:0;toggle.setAttribute('aria-expanded',String(next));toggle.dataset.iconState=next?'open':'closed';
  sidebar.inert=!next;sidebar.setAttribute('aria-hidden',String(!next));
  if(next){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');}else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');}
  surface.inert=next;document.documentElement.style.overflow=next?'hidden':'';scrim.hidden=false;scrim.style.pointerEvents=next?'auto':'none';
  if(next)close.focus({preventScroll:true});else if(restoreFocus)toggle.focus({preventScroll:true});
  if(instant||reduced.matches||modality==='keyboard'){cancelAnimationFrame(raf);raf=0;previousTime=0;settle();}else if(!raf)raf=requestAnimationFrame(spring);
 }
 function layout(){cancelAnimationFrame(raf);raf=0;previousTime=0;open=false;target=progress=velocity=0;surface.inert=false;document.documentElement.style.overflow='';scrim.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.dataset.iconState='closed';sidebar.inert=mobile.matches;if(mobile.matches)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');paint();}
 toggle.onclick=()=>setOpen(!open);close.onclick=()=>setOpen(false);scrim.onclick=()=>setOpen(false);
 sidebar.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link&&mobile.matches)setOpen(false,{restoreFocus:link.hash===(location.hash||'#beranda')});});
 document.addEventListener('keydown',e=>{
  modality='keyboard';if(!mobile.matches||!open)return;
  if(e.key==='Escape'){e.preventDefault();setOpen(false);return;}
  if(e.key==='Tab'){const items=[...sidebar.querySelectorAll('a[href],button,select')].filter(e=>!e.disabled&&e.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 mobile.addEventListener('change',layout);reduced.addEventListener('change',()=>{if(raf){cancelAnimationFrame(raf);raf=0;previousTime=0;settle();}});layout();
  // Sidebar berkelompok (brief §3). n = nomor langkah; ikon dipakai bila tanpa nomor.
 const navHtml=([id,label,n])=>`<a href="#${id}" title="${label}"><span class="nav-icon${typeof n==='number'?' nav-num':''}">${typeof n==='number'?n:icon(n)}</span><span class="nav-label">${label}</span></a>`;
 const navGroups=[[null,[['beranda','Beranda','home']]],['Di mana risikonya?',[['peta','Peta risiko',1]]],['Bagaimana membaginya?',[['simulator','Simulator kuota',2],['audit','Audit data',3]]],['Bisakah dipercaya?',[['replay','Replay',4]]],['Siapa memutuskan?',[['usulan','Usulan & koreksi',5],['lembar','Lembar final',6]]]];
 document.querySelector('#nav').innerHTML=navGroups.map(([t,items])=>(t?`<p class="nav-group-title">${t}</p>`:'')+items.map(navHtml).join('')).join('')+`<div class="nav-sep" role="separator"></div>`+navHtml(['metode','Metode & batas data','layers'])+`<button type="button" id="tour-start" class="nav-tour" title="Mulai tur"><span class="nav-icon">${icon('flag')}</span><span class="nav-label">Mulai tur</span></button>`;
 // Ciutkan sidebar (hanya >=1024px; di bawahnya laci). Disimpan di localStorage.
 const sideToggle=document.querySelector('#side-toggle');
 function setSide(mode,persist){document.body.dataset.side=mode;sideToggle.setAttribute('aria-pressed',String(mode==='mini'));sideToggle.setAttribute('aria-label',mode==='mini'?'Bentangkan navigasi':'Ciutkan navigasi');if(persist)try{localStorage.setItem('edushield-side',mode);}catch{}}
 let savedSide='full';try{savedSide=localStorage.getItem('edushield-side')==='mini'?'mini':'full';}catch{}
 setSide(savedSide,false);sideToggle.onclick=()=>setSide(document.body.dataset.side==='mini'?'full':'mini',true);
 // Kartu skenario di kaki sidebar; disembunyikan bila B tidak finite.
 function sideCard(B,share){
  const card=document.querySelector('#side-card');if(!card)return;
  if(!Number.isFinite(B)||!Number.isFinite(share)){card.hidden=true;return;}
  card.hidden=false;
  card.innerHTML=`<span class="sc-label">Skenario aktif</span><strong class="sc-val">Rp${fmt(B/1000,1)} miliar</strong><span class="sc-bar" aria-hidden="true"><i style="width:${share*100}%"></i></span><span class="sc-share"><span class="sc-word">porsi </span>${pct(share,0)}</span>`;
 }
 const tour=document.querySelector('#tour-start');
 tour.onclick=()=>{if(window.EduTour?.start){setOpen(false,{restoreFocus:false});window.EduTour.start();}};
 function syncRoute(route,title){
  tour.setAttribute('aria-disabled',String(!window.EduTour?.start));
  document.querySelectorAll('.sidebar nav a').forEach(a=>{if(a.hash==='#'+route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelector('#breadcrumb').textContent=title;
  document.title=`${title} — EduShield`;
 }
 function tables(){document.querySelectorAll('#main table').forEach(table=>{if(!table.parentElement.classList.contains('table-wrap')){const wrap=document.createElement('div');wrap.className='table-wrap';table.before(wrap);wrap.append(table);}});document.querySelectorAll('.table-wrap').forEach(w=>{w.tabIndex=0;w.setAttribute('role','region');w.setAttribute('aria-label',w.closest('.panel')?.querySelector('h2')?.textContent||'Tabel data');});}
 function routeChanged(){
  if(mobile.matches&&open)setOpen(false,{restoreFocus:false});
  const main=document.querySelector('#main');
  const live=viewAnimation?getComputedStyle(main):null,from=live?{opacity:live.opacity,transform:live.transform}:{opacity:.65,transform:'translateY(8px)'};
  viewAnimation?.cancel();viewAnimation=null;
  if(!reduced.matches&&modality!=='keyboard')viewAnimation=main.animate([from,{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.23,1,.32,1)'});
  main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
 }
 return {icon,sideCard,syncRoute,tables,routeChanged,closeSidebar:()=>setOpen(false,{restoreFocus:false}),get drawer(){return {open,progress,velocity,target};}};
})();
