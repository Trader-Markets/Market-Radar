import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectLocalServer,LOCAL_BUILD} from '../local-startup.mjs';
let reads=0;
assert.equal((await inspectLocalServer(8787,{probe:async()=>false,read:async()=>{reads++}})).state,'free');assert.equal(reads,0);
for(const response of [new Response('Not found',{status:404}),Response.json({app:'market-radar',build:'old',telegramSetup:false}),Response.json({app:'other',build:LOCAL_BUILD,telegramSetup:true})]){const r=await inspectLocalServer(8787,{probe:async()=>true,read:async()=>response});assert.equal(r.state,'occupied');assert.match(r.message,/OLD Market Radar terminal/);assert.match(r.message,/Do not just close the browser/)}
assert.equal((await inspectLocalServer(8787,{probe:async()=>true,read:async()=>{throw Error('timeout')}})).state,'occupied');
assert.equal((await inspectLocalServer(8787,{probe:async()=>true,read:async()=>Response.json({app:'market-radar',build:LOCAL_BUILD,telegramSetup:true})})).state,'current');
const server=fs.readFileSync('local-trading.mjs','utf8');assert.ok(server.indexOf('await inspectLocalServer(port)')<server.indexOf('const saved=createLocalStore'));assert.match(server,/process\.exit\(23\)/);assert.match(fs.readFileSync('Start Market Radar.cmd','utf8'),/goto start_radar/);
const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4),lum=h=>rgb(h).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);for(const bg of ['624082','4d2f6a'])assert.ok((1.05)/(lum(bg)+.05)>4.5);
const html=fs.readFileSync('dist/index.html','utf8');assert.match(html,/#telegramNews \.telegram-primary:visited/);assert.match(html,/background:#624082;color:#fff/);
console.log('PASS old server 404/version conflicts, unreachable/busy ports, current-server reuse, pre-database guard, retry launcher and button contrast');
