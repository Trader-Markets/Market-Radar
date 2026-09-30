import {createLocalStore} from '../local-store.mjs';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const dir=mkdtempSync(resolve('.saved-connection-test-'));
let store=createLocalStore(dir);
const ctx=vm.createContext({TextEncoder,TextDecoder,Response,URL,URLSearchParams,AbortSignal,crypto:webcrypto,Uint8Array,Date,JSON,Number,String,Math,Error,Promise,fetch:async url=>url.includes('sharkexchange')?Response.json([]):Response.json({success:true,result:[],meta:{after:null}})});
vm.runInContext(readFileSync('delta-desk.js','utf8')+'\n'+readFileSync('shark-desk.js','utf8')+'\nthis.delta=deskRoute;this.shark=sharkDeskRoute;',ctx);
const env=()=>({DB:store.DB,TRADE_SESSION_SECRET:store.secret,TRADE_OWNER_EMAIL:'owner@test.invalid'});
function req(ex,route,body,owner='owner'){return new Request('http://localhost:8787/api/'+ex+'-desk/'+route,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'owner@test.invalid',origin:'http://localhost:8787','content-type':'application/json'},body:body?JSON.stringify(body):undefined})}
try{
 for(let ex of ['delta','shark'])assert.equal((await ctx[ex](req(ex,'connect',{key:'fake-saved-api-key',secret:'fake-saved-secret',trading:true}),env())).status,200);
 const firstSecret=store.secret;store.close();store=createLocalStore(dir);assert.equal(store.secret,firstSecret);
 for(let ex of ['delta','shark']){
  assert.equal((await ctx[ex](req(ex,'account'),env())).status,200,'restores without cookies after restart');
  assert.equal((await ctx[ex](req(ex,'account',undefined,'different-owner'),env())).status,401,'owner isolation');
  assert.equal((await ctx[ex](req(ex,'permissions',{trading:false}),env())).status,200);
  assert.equal((await ctx[ex](req(ex,'review',{action:'open'}),env())).status,403,'read-only mode blocks orders');
 }
 assert(!readFileSync(resolve(dir,'accounts.sqlite')).includes(Buffer.from('fake-saved-secret')));
 store.close();store=createLocalStore(dir);
 for(let ex of ['delta','shark']){assert.equal((await (await ctx[ex](req(ex,'account'),env())).json()).trading,false);await ctx[ex](req(ex,'disconnect',{}),env());assert.equal((await ctx[ex](req(ex,'account'),env())).status,401)}
 console.log('PASS: both encrypted connections survive restart and cookie loss, remain owner-scoped, persist read-only mode, and disconnect removes them');
}finally{store.close();rmSync(dir,{recursive:true,force:true})}
