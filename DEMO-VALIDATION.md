# Demo trading repair validation — 2 October 2026

Fixed mode synchronization and saved preference; removed artificial price defaults; preserved cleared drafts; enabled closing without a selected chart; exposed demo positions in My Positions; retained actionable errors; serialized requests and protected against old responses; reconciled uncertain submissions with idempotent retries.

The Worker obtains public exchange quotes for entry validation and exits. Browser prices cannot set exits. Sync updates every open coin, with per-coin feed errors. Atomic writes re-read concurrent state. Fees, reserved margin, realized P&L and restart persistence are verified.

Validation: npm run build and npm test; all 16 test scripts pass. Demo tests use a real SQLite adapter and Worker with mocked public exchange responses. DOM integration exercises the actual submit and close buttons, cleared drafts, mode toggles, My Positions, failure recovery and stale responses. Server tests cover long/short, insufficient funds, fees, gap exits, stale quotes, duplicate and concurrent requests, multiple exchange coins, owner isolation and persistence after restart. Existing real-trading safety tests also pass. No real orders or WhatsApp messages sent.

Limits: no browser-rendered production interaction was verified in this environment. Simulated entry fills use the entered price (within 5% of a fresh quote), not an exchange matching engine. Stop/target observation runs while open and resumes when reopened; prices missed while closed are not replayed. This is not a guarantee of flawless behavior or real-market execution fidelity.
