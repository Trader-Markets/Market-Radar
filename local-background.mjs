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
   const slot=Math.floor(Date.now()/3600000);if(data.last?.slot===slot&&data.last.completedAt)return;
   const result=await worker.fetch(new Request(origin+'/api/background/run',{method:'POST',headers,body:JSON.stringify({deliver:true})}),env);
   if(!result.ok)throw Error('Watchlist scan unavailable');
  }catch(error){onError(error)}finally{busy=false}
 }
 const timer=interval(tick,60000);timer?.unref?.();
 return {tick,stop(){stopped=true;clear(timer)}};
}
