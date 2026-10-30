# ARIA review and warning fixes — build 45, 29 October 2026

## Coin identity and assessment
The screenshot shows ARIAUSD. Delta identifies it as Aria.AI perpetual. AriaAI is a BEP20 gaming/AI project; exchange listing information identifies BNB token 0x5d3A12c42E5372B2CC3264AB3cdcF660a1555238. This is not every unrelated token sharing the ARIA ticker.

There is insufficient verified evidence in this review to declare fraud, insider accumulation or an impending rally. Treat the outcome as high-risk/inconclusive. CertiK's automated snapshot reports no honeypot/minting finding and flags concentrated holdings: its displayed top-ten ratio is about 85%. Wallet allocation, vesting, custody and exchange roles require separate investigation; concentration does not by itself prove common control or selling. The official allocation table includes 15% team and 8.5% investor allocations with vesting. No exact current unlock quantity was independently verified. Direct BscScan retrieval returned HTTP 403; on-chain wallet movements were not independently reconstructed. Third-party claims about project-wallet exchange deposits were not adopted as verified facts.

Official/primary references reviewed:
- https://www.delta.exchange/futures-guide-aria.ai
- https://bitmart.zendesk.com/hc/en-us/articles/40230622217499-AriaAI-ARIA
- https://docs.playariagame.com/tokenomics/allocation-and-vesting
- https://v1.skynet.cdn.certik.com/tools/token-scan/bsc/0x5d3a12c42e5372b2cc3264ab3cdcf660a1555238

A real public Delta ticker read retrieved 29 October 2026 at 06:38:29 UTC (12:08:29 IST) returned close 0.08976 USD, 24h high 0.09192, low 0.07947, turnover_usd 1,992,848.60 and contract OI 316,537. Native funding_rate was 0.005; it is not annualised or compared with a fabricated history. These are a one-time provider snapshot, not guaranteed current prices or evidence of an OI increase. A subsequent parallel candle-history/ticker request timed out, preventing current breakout/volume reconstruction. No current long/short trade recommendation or probability is supplied.

## Screenshot defects and fixes
The bold ARIA warning is dated 26 October 00:50 IST, three calendar dates before the screenshot. Old detections previously remained visually prominent indefinitely. The UI now separates Recent warnings from a collapsed Earlier warnings / HISTORICAL section. Recent display requires an event no older than 10 minutes, enabled feature/scanner, matching venue and quote, a successful latest per-coin warning of the same direction, a quote-fresh flag at that check and a check age at most six minutes. Otherwise the detection is history. These are display freshness rules, not a promise that the market remains valid between checks. Existing dedup and notification rules are unchanged.

Adding a newly ranked market previously closed and recreated shared source sockets, wiping every coin's warm-up. New markets now subscribe incrementally with request-ID acknowledgement and per-symbol warm-up start times. Existing acknowledged symbols preserve their history and baseline. A real disconnect still resets the interrupted source baseline. Public connection status now reports ready and warming market counts. The screenshot's particular 59-minute warm-up could also follow a normal restart; no assertion is made that this specific customer session repeatedly reset.

The component count now reads checks have data, with a clear explanation that coverage is not confidence, safety or profit probability. No token-specific scam rating or external risk data is invented in the app.

## Validation and remaining acceptance
129 automated checks passed, zero failures/skips. New cases verify the screenshot's old ARIA event goes to history, a recent supported event appears separately, latest invalidation/paused scanning remove it from recent display, and adding ETH does not reset an existing ready BTC baseline or open a new socket. Source acknowledgement tests require a real subscription request before accepting a successful acknowledgement. Tests use controlled providers/isolated storage; a public ticker read succeeded but real liquidation-event receipt on customer hardware was not exercised. Browser preview checked navigation and failure recovery; account APIs are intentionally disabled there.

This release addresses the screenshot and reproduced collector behaviour, and runs the full regression suite. It does not close all prior acceptance blockers. Real Delta/Shark order/SL/TP execution and broker recovery, customer account performance reconciliation, actual messaging delivery, Dhan order execution, licensed global strategy backend and always-on hosted liquidation collection remain as documented in UAT-44-REPORT.md. No customer trades, settings, risk, keys, recipients or sharing were changed. Site remains owner-private. Do not describe this as full production acceptance for a prospective customer.
