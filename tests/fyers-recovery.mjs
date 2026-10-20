import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';

const now=Date.parse('2026-10-13T08:00:00Z');
class Clock extends Date{static now(){return now}}
const hourly=Array.from({length:21},(_,i)=>[(now-(21-i)*3600000)/1000,100,101,99,100,10]);
hourly.at(-1).splice(1,5,100.5,102,100,101.8,30);
let mode='partial',active=0,peak=0;const calls=[];
const context=vm.createContext({setTimeout:(fn)=>setImmediate(fn),TextEncoder,TextDecoder,Uint8Array,Date:Clock,crypto:webcrypto,Response,Request,URL,URLSearchParams,AbortSignal,fetch:async(url,options)=>{
 const u=new URL(url);calls.push({path:u.pathname,method:options.method});
 assert.equal(u.origin,'https://api-t1.fyers.in');assert.equal(options.method,'GET');
 active++;peak=Math.max(active,peak);await new Promise(r=>setImmediate(r));active--;
 if(mode==='null')return Response.json(null);
 if(u.pathname==='/data/history'){
  if(u.searchParams.get('resolution')==='240')return Response.json({s:'error',code:-1},{status:503});
  return Response.json({s:'ok',candles:hourly});
 }
 if(u.pathname==='/data/quotes')return Response.json({s:'ok',d:[{s:'ok',n:'NSE:WRONG-EQ',v:{lp:999999,tt:now/1000}},...(mode==='missingQuote'?[]:[{s:'ok',n:'NSE:RELIANCE-EQ',v:{lp:101.8,tt:now/1000}}])]});
 if(u.pathname.endsWith('/positions'))return Response.json({s:'ok',netPositions:null});
 if(u.pathname.endsWith('/tradebook'))return Response.json({s:'ok',tradeBook:[null]});
 const fields={orders:'orderBook',funds:'fund_limit',holdings:'holdings'};const name=u.pathname.split('/').at(-1);
 return Response.json({s:'ok',[fields[name]]:[]});
}});
vm.runInContext(fs.readFileSync('delta-desk.js','utf8')+'\n'+fs.readFileSync('fyers.js','utf8'),context);
const cipher=await context.seal({appId:'FAKEAPP-100',token:'fake-token'},'test-secret');
const env={TRADE_OWNER_EMAIL:'owner@test',TRADE_SESSION_SECRET:'test-secret',DB:{prepare(){return {bind(){return {first:async()=>({cipher})}}}}}};
const request=(route,body)=>new Request('https://radar.test/api/fyers/'+route,{method:body===undefined?'GET':'POST',headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@test',origin:'https://radar.test','content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
let response=await context.fyersRoute(request('scan?symbol=NSE:RELIANCE-EQ'),env),data=await response.json();
assert.equal(response.status,200);assert.equal(data.partial,true);assert.equal(data.candles.length,21);
assert.equal(data.quote.symbol,'NSE:RELIANCE-EQ');assert.equal(data.quote.price,101.8);
assert.equal(data.results.find(r=>r.strategy==='1H volume breakout').status,'Confirmed','independent 1H evidence remains usable');
assert.equal(data.results.find(r=>r.strategy==='4H 200 EMA consolidation').status,'Unavailable');
assert.equal(data.results.find(r=>r.strategy==='Golden / death cross').status,'Unavailable');
assert.equal(peak,1,'data calls are sequential and paced');
mode='missingQuote';data=await (await context.fyersRoute(request('scan?symbol=NSE:RELIANCE-EQ'),env)).json();
assert.equal(data.quote.valid,false);assert.equal(data.quote.price,null);assert.ok(data.errors.some(e=>/requested instrument/.test(e)));
assert.notEqual(data.results[0].status,'Confirmed','wrong-symbol quotes cannot confirm an otherwise valid breakout');
data=await (await context.fyersRoute(request('account'),env)).json();
assert.equal(data.positions,null);assert.equal(data.tradebook,null);assert.deepEqual(data.funds.fund_limit,[]);assert.equal(data.errors.length,2);
assert.match(data.errors.join(' '),/invalid positions list/);
mode='null';await assert.rejects(()=>context.fyersCall({appId:'FAKEAPP-100',token:'fake-token'},'/data/quotes'),/invalid response/);
assert.equal((await context.fyersRoute(request('setup',null),env)).status,400);
assert.equal(context.equityClosedBars([null,{},hourly[0]],'60',now,true).length,1);
console.log('PASS FYERS partial-history recovery, sequential data pacing, exact-symbol quote confirmation, malformed account isolation and invalid JSON handling; no real network or orders');
