# Full NSE stock screener

Build `2026.10.19.nse.17`

**Indian markets → Stock screener → All NSE stocks → Start full NSE scan.**

The default universe now comes from the entire FYERS NSE_CM directory, not a selected list, top 20, Nifty 50/500, or the first 50 search matches. It includes every equity and preference-share instrument FYERS publishes (instrument types 0 and 1), including SME and other equity series. Duplicate exact symbols are removed; distinct series remain separate. ETFs, indices, debt and derivatives have different provider classifications and are excluded. The UI displays the actual count and directory fetch timestamp. Completeness is relative to FYERS' published master, not an independently reconciled NSE listing feed. Suspended/delisted/new symbols can be subject to provider coverage and permissions.

Search the whole loaded universe by company/ticker. Tables paginate 50 rows. Filters show confirmed setups, watches, unavailable checks, or positive/negative daily quote changes. Chart and Plans open the exact chosen instrument. An optional My saved list mode preserves the earlier custom NSE/BSE lists.

Strategy scans process every instrument sequentially with a two-second gap between checks. Each existing strategy request can make up to six broker calls. No instrument is silently dropped because a request fails. Provider errors and missing history/volume remain visible, separately from confirmation. Login expiry or rate/quota errors pause at the current instrument for retry; other individual failures are recorded and the scan continues. Quote refresh covers the whole universe in batches of 20 with 300ms spacing. Other tabs/processes also consume broker quotas; these intervals cannot guarantee avoiding account-wide limits.

Pause retains completed results. Resume retries the next unchecked instrument, after any previous in-flight request settles. Checkpoints are saved every ten results, at start, pause, completion and navigation. A matching universe/mode can restore progress for up to six hours after the last checkpoint. Browser storage failure is shown; progress cannot then be guaranteed across a reload. A changed directory invalidates the old checkpoint rather than skipping new symbols. Quote snapshots are fetched again when needed; they are not saved as live data.

This browser-driven full scan can take hours. The page must remain open and the computer/server awake; sleeping browsers may slow or suspend requests. Each result has its own check time. A full scan is not a simultaneous or streaming market-wide snapshot. No FYERS orders, background stock alerts, WhatsApp messages or settings changes are added.

Existing strategy rules are unchanged. Lifetime ATH confirmation remains unavailable from limited history, and fakeouts cannot be guaranteed absent. A watch or missing-data result must not become a confirmed setup merely because the stock was scanned.

Verification: backend fixtures cover complete untruncated universe output, all equity series, preference shares, SME, deduplication, non-stock exclusion and owner authentication. DOM/API fixtures exercise 122 stocks (past the old 20/50 caps), paging, whole-universe company search, quote batching, per-stock errors, request pacing, quota pause/retry, cancellation, reload restore and exact chart/plan handoffs. These do not verify a private FYERS session or actual browser appearance.

Provider references:
- https://fyers.in/api-docs/v3/api/market-information/symbol-master/symbol-master-file/
- https://fyers.in/api-docs/v3/api/appendix/instrument-types/
- https://support.fyers.in/portal/en/kb/articles/what-are-the-fyers-api-rate-limits-for-standard-and-prime-plans
