// Owner-scoped, read-only Dhan strategy watchlist. No order or messaging operations.
async function indianWatchRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);
 if(!env.DB)return json({error:'Indian watchlist storage unavailable'},503);
 const q=(s,...a)=>env.DB.prepare(s).bind(...a),read=()=>q('SELECT * FROM indian_watch WHERE owner = ?',owner).first(),parse=row=>row?JSON.parse(row.payload):{enabled:false,symbols:[],results:{},alerts:[],revision:0};
 try{
 if(request.method==='GET'&&u.pathname==='/api/indian-watch'){const row=await read();return json({settings:parse(row),busy:!!row&&row.busy_until>Date.now(),runner:env.INDIAN_WATCH_LOCAL_RUNNER==='true'?'Local server: each saved symbol due every minute; bounded sequential checks while the terminal stays open':'Manual checks only; hosted background scheduling is not configured'})}
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
 const raw=await request.text();if(raw.length>8192)return json({error:'Request too large'},413);const b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error('JSON object required');
 if(u.pathname==='/api/indian-watch'){
  if(typeof b.enabled!=='boolean'||!Array.isArray(b.symbols)||b.symbols.length>8||b.enabled&&!b.symbols.length||b.symbols.some(s=>typeof s!=='string'||!/^NSE:[A-Z0-9&._-]{2,65}$/.test(s)))throw Error('Choose up to eight exact NSE symbols; an enabled watchlist needs at least one.');
  const previous=parse(await read()),symbols=[...new Set(b.symbols)],next={enabled:b.enabled,symbols,results:Object.fromEntries(Object.entries(previous.results).filter(([s])=>symbols.includes(s))),alerts:previous.alerts,revision:previous.revision+1};
  await q('INSERT INTO indian_watch(owner,payload,busy_until) VALUES(?,?,0) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload',owner,JSON.stringify(next)).run();return json({saved:true,settings:next});
 }
 if(u.pathname!=='/api/indian-watch/step')return json({error:'Not found'},404);
 let row=await read(),settings=parse(row);if(!settings.enabled)return json({skipped:true,reason:'Indian strategy watchlist is paused'});
 const now=Date.now(),symbol=settings.symbols.filter(s=>!settings.results[s]?.checkedAt||now-settings.results[s].checkedAt>=60000).sort((a,b)=>(settings.results[a]?.checkedAt??0)-(settings.results[b]?.checkedAt??0))[0];
 if(!symbol)return json({skipped:true,reason:'Each saved symbol was checked within the last minute'});
 const claimed=await q('UPDATE indian_watch SET busy_until = ? WHERE owner = ? AND busy_until <= ?',now+90000,owner,now).run();if(claimed.meta.changes!==1)return json({skipped:true,reason:'A saved Indian check is already running'});
 try{
  let result;try{const response=await dhanRoute(new Request(u.origin+'/api/dhan/scan?symbol='+encodeURIComponent(symbol),{headers:request.headers}),env),d=await response.json();if(!response.ok||d.error)throw Error(d.error||'Dhan scan unavailable');if(d.symbol!==symbol||!Array.isArray(d.results))throw Error('Invalid Dhan scan response');result={symbol,checkedAt:Date.now(),source:d.source,diagnostics:d.diagnostics,results:d.results,errors:d.errors||[]}}catch(e){result={symbol,checkedAt:Date.now(),error:e.message}}
  const current=await read(),latest=parse(current);if(latest.revision!==settings.revision||!latest.enabled)return json({skipped:true,reason:'Settings changed; old check discarded'});
  latest.results[symbol]=result;
  if(!result.error&&!result.errors?.length&&result.diagnostics?.requestsComplete&&result.diagnostics?.quoteFresh)for(const r of result.results||[]){if(r.status!=='Confirmed'||!Number.isFinite(r.candleAt)||r.candleAt>Date.now()||Date.now()-r.candleAt>7200000)continue;const key=symbol+':'+r.strategy+':'+r.candleAt;if(!latest.alerts.some(a=>a.key===key))latest.alerts.unshift({key,title:symbol+' · '+r.strategy+' · Confirmed at check',at:result.checkedAt})}
  latest.alerts=latest.alerts.slice(0,40);
  await q('UPDATE indian_watch SET payload = ? WHERE owner = ? AND payload = ?',JSON.stringify(latest),owner,current.payload).run();return json({checked:true,result,delivery:'Saved in-site only; no WhatsApp message sent'});
 }finally{await q('UPDATE indian_watch SET busy_until = 0 WHERE owner = ?',owner).run()}
 }catch(e){return json({error:e.message||'Indian watchlist unavailable'},400)}
}
