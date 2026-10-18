# Customer release candidate — 18 October 2026

## Result

37 automated test files passed after the repairs below. The build completed successfully. This is a release candidate for customer acceptance testing; automated fixtures do not establish that every live broker, provider entitlement, or Windows computer is working.

## Reproduced defects repaired in this pass

1. A failed quote request for an old Indian instrument could overwrite the newly selected instrument's screen. Requests now carry a view and instrument revision; old successes and failures are ignored, including an A → B → A switch.
2. A failed older scan could clear newer strategy results. Scan replies and button state now belong to their own request revision.
3. Repeated account-refresh clicks could launch overlapping requests. Refresh is disabled while the current request is running.
4. Late FYERS login/setup responses could modify another tab or access removed form fields. UI changes are restricted to the originating view, and secret fields are cleared using their original form element.
5. Malformed saved Indian alerts could crash the alerts tab. The app validates and bounds saved rules before rendering or checking them.
6. A broker quote marked fresh on the server could arrive too late and trigger a browser alert. The browser rechecks its timestamp, price and age before triggering; old or future quotes cannot trigger.

## Automated coverage

| Area | Verification |
| --- | --- |
| Crypto scanner | Layered strategy checks, closed candles, volume, freshness, gaps, fakeout rejection rules, separate sweep checks and bounded Top 20 volume scanner |
| Trading | Demo flow, sizing, leverage/price increments, explicit order review, duplicate submission guards, stale-price protection, stop/target validation and displayed positions |
| Connections | Owner isolation, encrypted storage, persistence across restart, permission/IP error handling, disconnect behavior and relay authentication |
| Performance & learnings | Ledger reconciliation, separate currencies, calendar and duration selection, 90/180/365-day windows, bounded/resumable imports, malformed execution recovery and historical chart-review evidence |
| Global markets | Widget sizing, source configuration, CFD labels, index directory, screeners, AI watchlist/filter state, error recovery and workspace separation |
| Indian markets | FYERS auth/state/replay checks, overview/partial quotes, instrument presets, unavailable fields, stale timestamps, closed-candle checks and request races |
| Telegram | Local sign-in, two-step flow, encrypted session restore, channel isolation, formatted text, safe links, photos/albums, image access limits, edits/deletes and failed-feed labels |
| Alerts | Custom conditions, active-trade tracking, paused settings, title-only formatting, deduplication, provider failures and unknown delivery state |
| Windows startup | Old-server conflict detection, retry guidance and current-version reuse before opening account storage |

Tests use simulated exchange and notification responses. They do not place real orders or send real WhatsApp messages.

## Read-only live checks during this pass

- Delta India public ticker endpoint: HTTP 200, successful response, 237 returned ticker records.
- Delta India BTCUSD 5-minute candle endpoint: HTTP 200, successful response, 96 candle records. The latest source candle began approximately 124 seconds before the check. Forming candles are not confirmation evidence.
- Shark public exchange information endpoint: HTTP 200, 2 market entries and 343 contract entries.
- These checks verify public source reachability and response structure at the check time. They do not verify every instrument, account authentication, order execution, or future uptime.

The sampled hosted logs showed protected-route 403 access rejections and canceled public requests; no internal exception was identified in that returned sample. Missing visitor identity continues to be rejected. Authentication and owner isolation were not weakened.

## Customer acceptance still required

- First launch on the customer's Windows computer, browser layout and embedded TradingView content.
- The customer's Delta/Shark/FYERS API permissions, IP allowlist, private balances, positions and history reconciliation against their broker.
- Any real-order lifecycle, including exchange acknowledgement and protective stop/target persistence. No live-money test was performed.
- WhatsApp provider acceptance and actual device delivery; no live message was sent by this validation.
- Telegram image/download latency and session restore using the customer's own authorized account.

## Product scope that must remain clear

- Indian market order placement is not implemented; this section provides broker data, chart plans and checks, with a link to FYERS for execution.
- Global equities/indices currently use provider widgets. Exchange licensing can cause delayed or unavailable quotes. The widgets do not supply an API for the app's own global strategy scanner.
- Public reference rows marked CFD can differ from the official cash index. They are not labelled as official cash-index values.
- The hosted Site is owner-private; local and hosted account storage are separate. This is not a hosted multi-customer broker service.
- Local background work stops if the server exits or the computer sleeps. No zero-delay or guaranteed-trade-outcome claim is made.

## Install this candidate

Close the old Market Radar terminal window, extract the new ZIP, and open Start Market Radar.cmd. Existing saved local accounts and history live outside the extracted program folder and are retained. Use the old-server warning to close a conflicting older process before retrying.

## Follow-up repairs — release.2

- Index chart opens for the default selection; choosing a directory item from another region synchronizes the region and symbol controls.
- Reloading market quotes retains full-chart fallback links and source explanation.
- Changing an Indian instrument clears entry, stop, target and old alert titles, and synchronizes the preset.
- Missing chart library or empty candle history shows an explicit explanation instead of a blank panel.
- Null or malformed API bodies show a retry message rather than a JavaScript property error.

Validation: full 37-file automated suite, including additional DOM regressions. Windows rendering and connected private broker paths remain unverified here; prior acceptance limits still apply.

## Shared UI repair — ui.3

- One shared presentation layer covers dashboard, global markets, Indian markets, performance and Telegram setup pages.
- Main workspace links and buttons share the same selected state and touch target size; the performance page links directly back to each asset workspace.
- Trade chart and ticket stack on narrower screens; forms and section navigation use consistent mobile grids.
- Tables scroll within their own region, with keyboard focus and a small-screen scroll hint. Calendar cells retain readable text in a separately scrollable calendar instead of shrinking to 9–11px.
- Secondary controls, active tabs, errors, labels, cards and dialogs share readable spacing and contrast.
- Keyboard focus, skip links, bounded dialogs, wrapping notification titles and reduced-motion styles are included.

Verification: automated DOM navigation and interaction checks, CSS parsing, colour-contrast checks, full test suite and worker build. This environment has no supported browser-rendering path; actual Windows/phone visual acceptance remains outstanding.

## Integration recovery — integration.4

- FYERS history requests now run with bounded concurrency (maximum three). The browser scan deadline accommodates the server's history and quote deadlines.
- A failed timeframe is marked unavailable without discarding usable history from other timeframes. A missing/mismatched live quote cannot confirm an entry.
- FYERS, Delta and Shark account list validation rejects malformed provider data. Malformed optional Shark trade history retains positions and orders with an explicit warning.
- Saved malformed alerts cannot break dashboard startup. Null or unreadable API replies show actionable errors in account, WhatsApp and history paths.
- Indian request status appears above the chart; selected instruments survive tab changes. Settings operations are serialized and a late initial status response cannot overwrite a successful connection action.
- Quick ledger totals are collapsed; the full Performance & Learnings page remains the main review path. Workspace selection is retained in the URL for reloads and return navigation.

All checks use mocked authenticated provider responses. No real orders, leverage changes or messages were sent. Real Windows rendering, broker credentials/IP access, provider quotas and customer-account reconciliation still require acceptance testing.

## Naam Japa — japa.5

A separate Naam Japa browser tab is linked from the dashboard and performance page. Radha Krishna and Hare Krishna maha mantra support continuous device-voice spoken repetition. Local audio files up to 100 MB use native audio looping without being uploaded. Play, pause/resume, stop, volume, device voice and pace controls are included. Playback never starts automatically. Preferences are browser-local; recordings must be reselected after a reload.

Tests cover repeat scheduling, cancellation, blocked playback, local-file validation, stale callbacks and route integration. Actual audio rendering depends on the browser/OS and was not heard here. Closing the Japa tab stops it; background suspension or a sleeping device can interrupt playback. This is not an unattended server audio service. No devotional recording is bundled or represented as a singer's performance.

## Record my voice — record.6

Naam Japa now opens in Record my voice mode. A user gesture requests audio-only microphone permission. Record the desired maha mantra or any naam japa, stop capture, and press Play continuously to loop the actual recording. A download link preserves the recording as the browser-supported M4A, WebM or Ogg format. No voice cloning or new words are synthesized from this recording. No audio is uploaded.

Capture is bounded to five minutes and 100 MB. Playback is disabled while capturing. Microphone tracks are released on stop, error, cancellation, source change and page close; a late permission grant cannot restart a cancelled capture. Recordings remain browser-session-local, so users should download a copy before reloading.

Automated tests cover capture lifecycle, permission denial, late grants, empty/error cases, format selection, downloads, looping and cleanup. No actual microphone or speaker was accessed here; device-specific sound quality and permission UI still need customer testing.
