// Owner-scoped, one-shot in-site alerts. No account or messaging-provider writes.
function customStore(env){const q=(sql,...args)=>env.DB.prepare(sql).bind(...args);return {q,async rows(owner){return (await q('SELECT * FROM custom_alerts WHERE owner = ? ORDER BY updated_at DESC',owner).all()).results??[]},read:(owner,id)=>q('SELECT * FROM custom_alerts WHERE owner = ? AND id = ?',owner,id).first()};}
function customPublic(rows){return rows.map(r=>({id:r.id,version:r.version,enabled:!!r.enabled,...JSON.parse(r.payload)}));}
async function customRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);
 if(!env.DB)return json({error:'Custom alert storage unavailable'},503);const db=customStore(env);
 try{
  if(request.method==='GET')return json({alerts:customPublic(await db.rows(owner))});
  if(request.method!=='POST'||request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
  const raw=await request.text();if(raw.length>2048)return json({error:'Request too large'},413);const b=JSON.parse(raw);
  if(b.action==='create'){
   if(!['delta','shark'].includes(b.exchange)||!(b.exchange==='delta'?b.quote==='USD':['INR','USDT'].includes(b.quote))||typeof b.symbol!=='string'||!b.symbol.endsWith(b.quote))throw Error('Choose an exchange, market and listed coin.');
   const rule=customRules.parse(b.text,{symbol:b.symbol,quote:b.quote});
   if(b.requestId!==undefined&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(b.requestId))throw Error('Invalid save request ID');const id=b.requestId??crypto.randomUUID(),existing=await db.read(owner,id);if(existing){const old=JSON.parse(existing.payload);if(old.exchange!==b.exchange||old.text!==b.text.trim()||JSON.stringify(old.rule)!==JSON.stringify(rule))return json({error:'Save request changed. Start a new save.'},409);return json({saved:true,alerts:customPublic(await db.rows(owner))});}if(b.exchange==='delta')await getProduct(b.symbol);else await sharkProduct(b.symbol);const value={exchange:b.exchange,text:b.text.trim(),rule,description:customRules.describe(rule),createdAt:Date.now(),checkedAt:null,firedAt:null,title:null,error:null};
   const inserted=await db.q('INSERT INTO custom_alerts(id,owner,payload,enabled,version,updated_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM custom_alerts WHERE owner = ?) < 20',id,owner,JSON.stringify(value),1,0,Date.now(),owner).run();if(inserted.meta.changes!==1)throw Error('You can save 20 alerts. Delete an old alert before adding another.');return json({saved:true,alerts:customPublic(await db.rows(owner))});
  }
  if(['pause','rearm','delete'].includes(b.action)){
   const row=await db.read(owner,String(b.id));if(!row)return json({error:'Alert not found'},404);
   if(!Number.isSafeInteger(b.version)||b.version!==row.version)return json({error:'Alert changed. Refresh and try again.'},409);
   let result;if(b.action==='delete')result=await db.q('DELETE FROM custom_alerts WHERE owner = ? AND id = ? AND version = ?',owner,row.id,row.version).run();
   else{const value=JSON.parse(row.payload);if(b.action==='rearm'){value.firedAt=null;value.title=null;value.checkedAt=null;value.error=null;value.last=null;}result=await db.q('UPDATE custom_alerts SET payload = ?, enabled = ?, version = version + 1, updated_at = ? WHERE owner = ? AND id = ? AND version = ?',JSON.stringify(value),b.action==='rearm'?1:0,Date.now(),owner,row.id,row.version).run();}
   if(result.meta.changes!==1)return json({error:'Alert changed. Refresh and try again.'},409);return json({alerts:customPublic(await db.rows(owner))});
  }
  if(b.action!=='check')throw Error('Unsupported alert action');
  if(!Array.isArray(b.ids)||b.ids.length>4||b.ids.some(id=>typeof id!=='string'||id.length>60)||new Set(b.ids).size!==b.ids.length)throw Error('Check up to four saved alerts per batch.');
  const lease='custom-alert-lock:'+owner,now=Date.now(),lock=await db.q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE background_scans.updated_at < ?',lease,'{}',now,now-120000).run();if(lock.meta.changes!==1)return json({busy:true,alerts:customPublic(await db.rows(owner))});
  try{
   const historyCache=new Map(),quoteCache=new Map();let sharkNext=0;
   async function pace(ex){if(ex!=='shark')return;let wait=Math.max(0,sharkNext-Date.now());if(wait)await new Promise(r=>setTimeout(r,wait));sharkNext=Date.now()+1200;}
   for(const id of b.ids){const row=await db.read(owner,id);if(!row?.enabled)continue;const value=JSON.parse(row.payload);
    try{
     const history={};for(const c of value.rule.conditions.filter(c=>c.type==='ema')){const key=value.exchange+':'+value.rule.symbol+':'+c.tf,count=Math.min(997,Math.max(250,c.period*3));if(!historyCache.has(key)||historyCache.get(key).count<count){await pace(value.exchange);try{historyCache.set(key,{count,bars:await backgroundCandles(value.exchange,value.rule.symbol,c.tf,count)})}catch(e){historyCache.set(key,{count,bars:[],error:e.message})}}history[c.tf]=historyCache.get(key).bars;}
     const key=value.exchange+':'+value.rule.symbol;if(!quoteCache.has(key)||Date.now()-quoteCache.get(key).at>10000){await pace(value.exchange);quoteCache.set(key,await requireFreshQuote(value.exchange,value.rule.symbol))}
     const check=customRules.evaluate(value.rule,quoteCache.get(key),history);value.last=check;value.checkedAt=check.checkedAt;value.error=check.error;
     if(check.met){value.firedAt=Date.now();value.title='CUSTOM ALERT · '+value.description;}
    }catch(e){value.checkedAt=Date.now();value.error=e.message||'Market check unavailable';}
    // Concurrent pause/delete/re-arm wins over any earlier in-flight market read.
    await db.q('UPDATE custom_alerts SET payload = ?, enabled = ?, version = version + 1, updated_at = ? WHERE owner = ? AND id = ? AND version = ? AND enabled = 1',JSON.stringify(value),value.firedAt?0:1,Date.now(),owner,id,row.version).run();
   }
   return json({alerts:customPublic(await db.rows(owner)),checkedAt:Date.now()});
  }finally{await db.q('DELETE FROM background_scans WHERE id = ? AND updated_at = ?',lease,now).run();}
 }catch(e){return json({error:e.message||'Custom alerts unavailable'},400)}
}
