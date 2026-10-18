import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createLocalStore} from '../local-store.mjs';
import worker from '../dist/server/index.js';
const dir=mkdtempSync(resolve('.demo-test-'));let store=createLocalStore(dir),version=0;
const env=()=>({DB:store.DB,TRADE_OWNER_EMAIL:'owner@test.invalid'});
async function call(body,owner='owner',origin='http://localhost'){const r=await worker.fetch(new Request('http://localhost/api/demo',{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'owner@test.invalid',origin,'content-type':'application/json'},body:body?JSON.stringify({version,...body}):undefined}),env()),d=await r.json();if(r.ok)version=d.version;return {r,d}}
let price=100,age=0,failed=false;const originalFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{assert.equal(options.method,undefined);assert.match(url,/^https:\/\/api\.(india.delta.exchange\/v2\/tickers|sharkexchange.in\/v1\/market\/ticker24Hr)\//);if(failed)throw Error('Feed offline');return Response.json(url.includes('delta')?{result:{close:price,timestamp:(Date.now()-age)*1000}}:{c:price,E:Date.now()-age})};
const order={action:'open',requestId:'demo-order-001',exchange:'delta',symbol:'BTCUSD',currency:'USD',entry:100,stop:95,target:110,units:10,side:1,leverage:2};
try{
 assert.equal((await call()).d.state.cash.USD,10000);
 assert.equal((await call(order,'owner','https://evil.test')).r.status,403);
 assert.equal((await call({...order,units:1e7})).r.status,400);
 let first=await call(order);assert.equal(first.d.state.positions.length,1);assert.equal(first.d.state.cash.USD,9999);
 assert.equal((await call(order)).d.state.positions.length,1,'idempotent retry');
 assert.equal((await call({...order,requestId:'stale-version',version:0})).r.status,200,'stale browser version safely rebases');await call({action:'close',id:'stale-version'});
 store.close();store=createLocalStore(dir);assert.equal((await call()).d.state.positions[0].id,order.requestId,'restart persists positions');
 assert.equal((await call(undefined,'another-user')).d.state.positions.length,0,'owner isolation');await call();
 age=16000;assert.equal((await call({action:'close',id:order.requestId})).r.status,422);age=0;price=105;
 let close=await call({action:'close',id:order.requestId,exchange:'delta',symbol:'BTCUSD',price:105,at:Date.now()});assert.equal(close.d.state.positions.length,0);assert.equal(close.d.state.history[0].pnl,47.95);assert.equal(close.d.state.cash.USD,10045.95);price=100;
 await call({...order,requestId:'demo-short-002',side:-1,stop:105,target:90});
 price=89;let mark=await call({action:'sync'});assert.equal(mark.d.state.positions.length,0);assert.equal(mark.d.state.history[0].reason,'Target observed');assert.equal(mark.d.state.history[0].pnl,108.11);
 price=100;await call({...order,requestId:'demo-stop-003'});price=93;let stopped=await call({action:'sync'});assert.equal(stopped.d.state.history[0].exit,93,'stop gap uses observed price, not ideal stop');assert.equal(stopped.d.state.history[0].reason,'Stop observed');
 price=100;let concurrent=await Promise.all(['concurrent-001','concurrent-002'].map(requestId=>call({...order,requestId})));assert.ok(concurrent.every(x=>x.r.ok));assert.equal((await call()).d.state.positions.length,2);
 failed=true;let partial=await call({action:'sync'});assert.equal(partial.d.state.positions.length,2);assert.equal(partial.d.errors.length,1);assert.equal((await call({...order,requestId:'failed-quote-001'})).r.status,422);failed=false;
 await call({...order,requestId:'shark-order-001',exchange:'shark',symbol:'BTCINR',currency:'INR'});price=111;let all=await call({action:'sync'});assert.equal(all.d.state.positions.length,0,'all coins updated independent of chart');assert.equal((await call({action:'close',id:'shark-order-001'})).d.alreadyClosed,true);
 assert.equal((await call({...order,requestId:'bad-entry-001',entry:1})).r.status,400);
 console.log('PASS demo: long/short, funds, fees, P&L, margin, close, gaps, stale quotes, dedup, concurrency, owner isolation and restart persistence; public quotes only; no exchange order requests');
}finally{globalThis.fetch=originalFetch;store.close();rmSync(dir,{recursive:true,force:true})}
