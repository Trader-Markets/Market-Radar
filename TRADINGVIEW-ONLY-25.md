> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# TradingView chart update — 2026.10.20.tv.25

Indian Markets and global stock charts now use TradingView's official Advanced Chart widget. The Indian screen no longer switches to a custom FYERS chart. Removed duplicate timeframe, indicator and drawing controls and obsolete custom chart modules. TradingView owns its native chart tools and symbol search.

Strategy charts keep the selected instrument fixed and stay mounted during strategy checks. Broker quotes, scanners and account features continue to use their existing data paths. TradingView widget prices come from TradingView, not the FYERS API; available instruments, data and features remain subject to TradingView's widget support. Unknown derivative mappings require an explicit TradingView symbol rather than guessing a different contract.

Chart expansion has a visible exit control and Escape support. Script failures offer retry and an external TradingView link without substituting another chart engine. Global NSE charts are attempted instead of being preemptively blocked.

Validation: all 59 automated tests passed, including eight focused TradingView integration tests. No real orders or messages were sent. Browser rendering and third-party native toolbar interactions could not be verified in this environment.

Windows: close the old Market Radar terminal, extract the complete updated ZIP, and start the CMD launcher. Existing user data stays in its configured application-data directory.
