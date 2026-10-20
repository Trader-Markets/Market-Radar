> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Indian chart loading repair

Build `2026.10.19.load.19`

The previous charts.18 release made TradingView the initial view, hiding the broker chart behind it. This was a poor default for NSE instruments with provider embed restrictions. It also waited for both history and quotes before drawing candles. These are application issues addressed in this release; TradingView's data restrictions remain external.

## Changes

- Indian charts now open the direct FYERS data view immediately. The official TradingView widget remains an optional view and its full-site link remains available.
- FYERS history and quote requests render independently. Candles no longer wait for a slow quote; a quote failure cannot suppress successfully returned history. The chart retry button is available once the history request settles.
- An optional TradingView script failure, missing verified symbol mapping, or failure to create an iframe within 15 seconds falls back to the FYERS view with an explanation. An iframe being created is not proof that the provider permits its data; cross-origin data restrictions cannot be inspected by our app.
- Changing instrument/timeframe or navigating away aborts obsolete chart requests where the browser supports combined abort signals. Version checks also prevent stale responses from updating the selected chart.
- A missing Lightweight Charts renderer produces an explicit chart error instead of a misleading successful-candle count.
- TradingView is not loaded unnecessarily into the hidden panel during broker refresh.
- Existing stock search, full NSE screener, account views, plans, indicators and chart handoffs are retained.

## Checks

A new controlled test first failed against charts.18's TradingView default. It now verifies the FYERS initial view, candles rendering before a pending quote, quote completion, TradingView script/iframe-timeout fallback, missing-renderer error, and cancellation after selection changes. The full automated suite contains 54 passing runner tests. These tests include other app areas and should not be described as proof that every live Indian-market journey is flawless. No real trades, private FYERS-session access or visual browser verification was performed.

## Local update

Close the old server terminal, extract the complete new package, run Start Market Radar.cmd, and verify `2026.10.19.load.19` in Indian markets' connection bar. The app running on your computer cannot be upgraded merely by refreshing the hosted site. Saved local account data remains in AppData MarketRadar outside the program directory.

FYERS still needs a valid broker session and source permissions. Login expiry, unavailable instrument history, external feed failures and TradingView embed restrictions must remain visible rather than become invented candles. The public TradingView widget cannot accept the private FYERS data feed or app-drawn strategy lines. The app remains owner-private.
