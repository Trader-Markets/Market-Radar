# Customer experience update

## Main flow
1. Trade opens with the TradingView advanced widget and one order ticket; the exchange chart below shows automatic plan levels. Choose a coin or open a setup.
2. Apply a qualifying strategy plan, type your levels, or click Entry, Stop or Target and then select a price on the chart.
3. Review the direction, position value, leverage, estimated margin and risk.
4. Review and explicitly confirm the exchange order. On an accepted entry order, its draft lines clear; account positions and orders remain visible. Acceptance is not a confirmed fill.

Accounts and optional practice trading are in Settings. Positions are under the chart and in My Positions. Strategy backtesting remains in optional details. The TradingView advanced widget is visible by default with timeframes, indicators, chart styles and drawing controls; Expand chart provides a larger working view.

## Verification
`npm ci && npm run build && npm test` runs 14 passing test files. The tests cover:
- Four strategies, volume/candle confirmation, history gaps and insufficient data.
- Sizing, leverage limits, stop/target ordering, margin, costs and historical outcomes.
- Both exchange adapters: owner/CSRF checks, encrypted persistent connections, signatures, reviewed orders and duplicate prevention using mocked exchange responses.
- Customer lifecycle: forming and expired signals, stale prices and accounts, wrong-coin isolation, edits made after review, and accepted-order clearing.
- Full page DOM startup, navigation, settings relocation, chart-click price selection, three plan lines, and clearing those lines after acceptance.
- Alerts, positions, disconnect and saved connections.

## Practical limits
- The main chart is the advanced embedded TradingView widget. The plan chart below uses TradingView Lightweight Charts with exchange candles and live feeds. The embedded widget is a separate reference chart and cannot receive custom order drawings through its public embed API. Drawings are not synchronized into a user's personal TradingView account.
- A historical high is limited to the loaded daily history and is not labeled a verified lifetime ATH.
- No zero-delay guarantee: network/source latency exists, and stale quotes block new order review.
- Actual account connection, wallet values, fills, cancellations and protection orders require exchange credentials and were not verified against a funded account. No real trades were placed during testing.
- The owner-private Site requires ChatGPT sign-in; an authenticated browser visual/mobile check remains outstanding. The DOM integration check is not a substitute for visual review.

## Strategy and colour audit — 1 October 2026
- Volume comparisons reject a zero or invalid baseline instead of treating division by zero as a volume surge. Exact 2x and just-below-2x thresholds are tested.
- Feed normalization checks the entire loaded history for gaps before indicator calculations, including gaps older than the last 30 bars.
- Expired crossover entries and consolidations with no actionable plan are labeled Expired and Watch only, respectively.
- Live Delta BTCUSD 1H, 4H and daily candles were retrieved through the hosted feed and evaluated with the same scan engine. This is a feed/logic sanity check for one contract, not validation of all markets or profitability.
- Navy, teal and restrained gold define the workspace. Forming signals remain amber and risk remains red. The primary text/button/status colour pairs all exceed 4.5:1 contrast. No trading outcome is attributed to colour.

## Full regression audit — 1 October 2026

All 13 test files passed after rebuilding the Worker. Tests use fixtures, mocked exchange responses and DOM integration; they do not place real trades.

| Feature | Verification and fixes |
| --- | --- |
| Four strategy scans | Candle/volume thresholds, incomplete history, invalid bars, forming/expired states and strategy plans. Superseded scans cannot overwrite the selected market. |
| Charts and live feed | DOM startup, chart selection and plan lines; malformed, future and stale events rejected. REST refresh retains newer streamed candles and updates daily-history errors. |
| Trade ticket | Exchange tick rounding for generated/clicked prices; invalid manual increments blocked. Strategy plans blocked after the live price breaches their stop or reaches their target. |
| Order review | Changed draft revisions blocked at confirmation; accepted orders clear only the matching draft. Source timestamp participates in stale-quote checks. |
| Accounts and positions | Mocked account, position, cancellation and connection paths; delayed responses cannot restore a disconnected account. Requests time out instead of hanging indefinitely. |
| Security and exchange adapters | Owner and same-origin checks, encrypted connection persistence, request signatures, reviewed submissions and duplicate protection. |
| Backtests and alerts | Historical simulation, risk calculations, alert handling and saved state covered by regression tests. Browser notification delivery remains unverified. |
| News and hosting routes | Static source/cache consistency, allowed proxy routes, method restrictions, same-origin news configuration, malformed inputs and upstream failures. Paid live news retrieval remains unverified. |

Public live contract metadata was fetched successfully through the hosted proxies: Delta BTCUSD has a 0.5 price increment, and all 9 contracts returned by the Shark INR endpoint passed the rules parser. Shark limit orders now use LIMIT_QTY_SIZE rather than market-order quantity limits. This verifies the returned schema, not execution or coverage beyond that endpoint response.

Desktop/mobile visual inspection, third-party TradingView iframe behavior, real account balances, fills, cancellations and protective-order execution remain outside the completed verification. Production publishing does not establish that those checks passed.

## Delta recovery and WhatsApp — 1 October 2026
- Saved Delta credentials remain encrypted and owner-scoped. Startup/network failures now continue recovery, including on returning to the page. Explicit disconnect stops recovery. Failed/partial account refreshes block fresh-order review.
- Replacing a connection stores the new encrypted record before removing the old one, so encryption/insertion failures do not first erase the saved connection. Hosted and local installations have separate credential stores; revoked keys and exchange IP restrictions still require attention.
- Settings includes encrypted Twilio WhatsApp credentials, recipient, approved template, confirmed/forming setup preferences, tracked-risk updates, explicit opt-in, test message and pause controls. Template variables are {{1}} title and {{2}} details.
- Delivery uses the approved-template API, durable duplicate claims and a one-message-per-minute cap. Excess alerts are skipped, not queued. Unknown provider outcomes are not automatically retried to prevent duplicate messages. Provider acceptance does not prove delivery.
- WhatsApp scanning is page-driven for the selected exchange/market. Keep Auto scan enabled and the page open; background tabs may be throttled. No unattended scheduler was activated. No WhatsApp credentials or destination number were supplied, so actual delivery remains unverified and disabled until configured.
- 14 test files pass, including mocked WhatsApp owner/CSRF protections, consent, encrypted persistence, template payload, stale events, duplicate suppression, failures, unknown outcomes and pause; Delta startup recovery and explicit-disconnect tests. No real trades or messages were sent.
