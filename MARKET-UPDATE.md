# Market-account update · 15 October 2026

## Available
- Three isolated workspaces: Crypto, Stocks & indices, Indian markets.
- Scrollable native account/performance tables, stock widget sizing, reload buttons and full-chart links for restricted symbols.
- Delta real-account performance from signed wallet ledger requests, 7/30/90-day periods, paginated with a 2,000-entry bound. No totals for incomplete or malformed history. Currency-separated product cashflow, signed fees and funding, profitable-day rate, daily profit factor and realized daily ledger drawdown. Deposits/withdrawals/other credits excluded. These are ledger/day metrics, not reconciled round-trip trade metrics or equity returns.
- Fyers encrypted app configuration and OAuth sign-in, owner/state/replay checks, account positions/orders/trades/funds/holdings, explicit endpoint failures and expiry instructions.
- Broker quote refresh on demand or every five seconds while selected tab is visible, source timestamp and continuously aging freshness indicator. No paid global realtime entitlement or zero-latency claim.
- Fyers closed-candle 1H volume-breakout checks, 4H EMA consolidation, crossover watches, separate liquidity-sweep checks. 4H history requested in 90-day batches. Standard NSE/BSE session-end handling; no MCX scanning. Index data without traded volume cannot confirm a volume breakout.
- Fyers native chart with draft entry/stop/target lines, local price-above/below alerts with bold titles while selected symbol auto-refreshes.

## Not yet enabled / dependencies
- User must configure and complete Fyers sign-in. No real account credentials were available in this session, so live broker responses and entitlements remain unverified.
- Fyers order placement, modification, cancellation, automatic risk/trade tracking, paper account parity, EMA custom alerts, Top 20 scanner and background/WhatsApp stock alerts are not enabled in this release. Use the Fyers link for orders. No withdrawal endpoint exists.
- Lifetime ATH / full monthly alignment is unavailable from the loaded Indian history; explicitly unavailable, never falsely confirmed.
- Global positions, orders and programmatic strategy alerts need the user's chosen global broker plus licensed machine-readable market data. TradingView widgets are display-only inputs to this app.
- Browser visual QA unavailable in this environment. Exact reported table error has not been visually reproduced; provider restrictions can still appear inside external widgets.
- Delta performance is fetched from the connected environment: localhost credentials are not shared with the hosted site. Hosted fixed-IP relay operators need the updated GET wallet/transactions allowlist.

## Validation
26 test files covering existing crypto behavior and new UI isolation, OAuth/owner/CSRF checks, encrypted storage, expiry, replay, no order submission, stale quotes, absent index volume, ledger math/currencies, deduplication and pagination refusal. Tests use mocked broker responses and never place trades or send WhatsApp messages.
