import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
let c={window:{}};vm.runInNewContext(fs.readFileSync('dist/signals.js','utf8'),c);let S=c.window.StrategySignals;
const candle=(i,o=100,h=101,l=99,cl=100)=>({time:i*3600000,open:o,high:h,low:l,close:cl,volume:100});
let p={entry:100,stop:98,risk:2,side:1,target:104,confirmed:true,wait:12,hold:6};
let bars=Array.from({length:10},(_,i)=>candle(i));bars[2]=candle(2,100,105,99,104);let t=S.simulate(bars,0,p,.2);assert.equal(t.reason,'target');assert.equal(t.net,1.9);
bars[2]=candle(2,100,105,97,104);t=S.simulate(bars,0,p,.2);assert.equal(t.reason,'stop');assert.equal(t.net,-1.1);
bars[2]=candle(2,95,96,94,95);t=S.simulate(bars,0,p,0);assert.equal(t.exit,95);assert.equal(t.net,-2.5);
bars=Array.from({length:10},(_,i)=>candle(i));t=S.simulate(bars,0,p,.2);assert.equal(t.reason,'time');assert.equal(t.net,-.1);
assert.equal(S.simulate(bars.slice(0,5),0,p,.2).kind,'unfinished');
p={...p,side:-1,stop:102,target:96};bars[2]=candle(2,100,101,95,96);assert.equal(S.simulate(bars,0,p,0).reason,'target');
let v=S.size(p,10000,.5,.2);assert(v.loss<=50.000001);assert(v.margin<=2500);assert(v.leverage<=3);assert.equal(S.size(p,-1,.5,.2),null);assert.equal(S.size(p,10000,2,.2),null);
for(let risk of [.01,.1,1,10]){let z=S.size({...p,risk},10000,.5,.2);assert(z.loss<=50.000001);assert(z.notional<=7500);assert(z.margin<=2500.00001)}
const f=Array.from({length:330},(_,i)=>({...candle(i*4),volume:100}));let h=Array.from({length:75},(_,i)=>candle(i));assert.equal(S.plan(h,f,'ema'),null,'middle range must not create a trade');h.at(-1).close=101.2;h.at(-1).high=101.3;h.at(-1).volume=250;let scalp=S.plan(h,f,'scalp');assert(scalp?.side===1);assert(scalp.stop<scalp.entry&&scalp.target>scalp.entry);assert(Math.abs((scalp.target-scalp.entry)/scalp.risk-2)<1e-8);
const interval=S.wilson(50,100);assert(interval[0]>.4&&interval[0]<.41);assert(interval[1]>.59&&interval[1]<.6);
console.log('PASS: target/stop ordering, gap losses, time exits, short trades, costs, risk sizing, leverage/margin caps, EMA wait state, 2R target and statistical interval');
