import {parseHTML} from 'linkedom';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const {window,document}=parseHTML(fs.readFileSync('dist/index.html','utf8'));
// A DOM integration check with network and timers isolated; it submits no orders.
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??''},set(v){this._value=String(v)}});
Object.defineProperty(window.HTMLSelectElement.prototype,'options',{get(){return [...this.querySelectorAll('option')]}});
for(let el of document.querySelectorAll('input'))if(!el.value)el.value=el.getAttribute('value')??'';
const context=vm.createContext({window,document,console,Date,Math,Number,String,Intl,JSON,Map,Set,Promise,Array,AbortSignal,URL,URLSearchParams,localStorage:{getItem:()=>null,setItem:()=>{}},setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,clearTimeout:()=>{},queueMicrotask:()=>{},fetch:async()=>{throw Error('Network isolated in DOM test')},location:{hostname:'localhost',origin:'http://localhost'},navigator:{},ResizeObserver:class{observe(){}},requestAnimationFrame:()=>0});
for(let f of ['customer-flow','signals','custom-alert-rules']){vm.runInContext(fs.readFileSync('dist/'+f+'.js','utf8'),context);const names={'customer-flow':'CustomerFlow',signals:'StrategySignals','custom-alert-rules':'CustomAlertRules'};context[names[f]]=window[names[f]];}
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
// Switching setup tools preserves controls and shows exactly one readable section.
const setupButtons=[...document.querySelectorAll('[data-setup-view]')];
assert.equal(setupButtons.length,6);
for(const button of setupButtons){
 button.click();
 assert.equal(document.querySelectorAll('.setup-section:not(.hide)').length,1);
 assert.equal(button.getAttribute('aria-current'),'page');
}
document.querySelector('[data-setup-view="custom"]').click();
assert.equal(document.getElementById('customAlertPanel').classList.contains('hide'),false);
assert.ok(document.getElementById('runStrategy').closest('#setupScanner'));
document.querySelector('[data-setup-view="scanner"]').click();
assert.ok(document.getElementById('simpleTrade').closest('.trade-workspace'));
assert.ok(document.getElementById('deltaSettings').closest('#settingsView'));
assert.ok(document.getElementById('sharkSettings').closest('#settingsView'));
assert.equal(document.getElementById('exchangeLevels'),null);
assert.ok(document.getElementById('priceChart').closest('.chart-panel'));
assert.ok(document.querySelector('.tv-reference #tvAdvanced'));
assert.equal(document.querySelectorAll('.chart-picking button').length,3);
assert.equal(document.getElementById('chartView').classList.contains('hide'),false);
assert.equal(document.getElementById('ticketAction').disabled,true);
assert.ok(!document.getElementById('apiView').textContent.includes('null'));
vm.runInContext("tab('settings')",context);
assert.equal(document.getElementById('settingsView').classList.contains('hide'),false);
vm.runInContext("tab('chart')",context);
vm.runInContext(`
chartData={t:{exchange:'delta',symbol:'BTCUSD',quote:'USD'},mode:'scalp',rules:{choices:[1,2,5]},allH:[{close:100}],h:[],f:[],d:[]};
customerDraft=CustomerFlow.edit(CustomerFlow.create('delta','BTCUSD'),{entry:100,stop:95,target:110,side:1});
customerFillTicket();
let drawn=[];
tvCandles={createPriceLine:o=>{drawn.push(o);return o},removePriceLine:o=>{drawn=drawn.filter(x=>x!==o)},coordinateToPrice:y=>y};
customerPaintDraft();
if(drawn.length!==3)throw Error('Draft must draw entry, stop and target');
customerPickField='ticketTarget';
let clickHandler;
tvChart={subscribeClick:f=>clickHandler=f};customerBindChart();clickHandler({point:{y:120}});
if(customerDraft.target!==120&&+customerDraft.target!==120)throw Error('Chart click did not update target');
if(drawn.length!==3||!drawn.some(x=>x.price===120))throw Error('Chart drawings did not update');
let acceptedContext={exchange:'delta',symbol:'BTCUSD',action:'open',revision:customerDraft.revision};
customerOrderAccepted(acceptedContext);
if(drawn.length!==0||$('ticketEntry').value!=='')throw Error('Accepted order did not clear draft');
customerChartReady();
if(!customerDraft.cleared)throw Error('Reload resurrected an accepted plan');
demoState={cash:{USD:10000,INR:10000,USDT:10000},positions:[],history:[]};$('customerPractice').checked=true;$('customerPractice').dispatchEvent(new window.Event('change'));
if(!ticketDemo||$('ticketLeverage').value!=='2'||ticketFunds().currency!=='USD')throw Error('Practice mode must use selected coin quote and 2x leverage');
$('customerPractice').checked=false;$('customerPractice').dispatchEvent(new window.Event('change'));
if(ticketDemo)throw Error('Practice mode could not be disabled');
chartData=null;customerUpdateStatus();
`,context);
vm.runInContext(`
mountAdvancedChart({exchange:'delta',symbol:'ETHUSD'});
if(!$('openTradingView').getAttribute('href').includes('DELTAIN%3AETHUSD.P'))throw Error('Collapsed chart failed to update external TradingView link: '+$('openTradingView').getAttribute('href'));
mountAdvancedChart({exchange:'shark',symbol:'BTCINR'});
if(!$('openTradingView').getAttribute('href').includes('BTCUSDT.P'))throw Error('Switching exchanges did not update external link');
let widget=document.querySelector('#tvAdvanced script');let settings=JSON.parse(widget.textContent);
if(settings.hide_top_toolbar||settings.hide_side_toolbar||settings.hide_legend||!settings.withdateranges)throw Error('TradingView controls are hidden');
if(settings.allow_symbol_change)throw Error('Embedded chart can diverge from the selected order coin');
if(!document.querySelector('.tv-reference').open)throw Error('Main chart is collapsed');
if(!document.querySelector('.tv-reference').compareDocumentPosition($('priceChart')))throw Error('Chart order missing');
let expand=[...document.querySelectorAll('.tv-toolbar button')].find(b=>b.textContent==='Expand chart');
expand.dispatchEvent(new window.Event('click'));if(!document.querySelector('.chart-panel').classList.contains('chart-expanded'))throw Error('Expand chart failed');
expand.dispatchEvent(new window.Event('click'));if(document.querySelector('.chart-panel').classList.contains('chart-expanded'))throw Error('Exit expanded chart failed');
renderScanIssues([{symbol:'TESTUSD',reason:'Candle feed is stale'}]);
if(!$('scanIssues').textContent.includes('TESTUSD')||!$('scanIssues').textContent.includes('stale'))throw Error('Scan failure lost coin or reason');
renderScanIssues([]);if(!$('scanIssues').classList.contains('hide'))throw Error('Successful retry did not clear diagnostics');
`,context);
await vm.runInContext(`(async()=>{
let attempts=0,original=scanPair;
scanPair=async()=>{attempts++;if(attempts===1)throw Error('HTTP 429');return {symbol:'RECOVERED'}};
let recovered=await scanWithRetry({symbol:'RECOVERED'});
if(attempts!==2||recovered.symbol!=='RECOVERED')throw Error('Temporary scan error was not retried');
attempts=0;scanPair=async()=>{attempts++;throw Error('Candle history has gaps')};
try{await scanWithRetry({symbol:'GAPPED'});throw Error('Invalid history was accepted')}catch(e){if(attempts!==1||e.message!=='Candle history has gaps')throw e}
scanPair=original;
})()`,context);
vm.runInContext(`
let now=Math.floor(Date.now()/3600000)*3600000;
let history=Array.from({length:75},(_,i)=>({time:(now-(75-i)*3600000)/1000,open:100,high:101,low:99,close:100,volume:100}));
if(normalized({result:history},'delta','1h').length!==75)throw Error('Valid closed history rejected');
history.splice(4,1);
try{normalized({result:history},'delta','1h');throw Error('Older candle gap was missed')}catch(e){if(e.message!=='Candle history has gaps')throw e}
`,context);
vm.runInContext(`
if(setupState({cross:{time:0},plans:{cross:{confirmed:true}}},'cross',18000001).kind!=='expired')throw Error('Expired crossover mislabeled as confirmed');
if(setupState({ema:{time:0},plans:{ema:null}},'ema',0).label!=='Watch only')throw Error('No-entry consolidation mislabeled as forming trade');
if(setupState({plans:{scalp:{confirmed:true}}},'scalp',0).kind!=='confirmed')throw Error('Confirmed setup label incorrect');
if(setupState({plans:{breakout:{confirmed:false}}},'breakout',0).kind!=='forming')throw Error('Forming setup label incorrect');
`,context);
await new Promise(resolve=>setImmediate(resolve));
console.log('PASS customer page: complete startup, one chart/ticket, settings relocation, chart picking, navigation and empty-plan order guard');
// Exercise real asynchronous handlers with controlled responses; no exchange calls.
await vm.runInContext(`(async()=>{
for(let ex of ['delta','shark']){
 let original=ex==='delta'?deskRequest:sharkRequest,resolveAccount;
 let request=async route=>route==='account'?new Promise(resolve=>resolveAccount=resolve):{connected:false};
 if(ex==='delta'){deskRequest=request;accountBusy=false;deltaConnected=true}else{sharkRequest=request;sharkBusy=false;sharkConnected=true}
 let pending=(ex==='delta'?refreshDelta:refreshShark)();
 $('disconnect'+(ex==='delta'?'Delta':'Shark')).dispatchEvent(new window.Event('click'));
 await Promise.resolve();await Promise.resolve();
 resolveAccount({trading:true,asOf:Date.now(),positions:[],orders:[],fills:[],trades:[],wallets:[],errors:[]});await pending;
 if(ex==='delta'?(deltaConnected||deltaAccount):(sharkConnected||sharkAccount))throw Error('Late '+ex+' response restored disconnected account');
 if(ex==='delta')deskRequest=original;else sharkRequest=original;
}
let originals={candles,dailyContext,renderChart,invalidateHistory};
let boundary=Math.floor(Date.now()/3600000)*3600000;
let closed=[{time:boundary-7200000,close:100},{time:boundary-3600000,close:101}],forming={time:boundary,close:102};
chartData={t:{exchange:'delta',symbol:'BTCUSD'},mode:'scalp',h:[closed[0]],f:[closed[0]],allH:[closed[0],forming],allF:[closed[0]]};
candles=async()=>closed;dailyContext=async()=>({bars:[],error:null});renderChart=()=>{};invalidateHistory=()=>{};closedBusy=false;
await refreshClosed();if(chartData.allH.length!==3||chartData.allH[1].close!==101||chartData.allH[2]!==forming)throw Error('Fallback refresh did not merge closed and forming candles');
({candles,dailyContext,renderChart,invalidateHistory}=originals);chartData=null;
let oldApply=applyPrice,priceUpdates=0;applyPrice=()=>priceUpdates++;
let good={time:boundary,open:100,high:101,low:99,close:100,volume:1};
applyCandle('delta','BTCUSD','1h',{...good,high:99},Date.now());
applyCandle('delta','BTCUSD','1h',good,Date.now()+2000);
applyCandle('delta','BTCUSD','1h',{...good,volume:-1},Date.now());
applyCandle('delta','BTCUSD','1h',{...good,time:boundary+1},Date.now());
if(priceUpdates)throw Error('Invalid live candle updated the quote');
applyCandle('delta','BTCUSD','1h',good,Date.now());if(priceUpdates!==1)throw Error('Valid live candle rejected');applyPrice=oldApply;
customerDraft=CustomerFlow.edit(CustomerFlow.create('delta','BTCUSD'),{entry:100,stop:95,target:110,side:1});
chartData={t:{exchange:'delta',symbol:'BTCUSD',quote:'USD'}};$('chartCoin').value='BTCUSD';ticketRules={tick:.5};
deltaConnected=true;deltaAccount={asOf:Date.now()};receivedAt=Date.now();lastSourceAt=Date.now()-16000;
if(!customerTradeGate()?.includes('stale'))throw Error('Old source price passed a new receipt timestamp');
customerReviewContexts.delta={exchange:'delta',symbol:'BTCUSD',action:'open',revision:customerDraft.revision-1};reviewId='review-test';
let requestBefore=deskRequest,submitCalls=0;deskRequest=async()=>{submitCalls++;return {accepted:true}};
$('confirmReview').dispatchEvent(new window.Event('click'));await Promise.resolve();
if(submitCalls||!$('reviewStatus').textContent.includes('plan changed'))throw Error('Changed review submitted an order');
deskRequest=requestBefore;reviewId=null;chartData=null;deltaConnected=false;deltaAccount=null;
})()`,context);
console.log('PASS asynchronous feature paths: disconnect races, candle merging, malformed live feed and stale/changed review guards');

vm.runInContext(`if(mergeClosedBars([{time:100}], [{time:200},{time:300}],100,400).length!==3)throw Error('Server lag erased newer streamed candles');`,context);

await vm.runInContext(`(async()=>{
 deltaReconnect=true;deltaConnected=false;accountBusy=false;
 deskRequest=async()=>{throw Error('Temporary network failure')};await refreshDelta();
 if(!deltaReconnect)throw Error('Startup failure must keep recovery enabled');
 deskRequest=async()=>({connected:true,trading:false,asOf:Date.now(),errors:[],positions:[],orders:[],fills:[],wallets:[]});
 await refreshDelta();if(!deltaConnected)throw Error('Saved connection failed to recover');
 deskRequest=async()=>({connected:false});$('disconnectDelta').click();await Promise.resolve();await Promise.resolve();
 if(deltaReconnect)throw Error('Explicit disconnect must stop recovery');
 if(!$('waSave')||!$('waTest')||!$('waPause'))throw Error('WhatsApp settings missing');
})()`,context);
console.log('PASS connection recovery: initial failure retries, recovery succeeds, explicit disconnect stops; WhatsApp controls mount');
await vm.runInContext(`(async()=>{
 sharkReconnect=true;sharkConnected=false;sharkBusy=false;sharkRequest=async()=>{throw Error('Temporary network failure')};await refreshShark();if(!sharkReconnect)throw Error('Shark startup retry disabled');
 sharkRequest=async()=>({trading:false,asOf:Date.now(),positions:[],orders:[],trades:[],wallets:[]});await refreshShark();if(!sharkConnected)throw Error('Shark did not recover');
 sharkRequest=async()=>{throw Error('Timeout')};await refreshShark();if(sharkAccount.asOf!==0)throw Error('Failed account refresh left fresh balance');
 let now=Date.now();if(tickerSourceTime({timestamp:now*1000},'delta')!==now||tickerSourceTime({},'delta')!==0)throw Error('Ticker timestamp parsing failed');
 chartData={t:{exchange:'delta',symbol:'BTCUSD'},lastPrice:100};lastSourceAt=0;receivedAt=0;applyPrice('delta','BTCUSD',100,0,'bad');if(receivedAt)throw Error('Untimed quote accepted');
 chartData=null;
})()`,context);
console.log('PASS Shark recovery, immediate stale account invalidation and untimed market quote rejection');
// Submit the actual demo button through the Worker and durable SQLite adapter.
const {createLocalStore}=await import('../local-store.mjs');const {webcrypto}=await import('node:crypto');const {default:worker}=await import('../dist/server/index.js');
const demoDir=fs.mkdtempSync('/tmp/radar-dom-demo-'),demoStore=createLocalStore(demoDir);context.crypto=webcrypto;context.Event=window.Event;
let realOrderCalls=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({result:{close:100,timestamp:Date.now()*1000}});
context.fetch=async(path,options={})=>{if(path!=='/api/demo'){realOrderCalls++;throw Error('Unexpected network route '+path)}return worker.fetch(new Request('http://localhost'+path,{...options,headers:{...options.headers,origin:'http://localhost','oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@test.invalid'}}),{DB:demoStore.DB,TRADE_OWNER_EMAIL:'owner@test.invalid'})};
try{
 await vm.runInContext(`(async()=>{await refreshDemo();chartData={t:{exchange:'delta',symbol:'BTCUSD',quote:'USD'},mode:'scalp',lastPrice:100,rules:null,allH:[{close:100}],h:[],f:[],d:[]};$('chartCoin').value='BTCUSD';customerDraft=CustomerFlow.edit(CustomerFlow.create('delta','BTCUSD'),{entry:100,stop:95,target:110,side:1});customerFillTicket();ticketDemo=true;$('ticketLeverage').value='2';$('ticketAmount').value='1000';refreshTicket();customerUpdateStatus();if($('ticketAction').disabled)throw Error('Demo submit disabled: '+$('ticketAction').title);$('ticketAction').click()})()`,context);
 await vm.runInContext(`demoQueue`,context);await new Promise(resolve=>setImmediate(resolve));
 vm.runInContext(`if(demoState.positions.length!==1)throw Error('Demo button did not save a position');if(!$('demoRows').textContent.includes('BTCUSD'))throw Error('Saved position not visible');if($('ticketEntry').value!=='')throw Error('Demo accepted without clearing draft');`,context);

 await vm.runInContext(`(async()=>{
 customerChartReady();if($('ticketEntry').value!=='')throw Error('Cleared demo draft resurrected');
 tab('api');if($('demoPanel').parentElement!==$('apiView'))throw Error('Demo positions missing from My Positions');
 chartData=null;let close=$('demoRows').querySelector('[data-demo-close]');if(close.disabled)throw Error('Close requires selected chart');close.click();await demoQueue;
 if(demoState.positions.length||demoState.history.length!==1)throw Error('Close without chart failed');
 setTicketMode(false);if($('tradePractice').checked||$('customerPractice').checked)throw Error('Real mode toggles out of sync');
 setTicketMode(true);if(!$('tradePractice').checked||!$('customerPractice').checked)throw Error('Demo mode toggles out of sync');
 let original=demoFetch;demoFetch=async()=>{throw Error('Temporary demo failure')};await refreshDemo();renderDemo();if(!$('demoError').textContent.includes('Temporary demo failure'))throw Error('Demo error disappeared');
 demoFetch=original;await refreshDemo();if(demoError||demoBusy)throw Error('Demo failed to recover');
 demoAccept({state:{...demoState,positions:[{id:'old'}]},version:demoVersion-1});if(demoState.positions.length)throw Error('Old response overwrote state');
 })()`,context);
 assert.equal(realOrderCalls,0,'demo button must never use exchange order routes');
 console.log('PASS actual demo button -> durable route -> displayed position -> cleared draft, without exchange requests');
}finally{globalThis.fetch=originalFetch;demoStore.close();fs.rmSync(demoDir,{recursive:true,force:true})}

vm.runInContext(`
if(!accountReady({positions:[],orders:[],wallets:[{asset:'USD',available:100}],errors:['fills: temporarily unavailable']}))throw Error('History outage must not disable a verified trading account');
if(accountReady({positions:null,orders:[],wallets:[{asset:'USD',available:100}],errors:[]}))throw Error('Missing positions must block trades');
if(accountReady({positions:[],orders:[],wallets:[],errors:[]}))throw Error('Missing wallet must block trades');
let reviewSnapshot=reviewTicketSnapshot();$('ticketAmount').value='12345';
if(customerReviewGate({action:'open',ticket:reviewSnapshot})?.includes('Amount')!==true)throw Error('Changed quantity must invalidate review');
`,context);
console.log('PASS optional history failures and amount/leverage review invalidation');
await vm.runInContext(`(async()=>{
 for(let ex of ['delta','shark']){
  let dialog=$(ex==='delta'?'orderReview':'sharkReview'),cancel=$(ex==='delta'?'cancelReview':'sharkReviewBack');dialog.showModal=()=>{dialog.open=true};dialog.close=()=>{dialog.open=false};
  let resolveReview,request=()=>new Promise(r=>resolveReview=r);if(ex==='delta')deskRequest=request;else sharkRequest=request;
  let running=(ex==='delta'?reviewAction:reviewSharkAction)({action:'cancel',symbol:'BTCUSD'});cancel.click();resolveReview({id:'cancelled-review',summary:{}});await running;
  if(ex==='delta'?reviewId!==null:sharkReviewId!==null)throw Error('Cancelled review was restored by a late response');
 }
 let old=scanId;$('cancelScan').click();if(scanId<=old||$('runStrategy').disabled)throw Error('Stop scan did not release the controls');
 let pending={quality:{},plans:{scalp:{confirmed:true}},scalp:{time:Date.now(),tf:'1h'}};let state=setupState(pending,'scalp');if(state.kind!=='confirmed'||state.entryReady||!state.entryLabel.includes('pending'))throw Error('Signal confirmation and pending entry checks were conflated');
})()`,context);
console.log('PASS cancelled order reviews ignore late responses; stopped scans release controls; incomplete checks remain unverified');

vm.runInContext(`{
 const now=100000000;
 const row={plans:{scalp:{confirmed:true}},scalp:{time:now-3600000,tf:'1h'},quality:{scalp:{recommended:false,reason:'Spread within limit',checkedAt:now,expires:now+3600000}}};
 let state=setupState(row,'scalp',now);
 if(state.kind!=='confirmed'||state.entryReady||!state.entryLabel.includes(row.quality.scalp.reason))throw Error('Failed entry checks hid a confirmed signal');
 row.quality.scalp.recommended=true;state=setupState(row,'scalp',now);
 if(!state.entryReady||state.kind!=='confirmed')throw Error('Verified entry not ready for review');
 state=setupState(row,'scalp',now+60001);
 if(state.entryReady||state.kind!=='confirmed'||!state.entryLabel.includes('stale'))throw Error('Stale checks misrepresented entry readiness');
 row.plans.scalp.confirmed=false;state=setupState(row,'scalp',now);
 if(state.kind!=='forming'||state.entryReady)throw Error('Forming signal falsely confirmed');
 state=setupState(row,'scalp',now+3600001);
 if(state.kind!=='expired'||state.entryReady)throw Error('Expired entry remained ready');
 row.plans.scalp=null;state=setupState(row,'scalp',now);
 if(state.kind!=='watch'||state.entryReady)throw Error('No-entry watch was promoted');
}`,context);
console.log('PASS strategy confirmation is separate from failed, pending, stale and expired entry checks');

vm.runInContext(`{
 alerts=[{title:'BTCUSD · Stop breached — review exit',message:'Hidden long explanation',time:Date.now()}];renderAlerts();
 if($('alertRows').textContent.includes('Hidden long explanation')||$('alertRows').querySelector('p'))throw Error('Alerts must be title-only');
 tab('api');if(!$('tradeMonitorPanel').closest('#apiView'))throw Error('Trade tracking missing from My Positions');
 tab('chart');if(!$('tradeMonitorPanel').closest('.trade-workspace'))throw Error('Trade tracking missing from Trade');
}`,context);
console.log('PASS title-only alerts and active tracking on Trade and My Positions');

vm.runInContext(`{
 const at=Date.now();const event={key:'surge:test',title:'1H CONFIRMED · LONG BTCUSD · 3.2× VOLUME',at,exchange:'delta',symbol:'BTCUSD',quote:'USD',plan:{}};
 acceptSurge({settings:{enabled:true},job:null,alerts:[event]});
 if(!$('surgeAlertTitles').querySelector('strong')||!$('surgePanel').closest('#strategyView'))throw Error('Bold volume alerts must appear in Setups');
 if(!alerts.some(a=>a.title===event.title)||!$('alertRows').querySelector('strong'))throw Error('Volume alert missing from bold main feed');
}`,context);
console.log('PASS prominent bold volume alerts in scanner and main alert feed');

assert.ok(document.getElementById('sweepRows'));assert.ok(document.getElementById('chartGuardStatus'));assert.match(document.getElementById('surgePanel').textContent,/10 minutes/);console.log('PASS separate sweep panel, chart guard status and delayed-confirmation explanation mount in the customer page');

// Run the customer's form -> durable route -> in-site title and toast path.
const customDir=fs.mkdtempSync('/tmp/radar-dom-custom-'),customStore=createLocalStore(customDir),customEnv={DB:customStore.DB,TRADE_OWNER_EMAIL:'owner@test.invalid'},customFetch=globalThis.fetch;
try{
 globalThis.fetch=async(url,o={})=>{assert.equal(o.method??'GET','GET');if(url.includes('/products/'))return Response.json({success:true,result:{symbol:'BTCUSD',contract_type:'perpetual_futures',state:'live',trading_status:'operational'}});if(url.includes('/tickers/'))return Response.json({result:{close:100,timestamp:Date.now()}});throw Error('Unexpected custom-alert public request');};
 context.fetch=async(url,o={})=>{assert.equal(String(url),'/api/custom-alerts');return worker.fetch(new Request('https://radar.test'+url,{...o,headers:{origin:'https://radar.test','content-type':'application/json','oai-authenticated-user-id':'owner','oai-authenticated-user-email':customEnv.TRADE_OWNER_EMAIL}}),customEnv);};
 vm.runInContext(`{
 $('exchange').value='delta';quote='USD';listings=[{symbol:'BTCUSD',base:'BTC',quote:'USD',exchange:'delta'}];customAlertBusy=false;syncCustomAlertCoins();
 $('customAlertText').value='Tell me when the BTC price is below 800';previewCustomAlert(true);
 if($('customAlertSave').disabled||!$('customAlertPreview').textContent.includes('800 USD'))throw Error('Literal customer price must preview without changing its amount');
 }`,context);
 document.getElementById('customAlertForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<100&&!document.getElementById('customAlertList').textContent.includes('Triggered');i++)await new Promise(r=>setTimeout(r,2));
 assert.match(document.getElementById('customAlertList').textContent,/Triggered/);assert.match(document.getElementById('customAlertToastTitle').textContent,/CUSTOM ALERT/);assert(!document.getElementById('customAlertToast').classList.contains('hide'));assert.match(document.getElementById('alertRows').textContent,/below 800 USD/);assert.equal(document.getElementById('customAlertText').value,'');
 document.getElementById('customAlertDismiss').click();assert(document.getElementById('customAlertToast').classList.contains('hide'));
 const rearm=document.querySelector('[data-custom-action="rearm"]');assert(rearm);console.log('PASS customer custom-alert flow: exact typed preview, actual Save form, durable trigger, main feed, bold toast, dismiss and re-arm control; no provider or exchange writes');
}finally{globalThis.fetch=customFetch;customStore.close();fs.rmSync(customDir,{recursive:true,force:true});}

// Every positions-style panel needs a unique grid area: shared placement hides demo rows.
const layoutSource=fs.readFileSync('dist/index.html','utf8');
for(const [id,area] of [['tradePositions','positions'],['demoPanel','demo'],['tradeMonitorPanel','monitor']]){
 assert.ok(layoutSource.includes('.trade-workspace>#'+id+'{grid-area:'+area+'}'));
}
assert.ok(!layoutSource.includes('.trade-workspace>.trade-positions{grid-area:positions'));
assert.ok(layoutSource.includes("'positions positions' 'demo demo' 'monitor monitor'"));
assert.ok(layoutSource.includes("'positions' 'demo' 'monitor'"));

// Real feed handlers: each valid trade paints immediately; stale/out-of-order ticks do not.
const socketInstances=[];context.WebSocket=class{constructor(url){this.url=url;this.sent=[];socketInstances.push(this)}send(v){this.sent.push(JSON.parse(v))}close(){this.onclose?.()}};
vm.runInContext(`
tracked=[];let tickTime=Date.now(),tickBoundary=Math.floor(tickTime/3600000)*3600000;
chartData={t:{exchange:'delta',symbol:'BTCUSD',quote:'USD'},mode:'scalp',allH:[],allF:[]};
tvLiveBar={time:tickBoundary,open:100,high:101,low:99,close:100,volume:20};
let tickPaints=[];tvCandles={update:c=>tickPaints.push(c)};lastSourceAt=0;receivedAt=0;
startLive();
`,context);
const stream=socketInstances.at(-1);stream.onopen();
assert.ok(stream.sent.some(x=>x.type==='enable_heartbeat'));
assert.ok(stream.sent.some(x=>x.payload?.channels.some(c=>c.name==='ob_l2')));
let stamp=Date.now();stream.onmessage({data:JSON.stringify({type:'trades',sy:'BTCUSD',p:'102',t:stamp*1000,ts:stamp*1000})});
assert.equal(vm.runInContext('chartData.lastPrice',context),102);
assert.equal(vm.runInContext('tickPaints.at(-1).close',context),102);
stream.onmessage({data:JSON.stringify({type:'trades',sy:'BTCUSD',p:'50',t:(stamp-20000)*1000,ts:stamp*1000})});
assert.equal(vm.runInContext('chartData.lastPrice',context),102);
stream.onmessage({data:JSON.stringify({type:'trades',sy:'BTCUSD',p:'51',t:(stamp-1000)*1000,ts:stamp*1000})});
assert.equal(vm.runInContext('chartData.lastPrice',context),102);
stream.onmessage({data:JSON.stringify({type:'ob_l2',sy:'BTCUSD',a:[['103','2']],b:[['102','3']],ts:stamp*1000})});
assert.equal(vm.runInContext('bookBest.ask',context),103);
assert.match(document.getElementById('bookStatus').textContent,/exchange stream/);
vm.runInContext('stopLive()',context);
stream.onmessage({data:JSON.stringify({type:'trades',sy:'BTCUSD',p:'999',t:Date.now()*1000})});
assert.equal(vm.runInContext('chartData.lastPrice',context),102);
console.log('PASS direct trade ticks, source timestamps, stale/out-of-order rejection, streamed order book and cancelled stream isolation');
