# Liquidation context — build 41

## Simple use
Close the old terminal. Extract the new package into a new folder and run Start Market Radar.cmd. Crypto → Setups → Top 20 volume → Enable separate early warnings → Start / refresh volume alerts. No API keys or subscription purchase required for these public feeds. Keep the terminal open and computer awake. Existing account storage remains separate from the release folder.

## Behaviour
The existing activity evidence now shows liquidation status; no new tabs/settings. Exact base asset and active USDT perpetual metadata must match before Bybit/Binance subscriptions are made. Delta/Shark liquidation totals are not inferred. Only Delta activity integration currently uses the collector; Shark remains price/volume only.

Public Bybit allLiquidation and Binance forceOrder streams feed rolling per-coin 5m totals split by liquidated long/short side. Bybit quantity × bankruptcy price is a USDT notional proxy, not an exact executed-dollar total. Binance uses cumulative executed quantity × average price and emits sampled snapshots, not a complete tape. Identical payloads are suppressed, which can undercount indistinguishable events. No claim of complete market coverage or zero latency is made.

A continuous 60-minute baseline after subscription acknowledgement is required. A spike requires at least 25,000 USDT proxy in 5m, at least 5× the preceding 55m mean per 5m, and a positive baseline. This heuristic is uncalibrated and intentionally conservative. Reconnection, newly added subscriptions or buffer overflow reset collection history. Transport heartbeat older than 45s makes the source unavailable. Metadata lookups are cached 5m. Subscription rejection closes the stream. Collector resets when the scanner/early warnings are paused (local runner checks every 2s). Memory is bounded; at most 40 symbols per source.

A liquidation spike can contribute to an early warning only with a fresh Delta quote, at least 3× closed 5m volume and two aligned timeframe breaks. Liquidation direction is risk context, not a buy/sell prediction. The title adds LIQUIDATION SPIKE. Existing confirmed entries and WhatsApp rules are unchanged. No extra messages/orders or risk-setting changes.

## Hosted limitation
Hosted publication includes the integration and honest unavailable state but no persistent hosted collector. This build collects on the installed Windows/local server only. The hosted-only app is not continuously collecting these feeds.

## Verification
125 automated tests passed with controlled provider fixtures and isolated storage. Fifteen relevant tests passed after final changes. New collector tests cover venue side differences, executed size, invalid/stale/future data, baseline, spike floor, zero baseline, disconnect, metadata matching and subscription acknowledgement. Existing local HTTP startup tests were included. Browser preview verified existing panel and updated explanation, with account APIs intentionally unavailable.

A real public-feed attempt in this environment returned unavailable from metadata lookup, so no live event receipt or customer-machine connectivity is verified. The UI will explicitly show unavailable rather than invent zeros. There is no retrospective IRYS claim. Prior acceptance blockers remain as documented in ACCEPTANCE-2-TO-6-39.md.
