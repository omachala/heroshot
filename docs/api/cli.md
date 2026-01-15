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

Run heroshot. Behavior depends on whether a config file exists:

- **No config**: Opens the browser to create screenshots (same as `heroshot config`)
- **Config exists**: Captures all screenshots headlessly (sync mode)

```bash
heroshot                    # Auto-detect mode
heroshot -c custom.json     # Use custom config file
```

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
