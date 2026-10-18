import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import net from 'node:net';
import http from 'node:http';
import assert from 'node:assert/strict';
const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const directory=await mkdtemp(tmpdir()+'/radar-http-'),origin='http://localhost:'+port;
const child=spawn(process.execPath,['local-trading.mjs'],{env:{...process.env,RADAR_PORT:String(port),RADAR_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local server startup timeout')),12000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Local server exited '+code))});child.stdout.on('data',chunk=>{if(String(chunk).includes('Market Radar is running')){clearTimeout(timer);resolve()}})});
 const call=(path,options={})=>new Promise((resolve,reject)=>{const request=http.request({hostname:'127.0.0.1',port,path,method:options.method||'GET',headers:{host:'localhost:'+port,...options.headers}},response=>{const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:response.headers})))});request.on('error',reject);request.setTimeout(5000,()=>request.destroy(Error('HTTP test timeout')));request.end(options.body)});
 for(const path of ['/','/learnings','/naam-japa','/telegram-connect','/stocks.js','/deep-review.js']){const r=await call(path);assert.equal(r.status,200,path);assert.ok((await r.text()).length>500,path)}
 const version=await (await call('/api/local-version')).json();assert.equal(version.telegramSetup,true);
 const tg=await (await call('/api/local-telegram')).json();assert.equal(tg.state,'disconnected');
 const background=await (await call('/api/background')).json();assert.equal(background.configured,false);assert.equal(background.serviceAvailable,true);
 for(const path of ['/api/delta-desk/account','/api/shark-desk/account','/api/fyers/account']){const r=await call(path);assert.ok([400,401].includes(r.status),path);assert.equal(typeof (await r.json()).error,'string')}
 const rejected=await call('/api/fyers/setup',{method:'POST',headers:{origin:'https://untrusted.test','content-type':'application/json'},body:'{}'});assert.equal(rejected.status,403);
 assert.equal((await call('/api/local-version',{headers:{host:'evil.test'}})).status,421);
 assert.equal((await call('/api/delta/v2/wallet/withdraw',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'})).status,405);
 console.log('PASS real isolated localhost HTTP server: startup, all pages/assets, empty account recovery, saved-watchlist availability, CSRF, Host protection and withdrawal rejection; no user accounts or live messages used');
}finally{
 child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve)});await rm(directory,{recursive:true,force:true});
}
