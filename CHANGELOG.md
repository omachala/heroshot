# heroshot

## 0.11.1

### Patch Changes

- 912ed14: Fix dark mode detection in Vue and React components

  Dark screenshots were incorrectly showing on mobile devices with dark OS preference, even when the user explicitly toggled the site to light mode.

  The components now follow this priority for theme detection:
  1. **Site theme first** - Check `.dark` class (VitePress) or `data-theme` attribute (Docusaurus)
  2. **System preference second** - Only used if framework hasn't set explicit theme
  3. **Default to light** - Fallback when nothing is detected

  This ensures that when a user explicitly toggles the site theme, the correct screenshot variant is displayed regardless of their OS preference.

## 0.11.0

### Minor Changes

- 02e4379: Add `--headed` flag to run browser in visible mode for debugging slow captures or timeout issues

## 0.10.1

### Patch Changes

- 6588ffe: Fixed toolbar not appearing when running heroshot (#47). Multiple root causes identified and fixed:
  1. **EDITOR_DIR path bug**: Path resolved incorrectly when running from bundled `dist/` directory, going outside the package and failing to find `editor/dist/editor.js`
  2. **Missing explicit injection**: The `domcontentloaded` event listener could miss the first page load, leaving users with no toolbar on initial navigation
  3. **tsx \_\_name serialization issue**: Development mode (`pnpm dev`) was broken due to esbuild adding `__name()` wrappers to nested function properties, which don't exist in browser context
  4. **Silent error swallowing**: Injection errors were caught but not logged, making debugging impossible

  **Additional fixes:** 5. **Version flag returning 0.0.0 (#45)**: Path to package.json was going up 1 level from `dist/cli/` but needed 2 levels to reach package root 6. **Action timeout option (#48)**: Added optional `timeout` parameter to `click`, `type`, `hover`, `select_option`, `drag`, and `fill_form` actions for complex component libraries

  Added comprehensive tests and documentation to prevent regression.

## 0.10.0

### Minor Changes

- 658d09a: Add hide action, list command, and browser options
  - `bypassCSP` enabled by default for reliable `evaluate` actions
  - New `hide` action to remove elements before capture
  - New `heroshot list` command with `--json` flag
  - New `browser.reducedMotion` option to disable animations
  - New `browser.userAgent` option for custom user agent

- 3a28540: Add MCP server for AI agent integration
  - New `heroshot mcp` command to start MCP server via stdio transport
  - Tools: `heroshot_sync`, `heroshot_add`, `heroshot_list`, `heroshot_snippet`, `heroshot_remove`
  - Schema-driven with Zod for auto JSON Schema conversion

## 0.9.0

### Minor Changes

- Add Sphinx extension for theme-aware screenshots in Python documentation
  - New `heroshot.sphinx` extension with `.. heroshot::` and `.. heroshot-single::` directives
  - CSS-based theme switching supports Furo, PyData, and `prefers-color-scheme` fallback
  - Responsive viewport support via `<picture>` elements sorted by width

## 0.8.0

### Minor Changes

- ccb499d: Add pre-screenshot actions for interacting with pages before capture. Supports click, type, hover, select_option, press_key, drag, wait, navigate, evaluate, fill_form, handle_dialog, file_upload, and resize actions aligned with Playwright API.
- 76ea4ca: Add `heroshot snippet [pattern]` command for generating markdown/HTML snippets for GitHub README and Wiki integration. Generates `<picture>` elements with `prefers-color-scheme` media queries for automatic light/dark mode support.

## 0.7.0

### Minor Changes

- 48be2ba: Add standalone binary distribution via Bun compile
  - Build standalone binaries for 5 platforms: linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64
  - Auto-detect system browsers (Chrome, Edge, Chromium) with fallback to Playwright's bundled Chromium
  - Binaries are built automatically on GitHub releases via the build-binaries workflow
  - No Node.js required to run the standalone binary

- 0b6ef74: Add --workers flag for parallel screenshot capture
  - Add `--workers <count>` CLI flag to run multiple capture workers concurrently
  - Speed up large screenshot collections at the cost of more system resources
  - Default is 1 (sequential capture, same as before)

- 1426b83: Refactor codebase into modular structure and improve CLI test coverage
  - Extract browser.ts into modular `src/browser/` folder
  - Extract CLI into modular `src/cli/` folder
  - Extract sync into modular `src/sync/` folder
  - Replace string-based page.evaluate with typed functions
  - Expand CLI test coverage (9 → 24 tests)
  - Remove dead CLI flags (`--omit-background`, `--timeout`) that were never wired through

## 0.6.1

### Patch Changes

- 1e8dfe3: Add `heroshot/virtual` TypeScript types for virtual module imports

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
