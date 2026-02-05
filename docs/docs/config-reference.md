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
| ↳ `screenshots[].elementFill`   | `"original"` \| `"solid"` \| `"transparent"` | -             | Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color                                                                                                                    |
| ↳ `screenshots[].viewports`     | string[]                                     | -             | Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"                                                                                                                                   |
| ↳ `screenshots[].textOverrides` | Record                                       | -             | Replace text content before capture. Keys are CSS selectors, values are replacement text                                                                                                                                                |
| ↳ `screenshots[].actions`       | any[]                                        | -             | Ordered list of actions to execute before capturing. Actions run sequentially.                                                                                                                                                          |

## Example

```json
{
  "outputDirectory": "screenshots",
  "outputFormat": "png",
  "jpegQuality": 80,
  "browser": {},
  "workers": 4,
  "screenshots": []
}
```
