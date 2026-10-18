const FYERS_HOST='https://api-t1.fyers.in';
async function fyersCall(c,path,query='',payload){
 let response;try{response=await fetch(FYERS_HOST+path+query,{method:payload?'POST':'GET',redirect:'error',headers:{accept:'application/json','content-type':'application/json',...(c.token?{authorization:c.appId+':'+c.token}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(12000)})}catch(e){throw Error(/timeout|abort/i.test(e?.name+' '+e?.message)?'FYERS request timed out. Retry; saved app details are retained.':'Cannot reach FYERS. Check your internet and retry; saved app details are retained.')}
 let data;try{data=await response.json()}catch{throw Error('Fyers returned an unreadable response (HTTP '+response.status+'). Retry later.')}
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Fyers returned an invalid response (HTTP '+response.status+'). Retry later.');
 if(response.status===401||[-8,-15,-16,-17].includes(Number(data.code)))throw Error('Fyers login expired or invalid. Sign in again in Fyers settings.');
 if(!response.ok||data.s!=='ok'){
 const message=String(data.message||''),hint=/redirect/i.test(message)?'The redirect URL must match the one registered in your FYERS app.':/secret|appid.?hash/i.test(message)?'Check the App Secret paired with this exact App ID.':/auth.?code|authorization.?code/i.test(message)?'The authorization code is invalid or expired. Start FYERS sign-in again.':/client.?id|app.?id/i.test(message)?'Copy the complete App ID, including its original -100 or -200 suffix.':/ip address|static.?ip|whitelist|allowlist/i.test(message)?'Check the approved IP in your FYERS app and the connection used by this server.':response.status===403?'Check the app activation, permissions and approved server IP in FYERS.':response.status===429?'FYERS rate limit reached. Wait before retrying.':'Check app activation, permissions and sign-in.';
 throw Error('FYERS request failed (HTTP '+response.status+', code '+String(Number.isFinite(Number(data.code))?Number(data.code):'unknown')+'). '+hint)
 }return data;
}
function fyersSymbol(s){if(typeof s!=='string'||! /^(NSE|BSE|MCX):[A-Z0-9&._-]{2,65}$/.test(s))throw Error('Use a Fyers symbol, for example NSE:NIFTY50-INDEX or NSE:RELIANCE-EQ');return s}
function fyersQuote(row){
 const v=row?.v||{},number=x=>x===null||x===undefined||x===''?null:Number.isFinite(Number(x))?Number(x):null,n=number(v.lp),raw=number(v.tt),at=raw===null?null:raw>1e12?raw:raw*1000,now=Date.now();
 return {symbol:row?.n||v.symbol||null,price:n!==null&&n>0?n:null,change:number(v.ch),changePercent:number(v.chp),open:number(v.open_price),high:number(v.high_price),low:number(v.low_price),previousClose:number(v.prev_close_price),at:at!==null&&at>0?at:null,valid:row?.s==='ok'&&n!==null&&n>0&&at!==null&&at>0&&now-at<=15000&&at<=now+1000,error:row?.s!=='ok'?'Symbol unavailable':n===null||n<=0?'Price unavailable':null}
}
async function fyersRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);
 if(!env.DB||!env.TRADE_SESSION_SECRET)return json({error:'Connection storage unavailable'},503);
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json')))return json({error:'Same-origin JSON required'},403);
 const q=(sql,...args)=>env.DB.prepare(sql).bind(...args),route=u.pathname.slice('/api/fyers/'.length);let input={};
 try{if(request.method==='POST'){const raw=await request.text();if(raw.length>12000)return json({error:'Request too large'},413);input=JSON.parse(raw);if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'A JSON object is required'},400)}
 let row=await q('SELECT * FROM market_connections WHERE owner=? AND broker=?',owner,'fyers').first(),c=row?await unseal(row.cipher,env.TRADE_SESSION_SECRET):{};
 const save=async()=>q('INSERT INTO market_connections(owner,broker,cipher,updated) VALUES(?,?,?,?) ON CONFLICT(owner,broker) DO UPDATE SET cipher=excluded.cipher,updated=excluded.updated',owner,'fyers',await seal(c,env.TRADE_SESSION_SECRET),Date.now()).run();
 if(route==='status'&&request.method==='GET')return json({configured:!!c.appId,connected:!!c.token,verified:false,appId:c.appId||'',lastVerifiedAt:c.verifiedAt||null,redirect:c.redirect||'https://trade.fyers.in/api-login/redirect-uri/index.html',message:c.token?'Saved session; refresh account to verify. Fyers may require daily sign-in.':'Not connected.'});
 if(route==='disconnect'&&request.method==='POST'){await q('DELETE FROM market_connections WHERE owner=? AND broker=?',owner,'fyers').run();return json({connected:false})}
 if(route==='setup'&&request.method==='POST'){
 const appId=typeof input.appId==='string'?input.appId.trim():'',secret=typeof input.secret==='string'?input.secret.trim():'';if(!/^[A-Za-z0-9]{3,64}-(100|200)$/.test(appId)||secret.length<8||secret.length>512)throw Error('Enter the complete FYERS App ID ending -100 or -200 and its matching App Secret. Keep the original suffix.');
 // Manual callback capture avoids sending auth codes into hosted access logs.
 let redirect=typeof input.redirect==='string'?input.redirect.trim():'';redirect=redirect||'https://trade.fyers.in/api-login/redirect-uri/index.html';let target;try{target=new URL(redirect)}catch{throw Error('Enter the exact redirect URL registered in FYERS.')}if(redirect.length>2048||target.username||target.password||target.hash||target.search||!(target.protocol==='https:'||target.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(target.hostname)))throw Error('Use your registered HTTPS redirect URL, or an HTTP localhost callback, without query parameters or fragments.');c={appId,secret,redirect};await save();return json({configured:true,redirect})}
 if(route==='login'&&request.method==='POST'){if(!c.appId||!c.secret)throw Error('Save your Fyers App ID and secret first');c.state=crypto.randomUUID();c.stateExpires=Date.now()+600000;await save();const params=new URLSearchParams({client_id:c.appId,redirect_uri:c.redirect,response_type:'code',state:c.state});return json({url:FYERS_HOST+'/api/v3/generate-authcode?'+params,expires:c.stateExpires})}
 if(route==='complete'&&request.method==='POST'){if(!c.state||c.stateExpires<Date.now())throw Error('Login expired. Start Fyers sign-in again.');let callback;try{callback=new URL(input.callback)}catch{throw Error('Paste the complete redirected URL from Fyers.')}const expected=new URL(c.redirect);if(callback.origin!==expected.origin||callback.pathname!==expected.pathname||callback.searchParams.get('state')!==c.state)throw Error('Login state or redirect does not match. Start sign-in again.');if(callback.searchParams.get('s')==='error')throw Error('FYERS sign-in was not approved. Start sign-in again and check the app activation and permissions.');const code=callback.searchParams.get('auth_code');if(!code||code.length>8000)throw Error('Fyers did not return an authorization code');delete c.state;delete c.stateExpires;await save();const hash=hex(await crypto.subtle.digest('SHA-256',enc.encode(c.appId+':'+c.secret)));const d=await fyersCall({},'/api/v3/validate-authcode','',{grant_type:'authorization_code',appIdHash:hash,code});if(typeof d.access_token!=='string'||!d.access_token.trim()||d.access_token.length>16000)throw Error('Fyers did not return a valid token');c={...c,token:d.access_token};await save();try{await fyersCall(c,'/api/v3/profile')}catch(e){throw Error(e.message+' Token received and saved. Use Check saved connection to retry verification; start a new sign-in if it expired.')}c.verifiedAt=Date.now();await save();return json({connected:true,verified:true,asOf:Date.now()})}
 if(!c.token)return json({error:'Connect Fyers in Indian markets → Settings first.'},401);
 if(route==='verify'&&request.method==='POST'){await fyersCall(c,'/api/v3/profile');c.verifiedAt=Date.now();await save();return json({connected:true,verified:true,asOf:c.verifiedAt,message:'FYERS profile verified. Account and data permissions are checked when you open those features.'})}
 if(route==='account'&&request.method==='GET'){
  const fields={positions:'netPositions',orders:'orderBook',tradebook:'tradeBook',funds:'fund_limit',holdings:'holdings'},names=Object.keys(fields);
  const results=await Promise.allSettled(names.map(async name=>{
   const value=await fyersCall(c,'/api/v3/'+name),rows=value[fields[name]];
   if(!Array.isArray(rows)||rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error('Fyers returned an invalid '+name+' list. Retry account refresh.');
   return value;
  }));
  const data={asOf:Date.now(),connected:results.some(r=>r.status==='fulfilled'),errors:[]};
  results.forEach((r,i)=>{data[names[i]]=r.status==='fulfilled'?r.value:null;if(r.status==='rejected')data.errors.push(names[i]+': '+r.reason.message)});
  return json(data);
 }
 if(route==='quotes'&&request.method==='GET'){const symbols=[...new Set((u.searchParams.get('symbols')||'').split(',').map(fyersSymbol))];if(symbols.length>20)throw Error('Maximum 20 symbols per request');const d=await fyersCall(c,'/data/quotes','?'+new URLSearchParams({symbols:symbols.join(',')}));if(!Array.isArray(d.d))throw Error('Fyers quotes response is invalid');return json({asOf:Date.now(),quotes:d.d.map(fyersQuote).filter(q=>symbols.includes(q.symbol))})}
 if(route==='scan'&&request.method==='GET'){
  const symbol=fyersSymbol(u.searchParams.get('symbol'));
  if(symbol.startsWith('MCX:'))throw Error('MCX scanning needs its own session calendar; quotes are available.');
  const now=Date.now(),resolutions=['60','240','D'],histories={},errors=[];
  // At most three concurrent history requests; each timeframe's chunks remain sequential.
  const results=await Promise.allSettled(resolutions.map(async resolution=>{
   const raw=[];
   for(let chunk=0;chunk<(resolution==='240'?3:1);chunk++){
    const to=Math.floor((now-chunk*90*86400000)/1000),from=to-90*86400;
    const d=await fyersCall(c,'/data/history','?'+new URLSearchParams({symbol,resolution,date_format:'0',range_from:String(from),range_to:String(to),cont_flag:'1'}));
    if(!Array.isArray(d.candles))throw Error('Fyers history unavailable');raw.push(...d.candles);
   }
   return equityClosedBars(raw,resolution,now,true);
  }));
  results.forEach((r,i)=>{histories[resolutions[i]]=r.status==='fulfilled'?r.value:[];if(r.status==='rejected')errors.push(resolutions[i]+': '+r.reason.message)});
  let quote={symbol,price:null,at:null,valid:false,error:'Quote unavailable'};
  try{
   const response=await fyersCall(c,'/data/quotes','?'+new URLSearchParams({symbols:symbol}));
   if(!Array.isArray(response.d))throw Error('Fyers quotes response is invalid');
   const match=response.d.find(row=>row?.n===symbol||row?.v?.symbol===symbol);
   if(!match)throw Error('Fyers did not return a quote for the requested instrument');
   quote=fyersQuote(match);
  }catch(e){errors.push('Quote: '+e.message)}
  return json({asOf:Date.now(),symbol,quote,errors,partial:errors.length>0,results:equitySignals(histories['60'],histories['240'],histories.D,quote),candles:histories['60'].slice(-120)});
 }
 return json({error:'This Fyers feature is not enabled. No order was sent.'},404);
 }catch(e){return json({error:e.message||'Fyers unavailable'},400)}
}
// Exchange sessions contain overnight/weekend gaps: do not reuse crypto's continuous-calendar validator.
function equityClosedBars(raw,resolution,now,regularSession=false){const duration=resolution==='D'?86400000:Number(resolution)*60000;const seen=new Set();return raw.filter(r=>Array.isArray(r)&&r.length>=6).map(r=>({time:Number(r[0])*1000,open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])})).filter(c=>{if(seen.has(c.time))return false;seen.add(c.time);return Object.values(c).every(Number.isFinite)&&c.low>0&&c.high>=Math.max(c.open,c.close)&&c.low<=Math.min(c.open,c.close)&&c.volume>=0&&(regularSession?equityBarEnd(c.time,resolution):c.time+duration)<=now}).sort((a,b)=>a.time-b.time)}
function equityBarEnd(at,resolution){const local=new Date(at+19800000),day=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-19800000,close=day+55800000;return resolution==='D'?close:Math.min(at+Number(resolution)*60000,close)}
function equitySignals(h,f,d,quote){
 const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
 const ema=(a,n)=>{if(a.length<n+20)return null;let e=avg(a.slice(0,n).map(c=>c.close));for(const c of a.slice(n))e+=(c.close-e)*2/(n+1);return e};
 const c=h.at(-1),p=h.slice(-21,-1),fc=f.at(-1),ready=!!c&&p.length===20;
 const high=ready?Math.max(...p.map(x=>x.high)):null,low=ready?Math.min(...p.map(x=>x.low)):null;
 const up=ready&&c.close>high,down=ready&&c.close<low,side=up?1:down?-1:0,level=up?high:down?low:null;
 const base=ready?avg(p.map(x=>x.volume)):0,volume=base>0?c.volume/base:null;
 const live=ready&&Date.now()-c.time<=7200000&&quote.valid&&(side===1?quote.price>level:side===-1&&quote.price<level);
 const span=ready?c.high-c.low:0,edge=span>0&&(side===1?(c.close-c.low)/span>=.75:(c.high-c.close)/span>=.75);
 const sweptHigh=ready&&c.high>high&&c.close<=high,sweptLow=ready&&c.low<low&&c.close>=low;
 const breakout=side&&volume>=2&&edge&&Math.abs(c.close/level-1)<=.01&&!sweptHigh&&!sweptLow&&live;
 const e=ema(f,200),last=f.slice(-12),rangeHigh=Math.max(...last.map(x=>x.high)),rangeLow=Math.min(...last.map(x=>x.low));
 const consolidation=e!==null&&fc&&Math.abs(fc.close/e-1)<=.02&&rangeHigh/rangeLow-1<=.05;
 const ma=(a,n)=>a.length>=n?avg(a.slice(-n).map(x=>x.close)):null,fast=ma(f,50),slow=ma(f,200),oldFast=ma(f.slice(0,-1),50),oldSlow=ma(f.slice(0,-1),200);
 const gold=oldSlow!==null&&oldFast<=oldSlow&&fast>slow,death=oldSlow!==null&&oldFast>=oldSlow&&fast<slow;
 return [
  {strategy:'1H volume breakout',status:!ready?'Unavailable':breakout?'Confirmed':'Watch',reason:!ready?'Needs 21 closed 1H candles':volume===null?'No traded volume: index volume confirmation unavailable':!quote.valid?'Live quote stale, missing or market closed':`Volume ${volume.toFixed(2)}×; closed range ${low}–${high}`,side,level,candleAt:c?.time??null},
  {strategy:'4H 200 EMA consolidation',status:e===null?'Unavailable':consolidation?'Watch':'No setup',reason:e===null?'Needs at least 220 closed 4H candles':'Consolidation is a watch, not a confirmed breakout',level:e},
  {strategy:'Golden / death cross',status:slow===null?'Unavailable':gold||death?'Watch':'No setup',reason:slow===null?'Needs at least 200 closed 4H candles':gold?'50 SMA crossed above 200 SMA':death?'50 SMA crossed below 200 SMA':'Latest closed 4H 50/200 SMA comparison'},
  {strategy:'Liquidity sweep',status:!ready?'Unavailable':sweptHigh||sweptLow?'Detected':'Not detected',reason:!ready?'Needs 21 closed 1H candles':sweptHigh?'High swept; closed back inside range':sweptLow?'Low swept; closed back inside range':'Separate candle-pattern check; does not prove stop orders'},
  {strategy:'Multi-timeframe / ATH',status:'Unavailable',reason:'90-day history cannot verify lifetime ATH or full monthly alignment. No confirmation issued.'}
 ];
}
