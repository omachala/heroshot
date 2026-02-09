<p align="center">
  <a href="https://heroshot.sh">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/omachala/heroshot/refs/heads/main/docs/public/screenshots/hero-desktop-dark.png">
      <img src="https://raw.githubusercontent.com/omachala/heroshot/refs/heads/main/docs/public/screenshots/hero-desktop-light.png" alt="heroshot">
    </picture>
  </a>
</p>
<p align="center"><em>👆 This hero shot of <a href="https://heroshot.sh">heroshot.sh</a> is <a href="https://github.com/omachala/heroshot/blob/main/.github/workflows/update-screenshots.yml#L17">taken</a> by heroshot ⚡️</em></p>

<p align="center">
  <a href="https://www.npmjs.com/package/heroshot"><img src="https://img.shields.io/npm/dt/heroshot?style=for-the-badge" alt="npm downloads"></a>
  <a href="https://www.npmjs.com/package/heroshot"><img src="https://img.shields.io/npm/v/heroshot?style=for-the-badge&logo=npm" alt="npm version"></a>
  <a href="https://codecov.io/gh/omachala/heroshot"><img src="https://img.shields.io/codecov/c/github/omachala/heroshot?style=for-the-badge" alt="coverage"></a>
  <a href="https://sonarcloud.io/summary/new_code?id=omachala_heroshot"><img src="https://img.shields.io/sonar/quality_gate/omachala_heroshot?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud" alt="quality gate"></a>
  <a href="https://heroshot.sh"><img src="https://img.shields.io/badge/docs-heroshot.sh-blue?style=for-the-badge" alt="docs"></a>
</p>

<p align="center">❤️ If you like heroshot, I'd be grateful if you let your friends know — <a href="https://x.com/intent/tweet?url=https%3A%2F%2Fheroshot.sh">share on X</a> · <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fheroshot.sh">share on LinkedIn</a> · <a href="https://www.reddit.com/submit?url=https%3A%2F%2Fheroshot.sh&title=Heroshot%20%E2%80%93%20Define%20screenshots%20once%2C%20update%20them%20forever">share on Reddit</a></p>

Your app changes constantly. New features, design tweaks, bug fixes. Meanwhile, the screenshots in your README and docs quietly become lies.

The manual fix is tedious: open browser, navigate, log in, screenshot, crop, save, commit. Now do that for every image. Now do it again next month.

**Heroshot fixes this.** Define your screenshots once - point and click, no CSS selectors. Style them with the visual editor, add annotations to highlight what matters, and regenerate everything with one command.

```bash
npx heroshot
```

First run opens a browser with a visual editor. Pick elements, adjust padding, style borders, edit text, and add annotations (arrows, rectangles, callouts). Screenshots land in `heroshots/`, config saves to `.heroshot/config.json`. Next run regenerates everything headlessly.

https://github.com/user-attachments/assets/1636d404-1e5f-4151-9aba-d5676ed3ff2a

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

## One Screenshot - All Variants

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

## Learn More

|                     |                                                                       |
| ------------------- | --------------------------------------------------------------------- |
| **Documentation**   | [heroshot.sh](https://heroshot.sh)                                    |
| **Getting Started** | [Quick start guide](https://heroshot.sh/docs/getting-started)         |
| **Configuration**   | [Config options](https://heroshot.sh/docs/config)                     |
| **CI/CD Setup**     | [Automated updates](https://heroshot.sh/docs/guide/automated-updates) |
| **CLI Reference**   | [All commands & flags](https://heroshot.sh/docs/cli)                  |

## Support the Project

Your suggestions and feedback are highly appreciated. Please feel free to [start a discussion](https://github.com/omachala/heroshot/discussions) or [create an issue](https://github.com/omachala/heroshot/issues) to share your experience with the tool or to discuss a feature/issue.

If you find heroshot useful, saves you a lot of work, and lets you sleep much better, then consider supporting the project by any of the following means:

- **Star the repo** — it helps others discover heroshot
- **Spread the word** — share the project on social media or with friends
- **Report bugs or propose solutions** — open an [issue](https://github.com/omachala/heroshot/issues) or [pull request](https://github.com/omachala/heroshot/pulls)

## License

MIT
