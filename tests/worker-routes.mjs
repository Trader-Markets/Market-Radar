import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
const origin='https://radar.test',originalFetch=globalThis.fetch;
const call=(path,init={},env={})=>worker.fetch(new Request(origin+path,init),env);
try{
for(let [route,file] of [['/naam-japa','dist/naam-japa.html'],['/naam-japa/','dist/naam-japa.html'],['/naam-japa.js','dist/naam-japa.js'],['/telegram-posts.js','dist/telegram-posts.js'],['/deep-review.js','dist/deep-review.js'],['/learnings','dist/learnings.html'],['/learnings/','dist/learnings.html'],['/learnings.js','dist/learnings.js'],['/','dist/index.html'],['/app.js','dist/app.js'],['/stocks.js','dist/stocks.js'],['/signals.js','dist/signals.js'],['/customer-flow.js','dist/customer-flow.js'],['/custom-alert-rules.js','dist/custom-alert-rules.js']]){
 let r=await call(route);assert.equal(r.status,200);assert.equal(await r.text(),fs.readFileSync(file,'utf8')+(route==='/stocks.js'?'\n'+fs.readFileSync('dist/market-accounts.js','utf8')+'\n'+fs.readFileSync('dist/fyers-drawings.js','utf8')+'\n'+fs.readFileSync('dist/fyers-indicators.js','utf8')+'\n'+fs.readFileSync('dist/fyers-chart.js','utf8')+'\n'+fs.readFileSync('dist/fyers-screener.js','utf8')+'\n'+fs.readFileSync('dist/learnings.js','utf8'):''));assert.equal(r.headers.get('cache-control'),'no-store');
}
assert.equal((await call('/missing')).status,404);
assert.equal((await call('/api/delta/v2/orders')).status,404);
assert.equal((await call('/api/delta/v2/tickers',{method:'POST'})).status,405);
for(let exchange of ['delta','shark'])assert.equal((await call('/api/'+exchange+'-desk/account')).status,403);
let requests=[];globalThis.fetch=async(url,options)=>{requests.push({url:String(url),options});return Response.json({result:[{symbol:'BTCUSD'}]})};
assert.equal((await call('/api/delta/v2/tickers?contract_types=perpetual_futures')).status,200);
assert.equal(requests[0].url,'https://api.india.delta.exchange/v2/tickers?contract_types=perpetual_futures');
let candleBody=JSON.stringify({pair:'BTCINR',interval:'1h',limit:75});
assert.equal((await call('/api/shark/v1/market/klines?priceType=LAST_PRICE',{method:'POST',body:candleBody})).status,200);
assert.equal(requests.at(-1).options.body,candleBody);
globalThis.fetch=async()=>{throw Error('upstream offline')};assert.equal((await call('/api/delta/v2/tickers')).status,502);
assert.equal((await call('/api/news')).status,404);
assert.equal((await call('/api/news',{method:'POST',body:'{}'})).status,404);
assert.doesNotMatch(fs.readFileSync('dist/index.html','utf8'),/coinmarketcap|cmcKey/i);
assert.doesNotMatch(fs.readFileSync('dist/app.js','utf8'),/coinmarketcap|loadNews|checkNews/);
console.log('PASS Worker integration: exact frontend assets, cache freshness, route allowlist, both feed proxies, protected accounts, news authorization and upstream failures');
}finally{globalThis.fetch=originalFetch}
