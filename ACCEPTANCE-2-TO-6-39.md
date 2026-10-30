# Acceptance items 2–6 — build 39

24 October 2026. No real trades, leverage/margin changes, credential changes or test messages were executed in this session.

| Item | Concrete work in this release | Acceptance still open |
|---|---|---|
| 2. Delta/Shark reliability | Server tracking and account warnings reject cancelled, invalid-price and duplicate stop records. Parent entry orders with future bracket instructions are not counted as active stop orders. Missing position size/state cannot silently establish that a position closed. | Real broker order acceptance, fills, SL/TP execution and outage recovery on the customer machine have not been witnessed. Structural order coverage does not guarantee execution. |
| 3. Indian strategies/background | New owner-scoped database-backed saved strategy watchlist, default paused. One due symbol per bounded step, max 8 NSE symbols, hourly due guard, concurrent-run lease, saved error/result evidence, confirmed title deduplication and pause/edit race protection. Local terminal checks it every minute without needing the browser. | Full NSE scan remains browser-driven. MTF/lifetime ATH remains unavailable. Only the existing 1H strategy can currently emit Confirmed; the other checks retain their original watch/unavailable states. Saved Indian alerts appear in the site when opened; this release does not push them to WhatsApp. Hosted background scheduling is not configured by this feature. |
| 4. Dhan charts/orders | Reviewed official Dhan order documentation and retained an honest manual chart handoff. Readiness report explicitly marks missing functionality. | Indian order execution and automatic stock selection in Dhan's terminal are not implemented. Dhan documents static-IP allowlisting for order APIs; no static server/IP was purchased or configured. No verified general stock-selection deep link is available in this implementation. |
| 5. Global backend | Readiness report and existing Global workspace identify the lack of an independent strategy backend, instead of describing provider widgets as automated scans. | No global data provider/broker API is configured. Global strategy scanning, brokerage and licensed low-latency data integration remain unimplemented. Provider choice/access is a prerequisite. |
| 6. Messaging/Windows/media | Persist valid Twilio message IDs on newly accepted sends. New GET-only Check latest delivery verifies the saved message's account/recipient and reports queued/sent versus delivered/read/failed/undelivered. New Check Market Radar.cmd runs sanitized localhost account/session checks and writes Market-Radar-Readiness.json. | Actual recipient delivery, current Telegram update timing, microphone playback and Windows DPAPI/launcher execution require customer-machine evidence. Old messages without a saved provider ID cannot be verified automatically. |

## Where to use it

- Close the old terminal, extract this build and run Start Market Radar.cmd. Existing account storage stays in its usual location; migrations add the watchlist/delivery columns without clearing accounts.
- Indian Markets -> More -> My alerts -> Saved strategy watchlist. Enter exact symbols such as NSE:TCS-EQ and NSE:RELIANCE-EQ, enable and Save watchlist. This opt-in is not enabled by installation. Keep the terminal running. With the browser closed, checks still save results and confirmed titles to the local database. Reopen and Refresh saved results to read them.
- Crypto -> Settings -> WhatsApp alerts -> Check latest delivery. This button reads an existing message status; it does not send a new message. The separate existing Send test WhatsApp button still sends only when the customer chooses it.
- While the app runs, double-click Check Market Radar.cmd. The generated JSON contains statuses only, not keys, balances, positions, recipient numbers or message bodies. Share this report to establish which local account reads actually succeed. It expressly does not certify order execution, delivery or hardware behaviour.

## Verification

112 automated test entries passed with zero failures/skips. Provider calls use controlled responses; live broker acceptance is not claimed. Added cases exercise actual SQLite watchlist persistence, default pause, owner/CSRF isolation, hourly eligibility, alert deduplication, provider errors, concurrent step rejection, settings changes during a scan, stopped timers, frontend unsaved-edit guards, safe error rendering, late replies and report privacy. Stop tests cover cancelled/duplicate/invalid-price orders and missing position size. Twilio tests confirm GET-only delivery reads and never treat queued/sent as delivered.

The assembled customer distribution was separately started as a real isolated HTTP server and passed its endpoint/SQLite/middleware checks, including the new watchlist route. This test runs on Linux, not Windows.

Browser QA verified the new Indian watchlist card and its disabled/offline recovery. A subsequent browser session error prevented visual verification of the WhatsApp settings button; frontend automated startup/integration checks passed. No live account settings were enabled through the preview.

## Prerequisites before remaining sign-off

1. Run Check Market Radar.cmd on the actual connected computer and review its sanitized output.
2. Verify a saved Indian watchlist check while the browser is closed and the terminal remains running. It must show actual Dhan timestamps and no invented confirmation.
3. Decide a static-IP deployment/access arrangement before implementing and accepting Dhan order execution. A paid Data API subscription alone is not proof of order-API readiness.
4. Identify the global broker/data provider already available, or choose one before implementation. Do not paste secrets into chat; any integration must use protected connection settings.
5. Observe a real opted-in WhatsApp message and then its delivery status; observe Telegram posts and hardware audio on the customer machine. No real message was dispatched during this engineering run.

Official references reviewed:
- Dhan order APIs: https://dhanhq.co/docs/v2/orders/ (static-IP requirement and order schema).
- Dhan history: https://dhanhq.co/docs/v2/historical-data/ (daily/intraday data). This release does not infer a verified lifetime ATH from limited history.
- Twilio Message resource: https://www.twilio.com/docs/messaging/api/message-resource (message fetch and status semantics).
