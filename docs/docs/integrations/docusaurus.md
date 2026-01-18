# Docusaurus

[Docusaurus](https://docusaurus.io/) is Meta's documentation framework, and it's everywhere in the open source world. If you're using it, you probably already know it's React-based and uses MDX - which gives you some nice options for displaying screenshots.

## The Entry Point

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

## Getting Started

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

Plain markdown works fine:

```md
![Feature overview](/img/screenshots/feature.png)
```

But since you're in MDX land, you can also do stuff like:

```mdx
<img src="/img/screenshots/feature.png" alt="Feature overview" style={{ maxWidth: '600px' }} />
```

Or import for webpack's asset handling:

```mdx
import featureImg from '@site/static/img/screenshots/feature.png';

<img src={featureImg} alt="Feature overview" />
```

## Light & Dark Mode

Docusaurus has a really nice built-in component for this called `ThemedImage`. It pairs perfectly with heroshot's `colorScheme: "both"` setting:

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

## Viewport Variants with Tabs

Docusaurus Tabs are great for showing responsive variants:

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

## Ideal Image Plugin

If you want responsive image optimization, Docusaurus has a plugin for that:

```bash
npm install @docusaurus/plugin-ideal-image
```

```js
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 85,
        max: 1280,
        min: 640,
        steps: 4,
      },
    ],
  ],
};
```

Then you'd use it like:

```mdx
import Image from '@theme/IdealImage';
import screenshot from '@site/static/img/screenshots/dashboard.png';

<Image img={screenshot} />
```

Honestly though, for most docs this is overkill. Plain `![](path)` works fine.

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
