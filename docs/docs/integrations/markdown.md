---
description: Use Heroshot with plain Markdown. Light/dark mode screenshots for GitHub READMEs and GitLab wikis.
---

# Markdown

For plain Markdown files (GitHub READMEs, GitLab wikis, or any Markdown renderer), you can use HTML's `<picture>` element to show different images for light and dark modes.

This works on GitHub, GitLab, and anywhere that respects `prefers-color-scheme` media queries.

## Generate Snippets Automatically

Use the `heroshot snippet` command to generate the `<picture>` markup automatically:

```bash
heroshot snippet              # All screenshots
heroshot snippet dashboard    # Filter by name/id
```

Output:

```html
<!-- heroshot: Dashboard (abc123) -->
<picture>
  <source srcset="./heroshots/dashboard-dark.png" media="(prefers-color-scheme: dark)" />
  <img src="./heroshots/dashboard-light.png" alt="Dashboard" />
</picture>
```

Copy-paste into your README. See [CLI Reference](/docs/cli#heroshot-snippet-pattern) for all options.

## Light/Dark Mode Images

Use the `<picture>` element with `prefers-color-scheme` media queries:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./screenshots/dashboard-dark.png" />
  <source media="(prefers-color-scheme: light)" srcset="./screenshots/dashboard-light.png" />
  <img alt="Dashboard screenshot" src="./screenshots/dashboard-light.png" />
</picture>
```

The browser picks the right image based on the user's system preference. The `<img>` is the fallback for browsers that don't support `<picture>`.

### GitHub READMEs

GitHub fully supports this pattern. Your README automatically shows the right variant:

```html
<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://raw.githubusercontent.com/yourname/yourrepo/main/docs/screenshot-dark.png"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://raw.githubusercontent.com/yourname/yourrepo/main/docs/screenshot-light.png"
    />
    <img
      alt="App screenshot"
      src="https://raw.githubusercontent.com/yourname/yourrepo/main/docs/screenshot-light.png"
    />
  </picture>
</p>
```

::: tip Use raw URLs for GitHub
For images in your repo, use `https://raw.githubusercontent.com/...` URLs so they render correctly.
:::

### Heroshot Naming Convention

When you capture with color scheme set to "Both", heroshot generates:

- `dashboard-light.png`
- `dashboard-dark.png`

This maps directly to the `<picture>` pattern:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./screenshots/dashboard-dark.png" />
  <source media="(prefers-color-scheme: light)" srcset="./screenshots/dashboard-light.png" />
  <img alt="Dashboard" src="./screenshots/dashboard-light.png" />
</picture>
```

## Single Image (No Theme Variants)

For screenshots without light/dark variants, standard Markdown works:

```md
![Dashboard screenshot](./screenshots/dashboard.png)
```

Or with sizing control:

```html
<img src="./screenshots/dashboard.png" alt="Dashboard" width="600" />
```

## Responsive Viewports

If you have viewport variants (desktop, tablet, mobile), you can show them in tabs or a grid:

### Side by Side

```html
<table>
  <tr>
    <td><img src="./screenshots/hero-desktop.png" alt="Desktop" width="400" /></td>
    <td><img src="./screenshots/hero-mobile.png" alt="Mobile" width="150" /></td>
  </tr>
  <tr>
    <td align="center">Desktop</td>
    <td align="center">Mobile</td>
  </tr>
</table>
```

### With Theme Variants

Combine viewports and themes:

```html
<table>
  <tr>
    <td>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./screenshots/hero-desktop-dark.png" />
        <img alt="Desktop" src="./screenshots/hero-desktop-light.png" width="400" />
      </picture>
    </td>
    <td>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./screenshots/hero-mobile-dark.png" />
        <img alt="Mobile" src="./screenshots/hero-mobile-light.png" width="150" />
      </picture>
    </td>
  </tr>
</table>
```

## Real-World Example

Here's how [ha-treemap-card](https://github.com/omachala/ha-treemap-card) uses this pattern in its README:

```html
<p align="center">
  <br />
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="
        https://raw.githubusercontent.com/omachala/ha-treemap-card/master/docs/images/stocks-dark.png
      "
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="
        https://raw.githubusercontent.com/omachala/ha-treemap-card/master/docs/images/stocks.png
      "
    />
    <img
      alt="Stock portfolio treemap"
      src="https://raw.githubusercontent.com/omachala/ha-treemap-card/master/docs/images/stocks.png"
    />
  </picture>
  <br /><br />
</p>
```

This shows the light variant to users with light mode and dark variant to users with dark mode - no JavaScript required.

## Tips

1. **Always include fallback** - The `<img>` inside `<picture>` is shown if the browser doesn't support media queries
2. **Use raw URLs on GitHub** - `https://raw.githubusercontent.com/...` ensures images load correctly
3. **Test both modes** - On macOS: System Settings > Appearance. On Windows: Settings > Personalization > Colors
4. **Keep filenames consistent** - Heroshot's `-light.png` / `-dark.png` convention makes the pattern easy to follow
