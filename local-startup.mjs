import net from 'node:net';
export const LOCAL_BUILD='2026.10.18.release.2';
export async function inspectLocalServer(port,{probe,read}={}){
 const occupied=probe?await probe(port):await new Promise(resolve=>{const socket=net.createConnection({port,host:'127.0.0.1'});let done=false;const finish=value=>{if(done)return;done=true;socket.destroy();resolve(value)};socket.setTimeout(1500,()=>finish(true));socket.once('connect',()=>finish(true));socket.once('error',e=>finish(e.code!=='ECONNREFUSED'))});
 if(!occupied)return {state:'free'};
 try{const response=await (read||fetch)(`http://localhost:${port}/api/local-version`,{signal:AbortSignal.timeout(2500),cache:'no-store'});if(response.ok){const version=await response.json();if(version.app==='market-radar'&&version.build===LOCAL_BUILD&&version.telegramSetup===true)return {state:'current'}}}catch{}
 return {state:'occupied',message:`An older Market Radar server or another program is using port ${port}.\nClose the OLD Market Radar terminal window, then press any key in this NEW launcher to try again.\nDo not just close the browser tab. The Telegram page cannot work until the updated server starts.\nNo saved accounts or trade history have been deleted.`}
}
