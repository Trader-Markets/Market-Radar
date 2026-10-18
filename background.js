// Shared public-market scan. Access is restricted to the owner-private Site by dispatch.
// BACKGROUND_SERVICE_ENABLED is configured only while the Site is owner-private.
const backgroundDefaults={enabled:true,watchlist:[{exchange:'delta',symbol:'BTCUSD'},{exchange:'delta',symbol:'ETHUSD'},{exchange:'shark',symbol:'BTCUSDT'},{exchange:'shark',symbol:'ETHUSDT'}]};
const backgroundSeconds={'15m':900,'30m':1800,'5m':300,'1h':3600,'4h':14400,'1d':86400};
function backgroundBars(raw,ex,tf,now=Date.now()){
 let rows=raw?.result??raw?.data??raw;if(!Array.isArray(rows))throw Error('Candle response unavailable');let sec=backgroundSeconds[tf];
 let bars=rows.map(x=>({time:ex==='delta'?+x.time*1000:+x.startTime,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume})).filter(x=>x.time+sec*1000<=now&&Number.isFinite(x.time)&&x.open>0&&x.close>0&&x.low>0&&x.high>=Math.max(x.open,x.close)&&x.low<=Math.min(x.open,x.close)&&Number.isFinite(x.volume)&&x.volume>=0);
 const seen=new Map();for(const c of bars){if(seen.has(c.time)&&JSON.stringify(seen.get(c.time))!==JSON.stringify(c))throw Error('Conflicting closed candle data');seen.set(c.time,c)}bars=[...seen.values()].sort((a,b)=>a.time-b.time);
 if(!bars.length||now-bars.at(-1).time>sec*2000)throw Error('Candle feed is stale');
 for(let i=1;i<bars.length;i++)if(bars[i].time-bars[i-1].time!==sec*1000)throw Error('Candle history has gaps');return bars;
}
async function backgroundCandles(ex,symbol,tf,count){let sec=backgroundSeconds[tf],end=Math.floor(Date.now()/1000),delta=ex==='delta',url=delta?'https://api.india.delta.exchange/v2/history/candles?resolution='+tf+'&symbol='+symbol+'&start='+(end-sec*(count+3))+'&end='+end:'https://api.sharkexchange.in/v1/market/klines?priceType=LAST_PRICE';let r=await fetch(url,{method:delta?'GET':'POST',headers:{accept:'application/json','content-type':'application/json','user-agent':'MarketRadar/1.0'},body:delta?undefined:JSON.stringify({pair:symbol,interval:tf,limit:Math.min(1000,count+3)}),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Exchange returned HTTP '+r.status);return backgroundBars(await r.json(),ex,tf)}
async function backgroundRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email'),service=u.pathname.endsWith('/run');
 if(!env.DB)return json({error:'Background storage unavailable'},503);
 if(service){if(env.BACKGROUND_SERVICE_ENABLED!=='true'||(owner&&email!==env.TRADE_OWNER_EMAIL))return json({error:'Background service unavailable'},403)}
 else if(!owner||!env.TRADE_OWNER_EMAIL||email!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);
 const q=(sql,...a)=>env.DB.prepare(sql).bind(...a),read=async id=>{let r=await q('SELECT * FROM background_scans WHERE id = ?',id).first();return r?JSON.parse(r.payload):null},save=(id,value)=>q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at',id,JSON.stringify(value),Date.now()).run();
 try{
 const savedSettings=await read('settings'),settings=savedSettings??backgroundDefaults;
 if(request.method==='GET'&&!service)return json({configured:!!savedSettings,settings,last:await read('last'),serviceAvailable:env.BACKGROUND_SERVICE_ENABLED==='true'});
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('origin')&&request.headers.get('origin')!==u.origin)return json({error:'Same-origin request required'},403);
 if(!service&&request.headers.get('origin')!==u.origin)return json({error:'Same-origin request required'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},400);
 let raw=await request.text();if(raw.length>8192)return json({error:'Request too large'},413);let b=JSON.parse(raw);
 if(!service){if(!Array.isArray(b.watchlist)||b.watchlist.length<1||b.watchlist.length>8||b.watchlist.some(t=>!['delta','shark'].includes(t.exchange)||!/^([A-Z0-9]{2,30})(USD|USDT|INR)$/.test(t.symbol)||t.exchange==='delta'&&!t.symbol.endsWith('USD')))throw Error('Enter 1–8 valid exchange symbols.');let unique=[...new Map(b.watchlist.map(t=>[t.exchange+':'+t.symbol,{exchange:t.exchange,symbol:t.symbol}])).values()];await save('settings',{enabled:b.enabled===true,watchlist:unique});return json({saved:true})}
 if(typeof monitorServiceRoute==='function')await monitorServiceRoute(new Request(u.origin+'/api/trade-monitor/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({deliver:b.deliver===true})}),env);
 if(!settings.enabled)return json({skipped:true,reason:'Background scans are paused'});
 const now=Date.now(),slot=Math.floor(now/3600000),previous=await read('last');
 if(previous?.slot===slot&&previous.completedAt)return json({...previous,alreadyScanned:true});
 let claim=await q('INSERT OR IGNORE INTO background_scans(id,payload,updated_at) VALUES(?,?,?)','lock:'+slot,'{}',now).run();
 if(claim.meta.changes!==1)return json({skipped:true,reason:'This hourly scan is running or was interrupted. The next hour retries.'});
 let result={slot,startedAt:now,completedAt:null,scope:settings.watchlist,results:[],filtered:[],errors:[],delivery:'No new qualifying alerts',news:'News risk unverified; review current news before trading.'};
 for(let t of settings.watchlist){try{
  let h=await backgroundCandles(t.exchange,t.symbol,'1h',75),f=await backgroundCandles(t.exchange,t.symbol,'4h',330),d=[];
  try{d=await backgroundCandles(t.exchange,t.symbol,'1d',997)}catch(e){result.errors.push({...t,strategy:'breakout',error:e.message})}
  let evaluated=backgroundStrategy.evaluate(h,f,d),five=null;result.sweeps??=[];result.sweeps.push({...t,events:[...backgroundStrategy.sweeps(h,3600000).map(x=>({...x,tf:'1H'})),...backgroundStrategy.sweeps(f,14400000).map(x=>({...x,tf:'4H'}))]});
  for(let mode of ['scalp','ema','breakout','cross']){let signal=evaluated[mode],p=backgroundStrategy.plan(h,f,mode,d);if(!p)continue;let closedAt=signal.time+backgroundSeconds[signal.tf]*1000,validUntil=closedAt+(mode==='cross'?3600000:backgroundSeconds[signal.tf]*1000);if(Date.now()>validUntil)continue;five??=await backgroundCandles(t.exchange,t.symbol,'5m',90);let guard=backgroundStrategy.breakoutGuard(p,mode==='ema'?h.at(-1).time+3600000:closedAt,five,mode==='cross'?f:h);if(!guard.passed){result.filtered.push({...t,mode,reason:guard.reason,guard});continue}let live=await requireFreshQuote(t.exchange,t.symbol),price=live.price;if(mode!=='cross'&&p.side*(price-p.level)<=0)continue;if(p.side*(price-p.stop)<=0||p.side*(price-p.target)>=0||Math.abs(price-p.entry)>p.risk*.25)continue;result.results.push({...t,mode,confirmed:p.confirmed,entry:p.entry,stop:p.stop,target:p.target,side:p.side,signalAt:closedAt,validUntil})}
 }catch(e){result.errors.push({...t,error:e.message})}}
 result.completedAt=Date.now();
 // Deliver only to recipients with existing saved opt-in. The service cannot change recipients or secrets.
 if(b.deliver===true){const saved=await env.DB.prepare('SELECT * FROM whatsapp_settings WHERE enabled = 1').bind().all();
  for(let setting of saved.results??[]){const matches=result.results.filter(x=>x.confirmed||setting.forming);if(!matches.length)continue;
   let key='background:'+matches.map(x=>[x.exchange,x.symbol,x.mode,x.signalAt,!!x.confirmed].join(':')).sort().join('|');
   const hash=hex(await crypto.subtle.digest('SHA-256',enc.encode(key)));let message=matches.map(x=>`${x.exchange} ${x.symbol} ${x.mode}: ${x.confirmed?'confirmed':'forming — wait for close'}, entry ${x.entry}, stop ${x.stop}, target ${x.target}`).join('; ').slice(0,1300)+'. Hourly candle scan, not a live entry instruction. Check fresh price, spread and news.';
   let response=await whatsappBackground(env,setting.owner,{action:'alert',key:'background:'+hash,title:(matches[0].symbol+' '+(matches[0].side===1?'Long':'Short')+' · '+matches[0].mode+' · '+(matches[0].confirmed?'Confirmed — review entry':'Forming — wait for close')+(matches.length>1?' · +'+(matches.length-1)+' setups':'')).slice(0,150),message,kind:matches.some(x=>x.confirmed)?'confirmed':'forming',at:Date.now()},u.origin);let status=await response.json();result.delivery=status.note??status.reason??status.error??'Skipped';
  }
 }else result.delivery='Delivery not requested for this run';
 await save('last',result);await q('DELETE FROM background_scans WHERE updated_at < ? AND id LIKE ?',Date.now()-7*86400000,'lock:%').run();return json(result);
 }catch(e){return json({error:e.message||'Background scan unavailable'},400)}
}
