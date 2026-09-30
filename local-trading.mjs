// Run the same Site worker on loopback. Exchange API requests then leave from this computer.
import http from 'node:http';
import {createLocalStore} from './local-store.mjs';
import {execFile} from 'node:child_process';
import {setDefaultResultOrder} from 'node:dns';
import worker from './dist/server/index.js';
setDefaultResultOrder('ipv4first');

const port=Number(process.env.RADAR_PORT||8787),origin=`http://localhost:${port}`;
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('RADAR_PORT must be a valid port above 1023');
const saved=createLocalStore(process.env.RADAR_DATA_DIR);
const env={DB:saved.DB,TRADE_OWNER_EMAIL:'local-owner@market-radar.invalid',TRADE_SESSION_SECRET:saved.secret};
const server=http.createServer(async(req,res)=>{
 if(req.headers.host!==`localhost:${port}`){res.writeHead(421);res.end('Open '+origin+' instead.');return}
 if(req.url==='/api/local-ip'&&req.method==='GET'){
  try{const r=await fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('IP lookup failed');let ip=(await r.json()).ip,ipv6=null;try{const six=await fetch('https://api6.ipify.org?format=json',{signal:AbortSignal.timeout(3000)});if(six.ok)ipv6=(await six.json()).ip}catch{}res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ip,ipv6}))}
  catch{res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Public IP lookup unavailable. Check your network IP before creating your Delta key.'}))}return
 }
 let parts=[],size=0;for await(const part of req){size+=part.length;if(size>16384){res.writeHead(413);res.end();return}parts.push(part)}
 const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-owner');headers.set('oai-authenticated-user-email',env.TRADE_OWNER_EMAIL);
 const request=new Request(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(parts),duplex:'half'});
 try{let response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500,{'content-type':'text/plain'});res.end('Local trading server error. Check the terminal.')}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Market Radar is already running. Open '+origin:'Could not start Market Radar: '+e.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>{console.log(`Market Radar is running at ${origin}\nYour connections are saved on this computer until you disconnect. Keep this window and the browser open for alerts. No withdrawal route is available.`);if(process.argv.includes('--open')&&process.platform==='win32')execFile('cmd.exe',['/d','/c','start','',origin])});
