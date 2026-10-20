# FYERS screener repair — 2026.10.20.scan.26

## Observed failure
The owner's screenshots showed HTTP 429/code -360 at the first NSE instrument. The previous error formatter prioritized plan/permission text over HTTP 429 and incorrectly suggested seconds-data access. Each stock could issue six market-data calls, including three parallel history calls, followed by only a two-second inter-stock pause. This exceeded FYERS Standard's recently revised Data API minute allowance.

## Changes
- Data requests share a sequential lane per saved session in the running server instance, spaced at least 1.5 seconds apart (at most 40/minute from that lane). Account endpoints remain separate.
- HTTP 429 is recognized before permission/plan hints, including unreadable bodies and code -360. JSON -429 is also recognized. Retry-After is respected with a conservative minimum 65-second cooldown.
- A provider rate limit stops the remaining history/quote calls for that stock. The response includes quota metadata; no missing-data result becomes a confirmed setup.
- The scanner waits with a visible countdown and retries the same unchecked stock once. Persistent or explicit daily limits pause with progress retained. Pause/navigation cancels the countdown, and late requests cannot overwrite another workspace.
- Successful history responses have a small, session-isolated, two-minute cache. Quote snapshots are not cached.
- Initial quotes and Refresh visible quotes load only the displayed table page in bounded batches, rather than every NSE instrument. Other pages can load their own quotes.
- Table actions are compact and aligned. Unknown change percentages no longer render as a meaningless dash followed by a percent sign. Missing quotes are marked Not requested yet.
- Large-universe scans display their potential request count and FYERS Standard daily allowance.

## Verification
64 automated checks passed. New tests cover 60-request simulated pacing, concurrent-call serialization, HTTP 429/-360 precedence, Retry-After/cooldown, non-JSON 429, explicit daily limits, session isolation/cache expiry, first-error short circuit, same-stock retry, persistent-limit pause, and cancellation during cooldown. Existing integration/account/chart/scanner tests also passed. No real orders, messages, credentials or account settings were changed. Tests use simulated provider responses; the owner's actual FYERS quota and browser rendering could not be checked here.

## Provider limits remain
FYERS official Plans & Limits documentation (updated 14 October 2026): https://fyers.in/api-docs/v3/getting-started/plans-and-limits/
Standard Data APIs: 5/second, 50/minute, 5,000/day. A full 3,208-instrument scan can require up to 19,248 calls and cannot be promised to finish within that daily allowance. Use My saved list for focused strategy checks; all NSE instruments remain searchable/chartable.
Pacing/cooldown state is server-process/isolate scoped. Usage from other apps, processes, hosted instances or a restarted server also consumes the broker's quota. The update cannot reset an already exhausted daily quota. Repeated provider exhaustion is paused rather than endlessly retried.

## Windows installation
Close the old Market Radar server terminal, extract the complete updated ZIP into a new folder, then run Start Market Radar.cmd. Confirm build 2026.10.20.scan.26. Existing AppData/MarketRadar account data is retained; do not delete it.
