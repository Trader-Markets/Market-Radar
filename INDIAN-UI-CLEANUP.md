# Indian markets UI cleanup

Build `2026.10.19.clean.21`

The Indian-market workspace now groups controls around the customer's task:

- Main navigation: overview, chart, screener, strategy plans and positions. Setups, alerts and settings remain under More.
- Connection status has two primary actions, Connect/reconnect and Check connection. Duplicate chart/account shortcuts are under Quick links.
- Chart page: stock search first, selected instrument and main chart toolbar next, then the chart. Exchange/exact-symbol settings and lengthy source notes are expandable. Broker indicator and zoom controls appear inside the broker chart area. The full TradingView link remains visible.
- Strategy plans: choose a stock, load/check it, view the chart, then enter entry/stop/target. Presets, manual codes, exchange and automatic quote options are grouped in an expandable section.
- Settings: three separate step cards for app details, sign-in and completion.
- Tables: long strategy evidence wraps inside bounded columns, actions stack vertically, and narrower screens scroll the table horizontally. Controls use one- or two-column layouts on smaller screens.
- White surfaces, muted slate text, consistent purple primary actions, stable spacing and distinct section headings replace competing control rows and colour treatments.

Existing handlers and element IDs are retained. This is a presentation change; broker API behaviour, strategy rules, keys, account data, recipients and risk settings are unchanged. The full NSE screener and earlier symbol/loading fixes remain included.

Verification uses existing account, connection, chart, screener and navigation regression tests. Actual browser/pixel verification was unavailable, and passing those tests does not establish that every live UI issue is resolved.
