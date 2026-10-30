/* Animated state icons adapted to the local UI from the user-supplied reference.
   States follow actual actions; no automatic toggling or simulated notifications. */
'use strict';
window.EduIcons=(()=>{
 const paths={
 home:'<path data-icon-fill d="m4 10 8-6 8 6v10H4Z"/><path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
 radar:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5" opacity=".5"/><path d="m12 12 6-6"/><circle cx="12" cy="12" r="1.5" data-icon-fill/>',
 map:'<path data-icon-fill d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2Z"/><path d="m3.5 5 5.5-2 6 2 5.5-2v16L15 21l-6-2-5.5 2ZM9 3v16M15 5v16"/>',
 sliders:'<path d="M4 6h5m4 0h7M4 12h9m4 0h3M4 18h3m4 0h9"/><circle cx="11" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
 compare:'<rect x="3.5" y="6" width="6.5" height="14" rx="2"/><rect x="14" y="3.5" width="6.5" height="16.5" rx="2"/><path d="M6 15h1.5M16.5 11H18" opacity=".6"/>',
 shield:'<path data-icon-fill d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 transition:'<path d="M4 4v16h16" opacity=".55"/><path d="m7 15 4-5 4 2 5-7M16 5h4v4"/>',
 document:'<path data-icon-fill d="M5 3.5h9l5 5v12H5Z"/><path d="M14 3.5H5v17h14v-12ZM14 3.5v5h5M8.5 12h7M8.5 16h5"/>',
 region:'<path d="M3 20.5h18M5 20V8l7-4.5L19 8v12M9.5 20v-5h5v5M8.5 10h.01M15.5 10h.01M8.5 12.5h.01M15.5 12.5h.01"/>',
 explain:'<path d="M8 20.5 4 22v-5a8.5 8.5 0 1 1 4 3.5Z"/><path d="M12 10.5V16M12 7.5v.01"/>',
 edit:'<path d="M13 4H5v16h14v-8" opacity=".5"/><path d="m10 14 .5-3.5L18 3l3 3-7.5 7.5ZM16 5l3 3"/>',
 upload:'<path d="M4 15v5h16v-5M12 16V3.5m-5 5 5-5 5 5"/>',
 database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
 tune:'<path d="M4 20V4M4 20h16" opacity=".55"/><path d="M7 15c3-1 2-6 6-6s3-4 7-4"/><circle cx="13" cy="9" r="2"/>',
 audit:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5l2 2 4-4"/>',
 palette:'<path d="M12 3a9 9 0 1 0 0 18c4 0-1-4.5 2-6s7 .5 7-5a9 9 0 0 0-9-7Z"/><path d="M7 9h.01M10.5 6.5h.01M15 7.5h.01M6.5 14h.01" stroke-width="2.8"/>',
 layers:'<path data-icon-fill d="m12 3 9 5-9 5-9-5Z"/><path d="m12 3 9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
 flag:'<path d="M5 21V3m0 1c4-3 10 3 14 0v10c-4 3-10-3-14 0"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 print:'<path d="M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7ZM17 11h.01"/>'
 };
 function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">${paths[name]||paths.document}</svg>`;}
 function stateIcon(type){
  if(type==='menu')return '<svg class="state-icon menu-state" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path class="menu-top" d="M10 12h20"/><path class="menu-middle" d="M10 20h20"/><path class="menu-bottom" d="M10 28h20"/></svg>';
  const base=type==='copy'?'<rect x="12" y="8" width="18" height="24" rx="3"/><path d="M8 14v19a3 3 0 0 0 3 3h13" opacity=".35"/>':type==='download'?'<path d="M8 27v5a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-5"/>':'<circle cx="20" cy="20" r="15" opacity=".25"/>';
  const idle=type==='copy'?'<path d="M17 16h8M17 21h8M17 26h5" opacity=".6"/>':type==='download'?'<path d="M20 6v17m-6-6 6 6 6-6"/>':'<path d="M10 14a12 12 0 1 1-1 9M10 7v7h7"/>';
  return `<svg class="state-icon ${type}-state" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${base}<g class="state-idle">${idle}</g><path class="state-check" pathLength="1" d="m14 21 5 5 9-11"/><path class="state-error" d="m15 15 10 10M25 15 15 25"/></svg>`;
 }
 const timers=new WeakMap();
 function feedback(button,state='ready'){
  if(!button)return;clearTimeout(timers.get(button));button.dataset.iconState=state;
  const label=button.querySelector('[data-icon-label]');if(label)label.textContent=state==='error'?'Gagal menyalin':button.id==='csv'?'CSV disiapkan':button.id==='json'?'JSON disiapkan':button.hasAttribute('data-copy')?'Identitas tersalin':button.dataset.idleLabel;
  timers.set(button,setTimeout(()=>{button.dataset.iconState='idle';if(label)label.textContent=button.dataset.idleLabel;},2200));
 }
 function decorate(root){
  const configs=[['#menu-toggle','menu',''],['#sidebar-close','menu',''],['#reset','reset','Atur ulang'],['#csv','download','Unduh kuota CSV'],['#json','download','Unduh usulan JSON'],['[data-copy]','copy','Salin identitas paket']];
  for(const [selector,type,label] of configs)root.querySelectorAll(selector).forEach(button=>{if(button.querySelector('.state-icon'))return;button.dataset.idleLabel=label;button.dataset.iconState=button.id==='sidebar-close'?'open':'idle';button.innerHTML=stateIcon(type)+(label?`<span data-icon-label>${label}</span>`:'');});
  const print=root.querySelector('#print');if(print&&!print.querySelector('svg'))print.insertAdjacentHTML('afterbegin',icon('print'));
  root.querySelectorAll('.theme-switch svg').forEach(svg=>svg.classList.add('ui-icon','theme-icon'));
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy="package-hash"]');if(!button||button.disabled)return;
  button.disabled=true;button.setAttribute('aria-busy','true');
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(window.DATA_HASH);feedback(button);window.toast?.('Identitas paket berhasil disalin.');}
  catch{feedback(button,'error');window.toast?.('Identitas belum tersalin. Anda dapat memilih dan menyalin teks SHA-256 secara manual.');}
  finally{button.disabled=false;button.removeAttribute('aria-busy');}
 });
 return {icon,stateIcon,decorate,feedback};
})();
