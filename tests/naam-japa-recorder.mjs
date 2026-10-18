import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({permission,startError=false,empty=false,available=true}={}){
 const {window,document}=parseHTML(fs.readFileSync('dist/naam-japa.html','utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option')?.value??''},set(v){this._value=String(v)}});
 const timers=new Map(),recorders=[],blobs=[],revoked=[],requests=[];let next=0,stops=0,plays=0;
 const stream={getTracks:()=>[{stop:()=>stops++}]},audio=document.getElementById('japaAudio');audio.pause=()=>{};audio.load=()=>{};audio.play=async()=>{plays++};
 class Recorder{
  static isTypeSupported(type){return type==='audio/mp4'}
  constructor(stream,options){this.stream=stream;this.mimeType=options?.mimeType||'audio/webm';this.state='inactive';recorders.push(this)}
  start(){if(startError)throw Error('Device busy');this.state='recording'}
  stop(){this.state='inactive';queueMicrotask(()=>{if(!empty)this.ondataavailable?.({data:new Blob(['my actual chant'],{type:this.mimeType})});this.onstop?.()})}
 }
 window.MediaRecorder=available?Recorder:undefined;
 const microphone={mediaDevices:available?{getUserMedia:async options=>{requests.push(options);return permission?permission(stream):stream}}:undefined};
 vm.runInNewContext(fs.readFileSync('dist/naam-japa.js','utf8'),{window,document,Blob,navigator:microphone,MediaRecorder:available?Recorder:undefined,localStorage:{getItem:()=>null,setItem:()=>{}},URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:local-'+blobs.length},revokeObjectURL:url=>revoked.push(url)},setTimeout:(fn,delay)=>{const id=++next;timers.set(id,{fn,delay});return id},clearTimeout:id=>timers.delete(id)});
 const el=id=>document.getElementById('japa'+id),click=id=>el(id).click();
 return {window,document,timers,recorders,blobs,revoked,requests,stream,el,click,stops:()=>stops,plays:()=>plays};
}
let p=fixture();assert.equal(p.requests.length,0,'microphone is never opened automatically');assert.equal(p.el('Source').value,'record');p.click('Record');await flush();assert.equal(p.requests.length,1);assert.equal(p.requests[0].audio,true);assert.equal(p.requests[0].video,false);assert.match(p.el('Status').textContent,/Recording your voice/);assert.equal(p.el('Play').disabled,true);assert.equal(p.el('Source').disabled,true);p.click('RecordStop');await flush();assert.ok(p.stops()>0,'microphone tracks are stopped');assert.equal(p.blobs.length,1);assert.equal(p.blobs[0].type,'audio/mp4');assert.equal(p.el('Download').download,'my-naam-japa.m4a');assert.equal(p.el('Download').hidden,false);assert.equal(p.plays(),0,'recording does not autoplay');p.click('Play');await flush();assert.equal(p.plays(),1);assert.equal(p.el('Audio').loop,true);
p.click('Record');await flush();p.click('RecordStop');await flush();assert.equal(p.blobs.length,2);assert.ok(p.revoked.includes('blob:local-1'));
let grant;p=fixture({permission:stream=>new Promise(resolve=>grant=()=>resolve(stream))});p.click('Record');assert.match(p.el('RecordingStatus').textContent,/Waiting/);p.click('RecordStop');grant();await flush();assert.equal(p.recorders.length,0,'cancelled permission replies cannot start capture');assert.ok(p.stops()>0);
p=fixture({permission:async()=>{const e=Error();e.name='NotAllowedError';throw e}});p.click('Record');await flush();assert.match(p.el('Status').textContent,/permission was denied/);assert.equal(p.el('Record').disabled,false);
p=fixture({empty:true});p.click('Record');await flush();p.click('RecordStop');await flush();assert.match(p.el('Status').textContent,/No audio was captured/);assert.equal(p.el('Download').hidden,true);
p=fixture({startError:true});p.click('Record');await flush();assert.ok(p.stops()>0);assert.equal(p.el('Record').disabled,false);
p=fixture();p.click('Record');await flush();[...p.timers.values()].find(t=>t.delay===300000).fn();await flush();assert.equal(p.blobs.length,1,'five-minute cap finalizes the recording');assert.ok(p.stops()>0);
p=fixture();p.click('Record');await flush();p.window.dispatchEvent(new p.window.Event('pagehide'));await flush();assert.ok(p.stops()>0);assert.equal(p.blobs.length,0,'closing discards unfinished capture and releases the microphone');
p=fixture({available:false});p.click('Record');assert.match(p.el('Status').textContent,/Recording is unavailable/);assert.equal(p.requests.length,0);
console.log('PASS microphone recorder: explicit permission, audio only, record/stop/loop/download, format selection, replacement cleanup, cancelled grants, denial/empty/device errors, five-minute cap and page-close cleanup; no real microphone accessed');
