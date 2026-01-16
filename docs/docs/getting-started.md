# Getting Started

## Quick Start

No installation needed. Just run:

```bash
npx heroshot
```

On **first run**, this opens an interactive browser where you can:

1. Navigate to any URL
2. Click on elements you want to screenshot
3. Name your screenshots and adjust settings
4. Close the browser when done

Your screenshots are saved to `heroshots/` and a `.heroshot/config.json` is created automatically.

## Updating Screenshots

On **subsequent runs**, just run the same command:

```bash
npx heroshot
```

This regenerates all your screenshots based on the saved config. No browser opens - it runs headlessly and updates all images.

## Reconfiguring

Want to add new screenshots or modify existing ones? Run:

```bash
npx heroshot config
```

This opens the interactive browser again so you can:

- Add new screenshots
- Remove existing ones
- Change selectors or settings

## Output

Screenshots are saved to `heroshots/` by default. The config file at `.heroshot/config.json` tracks:

- URLs and element selectors
- Output filenames
- Screenshot settings (padding, format, etc.)

Both folders are safe to commit to your repository.

## Next Steps

- Set up [Automated Updates](/docs/guide/automated-updates) in CI
- Learn about the [CLI options](/docs/cli)
