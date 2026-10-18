(function(root){
const frames={'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400};
function parse(text,{symbol,quote}={}){
 if(typeof text!=='string'||!text.trim()||text.length>300)throw Error('Write an alert of up to 300 characters.');
 if(!/^[A-Z0-9]{3,35}$/.test(symbol??'')||!['USD','USDT','INR'].includes(quote))throw Error('Choose a listed coin and quote currency.');
 const base=symbol.slice(0,-quote.length),aliases=[symbol.toLowerCase(),base.toLowerCase(),...(base==='BTC'?['bitcoin']:base==='ETH'?['ethereum']:[])];
 let input=text.trim().toLowerCase().replace(/[?.!]$/,'').replace(/\s+/g,' ').replace(/^(?:tell|alert|notify) me (?:when|if) /,'').replace(/^the /,'');
 const pieces=input.split(/\s+(and|or)\s+/);if(pieces.length>3)throw Error('Use one or two conditions joined by and or or.');
 const join=pieces.length===3?pieces[1]:'and',conditions=[pieces[0],...(pieces.length===3?[pieces[2]]:[])].map(piece=>{
  let a=piece.trim().replace(/^the /,''),first=a.match(/^([a-z0-9]+)\s+/);if(first&&aliases.includes(first[1]))a=a.slice(first[0].length);
  a=a.replace(/^(?:price\s+)?(?:is\s+)?/,'');const direction=a.match(/^(below|above)\s+/);if(!direction)throw Error('Use “'+base+' below 80000” or “'+base+' below 200 EMA on 5m”.');
  const op=direction[1];a=a.slice(direction[0].length).replace(/^the\s+/,'');
  const ema=a.match(/^(?:(\d+)\s*ema|ema\s*(\d+))\s+(?:on\s+)?(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)(?:\s+(?:time\s*frame|candles?))?$/);
  if(ema){const period=Number(ema[1]??ema[2]),unit=ema[4][0]==='m'?'m':ema[4][0]==='h'?'h':'d',tf=Number(ema[3])+unit;if(!Number.isInteger(period)||period<2||period>500||!frames[tf])throw Error('EMA: use 2–500 periods on 5m, 15m, 30m, 1h, 4h or 1d.');return {type:'ema',op,period,tf};}
  const price=a.match(/^(?:(\$|₹)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?:\s+(usd|usdt|inr))?$/);
  if(!price)throw Error('This rule is not supported. Use a price or EMA condition; formulas and other indicators are not supported.');
  if(price[3]&&price[3].toUpperCase()!==quote||price[1]==='₹'&&quote!=='INR'||price[1]==='$'&&quote==='INR')throw Error('Use '+quote+' prices for this market.');
  const value=Number(price[2].replace(/,/g,''));if(!(value>0&&Number.isFinite(value)&&value<=1e12))throw Error('Enter a positive price up to 1 trillion.');return {type:'price',op,value};
 });return {symbol,quote,join,conditions};
}
function describe(rule){return rule.symbol+' · '+rule.conditions.map(c=>c.type==='price'?c.op+' '+c.value.toLocaleString('en-US',{maximumFractionDigits:12})+' '+rule.quote:c.op+' '+c.period+' EMA · '+c.tf).join(' '+rule.join.toUpperCase()+' ');}
function evaluate(rule,quote,history={},now=Date.now()){
 if(!quote||!Number.isFinite(quote.price)||quote.price<=0||!Number.isFinite(quote.at)||quote.at>now+1000||now-quote.at>15000)throw Error('Live price unavailable or stale; alert was not evaluated.');
 const checks=rule.conditions.map(c=>{try{let threshold=c.value,barEnd=null;if(c.type==='ema'){
  const sec=frames[c.tf],bars=history[c.tf]??[],expected=Math.floor(now/(sec*1000))*sec*1000;
  if(bars.length<c.period+20||bars.at(-1).time+sec*1000!==expected||bars.some((b,i)=>!['time','open','high','low','close','volume'].every(k=>Number.isFinite(b[k]))||b.low<=0||b.high<Math.max(b.open,b.close)||b.low>Math.min(b.open,b.close)||b.volume<0||b.time%(sec*1000)!==0||b.time+sec*1000>now||i&&b.time-bars[i-1].time!==sec*1000))throw Error('Complete, current '+c.tf+' EMA history unavailable.');
  let ema=bars.slice(0,c.period).reduce((n,b)=>n+b.close,0)/c.period;for(const bar of bars.slice(c.period))ema+=(bar.close-ema)*2/(c.period+1);threshold=ema;barEnd=expected;
 }return {...c,threshold,price:quote.price,barEnd,met:c.op==='below'?quote.price<threshold:quote.price>threshold};}catch(e){return {...c,met:null,error:e.message};}});
 return {met:rule.join==='or'?checks.some(c=>c.met===true):checks.every(c=>c.met===true),error:checks.filter(c=>c.error).map(c=>c.error).join(' · ')||null,checks,price:quote.price,quoteAt:quote.at,checkedAt:now};
}
root.CustomAlertRules={parse,describe,evaluate,frames};
})(typeof window!=='undefined'?window:globalThis);
