(()=>{
 const points=(bars,values)=>values.flatMap((v,i)=>v===null?[]:[{time:bars[i].time/1000,value:v}]);
 function sma(values,n){let sum=0;return values.map((v,i)=>{sum+=v;if(i>=n)sum-=values[i-n];return i<n-1?null:sum/n})}
 function ema(values,n){let value=null,sum=0;return values.map((v,i)=>{sum+=v;if(i<n-1)return null;value=value===null?sum/n:v*2/(n+1)+value*(1-2/(n+1));return value})}
 function rsi(values,n=14){let gain=0,loss=0;return values.map((v,i)=>{if(!i)return null;const delta=v-values[i-1];gain=i<=n?gain+Math.max(0,delta):gain*(n-1)/n+Math.max(0,delta)/n;loss=i<=n?loss+Math.max(0,-delta):loss*(n-1)/n+Math.max(0,-delta)/n;if(i<n)return null;if(i===n){gain/=n;loss/=n}return loss===0?(gain===0?50:100):100-100/(1+gain/loss)})}
 function bands(values,n=20){const middle=sma(values,n);return middle.map((v,i)=>v===null?null:{middle:v,sd:Math.sqrt(values.slice(i-n+1,i+1).reduce((s,x)=>s+(x-v)**2,0)/n)})}
 function macd(values){const fast=ema(values,12),slow=ema(values,26),line=values.map((_,i)=>slow[i]===null?null:fast[i]-slow[i]);const valid=line.filter(x=>x!==null),signal=[...Array(25).fill(null),...ema(valid,9)];return {line,signal,histogram:line.map((v,i)=>v===null||signal[i]===null?null:v-signal[i])}}
 window.FyersIndicators={sma,ema,rsi,bands,macd,points,add({chart,L,bars,selection}){
  const values=bars.map(b=>b.close),line=(data,title,color,pane=0)=>{const s=chart.addSeries(L.LineSeries,{title,color,lineWidth:1,priceLineVisible:false,lastValueVisible:false},pane);s.setData(data);return s};
  if(selection==='sma'){for(const [n,color]of [[20,'#287f68'],[50,'#6e56a0'],[200,'#b17a21']])line(points(bars,sma(values,n)),'SMA '+n,color)}
  if(selection==='bb'){const data=bands(values);for(const [key,mult,color]of [['Middle',0,'#6e56a0'],['Upper',2,'#287f68'],['Lower',-2,'#287f68']])line(data.flatMap((d,i)=>d?[{time:bars[i].time/1000,value:d.middle+d.sd*mult}]:[]),'BB '+key,color)}
  if(selection==='rsi'){const s=line(points(bars,rsi(values)),'RSI 14','#6e56a0',1);s.applyOptions?.({autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})});for(const p of [30,70])s.createPriceLine?.({price:p,color:'#8592a3',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:String(p)});chart.panes?.()[1]?.setHeight?.(150)}
  if(selection==='macd'){const m=macd(values);line(points(bars,m.line),'MACD 12/26','#4265b2',1);line(points(bars,m.signal),'Signal 9','#b17a21',1);const s=chart.addSeries(L.HistogramSeries,{title:'MACD histogram',priceLineVisible:false,lastValueVisible:false},1);s.setData(points(bars,m.histogram).map(p=>({...p,color:p.value>=0?'#287f68':'#ba4e58'})));chart.panes?.()[1]?.setHeight?.(150)}
 }};
})();
