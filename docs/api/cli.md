# CLI Reference

## Usage

```bash
heroshot [options] [command]
```

## Global Options

| Option                | Alias | Description                                                    |
| --------------------- | ----- | -------------------------------------------------------------- |
| `--version`           | `-V`  | Output the version number                                      |
| `--verbose`           | `-v`  | Show detailed output                                           |
| `--config <path>`     | `-c`  | Path to config file                                            |
| `--session-key <key>` | `-s`  | Session key for encrypted auth (or set `HEROSHOT_SESSION_KEY`) |
| `--help`              | `-h`  | Display help for command                                       |

## Commands

### `heroshot` (default)

Run heroshot. Behavior depends on the arguments:

- **With URL**: One-shot mode - capture screenshot directly
- **No config**: Opens the browser to create screenshots (same as `heroshot config`)
- **Config exists**: Captures all screenshots headlessly (sync mode)

```bash
heroshot                    # Auto-detect mode
heroshot -c custom.json     # Use custom config file
```

### `heroshot <url>` (one-shot mode)

Take a screenshot directly without config file. Perfect for quick captures or building your config from the command line.

**Two ways to build your screenshot config:**

1. **Visual mode** - Run `heroshot config` to open a browser, point-and-click to select elements, adjust settings visually
2. **CLI mode** - Use `heroshot <url> --save` to capture and add screenshots via command line

Both approaches write to the same `.heroshot/config.json` file. Use whichever fits your workflow - or mix them. The visual picker is great for exploring a page, while CLI mode is ideal for scripting or when you know exactly what you want.

```bash
heroshot https://example.com                          # Full page screenshot
heroshot https://example.com --selector "h1"          # Element screenshot
heroshot https://example.com --selector ".hero" -o hero.png
heroshot https://example.com --dark --mobile          # Dark mode, mobile viewport
heroshot https://example.com --both                   # Light + dark variants
```

| Option              | Description                          |
| ------------------- | ------------------------------------ |
| `--selector <sel>`  | CSS selector to capture (repeatable) |
| `-o, --output`      | Output filename                      |
| `-p, --padding`     | Padding around element in pixels     |
| `-w, --width`       | Viewport width                       |
| `-H, --height`      | Viewport height                      |
| `--mobile`          | Mobile viewport preset (375x667)     |
| `--tablet`          | Tablet viewport preset (768x1024)    |
| `--desktop`         | Desktop viewport preset (1280x800)   |
| `--dark`            | Force dark color scheme              |
| `--light`           | Force light color scheme             |
| `--both`            | Capture both light and dark variants |
| `--scale <n>`       | Device scale factor (1, 2, 3)        |
| `--retina`          | Shortcut for `--scale 2`             |
| `-q, --quality <n>` | JPEG quality (1-100), outputs JPEG   |
| `--omit-background` | Transparent background (PNG only)    |
| `--timeout <ms>`    | Timeout in milliseconds              |
| `--save`            | Save screenshot definition to config |

::: tip Config Defaults
When a config file exists, one-shot mode uses its defaults:

- `outputDirectory` - screenshots saved there
- `browser.deviceScaleFactor` - default scale
- `outputFormat` / `jpegQuality` - default format
  :::

::: tip Save for Later
Use `--save` to add the screenshot to your config for future syncs:

```bash
heroshot https://myapp.com --selector ".hero" --save
heroshot sync  # Now includes the saved screenshot
```

:::

### `heroshot config`

Open browser to add/edit screenshot definitions.

```bash
heroshot config [options]
```

| Option    | Description                                    |
| --------- | ---------------------------------------------- |
| `--reset` | Clear existing session and start fresh         |
| `--only`  | Only run config, skip sync afterwards          |
| `--light` | Force light mode (prefers-color-scheme: light) |
| `--dark`  | Force dark mode (prefers-color-scheme: dark)   |

::: tip Color Scheme
By default, heroshot captures **both** light and dark variants of each screenshot. Use `--light` or `--dark` to preview a specific theme during configuration.

The capture behavior is controlled by `browser.colorScheme` in your config:

- **undefined** (default): Captures both `-light` and `-dark` variants
- **auto**: Uses browser's color scheme preference
- **light** / **dark**: Captures single variant only
  :::

### `heroshot sync [pattern]`

Capture screenshots headlessly. Optionally filter by pattern.

```bash
heroshot sync               # Capture all screenshots
heroshot sync dashboard     # Capture screenshots matching "dashboard"
heroshot sync hero          # Matches: hero-light.png, homepage-hero.png, etc.
```

The pattern matches against:

- Screenshot **id**
- Screenshot **name**
- Screenshot **filename**

Matching is case-insensitive and uses substring matching. If multiple screenshots match, all are captured.

### `heroshot session-key`

Print the session key for this project (for CI setup).

```bash
heroshot session-key
```

## Examples

### Open configuration UI

```bash
heroshot config
```

### Run with verbose output

```bash
heroshot config -v
```

### Use custom config file

```bash
heroshot config -c ./custom-heroshot.json
```

### Sync specific screenshots

```bash
heroshot sync dashboard     # Only screenshots matching "dashboard"
heroshot sync -v hero       # Verbose output, matching "hero"
```

### Get session key for CI

```bash
heroshot session-key
```

### One-shot screenshots

```bash
# Quick full-page screenshot
heroshot https://example.com

# Capture specific element
heroshot https://example.com --selector ".hero-section"

# Mobile dark mode with padding
heroshot https://example.com --selector "nav" --mobile --dark -p 20

# Both color schemes, retina quality
heroshot https://example.com --both --retina -o homepage.png

# JPEG output with quality setting
heroshot https://example.com -q 85 -o photo.jpg

# Capture and save to config for future syncs
heroshot https://myapp.com --selector ".dashboard" --save
```
