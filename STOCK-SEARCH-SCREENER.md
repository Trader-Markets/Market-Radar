# Stock charts, search and screener update

Build: `2026.10.19.stocks.16`

## Customer flow

1. Open **Indian markets → Chart & stock search**.
2. Select the exchange segment, search a company name or ticker, then select the exact instrument.
3. Use candles or close line, volume, nine timeframes (1m–1D), EMA 20/50/200, pan/zoom and fit. The full TradingView website and FYERS terminal links remain available.
4. Choose **Open strategy checks & plan** for strategy evidence and the entry/stop/target draft. The same symbol carries across.
5. Open **Stock screener**, search and add up to 20 NSE/BSE stocks, refresh their FYERS quote table or scan your list. Each row opens its chart or plans. The list is saved in this browser.

Typing `TCS` or `NSE:TCS` now resolves against the FYERS symbol master to `NSE:TCS-EQ` before chart, quote or strategy requests. Explicit derivative codes are retained rather than guessed. Unknown names prompt selection through search. FYERS 422 errors now explain symbol/data parameters instead of incorrectly pointing only to login permissions.

## Scope and verification

- Data requires your saved FYERS connection and broker permissions.
- TradingView Lightweight Charts is the embedded renderer; this is not the full licensed Advanced Charts terminal. Refresh is a snapshot, with optional 30-second visible-tab refresh, not streaming/zero-delay data. Up to 500 completed candles; the forming candle is excluded. EMA is based on loaded candles.
- Search covers published FYERS instrument directories (NSE/BSE cash and derivatives, MCX and NSE currency). The screener list currently supports NSE/BSE cash instruments. Search returns the first 50 matches; narrow your query when necessary.
- The screener runs selected stocks sequentially while open. It does not reproduce FYERS proprietary screeners, scan all exchanges in the background or place orders.
- Market Radar checks include volume breakout, EMA consolidation, moving-average cross and a separate liquidity-sweep pattern. Limited history cannot establish lifetime ATH, so that check remains unavailable. Missing volume/history or stale quotes cannot become confirmed breakouts. Fakeouts cannot be eliminated with certainty.
- Targeted API and DOM fixture tests cover symbol normalization, chart handoffs, source/quote freshness, search escaping, saved lists, filters, separate provider failures, cancellation and navigation races. No real trades, private account session or browser-rendering verification is claimed.
