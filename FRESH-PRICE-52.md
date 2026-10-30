# Fresh-price display repair — build52, 30 October 2026

Small correction for the customer's screenshot showing an approximately1.79billion-second coin age. A reset timestamp of0 was accepted as a finite number, exposing Unix epoch age in the UI. No scanner thresholds or layout changes.

Missing, zero, negative and non-finite per-coin timestamps now normalise to null; invalid/non-positive prices normalise to null. Connected monitoring with no complete coin observation displays WAITING FOR FRESH PRICE, age unavailable, and never HOLDING. Real observations older than15seconds remain DATA STALE. Expiry, observed invalidation, pause and connection-unavailable states keep their earlier precedence. Reconnect initialises source times as null. Future source timestamps do not produce a false0second age; future check/detection times cannot produce a holding badge.

Verification:162automated full-suite checks passed,0failed,0skipped. Added zero/missing source and price cases reproduce the screenshot defect; DOM assertions require unavailable age and reject fabricated numeric age. Existing reconnect, per-coin validation, aging, scanner, localhostHTTP and owner/proxy checks pass. No live account trades or customer-machine execution were tested. No risk, key, recipient, sharing, scan interval, strategy or layout settings changed. Existing product/provider acceptance limitations remain.
