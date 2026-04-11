---
description: All top-level configuration options for heroshot config.json.
---

# Global Config Reference

Back to [Configuration overview](./config).

| Property                        | Type                                         | Default       | Description                                                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outputDirectory`               | string                                       | `"heroshots"` | Output directory for screenshots (relative to config file)                                                                                                                                                                              |
| `outputFormat`                  | `"png"` \| `"jpeg"`                          | `"png"`       | Image format for all screenshots                                                                                                                                                                                                        |
| `jpegQuality`                   | number                                       | `80`          | JPEG compression quality (1-100), only used when outputFormat is "jpeg"                                                                                                                                                                 |
| `browser`                       | object                                       | -             | Default browser settings applied to all screenshots                                                                                                                                                                                     |
| ↳ `browser.viewport`            | object                                       | -             | Browser viewport dimensions                                                                                                                                                                                                             |
| ↳ `browser.colorScheme`         | `"light"` \| `"dark"`                        | -             | Color scheme for capture. Omit to capture both light and dark variants                                                                                                                                                                  |
| ↳ `browser.deviceScaleFactor`   | number                                       | -             | Device pixel ratio (1 = standard, 2 = retina, 3 = ultra-high DPI)                                                                                                                                                                       |
| ↳ `browser.bypassCSP`           | boolean                                      | -             | Bypass Content-Security-Policy restrictions. Enabled by default for reliable page.evaluate() calls                                                                                                                                      |
| ↳ `browser.reducedMotion`       | `"reduce"` \| `"no-preference"`              | -             | Emulate prefers-reduced-motion media feature. Use "reduce" to disable animations                                                                                                                                                        |
| ↳ `browser.userAgent`           | string                                       | -             | Custom user agent string for the browser                                                                                                                                                                                                |
| `workers`                       | number                                       | -             | Number of parallel capture workers (default: 1)                                                                                                                                                                                         |
| `screenshots`                   | object[]                                     | `[]`          | Screenshot definitions                                                                                                                                                                                                                  |
| ↳ `screenshots[].id`            | string                                       | auto          | Unique identifier (auto-generated if omitted)                                                                                                                                                                                           |
| ↳ `screenshots[].name`          | string                                       | -             | Display name, also used to derive the output filename                                                                                                                                                                                   |
| ↳ `screenshots[].url`           | string                                       | -             | Full URL of the page to capture                                                                                                                                                                                                         |
| ↳ `screenshots[].selector`      | string                                       | -             | Element selector for capture (omit for full-page). Supports Playwright selector formats: CSS (.class, #id), shadow DOM (host &gt;&gt; child), XPath (xpath=...), text (text=...), role (role=button[name="OK"]), and chained selectors. |
| ↳ `screenshots[].padding`       | object                                       | -             | Expand capture area beyond element bounds                                                                                                                                                                                               |
| ↳ `screenshots[].scroll`        | object                                       | -             | Saved scroll position (not used during capture - scrollIntoView is used instead)                                                                                                                                                        |
| ↳ `screenshots[].paddingFill`   | `"inherit"` \| `"solid"` \| `"transparent"`  | -             | Background fill for padding area: "inherit" (default) shows page content, "solid" fills with detected background color                                                                                                                  |
| ↳ `screenshots[].paddingColor`  | string                                       | -             | Custom color for padding fill when set to "solid" (hex, defaults to auto-detected background)                                                                                                                                           |
| ↳ `screenshots[].elementFill`   | `"original"` \| `"solid"` \| `"transparent"` | -             | Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color                                                                                                                    |
| ↳ `screenshots[].elementColor`  | string                                       | -             | Custom color for element fill when set to "solid" (hex, defaults to auto-detected background)                                                                                                                                           |
| ↳ `screenshots[].viewports`     | string[]                                     | -             | Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"                                                                                                                                   |
| ↳ `screenshots[].textOverrides` | Record                                       | -             | Replace text content before capture. Keys are CSS selectors, values are replacement text                                                                                                                                                |
| ↳ `screenshots[].annotations`   | object[]                                     | -             | Visual annotations drawn over the screenshot (arrows, rectangles, ellipses)                                                                                                                                                             |
| ↳ `screenshots[].borderWidth`   | number                                       | -             | Border width around capture area in pixels (default 0)                                                                                                                                                                                  |
| ↳ `screenshots[].borderColor`   | string                                       | -             | Border color (hex, default "#000000")                                                                                                                                                                                                   |
| ↳ `screenshots[].borderRadius`  | number                                       | -             | Corner radius in pixels — rounds the screenshot corners with transparency (PNG only)                                                                                                                                                    |
| ↳ `screenshots[].actions`       | any[]                                        | -             | Ordered list of actions to execute before capturing. Actions run sequentially.                                                                                                                                                          |
| `hiddenElements`                | Record                                       | -             | Elements to hide per domain (hostname → CSS selectors)                                                                                                                                                                                  |
| `locales`                       | string[]                                     | -             | Locale codes to capture (e.g., `["en", "de"]`). Generates one screenshot per locale. See [Locale screenshots](#locale-screenshots).                                                                                                     |

## Example

```json
{
  "outputDirectory": "screenshots",
  "outputFormat": "png",
  "jpegQuality": 80,
  "browser": {},
  "workers": 4,
  "screenshots": [],
  "hiddenElements": {}
}
```

## Locale Screenshots

Use `locales` to automatically generate screenshots in multiple languages. Each locale gets its own output subdirectory.

```json
{
  "locales": ["en", "de", "fr"],
  "screenshots": [
    {
      "name": "home",
      "url": "http://localhost:5173/{locale}/"
    },
    {
      "name": "about",
      "url": "http://localhost:5173/{locale}/about"
    }
  ]
}
```

This generates:

```
heroshots/
  en/home.png
  en/about.png
  de/home.png
  de/about.png
  fr/home.png
  fr/about.png
```

**How it works:**

- **`{locale}` in URL** — replaced with the locale code per capture. Use this for path-based routing (VitePress, Next.js i18n sub-paths, Docusaurus).
- **No `{locale}` in URL** — URL is used as-is, but the browser's locale and `Accept-Language` header are set to the locale code. Use this for apps that detect locale via JavaScript (`navigator.language`, `Intl`) or server-side `Accept-Language` negotiation.
- **Single locale** — no subdirectory is added (same output as without `locales`).
- **Multiple locales** — each locale outputs to its own subdirectory named after the locale code.
