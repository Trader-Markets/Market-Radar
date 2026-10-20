# Indian Markets repair — 2026.10.20.india.30

## Screenshot findings

The overview and NSE screener's `fetch failed` had one reproducible cause: the documented Dhan segment-directory URL returns HTTP 302 to a signed public CSV download, but our code used `redirect: error`. Stock resolution, stock search, index quotes and scans all depend on that directory. Previous mocked tests returned CSV directly and missed the redirect.

The holdings screenshot is a separate Dhan HTTP 500 (`DH-111`). It does not establish that the account is misconfigured or empty. The embedded NSE TradingView notification is another independent provider restriction, not a Dhan-token failure.

## Changes

- Follow bounded public-directory redirects only to the exact selected segment on known Dhan download hosts and paths. No account headers are attached. Reject insecure, foreign, wrong-bucket and wrong-segment redirects. Share one download deadline and retain the size bound.
- Replace raw directory transport errors with a clear recovery message. Failed loads can retry normally.
- Retry read-only account GETs once for HTTP 500/502/503/504. Never retry order actions, which remain unsupported.
- Report Dhan server failures accurately; do not tell the customer to change instrument/account permissions for HTTP 500.
- Isolate failed account sections. Retry a failed section alone and merge it with working positions/funds. Retain previously fetched data, explicitly marked as not current, if refresh transport fails.
- Stop account requests after an authentication/access failure and retain encrypted saved connection details for recovery.
- Add app-owned NSE/BSE company/ticker search to the chart tab. Selecting a result changes the exact chart symbol and strategy-plan selection. Late searches cannot change another query, exchange or page.
- Put **Open full Dhan chart** directly beside the embedded chart. It opens `tv.dhan.co` in a separate tab; it is not an in-app chart fix.

## Verification

88 automated checks passed, zero failed/skipped. Coverage includes connection persistence/security, directory redirects and recovery, account partial failures/retry/authentication, quotes and timestamps, screener pagination/pause/resume, strategies, alerts, chart selection, navigation and the existing crypto/performance/news/Japa suite. Provider responses in those tests are controlled; the suite also starts an isolated real localhost HTTP server without customer accounts.

Separately ran the actual new directory code against Dhan's live public endpoints on 20 October 2026. Both redirects downloaded and parsed successfully: 9,997 supported NSE equity records before the share-only screener filter, and 190 supported index records. Verified TCS security ID 11536, Nifty 50 ID 13, Nifty Bank ID 25, Sensex ID 51. Counts are source snapshots, not permanent universe sizes. No private account credentials, real trades or messages were used.

Browser pixel rendering and the owner's live Dhan account could not be tested in this environment. The customer-local account cannot be accessed from this workspace. Dhan may still return server errors; retry handling cannot repair the provider's backend.

## Chart status — unresolved external dependency

The free TradingView widget cannot accept Dhan data or unlock restricted NSE symbols. This release does not claim to provide the requested full native TradingView chart inside Market Radar. That requires approved access to TradingView's separate charting library under terms suitable for this private application, plus a Dhan datafeed implementation and relevant data permissions. No approved library bundle is available in this project. A personal TradingView subscription or switching brokers does not remove widget restrictions.

The embedded preview remains subject to this restriction. Full broker chart access currently opens a separate Dhan tab. Indian order submission, streaming zero-delay quotes and closed-app Indian alerts are not implemented. The site remains owner-private.

## Install on Windows

Close the old Market Radar terminal. Extract the complete ZIP into a new folder and run **Start Market Radar.cmd**. Confirm build **2026.10.20.india.30** in Indian Markets. Saved Dhan/crypto connections and history remain in AppData/MarketRadar; do not delete that folder. Hosted publication does not update an already-running localhost installation.
