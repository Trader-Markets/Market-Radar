# Indian-market charts and regression repairs

Build `2026.10.19.charts.18`

Open **Indian markets → Chart & stock search**. The default view is now the official TradingView Advanced Chart widget, with its top toolbar, drawing sidebar and available indicator controls enabled. Search in Market Radar to select the stock; the widget is pinned to that mapped instrument. The full TradingView site link remains alongside the chart. The timeframe selector rebuilds the widget for the selected interval; broker-only chart type, EMA and fit/zoom controls are disabled while TradingView is selected. Use TradingView's own toolbar for its controls.

Choose **Chart view → FYERS data · broker chart** for direct FYERS candles, volume and EMA. Use **Open strategy checks & plan** for the existing broker-based strategy evidence and draft entry/stop/target lines. App strategy lines cannot be injected into the public TradingView widget; they remain on the broker plan chart.

## Repaired and tested

- TradingView widget integration with full available toolbar settings, persistent source/permission note, external chart link, script-load failure message and cleanup on navigation.
- Verified mapping for ordinary NSE/BSE `-EQ` stocks and Nifty 50, Nifty Bank and Sensex. Contract codes and other equity series without a verified equivalent are not silently mapped to a different instrument.
- Changing timeframe fetches the matching FYERS history and rebuilds TradingView with that interval.
- Same-instrument FYERS refresh preserves visible pan/zoom. Volume occupies a separate lower area instead of covering the candle price area.
- FYERS quote freshness labels expire as time passes rather than staying fresh until the next response.
- Changed search query/exchange invalidates pending search results in both the main chart and strategy-plan search.
- Enter submits chart/instrument searches, and the plan handoff resolves shorthand stock codes before navigation.
- Broker errors remain visible outside the hidden broker panel. A failed broker request does not remove the independent TradingView widget.

## Limits that code cannot remove

TradingView chooses which instruments/timeframes its public widgets may display. “This symbol is only available on TradingView” is a provider restriction, not a successful chart load. The widget uses TradingView's feed, which may differ from or be delayed relative to FYERS; it cannot consume our FYERS feed. A paid personal TradingView plan does not change widget data permissions. The FYERS source view and full TradingView website link remain available.

The separate Advanced Charts library that accepts our own FYERS feed requires approved access and appropriate use terms; it is not installed or claimed here. The Site's owner-private sharing has been preserved. No personal broker keys, order placement or alert recipients were changed.

Verification: 53 automated runner tests cover FYERS auth/reconnect, accounts with partial failures, owner and origin protection, source validation, charts, plan handoffs, full NSE screener batching/checkpoints, local alerts, failures and navigation races, plus other existing app areas. Widget configuration and script error handling are fixture-tested. There is no claim that the third-party widget rendered a restricted NSE instrument, that the private FYERS account was accessed, or that actual browser visuals were verified.

Official references:
- https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
- https://www.tradingview.com/widget-docs/faq/data/
- https://www.tradingview.com/charting-library-docs/latest/introduction/
