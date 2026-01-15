---
'heroshot': minor
---

- Beautiful terminal UI with `@clack/prompts` - animated spinners, progress counters, styled messages
- Full-page screenshots by omitting selector (uses Playwright `fullPage: true`)
- "Both" color scheme is now the default - captures light and dark variants automatically
- Viewport variants - `viewports: ["desktop", "tablet", "mobile"]` per-screenshot for multi-size capture
- `heroshot sync <pattern>` - filter screenshots by id, name, or filename
- Retry flaky screenshots with exponential backoff
- Exit CLI gracefully when browser window is closed manually
- Save browser settings from toolbar UI to config
- Dark mode background detection for padding mask
