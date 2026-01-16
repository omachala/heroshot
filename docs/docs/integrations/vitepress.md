# VitePress

[VitePress](https://vitepress.dev/) is what I use for this very documentation site, so it's the integration I know best. If you're using VitePress, you're in good company - it's a great choice for docs.

## The Entry Point

Navigate to your project root and run:

```bash
npx heroshot
```

This opens a browser with the visual picker. Navigate to your VitePress dev server (or any URL), click on elements you want to capture, and close the browser when done. Heroshot saves a config file and outputs screenshots wherever you specify.

## Where to Put Screenshots

VitePress serves anything in `public/` at the root URL. So if you put screenshots in `public/screenshots/`, you can reference them as `/screenshots/whatever.png` in your markdown.

Here's a typical setup:

```
my-docs/
├── .vitepress/
│   └── config.ts
├── public/
│   └── screenshots/      # heroshot outputs here
├── guide/
│   └── getting-started.md
└── package.json
```

## Getting Started

First, point heroshot at your public folder. You can do this when you first run `npx heroshot` - just go to Settings and set the output directory to `public/screenshots/`.

Or if you prefer, edit `.heroshot/config.json` directly:

```json
{
  "outputDirectory": "docs/public/screenshots",
  "screenshots": [...]
}
```

::: tip
If your VitePress site lives in a subdirectory (like `docs/`), use the full path: `docs/public/screenshots/`
:::

Then just run heroshot, navigate to your dev server, click on stuff you want to capture, and you're done:

```bash
npx heroshot
```

## Using Screenshots in Markdown

Nothing fancy here - just standard markdown:

```md
![Dashboard overview](/screenshots/dashboard.png)
```

Or if you need more control:

```md
<img src="/screenshots/dashboard.png" alt="Dashboard overview" />
```

## Light & Dark Mode

VitePress has dark mode built in, and heroshot can capture both variants automatically. Just set **Color Scheme** to "Both" in the toolbar, and you'll get `name-light.png` and `name-dark.png`.

To show the right one based on user preference, you can use a `<picture>` element:

```md
<picture>
  <source srcset="/screenshots/dashboard-dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/screenshots/dashboard-light.png" alt="Dashboard" />
</picture>
```

Or if you want something simpler, add some CSS classes. First, add this to your custom styles (`.vitepress/theme/style.css`):

```css
.dark .light-only {
  display: none;
}

:not(.dark) .dark-only {
  display: none;
}
```

Then use them in markdown:

```md
<img src="/screenshots/hero-light.png" class="light-only" alt="Hero" />
<img src="/screenshots/hero-dark.png" class="dark-only" alt="Hero" />
```

## Viewport Variants

If you want to show desktop, tablet, and mobile versions, heroshot can generate all three from a single config entry:

```json
{
  "screenshots": [
    {
      "name": "hero",
      "url": "http://localhost:5173",
      "selector": ".hero",
      "viewports": ["desktop", "tablet", "mobile"]
    }
  ]
}
```

This gives you:

- `hero-desktop.png` (1280px)
- `hero-tablet.png` (768px)
- `hero-mobile.png` (375px)

You can display them in a simple table:

```md
| Desktop                                   | Tablet                                  | Mobile                                  |
| ----------------------------------------- | --------------------------------------- | --------------------------------------- |
| ![Desktop](/screenshots/hero-desktop.png) | ![Tablet](/screenshots/hero-tablet.png) | ![Mobile](/screenshots/hero-mobile.png) |
```

## Keeping Screenshots Fresh

During development, I usually have two terminals open:

```bash
# Terminal 1: VitePress dev server
pnpm docs:dev

# Terminal 2: Run whenever I need to update screenshots
npx heroshot
```

For CI, here's a GitHub Action that updates screenshots automatically:

```yaml
# .github/workflows/update-screenshots.yml
name: Update Screenshots

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Update screenshots
        run: npx heroshot

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/screenshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots"
          git push
```

## Real-World Example

This documentation site uses heroshot to capture its own screenshots. You can check out the [actual config](https://github.com/omachala/heroshot/blob/main/.heroshot/config.json) to see how it's set up.
