# Indian Dhan charts — build 35

The previous action linked only to the Dhan terminal homepage. It transmitted no selected instrument, so Dhan could restore Nifty or its last chart.

Indian NSE/BSE chart panels now show the selected symbol and exchange, and offer Copy stock & open Dhan. The stock name is copied when clipboard access is available; otherwise the readonly field remains available for manual copying. Paste it into Dhan search and confirm the exchange. Automatic instrument selection in the signed-in Dhan terminal remains unresolved: no supported general deep-link format was verified. A public Dhan iframe refused embedding and was not shipped.

Removed TradingView chart actions and embeds for Indian instruments, including Indian indices accessed from the shared global section. Other international charts retain their existing provider.

Validation: Worker build succeeded; 99 automated tests passed, zero failures. Covered stock handoff, clipboard rejection, instrument names, NSE/BSE routing, quote error recovery and existing broader regression suite. Browser QA confirmed TCS handoff and Indian workspace navigation. QA account routes were deliberately disabled; live broker orders and signed-in Dhan chart selection were not tested.
