# Direct FYERS chart update — 2026.10.20.fyers.24

The Indian chart opens direct FYERS data by default. The optional TradingView widget remains under Chart source & help. No exchange credentials or trading controls changed.

## Available

- 21 chart intervals: 5/10/15/30/45 seconds; 1/2/3/5/10/15/20/30/45 minutes; 1/2/3/4 hours; daily, weekly and monthly. Seconds history requires FYERS Prime. The backend accepts 1D as an alias too.
- Candles, OHLC bars, close line and area.
- EMA 20/50/200, SMA 20/50/200, Bollinger Bands (20, 2 population standard deviations), Wilder RSI 14, MACD (12,26,9). RSI and MACD occupy their own pane. One additional indicator selection plus EMA can be shown together.
- Saved horizontal and vertical lines, text notes, trends, rays, zones, Fibonacci and measurements. Existing undo, redo, selection, endpoint adjustment, color, width and deletion remain.
- Chart preferences remembered in this browser. Drawings saved separately by symbol and interval.
- Load older candles under Chart settings, up to 5,000 on a chart. Cursor bounds, stale request protection, price and time validation. Older data remains when refreshing; prepend keeps the same visible candles. Unchanged data does not rebuild the chart.
- Optional 30-second refresh, zoom, pan, fit, logarithmic scale, OHLC/volume readout and expanded chart.

## Remaining limits

This is the existing Lightweight Charts integration, not the licensed Advanced Charts library. It is not complete TradingView feature parity: no Pine Script, full TradingView indicator/drawing catalogue, replay or native chart trading. FYERS streaming and forming candles are not implemented in this release; history contains completed candles. Weekly/monthly candles are conservatively withheld until the calendar period ends in IST. Broker history availability, plan limits and rate limits apply. All indicator calculations use the loaded history.

## Verification

Automated tests cover the interval allowlist, closed/current calendar boundaries, cursor validation, independent indicator arithmetic, separate indicator panes, drawing persistence/text safety, history pagination and stale-response handling, saved preferences, refresh stability and existing app regressions. Browser rendering and a signed-in live FYERS account remain unverified here.

## Windows installation

Close the old Market Radar terminal. Extract the complete update into a new folder and run Start Market Radar.cmd. Confirm 2026.10.20.fyers.24. Existing account data stays in AppData/MarketRadar.

## Provider references

- https://fyers.in/api-docs/v3/api/market-data/historical-data
- https://fyers.in/api-docs/v3/getting-started/sdks-and-libraries/
