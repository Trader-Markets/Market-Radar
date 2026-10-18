// Owner-only WhatsApp delivery. Credentials share the encrypted account vault.
async function whatsappRoute(request,env,backgroundOwner=null){
 const u=new URL(request.url),owner=backgroundOwner??request.headers.get('oai-authenticated-user-id');
 if(!owner||!env.TRADE_OWNER_EMAIL||(!backgroundOwner&&request.headers.get('oai-authenticated-user-email')!==env.TRADE_OWNER_EMAIL))return json({error:'Owner sign-in required'},403);
 if(!env.DB||!env.TRADE_SESSION_SECRET)return json({error:'Alert storage unavailable'},503);
 const q=(sql,...args)=>env.DB.prepare(sql).bind(...args);
 try{
  let saved=await q('SELECT * FROM whatsapp_settings WHERE owner = ?',owner).first();
  if(request.method==='GET'){let c=saved?await unseal(saved.cipher,env.TRADE_SESSION_SECRET):null;return json({configured:!!saved,enabled:!!saved?.enabled,forming:!!saved?.forming,updates:!!saved?.updates,to:c?.to??'',from:c?.from??'',sid:c?.sid??'',content:c?.content??'',titleOnly:!!c?.titleOnly,lastAt:saved?.last_at??0});}
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON required'},403);
  const raw=await request.text();if(raw.length>8192)return json({error:'Request too large'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
  if(b.action==='save'){
   let old=saved?await unseal(saved.cipher,env.TRADE_SESSION_SECRET):{};
   let c={sid:String(b.sid??'').trim(),token:String(b.token||old.token||'').trim(),from:String(b.from??'').trim(),to:String(b.to??'').trim(),content:String(b.content??'').trim(),titleOnly:b.titleOnly===true};
   if(!/^AC[a-f0-9]{32}$/i.test(c.sid)||!/^HX[a-f0-9]{32}$/i.test(c.content)||!/^\+[1-9]\d{7,14}$/.test(c.from)||!/^\+[1-9]\d{7,14}$/.test(c.to)||c.token.length<16||c.token.length>256)throw Error('Enter valid Twilio account/template IDs, token and phone numbers with country codes.');
   if(b.enabled===true&&b.consent!==true)throw Error('Confirm this is your number and you want alerts.');
   await q('INSERT INTO whatsapp_settings(owner,cipher,enabled,forming,updates,last_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET cipher=excluded.cipher,enabled=excluded.enabled,forming=excluded.forming,updates=excluded.updates',owner,await seal(c,env.TRADE_SESSION_SECRET),b.enabled===true?1:0,b.forming===true?1:0,b.updates===true?1:0,0).run();return json({saved:true});
  }
  if(b.action==='pause'){await q('UPDATE whatsapp_settings SET enabled = 0 WHERE owner = ?',owner).run();return json({enabled:false});}
  if(!['test','alert'].includes(b.action))return json({error:'Unknown action'},400);
  if(!saved||!saved.enabled)return json({skipped:true,reason:'WhatsApp alerts are off'});
  if(b.action==='alert'){
   if(!['confirmed','forming','update'].includes(b.kind))throw Error('Invalid alert type');
   if((b.kind==='forming'&&!saved.forming)||(b.kind==='update'&&!saved.updates))return json({skipped:true});
   if(!Number.isFinite(b.at)||Date.now()-b.at>120000||b.at>Date.now()+1000)throw Error('Alert is stale');
   if(typeof b.key!=='string'||b.key.length>180||typeof b.title!=='string'||typeof b.message!=='string'||b.title.length>150||b.message.length>1600)throw Error('Invalid alert');
  }
  const template=await unseal(saved.cipher,env.TRADE_SESSION_SECRET);if(!template.titleOnly)return json({skipped:true,reason:'Save a one-variable title-only Twilio template in Settings before delivery.'});
  const key=owner+':'+(b.action==='test'?'test:'+Math.floor(Date.now()/60000):b.key);
  let claimed=await q('INSERT OR IGNORE INTO whatsapp_events(id,owner,status,created_at) VALUES(?,?,?,?)',key,owner,'claimed',Date.now()).run();if(claimed.meta.changes!==1)return json({skipped:true,reason:'Already handled'});
  let limited=await q('UPDATE whatsapp_settings SET last_at = ? WHERE owner = ? AND last_at < ?',Date.now(),owner,Date.now()-60000).run();
  if(limited.meta.changes!==1){await q('DELETE FROM whatsapp_events WHERE id = ?',key).run();return json({error:'WhatsApp rate limit: one message per minute. Try the next scan.'},429)}
  const c=await unseal(saved.cipher,env.TRADE_SESSION_SECRET),clean=s=>s.replace(/\s+/g,' ').trim();
  let title=b.action==='test'?'Market Radar test':b.title,message=b.action==='test'?'WhatsApp setup is working. This is a test, not a trade signal.':b.message;
  let body=new URLSearchParams({From:'whatsapp:'+c.from,To:'whatsapp:'+c.to,ContentSid:c.content,ContentVariables:JSON.stringify({'1':'*'+clean(title).replace(/\*/g,'')+'*'})});
  let response;try{response=await fetch('https://api.twilio.com/2010-04-01/Accounts/'+c.sid+'/Messages.json',{method:'POST',headers:{Authorization:'Basic '+btoa(c.sid+':'+c.token),'content-type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(15000)})}catch{await q('UPDATE whatsapp_events SET status = ? WHERE id = ?','unknown',key).run();return json({error:'Provider outcome unknown. Check Twilio logs before retrying.'},502)}
  let result=await response.json().catch(()=>({}));
  await q('UPDATE whatsapp_events SET status = ? WHERE id = ?',response.ok?'accepted':'failed',key).run();
  await q('DELETE FROM whatsapp_events WHERE owner = ? AND created_at < ?',owner,Date.now()-30*86400000).run();
  if(!response.ok)return json({error:'WhatsApp provider rejected the message'+(Number.isInteger(result.code)?' (code '+result.code+')':'')+'. Check sender, template approval and recipient in Twilio.'},502);
  return json({accepted:true,note:'Accepted by WhatsApp provider; delivery is not yet confirmed.'});
 }catch(e){return json({error:e.message?.startsWith('Enter ')||e.message?.startsWith('Confirm ')||e.message?.startsWith('Invalid ')||e.message==='Alert is stale'?e.message:'WhatsApp settings or storage unavailable. Try again.'},400)}
}

async function whatsappBackground(env,owner,body,origin){return whatsappRoute(new Request(origin+'/api/whatsapp',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),env,owner)}
