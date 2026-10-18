import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHmac,webcrypto} from 'node:crypto';
let sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_spooky_multiple_man.sql','utf8'));let DB={prepare(query){return {bind(...args){return {run:async()=>({meta:{changes:sql.prepare(query).run(...args).changes}}),first:async()=>sql.prepare(query).get(...args)??null}}}}};

let calls=[],unknown=false,activePosition=false,existingProtection=false;const product={id:27,symbol:'BTCUSD',contract_type:'perpetual_futures',state:'live',trading_status:'operational',tick_size:'.5',contract_value:'.001',position_size_limit:125000,max_leverage_notional:'100000',initial_margin:'.5',maintenance_margin:'.25'};
async function fetch(url,o={}){let u=new URL(url);calls.push({path:u.pathname,method:o.method,body:o.body});if(u.pathname==='/v2/tickers/BTCUSD')return Response.json({success:true,result:{close:100000,timestamp:Date.now()}});if(u.pathname==='/v2/products/BTCUSD')return Response.json({success:true,result:product});let sig=createHmac('sha256','fake-secret-value').update((o.method??'GET')+o.headers.timestamp+u.pathname+u.search+(o.body??'')).digest('hex');assert.equal(o.headers.signature,sig,'signature mismatch');if(u.pathname==='/v2/positions/margined')return Response.json({success:true,result:activePosition?[{product_id:27,product_symbol:'BTCUSD',size:1,mark_price:'100000',entry_price:'100000'}]:[]});if(u.pathname==='/v2/orders'&&o.method==='GET')return Response.json({success:true,result:existingProtection?[{product_id:27,id:777,bracket_order:true,state:'pending'}]:[],meta:{after:null}});if(u.pathname==='/v2/orders/bracket'&&o.method==='POST'){
  let b=JSON.parse(o.body);
  assert.equal(b.stop_loss_order.order_type,'market_order');
  assert.equal(b.take_profit_order.order_type,'market_order');
  assert.equal(b.stop_loss_order.stop_price,'99000');
  assert.equal(b.take_profit_order.stop_price,'102000');
  assert.equal(b.bracket_stop_trigger_method,'mark_price');
  return Response.json({success:true,result:{id:101}});
}
if(u.pathname==='/v2/fills')return Response.json({success:true,result:[]});if(u.pathname==='/v2/wallet/balances')return Response.json({success:true,result:[{asset_symbol:'USD',available_balance:'123.45',balance:'200'}, {asset_symbol:'BTC',available_balance:'2'}]});if(u.pathname.endsWith('/orders/leverage'))return Response.json({success:true,result:{leverage:1}});if(u.pathname==='/v2/orders'&&o.method==='POST'){if(unknown)throw Error('timeout');let b=JSON.parse(o.body);assert.equal(b.order_type,'limit_order');assert.equal(b.bracket_stop_loss_price,'99000');return Response.json({success:true,result:{id:42,...b,state:'open'}})}throw Error('Unexpected endpoint '+url)}
let c=vm.createContext({TextEncoder,TextDecoder,Response,URL,AbortSignal,crypto:webcrypto,fetch,Uint8Array,Date,JSON,Number,String,Math,Error,Promise});vm.runInContext(fs.readFileSync('trade-monitor.js','utf8')+fs.readFileSync('delta-desk.js','utf8')+'\nthis.handler=deskRoute;',c);let env={DB,TRADE_OWNER_EMAIL:'owner@example.test',TRADE_SESSION_SECRET:'server-only-encryption-key'},cookie='';const req=(route,body,extra={})=>new Request('https://radar.test/api/delta-desk/'+route,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':'owner-id','oai-authenticated-user-email':'owner@example.test',origin:'https://radar.test','content-type':'application/json',cookie,...extra},body:body?JSON.stringify(body):undefined});
assert.equal((await c.handler(req('connect',{key:'fake-api-key',secret:'fake-secret-value'},{origin:'https://evil.test'}),env)).status,403);assert.equal((await c.handler(req('account',undefined,{'oai-authenticated-user-id':''}),env)).status,403);
let response=await c.handler(req('connect',{key:'fake-api-key',secret:'fake-secret-value',trading:true}),env);assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];assert(!sql.prepare('SELECT cipher FROM trade_sessions').get().cipher.includes('fake-secret'));let account=await (await c.handler(req('account'),env)).json();assert.deepEqual(account.wallets,[{asset:'USD',available:123.45,total:200}]);
let body={action:'open',symbol:'BTCUSD',entry:100000,stop:99000,target:102000,contracts:1,side:'buy',leverage:1};let bad=await c.handler(req('review',{...body,stop:100001}),env);assert.equal(bad.status,400);let r=await (await c.handler(req('review',body),env)).json();assert(r.id);let pair=await Promise.all([c.handler(req('submit',{id:r.id,confirm:true}),env),c.handler(req('submit',{id:r.id,confirm:true}),env)]);assert.deepEqual(pair.map(x=>x.status).sort(),[200,409]);assert.equal(calls.filter(x=>x.path==='/v2/orders'&&x.method==='POST').length,1);
activePosition=true;
let protectReview=await (await c.handler(req('review',{action:'protect',symbol:'BTCUSD',stop:99000,target:102000}),env)).json();
assert.ok(protectReview.id,'position bracket is reviewable');
let protectSubmit=await (await c.handler(req('submit',{id:protectReview.id,confirm:true}),env)).json();
assert.equal(protectSubmit.accepted,true);
assert.equal(calls.filter(x=>x.path==='/v2/orders/bracket'&&x.method==='POST').length,1);
existingProtection=true;
let overlap=await c.handler(req('review',{action:'protect',symbol:'BTCUSD',stop:99000,target:102000}),env);
assert.equal(overlap.status,400,'no silent replacement of existing brackets');
assert.match((await overlap.json()).error,/already has active/i);
assert.equal(calls.filter(x=>x.path==='/v2/orders/bracket'&&x.method==='PUT').length,0);
existingProtection=false;activePosition=false;
unknown=true;r=await (await c.handler(req('review',body),env)).json();let fail=await (await c.handler(req('submit',{id:r.id,confirm:true}),env)).json();assert.equal(fail.status,'unknown');assert.equal((await c.handler(req('review',body),env)).status,400);await c.handler(req('disconnect',{}),env);assert.equal((await c.handler(req('account'),env)).status,401);
c.fetch=async()=>Response.json({success:false,error:{code:'ip_not_whitelisted_for_api_key',message:'request from 2001:db8::1'}},{status:403});let blocked=await (await c.handler(req('connect',{key:'fake-api-key',secret:'fake-secret-value'}),env)).json();assert.match(blocked.error,/2001:db8::1/);assert.doesNotMatch(blocked.error,/hosted site/);
c.fetch=async()=>Response.json({error:'UnauthorizedApiAccess'},{status:403});let denied=await (await c.handler(req('connect',{key:'fake-api-key',secret:'fake-secret-value'}),env)).json();assert.match(denied.error,/Trading permission/);
console.log('PASS: owner/CSRF, encrypted sessions, exact HMAC, reviewed orders, duplicate prevention, IP/permission diagnostics and disconnect');
for(const timestamp of [undefined,Date.now()-16000,Date.now()+5000]){
 c.fetch=async()=>Response.json({result:{close:100000,timestamp}});
 await assert.rejects(vm.runInContext("requireFreshQuote('delta','BTCUSD')",c),/stale/);
}
c.fetch=async()=>Response.json({result:{close:100000,timestamp:Date.now()*1000}});
assert.equal((await vm.runInContext("requireFreshQuote('delta','BTCUSD')",c)).price,100000);
console.log('PASS server quote gate: missing, stale and future timestamps blocked; microsecond timestamps normalized');
c.fetch=async(url,o)=>url.includes('/v2/tickers/')?Response.json({success:true,result:{close:98000,timestamp:Date.now()}}):fetch(url,o);
await assert.rejects(()=>c.prepareDelta({key:'fake-api-key',secret:'fake-secret-value'},body),/crossed your stop/);
c.fetch=async(url,o)=>url.includes('/v2/positions/')?Response.json({success:true,result:{unexpected:[]}}):fetch(url,o);
await assert.rejects(()=>c.prepareDelta({key:'fake-api-key',secret:'fake-secret-value'},body),/Position response unavailable/);
console.log('PASS Delta: crossed stop and malformed positions block order preparation');
