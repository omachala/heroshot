<p align="center">
  <img src="https://github.com/omachala/heroshot/blob/main/assets/icon-128.svg?raw=true" alt="heroshot logo" width="128" height="128">
</p>

<h1 align="center">heroshot</h1>

<p align="center">
  <strong>Keep your product screenshots always up to date.</strong><br>
  No more stale images in docs, landing pages, or blog posts.
</p>

[![npm](https://img.shields.io/npm/v/heroshot)](https://www.npmjs.com/package/heroshot)

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

- **Visual picker** - Point and click to select elements, no DevTools needed
- **Zero config** - No YAML to write, config is auto-generated
- **Element-precise** - Capture specific UI components, not just full pages
- **One command** - Regenerate all screenshots anytime your UI changes
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
