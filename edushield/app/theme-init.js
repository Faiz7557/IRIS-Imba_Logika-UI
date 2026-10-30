/* Apply the saved mode before styles paint. Storage may be unavailable for file URLs. */
(()=>{let theme='light';try{const saved=localStorage.getItem('edushield-theme');if(saved==='light'||saved==='dark')theme=saved;}catch{}document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101216':'#f5f6f8');})();
