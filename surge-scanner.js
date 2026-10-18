// Top-20 quote-turnover scanner. Complete 5-minute candles are the common source.
const surgeFrames=[['5m',300000,1.5],['15m',900000,1.5],['30m',1800000,1.5],['1h',3600000,2]];
function surgeAggregate(raw,duration,now){
 const groups=new Map();for(const c of raw){if(c.time+300000>now)continue;const start=Math.floor(c.time/duration)*duration;if(!groups.has(start))groups.set(start,[]);groups.get(start).push(c)}
 return [...groups].sort((a,b)=>a[0]-b[0]).flatMap(([time,a])=>{a.sort((x,y)=>x.time-y.time);if(a.length!==duration/300000||a.some((c,i)=>c.time!==time+i*300000)||time+duration>now)return [];return [{time,open:a[0].open,close:a.at(-1).close,high:Math.max(...a.map(c=>c.high)),low:Math.min(...a.map(c=>c.low)),volume:a.reduce((n,c)=>n+c.volume,0)}]});
}
function surgeCheck(bars,tf,side,end){
 const [label,duration,multiple]=tf,a=bars.filter(c=>c.time+duration<=end).slice(-21),last=a.at(-1);
 if(a.length<21||last.time+duration!==end||a.some((c,i)=>i&&c.time-a[i-1].time!==duration))return {tf:label,ok:false,available:false,reason:'Missing closed candles'};
 const prior=a.slice(0,-1),average=prior.reduce((n,c)=>n+c.volume,0)/20,ratio=average>0?last.volume/average:0,level=side===1?Math.max(...prior.map(c=>c.high)):Math.min(...prior.map(c=>c.low)),span=last.high-last.low,edge=span>0?(side===1?(last.close-last.low)/span:(last.high-last.close)/span):0;
 const breakout=side*(last.close-level)>0;
 return {tf:label,ok:breakout&&ratio>=multiple&&edge>=.75,available:true,ratio,level,close:last.close,low:last.low,high:last.high,at:end,reason:!breakout?'Range not broken':ratio<multiple?'Volume below '+multiple+'×':edge<.75?'Weak candle close':'Confirmed'};
}
function surgeEvaluate(raw,now=Date.now()){
 const all=surgeFrames.map(f=>surgeAggregate(raw,f[1],now)),hour=Math.floor(now/3600000)*3600000;
 const choices=[1,-1].map(side=>({side,checks:surgeFrames.map((f,i)=>surgeCheck(all[i],f,side,hour))}));
 const sweepEvents=all.flatMap((a,i)=>backgroundStrategy.sweeps(a,surgeFrames[i][1],now).map(e=>({...e,tf:surgeFrames[i][0]})));
 const confirmed=choices.find(x=>x.checks.every(c=>c.ok));
 if(confirmed){const h=confirmed.checks[3],entry=h.close,stop=confirmed.side===1?Math.min(h.low,h.level):Math.max(h.high,h.level),risk=confirmed.side*(entry-stop);const plan={...confirmed,confirmed:true,closedAt:hour,level:h.level,ratio:h.ratio,entry,stop,target:entry+confirmed.side*2*risk,risk,mode:'surge'};return {...plan,sweeps:sweepEvents,guard:backgroundStrategy.breakoutGuard(plan,hour,raw,all[3],now)};}
 // Early checks use each latest completed frame; they can never produce an alert.
 const early=[1,-1].map(side=>({side,checks:surgeFrames.map((f,i)=>surgeCheck(all[i],f,side,Math.floor(now/f[1])*f[1]))})).sort((a,b)=>b.checks.filter(c=>c.ok).length-a.checks.filter(c=>c.ok).length)[0];
 return {...early,sweeps:sweepEvents,confirmed:false,closedAt:hour,watch:early.checks.slice(0,3).some(c=>c.ok),ratio:early.checks[3].ratio??0};
}
function surgeNormalize(raw,ex,now=Date.now()){
 const rows=raw?.result??raw?.data??raw;if(!Array.isArray(rows))throw Error('Candle response unavailable');
 const seen=new Map();for(const r of rows){const c={time:ex==='delta'?+r.time*1000:+r.startTime,open:+r.open,high:+r.high,low:+r.low,close:+r.close,volume:+r.volume};if(c.time+300000>now)continue;if(!Object.values(c).every(Number.isFinite)||c.time%300000!==0||c.low<=0||c.high<Math.max(c.open,c.close)||c.low>Math.min(c.open,c.close)||c.volume<0)throw Error('Invalid candle data');if(seen.has(c.time)&&JSON.stringify(seen.get(c.time))!==JSON.stringify(c))throw Error('Conflicting candle data');seen.set(c.time,c)}
 const bars=[...seen.values()].sort((a,b)=>a.time-b.time);if(!bars.length||bars.at(-1).time+300000!==Math.floor(now/300000)*300000)throw Error('Latest closed 5-minute candle unavailable');return bars;
}
function surgeRank(rows){if(rows.some(x=>!Number.isFinite(x.turnover)||x.turnover<0))throw Error('Full liquidity ranking unavailable');return [...new Map(rows.map(x=>[x.symbol,x])).values()].filter(x=>x.turnover>0).sort((a,b)=>b.turnover-a.turnover||a.symbol.localeCompare(b.symbol)).slice(0,20).map((x,i)=>({...x,rank:i+1}))}
async function surgeFetch(ex,path,body){const response=await fetch((ex==='delta'?'https://api.india.delta.exchange':'https://api.sharkexchange.in')+path,{method:body?'POST':'GET',headers:{accept:'application/json','content-type':'application/json','user-agent':'MarketRadar/1.0'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Exchange feed returned '+response.status);const d=await response.json();if(d.success===false)throw Error('Exchange feed rejected the request');return d.result??d.data??d}
function surgeStore(env){const q=(sql,...a)=>env.DB.prepare(sql).bind(...a);return {q,async read(id){const row=await q('SELECT payload FROM background_scans WHERE id = ?',id).first();return row?JSON.parse(row.payload):null},save:(id,v)=>q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at',id,JSON.stringify(v),Date.now()).run()}}
function surgePublic(job,settings,alerts){if(!job)return {job:null,settings,alerts};const {universe,ranked,...publicJob}=job;return {job:{...publicJob,total:universe?.length??job.total??0},settings,alerts}}
async function surgeStart(ex,quote){
 const now=Date.now(),base={exchange:ex,quote,startedAt:now,slot:Math.floor(now/300000),id:crypto.randomUUID(),cursor:0,rows:[],errors:[],ranked:[],top:[]};
 if(ex==='delta'){const rows=await surgeFetch(ex,'/v2/tickers?contract_types=perpetual_futures');if(!Array.isArray(rows)||!rows.length)throw Error('Contract ranking unavailable');const universe=rows.filter(x=>x.contract_type==='perpetual_futures'&&/^[A-Z0-9]+USD$/.test(x.symbol)).map(x=>({symbol:x.symbol,turnover:+x.turnover_usd}));if(!universe.length)throw Error('Contract ranking unavailable');return {...base,universe,top:surgeRank(universe),phase:'scan',rankedAt:now};}
 const info=await surgeFetch(ex,'/v1/exchange/exchangeInfo?market='+quote),contracts=Array.isArray(info)?info:(info.contracts??info.market?.flatMap(x=>x.contracts??[])??info.markets?.flatMap(x=>x.contracts??[])??[]),flat=contracts[0]?.contracts?contracts.flatMap(x=>x.contracts):contracts;
 const universe=[...new Set(flat.filter(x=>(x.contractType??'PERPETUAL')==='PERPETUAL').map(x=>x.name??x.symbol).filter(x=>typeof x==='string'&&new RegExp('^[A-Z0-9]{2,30}'+quote+'$').test(x)))];if(!universe.length)throw Error('Contract ranking unavailable');return {...base,universe,phase:'rank'};
}
async function surgeAdvance(job,env,owner,origin,deliver=true){
 const db=surgeStore(env),history=await db.read('surge-alerts:'+owner)??{events:[],seen:[]};
 if(Date.now()-job.startedAt>900000)throw Error('Ranking took too long. Restart for fresh data.');
 if(job.phase==='rank'){
  for(const symbol of job.universe.slice(job.cursor,job.cursor+5)){try{const d=await surgeFetch('shark','/v1/market/ticker24Hr/'+symbol),at=backgroundStrategy.timestamp(d.E??d.C??d.closeTime);if(!Number.isFinite(at)||Date.now()-at>60000||at>Date.now()+1000)throw Error('Turnover timestamp is stale');job.ranked.push({symbol,turnover:+d.q});}catch(e){job.errors.push({symbol,error:e.message})}job.cursor++;await new Promise(r=>setTimeout(r,1200));}
  if(job.cursor===job.universe.length){if(job.errors.length)throw Error('Top 20 cannot be verified: '+job.errors.length+' turnover feeds unavailable. Retry ranking.');job.top=surgeRank(job.ranked);job.rankedAt=Date.now();job.cursor=0;job.phase='scan';}
 }else if(job.phase==='scan'){
  for(const coin of job.top.slice(job.cursor,job.cursor+(job.exchange==='delta'?2:1))){let row;try{
   const end=Math.floor(Date.now()/1000),raw=await surgeFetch(job.exchange,job.exchange==='delta'?'/v2/history/candles?resolution=5m&symbol='+coin.symbol+'&start='+(end-300*305)+'&end='+end:'/v1/market/klines?priceType=LAST_PRICE',job.exchange==='shark'?{pair:coin.symbol,interval:'5m',limit:305}:undefined),bars=surgeNormalize(raw,job.exchange),signal=surgeEvaluate(bars);row={...coin,...signal,checkedAt:Date.now()};
   if(signal.confirmed){row.reason=signal.guard.reason;row.valid=false;if(job.exchange==='shark')await new Promise(r=>setTimeout(r,1200));const quote=await requireFreshQuote(job.exchange,coin.symbol);row.livePrice=quote.price;row.liveAt=quote.at;row.valid=signal.guard.passed&&signal.side*(quote.price-signal.level)>0&&signal.side*(quote.price-signal.stop)>0&&signal.side*(signal.target-quote.price)>0&&Math.abs(quote.price-signal.entry)<=signal.risk*.25;row.reason=row.valid?'All four closes and fakeout checks passed':!signal.guard.passed?signal.guard.reason:signal.side*(quote.price-signal.stop)<=0?'Stop already breached':signal.side*(signal.target-quote.price)<=0?'Target already reached':signal.side*(quote.price-signal.level)<=0?'Price returned inside the breakout — wait':'Price too far from the reference entry';if(row.valid){const key=['surge',job.exchange,job.quote,coin.symbol,signal.closedAt,signal.side].join(':'),at=Date.now(),time=new Date(signal.closedAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}),date=new Date(signal.closedAt).toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short'}),title=`1H CONFIRMED · ${signal.side===1?'LONG':'SHORT'} ${coin.symbol} · ${signal.ratio.toFixed(1)}× VOLUME · ${date} ${time} IST`;
    if(!history.seen.includes(key)){history.seen.push(key);history.events.unshift({key,title,at,closedAt:signal.closedAt,exchange:job.exchange,quote:job.quote,symbol:coin.symbol,plan:signal});}
   }}job.rows.push(row);
  }catch(e){job.rows.push(row?{...row,valid:false,reason:'1H confirmed · '+e.message}:{...coin,error:e.message,confirmed:false});job.errors.push({symbol:coin.symbol,error:e.message})}job.cursor++;if(job.exchange==='shark')await new Promise(r=>setTimeout(r,1200));}
  if(job.cursor===job.top.length){job.phase='done';job.completedAt=Date.now();}
 }
 history.seen=history.seen.slice(-500);history.events=history.events.slice(0,60);await db.save('surge-alerts:'+owner,history);
 if(deliver&&(await db.read('surge-settings:'+owner))?.enabled){for(const event of history.events.filter(e=>Date.now()-e.at<120000&&e.exchange===job.exchange&&e.quote===job.quote)){const r=await whatsappBackground(env,owner,{action:'alert',key:event.key,title:event.title,message:'',kind:'confirmed',at:event.at},origin),d=await r.json();job.delivery=d.note??d.reason??d.error??'Delivery skipped';if(r.status===429)break;}}
 return job;
}
async function surgeRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);if(!env.DB)return json({error:'Scanner storage unavailable'},503);const db=surgeStore(env),key='surge-job:'+owner;let job;
 try{const settings=await db.read('surge-settings:'+owner)??{enabled:false,exchange:'delta',quote:'USD'},history=await db.read('surge-alerts:'+owner)??{events:[]};job=await db.read(key);
 if(request.method==='GET')return json(surgePublic(job,settings,history.events));
 if(request.method!=='POST'||request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
 const raw=await request.text();if(raw.length>1024)return json({error:'Request too large'},413);const b=JSON.parse(raw);
 if(b.action==='pause'){settings.enabled=false;await db.save('surge-settings:'+owner,settings);return json(surgePublic(job,settings,history.events))}
 const lease='surge-lock:'+owner,now=Date.now(),lock=await db.q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE background_scans.updated_at < ?',lease,'{}',now,now-90000).run();if(lock.meta.changes!==1)return json({...surgePublic(job,settings,history.events),busy:true});
 try{
 if(b.action==='start'){
  if(!['delta','shark'].includes(b.exchange)||!(b.exchange==='delta'?b.quote==='USD':['INR','USDT'].includes(b.quote)))throw Error('Choose an exchange and quote currency');
  Object.assign(settings,{enabled:true,exchange:b.exchange,quote:b.quote});await db.save('surge-settings:'+owner,settings);
  if(!job||job.exchange!==b.exchange||job.quote!==b.quote||job.phase==='failed'||job.phase==='done'&&job.slot!==Math.floor(Date.now()/300000))job=await surgeStart(b.exchange,b.quote);
 }else if(b.action==='step'){if(!settings.enabled)throw Error('Volume alerts are paused');if(!job||b.id!==job.id)return json({error:'Scan changed. Refresh to resume.'},409);if(['rank','scan'].includes(job.phase))job=await surgeAdvance(job,env,owner,u.origin,true);}
 else throw Error('Unknown scanner action');
 await db.save(key,job);return json(surgePublic(job,settings,(await db.read('surge-alerts:'+owner))?.events??[]));
 }finally{await db.q('DELETE FROM background_scans WHERE id = ? AND updated_at = ?',lease,now).run();}
 }catch(e){if(job){job.phase='failed';job.error=e.message;await db.save(key,job)}return json({error:e.message||'Volume scanner unavailable',job:job?surgePublic(job,null,[]).job:null},503)}
}

async function surgeServiceRoute(request,env){
 const u=new URL(request.url),visitor=request.headers.get('oai-authenticated-user-id');if(!env.DB||env.BACKGROUND_SERVICE_ENABLED!=='true'||!env.TRADE_OWNER_EMAIL||(visitor&&request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL))return json({error:'Background scanner unavailable'},403);
 const db=surgeStore(env);if(request.method==='GET')return json(await db.read('surge-service-status')??{checkedAt:null,scans:[]});
 if(request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json')||(request.headers.get('origin')&&request.headers.get('origin')!==u.origin))return json({error:'Same-origin JSON POST required'},403);
 try{const text=await request.text();if(text.length>1024)return json({error:'Request too large'},413);const input=JSON.parse(text),saved=(await db.q('SELECT id,payload FROM background_scans WHERE id LIKE ?','surge-settings:%').all()).results,scans=[];
 for(const setting of saved){const settings=JSON.parse(setting.payload);if(!settings.enabled)continue;const owner=setting.id.slice('surge-settings:'.length),lease='surge-lock:'+owner,now=Date.now(),lock=await db.q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE background_scans.updated_at < ?',lease,'{}',now,now-90000).run();if(lock.meta.changes!==1){scans.push({busy:true,more:true});continue}let job=await db.read('surge-job:'+owner);
 try{if(!job||job.phase==='failed'||job.phase==='done'&&job.slot!==Math.floor(Date.now()/300000)||job.exchange!==settings.exchange||job.quote!==settings.quote)job=await surgeStart(settings.exchange,settings.quote);
 if(['rank','scan'].includes(job.phase))job=await surgeAdvance(job,env,owner,u.origin,input.deliver===true);await db.save('surge-job:'+owner,job);scans.push({exchange:job.exchange,quote:job.quote,phase:job.phase,more:['rank','scan'].includes(job.phase),completedAt:job.completedAt??null,errors:job.errors,delivery:job.delivery??null});
 }catch(e){if(job){job.phase='failed';job.error=e.message;await db.save('surge-job:'+owner,job)}scans.push({phase:'failed',error:e.message,more:false});}
 finally{await db.q('DELETE FROM background_scans WHERE id = ? AND updated_at = ?',lease,now).run();}}
 const result={checkedAt:Date.now(),scans,more:scans.some(s=>s.more)};await db.save('surge-service-status',result);return json(result);
 }catch{return json({error:'Background volume scanner unavailable'},503)}
}
