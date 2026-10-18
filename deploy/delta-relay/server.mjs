// Private fixed-egress forwarding service. Delta secrets stay in the Site.
import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const readPaths=/^\/v2\/(positions\/margined|orders(?:\/(?:\d+|history))?|fills|wallet\/(?:balances|transactions))$/;
const writePaths=/^\/v2\/(orders(?:\/bracket)?|products\/\d+\/orders\/leverage)$/;
export function createRelay({token,upstream=fetch,now=Date.now}){
 if(typeof token!=='string'||token.length<32)throw Error('RELAY_TOKEN must be at least 32 characters');
 const used=new Map();
 return http.createServer(async(req,res)=>{
  const reply=(status,error)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({success:false,error:{code:error}}));};
  const supplied=Buffer.from(req.headers.authorization??''),expected=Buffer.from('Bearer '+token);
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply(401,'relay_unauthorized');
  let u;try{u=new URL(req.url,'http://relay');}catch{return reply(400,'invalid_path');}
  if(!req.url.startsWith('/v2/')||u.origin!=='http://relay'||!((req.method==='GET'&&readPaths.test(u.pathname))||(['POST','PUT','DELETE'].includes(req.method)&&writePaths.test(u.pathname))))return reply(403,'route_not_allowed');
  const id=req.headers['x-radar-request-id'],ts=Number(req.headers.timestamp),at=now();
  if(!Number.isFinite(ts)||Math.abs(at/1000-ts)>5||!req.headers['api-key']||!/^\w{64}$/.test(req.headers.signature??'')||!/^[-a-f0-9]{36}$/.test(id??''))return reply(400,'invalid_signed_request');
  for(const [k,v] of used)if(at-v>60000)used.delete(k);
  if(used.has(id))return reply(409,'request_already_forwarded');
  if(used.size>=6000)return reply(429,'relay_busy');
  used.set(id,at);
  let body='';try{for await(const part of req){body+=part;if(Buffer.byteLength(body)>16384)return reply(413,'request_too_large');}
   const response=await upstream('https://api.india.delta.exchange'+req.url,{method:req.method,redirect:'error',headers:{'api-key':req.headers['api-key'],signature:req.headers.signature,timestamp:req.headers.timestamp,'content-type':'application/json','user-agent':'MarketRadar/1.0'},body:body||undefined,signal:AbortSignal.timeout(12000)});
   const text=await response.text();res.writeHead(response.status,{'content-type':'application/json','cache-control':'no-store'});res.end(text);
  }catch{reply(502,'NETWORK_UNKNOWN');}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=createRelay({token:process.env.RELAY_TOKEN});server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.PORT??8788),'127.0.0.1');
}
