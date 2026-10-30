# Global markets fixes — build 36

## Reproduced failures and changes
- Default S&P chart requested restricted SP:SPX while the quote table used FOREXCOM:SPXUSD. Reference mode now explicitly uses the labelled reference chart; the cash benchmark remains separately linked. CFDs are identified and never described as the official cash index.
- DAX INDEX:DEU40 rejected the former 1H interval. INDEX reference charts now start on daily candles, with end-of-day labels. Browser QA returned DAX daily OHLC and the provider's End of day data status.
- Japan and UK selections in the legacy embedded stock screener returned US symbols. Non-US selections now remove the embed and explain how to choose that country in the full provider screener. Embedded international country screening remains unavailable; this is a safe fallback, not a completed global data integration.
- The former Technicals value silently showed Overview. Replaced with Oscillators and Moving averages column sets; Performance remains available.
- Added an exact exchange:ticker Stock chart tab. Indian symbols are directed to Indian Markets; invalid inputs retain the current chart.
- Removed remaining Indian TradingView directory/quote links and routed Indian index chart selection to Dhan.
- Replaced panels cancel old timers and detach callbacks. Leaving the global workspace clears provider panels. AI tracking changes no longer reload unchanged quote baskets.

## Validation
Worker build and 99 automated tests passed, zero failures. Browser QA observed US screener stock rows, Performance and Oscillators columns, S&P reference candles with drawing controls, European reference quote values, and DAX daily OHLC after the interval correction. Tested exact ticker entry, cash/reference separation and cleanup in automated tests.

## Remaining limits
Public widgets control their data and timestamps. Their loading status is not freshness verification. Some reference indices are end-of-day and some cash benchmarks cannot embed. No zero-delay guarantee. No global broker/data API or global Breakout Radar strategy scanner was added. Non-US screening currently opens the full provider screener for manual market selection. All 26 cash benchmarks remain discoverable; not every exchange's live data was verified.
