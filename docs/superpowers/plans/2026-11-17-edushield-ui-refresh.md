# EduShield UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 8 EduShield screens look clean and consistent in the SpareKit style, keep blue as the only accent, and add a three.js 3D map hero to Beranda.

**Architecture:** The CSS layer gets new tokens and components (`style.css`, `themes.css`, `cards.css`). `ui.js` rebuilds the sidebar into question groups, adds a collapse toggle, and adds a scenario card. A new module `viz/peta3d.js` (classic script, global `EduViz.peta3d`) extrudes `EDU_GEO.paths` with a vendored `three.min.js` UMD build. `screens/beranda.js` mounts it and falls back to the 2D SVG `EduViz.peta.html`.

**Tech Stack:** Vanilla HTML/CSS/JS (classic `<script defer>`, `file://`), three.js 0.159.0 UMD, tests in Node + Playwright (`node edushield/test_*.cjs`).

**Spec:** `docs/superpowers/specs/2026-11-17-edushield-ui-refresh-design.md`

## Global Constraints

- No network requests at runtime. `test_apple.cjs` and `test_modes.cjs` collect every `http(s)` request into `external`, and that list must stay empty.
- No ES modules, no build step, no React/Tailwind. Every new file is a classic script attached to `window`.
- Accent `--accent:#0066cc` (light) / `#8fc0ff` (dark). Light ground `#f3f5f8`, dark ground `#0f1217`. Light panel `#fff`, dark panel `#171b22`.
- Panel radius 20px, chip 22px tall with radius 7px, button radius 10px, `h1` 28px with tracking −0.02em.
- Text contrast ≥ 4.5:1 in both modes.
- Do not change `kkt.js`, `data.js`, `app_data.json`, `store.js`, or the calculation logic in screens.
- `@media print` stays white with no 3D: the canvas is hidden in print and the fallback SVG/teks is shown.
- Honor `prefers-reduced-motion` (no auto-rotate) and `prefers-contrast:more`.
- **No commits during execution.** Branch `final` has many uncommitted changes from the user, and the user commits at the end.
- three.js is downloaded once (user-approved) from the npm registry: `https://registry.npmjs.org/three/-/three-0.159.0.tgz`, file `package/build/three.min.js` → `edushield/app/vendor/three.min.js`.

## Review Focus

1. **Re-render while the 3D view is running**: `render()` replaces `#main` innerHTML on every hash change or store event. The old canvas must be disposed (loop stopped, `renderer.dispose()`, `forceContextLoss()`). Otherwise Chrome warns "Too many active WebGL contexts" after about 16 visits. Test in Task 4.
2. **Theme switch while on Beranda**: map colors follow the new theme without a reload. Test in Task 4 (`data-built-theme`).
3. **Reduced motion**: no auto-rotate; the map is static but can still be dragged. Test in Task 4 (`data-spin="off"`).
4. **HP 375px**: dragging horizontally on the canvas must not block vertical page scroll (`touch-action:pan-y`), and there is no overflow. Test in Task 4.
5. **Region data missing or non-finite** (`audit.A` null/NaN): height 0, never NaN in the geometry. Test in Task 3 (`heights`).

---

### Task 1: Color tokens, panel, chip, button, page head

**Files:**
- Modify: `edushield/app/style.css` (`:root` line 2, base button/h1 rules)
- Modify: `edushield/app/themes.css` (dark tokens)
- Modify: `edushield/app/cards.css` (replace the 24px glass panel with a 20px hairline panel in both modes)
- Test: `edushield/test_modes.cjs`

**Interfaces:**
- Produces CSS variables: `--ground --panel --panel-2 --line --line-2 --ink --ink-2 --ink-3 --ink-4 --accent --accent-soft --act --act-soft --act-ink --plan --plan-soft --plan-ink --ready --ready-soft --ready-ink --idle --idle-soft --idle-ink`. Keep the old names (`--paper --surface --muted --blue --green --soft`) as aliases of the new tokens so existing CSS keeps working.
- Produces classes: `.chip` + `.chip.act|.plan|.ready|.idle` (ikon + kata), `.em` (bold angka, color `--ink`; `.em.act` etc. for status color).

- [ ] **Step 1: Write the failing test** (append to `test_modes.cjs` after the light-mode assertion, and again after switching to dark)

```js
const look=()=>page.evaluate(()=>{const b=getComputedStyle(document.body),p=getComputedStyle(document.querySelector('.panel')),h=getComputedStyle(document.querySelector('h1'));return {bg:b.backgroundColor,panel:p.backgroundColor,radius:p.borderTopLeftRadius,h1:h.fontSize};});
assert.deepEqual(await look(),{bg:'rgb(243, 245, 248)',panel:'rgb(255, 255, 255)',radius:'20px',h1:'28px'});
// after setting dark:
assert.deepEqual(await look(),{bg:'rgb(15, 18, 23)',panel:'rgb(23, 27, 34)',radius:'20px',h1:'28px'});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node edushield/test_modes.cjs`
Expected: FAIL with an `AssertionError` on `bg` (currently `rgb(245, 246, 248)`).

- [ ] **Step 3: Implement the tokens and components**

`body{background:var(--ground)}`. `.panel{background:var(--panel);border:1px solid var(--line);border-radius:20px;box-shadow:0 1px 2px rgb(16 24 40/.04)}`. Remove the dark glass gradient/backdrop-filter in `cards.css`. Buttons: radius 10px everywhere (remove the 999px pill override). Primary is `--accent` solid, secondary is `--panel` with border `--line-2`. `h1{font-size:28px;letter-spacing:-.02em;font-weight:600}` (mobile ≤700px: 24px). `body{font-variant-numeric:tabular-nums}`.

- [ ] **Step 4: Run all UI tests**

Run: `node edushield/test_modes.cjs && node edushield/test_apple.cjs && node edushield/test_state_icons.cjs`
Expected: all PASS, no overflow, `external` empty.

---

### Task 2: Grouped sidebar, collapse toggle, scenario card

**Files:**
- Modify: `edushield/app/ui.js:47-49` (nav builder)
- Modify: `edushield/app/app.js:33-38` (`render()` calls `EduUI.sideCard`)
- Modify: `edushield/app/style.css`, `edushield/app/themes.css` (sidebar)
- Test: `edushield/test_apple.cjs`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: `EduUI.sideCard(B:number, share:number):void`, which writes into `#side-card` and hides it when `!Number.isFinite(B)`. `document.body.dataset.side` is `"mini"` or `"full"`. localStorage key `edushield-side`.

Groups (exact text, in order):
```
(none)                    Beranda
Di mana risikonya?        1 Peta risiko
Bagaimana membaginya?     2 Simulator kuota, 3 Audit data
Bisakah dipercaya?        4 Replay
Siapa memutuskan?         5 Usulan & koreksi, 6 Lembar final
separator                 Metode & batas data, Mulai tur
```

- [ ] **Step 1: Write the failing tests** (new block in `test_apple.cjs` at 1440 width)

```js
assert.deepEqual(await page.locator('.nav-group-title').allInnerTexts(),['Di mana risikonya?','Bagaimana membaginya?','Bisakah dipercaya?','Siapa memutuskan?']);
assert.equal(await page.locator('.nav-group-title[tabindex], .nav-group-title[href]').count(),0);
assert.match(await page.locator('#side-card').innerText(),/Rp[\d.,]+ miliar/);
await page.locator('#side-toggle').click();
assert.equal(await page.evaluate(()=>document.body.dataset.side),'mini');
assert.equal(await page.evaluate(()=>document.querySelector('.sidebar').getBoundingClientRect().width),68);
await page.reload();await page.locator('h1').waitFor();
assert.equal(await page.evaluate(()=>document.body.dataset.side),'mini');
await page.locator('#side-toggle').click(); // restore for later checks
await page.setViewportSize({width:390,height:844});
assert(!(await page.locator('#side-toggle').isVisible()));
await page.setViewportSize({width:1440,height:1050});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node edushield/test_apple.cjs`
Expected: FAIL on `.nav-group-title` (empty array).

- [ ] **Step 3: Implement**

Group titles are `<p class="nav-group-title">`, not links. `#side-toggle` (`aria-label="Ciutkan navigasi"` / `"Bentangkan navigasi"`, `aria-pressed`) shows only at ≥768px. In mini mode: labels and group titles are visually hidden, every `<a>` gets `title=label`, and `#side-card` shows only the share percentage. Wrap localStorage read/write in try/catch. Call `EduUI.sideCard(result.B, params.share)` at the end of `render()`. Card content: "Skenario aktif", `Rp${fmt(B/1000,1)} miliar`, a bar `width:${share*100}%`, and "porsi ${pct(share,0)}".

- [ ] **Step 4: Run all UI tests**

Run: `node edushield/test_apple.cjs && node edushield/test_modes.cjs && node edushield/test_state_icons.cjs`
Expected: all PASS, including the existing drawer, `inert`, and tour assertions.

---

### Task 3: Vendor three.js + `viz/peta3d.js`

**Files:**
- Create: `edushield/app/vendor/three.min.js` (download, see Global Constraints)
- Create: `edushield/app/viz/peta3d.js`
- Modify: `edushield/app/index.html` (add `<script defer src="vendor/three.min.js">` and `<script defer src="viz/peta3d.js">` after `viz/peta.js`)
- Modify: `edushield/app/TEMPLATE_CREDITS.md` (three.js 0.159.0, MIT, source URL)
- Test: `edushield/test_peta3d.cjs` (new, Node only, no browser)

**Interfaces:**
- Produces `window.EduViz.peta3d`:
  - `rings(d:string): Array<Array<[number,number]>>`: one ring per `M…` subpath, taking the number pairs the same way `viz/peta.js` `geom()` does.
  - `heights(values:Array<number|null>): number[]`: `sqrt(v)/sqrt(max)`, with non-finite or ≤0 values → 0, max 0 → all 0.
  - `supported(): boolean`: `!!window.THREE` and a WebGL context can be created.
  - `mount(root:HTMLElement, o:{h:(i)=>number, cls:(i)=>0|1|2|3, label:string, tip:(i)=>string, select:(i)=>void}): {dispose():void}`.
- The `mount` wrapper (`.peta3d`) sets attributes the tests read: `data-built-theme` (`light|dark`), `data-spin` (`on|off`).

- [ ] **Step 1: Download three.js** (one-time approval already given)

Run: `cd edushield/app && mkdir -p vendor && curl -sL https://registry.npmjs.org/three/-/three-0.159.0.tgz | tar -xzO package/build/three.min.js > vendor/three.min.js && head -c 120 vendor/three.min.js`
Expected: the file starts with a three.js license comment and is about 600 KB.

- [ ] **Step 2: Write the failing test** `edushield/test_peta3d.cjs`

```js
const assert=require('assert');global.window={EduViz:{}};require('./app/geo.js');require('./app/viz/peta3d.js');
const P=window.EduViz.peta3d,paths=Object.values(window.EDU_GEO.paths);
assert.deepEqual(P.heights([4,null,16,NaN,-1]),[0.5,0,1,0,0]);
assert.deepEqual(P.heights([0,0]),[0,0]);
assert.equal(paths.length,514);
for(const d of paths){const r=P.rings(d);assert.equal(r.length,(d.match(/M/g)||[]).length);assert(r.every(x=>x.length>=3&&x.every(([a,b])=>Number.isFinite(a)&&Number.isFinite(b))));}
console.log('PASS peta3d rings/heights');
```

(If `geo.js` uses `window.EDU_GEO = …`, the `global.window` stub is enough. `D.kab[i].id` is the key into `paths`.)

- [ ] **Step 3: Run it and confirm it fails**

Run: `node edushield/test_peta3d.cjs`
Expected: FAIL with `Cannot find module './app/viz/peta3d.js'`.

- [ ] **Step 4: Implement `viz/peta3d.js`**

IIFE, `'use strict'`. `rings` and `heights` are pure and run in Node without `THREE`. `mount` details:
- Coordinates: x = svgX − 500, z = svgY − 190, y = up. Map each ring to a `THREE.Shape` (flip y). `ExtrudeGeometry({depth: 2 + 38*h(i), bevelEnabled:false})`, rotated so the depth is vertical.
- Render: merge the geometry into 4 meshes per class, with colors read from `getComputedStyle` of the wrapper (set the `peta-panel` class on the wrapper so the `--pk0..3` variables apply in both modes).
- Picking: one invisible mesh per region (`userData.i`), `Raycaster` on pointermove/click. Hover shows a tooltip `.peta-tip` with `o.tip(i)`; click calls `o.select(i)`.
- Camera: perspective with tilt 50°. Drag changes the azimuth (±180°) and tilt (35°–65°). Auto-rotate at 0.04 rad/s, off when reduced motion is set, the tab is hidden, or the pointer is down.
- `renderer.setPixelRatio(Math.min(2,devicePixelRatio))`, `ResizeObserver` on root. Canvas style: `touch-action:pan-y`, `role="img"`, `aria-label=o.label`.
- Theme: `MutationObserver` on `documentElement` `data-theme` → recolor the materials and update `data-built-theme`.
- Lifecycle: each frame checks `canvas.isConnected`. If false, call `dispose()` (cancel RAF, disconnect observers, dispose geometry/material, `renderer.dispose()`, `renderer.forceContextLoss()`). Only one live instance at a time: `mount` disposes the previous one first.

- [ ] **Step 5: Run the test**

Run: `node edushield/test_peta3d.cjs`
Expected: `PASS peta3d rings/heights`.

---

### Task 4: Beranda hero 3D + fallback + handoff to Peta risiko

**Files:**
- Modify: `edushield/app/screens/beranda.js` (hero, `p.sub` with `.em`, layout per the spec sketch)
- Modify: `edushield/app/cards.css` (Beranda hero, KPI row, 3-column steps; mobile 1 column)
- Test: `edushield/test_apple.cjs`

**Interfaces:**
- Consumes: `EduViz.peta3d.{supported,heights,mount}` (Task 3), `EduViz.peta.html` (existing), the global `selected` (`app.js` line 5), the existing `kartu()`.
- Produces: in Beranda, `#beranda-hero` with child `.peta3d` (3D) or `.peta-wrap` (2D fallback), the button `#hero-2d` (`aria-pressed`), and the wrapper `data-mode="3d"|"2d"`.

- [ ] **Step 1: Write the failing tests** (new block in `test_apple.cjs`)

```js
await go('beranda');
const mode=await page.locator('#beranda-hero').getAttribute('data-mode');assert(['3d','2d'].includes(mode));console.log('Beranda hero mode:',mode);
if(mode==='3d'){
 assert.equal(await page.locator('#beranda-hero .peta3d').getAttribute('data-spin'),'off'); // page context uses reducedMotion:'reduce'
 assert.equal(await page.locator('#beranda-hero canvas').evaluate(c=>getComputedStyle(c).touchAction),'pan-y');
 await page.evaluate(()=>document.querySelector('[data-theme-choice=dark]').click());
 assert.equal(await page.locator('#beranda-hero .peta3d').getAttribute('data-built-theme'),'dark');
 await page.evaluate(()=>document.querySelector('[data-theme-choice=light]').click());
 for(let k=0;k<20;k++){await go('peta');await go('beranda');}
 assert.equal(await page.locator('canvas').count(),1);
 assert(!errors.some(e=>/WebGL/.test(e)),'WebGL context leak');
 // handoff: the first region in the hero selects it in Peta risiko
 await page.evaluate(()=>{selected=0;location.hash='#peta';});await page.waitForFunction(()=>document.body.dataset.page==='peta');
 assert(await page.locator('.peta-sel').getAttribute('d'));
}
await go('beranda');await page.locator('#hero-2d').click();
assert.equal(await page.locator('#beranda-hero').getAttribute('data-mode'),'2d');
assert.equal(await page.locator('#beranda-hero path[data-i]').count(),514);
await page.locator('#hero-2d').click();
```

Also add the same run with WebGL forced: at the top of `test_apple.cjs`, read `process.env.EDUSHIELD_GL==='1'` → `launch({...,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})`.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node edushield/test_apple.cjs`
Expected: FAIL because `#beranda-hero` was not found.

- [ ] **Step 3: Implement**

Order inside Beranda: heading (h1 unchanged; `p.sub` shortened to 2 sentences, with the top-20 percentage in `<b class="em">`), action buttons, `#beranda-hero` panel (height 420px desktop, 300px ≤700px; legend for classes I–IV + "tinggi = nilai audit"; `#hero-2d` button), the 4 existing KPI cards in one row (2×2 ≤700px), and "Enam langkah" as numbered cards in 3 columns. Mount it in `queueMicrotask` like `screens/peta.js`. `h(i)` = `heights(D.kab.map(d=>d.audit&&d.audit.A))[i]`, `cls(i)` = the same class function as the Peta screen (move the class lookup to `EduViz.peta.kelas(i)` if it is still private, otherwise reuse it). `select(i)` → `selected=i;location.hash='#peta'`. `tip(i)` → `${nama}, ${prov} · nilai audit ${fmt(A)} siswa · simulasi`. Fallback when `!supported()`, when `mount` throws, or when the 2D toggle is on (state stored in a module variable, not localStorage). Print: `.peta3d{display:none}`, and the KPI cards stay.

- [ ] **Step 4: Run the tests on both paths**

Run: `node edushield/test_apple.cjs` then `EDUSHIELD_GL=1 node edushield/test_apple.cjs`
Expected: both PASS. The second log shows `Beranda hero mode: 3d`.

---

### Task 5: Final verification and before/after screenshots

**Files:**
- Modify: `edushield/README.md` (add `node edushield/test_peta3d.cjs` to the test list; one line about `vendor/three.min.js`)

- [ ] **Step 1: Run the whole suite**

Run: `node edushield/test_app.cjs && node edushield/test_store.cjs && node edushield/test_peta3d.cjs && node edushield/test_apple.cjs && node edushield/test_modes.cjs && node edushield/test_state_icons.cjs && python edushield/test_kkt.py && python edushield/test_geo.py`
Expected: all PASS, `external` empty.

- [ ] **Step 2: Check screenshots**

Open `edushield/verification/final/apple/beranda-1440.png`, `beranda-390.png`, `peta-1440.png`, and `simulator-390.png`. Check: no clipped text, consistent panels, sidebar groups readable. Take one more pair in dark mode for Beranda using `EDUSHIELD_GL=1`.

- [ ] **Step 3: Report to the user**

Summarize the changes, the hero mode on each path, and the list of images for the essay/appendix that need regenerating (`edushield/lampiran/B1_mobile.png`, `paper/output/preview_*.png`). Regenerating them is a separate step after the user approves.
