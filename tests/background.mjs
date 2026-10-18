import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {resolve} from 'node:path';import {createLocalStore} from '../local-store.mjs';import worker from '../dist/server/index.js';
const dir=mkdtempSync(resolve('.background-test-')),store=createLocalStore(dir),original=globalThis.fetch;
const env={DB:store.DB,TRADE_OWNER_EMAIL:'owner@test.invalid',BACKGROUND_SERVICE_ENABLED:'true'};
const call=async(path,body,headers={})=>{let r=await worker.fetch(new Request('https://radar.test'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined}),env);return {r,d:await r.json()}};
try{
 assert.equal((await call('/api/background')).r.status,403);
 const headers={origin:'https://radar.test','oai-authenticated-user-id':'owner','oai-authenticated-user-email':env.TRADE_OWNER_EMAIL};
 assert.equal((await call('/api/background',{enabled:true,watchlist:[{exchange:'delta',symbol:'BTCUSD'}]},headers)).r.status,200);
 let calls=0;globalThis.fetch=async(url)=>{calls++;let u=new URL(url),tf=u.searchParams.get('resolution'),sec={'1h':3600,'4h':14400,'1d':86400}[tf],end=Math.floor(Date.now()/1000/sec)*sec;return Response.json({result:Array.from({length:tf==='1d'?997:330},(_,i)=>({time:end-(330-i)*sec,open:100,high:101,low:99,close:100,volume:100}))})};
 let scan=await call('/api/background/run',{deliver:false});assert.equal(scan.r.status,200);assert.ok(scan.d.completedAt);assert.equal(scan.d.scope.length,1);assert.equal(calls,3);assert.equal((await call('/api/background/run',{deliver:false})).d.alreadyScanned,true);assert.equal(calls,3,'same hour cannot rescan');
 assert.equal((await call('/api/background',null,headers)).d.last.completedAt,scan.d.completedAt);
 assert.equal((await call('/api/background/run',{}, {origin:'https://evil.test'})).r.status,403);
 env.BACKGROUND_SERVICE_ENABLED='false';assert.equal((await call('/api/background/run',{})).r.status,403);
 console.log('PASS background: private service gate, owner settings, same-origin writes, unattended public-source scan, durable results and hourly dedup; no messages sent');
}finally{globalThis.fetch=original;store.close();rmSync(dir,{recursive:true,force:true})}
