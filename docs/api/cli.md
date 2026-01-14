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

### `heroshot config`

Open browser to add/edit screenshot definitions.

```bash
heroshot config [options]
```

| Option    | Description                            |
| --------- | -------------------------------------- |
| `--reset` | Clear existing session and start fresh |
| `--only`  | Only run config, skip sync afterwards  |

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

### Get session key for CI

```bash
heroshot session-key
```
