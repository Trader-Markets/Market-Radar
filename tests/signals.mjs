import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('dist/signals.js','utf8'),ctx);const {evaluate}=ctx.window.StrategySignals;
const bars=(n,c=100)=>Array.from({length:n},(_,i)=>({time:i,close:c,high:c+1,low:c-1,volume:100}));
let h=bars(75),f=bars(330);assert(evaluate(h,f).ema.match);assert(!evaluate(h,f).scalp.match);assert(!evaluate(h,f).breakout.match);
h.at(-1).close=101.2;h.at(-1).high=101.25;h.at(-1).volume=250;assert(evaluate(h,f).scalp.match);h.at(-1).volume=190;assert(!evaluate(h,f).scalp.match);h.at(-1).volume=250;h.at(-1).high=104;assert(!evaluate(h,f).scalp.match);
h=bars(75);h.at(-1).close=98.8;h.at(-1).low=98.75;h.at(-1).volume=250;assert(evaluate(h,f).scalp.match);assert.equal(evaluate(h,f).scalp.label,'Downward breakout');
h=bars(75);f.at(-1).close=100.8;f.at(-1).volume=130;assert(!evaluate(h,f).breakout.match,'MTF needs daily/weekly/monthly context');f.at(-1).volume=110;assert(!evaluate(h,f).breakout.match);f=bars(330,110);f.at(-1).close=100;f.at(-1).low=99;assert(!evaluate(h,f).ema.match);assert(!evaluate(h,bars(50)).ema.match);console.log('PASS: EMA, breakout, long/short scalp; low volume, wick, distant EMA and short history rejected');
