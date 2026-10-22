# Indian Markets repair — 22 October 2026

Local build: 2026.10.22.india.31

## Observed failures
- The customer screenshot showed Apple inside an Indian chart while the application link named NSE:NIFTY. This does not establish that Apple was in the NSE scanner universe.
- The NSE directory contained 3,195 instruments, but the first historical-data request stopped scanning.
- Account reads and data access are separate. The screenshot did not expose the underlying Dhan error code or establish the subscription's current status.

## Changes
- Disable the unreliable Indian embedded chart across Indian chart search, strategy plans and global index selection. Preserve the exact selected symbol in an external TradingView link, plus the separate Dhan terminal link. No Apple/default-US-chart substitution. Full embedded Indian charts remain unavailable; this is a containment fix, not a licensed-chart implementation.
- Give Dhan's explicit data-entitlement codes 806/DH-902 precedence over HTTP 401. Authentication and market-data-access failures are now distinguished; sanitized reason/code fields are returned.
- Before starting or resuming the NSE scanner, validate the saved account profile and exact client ID, inactive Data API plan, one bounded historical read and one quote read. An accepted access check is not a trade confirmation or proof of a fresh quote.
- Failed access checks preserve the previous rows/checkpoint and send no individual stock strategy scans. Existing per-stock pacing, quota recovery and pause/resume remain intact.
- Add Manage Dhan connection directly to the scanner.

## Validation
90 automated checks passed, including provider-error fixtures, actual local HTTP integration, exact instrument navigation, access rejection/recovery, saved-progress retention, scan pacing and cancellation. Tests use controlled provider responses, not the customer's live Dhan token. No orders, subscriptions, token rotation or messages were submitted.

No browser-rendering or live-account success is claimed. The retained Worker project has no managed-preview development entrypoint. Provider account/data access and restricted TradingView availability cannot be repaired by frontend code alone.

## Local installation
Close the old Market Radar terminal, extract the new ZIP into a new folder and run Start Market Radar.cmd. Confirm build 2026.10.22.india.31 in Indian Markets. Do not delete AppData/MarketRadar: saved connections and history remain there. The hosted update does not replace the localhost installation.
