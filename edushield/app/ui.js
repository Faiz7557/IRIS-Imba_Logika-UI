/* Local interface layer: sidebar, focus management, route motion. No dependencies. */
'use strict';
window.EduUI=(()=>{
 const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M12 3v2M3 12h2M12 19v2M19 12h2"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/>',
 sliders:'<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
 compare:'<rect x="3" y="5" width="7" height="15" rx="2"/><rect x="14" y="3" width="7" height="17" rx="2"/><path d="M5 15h3M16 12h3"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
 transition:'<path d="M4 18h16M5 15l5-5 4 2 5-8M14 4h5v5"/>',
 document:'<path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h6"/>',
 region:'<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M8 10h1m6 0h1M8 13h1m6 0h1"/>',
 explain:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 edit:'<path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15ZM3 15l5 5"/>',
 upload:'<path d="M4 15v5h16v-5M12 16V3m-5 5 5-5 5 5"/>',
 database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
 tune:'<path d="M4 20V4M4 20h16M7 15l4-5 4 2 5-7"/>',
 audit:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10l2 2 4-4"/>',
 palette:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18c4 0-2-5 2-7s7 0 7-4"/><path d="M7 9h.01M10 6h.01M15 7h.01M6 14h.01"/>',
 layers:'<path d="m12 3 10 6-10 6L2 9ZM3 14l9 5 9-5M3 18l9 5 9-5"/>',
 flag:'<path d="M5 21V3m0 1c4-4 10 4 14 0v10c-4 4-10-4-14 0"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
 };
 function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]||paths.document}</svg>`;}
 function setTheme(theme,{persist=true}={}){
  if(theme!=='light'&&theme!=='dark')return;
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101216':'#f5f6f8');
  if(persist)try{localStorage.setItem('edushield-theme',theme);}catch{}
 }
 document.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>setTheme(button.dataset.themeChoice));
 window.addEventListener('storage',event=>{if(event.key==='edushield-theme'||event.key===null)setTheme(event.newValue==='dark'?'dark':'light',{persist:false});});
 setTheme(document.documentElement.dataset.theme||'light',{persist:false});
 const navIcons={A1:'home',A2:'radar',A3:'map',A4:'sliders',A5:'compare',A6:'shield',A7:'transition',A8:'document',B1:'region',B2:'explain',B3:'edit',B4:'upload',C1:'database',C2:'tune',C3:'audit',L1:'palette',L2:'layers',L3:'flag'};
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
  open=next;target=next?1:0;toggle.setAttribute('aria-expanded',String(next));
  sidebar.inert=!next;sidebar.setAttribute('aria-hidden',String(!next));
  if(next){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');}else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');}
  surface.inert=next;document.documentElement.style.overflow=next?'hidden':'';scrim.hidden=false;scrim.style.pointerEvents=next?'auto':'none';
  if(next)close.focus({preventScroll:true});else if(restoreFocus)toggle.focus({preventScroll:true});
  if(instant||reduced.matches||modality==='keyboard'){cancelAnimationFrame(raf);raf=0;previousTime=0;settle();}else if(!raf)raf=requestAnimationFrame(spring);
 }
 function layout(){cancelAnimationFrame(raf);raf=0;previousTime=0;open=false;target=progress=velocity=0;surface.inert=false;document.documentElement.style.overflow='';scrim.hidden=true;toggle.setAttribute('aria-expanded','false');sidebar.inert=mobile.matches;if(mobile.matches)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');paint();}
 toggle.onclick=()=>setOpen(!open);close.onclick=()=>setOpen(false);scrim.onclick=()=>setOpen(false);
 sidebar.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link&&mobile.matches)setOpen(false,{restoreFocus:link.hash===(location.hash||'#A1')});});
 document.addEventListener('keydown',e=>{
  modality='keyboard';if(!mobile.matches||!open)return;
  if(e.key==='Escape'){e.preventDefault();setOpen(false);return;}
  if(e.key==='Tab'){const items=[...sidebar.querySelectorAll('a[href],button,select')].filter(e=>!e.disabled&&e.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 mobile.addEventListener('change',layout);reduced.addEventListener('change',()=>{if(raf){cancelAnimationFrame(raf);raf=0;previousTime=0;settle();}});layout();
 let navRole='';
 function syncRoute(code,pages,role){
  const nav=document.querySelector('#nav');
  if(navRole!==role){
   const groups=role==='A'?[['Tinjauan',['A1','A2','A3']],['Simulasi',['A4','A5','A6']],['Usulan',['A7','A8']]]:role==='B'?[['Wilayah Anda',['B1','B2']],['Pelaporan',['B3','B4']]]:[['Pengelolaan',['C1','C2','C3']]];
   nav.innerHTML=groups.map(([label,ids])=>`<div class="nav-group"><span class="nav-label">${label}</span>${ids.map(id=>`<a href="#${id}">${icon(navIcons[id])}<span>${pages[id]}</span></a>`).join('')}</div>`).join('');navRole=role;
  }
  document.querySelectorAll('.docs-nav a').forEach(a=>{if(!a.querySelector('svg'))a.insertAdjacentHTML('afterbegin',icon(navIcons[a.dataset.doc]));});
  document.querySelectorAll('.sidebar nav a').forEach(a=>{if(a.hash==='#'+code)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelector('#breadcrumb').textContent=pages[code];
  document.title=`${pages[code]} — EduShield`;
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
 return {icon,syncRoute,tables,routeChanged,closeSidebar:()=>setOpen(false,{restoreFocus:false}),get drawer(){return {open,progress,velocity,target};}};
})();
