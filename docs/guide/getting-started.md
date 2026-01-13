# Getting Started

## Installation

```bash
npm install -g heroshot
```

Or with pnpm:

```bash
pnpm add -g heroshot
```

## Quick Start

Capture a screenshot of any webpage:

```bash
heroshot https://example.com
```

This opens an interactive browser where you can:

1. Click on any element to select it
2. Use the toolbar to adjust padding and settings
3. Press capture to save the screenshot

## Basic Usage

```bash
# Screenshot full page
heroshot https://example.com

# Screenshot with custom output
heroshot https://example.com -o screenshot.png

# Screenshot specific viewport
heroshot https://example.com --width 1280 --height 720
```

## Next Steps

- Learn about the [CLI options](/api/cli)
- Explore the element picker toolbar
