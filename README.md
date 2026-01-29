<p align="center">
  <a href="https://heroshot.sh">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/omachala/heroshot/refs/heads/main/docs/public/screenshots/hero-desktop-dark.png">
      <img src="https://raw.githubusercontent.com/omachala/heroshot/refs/heads/main/docs/public/screenshots/hero-desktop-light.png" alt="heroshot">
    </picture>
  </a>
</p>

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

```bash
npx heroshot
```

First run opens a browser with a visual picker. Click what you want, name it, done. Screenshots land in `heroshots/`, config saves to `.heroshot/config.json`. Next run regenerates everything headlessly.

<table align="center">
  <tr>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-desktop-light.png?raw=true" alt="Desktop Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-desktop-dark.png?raw=true" alt="Desktop Dark"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-tablet-light.png?raw=true" alt="Tablet Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-tablet-dark.png?raw=true" alt="Tablet Dark"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-mobile-light.png?raw=true" alt="Mobile Light"></td>
    <td><img src="https://github.com/omachala/heroshot/blob/main/docs/public/screenshots/hero-mobile-dark.png?raw=true" alt="Mobile Dark"></td>
  </tr>
</table>

<p align="center"><em>6 screenshots from one config entry - always in sync with the live site.</em></p>

## Use in Your Docs

**VitePress** · [Full guide](https://heroshot.sh/docs/integrations/vitepress)

```ts
// .vitepress/config.ts
import { heroshot } from 'heroshot/plugins/vite';
export default defineConfig({ vite: { plugins: [heroshot()] } });
```

```vue
<script setup>
import { Heroshot } from 'heroshot/vue';
</script>

<Heroshot name="dashboard" alt="Dashboard" />
```

**Docusaurus** · [Full guide](https://heroshot.sh/docs/integrations/docusaurus)

```js
// docusaurus.config.js
plugins: [['heroshot/plugins/docusaurus', {}]];
```

```tsx
import { Heroshot } from 'heroshot/docusaurus';
<Heroshot name="dashboard" alt="Dashboard" />;
```

**MkDocs** · [Full guide](https://heroshot.sh/docs/integrations/mkdocs)

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

## Learn More

|                     |                                                                       |
| ------------------- | --------------------------------------------------------------------- |
| **Documentation**   | [heroshot.sh](https://heroshot.sh)                                    |
| **Getting Started** | [Quick start guide](https://heroshot.sh/docs/getting-started)         |
| **Configuration**   | [Config options](https://heroshot.sh/docs/config)                     |
| **CI/CD Setup**     | [Automated updates](https://heroshot.sh/docs/guide/automated-updates) |
| **CLI Reference**   | [All commands & flags](https://heroshot.sh/docs/cli)                  |

## Contributing

This is a community project aiming to solve screenshot automation end-to-end and any feedback is valuable. Open an [issue](https://github.com/omachala/heroshot/issues) for bugs, questions, or feature requests. Pull requests are more than welcome.

If you like it, give the repo a ⭐

## License

MIT
