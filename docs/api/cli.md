# CLI Reference

## Usage

```bash
heroshot <url> [options]
```

## Arguments

| Argument | Description                       |
| -------- | --------------------------------- |
| `url`    | The URL of the page to screenshot |

## Options

| Option       | Alias | Description                   | Default          |
| ------------ | ----- | ----------------------------- | ---------------- |
| `--output`   | `-o`  | Output file path              | `screenshot.png` |
| `--width`    | `-w`  | Viewport width                | `1280`           |
| `--height`   | `-h`  | Viewport height               | `720`            |
| `--wait`     |       | Wait time before capture (ms) | `0`              |
| `--selector` | `-s`  | CSS selector to capture       |                  |
| `--padding`  | `-p`  | Padding around element        | `0`              |

## Examples

### Basic screenshot

```bash
heroshot https://example.com
```

### Custom output path

```bash
heroshot https://example.com -o ./screenshots/example.png
```

### Specific element

```bash
heroshot https://example.com -s ".hero-section"
```

### With padding

```bash
heroshot https://example.com -s ".button" -p 20
```
