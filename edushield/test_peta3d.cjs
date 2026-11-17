const assert=require('assert');global.window={EduViz:{}};require('./app/geo.js');require('./app/viz/peta3d.js');
const P=window.EduViz.peta3d,paths=Object.values(window.EDU_GEO.paths);
assert.deepEqual(P.heights([4,null,16,NaN,-1]),[0.5,0,1,0,0]);
assert.deepEqual(P.heights([0,0]),[0,0]);
assert.equal(paths.length,514);
for(const d of paths){const r=P.rings(d);assert.equal(r.length,(d.match(/M/g)||[]).length);assert(r.every(x=>x.length>=3&&x.every(([a,b])=>Number.isFinite(a)&&Number.isFinite(b))));}
console.log('PASS peta3d rings/heights');
