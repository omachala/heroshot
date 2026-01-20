---
description: Heroshot CLI reference. Commands, options, and flags for screenshot automation from the command line.
---

# CLI Reference

Everything you can do from the command line. Most of the time you'll just run `npx heroshot` and let it figure out what to do - but when you need more control, here's what's available.

```bash
heroshot [options] [command]
```

## Global Options

These work with any command:

| Option                | Alias | Description                                                    |
| --------------------- | ----- | -------------------------------------------------------------- |
| `--version`           | `-V`  | Output the version number                                      |
| `--verbose`           | `-v`  | Show detailed output                                           |
| `--config <path>`     | `-c`  | Path to config file                                            |
| `--session-key <key>` | `-s`  | Session key for encrypted auth (or set `HEROSHOT_SESSION_KEY`) |
| `--help`              | `-h`  | Display help for command                                       |

## Commands

### `heroshot` (default)

The smart default. Heroshot looks at what you have and does the right thing:

- **Pass a URL** → One-shot mode: captures that page immediately
- **No config file yet** → Opens the visual picker so you can define screenshots
- **Config exists** → Runs headlessly, regenerates all your screenshots

This means your workflow is usually just `npx heroshot` over and over. First time it helps you set up, after that it syncs.

```bash
heroshot                    # Auto-detect mode
heroshot -c custom.json     # Use custom config file
```

### `heroshot <url>` (one-shot mode)

**The fastest way to capture a screenshot.** Just pass a URL:

```bash
heroshot https://example.com
heroshot https://example.com -o screenshot.png
heroshot https://example.com --selector ".hero" -o hero.png
```

One-shot mode captures immediately without touching your config. By default it captures **light mode only** - use `--light --dark` together to capture both variants.

Add `--save` to any one-shot command and it gets added to your config for future syncs.

**Two ways to build your screenshot collection:**

1. **Visual picker** - Run `heroshot config`, point and click, adjust settings visually
2. **CLI** - Run `heroshot <url> --save` to capture and add in one step

Both write to the same `.heroshot/config.json`. Mix and match - visual picker for exploring, CLI for scripting or when you know exactly what you want.

```bash
heroshot https://example.com                          # Full page, light mode
heroshot https://example.com --selector "h1"          # Element screenshot
heroshot https://example.com --selector ".hero" -o hero.png
heroshot https://example.com --dark --mobile          # Dark mode, mobile viewport
heroshot https://example.com --light --dark           # Both light + dark variants
```

#### What to capture

By default you get the full page. But usually you want a specific element - a hero section, a card, a form. That's what `--selector` is for.

| Option             | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| `--selector <sel>` | CSS selector for the element to capture. Omit for full-page screenshot. |
| `-p, --padding`    | Add breathing room around the element (in pixels). Great for context.   |
| `-o, --output`     | Output filename. Auto-generated from URL if not specified.              |
| `--save`           | Add this screenshot to your config for future runs.                     |

#### Viewport size

Need a mobile screenshot? Tablet? The presets handle common sizes, or go custom with exact pixels.

| Option         | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| `--mobile`     | Phone-sized viewport (375x667) - perfect for mobile screenshots |
| `--tablet`     | Tablet viewport (768x1024) - great for responsive layouts       |
| `--desktop`    | Desktop viewport (1280x800) - the default if nothing specified  |
| `-w, --width`  | Custom viewport width in pixels                                 |
| `-H, --height` | Custom viewport height in pixels                                |

#### Color scheme

If your site respects `prefers-color-scheme`, you can capture light, dark, or both variants.

| Option    | Description              |
| --------- | ------------------------ |
| `--light` | Force light color scheme |
| `--dark`  | Force dark color scheme  |

**One-shot mode** defaults to light-only. Use `--light --dark` together to capture both variants, outputting `filename-light.png` and `filename-dark.png`.

#### Image quality

For crisp screenshots on retina displays, bump the scale. For smaller files, use JPEG.

| Option              | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `--scale <n>`       | Device scale factor (1, 2, or 3). Use 2 for retina-quality images |
| `--retina`          | Shortcut for `--scale 2`                                          |
| `-q, --quality <n>` | Output as JPEG with given quality (1-100). Smaller files than PNG |
| `--omit-background` | Transparent background (PNG only). Useful for element cutouts     |
| `--viewport-only`   | Capture only the viewport, not the full scrollable page           |

#### Other options

| Option           | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `--timeout <ms>` | How long to wait for the page to load (default: 30000ms) |

::: tip Using Config Defaults
If you have a `.heroshot/config.json`, one-shot mode automatically uses your saved defaults for output directory, scale factor, and image format. CLI flags override these when specified.
:::

::: tip Building Config from CLI
Use `--save` to build your screenshot collection from the command line:

```bash
# Capture and save to config
heroshot https://myapp.com --selector ".hero" --mobile --save
heroshot https://myapp.com/pricing --selector ".plans" --save

# Later, regenerate all saved screenshots
heroshot
```

:::

### `heroshot config`

Opens the visual picker - a browser where you point and click to define screenshots. Use this when you want to add new screenshots, remove old ones, or tweak selectors visually.

```bash
heroshot config [options]
```

| Option    | Description                            |
| --------- | -------------------------------------- |
| `--reset` | Clear existing session and start fresh |
| `--only`  | Only run config, skip sync afterwards  |

#### Color scheme preview

| Option    | Description                                    |
| --------- | ---------------------------------------------- |
| `--light` | Force light mode (prefers-color-scheme: light) |
| `--dark`  | Force dark mode (prefers-color-scheme: dark)   |

::: tip Color Scheme
By default, heroshot captures **both** light and dark variants of each screenshot. Use `--light` or `--dark` to preview a specific theme during configuration.

The capture behavior is controlled by `browser.colorScheme` in your config:

- **undefined** (default): Captures both `-light` and `-dark` variants
- **light** / **dark**: Captures single variant only
  :::

### `heroshot [pattern]`

When you have a config, running `heroshot` regenerates all your screenshots headlessly - no browser window, just captures and saves. This is what you run in CI or whenever your app changes.

```bash
heroshot                    # Capture all screenshots
heroshot dashboard          # Capture screenshots matching "dashboard"
heroshot hero               # Matches: hero-light.png, homepage-hero.png, etc.
heroshot --clean            # Capture all and delete stale files
```

| Option    | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `--clean` | Delete stale files from output directory (only works without pattern) |

The pattern matches against:

- Screenshot **id**
- Screenshot **name**
- Generated **filename**

Matching is case-insensitive and uses substring matching. If multiple screenshots match, all are captured.

::: tip Cleaning Stale Files
When you rename or delete screenshots, old files may remain in your output directory. Use `--clean` to automatically remove them:

```bash
heroshot --clean
```

This compares existing files against what would be generated and deletes any extras. Only works when syncing all screenshots (no pattern filter).
:::

### `heroshot session-key`

When you log into a site during `heroshot config`, that session is saved encrypted. The encryption key is machine-specific by default, which is fine for local use.

For CI, you need to export that key so the CI runner can decrypt your session:

```bash
heroshot session-key
```

This prints a key you can add to your CI secrets as `HEROSHOT_SESSION_KEY`. See [Automated Updates](/docs/guide/automated-updates) for the full CI setup.

## Examples

Here's a quick reference for common tasks:

```bash
# Open the visual picker to define/edit screenshots
heroshot config

# Regenerate all screenshots
heroshot

# Only regenerate screenshots matching "dashboard"
heroshot dashboard

# Regenerate and clean up stale files
heroshot --clean

# Quick one-off screenshot (doesn't touch config)
heroshot https://example.com
heroshot https://example.com --selector ".hero-section"

# Mobile + dark mode + padding
heroshot https://example.com --selector "nav" --mobile --dark -p 20

# Capture light and dark variants, retina quality
heroshot https://example.com --light --dark --retina -o homepage.png

# JPEG for smaller file size
heroshot https://example.com -q 85 -o photo.jpg

# Capture AND save to config for future runs
heroshot https://myapp.com --selector ".dashboard" --save

# Get session key for CI
heroshot session-key

# Verbose output (works with any command)
heroshot -v
heroshot config -v
```
