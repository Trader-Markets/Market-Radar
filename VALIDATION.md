# Market Radar validation — 30 September 2026

Implemented in the existing Delta India / Shark Exchange website.

## Strategy rules

1. 1H: previous 20-bar high/low breakout, 2x average volume, strong close, maximum 1% extension.
2. Multi-timeframe: 1H, 4H, 20 daily bars, 12 completed UTC weeks and 12 completed UTC months. Within 2% of the highest loaded daily price, 2x 1H volume, 1.5x 4H volume. A 1H close above every reference and a 4H close above the 4H range confirms the setup. Weekly/monthly aggregation excludes partial or gapped periods. Daily candles later than the signal are excluded. Up to 1,000 daily candles; lifetime ATH remains unverified.
3. 4H 200 EMA: 12-bar consolidation no wider than 5%, within 2% of EMA; both range edges are drawn. Entry plan waits for a completed 1H close outside the range.
4. Golden/death cross: new 50/200 SMA crossover on 4H, 1.2x volume.

All listed perpetual contracts in the selected exchange/quote market are eligible by default. Optional turnover filters reduce coverage. Missing candle history is excluded and counted. Shark INR and USDT markets are selected separately. Options contracts are not treated as token prices.

## Charts

Official TradingView advanced widget plus TradingView Lightweight Charts driven by the selected exchange. Automatic ranges, reference highs, volume, EMA/SMA and qualifying entry/stop/target are drawn on the exchange chart. The advanced embed cannot accept custom overlays; Shark's advanced widget uses a clearly labeled Binance reference. Exchange prices and trade levels use the exact exchange feed. Streaming data has a last-received age and a 15-second stale threshold. Literal zero latency is not guaranteed. Scanner uses completed candles and refreshes while the page remains open; it is not an always-on background service.

## Validation

Build and JavaScript syntax checks pass. All 10 test scripts pass: strategy signals, multi-timeframe alignment and history safeguards, SMA crosses, risk sizing and backtesting, broker calculations, reviewed order routes, encrypted saved connections, setup alerts, and position rendering. Account/order tests use mocks; no real trade was placed or live account connected. Hosting/browser verification is performed separately from these tests.

Hosted verification: published HTML, JavaScript and chart engine return HTTP 200. Both hosted exchange listing routes return HTTP 200; Delta returns 221 ticker records. Direct Shark access from the build environment returned 403, while its hosted listing route succeeds. The private site requires sign-in in the browser, so authenticated visual interaction was not verified. Delta's live API returned BTCUSD 1H, 4H and daily candles successfully. Delta trade ticks are subscribed alongside candles, and source lag is displayed in milliseconds.
