# TradingView chart restoration — 23 October 2026

Build 2026.10.23.india.32 restores the native TradingView widget in Indian chart search, strategy plans and shared global-index charts. Toolbars for drawings, indicators and timeframes are enabled. A provider iframe with absent or mismatched symbol configuration is removed with an actionable error. This verifies the requested iframe configuration, not its private cross-origin rendered state. Exact TradingView and separate Dhan terminal links remain available.

Browser verification:
- NSE:NIFTY and NSE:TCS: correct instrument requested; TradingView explicitly returns “This symbol is only available on TradingView.” Native toolbars load but candles are restricted.
- BSE:SENSEX: provider resolves to BSE_EOD:SENSEX. Intraday is unsupported. Daily candles load; native EMA added and trend line drawn successfully. BSE charts now start on daily and label possible end-of-day availability.
- No claim that all Indian symbols, real-time prices or every TradingView feature work.

19 targeted automated tests passed, covering symbol mappings, wrong-symbol rejection, stock search, chart lifecycle/retry/navigation, onboarding, shared workspaces and compiled Worker assets. No broker account changes, orders or messages were sent. The original Apple display's underlying cause is not conclusively established.

The chart-only development preview has no account routes or credentials and is not the production app.

Install: close the old terminal, extract the ZIP to a new folder, run Start Market Radar.cmd. Saved data remains in AppData/MarketRadar. Keep that folder. Hosted updates do not update localhost automatically.
