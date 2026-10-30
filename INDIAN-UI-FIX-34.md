# Indian chart UI repair — 23 October 2026

Build: 2026.10.23.india.34

## Screenshots inspected
All three screenshots (072630, 072715, 072746) show the TradingView provider notification for NSE:NIFTY. They do not show a Dhan API response or prove a Dhan subscription/scanner failure. Subscription activation does not unlock that provider's embedded NSE feed.

## Changes
- NSE chart cards no longer automatically load the restricted iframe. The default is compact, with the exact selected symbol, a prominent full Dhan terminal link and an optional explicit TradingView embed button. An optional embed may still return the provider restriction. This is UI containment, not a fix to provider access.
- BSE daily charts and non-NSE embedded charts retain their existing behavior; end-of-day availability remains labelled.
- Chart search uses aligned fields and actions with a single-column mobile layout.
- Added Refresh Dhan quote on the chart/search page. It requests the selected exact broker symbol, displays source time and units, shows retryable failures and discards late data after changing stocks or leaving the page. It is a snapshot, not a streaming chart.
- Strategy results appear before the chart card, so an optional embed cannot obscure the checks.
- Full charts open at tv.dhan.co; the user must select the same instrument in the separate authenticated terminal. No unsupported broker deep-link or embedded terminal is claimed.

## Validation
99 automated checks passed, no failures/skips/cancellations. New regressions cover default NSE embed deferral, explicit embed loading, old-symbol quote rejection, failed quote recovery and snapshot labelling. Existing scanner/account/alert/performance and UI checks passed.
Browser QA used the compiled application in a read-only preview with all API routes disabled. Verified chart/search field alignment, compact NSE card with no automatic restriction popup, retryable quote failure, and Strategy checks appearing before chart actions. No live Dhan account success is claimed. The customer's localhost connection remains inaccessible to this workspace.

## Installation
Close the old terminal, extract the ZIP into a new folder and run Start Market Radar.cmd. Check build 2026.10.23.india.34. Preserve AppData/MarketRadar. Hosted deployment alone does not replace localhost files.
