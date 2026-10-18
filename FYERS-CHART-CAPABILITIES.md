# FYERS direct market data and charts — 19 October 2026

## Included

- New Indian markets > FYERS chart tab, using TradingView Lightweight Charts rendering and authenticated FYERS History/Quotes APIs through the server. Browser requests do not receive or store the broker secret/token.
- Instrument search uses FYERS public symbol masters for NSE/BSE cash, NSE/BSE equity derivatives, NSE currency derivatives and MCX commodities. Searches return up to 50 matches. The public directory is cached for one hour, not represented as a real-time listing feed. Provider download limits may block a large segment.
- 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h and 1D completed-candle views, up to 500 returned candles. Manual refresh and optional 30-second refresh while visible. This is snapshot polling, not a live WebSocket or zero-delay guarantee.
- Candles / close-line display, volume histogram, selectable EMA 20/50/200, native pan/zoom, zoom buttons and fit. EMA depends on loaded history.
- Exact instrument handoff to the existing strategy checks and visual plans. Quotes label stale source timestamps. Selection changes invalidate in-flight responses and clear old data.
- Existing account view still provides FYERS positions, orders, trades, funds and holdings, subject to permissions.
- Full TradingView and FYERS terminal links remain available.
- Fixed a reproduced future-candle acceptance flaw in the session-close filter.

## Not represented as complete

The full TradingView Advanced Charts / Trading Platform interface is not included. TradingView's published standard free licence is for public implementations, not this private app. Proper library access and applicable terms are required to integrate full drawing tools/indicator suites with the FYERS datafeed; widget embeds cannot accept our FYERS candles.

This is not a clone of the full FYERS terminal. FYERS order placement, order modification/cancellation, option-chain UI, depth UI, broker-native alerts, corporate actions, portfolio analytics, depository/fund-transfer workflows and other terminal facilities are not implemented by this chart update. No new execution, withdrawal or money-moving feature was enabled. API coverage and permissions differ from terminal features.

## Verification

Full automated suite: 50 runner tests across 47 files passed. New tests cover direct authenticated history requests, nine resolutions, closed/future filtering, bounded instrument search, quoted CSV names, source-only requests, EMA/render configuration, stale quotes, old-response isolation and cleanup. Live public NSE cash symbol master was reachable and used the documented schema. Actual private FYERS account access, UI pixel rendering and real chart interaction remain unverified here.

## Use

Close the old local server, extract this full package and run Start Market Radar.cmd. Open Indian markets > FYERS chart. Use the saved connection, search/select the instrument, choose a timeframe and Load / refresh FYERS chart. Connect through Indian markets > Settings first if needed.

Official references:
- https://fyers.in/api-docs/v3/api/market-data/historical-data/
- https://fyers.in/api-docs/v3/api/market-information/symbol-master/symbol-master-file/
- https://www.tradingview.com/charting-library-docs/latest/introduction/
