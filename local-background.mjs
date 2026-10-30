// Schedule only the explicitly saved watchlist; broker and delivery settings stay server-owned.
export function startLocalWatchlist({worker,env,origin,interval=setInterval,clear=clearInterval,onError=()=>{}}){
 let busy=false,stopped=false;
 const headers={origin,'content-type':'application/json','oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':env.TRADE_OWNER_EMAIL};
 async function tick(){
  if(busy||stopped)return;busy=true;
  try{
   const response=await worker.fetch(new Request(origin+'/api/background',{headers}),env);
   if(!response.ok)throw Error('Watchlist status unavailable');const data=await response.json();
   if(stopped||!data?.configured||!data.settings?.enabled)return;
   const slot=Math.floor(Date.now()/60000);if(data.last?.slot===slot&&data.last.completedAt)return;
   const result=await worker.fetch(new Request(origin+'/api/background/run',{method:'POST',headers,body:JSON.stringify({deliver:true})}),env);
   if(!result.ok)throw Error('Watchlist scan unavailable');
  }catch(error){onError(error)}finally{busy=false}
 }
 const timer=interval(tick,60000);timer?.unref?.();
 return {tick,stop(){stopped=true;clear(timer)}};
}

// No broker mutations or delivery; each step saves one due symbol server-side.
export function startLocalIndianWatch({worker,env,origin,interval=setInterval,clear=clearInterval,onError=()=>{}}){
 let busy=false,stopped=false;const headers={origin,'content-type':'application/json','oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':env.TRADE_OWNER_EMAIL};
 async function tick(){if(busy||stopped)return;busy=true;try{const read=await worker.fetch(new Request(origin+'/api/indian-watch',{headers}),env);if(!read.ok)throw Error('Indian watch status unavailable');const d=await read.json();if(stopped||!d.settings?.enabled||d.busy)return;const symbols=d.settings.symbols;if(Array.isArray(symbols)&&!symbols.some(s=>!d.settings.results?.[s]?.checkedAt||Date.now()-d.settings.results[s].checkedAt>=60000))return;const r=await worker.fetch(new Request(origin+'/api/indian-watch/step',{method:'POST',headers,body:'{}'}),env);if(!r.ok)throw Error('Indian watch check unavailable')}catch(e){onError(e)}finally{busy=false}}
 const timer=interval(tick,2000);timer?.unref?.();return{tick,stop(){stopped=true;clear(timer)}};
}
