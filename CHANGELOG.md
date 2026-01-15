# heroshot

## 0.2.0

### Minor Changes

- 51587cb: - Beautiful terminal UI with `@clack/prompts` - animated spinners, progress counters, styled messages
  - Full-page screenshots by omitting selector (uses Playwright `fullPage: true`)
  - "Both" color scheme is now the default - captures light and dark variants automatically
  - Viewport variants - `viewports: ["desktop", "tablet", "mobile"]` per-screenshot for multi-size capture
  - `heroshot sync <pattern>` - filter screenshots by id, name, or filename
  - Retry flaky screenshots with exponential backoff
  - Exit CLI gracefully when browser window is closed manually
  - Save browser settings from toolbar UI to config
  - Dark mode background detection for padding mask

## 0.1.0

### Minor Changes

- 23e48a0: Add toolbar improvements: cursor tooltip showing selector while hovering, mask padding option to fill padding areas with detected background color, symmetric resize for padding controls, and redesigned welcome page with URL input bar.

### Patch Changes

- ec788fd: Update branding colors, documentation content, and add CSS palette with light/dark mode support.

## 0.0.6

### Patch Changes

- Add encrypted session support for CI environments (`HEROSHOT_SESSION_KEY` env var)
- Add `heroshot session-key` command to print session key for CI setup
- Add retina/device scale factor support (`browser.deviceScaleFactor` config)
- Add VitePress documentation site
- Change default output directory to `heroshots/`
- Move config from `heroshot.json` to `.heroshot/config.json`
- Fix CLI --version to read from package.json dynamically

## 0.0.5

### Patch Changes

- 3782abf: Add license section to README
