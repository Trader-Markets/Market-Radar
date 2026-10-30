# Breakout Radar — UAT execution report

Date: 24 October 2026 (IST). Build: 2026.10.24.uat.37.

## Decision

Conditional technical pass for the executed cases; not a full customer acceptance sign-off. 107 automated test entries passed, 0 failed, 0 skipped. Some entries execute multiple scenarios. This is not a 100% pass rate for all requested product features: unimplemented and unverified live journeys are listed separately below.

Baseline: 99 existing entries passed. Seven added malformed-report cases and one added first-connection case failed before fixes and passed afterwards. The navigation regression and expanded real HTTP checks also pass. The complete final runner output accompanies this report.

## What was fixed

1. Performance report integrity. Missing review settings, null wallet rows, string money, duplicate days/currencies, damaged notes and inconsistent net amounts could reveal a partial report, misleading values or runtime errors. Validate the report before replacing displayed data. Preserve imported history and allow retry. These failures were reproduced with injected responses; this does not establish that the user's stored history was corrupted.
2. Global navigation. Inner index/stock tabs could disagree with the main workspace highlight and URL. They now agree. Browser UAT confirmed Global Indices sets the indices URL and highlight.
3. Shark connection status. An initial network failure incorrectly said “Saved connection”. It now says that the connection could not be verified until a successful connection is known. No account keys or permissions changed.

## Executed acceptance cases

“Isolated pass” means a real module/route/database was exercised with test data or simulated provider responses. It does not establish live broker availability.

| ID | Journey / expected result | Result and evidence |
|---|---|---|
| U01 | Start localhost server and serve main, Learnings, Japa, Telegram setup and assets | Isolated pass: real child process and HTTP requests; tests/local-http.mjs |
| U02 | Frontend route reaches backend and persistent owner data | Isolated pass: HTTP demo sync -> Worker -> SQLite; SQL row verified and subsequent GET matched state |
| U03 | Reject invalid Host, cross-origin writes, invalid JSON and unsupported Dhan writes | Isolated pass: real HTTP 421/403/400/404 responses |
| U04 | No withdrawal route | Isolated pass: rejected at real HTTP boundary |
| U05 | Save and recover encrypted Delta/Shark/Dhan connections | Isolated pass: saved-connections, delta-desk, shark-desk and dhan-integration suites; no real credentials used |
| U06 | Account failures do not become zero positions; stale data blocks ticket | Isolated pass: customer-page, trade-positions, Dhan account tests. Browser QA displayed recoverable unavailable-account state |
| U07 | First Shark failure does not claim saved connection | Failed before fix; passes after fix in journey-regressions.mjs |
| U08 | Review/submit validates current position, quote, leverage and one-use intent | Isolated pass: real server functions with simulated exchange responses; no real orders submitted |
| U09 | Demo long/short, fees, stop/target gaps, duplicate retry, concurrent changes and restart | Isolated pass: demo-account and customer-page; actual SQLite persistence, simulated public quotes |
| U10 | Crypto strategy confirmation, stale/forming data, separate sweep and fakeout filters | Isolated pass: signals, multi-timeframe, setup-quality, fakeouts; no guarantee fakeouts are eliminated |
| U11 | NSE directory and scanner paging, pause/resume, quotas and preflight | Isolated pass: Dhan integration/screener suites. User's earlier screenshot showed 331/3214 checked; full live completion not witnessed |
| U12 | Exact Indian chart handoff | Copy-and-open Dhan path passes. Automatic selection inside Dhan remains unavailable |
| U13 | Global reference/cash distinction and unsupported interval handling | Isolated pass; browser provider behaviour verified in build 36. CFD and end-of-day limits remain |
| U14 | US screener overview/performance/oscillators/moving averages | Configuration and failure tests pass; provider rows/columns verified in build 36 |
| U15 | Non-US country selection | Incomplete: widget returned US stocks. Misleading rows are suppressed; full provider screener opens for manual market selection |
| U16 | Global inner-tab highlight and URL | Fixed; automated and current browser UAT pass |
| U17 | AI basket search, tracking and selected-symbol handoff | Isolated pass; browser filtering/provider output verified. Basket is curated; no independent AI research backend |
| U18 | Performance 3/6/12-month date windows and resumable imports | Isolated pass: learnings, learnings-page, learnings-recovery. User's actual year of history not imported here |
| U19 | P&L currencies, fees/funding, deposits excluded, deduplication and pagination | Isolated pass: performance and learnings backend tests with SQLite |
| U20 | Seven malformed report cases cannot expose partial/misleading report; retry recovers | Seven reproduced failures fixed; uat-report-validation.mjs passes |
| U21 | Notes, day/range selection, unsaved-change protection and factual feedback | Isolated pass: learnings-page, journey-regressions and deep-review suites |
| U22 | Custom alert save/check/pause/rearm, owner isolation and fresh data | Isolated pass: custom-alerts and customer-page; no live notifications dispatched |
| U23 | Saved watchlist, active trades, hourly dedup and volume-surge batches | Isolated pass: background, local-watchlist, trade-monitor, surge-scanner |
| U24 | WhatsApp pause/consent/templates/dedup/provider failures | Isolated pass. Real provider acceptance and recipient delivery not tested |
| U25 | Telegram authorization, reconnect, retained posts/media and setup | Isolated pass. Current real Telegram account session not exercised |
| U26 | Naam Japa recording lifecycle and repeat playback | Isolated pass with simulated media APIs; browser initial state inspected, microphone remained off. Actual hardware/audio continuity not tested |

## Backend and middleware inventory

| Area | Server / storage implementation | What the UI actually uses |
|---|---|---|
| Application server | Compiled Worker in dist/server/index.js; Node localhost wrapper in local-trading.mjs | Real API requests, not static-only hosting |
| Owner / request checks | Owner identity gates, same-origin JSON checks, route allowlists, validation and freshness checks in service routes; localhost Host restriction | Prevents unauthorized/cross-origin operations; not an external audit or penetration-test certification |
| Connection persistence | delta-desk.js, shark-desk.js, dhan.js; encrypted records; local-store.mjs SQLite and migrations; Windows key protection code | Saved sessions; provider may still expire/revoke a key/token |
| Crypto orders | Server-generated expiring review intent, submit-time revalidation and exchange API calls | Final confirmation required. Exchange acceptance is not a fill |
| Demo | demo-desk.js + demo_accounts table | Simulated funds and positions, not exchange orders |
| Performance | performance.js, learnings.js, deep-review.js + learning tables | Resumable Delta history import and deterministic calculations; no invented intentions |
| Indian market data | dhan.js + indian-signals.js | Dhan directory, quotes and historical candles; frontend drives full-market scan |
| Alert services | background.js, trade-monitor.js, surge-scanner.js, custom-alerts.js, whatsapp.js | Durable server records and bounded checks; local process or configured hosted scheduler must run |
| Telegram | local-telegram.mjs and telegram-news.js | Connected local session/public preview depending on environment |
| Global stocks/indices | Third-party provider widgets mounted by dist/stocks.js | No independent global broker, history warehouse or strategy scanner backend |
| AI & Computing / Japa | Browser filtering/storage and media APIs | Intentionally browser functions; not an AI voice-generation service |

## Outstanding acceptance blockers

- Real Delta/Shark order placement, SL/TP execution and broker outage recovery were not tested on customer accounts. No real positions, margin or leverage were changed.
- The customer's localhost sessions are on their own machine. The hosted owner gate previously rejected this agent's account reads; do not equate simulated-provider passes with live verification.
- Global automated strategy scanning, global brokerage and licensed low-latency global history/feed integration are absent. Public widgets can be delayed/restricted.
- Indian order placement is unavailable in this implementation. Multi-timeframe/lifetime ATH confirmation is unavailable. Closed-app Indian alerts are unavailable; full NSE scanning requires the page open.
- Automatic Dhan terminal stock selection remains unresolved. The current button copies the selected stock for manual search.
- Three provider errors were visible in the user's NSE screenshot; their exact causes were not supplied and are not claimed fixed.
- Actual WhatsApp delivery, authenticated Telegram updates, real microphone/audio playback and Windows-native launcher/key-protection behaviour were not exercised on the customer's machine in this Linux session.
- Broker-data latency and fakeout elimination cannot be guaranteed.

## Next release priorities

1. Observe a complete NSE scan during an open session and inspect each provider error; verify actual account/history recovery without changing positions.
2. Choose and integrate a licensed global data source before presenting global strategy scanning as available.
3. Run a customer-side live acceptance session for brokerage, messaging and Windows/media journeys. Keep unexecuted cases marked unverified until evidence exists.
