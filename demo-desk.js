// Isolated paper funds. Entry fills are simulated at the user's entered price.
// Marks and exits always come from fresh exchange quotes, never submitted browser prices.
function demoInitial(){return {cash:{USD:10000,USDT:10000,INR:10000},realized:{USD:0,USDT:0,INR:0},positions:[],history:[],requests:[]}}
function demoNormalize(s){s.realized??=Object.fromEntries(['USD','USDT','INR'].map(c=>[c,s.history.filter(p=>p.currency===c).reduce((n,p)=>n+p.pnl,0)]));return s}
function demoFunds(s,c){return s.cash[c]-s.positions.filter(p=>p.currency===c).reduce((n,p)=>n+p.margin,0)}
function demoPrice(b,now){if(!Number.isFinite(b.price)||b.price<=0||!Number.isFinite(b.at)||now-b.at>15000||b.at>now+1000)throw Error('A fresh price is required. Wait for the live feed.');return b.price}
function demoFinish(s,p,price,reason,now){const gross=p.side*p.units*(price-p.entry),fee=p.units*price*.001,net=gross-p.entryFee-fee;s.cash[p.currency]+=gross-fee;s.realized[p.currency]+=net;s.positions=s.positions.filter(x=>x.id!==p.id);s.history.unshift({...p,exit:price,closedAt:now,reason,pnl:net});s.history=s.history.slice(0,100)}
function demoChange(s,b,now=Date.now()){
 demoNormalize(s);
 if(b.action==='open'){
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(b.requestId??''))throw Error('Invalid demo request ID');
  if(s.requests.includes(b.requestId))return s;
  if(!['delta','shark'].includes(b.exchange)||!/^[A-Z0-9]{2,35}$/.test(b.symbol)||!['USD','USDT','INR'].includes(b.currency)||!(b.exchange==='delta'?b.currency==='USD'&&b.symbol.endsWith('USD'):['INR','USDT'].includes(b.currency)&&b.symbol.endsWith(b.currency)))throw Error('Choose a valid exchange coin');
  if(![b.entry,b.stop,b.target,b.units,b.leverage].every(Number.isFinite)||Math.min(b.entry,b.stop,b.target,b.units)<=0||![1,-1].includes(b.side)||![1,2,3,5].includes(b.leverage)||b.side*(b.entry-b.stop)<=0||b.side*(b.target-b.entry)<=0)throw Error('Enter a valid demo plan');
  if(s.positions.length>=20)throw Error('Close a demo position before opening more (maximum 20).');
  let price=demoPrice(b,now);if(b.side*(price-b.stop)<=0||b.side*(b.target-price)<=0)throw Error('The current price has passed your stop or target. Use latest price and update the plan.');
  if(Math.abs(price/b.entry-1)>.05)throw Error('Demo entry is more than 5% from the current price. Use latest price or enter a closer price.');
  const margin=b.units*b.entry/b.leverage,fee=b.units*b.entry*.001;
  if(!Number.isFinite(margin)||!Number.isFinite(fee)||margin+fee>demoFunds(s,b.currency)+1e-8)throw Error('Insufficient demo margin including entry fee');
  s.cash[b.currency]-=fee;s.positions.push({id:b.requestId,exchange:b.exchange,symbol:b.symbol,currency:b.currency,entry:b.entry,stop:b.stop,target:b.target,units:b.units,side:b.side,leverage:b.leverage,margin,entryFee:fee,strategy:typeof monitorStrategy==='function'?monitorStrategy(b.strategy):null,openedAt:now,mark:price,markAt:b.at});s.requests.push(b.requestId);s.requests=s.requests.slice(-500);
 }else if(b.action==='mark'||b.action==='close'){
  const price=demoPrice(b,now);
  if(b.action==='close'){const p=s.positions.find(x=>x.id===b.id);if(!p)return s;if(p.exchange!==b.exchange||p.symbol!==b.symbol)throw Error('Price does not match this position');if(b.at<p.markAt)throw Error('Received an older price. Please retry.');demoFinish(s,p,price,'Manual close',now)}
  else for(const p of [...s.positions])if(p.exchange===b.exchange&&p.symbol===b.symbol&&b.at>=p.markAt){p.mark=price;p.markAt=b.at;if(p.side*(price-p.stop)<=0)demoFinish(s,p,price,'Stop observed',now);else if(p.side*(price-p.target)>=0)demoFinish(s,p,price,'Target observed',now)}
 }else throw Error('Unknown demo action');return s;
}
async function demoRoute(request,env){
 const u=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(!owner||!env.TRADE_OWNER_EMAIL||request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL)return json({error:'Sign in to your site to use the saved demo account.'},403);
 if(!env.DB)return json({error:'Demo storage unavailable'},503);
 const q=(sql,...a)=>env.DB.prepare(sql).bind(...a),read=()=>q('SELECT * FROM demo_accounts WHERE owner = ?',owner).first();
 try{
  let row=await read();
  if(request.method==='GET')return json({state:row?demoNormalize(JSON.parse(row.payload)):demoInitial(),version:row?.version??0,errors:[]});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
  let raw=await request.text();if(raw.length>4096)return json({error:'Request too large'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
  if(b.action==='quote'){if(!['delta','shark'].includes(b.exchange)||!/^[A-Z0-9]{2,35}$/.test(b.symbol))throw Error('Choose a valid exchange coin');return json({quote:await requireFreshQuote(b.exchange,b.symbol)})}
  if(!['open','close','sync'].includes(b.action))return json({error:'Unknown demo action'},400);
  if(!row){await q('INSERT OR IGNORE INTO demo_accounts(owner,payload,version) VALUES(?,?,?)',owner,JSON.stringify(demoInitial()),0).run();row=await read()}
  let initial=demoNormalize(JSON.parse(row.payload));
  if(b.action==='open'&&initial.requests.includes(b.requestId))return json({state:initial,version:row.version,errors:[],duplicate:true});
  if(b.action==='close'&&!initial.positions.some(p=>p.id===b.id))return json({state:initial,version:row.version,errors:[],alreadyClosed:true});
  // Fetch a fresh quote for each unique open coin, bounded to six parallel calls.
  let targets=b.action==='sync'?initial.positions:b.action==='close'?[initial.positions.find(p=>p.id===b.id)]:[b];
  if(targets.some(t=>!['delta','shark'].includes(t.exchange)||!/^[A-Z0-9]{2,35}$/.test(t.symbol)))throw Error('Choose a valid exchange coin');
  let unique=[...new Map(targets.map(p=>[p.exchange+':'+p.symbol,p])).values()],quotes=new Map(),errors=[],next=0;
  async function fetchQuote(){while(next<unique.length){let p=unique[next++],key=p.exchange+':'+p.symbol;try{quotes.set(key,await requireFreshQuote(p.exchange,p.symbol))}catch(e){errors.push({exchange:p.exchange,symbol:p.symbol,error:e.message})}}}
  await Promise.all(Array.from({length:Math.min(6,unique.length)},fetchQuote));
  if(b.action!=='sync'&&errors.length)return json({error:errors[0].error,errors},422);
  for(let attempt=0;attempt<3;attempt++){
   let state=demoNormalize(JSON.parse(row.payload));
   if(b.action==='sync'){for(let [key,v] of quotes){let [exchange,symbol]=key.split(':');try{demoChange(state,{action:'mark',exchange,symbol,...v})}catch(e){errors.push({exchange,symbol,error:e.message})}}}
   else if(b.action==='close'){let p=state.positions.find(p=>p.id===b.id);if(p)demoChange(state,{action:'close',id:p.id,exchange:p.exchange,symbol:p.symbol,...quotes.get(p.exchange+':'+p.symbol)})}
   else demoChange(state,{...b,...quotes.get(b.exchange+':'+b.symbol)});
   if(JSON.stringify(state)===row.payload)return json({state,version:row.version,errors});
   let changed=await q('UPDATE demo_accounts SET payload = ?, version = version + 1 WHERE owner = ? AND version = ?',JSON.stringify(state),owner,row.version).run();
   if(changed.meta.changes===1)return json({state,version:row.version+1,errors});
   row=await read();
  }
  return json({error:'Demo account is busy in another tab. Please try again.',conflict:true},409);
 }catch(e){return json({error:e.message||'Demo account unavailable'},400)}
}
