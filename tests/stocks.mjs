import {parseHTML} from 'linkedom';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const {window,document}=parseHTML('<html><head></head><body><main id="crypto"><button id="trade">Trade</button></main></body></html>');
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option')?.value??''},set(v){this._value=String(v)}});
const saved=new Map();vm.runInNewContext(fs.readFileSync('dist/stocks.js','utf8'),{document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}});
assert.equal(document.querySelector('#stocksWorkspace').hidden,true);
document.querySelector('[data-asset="indices"]').click();assert.equal(document.querySelector('#crypto').hidden,true);
assert.equal(document.querySelectorAll('.stock-widget').length,2);assert.equal(document.querySelectorAll('.index-tile').length,26);assert.match(document.querySelector('.index-directory').textContent,/S&P 500/);assert.match(document.querySelector('.index-directory').textContent,/Nifty 50/);document.querySelector('[data-index-symbol="NASDAQ:NDX"]').click();assert.match(document.querySelector('#selectedIndexChart').textContent,/Nasdaq 100/);
let quoteConfig=JSON.parse(document.querySelector('script[src*=market-quotes]').textContent);assert.equal(typeof quoteConfig.height,'number');assert.ok(quoteConfig.height>=280);assert.equal(quoteConfig.symbolsGroups[0].symbols[0].name,'FOREXCOM:SPXUSD');assert.match(document.querySelector('#stockContent').textContent,/cash CFD/);
const quoteMode=document.querySelector('#indexQuoteMode');quoteMode.value='cash';quoteMode.onchange();quoteConfig=JSON.parse(document.querySelector('script[src*=market-quotes]').textContent);assert.equal(quoteConfig.symbolsGroups[0].symbols[0].name,'SP:SPX');assert.match(document.querySelector('#selectedIndexChart').textContent,/Nasdaq 100/);
const region=document.querySelector('#stockRegion');region.value='Asia';region.onchange();assert.equal(document.querySelector('#indexSymbol').children.length,12);
document.querySelector('[data-stock-tab="ai"]').click();assert.equal(document.querySelectorAll('.stock-company').length,25);
document.querySelector('.stock-company button:nth-of-type(2)').click();assert.deepEqual(JSON.parse(saved.get('radar.stockWatch')),['NASDAQ:NVDA']);
const filter=document.querySelector('#aiTracking');filter.value='saved';filter.onchange();assert.equal(document.querySelectorAll('.stock-company').length,1);
document.querySelector('.stock-company button:nth-of-type(2)').click();assert.equal(document.querySelectorAll('.stock-company').length,0);
document.querySelector('[data-stock-tab="screener"]').click();assert.ok(document.querySelector('script[src*="screener"]'));
const market=document.querySelector('#equityMarket');market.value='japan';market.onchange();assert.equal(document.querySelector('script[src*="screener"]'),null);assert.match(document.querySelector('#stockContent').textContent,/No US results are substituted/);market.value='us';market.onchange();
document.querySelector('script[src*="screener"]').onerror();assert.match(document.querySelector('.stock-status').textContent,/could not load/);
document.querySelector('[data-stock-tab="indices"]').click();document.querySelector('[data-stock-tab="screener"]').click();assert.equal(document.querySelector('#equityMarket').value,'us');assert.ok(JSON.parse(document.querySelector('script[src*="screener"]').textContent).height>=600);document.querySelector('script[src*="screener"]').onload();assert.match(document.querySelector('.stock-status').textContent,/Provider panel loaded/);
document.querySelector('[data-asset="crypto"]').click();assert.equal(document.querySelector('#crypto').hidden,false);assert.equal(document.querySelectorAll('.stock-widget').length,0);assert.ok(document.querySelector('#trade'));
console.log('Stocks workspace isolation, indices, filtering, tracking, provider configuration and failure states passed');

// Index selection stays consistent across regions; quote reload retains escape links.
document.querySelector('[data-asset="indices"]').click();
document.querySelector('[data-index-symbol="NASDAQ:NDX"]').click();
assert.equal(document.querySelector('#stockRegion').value,'Americas');
assert.equal(document.querySelector('#indexSymbol').value,'NASDAQ:NDX');
assert.match(document.querySelector('#selectedIndexChart').textContent,/Nasdaq 100/);
const quoteHost=document.querySelector('script[src*=market-quotes]').parentElement.parentElement;
const linkCount=quoteHost.querySelectorAll('a').length;
[...quoteHost.querySelectorAll('button')].find(b=>b.textContent==='Reload this panel').click();
assert.equal(quoteHost.querySelectorAll('a').length,linkCount);
assert.match(quoteHost.textContent,/If a symbol is restricted/);

// Restricted NSE symbols never create a known-blocked chart frame.
document.querySelector('[data-index-symbol="NSE:NIFTY"]').click();
const restricted=document.querySelector('#selectedIndexChart');assert.equal(restricted.querySelectorAll('script[src*=advanced-chart]').length,0,'never show a fallback US chart for an Indian index');assert.match(restricted.textContent,/Dhan chart tools unavailable/);
const provider=document.querySelector('script[src*=market-quotes]').parentElement.parentElement;const collapse=[...provider.querySelectorAll('button')].find(b=>b.textContent==='Hide provider panel');collapse.click();assert.equal(provider.querySelector('.stock-widget').hidden,true);collapse.click();assert.equal(provider.querySelector('.stock-widget').hidden,false);assert.ok(provider.querySelector('.stock-provider-actions a'));
console.log('PASS direct NSE TradingView chart, visible provider escape links and reversible unavailable-panel controls');

// Reference mode uses the same labelled source for quotes and chart; cash mode is explicit.
document.querySelector('[data-asset="indices"]').click();
const refMode=document.querySelector('#indexQuoteMode');refMode.value='references';refMode.onchange();
const reg=document.querySelector('#stockRegion');reg.value='Americas';reg.onchange();
const config=JSON.parse(document.querySelector('script[src*=advanced-chart]').textContent);
assert.equal(config.symbol,'FOREXCOM:SPXUSD');assert.match(document.querySelector('#selectedIndexChart').textContent,/cash CFD/);
document.querySelector('#indexQuoteMode').value='cash';document.querySelector('#indexQuoteMode').onchange();
assert.equal(document.querySelector('#selectedIndexChart script'),null);assert.match(document.querySelector('#selectedIndexChart a').getAttribute('href'),/SP%3ASPX/);
// Global chart entry keeps exact symbols, rejects unqualified or Indian input, and clears on leave.
document.querySelector('[data-stock-tab="chart"]').click();const input=document.querySelector('#globalChartSymbol'),form=document.querySelector('#globalChartForm');input.value='NYSE:IBM';form.onsubmit({preventDefault(){}});assert.equal(JSON.parse(document.querySelector('script[src*=advanced-chart]').textContent).symbol,'NYSE:IBM');
input.value='MSFT';form.onsubmit({preventDefault(){}});assert.match(document.querySelector('#globalChartStatus').textContent,/exact exchange/);
input.value='NSE:TCS';form.onsubmit({preventDefault(){}});assert.match(document.querySelector('#globalChartStatus').textContent,/Indian Markets/);
document.querySelector('[data-asset="crypto"]').click();assert.equal(document.querySelector('#stockContent').children.length,0);
console.log('PASS global reference/cash source alignment, exact stock chart input and workspace cleanup');

// Dispose timers and callbacks when replacing or leaving a provider panel.
const second=parseHTML('<html><head></head><body><main></main></body></html>'),timers=new Map();let seq=0;
vm.runInNewContext(fs.readFileSync('dist/stocks.js','utf8'),{document:second.document,localStorage:{getItem:()=>null,setItem(){}},setTimeout:fn=>{timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id)});
second.document.querySelector('[data-asset="stocks"]').click();const oldScript=second.document.querySelector('script'),oldCallback=oldScript.onload;
second.document.querySelector('#equityColumns').value='performance';second.document.querySelector('#equityColumns').onchange();oldCallback();assert.equal(second.document.querySelector('.stock-status').textContent,'Loading provider panel…');assert.equal(timers.size,1);
second.document.querySelector('[data-asset="crypto"]').click();assert.equal(timers.size,0);assert.equal(oldScript.onload,null);
console.log('PASS replaced panels discard stale callbacks and navigation cancels provider timers');
