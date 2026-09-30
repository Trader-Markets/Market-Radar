# Customer experience update

## Main flow
1. Trade opens with the exchange chart and one order ticket. Choose a coin or open a setup.
2. Apply a qualifying strategy plan, type your levels, or click Entry, Stop or Target and then select a price on the chart.
3. Review the direction, position value, leverage, estimated margin and risk.
4. Review and explicitly confirm the exchange order. On an accepted entry order, its draft lines clear; account positions and orders remain visible. Acceptance is not a confirmed fill.

Accounts and optional practice trading are in Settings. Positions are under the chart and in My Positions. Strategy backtesting and the separate advanced TradingView widget are optional details.

## Verification
`npm ci && npm test` runs 12 passing test files. The tests cover:
- Four strategies, volume/candle confirmation, history gaps and insufficient data.
- Sizing, leverage limits, stop/target ordering, margin, costs and historical outcomes.
- Both exchange adapters: owner/CSRF checks, encrypted persistent connections, signatures, reviewed orders and duplicate prevention using mocked exchange responses.
- Customer lifecycle: forming and expired signals, stale prices and accounts, wrong-coin isolation, edits made after review, and accepted-order clearing.
- Full page DOM startup, navigation, settings relocation, chart-click price selection, three plan lines, and clearing those lines after acceptance.
- Alerts, positions, disconnect and saved connections.

## Practical limits
- The main chart uses TradingView Lightweight Charts with exchange candles and live feeds. The advanced embedded TradingView widget is a separate reference chart and cannot receive custom order drawings through its public embed API. Drawings are not synchronized into a user's personal TradingView account.
- A historical high is limited to the loaded daily history and is not labeled a verified lifetime ATH.
- No zero-delay guarantee: network/source latency exists, and stale quotes block new order review.
- Actual account connection, wallet values, fills, cancellations and protection orders require exchange credentials and were not verified against a funded account. No real trades were placed during testing.
- The owner-private Site requires ChatGPT sign-in; an authenticated browser visual/mobile check remains outstanding. The DOM integration check is not a substitute for visual review.
