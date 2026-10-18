import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';

// Exercise the assembled customer DOM with no exchange or messaging writes.
function fixture(hash='',saved={}){
 const {window,document}=parseHTML(fs.readFileSync('dist/index.html','utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??''},set(v){this._value=String(v)}});
 Object.defineProperty(window.HTMLSelectElement.prototype,'options',{get(){return [...this.querySelectorAll('option')]}});
 const context=vm.createContext({window,document,console,AbortSignal,URL,URLSearchParams,localStorage:{getItem:key=>saved[key]??null,setItem:()=>{}},setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,clearTimeout:()=>{},queueMicrotask:()=>{},fetch:async()=>{throw Error('Offline UI check')},location:{hostname:'localhost',origin:'http://localhost',pathname:'/',hash},navigator:{},ResizeObserver:class{observe(){}},requestAnimationFrame:()=>0});
 for(const [file,key] of [['customer-flow','CustomerFlow'],['signals','StrategySignals'],['custom-alert-rules','CustomAlertRules']]){vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);context[key]=window[key]}
 for(const file of ['app','stocks','market-accounts','learnings'])vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);
 return {document,context};
}
for(const asset of ['crypto','stocks','indices','india']){
 const {document}=fixture('#'+asset);
 assert.equal(document.querySelector('[data-asset='+asset+']').getAttribute('aria-pressed'),'true');
 for(const choice of ['crypto','stocks','indices','india','indices','crypto']){
  document.querySelector('[data-asset='+choice+']').click();
  assert.equal(document.querySelectorAll('.asset-nav [aria-pressed=true]').length,1,'one active workspace');
  const visible=[...document.querySelectorAll('main')].filter(e=>!e.hidden);
  assert.equal(visible.length,1,'exactly one visible workspace');
  assert.equal(visible[0].id||visible[0].className,choice==='crypto'?'shell':choice==='india'?'indiaWorkspace':'stocksWorkspace');
 }
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
 assert.equal(new Set(ids).size,ids.length,'no duplicate controls after repeated navigation');
 assert.equal(document.querySelector('[data-asset=learnings]').getAttribute('href'),'/learnings');
 assert.equal(document.querySelectorAll('#radar-ui-system').length,1);
 for(const scroll of document.querySelectorAll('.table-wrap,.desk-scroll'))assert.equal(scroll.getAttribute('tabindex'),'0','account and market tables are keyboard reachable');
}
const {document,window}=parseHTML(fs.readFileSync('dist/learnings.html','utf8'));
vm.runInNewContext(fs.readFileSync('dist/learnings.js','utf8'),{window,document,location:{pathname:'/learnings',hash:''},fetch:async()=>{throw Error('Offline review')}});
await new Promise(r=>setImmediate(r));
assert.equal(document.querySelector('#learningWorkspace').hidden,false);
assert.equal(document.querySelectorAll('.asset-nav [aria-current=page]').length,1);
assert.equal(document.querySelectorAll('.asset-nav button').length,0,'standalone review has no duplicate page button');
assert.equal(document.querySelector('#learningCalendar').parentElement.getAttribute('tabindex'),'0');
assert.equal(document.querySelector('#learningSync').disabled,false,'offline review remains recoverable');
for(const page of ['dist/index.html','dist/learnings.html','telegram-connect.html','telegram-guide.html']){
 const doc=parseHTML(fs.readFileSync(page,'utf8')).document,theme=doc.querySelector('#radar-ui-system');
 assert.ok(theme.sheet.cssRules.length>100,'shared CSS parses');
 assert.equal(theme.textContent,fs.readFileSync('ui-theme.css','utf8'));
}
function luminance(hex){const [r,g,b]=hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b}
for(const [fg,bg] of [['ffffff','624082'],['ffffff','4d2f6a'],['536278','f5f6fa'],['253448','ffffff'],['4d2f6a','f1eaf7'],['9b283a','fff1f2']]){
 const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'readable text contrast');
}
console.log('PASS assembled workspace navigation/deep links, unique controls, offline recovery, keyboard scroll access, shared CSS parsing and text contrast; no pixel-rendering claim');

const damaged=fixture('',{radarAlerts:'[null,{}, {"title":"Saved alert"}]',radarSeenAlerts:'{}'});assert.match(damaged.document.querySelector('#alertRows').textContent,/Saved alert/);
