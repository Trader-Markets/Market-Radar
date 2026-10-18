// Run the same Site worker on loopback. Exchange API requests then leave from this computer.
import http from 'node:http';
import {startLocalWatchlist} from './local-background.mjs';
import {inspectLocalServer,LOCAL_BUILD} from './local-startup.mjs';
import {readFileSync} from 'node:fs';
import {createTelegramService} from './local-telegram.mjs';
import {createLocalStore} from './local-store.mjs';
import {execFile} from 'node:child_process';
import {setDefaultResultOrder} from 'node:dns';
import worker from './dist/server/index.js';
setDefaultResultOrder('ipv4first');

const port=Number(process.env.RADAR_PORT||8787),origin=`http://localhost:${port}`;
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('RADAR_PORT must be a valid port above 1023');
const openPath=process.argv.includes('--telegram-setup')?'/telegram-connect':'/';
const existing=await inspectLocalServer(port);
if(existing.state==='occupied'){console.error(existing.message);process.exit(23)}
if(existing.state==='current'){
 console.log('The current Market Radar is already running. Opening '+origin+openPath);
 if(process.argv.includes('--open')&&process.platform==='win32')execFile('cmd.exe',['/d','/c','start','',origin+openPath]);
 process.exit(0);
}
const saved=createLocalStore(process.env.RADAR_DATA_DIR);
const env={DB:saved.DB,TRADE_OWNER_EMAIL:'local-owner@market-radar.invalid',TRADE_SESSION_SECRET:saved.secret,BACKGROUND_SERVICE_ENABLED:'true'};
const telegram=createTelegramService({DB:saved.DB,secret:saved.secret,origin});
const telegramPage=readFileSync(new URL('./telegram-connect.html',import.meta.url));
const server=http.createServer(async(req,res)=>{
 if(req.headers.host!==`localhost:${port}`){res.writeHead(421);res.end('Open '+origin+' instead.');return}
 if(req.url==='/api/local-version'&&req.method==='GET'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({app:'market-radar',build:LOCAL_BUILD,telegramSetup:true}));return}
 if(['/telegram-connect','/telegram-connect/'].includes(req.url)&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'DENY','referrer-policy':'no-referrer'});res.end(telegramPage);return}
 if(req.url==='/api/local-ip'&&req.method==='GET'){
  try{const r=await fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('IP lookup failed');let ip=(await r.json()).ip,ipv6=null;try{const six=await fetch('https://api6.ipify.org?format=json',{signal:AbortSignal.timeout(3000)});if(six.ok)ipv6=(await six.json()).ip}catch{}res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ip,ipv6}))}
  catch{res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Public IP lookup unavailable. Check your network IP before creating your Delta key.'}))}return
 }
 let parts=[],size=0;for await(const part of req){size+=part.length;if(size>16384){res.writeHead(413);res.end();return}parts.push(part)}
 const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-owner');headers.set('oai-authenticated-user-email',env.TRADE_OWNER_EMAIL);
 const request=new Request(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(parts),duplex:'half'});
 try{let response=await (new URL(request.url).pathname.startsWith('/api/telegram-media/')?telegram.photoResponse(request):['/api/local-telegram','/api/telegram-news'].includes(new URL(request.url).pathname)?telegram.route(request):worker.fetch(request,env));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500,{'content-type':'text/plain'});res.end('Local trading server error. Check the terminal.')}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port became busy. Close the old server window and restart this launcher.':'Could not start Market Radar: '+e.message);process.exit(e.code==='EADDRINUSE'?23:1)});
server.listen(port,'127.0.0.1',()=>{console.log(`Market Radar is running at ${origin}\nYour connections are saved on this computer until you disconnect. Keep this window and the browser open for alerts. No withdrawal route is available.`);if(process.argv.includes('--open')&&process.platform==='win32')execFile('cmd.exe',['/d','/c','start','',origin+openPath])});
// Local alerts continue without a browser while this server process stays running.
let monitoring=false;
const monitorTimer=setInterval(async()=>{if(monitoring)return;monitoring=true;try{const r=await worker.fetch(new Request(origin+'/api/trade-monitor',{method:'POST',headers:{origin,'content-type':'application/json','oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':env.TRADE_OWNER_EMAIL},body:JSON.stringify({action:'check'})}),env);if(!r.ok)console.error('Trade tracking temporarily unavailable; check your exchange.')}catch{console.error('Trade tracking temporarily unavailable; check your exchange.')}finally{monitoring=false}},20000);
monitorTimer.unref();server.on('close',()=>clearInterval(monitorTimer));

let surgeLoopBusy=false;
const surgeTimer=setInterval(async()=>{if(surgeLoopBusy)return;surgeLoopBusy=true;const headers={origin,'content-type':'application/json','oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':env.TRADE_OWNER_EMAIL};try{const read=await worker.fetch(new Request(origin+'/api/surge',{headers}),env),d=await read.json();if(d.settings?.enabled){const body=d.job&&['rank','scan'].includes(d.job.phase)?{action:'step',id:d.job.id}:{action:'start',exchange:d.settings.exchange,quote:d.settings.quote};if(d.job?.phase!=='failed')await worker.fetch(new Request(origin+'/api/surge',{method:'POST',headers,body:JSON.stringify(body)}),env);}}catch{console.error('Volume scanner unavailable; check its status in Setups.')}finally{surgeLoopBusy=false}},2000);
surgeTimer.unref();server.on('close',()=>clearInterval(surgeTimer));

const watchlist=startLocalWatchlist({worker,env,origin,onError:()=>console.error('Saved watchlist scan unavailable; check Background alerts in Setups.')});server.on('close',()=>watchlist.stop());
