# Breakout Radar priority repairs — 1 October 2026

## Implemented

- Both exchanges retain encrypted saved connections. Shark now retries initial failures and recovers on network return and page visibility, matching Delta. An unsuccessful replacement no longer deletes Shark's previous saved connection first.
- Failed account refreshes immediately invalidate the account timestamp. Saved credentials are kept, errors are visible, and order buttons remain blocked until the account recovers. Sign-in redirects receive an actionable error rather than a JSON parsing error. Connection form input is cleared only after successful verification.
- Demo orders now save an isolated paper account in D1: 10,000 units per quote currency, positions, committed margin, simulated entry fills, 0.1% fee per side, mark-based P&L, manual closing and closed-trade history. Revision checks prevent concurrent balance overwrites. Request IDs suppress duplicate retries. No exchange order route is used.
- Demo stop/target checks use fresh received quotes, account for observed gaps, and persist results. They operate only while the page is open on that coin; missed prices while closed are not replayed. Entry prices are assumed simulation fills, not limit-order queue or liquidity simulation.
- Polling uses source timestamps rather than inventing a new timestamp on receipt. Missing, old and future source timestamps cannot authorize orders. The server independently fetches and checks quote freshness when reviewing and submitting a new real order. Account/order state is rechecked by the existing order preparation.
- Added an owner-private background scan endpoint and durable scan results. It checks the same strategy engine and validates closed candles/history. Default watchlist: Delta BTCUSD/ETHUSD and Shark BTCUSDT/ETHUSDT. Up to eight coins can be saved in Settings. This is distinct from the browser's full-market scan.
- Background WhatsApp delivery uses only already enabled, encrypted provider settings and saved recipients. No recipient, API credential, or opt-in can be changed by the scheduled endpoint. Existing freshness, deduplication and rate limits apply. Provider acceptance is not labelled delivery.

## Validation

16 automated test scripts pass. Coverage includes actual demo button → Worker → SQLite persistence → visible position, long/short trades, fees, margin limits, P&L, manual closes, stop gaps, fresh quote requirements, duplicate/concurrent requests, account owner isolation and restart persistence. Existing strategy, charts/DOM, order-review, saved-connection, alert, proxy and WhatsApp mocked checks pass. New tests check Shark startup recovery, immediate account invalidation, server-side quote freshness, and background scan write/readback and hourly deduplication.

Live exchange credentials, real exchange orders, real WhatsApp messages and browser visual interaction were not tested. This custom Worker project has no supported managed browser preview. Mocked account tests do not establish that an exchange accepts the user's key, permissions or IP allowlist.

## Operational limits

An hourly scheduled scan is not continuous or instant execution. Default background scope is the four-coin watchlist; the full market is scanned in-page. Background results show per-coin errors, run time, expired signals and overdue scans. The schedule and live source verification are completed after publication and reported in the task response.


API references used for quote timestamps: https://docs.delta.exchange/ and https://docs.sharkexchange.in/ .
