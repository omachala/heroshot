# heroshot

## 0.6.0

### Minor Changes

- b137b14: New editor features and integration improvements

  **Editor:**
  - Add paddingFill and elementFill modes (replaces maskPadding)
  - Visual picker improvements

  **Integrations:**
  - Vite plugin now auto-registers manifest when virtual module is imported
  - Docusaurus plugin injects client module that auto-registers manifest
  - Fix: integrations/shared now included in npm package build

  **Docs:**
  - Add React, Vue, Markdown integration guides
  - SEO improvements: canonical URLs, structured data, favicons
  - Dynamic page-level meta tags

## 0.5.1

### Patch Changes

- 1d14233: Simplify framework integration setup with auto-manifest registration
  - Vite plugin now auto-registers manifest when virtual module is imported
  - Docusaurus plugin injects client module that auto-registers manifest
  - Updated docs and examples with simplified setup patterns
  - Examples now use published npm package instead of workspace link
  - Added cache clearing to docs:dev script

## 0.5.0

### Minor Changes

- 675edeb: Add framework integrations for Vue, React, VitePress, Docusaurus, and MkDocs
  - Vue component with dark mode detection and responsive image support
  - React component with the same features
  - Vite plugin for automatic manifest injection
  - Docusaurus plugin with webpack alias support
  - Python/MkDocs macro integration for Material theme
  - Minimal example projects for each framework

## 0.4.0

### Minor Changes

- ff81ace: Add text overrides and rename toolbar to editor
  - Add textOverrides support for inline text editing in screenshots
  - Rename toolbar/ to editor/ for clarity
  - Merge sidebar and toolbar into unified EditorBar component
  - Remove sync command, add --clean flag to default command
  - Real-time config saving on screenshot changes

## 0.3.0

### Minor Changes

- 751339d: Add one-shot CLI mode for direct URL screenshots without config file
  - Capture screenshots directly from URL: `npx heroshot <url> -o output.png`
  - Support for element selection with `--selector`
  - Viewport presets: `--mobile`, `--tablet`, `--desktop`
  - Color scheme control: `--light`, `--dark`, or both by default
  - Retina support with `--retina` flag
  - Padding, dimensions, and quality options

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
