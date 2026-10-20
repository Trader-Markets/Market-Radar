// Exchange sessions contain overnight/weekend gaps: do not reuse crypto's continuous-calendar validator.
function equityClosedBars(raw,resolution,now,regularSession=false){const duration=['D','1D'].includes(resolution)?86400000:resolution.endsWith('S')?Number(resolution.slice(0,-1))*1000:Number(resolution)*60000;const seen=new Set();return raw.filter(r=>Array.isArray(r)&&r.length>=6).map(r=>({time:Number(r[0])*1000,open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])})).filter(c=>{if(seen.has(c.time))return false;seen.add(c.time);return c.time<=now&&Object.values(c).every(Number.isFinite)&&c.low>0&&c.high>=Math.max(c.open,c.close)&&c.low<=Math.min(c.open,c.close)&&c.volume>=0&&(['1W','1M'].includes(resolution)?equityPeriodEnd(c.time,resolution):regularSession?equityBarEnd(c.time,resolution):c.time+duration)<=now}).sort((a,b)=>a.time-b.time)}
function equityBarEnd(at,resolution){const local=new Date(at+19800000),day=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-19800000,close=day+55800000;return ['D','1D'].includes(resolution)?close:Math.min(at+(resolution.endsWith('S')?Number(resolution.slice(0,-1))*1000:Number(resolution)*60000),close)}
// Calendar candles are confirmed only after their calendar period has ended in IST.
function equityPeriodEnd(at,resolution){const d=new Date(at+19800000),day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-19800000;return resolution==='1M'?Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)-19800000:day+(7-(d.getUTCDay()+6)%7)*86400000}
function equitySignals(h,f,d,quote){
 const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
 const ema=(a,n)=>{if(a.length<n+20)return null;let e=avg(a.slice(0,n).map(c=>c.close));for(const c of a.slice(n))e+=(c.close-e)*2/(n+1);return e};
 const c=h.at(-1),p=h.slice(-21,-1),fc=f.at(-1),ready=!!c&&p.length===20;
 const high=ready?Math.max(...p.map(x=>x.high)):null,low=ready?Math.min(...p.map(x=>x.low)):null;
 const up=ready&&c.close>high,down=ready&&c.close<low,side=up?1:down?-1:0,level=up?high:down?low:null;
 const base=ready?avg(p.map(x=>x.volume)):0,volume=base>0?c.volume/base:null;
 const live=ready&&Date.now()-c.time<=7200000&&quote.valid&&(side===1?quote.price>level:side===-1&&quote.price<level);
 const span=ready?c.high-c.low:0,edge=span>0&&(side===1?(c.close-c.low)/span>=.75:(c.high-c.close)/span>=.75);
 const sweptHigh=ready&&c.high>high&&c.close<=high,sweptLow=ready&&c.low<low&&c.close>=low;
 const breakout=side&&volume>=2&&edge&&Math.abs(c.close/level-1)<=.01&&!sweptHigh&&!sweptLow&&live;
 const e=ema(f,200),last=f.slice(-12),rangeHigh=Math.max(...last.map(x=>x.high)),rangeLow=Math.min(...last.map(x=>x.low));
 const consolidation=e!==null&&fc&&Math.abs(fc.close/e-1)<=.02&&rangeHigh/rangeLow-1<=.05;
 const ma=(a,n)=>a.length>=n?avg(a.slice(-n).map(x=>x.close)):null,fast=ma(f,50),slow=ma(f,200),oldFast=ma(f.slice(0,-1),50),oldSlow=ma(f.slice(0,-1),200);
 const gold=oldSlow!==null&&oldFast<=oldSlow&&fast>slow,death=oldSlow!==null&&oldFast>=oldSlow&&fast<slow;
 return [
  {strategy:'1H volume breakout',status:!ready?'Unavailable':breakout?'Confirmed':'Watch',reason:!ready?'Needs 21 closed 1H candles':volume===null?'No traded volume: index volume confirmation unavailable':!quote.valid?'Live quote stale, missing or market closed':`Volume ${volume.toFixed(2)}×; closed range ${low}–${high}`,side,level,candleAt:c?.time??null},
  {strategy:'4H 200 EMA consolidation',status:e===null?'Unavailable':consolidation?'Watch':'No setup',reason:e===null?'Needs at least 220 closed 4H candles':'Consolidation is a watch, not a confirmed breakout',level:e},
  {strategy:'Golden / death cross',status:slow===null?'Unavailable':gold||death?'Watch':'No setup',reason:slow===null?'Needs at least 200 closed 4H candles':gold?'50 SMA crossed above 200 SMA':death?'50 SMA crossed below 200 SMA':'Latest closed 4H 50/200 SMA comparison'},
  {strategy:'Liquidity sweep',status:!ready?'Unavailable':sweptHigh||sweptLow?'Detected':'Not detected',reason:!ready?'Needs 21 closed 1H candles':sweptHigh?'High swept; closed back inside range':sweptLow?'Low swept; closed back inside range':'Separate candle-pattern check; does not prove stop orders'},
  {strategy:'Multi-timeframe / ATH',status:'Unavailable',reason:'Lifetime ATH and full monthly alignment are not verified by this scan. No confirmation issued.'}
 ];
}
