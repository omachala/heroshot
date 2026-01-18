# VitePress

[VitePress](https://vitepress.dev/) is what I use for this very documentation site, so it's the integration I know best. If you're using VitePress, you're in good company - it's a great choice for docs.

## The Magic: One Component, All Variants

Here's the thing about screenshots in docs - you end up with a lot of them. Light mode, dark mode, desktop, tablet, mobile... suddenly one screenshot becomes six files to manage.

The `<Heroshot>` component handles all of this for you:

```md
<Heroshot name="Dashboard" alt="Dashboard overview" />
```

That's it. One line. The component automatically:

- Shows the dark screenshot when someone toggles dark mode
- Serves responsive `srcset` for different viewport sizes
- Switches instantly - no page reload

Your markdown stays clean. Six image variants, one line of code.

### Setting It Up

Two quick steps. First, add the heroshot plugin to your VitePress config:

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress';
import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  vite: {
    plugins: [heroshot()],
  },
});
```

Then register the component in your theme:

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { Heroshot, setManifest } from 'heroshot/vitepress';
import manifest from 'virtual:heroshot-manifest';

setManifest(manifest);

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Heroshot', Heroshot);
  },
} satisfies Theme;
```

Now you can use `<Heroshot>` anywhere in your markdown:

```md
<!-- By name (from the toolbar) -->
<Heroshot name="Dashboard" alt="Dashboard overview" />

<!-- Or by ID (from config.json) -->
<Heroshot id="abc123" alt="Dashboard overview" />
```

::: tip TypeScript support
Add `"heroshot/virtual"` to your `tsconfig.json` types to get autocomplete for the virtual module:

```json
{
  "compilerOptions": {
    "types": ["heroshot/virtual"]
  }
}
```

:::

## Getting Started

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

Point heroshot at your public folder. You can do this when you first run `npx heroshot` - just go to Settings and set the output directory to `public/screenshots/`.

Or edit `.heroshot/config.json` directly:

```json
{
  "outputDirectory": "docs/public/screenshots",
  "screenshots": [...]
}
```

::: tip
If your VitePress site lives in a subdirectory (like `docs/`), use the full path: `docs/public/screenshots/`
:::

## Using Screenshots in Markdown

If you've set up the `<Heroshot>` component (you should!), just use that:

```md
<Heroshot name="Dashboard" alt="Dashboard overview" />
```

For simple cases without variants, standard markdown works fine:

```md
![Dashboard overview](/screenshots/dashboard.png)
```

## Light & Dark Mode

VitePress has dark mode built in, and heroshot can capture both variants automatically. Just set **Color Scheme** to "Both" in the toolbar, and you'll get `name-light.png` and `name-dark.png`.

If you're using the `<Heroshot>` component, it handles theme switching automatically. When someone toggles dark mode, the screenshot switches instantly.

### Manual Approach

If you prefer more control, you can use a `<picture>` element:

```md
<picture>
  <source srcset="/screenshots/dashboard-dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/screenshots/dashboard-light.png" alt="Dashboard" />
</picture>
```

Or use CSS classes. First, add this to your custom styles (`.vitepress/theme/style.css`):

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

If you're using the `<Heroshot>` component, it automatically generates a `srcset` for all viewport variants. The browser picks the best size - mobile users download smaller images, desktop users get the full resolution:

```md
<Heroshot name="hero" alt="Hero section" />
```

That's it. The component figures out which variants exist and builds the srcset for you.

### Manual Display

If you want to show all variants side by side (like for a showcase), use a table:

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

This documentation site uses heroshot to capture its own screenshots. You can check out the [actual config](https://github.com/omachala/heroshot/blob/main/docs/.heroshot/config.json) to see how it's set up.
