<p align="center">
  <img src="https://github.com/omachala/heroshot/blob/main/assets/logo.svg?raw=true" alt="heroshot logo" height="80">
</p>

<h1 align="center">heroshot</h1>

<p align="center">
  <strong>Screenshots that stay true.</strong><br>
  Your UI evolves. Heroshot keeps your docs and marketing in sync - automatically.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/heroshot"><img src="https://img.shields.io/npm/v/heroshot" alt="npm"></a>
  <a href="https://heroshot.sh"><img src="https://img.shields.io/badge/docs-heroshot.sh-blue" alt="docs"></a>
</p>

<p align="center">
  <img src="https://github.com/omachala/heroshot/blob/main/toolbar/tests/snapshots/manage-screenshots.test.ts/after-rename.png?raw=true" alt="heroshot toolbar demo" width="800">
</p>

## Get Started

```bash
npx heroshot
```

**First run** opens an interactive browser:

1. Navigate to any URL
2. Click on elements you want to screenshot
3. Name your screenshots and adjust settings
4. Close the browser when done

**Subsequent runs** regenerate all screenshots headlessly:

```bash
npx heroshot
```

**Reconfigure** anytime by running:

```bash
npx heroshot config
```

## Why heroshot?

Heroshot automates **documentation screenshots** - not visual regression testing. Define once, generate everywhere.

**The math:** 3 components × 5 pages × 3 viewports × 2 color schemes = **90 screenshots** from one config.

- **Visual picker** - Point and click to select elements, no DevTools needed
- **Viewport variants** - Desktop, tablet, mobile from a single definition
- **Light & Dark mode** - Both color schemes captured automatically
- **Pixel-perfect** - Element-precise capture with masked padding
- **One command** - Regenerate all screenshots when your UI changes
- **CI ready** - Automate updates with encrypted session support

## Automated Updates

Run heroshot in CI to keep screenshots always current. See the [full guide](https://heroshot.sh/guide/automated-updates).

**Quick setup:**

1. Get your session key: `npx heroshot session-key`
2. Add as GitHub secret: `gh secret set HEROSHOT_SESSION_KEY`
3. Create workflow:

```yaml
# .github/workflows/heroshot.yaml
name: Heroshot

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
      - run: npx heroshot --session-key=${{ secrets.HEROSHOT_SESSION_KEY }}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add heroshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots" && git push
```

---

**Status:** Early alpha. [See releases](https://github.com/omachala/heroshot/releases) for current version.

**Docs:** [heroshot.sh](https://heroshot.sh)

## License

MIT
