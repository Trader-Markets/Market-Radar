> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Global and Indian markets update — 18 October 2026

## Repairs

- TradingView panels now use explicit numeric iframe heights and matching container heights. Quote-table height grows with the basket. Stock screeners have a full 640px panel, with horizontal scrolling on narrow screens instead of tiny rows in a large blank area.
- The index page starts with region and quote-source controls, reference quotes and the selected chart. The complete 26-benchmark chart directory is in a labelled expandable section.
- The default public reference feed uses the symbols documented in TradingView's widget examples. CFD rows are explicitly marked as broker reference instruments; they are not passed off as official cash-index values. Users can choose cash benchmarks separately; embedded availability is exchange-dependent. Individual full-chart links are preserved.
- Screeners preserve their listing market and column choice when switching views. AI search responds while typing, with the existing watchlist retained.
- Indian markets now opens a FYERS Market Overview for Nifty 50, Nifty Bank and Sensex, with source times, last-traded status and a clear connection entry point. The chart page includes common instrument presets and custom-symbol input.
- Missing FYERS fields remain unavailable rather than becoming zero. An unrelated returned symbol cannot fill the requested instrument's quote. A failed quote refresh clears the old live state so it cannot reappear as a fresh price.
- The Windows launcher opens the main app. The startup version check detects an older running server before opening another copy or touching its saved connections.

## Data and access

No INDmoney login is required for these repairs. Indian broker snapshots and candle checks require the user's existing FYERS API setup and sign-in through Indian markets → Settings. Secrets must be entered locally; none are included in the source or package.

TradingView's public widgets may show delayed quotes or reject symbols due to exchange licensing. A paid personal TradingView subscription does not change widget entitlements. True real-time global cash-index/equity data for a custom scanner requires a suitable licensed data or broker API connection; no such connection is configured in this update. Public widgets cannot be read as a scanner data API.

Sources:
- https://www.tradingview.com/widget-docs/tutorials/iframe/set-widget-size/
- https://www.tradingview.com/widget-docs/widgets/watchlists/market-quotes/demos/indices/
- https://www.tradingview.com/widget-docs/faq/data/
- https://fyers.in/api-docs/v3/api/market-data/quotes/
- https://fyers.in/api-docs/v3/api/websockets/data-socket/data-socket-indices-update/

## Validation limits

Automated checks cover widget sizing/configuration, source selection and CFD labels, screener state, index navigation, Indian overview partial quotes, wrong-symbol responses, stale and missing timestamps, connection errors, encryption and account isolation. The embedded cross-origin TradingView contents and the user's live FYERS account cannot be verified by these fixture tests. No trades or external alerts are sent by validation.
