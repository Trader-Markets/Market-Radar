> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Hyphenated stock symbols and screener search repair

Build `2026.10.19.symbols.20`

A reproduced error sent a typed stock ticker containing a hyphen (for example `BAJAJ-AUTO` or `NSE:BAJAJ-AUTO`) straight to the broker as though it already included an exchange series. It should resolve through the FYERS cash-market catalog to `NSE:BAJAJ-AUTO-EQ`. This affected the main chart, strategy scan, quote and plan handoff. The backend resolver also made the same incorrect hyphen assumption.

The resolver now looks up cash instruments exactly in the symbol master before trying the `-EQ` variant. Explicit index and numeric derivative contract codes retain their existing handling. The chart and strategy-plan screens recognize series suffixes rather than treating any hyphen in a company ticker as a completed code. Other series can still be resolved exactly through the directory.

The stock screener now invalidates pending search results and clears the selected match when the query changes. A response for the previous query cannot overwrite the new query's selection.

Tests reproduce the original hyphen error, then check bare/prefixed/exact inputs, canonical chart and strategy requests, and stale screener search completion. All previous loading, authentication, account, full-universe scanning and source protections remain covered by the existing automated suite. Actual browser rendering and the user's private live FYERS session are not verified.

The hosted log sample reviewed during this audit had no FYERS requests among the latest 100 events. This does not establish that FYERS had no failures, or identify which localhost release the customer was using. Hosted publication and the local Windows app are separate installations. The page's Indian-markets connection bar reports the local server build; confirm symbols.20 when using this package.
