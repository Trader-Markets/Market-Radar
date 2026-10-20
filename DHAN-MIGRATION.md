# Indian Markets → DhanHQ — 2026.10.20.dhan.28

## What changed
Removed the previous Indian broker's runtime integration, OAuth setup/login/callback screens, public symbol-master fetches and API routes. Indian Markets now uses DhanHQ v2 directly on the server for:
- Profile verification and encrypted saved access-token connection.
- Positions, funds, orders, executed trades and holdings.
- NSE/BSE cash stock search and Dhan security-ID mapping; Nifty 50, Bank Nifty and Sensex resolve from Dhan's index master.
- Quote snapshots with source trade timestamps. Fetch time never substitutes for a missing or stale trade timestamp.
- Full NSE share universe, saved-list screening and existing strategy checks.
- Session-aware 4H candle aggregation from Dhan's 1H history, requiring complete hourly groups and excluding forming or incomplete groups.

Current public master checked: 3,192 eligible NSE share entries; TCS = 11536, 20 Microns = 16921, Nifty 50 = 13, Bank Nifty = 25, Sensex = 51. These are live directory observations, not account/data-entitlement verification. Directories are cached for one hour. The universe follows Dhan's classifications and excludes funds/bonds/derivatives; not every exchange instrument is an ordinary share.

## Connect
1. Open Dhan Web → My Profile → Access DhanHQ APIs → Generate Access Token.
2. In Market Radar, open Indian Markets → Settings.
3. Enter numeric Dhan Client ID and access token; choose Connect Dhan.
4. The server verifies the profile matches the Client ID before saving. Settings shows token validity and Data API plan reported by Dhan.

Tokens are encrypted at rest and never returned to browser status responses, stored in browser storage or embedded in URLs. Manually generated Dhan Web tokens normally last 24 hours; replace an expired token in Settings. Data API access is separately required for quotes/history. This release does not auto-renew tokens, store PIN/TOTP, place orders or change an account's IP settings.

## Limits and scope
Broker/API reads use Dhan. Embedded charts still use the official TradingView widget and its market-data permissions; this broker migration does NOT unlock restricted NSE charts or feed Dhan candles into that widget. Quick links provides Open Dhan charts to the broker's own platform. Full in-app TradingView with a Dhan datafeed still requires appropriate library access and terms.

Dhan quotes are snapshots, not a WebSocket stream. Data requests share a paced lane in each server instance, at least 1.1 seconds apart. HTTP 429 and Dhan quota codes propagate cooldown metadata; expired token, missing Data API subscription and unavailable instruments are distinct errors. External apps/processes also consume broker quota. Existing scan progress from the former provider is not resumed under Dhan; Dhan checkpoints and saved lists are separate.

Indian account execution was not enabled before this migration and remains unsupported. Account order/trade lists are reads only. Crypto execution, positions, performance history, Telegram, alerts and Japa are unaffected.

Migration 0009 removes the retired broker's saved connection records; it does not delete crypto accounts or trade history. Earlier migration filenames and historical release notes remain as source history, not active integrations.

## Validation
68 automated checks passed before final packaging, including 10 new Dhan backend tests and migrated front-end journeys. Tests cover encryption, owner/CSRF isolation, profile mismatch preserving saved credentials, route allowlists/no order mutations, exact Dhan request headers and security IDs, partial accounts, quote source age, entitlement/expiry/quota errors, paced requests, malformed candles, session aggregation and retirement migration isolation. Dhan public NSE/index directories were downloaded and parsed successfully.

Actual Dhan private-account access, paid data entitlement, live quote prices, browser rendering and end-to-end broker availability are unverified without the owner's connection. No real orders/messages were sent and no real account credentials were used.

## Windows
Close the old server terminal, extract the COMPLETE Dhan update into a new folder, then run Start Market Radar.cmd. Confirm build 2026.10.20.dhan.28. Crypto connections/history stay in AppData/MarketRadar. Do not delete that folder.

## Official contracts
- https://dhanhq.co/docs/v2/authentication/
- https://dhanhq.co/docs/v2/instruments/
- https://dhanhq.co/docs/v2/market-quote/
- https://dhanhq.co/docs/v2/historical-data/
- https://dhanhq.co/docs/v2/portfolio/
- https://dhanhq.co/docs/v2/annexure/
