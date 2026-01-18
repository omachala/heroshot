# Docusaurus

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/docusaurus) - a minimal setup you can clone and run.

[Docusaurus](https://docusaurus.io/) is Meta's documentation framework, and it's everywhere in the open source world. If you're using it, you probably already know it's React-based and uses MDX - which gives you some nice options for displaying screenshots.

## The Magic: One Component, All Variants

Here's the thing about screenshots in docs - you end up with a lot of them. Light mode, dark mode, desktop, tablet, mobile... suddenly one screenshot becomes six files to manage.

The `<Heroshot>` component handles all of this for you:

```mdx
<Screenshot name="Dashboard" alt="Dashboard overview" />
```

That's it. One line. The component automatically:

- Shows the dark screenshot when someone toggles dark mode
- Serves responsive `srcset` for different viewport sizes
- Switches instantly - no page reload

Your MDX stays clean. Six image variants, one line of code.

### Setting It Up

First, add the heroshot plugin to your Docusaurus config:

```js
// docusaurus.config.js
const { heroshot } = require('heroshot/plugins/docusaurus');

module.exports = {
  plugins: [heroshot()],
  // ... rest of your config
};
```

Then create a simple wrapper component:

```tsx
// src/components/Screenshot.tsx
import { Heroshot } from 'heroshot/docusaurus';
import manifest from '@heroshot/manifest';

export function Screenshot(props: { name?: string; id?: string; alt?: string }) {
  return <Heroshot {...props} manifest={manifest} />;
}
```

Now use it anywhere in your MDX:

```mdx
import { Screenshot } from '@site/src/components/Screenshot';

<Screenshot name="Dashboard" alt="Dashboard overview" />
```

One line, and you get automatic dark/light switching plus responsive images.

::: tip Without the plugin
If you prefer not to use the plugin, you can import the manifest directly from your heroshots folder:

```tsx
import manifest from '@site/heroshots/manifest.json';
```

:::

## Getting Started

Navigate to your project root and run:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Docusaurus dev server (`npm start`), then navigate to it in the heroshot browser, click on elements you want to capture, and close when done. Heroshot saves a config and outputs screenshots wherever you specify.

## Where to Put Screenshots

Docusaurus serves static files from the `static/` folder. Most people put images in `static/img/`, so I'd suggest `static/img/screenshots/` for heroshot output:

```
my-website/
├── docs/
│   └── intro.md
├── src/
│   └── components/
├── static/
│   └── img/
│       └── screenshots/    # heroshot outputs here
├── docusaurus.config.js
└── package.json
```

Set your output directory to the static folder:

```json
{
  "outputDirectory": "static/img/screenshots",
  "screenshots": [...]
}
```

Then start your Docusaurus dev server and run heroshot:

```bash
# Terminal 1
npm start

# Terminal 2
npx heroshot
```

Navigate to `http://localhost:3000`, click on what you want to capture, done.

## Using Screenshots

If you've set up the `<Screenshot>` wrapper (you should!), just use that:

```mdx
import { Screenshot } from '@site/src/components/Screenshot';

<Screenshot name="Dashboard" alt="Dashboard overview" />
```

For simple cases without variants, plain markdown works fine:

```md
![Feature overview](/img/screenshots/feature.png)
```

Since you're in MDX land, you can also do stuff like:

```mdx
<img src="/img/screenshots/feature.png" alt="Feature overview" style={{ maxWidth: '600px' }} />
```

## Light & Dark Mode

Docusaurus has dark mode built in, and heroshot can capture both variants automatically. Just set **Color Scheme** to "Both" in the toolbar, and you'll get `name-light.png` and `name-dark.png`.

If you're using the `<Heroshot>` component, it handles theme switching automatically. When someone toggles dark mode, the screenshot switches instantly.

### Using ThemedImage

Docusaurus also has a built-in `ThemedImage` component that works well with heroshot's `colorScheme: "both"` setting:

```mdx
import ThemedImage from '@theme/ThemedImage';

<ThemedImage
  alt="Dashboard"
  sources={{
    light: '/img/screenshots/dashboard-light.png',
    dark: '/img/screenshots/dashboard-dark.png',
  }}
/>
```

Just set color scheme to "Both" in heroshot, and you get `-light.png` and `-dark.png` variants automatically.

## Viewport Variants

If you want to show desktop, tablet, and mobile versions, heroshot can generate all three from a single config entry:

```json
{
  "screenshots": [
    {
      "name": "hero",
      "url": "http://localhost:3000",
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

```mdx
<Screenshot name="hero" alt="Hero section" />
```

That's it. The component figures out which variants exist and builds the srcset for you.

### Using Tabs

If you want to show all variants explicitly, Docusaurus Tabs work great:

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="desktop" label="Desktop" default>
    <img src="/img/screenshots/hero-desktop.png" alt="Desktop view" />
  </TabItem>
  <TabItem value="tablet" label="Tablet">
    <img src="/img/screenshots/hero-tablet.png" alt="Tablet view" />
  </TabItem>
  <TabItem value="mobile" label="Mobile">
    <img src="/img/screenshots/hero-mobile.png" alt="Mobile view" />
  </TabItem>
</Tabs>
```

## Automating in CI

Here's a GitHub Action that keeps screenshots updated:

```yaml
# .github/workflows/screenshots.yml
name: Update Screenshots

on:
  workflow_dispatch:

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - run: npm ci

      - name: Build and serve
        run: |
          npm run build
          npx serve build -l 3000 &
          sleep 3
          npx heroshot
          kill %1

      - name: Commit screenshots
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add static/img/screenshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots"
          git push
```

## Versioned Docs

Docusaurus supports versioned documentation. The nice thing is your screenshots in `static/` are shared across versions by default.

If you need different screenshots per version (say, your UI changed significantly), you can organize by folder:

```
static/
└── img/
    └── screenshots/
        ├── current/
        ├── 2.0.0/
        └── 1.0.0/
```

## i18n

For translated docs with localized screenshots, organize by locale:

```
static/
└── img/
    └── screenshots/
        ├── en/
        └── de/
```

Then reference the right one in each translation:

```md
<!-- docs/intro.md (English) -->

![Feature](/img/screenshots/en/feature.png)

<!-- i18n/de/docusaurus-plugin-content-docs/current/intro.md (German) -->

![Feature](/img/screenshots/de/feature.png)
```
