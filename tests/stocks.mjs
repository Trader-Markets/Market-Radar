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
const market=document.querySelector('#equityMarket');market.value='india';market.onchange();assert.equal(JSON.parse(document.querySelector('script[src*="screener"]').textContent).market,'india');
document.querySelector('script[src*="screener"]').onerror();assert.match(document.querySelector('.stock-status').textContent,/could not load/);
document.querySelector('[data-stock-tab="indices"]').click();document.querySelector('[data-stock-tab="screener"]').click();assert.equal(document.querySelector('#equityMarket').value,'india');assert.ok(JSON.parse(document.querySelector('script[src*="screener"]').textContent).height>=600);document.querySelector('script[src*="screener"]').onload();assert.match(document.querySelector('.stock-status').textContent,/Panel script loaded/);
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
const restricted=document.querySelector('#selectedIndexChart');assert.equal(restricted.querySelectorAll('script[src*=advanced-chart]').length,0);assert.match(restricted.textContent,/FYERS/);assert.ok(restricted.querySelector('a[href*="NSE%3ANIFTY"]'));assert.ok([...restricted.querySelectorAll('button')].some(b=>/FYERS/.test(b.textContent)));
const provider=document.querySelector('script[src*=market-quotes]').parentElement.parentElement;const collapse=[...provider.querySelectorAll('button')].find(b=>b.textContent==='Hide unavailable panel');collapse.click();assert.equal(provider.querySelector('.stock-widget').hidden,true);collapse.click();assert.equal(provider.querySelector('.stock-widget').hidden,false);assert.ok(provider.querySelector('.stock-provider-actions a'));
console.log('PASS restricted NSE chart fallback, visible provider escape links and reversible unavailable-panel controls');
