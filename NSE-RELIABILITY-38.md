# NSE reliability — step 1, build 38

24 October 2026. This release improves the existing server scanner, not just its appearance. Live acceptance of the customer's full NSE scan remains pending.

## Concrete path

The page requests /api/dhan/scan for a selected instrument. The server resolves its Dhan security ID, makes three bounded hourly-history requests, a daily-history request and a quote request, parses closed candles, aggregates session candles, and calculates the strategy results. It returns the evidence to the page. The page orchestrates the all-stock loop and saves its checkpoint in browser storage. This is real server calculation, but is not yet a durable server-side full-market job or a closed-app Indian scanner.

## Changes

- Separate Provider errors only from Unavailable strategy checks. Previously the unimplemented ATH check made nearly every stock appear in the combined issues filter, obscuring actual failures.
- Add Retry failed stock. It retries the selected provider failure without clearing other results or restarting the full universe. It obeys the pending-request lock and ignores late replies after navigation/pause.
- Add Copy scan report with a readonly manual-copy fallback. The report contains progress, unavailable counts by strategy, provider error rows and confirmed-at-check evidence. It does not include API keys, positions or balances. Ordinary watch rows are omitted to keep support output bounded in typical scans.
- Add server-generated diagnostics: hourly/full-hourly/4H/daily candle counts, latest evidence times, quote source time/freshness and request completeness. Rows show the full-hour and 4H coverage and quote freshness at the time of checking.
- Fix 1H selection after the final shortened session candle. Use the last full 1H candle; do not pretend there are too few candles just because a later 15-minute session candle exists. A later shortened candle closing back through the breakout level prevents confirmation.
- Withhold confirmation after any failed provider request. Historical results cannot become a confirmed trade merely because the scan counter advanced.
- A flat non-breakout now says No setup instead of Watch. Confirmations are labelled Confirmed at check and retain timestamps; they are not indefinite live-entry permission.

## Executed validation

Worker build succeeded. 110 automated test entries passed, 0 failed, 0 skipped. New server tests cover partial-history confirmation refusal, last-full-hour selection and later rejection/stale quote refusal. A full server integration case feeds bounded simulated Dhan candle arrays through actual parsing, aggregation and strategy functions: more than 1,000 full hourly bars, at least 220 4H bars and more than 200 daily bars; the flat market returns No setup for 1H and Watch for EMA consolidation. ATH correctly remains Unavailable.

The customer screener test runs 122 symbols with simulated provider failures, rate-limit recovery, unavailable ATH results, provider-only filtering, individual retry, retained progress and copied report. Browser QA verified the new filters and manual report fallback with account requests disabled. This is not a live Dhan scan or proof that the customer's three errors have disappeared. No account keys, orders, positions, leverage or margin were changed; no messages were sent.

## Customer acceptance step

1. Close the old Market Radar terminal, extract build 38 and run Start Market Radar.cmd.
2. Open Indian Markets -> Stock screener. Existing compatible browser checkpoints may restore; select a fresh full scan for current evidence, or resume unfinished work.
3. Set Show -> Provider errors only. Use Retry failed stock where available.
4. Choose Copy scan report and share the resulting text. This replaces the need to manually transcribe screenshots and includes the exact failed symbols/reasons.

The app must stay open for the full NSE loop. A multi-hour scan has individual check times, not one simultaneous market snapshot. Without a fresh valid quote it will not confirm a live breakout. Lifetime ATH/multi-timeframe alignment, Indian orders, closed-app Indian alerts and automatic Dhan terminal stock selection remain outstanding. Step 1 is not signed off until the actual run and remaining errors are verified.
