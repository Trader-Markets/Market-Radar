import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';

// The adapter exposes only authentication and channel reads. No message sending or trading APIs.
export async function telegramAdapter(config){
 const {TelegramClient,Api}=await import('telegram');
 const {StringSession}=await import('telegram/sessions/index.js');
 const {computeCheck}=await import('telegram/Password.js');
 const {Logger}=await import('telegram/extensions/Logger.js');
 const client=new TelegramClient(new StringSession(config.session||''),config.apiId,config.apiHash,{connectionRetries:3,requestRetries:2,floodSleepThreshold:0,baseLogger:new Logger('none'),autoReconnect:true});
 let entity;
 return {
  connect:()=>client.connect(),authorized:()=>client.checkAuthorization(),connected:()=>client.connected,
  sendCode:phone=>client.sendCode(config,phone),
  code:async(phone,hash,code)=>{const r=await client.invoke(new Api.auth.SignIn({phoneNumber:phone,phoneCodeHash:hash,phoneCode:code}));if(r instanceof Api.auth.AuthorizationSignUpRequired)throw Error('SIGNUP_REQUIRED')},
  password:async password=>{const info=await client.invoke(new Api.account.GetPassword());await client.invoke(new Api.auth.CheckPassword({password:await computeCheck(info,password)}))},
  session:()=>client.session.save(),
  channel:async()=>{entity=await client.getEntity('lmwmnews');if(!entity.broadcast)throw Error('CHANNEL_INVALID');if(entity.left)throw Error('CHANNEL_NOT_JOINED');return String(entity.id)},
  messages:()=>client.getMessages(entity,{limit:50}),
  photo:async message=>{const data=await client.downloadMedia(message,{progressCallback:(received)=>{if(Number(received)>5*1024*1024)throw Error('IMAGE_TOO_LARGE')}});if(!Buffer.isBuffer(data)||data.length>5*1024*1024)throw Error('IMAGE_UNAVAILABLE');return data},
  listen:handler=>client.addEventHandler(update=>{if(update instanceof Api.UpdateNewChannelMessage||update instanceof Api.UpdateEditChannelMessage)handler({channelId:String(update.message.peerId?.channelId||''),message:update.message});else if(update instanceof Api.UpdateDeleteChannelMessages)handler({channelId:String(update.channelId),deleted:update.messages})}),
  close:()=>client.destroy()
 }
}
function safeError(e){const s=String(e?.errorMessage||e?.message||'');if(/FLOOD_WAIT/.test(s))return 'Telegram rate limit: wait '+(Number(e.seconds)||60)+' seconds before retrying.';return ({CONNECTION_TIMEOUT:'Telegram did not respond within 20 seconds. Retry the saved connection, or check your internet.',PHONE_NUMBER_INVALID:'Enter a valid phone number with country code.',PHONE_CODE_INVALID:'Incorrect code. Try again.',PHONE_CODE_EXPIRED:'Code expired. Start again to request a new code.',API_ID_INVALID:'Check your API ID and API hash.',PASSWORD_HASH_INVALID:'Incorrect Telegram two-step verification password.',CHANNEL_NOT_JOINED:'Join @lmwmnews in Telegram, then reconnect.',SIGNUP_REQUIRED:'Use an existing Telegram account.',AUTH_KEY_UNREGISTERED:'Telegram session expired. Disconnect and sign in again.',SESSION_REVOKED:'Telegram session revoked. Disconnect and sign in again.'})[s]||'Telegram connection unavailable. Check your internet and retry.'}
export function createTelegramService({DB,secret,origin,adapter=telegramAdapter,now=Date.now,operationTimeoutMs=20000}){
 const key=Buffer.from(secret,'hex');let client=null,config=null,phone='',codeHash='',expires=0,channelId='',state='disconnected',error='',lastSyncAt=null,lastEventAt=null,busy=false,nextRetry=0,items=new Map(),mediaMessages=new Map(),photoCache=new Map(),photoPending=new Map(),photoBytes=0,generation=0,syncEvents=null;
 const ready=DB.prepare('CREATE TABLE IF NOT EXISTS local_telegram_vault (id INTEGER PRIMARY KEY, value TEXT NOT NULL)').bind().run();
 function encrypt(value){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return JSON.stringify({iv:iv.toString('hex'),data:Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]).toString('hex'),tag:c.getAuthTag().toString('hex')})}
 function decrypt(value){const v=JSON.parse(value),c=createDecipheriv('aes-256-gcm',key,Buffer.from(v.iv,'hex'));c.setAuthTag(Buffer.from(v.tag,'hex'));return JSON.parse(Buffer.concat([c.update(Buffer.from(v.data,'hex')),c.final()]).toString())}
 async function openAdapter(settings){
  const raw=await adapter(settings),wrapped={...raw};
  for(const name of ['connect','authorized','sendCode','code','password','channel','messages'])wrapped[name]=async(...args)=>{
   let timer;try{return await Promise.race([Promise.resolve().then(()=>raw[name](...args)),new Promise((_,reject)=>{timer=setTimeout(()=>{if(client===wrapped){generation++;client=null;channelId='';}Promise.resolve().then(()=>raw.close()).catch(()=>{});reject(Error('CONNECTION_TIMEOUT'))},operationTimeoutMs)})])}finally{clearTimeout(timer)}
  };
  wrapped.close=async()=>{let timer;try{await Promise.race([Promise.resolve().then(()=>raw.close()),new Promise(resolve=>{timer=setTimeout(resolve,Math.min(operationTimeoutMs,5000))})])}finally{clearTimeout(timer)}};
  return wrapped;
 }
 async function save(){await ready;await DB.prepare('INSERT OR REPLACE INTO local_telegram_vault(id,value) VALUES(1,?)').bind(encrypt({...config,session:client.session()})).run()}
 function put(m){
  if(!Number.isSafeInteger(m.id)||!Number.isFinite(Number(m.date)))return;
  const types={MessageEntityBold:'bold',MessageEntityItalic:'italic',MessageEntityUnderline:'underline',MessageEntityStrike:'strike',MessageEntityCode:'code',MessageEntityPre:'pre',MessageEntityBlockquote:'blockquote',MessageEntitySpoiler:'spoiler',MessageEntityUrl:'url',MessageEntityTextUrl:'textUrl'},text=String(m.message||'').slice(0,16000);
  const entities=(m.entities||[]).map(e=>({type:types[e.className],offset:e.offset,length:e.length,...(types[e.className]==='textUrl'?{url:e.url}:{})})).filter(e=>e.type&&Number.isInteger(e.offset)&&Number.isInteger(e.length)&&e.offset>=0&&e.length>0&&e.offset+e.length<=text.length).slice(0,200);
  const photo=m.photo||m.media?.photo,doc=m.document||m.media?.document,image=photo||(['image/jpeg','image/png','image/webp','image/gif'].includes(doc?.mimeType)&&Number(doc?.size)<=5*1024*1024?doc:null),mediaKey=image?String(image.id):'';
  const media=image&&/^[0-9-]+$/.test(mediaKey)?{kind:'photo',url:'/api/telegram-media/'+m.id+'?v='+mediaKey}:null;
  if(media)mediaMessages.set(m.id,m);else mediaMessages.delete(m.id);
  items.set(m.id,{id:m.id,title:text||(!media?'Media post — open in Telegram':''),entities,media,groupedId:m.groupedId?String(m.groupedId):null,at:new Date(Number(m.date)*1000).toISOString(),edited:!!m.editDate,url:'https://t.me/lmwmnews/'+m.id});
  items=new Map([...items].sort((a,b)=>b[0]-a[0]).slice(0,50));for(const id of mediaMessages.keys())if(!items.has(id))mediaMessages.delete(id);
 }
 function clearPhotoCache(){photoCache.clear();photoPending.clear();photoBytes=0}
 async function photoResponse(request){
  const json=(error,status)=>Response.json({error},{status,headers:{'cache-control':'no-store'}});
  if(request.method!=='GET')return json('Method not allowed',405);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json('Local access required',403);
  const u=new URL(request.url),id=Number(u.pathname.split('/').pop()),post=items.get(id),message=mediaMessages.get(id);
  if(!post?.media||!message||!client||u.pathname+u.search!==post.media.url)return json('Image not available in the saved channel feed',404);
  const cacheKey=post.media.url,version=generation;
  try{
   let data=photoCache.get(cacheKey);
   if(!data){if(!photoPending.has(cacheKey)){if(photoPending.size>=3)return json('Image loading is busy; refresh shortly',429);const pending=client.photo(message).then(value=>{if(version!==generation)throw Error('SESSION_CHANGED');if(!Buffer.isBuffer(value)||value.length>5*1024*1024)throw Error('IMAGE_TOO_LARGE');while(photoBytes+value.length>20*1024*1024&&photoCache.size){const k=photoCache.keys().next().value;photoBytes-=photoCache.get(k).length;photoCache.delete(k)}photoCache.set(cacheKey,value);photoBytes+=value.length;return value}).finally(()=>{if(version===generation)photoPending.delete(cacheKey)});photoPending.set(cacheKey,pending)}data=await photoPending.get(cacheKey)}
   if(version!==generation||items.get(id)?.media?.url!==cacheKey)return json('Image is no longer in the channel feed',404);
   const mime=data[0]===0xff&&data[1]===0xd8?'image/jpeg':data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':data.subarray(0,4).toString()==='GIF8'?'image/gif':data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP'?'image/webp':null;
   if(!mime)return json('Unsupported image',415);
   return new Response(data,{headers:{'content-type':mime,'content-length':String(data.length),'cache-control':'private, no-store','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'}});
  }catch{return json('Image download unavailable; open the original post in Telegram',502)}
 }
 function applyUpdate(update){if(update.deleted)for(const id of update.deleted){items.delete(id);mediaMessages.delete(id)}else if(update.message)put(update.message)}
 async function sync(){const version=generation,active=client,events=[];syncEvents=events;try{const messages=await active.messages();if(version!==generation)return;items.clear();mediaMessages.clear();for(const m of messages)put(m);for(const event of events)applyUpdate(event);lastSyncAt=now();state='connected';error=''}finally{if(syncEvents===events)syncEvents=null}}
 async function activate(){channelId=await client.channel();const version=generation;client.listen(update=>{if(version!==generation||update.channelId!==channelId)return;if(syncEvents)syncEvents.push(update);applyUpdate(update);lastEventAt=now()});await sync();phone='';codeHash='';expires=0}
 async function close(){generation++;clearPhotoCache();mediaMessages.clear();const old=client;client=null;if(old)await old.close().catch(()=>{});channelId=''}
 function status(){return {local:true,channel:'lmwmnews',state:state==='connected'&&!client?.connected()?'reconnecting':state,busy,error,canRetry:!!config?.session,available:state==='connected'&&!!client?.connected(),checkedAt:now(),lastSuccessAt:lastSyncAt,lastEventAt,articles:[...items.values()].sort((a,b)=>b.id-a.id)}}
 async function restore(){if(busy)return;busy=true;try{await ready;const row=await DB.prepare('SELECT value FROM local_telegram_vault WHERE id=1').bind().first();if(!row)return;config=decrypt(row.value);state='connecting';await close();client=await openAdapter(config);await client.connect();if(!await client.authorized())throw Error('AUTH_KEY_UNREGISTERED');await activate()}catch(e){error=safeError(e);state='error';nextRetry=now()+60000}finally{busy=false}}
 async function action(d){if(busy)throw Error('BUSY');busy=true;try{
  error='';
  if(d.action==='retry'){
   if(!config?.session)throw Error('AUTH_KEY_UNREGISTERED');
   state='connecting';await close();client=await openAdapter(config);await client.connect();if(!await client.authorized())throw Error('AUTH_KEY_UNREGISTERED');await activate();nextRetry=0;return
  }
  if(d.action==='disconnect'){await close();await ready;await DB.prepare('DELETE FROM local_telegram_vault WHERE id=1').bind().run();config=null;phone='';codeHash='';expires=0;items.clear();lastSyncAt=null;lastEventAt=null;state='disconnected';return}
  if(d.action==='connect'){
   const apiId=Number(d.apiId),apiHash=String(d.apiHash||'');if(!Number.isSafeInteger(apiId)||apiId<=0||!/^\w{32}$/.test(apiHash)||!/^\+[1-9]\d{6,14}$/.test(String(d.phone||'')))throw Error('INPUT_INVALID');
   if(state==='connected')throw Error('ALREADY_CONNECTED');await close();config={apiId,apiHash};phone=d.phone;client=await openAdapter(config);state='connecting';await client.connect();const sent=await client.sendCode(phone);codeHash=sent.phoneCodeHash;expires=now()+10*60000;state='code';return
  }
  if(d.action==='code'||d.action==='password'){
   if(!client||now()>expires){state='disconnected';throw Error('PHONE_CODE_EXPIRED')}
   if(d.action==='code'){if(state!=='code'||!/^\d{4,10}$/.test(String(d.value||'')))throw Error('INPUT_INVALID');try{await client.code(phone,codeHash,d.value)}catch(e){if(e.errorMessage==='SESSION_PASSWORD_NEEDED'||e.message==='SESSION_PASSWORD_NEEDED'){state='password';return}throw e}}
   else {if(state!=='password'||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('INPUT_INVALID');await client.password(d.value)}
   await save();config.session=client.session();await activate();return
  }
  throw Error('INPUT_INVALID');
 }catch(e){error=e.message==='INPUT_INVALID'?'Check the fields and try again.':e.message==='ALREADY_CONNECTED'?'Disconnect before switching accounts.':safeError(e);if(!client||!['code','password','connected'].includes(state))state='error';if(state==='error')nextRetry=now()+60000;throw Error(error)}finally{busy=false}}
 async function route(request){const u=new URL(request.url),json=(d,status=200)=>Response.json(d,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Open this page from Market Radar.'},403);
  if(request.method==='GET')return json(status());
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(u.origin!==origin||request.headers.get('origin')!==origin||request.headers.get('x-radar-local')!=='1'||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin local request required'},403);
  if(busy)return json({error:'Connection step already running. Please wait.'},409);
  let d;try{d=await request.json();if(!d||typeof d!=='object'||Array.isArray(d))throw Error()}catch{return json({error:'Invalid JSON object'},400)}
  try{await action(d);return json(status())}catch(e){return json({...status(),error:e.message},400)}
 }
 const startup=restore();const timer=setInterval(async()=>{if(busy||now()<nextRetry)return;if(config?.session&&state==='error'){await restore();return}if(state!=='connected')return;busy=true;try{if(!client.connected())await client.connect();await sync()}catch(e){error=safeError(e);state='error';nextRetry=now()+60000}finally{busy=false}},30000);timer.unref();
 return {route,photoResponse,startup,status,stop:async()=>{clearInterval(timer);await close()}};
}
