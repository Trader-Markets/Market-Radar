// Saved strategy identity is retained with the reviewed order, never inferred from a new scan.
function monitorStrategy(value){
 if(value==null)return null;
 if(!['scalp','breakout','ema','cross','surge'].includes(value.mode)||!Number.isFinite(value.level)||value.level<=0||!Number.isFinite(value.signalAt)||value.signalAt<=0)throw Error('Invalid strategy tracking context');
 return {mode:value.mode,level:value.level,signalAt:value.signalAt};
}
// Recheck at review and submit; cached browser results never authorize an entry.
async function verifyStrategyEntry(exchange,symbol,strategy,plan,tick){
 if(strategy==null)return;
 const context=monitorStrategy(strategy),now=Date.now(),window=context.mode==='ema'?14400000:3600000;
 if(context.signalAt>now||now-context.signalAt>window)throw Error('Strategy entry window expired. Load a fresh setup.');
 const fine=await backgroundCandles(exchange,symbol,'5m',90),parent=await backgroundCandles(exchange,symbol,context.mode==='cross'?'4h':'1h',90),p={...plan,mode:context.mode,level:context.level};
 const guard=backgroundStrategy.breakoutGuard(p,context.signalAt,fine,parent,Date.now(),tick);
 if(!guard.passed)throw Error('Entry blocked: '+guard.reason);
 const quote=await requireFreshQuote(exchange,symbol),risk=p.side*(p.entry-p.stop);
 if(context.mode!=='cross'&&p.side*(quote.price-context.level)<=0||p.side*(quote.price-p.stop)<=0||p.side*(p.target-quote.price)<=0||!(risk>0)||Math.abs(quote.price-p.entry)>risk*.25)throw Error('Strategy price no longer qualifies. Load a fresh setup.');
}
const monitorNames={surge:'Volume surge',scalp:'1H breakout',breakout:'MTF breakout',ema:'200 EMA',cross:'SMA cross'};
function monitorHealth(t,quote,bars,now=Date.now(),fine){
 const result=(code,action,severity='info')=>({code,title:`${t.demo?'Demo · ':''}${t.symbol} ${t.side===1?'Long':'Short'} · ${monitorNames[t.strategy.mode]} · ${action}`,severity});
 if(!quote||!Number.isFinite(quote.price)||quote.price<=0||!Number.isFinite(quote.at)||now-quote.at>15000||quote.at>now+1000)return result('stale','Live price unavailable — check broker','warning');
 const price=quote.price,risk=t.initialRisk;
 if(t.stopBreached||t.side*(price-t.stop)<=0)return result('stop','Stop breached — review exit now','urgent');
 const liq=t.liquidation;
 if(liq>0&&(t.side*(price-liq)<=Math.max(price*.01,risk*.5)))return result('liquidation','Liquidation near — review leverage / size now','urgent');
 if(t.targetObserved||t.side*(price-t.target)>=0)return result('target','Target reached — review profit taking','warning');
 if(t.protected===false)return result('unprotected','Stop coverage unverified — check broker now','urgent');
 if(!(risk>0))return result('changed','Position changed — review strategy link','warning');
 const tf=t.strategy.mode==='cross'?14400000:3600000;
 if(!bars?.length||bars.at(-1).time+tf>now||now-(bars.at(-1).time+tf)>tf)return result('history','Strategy check unavailable — review trade','warning');
 const last=bars.at(-1),afterEntry=last.time+tf>t.openedAt;
 if(t.strategy.mode==='cross'){
  if(bars.length<200)return result('history','Strategy check unavailable — review trade','warning');
  const mean=a=>a.reduce((n,c)=>n+c.close,0)/a.length,fast=mean(bars.slice(-50)),slow=mean(bars.slice(-200));
  if(afterEntry&&t.side*(fast-slow)<=0)return result('invalid','Crossover reversed — review exit','urgent');
 }else if(afterEntry&&t.side*(last.close-t.strategy.level)<0)return result('invalid','Breakout failed on close — review exit','urgent');
 if(fine!==undefined){if(!fine.length||fine.at(-1).time+300000!==Math.floor(now/300000)*300000)return result('history','5m risk checks unavailable — review trade','warning');if(t.strategy.mode!=='cross'&&(t.breakFailed||fine.some(c=>c.time>=t.openedAt&&t.side*(c.close-t.strategy.level)<=0)))return result('failed5m','5m break failed — review exit','urgent');const fastSweep=backgroundStrategy.sweeps(fine,300000,now).find(e=>e.side===t.side&&e.closedAt>t.openedAt);if(fastSweep)return result('sweep',fastSweep.label+' on 5m — review failed-break risk','warning');}
 const sweep=backgroundStrategy.sweeps(bars,tf,now).find(e=>e.side===t.side&&e.closedAt>t.openedAt);if(sweep)return result('sweep',sweep.label+' — review failed-break risk','warning');
 const r=t.side*(price-t.entry)/risk;
 if(t.peakR>=2&&t.peakR-r>=1)return result('giveback','Profit retreating — review smaller position','warning');
 if(r<=-.5)return result('weak','Trade weakening — review position size','warning');
 if(t.side*(price-t.strategy.level)<0&&t.strategy.mode!=='cross')return result('retest','Breakout level lost — await close / review risk','warning');
 if(r>=1)return result('profit','Up 1R+ — review profit protection','info');
 return result('holding','Strategy holding — keep monitoring','info');
}
function monitorStore(env){const q=(sql,...args)=>env.DB.prepare(sql).bind(...args);return {q,
 async read(owner){return (await q('SELECT * FROM trade_monitors WHERE owner = ? ORDER BY updated_at DESC LIMIT 100',owner).all()).results.map(r=>({...JSON.parse(r.payload),id:r.id,active:!!r.active}))},
 async save(owner,t){await q('INSERT INTO trade_monitors(id,owner,payload,active,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,active=excluded.active,updated_at=excluded.updated_at WHERE trade_monitors.active = 1',t.id,owner,JSON.stringify(t),t.active===false?0:1,Date.now()).run()},
 async event(owner,t,h){const key=t.id+':'+h.code+':'+Math.floor(Date.now()/900000);if(t.health?.code===h.code)return;await q('INSERT OR IGNORE INTO trade_monitor_events(id,owner,payload,created_at) VALUES(?,?,?,?)',key,owner,JSON.stringify({id:key,title:h.title,severity:h.severity,symbol:t.symbol,exchange:t.exchange,mode:t.strategy.mode,code:h.code,demo:!!t.demo}),Date.now()).run()},
 async events(owner){return (await q('SELECT * FROM trade_monitor_events WHERE owner = ? ORDER BY created_at DESC LIMIT 50',owner).all()).results.map(r=>({...JSON.parse(r.payload),at:r.created_at}))}
}}
async function monitorDiscover(env,owner,db){
 const saved=await db.read(owner),existing=new Set(saved.map(t=>t.id));
 const intents=(await db.q("SELECT * FROM trade_intents WHERE owner = ? AND status = 'accepted' ORDER BY expires DESC LIMIT 100",owner).all()).results;
 for(const row of intents){const p=JSON.parse(row.payload);if(p.action!=='open'||!p.strategy||existing.has('live:'+row.id))continue;
  const accepted=JSON.parse(row.result??'{}'),a=accepted.result??accepted.data??accepted;const s=p.summary,side=String(s.side).toLowerCase()==='buy'?1:-1;
  await db.save(owner,{id:'live:'+row.id,exchange:row.symbol.startsWith('shark:')?'shark':'delta',symbol:p.symbol,side,entry:+s.entry,stop:+s.stop,target:+s.target,initialRisk:side*(+s.entry-+s.stop),strategy:p.strategy,productId:p.body.product_id,orderId:a.id??a.orderId??a.clientOrderId??p.body.client_order_id,added:row.expires-60000,openedAt:row.expires-60000,seenOpen:false,active:!saved.some(t=>t.active&&t.id.startsWith('linked:')&&!t.demo&&t.symbol===p.symbol&&t.exchange===(row.symbol.startsWith('shark:')?'shark':'delta'))});
 }
 const row=await db.q('SELECT * FROM demo_accounts WHERE owner = ?',owner).first(),demo=row?JSON.parse(row.payload):{positions:[],history:[]};
 for(const p of [...demo.positions,...demo.history])if(p.strategy&&!existing.has('demo:'+p.id))await db.save(owner,{id:'demo:'+p.id,demo:true,demoId:p.id,exchange:p.exchange,symbol:p.symbol,side:p.side,entry:p.entry,stop:p.stop,target:p.target,initialRisk:p.side*(p.entry-p.stop),strategy:p.strategy,openedAt:p.openedAt,seenOpen:true,active:!saved.some(t=>t.active&&t.demoId===p.id)});
 return demo;
}
async function monitorAccount(env,owner,ex){
 const table=ex==='delta'?'trade_sessions':'shark_sessions',session=await env.DB.prepare('SELECT * FROM '+table+' WHERE owner = ? AND expires > ?').bind(owner,Date.now()).first();
 if(!session)throw Error('Connection unavailable');const saved=await unseal(session.cipher,env.TRADE_SESSION_SECRET),c=ex==='delta'?deltaTransport(saved,env):saved;
 if(ex==='shark')return sharkState(c);
 const [p,orders,fills]=await Promise.all([deltaCall(c,'GET','/v2/positions/margined'),allOrders(c),deltaCall(c,'GET','/v2/fills','?page_size=100').catch(()=>null)]);
 if(!Array.isArray(p.result))throw Error('Positions unavailable');return {positions:p.result,orders,trades:Array.isArray(fills?.result)?fills.result:[]};
}
function monitorPosition(t,account){
 const delta=t.exchange==='delta';
 const positions=account.positions.filter(p=>delta?p.product_id===t.productId&&+p.size!==0:p.contractPair===t.symbol&&p.positionStatus==='OPEN');
 if(positions.length>1)throw Error('Multiple positions require review');const p=positions[0];if(!p)return null;
 const side=delta?(+p.size>0?1:-1):p.positionType==='LONG'?1:p.positionType==='SHORT'?-1:0,entry=+(delta?p.entry_price:p.entryPrice),size=Math.abs(+(delta?p.size:p.quantity));
 if(!side||!(entry>0)||!(size>0))throw Error('Position incomplete');
 const stops=account.orders.filter(o=>delta?o.product_id===t.productId&&o.side===(side===1?'sell':'buy')&&(o.stop_order_type==='stop_loss_order'||+o.bracket_stop_loss_price>0):o.symbol===t.symbol&&o.side===(side===1?'SELL':'BUY')&&o.placeType==='POSITION'&&o.subType==='STOP_LOSS');
 // Full protective coverage cannot be inferred from an unrelated or undersized order.
 const covered=stops.reduce((n,o)=>n+Math.abs(+(delta?(o.unfilled_size??o.size):o.orderAmount)||0),0)>=size;
 const stopPrices=stops.map(o=>+(delta?(o.stop_price??o.bracket_stop_loss_price):(o.stopPrice??o.price))).filter(v=>Number.isFinite(v)&&v>0);const stop=covered&&stopPrices.length?(side===1?Math.min(...stopPrices):Math.max(...stopPrices)):null;
 return {side,entry,size,stop,liquidation:+(delta?p.liquidation_price:p.liquidationPrice)||null,protected:covered,positionId:p.positionId??null};
}
async function monitorRun(env,owner,origin,deliver=true){
 const db=monitorStore(env),demo=await monitorDiscover(env,owner,db),tracks=(await db.read(owner)).filter(t=>t.active),accounts=new Map(),now=Date.now();
 // A persistent lease prevents overlapping tabs from duplicating risk transitions.
 const lock='monitor-lock:'+owner,claim=await db.q('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE background_scans.updated_at < ?',lock,'{}',now,now-120000).run();
 if(claim.meta.changes!==1)return {tracks:await db.read(owner),events:await db.events(owner),busy:true};
 try{
 for(const ex of new Set(tracks.filter(t=>!t.demo).map(t=>t.exchange))){try{accounts.set(ex,await monitorAccount(env,owner,ex))}catch{accounts.set(ex,null)}}
 for(const t of tracks){
  let health;
  try{
   const account=t.demo?demo:accounts.get(t.exchange);if(!account)throw Error('Account unavailable');
   const pos=t.demo?demo.positions.find(p=>p.id===t.demoId):monitorPosition(t,account);
   if(!pos){
    if(t.seenOpen){t.active=false;const closed=t.demo?demo.history.find(p=>p.id===t.demoId):null;health={code:'closed',title:`${t.demo?'Demo · ':''}${t.symbol} · Trade closed${closed?' · '+closed.reason:''}`,severity:'info'};}
    else if(t.orderId&&Date.now()-t.added>60000&&!account.orders.some(o=>String(o.id??o.orderId??o.clientOrderId)===String(t.orderId))){t.active=false;health={code:'inactive',title:`${t.symbol} · No open order or position — tracking ended`,severity:'info'};}
    else health={code:'pending',title:`${t.symbol} · Entry fill not confirmed — check orders`,severity:'info'};
   }else if(!t.demo&&!t.seenOpen&&(!t.orderId||Date.now()-t.added>3600000||!(account.trades??[]).some(f=>String(f.order_id??f.orderId??f.clientOrderId)===String(t.orderId)))){health={code:'fill-unverified',title:`${t.symbol} · Fill link unverified — link open position from chart`,severity:'warning'};
   }else if(!t.demo&&(t.needsRelink||pos.side!==t.side||(t.seenOpen&&(Math.abs(pos.entry/t.entry-1)>.00001||pos.size>t.lastSize||t.positionId&&pos.positionId!==t.positionId)))){
    t.needsRelink=true;health={code:'changed',title:`${t.symbol} · Position changed — relink strategy before relying on alerts`,severity:'warning'};
   }else{
    if(!t.seenOpen){t.entry=pos.entry;t.initialRisk=t.side*(t.entry-t.stop);t.openedAt=Date.now();}
    t.seenOpen=true;t.lastSize=t.demo?pos.units:pos.size;t.positionId=pos.positionId??null;t.protected=t.demo?true:pos.protected;if(pos.stop>0)t.stop=pos.stop;t.liquidation=pos.liquidation??null;
    const quote=await requireFreshQuote(t.exchange,t.symbol);t.price=quote.price;t.quoteAt=quote.at;t.peakR=Math.max(t.peakR??0,t.side*(quote.price-t.entry)/t.initialRisk);
    const tf=t.strategy.mode==='cross'?'4h':'1h',slot=Math.floor(Date.now()/(tf==='4h'?14400000:3600000));
    let bars=t.bars;
    if(t.barSlot!==slot||!bars){try{bars=await backgroundCandles(t.exchange,t.symbol,tf,tf==='4h'?210:32);t.bars=bars;t.barSlot=slot}catch{bars=[]}}
    let fine=t.fineBars,fineSlot=Math.floor(Date.now()/300000);if(t.fineSlot!==fineSlot||!fine){try{fine=await backgroundCandles(t.exchange,t.symbol,'5m',90);t.fineBars=fine;t.fineSlot=fineSlot}catch{fine=[]}}health=monitorHealth(t,quote,bars,Date.now(),fine);if(health.code==='failed5m')t.breakFailed=true;if(health.code==='stop')t.stopBreached=true;if(health.code==='target')t.targetObserved=true;
   }
  }catch{health={code:'unavailable',title:`${t.demo?'Demo · ':''}${t.symbol} · Tracking unavailable — check broker`,severity:'warning'};}
  await db.event(owner,t,health);t.health=health;t.checkedAt=Date.now();await db.save(owner,t);
 }
 const events=await db.events(owner);
 let delivery='WhatsApp updates are off';
 if(deliver){const fresh=events.filter(e=>!e.demo&&now-e.at<=120000).sort((a,b)=>({urgent:0,warning:1,info:2}[a.severity]-{urgent:0,warning:1,info:2}[b.severity]));
  for(const e of fresh){const response=await whatsappBackground(env,owner,{action:'alert',key:e.id,title:e.title,message:'',kind:'update',at:e.at},origin),d=await response.json();delivery=d.note??d.reason??d.error??delivery;if(response.status===429)break;}
 }
 await db.q('DELETE FROM trade_monitor_events WHERE owner = ? AND created_at < ?',owner,Date.now()-30*86400000).run();
 return {tracks:(await db.read(owner)).map(({bars,fineBars,...t})=>t),events,delivery,checkedAt:Date.now(),intervalSeconds:20};
 }finally{await db.q('DELETE FROM background_scans WHERE id = ? AND updated_at = ?',lock,now).run();}
}
async function monitorRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(u.pathname.endsWith('/run'))return monitorServiceRoute(request,env);
 if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Owner sign-in required'},403);
 if(!env.DB)return json({error:'Trade tracking storage unavailable'},503);
 const db=monitorStore(env);
 try{
  if(request.method==='GET')return json({tracks:(await db.read(owner)).map(({bars,fineBars,...t})=>t),events:await db.events(owner)});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
  const raw=await request.text();if(raw.length>4096)return json({error:'Request too large'},413);const b=JSON.parse(raw);
  if(b.action==='link'){
   const strategy=monitorStrategy(b.strategy);if(!strategy||!['delta','shark'].includes(b.exchange)||!/^[A-Z0-9]{2,35}$/.test(b.symbol)||![1,-1].includes(b.side)||![b.stop,b.target].every(x=>Number.isFinite(x)&&x>0))return json({error:'Choose a valid strategy plan.'},400);
   const t={id:'linked:'+crypto.randomUUID(),exchange:b.exchange,symbol:b.symbol,strategy,side:b.side,stop:b.stop,target:b.target,demo:b.demo===true,active:true,seenOpen:true,openedAt:Date.now()};let p;
   if(t.demo){const row=await db.q('SELECT * FROM demo_accounts WHERE owner = ?',owner).first(),positions=row?JSON.parse(row.payload).positions.filter(p=>p.exchange===t.exchange&&p.symbol===t.symbol&&p.side===t.side):[];if(positions.length!==1)return json({error:'Choose a coin with exactly one matching open demo position.'},400);p=positions[0];t.demoId=p.id;t.openedAt=p.openedAt;}
   else{if(t.exchange==='delta')t.productId=(await getProduct(t.symbol)).id;p=monitorPosition(t,await monitorAccount(env,owner,t.exchange));if(!p||p.side!==t.side)return json({error:'No matching open position on this side. Check your account or selected strategy.'},400);}
   t.entry=p.entry;t.initialRisk=t.side*(p.entry-t.stop);t.lastSize=p.size??p.units;t.positionId=p.positionId??null;
   if(!(t.initialRisk>0)||t.side*(t.target-t.entry)<=0)return json({error:'The strategy stop and target do not surround your actual entry. Update the plan first.'},400);
   for(const old of await db.read(owner))if(old.active&&old.exchange===t.exchange&&old.symbol===t.symbol&&!!old.demo===t.demo){old.active=false;await db.save(owner,old)}await db.save(owner,t);return json({linked:true});
  }
  if(b.action==='stop'){const t=(await db.read(owner)).find(t=>t.id===b.id);if(!t)throw Error('Tracked trade not found');t.active=false;await db.save(owner,t);return json({stopped:true})}
  if(b.action==='check')return json(await monitorRun(env,owner,u.origin,true));
  return json({error:'Unknown tracking action'},400);
 }catch{return json({error:'Trade tracking unavailable. Refresh or check your broker.'},503)}
}

// This shared updater is gated by owner-private Sites dispatch and its explicit service switch.
async function monitorServiceRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(env.BACKGROUND_SERVICE_ENABLED!=='true'||!env.DB||!env.TRADE_OWNER_EMAIL||(owner&&request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL))return json({error:'Trade tracking service unavailable'},403);
 if(request.method==='GET'){try{const row=await env.DB.prepare('SELECT payload FROM background_scans WHERE id = ?').bind('trade-monitor-service').first();return json(row?JSON.parse(row.payload):{checkedAt:null})}catch{return json({error:'Trade tracking status unavailable'},503)}}
 if(request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json')||(request.headers.get('origin')&&request.headers.get('origin')!==u.origin))return json({error:'Same-origin JSON POST required'},403);
 try{let raw=await request.text();if(raw.length>1024)return json({error:'Request too large'},413);const b=JSON.parse(raw),owners=(await env.DB.prepare("SELECT DISTINCT owner FROM trade_monitors UNION SELECT DISTINCT owner FROM trade_intents WHERE status = 'accepted' UNION SELECT owner FROM demo_accounts").bind().all()).results;let checks=[];
 for(const {owner} of owners){const result=await monitorRun(env,owner,u.origin,b.deliver===true);checks.push({active:result.tracks.filter(t=>t.active).length,checkedAt:result.checkedAt??null,delivery:result.delivery??'Already running'})}
 const status={checkedAt:Date.now(),accounts:checks.length,checks};await env.DB.prepare('INSERT INTO background_scans(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind('trade-monitor-service',JSON.stringify(status),status.checkedAt).run();return json(status);
 }catch{return json({error:'Trade tracking service failed'},503)}
}
