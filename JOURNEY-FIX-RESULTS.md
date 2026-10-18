# Reproduced journey fixes — 19 October 2026

Only reproduced failures were changed in this pass.

| Journey | Before | After | Fix |
| --- | --- | --- | --- |
| Delta: cancel a pending review, open a second review, then receive the first request failure | FAIL: old error replaces current successful-review status | PASS | Ignore an error unless its review context is still current and the dialog remains open |
| Shark: same cancelled-review sequence | FAIL: same stale-error overwrite | PASS | Same current-context check |
| Shark: open Chart on a BTCINR position while market is USDT | FAIL: opens the position symbol in USDT context | PASS | Select INR before reloading listings and opening the chart |
| Performance: enter an unsaved learning, choose a preset, decline discard | FAIL: date fields change despite declining | PASS | Ask before changing preset/date state |

## Metrics

- Reproduced defects: 4.
- Verified fixes: 4/4 = 100% for this reproduced set.
- Targeted journey checks: 0/4 passing before, 4/4 passing after.
- Full automated suite: 48 runner tests across 45 files, 48 passed, 0 failed.
- Controls: current review errors still appear; accepting discard still changes the date preset.
- Build and whitespace checks passed.

These are DOM/integration tests with controlled responses, not a measured pass rate for every live customer journey. No real orders, messages, or private-account changes were made. Windows/browser rendering, real exchange credentials and external delivery remain unverified in this pass. The previous broader audit and limits are in QA-AUDIT-2026-10-19.md.

## Install

Close the old Market Radar server terminal, extract the full update and run Start Market Radar.cmd. Saved accounts and history remain outside the extracted program folder.
