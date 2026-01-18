<p align="center">
  <img src="https://github.com/omachala/heroshot/blob/main/assets/logo.svg?raw=true" alt="heroshot logo" height="80">
</p>

<h1 align="center">heroshot</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/heroshot"><img src="https://img.shields.io/npm/v/heroshot?style=for-the-badge&logo=npm" alt="npm version"></a>
  <a href="https://github.com/omachala/heroshot/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/heroshot?style=for-the-badge" alt="license"></a>
  <a href="https://codecov.io/gh/omachala/heroshot"><img src="https://img.shields.io/codecov/c/github/omachala/heroshot?style=for-the-badge" alt="coverage"></a>
  <a href="https://sonarcloud.io/summary/new_code?id=omachala_heroshot"><img src="https://img.shields.io/sonar/quality_gate/omachala_heroshot?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud" alt="quality gate"></a>
  <a href="https://heroshot.sh"><img src="https://img.shields.io/badge/docs-heroshot.sh-blue?style=for-the-badge" alt="docs"></a>
</p>

Your app changes constantly. New features, design tweaks, bug fixes. Meanwhile, the screenshots in your README and docs quietly become lies.

The manual fix is tedious: open browser, navigate, log in, screenshot, crop, save, commit. Now do that for every image. Now do it again next month.

**Heroshot fixes this.** Define your screenshots once - point and click, no CSS selectors - and regenerate them with one command whenever you need.

<table align="center">
  <tr>
    <th></th>
    <th>Light</th>
    <th>Dark</th>
  </tr>
  <tr>
    <th>Desktop</th>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-desktop-light.png?raw=true" alt="Desktop Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-desktop-dark.png?raw=true" alt="Desktop Dark"></td>
  </tr>
  <tr>
    <th>Tablet</th>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-tablet-light.png?raw=true" alt="Tablet Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-tablet-dark.png?raw=true" alt="Tablet Dark"></td>
  </tr>
  <tr>
    <th>Mobile</th>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-mobile-light.png?raw=true" alt="Mobile Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-mobile-dark.png?raw=true" alt="Mobile Dark"></td>
  </tr>
</table>

<p align="center"><em>6 screenshots from one config entry - always in sync with the live site.</em></p>

## Get Started

```bash
npx heroshot
```

First run opens a browser with a visual picker. Click what you want, name it, done. Screenshots land in `heroshots/`, config saves to `.heroshot/config.json`. Next run regenerates everything headlessly.

## Use in Your Docs

**VitePress**

```bash
npm install heroshot
```

```ts
// .vitepress/config.ts
import { heroshot } from 'heroshot/plugins/vite';
export default defineConfig({ vite: { plugins: [heroshot()] } });
```

```vue
<Heroshot name="dashboard" alt="Dashboard" />
```

**Docusaurus**

```bash
npm install heroshot
```

```js
// docusaurus.config.js
plugins: [['heroshot/plugins/docusaurus', {}]];
```

```mdx
import { Heroshot } from 'heroshot/docusaurus';
<Heroshot name="dashboard" alt="Dashboard" />
```

**MkDocs**

```bash
pip install heroshot
```

```yaml
# mkdocs.yml
plugins:
  - macros:
      modules: [heroshot]
```

```jinja
{{ heroshot("dashboard", "Dashboard overview") }}
```

One component/macro, all variants - light/dark mode switches automatically, responsive sizes via srcset.

## Automated Updates

Keep screenshots always current by running heroshot in CI. Quick setup:

```bash
# Get your session key (for authenticated sites)
npx heroshot session-key

# Add to GitHub secrets
gh secret set HEROSHOT_SESSION_KEY
```

Then create `.github/workflows/heroshot.yml`:

```yaml
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
          node-version: 20
      - run: npx heroshot
        env:
          HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add heroshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots" && git push
```

Go to Actions → Update Screenshots → Run workflow. Done.

For more options (scheduled runs, PR creation, debugging), see the [full CI guide](https://heroshot.sh/docs/guide/automated-updates).

## Learn More

**Docs:** [heroshot.sh](https://heroshot.sh)

**Status:** Early alpha. [See releases](https://github.com/omachala/heroshot/releases) for current version.

## License

MIT
