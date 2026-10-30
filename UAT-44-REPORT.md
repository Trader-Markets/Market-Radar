# Market Radar UAT — 26 October 2026, build 44

## Assessment
The Site is active and owner-private. The final automated regression run passed 128/128 entries, zero failures or skips (12.89 seconds in this environment). This is a 100% pass rate for the controlled automated checks, not a 100% live-product acceptance score. Initial baseline was 126/126. New cases cover collector pause races and independent reconnects. Tests include simulated providers, actual isolated SQLite storage, frontend DOM journeys and a real isolated HTTP server on Linux. The assembled build-44 distribution also independently passed its localhost HTTP acceptance probe using the installed dependency set (startup, pages/assets, empty-account recovery, watchlist, CSRF/Host protection and withdrawal rejection). No customer orders, leverage, margin, keys, recipients or live alert settings were changed. No messages were sent.

The product has real server/middleware/storage implementations for crypto accounts, protected order workflows, demo accounting, scans, trade tracking, alerts and performance imports. Global research remains provider-widget driven; a working widget is not an implemented global trading/scanning backend.

## Fixed in this UAT
1. Public liquidation connections now retry independently after disconnection with capped 2–30 second backoff, instead of waiting for another scan batch. Pausing cancels retries. Native socket construction and send failures cannot escape unchecked.
2. A pause during awaited instrument metadata lookup no longer reopens collection after the user stops it. Subscription/baseline evidence remains unavailable after disconnect until rebuilt.
3. Failed activity scans now say Scan needs attention; their button offers Retry. They no longer describe the failed runner as continuously operating. The earlier grey enabled-button fix remains.
4. Scheduled crypto rescans skip hidden pages and non-crypto workspaces, reducing unnecessary public-feed traffic. Already in-flight scans are not aborted by this change; saved local/background jobs are unchanged.
5. Global panels use Hide provider panel rather than labelling every panel unavailable. Actual provider failure and timestamp notices remain.
6. The customer ZIP now has one current startup guide and this UAT report. Historical build notes/test logs are omitted from the download; source history is retained. Requested features are preserved.

## Journey results and practical limits
| Journey | Verified here | Remaining acceptance |
|---|---|---|
| Site and navigation | Active/owner-private metadata; separate crypto/global/Indian workspaces and seven setup tools; no document overflow at observed 1348px desktop viewport | No uptime or production latency benchmark was performed |
| Crypto charts and plans | Public listings loaded; chart tools and entry/stop/target DOM journeys, stream freshness, stale/out-of-order rejection, draft isolation and final-review guards tested | Provider widget/feed latency remains outside our control; real order and stop execution unverified |
| Real accounts / positions | Owner/CSRF, encrypted saved connections, partial response recovery, exact symbol routing and structural stop-coverage checks passed | Customer localhost sessions are not accessible here; real positions/balances, IP allowlists and restart recovery require customer-machine evidence |
| Demo | Isolated persisted demo positions/fills, fees, fresh close pricing and error recovery passed | Simulated accounting does not establish exchange execution quality |
| Crypto setups / custom alerts | Strategy, candle gaps, fakeout/sweep checks, exact Top20 scope, dedup, owner persistence and custom price/EMA rules passed | Fakeouts cannot be eliminated. Lifetime-ATH/multi-timeframe coverage remains limited as previously documented |
| Unusual activity | Start/pause/error states; sampled OI/funding; matching public liquidation instruments; baseline and reconnect/pause tests passed | Real event receipt on customer PC remains unverified. No hosted always-on collector. Shark derivative context unsupported. Top20 scope only; this is not every listed coin |
| Indian markets | Overview/screener navigation and disabled/error states inspected; Dhan directory, paging, scan pacing/checkpoints, source times and saved watchlist tested | Actual Dhan account/data-plan access unavailable in preview. Full NSE scan needs page open. Orders and automatic Dhan terminal stock selection not implemented. Only supported strategy confirmation can be labelled confirmed |
| Global indices/stocks | Indices region/source controls, charts, AI & Computing search (NVIDIA → one result), source failure handling and widget lifecycle checked | Observed stock widget explicitly marked quotes 15 minutes delayed. Licensed global feed, brokerage and automated strategy backend remain absent |
| Performance & Learnings | Separate page, 3/6/12-month selection, calendar, import/recovery and evidence-based analysis tested; browser controls change without crashing | Customer history reconciliation/P&L accuracy cannot be certified without the real account data. Preview correctly reports account unavailable |
| News | Telegram-only local setup, interrupted-connection state and channel escape link inspected; post formatting/images/entities, stale/error handling tested | Actual authenticated incoming Telegram updates and timing need local-session verification |
| WhatsApp | Provider-ID persistence and accepted/queued/sent versus delivered/read/failed status distinctions tested | Real recipient delivery not exercised; early activity warnings stay in-site under existing settings |
| Naam Japa | Recorder, local recording/library and playback-control tests passed | Microphone permission, actual audio/speech playback and Windows hardware behaviour not exercised |
| Installation | Isolated local HTTP server, routes, migrations and startup/version checks passed on Linux | Windows launcher and native key protection require Windows acceptance |

Browser verification used the read-only preview: account routes intentionally respond unavailable. It is not a connected customer account. A browser extension metadata warning was observed and is not classified as a product error. Provider scripts loading are never treated as proof of fresh data.

## Priority order for remaining work
P0: Verify real Delta/Shark account reads, stop/target acceptance and outage recovery on the actual connected machine before execution sign-off. Do not use a test-suite pass as evidence of live fills.
P1: Establish persistent hosted liquidation collection if operation with PC off is required; no cloud server was provisioned in this UAT. Verify public source access/events first.
P1: Dhan order/static-IP implementation and chart handoff remain outstanding. Validate current NSE scan output against the actual paid account.
P1: Choose and connect a licensed global market source before claiming live prices or backend global strategy scans.
P2: Confirm live WhatsApp/Telegram delivery and hardware audio locally. Preserve source timestamps, pause controls and unavailable states throughout.

## Use build 44
Close the old terminal. Extract to a new folder. Run Start Market Radar.cmd. Existing account data stays in its normal storage location. Read START-HERE.txt. Check Market Radar.cmd produces a sanitised read-only readiness report without saving account payloads; that report can help distinguish account/provider failures from UI failures.
