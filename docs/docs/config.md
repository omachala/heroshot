---
description: Heroshot configuration reference. All config options for screenshots, viewports, color schemes, padding, and output settings.
---

# Configuration Reference

Heroshot stores its configuration in `.heroshot/config.json` at your project root.

## Location

```
your-project/
├── .heroshot/
│   ├── config.json    # Screenshot definitions
│   └── session.enc    # Encrypted browser session (gitignored)
└── heroshots/         # Output directory (default)
    ├── dashboard-light.png
    └── dashboard-dark.png
```

## Full Example

```json
{
  "outputDirectory": "heroshots",
  "outputFormat": "png",
  "jpegQuality": 80,
  "workers": 4,
  "browser": {
    "viewport": {
      "width": 1280,
      "height": 800
    },
    "colorScheme": "light",
    "deviceScaleFactor": 2
  },
  "screenshots": [
    {
      "id": "abc123",
      "name": "Dashboard",
      "url": "https://myapp.com/dashboard",
      "selector": ".main-panel",
      "padding": {
        "top": 20,
        "right": 20,
        "bottom": 20,
        "left": 20
      },
      "scroll": {
        "x": 0,
        "y": 100
      },
      "paddingFill": "solid",
      "viewports": ["desktop", "mobile"],
      "textOverrides": {
        ".user-name": "John Doe",
        ".email": "john@example.com"
      }
    },
    {
      "id": "def456",
      "name": "Homepage",
      "url": "https://myapp.com"
    }
  ]
}
```

## Global Options

| Property          | Type                | Default       | Description                                          |
| ----------------- | ------------------- | ------------- | ---------------------------------------------------- |
| `outputDirectory` | string              | `"heroshots"` | Directory for screenshot output (relative to config) |
| `outputFormat`    | `"png"` \| `"jpeg"` | `"png"`       | Image format                                         |
| `jpegQuality`     | number (1-100)      | `80`          | JPEG compression quality                             |
| `browser`         | object              | -             | Browser settings (see below)                         |
| `workers`         | number              | `1`           | Number of parallel capture workers                   |
| `screenshots`     | array               | `[]`          | Screenshot definitions                               |

::: info Full Reference
See the [Global Config Reference](./config-reference) for all options with detailed descriptions.
:::

## Browser Settings

| Property            | Type                  | Default | Description                          |
| ------------------- | --------------------- | ------- | ------------------------------------ |
| `viewport.width`    | number                | `1280`  | Browser viewport width in pixels     |
| `viewport.height`   | number                | `800`   | Browser viewport height in pixels    |
| `colorScheme`       | `"light"` \| `"dark"` | -       | Color scheme for capture (see below) |
| `deviceScaleFactor` | number (1-3)          | `1`     | Retina scale (2 = 2x resolution)     |

::: info Full Reference
See the [Browser Settings Reference](./browser-reference) for all options with detailed descriptions.
:::

### Color Scheme Values

| Value       | Behavior                                                              |
| ----------- | --------------------------------------------------------------------- |
| _(not set)_ | Captures **both** light and dark variants (`-light.png`, `-dark.png`) |
| `"light"`   | Forces light mode only                                                |
| `"dark"`    | Forces dark mode only                                                 |

## Screenshot Definition

| Property        | Type     | Required | Description                                               |
| --------------- | -------- | -------- | --------------------------------------------------------- |
| `id`            | string   | auto     | Unique identifier (auto-generated if omitted)             |
| `name`          | string   | yes      | Display name (also used for filename)                     |
| `url`           | string   | yes      | Full URL to capture                                       |
| `selector`      | string   | no       | CSS selector for element capture                          |
| `padding`       | object   | no       | Expand capture area beyond element                        |
| `scroll`        | object   | no       | Scroll position before capture                            |
| `paddingFill`   | string   | no       | Padding background: `"inherit"`, `"solid"`                |
| `elementFill`   | string   | no       | Element background: `"original"`, `"solid"`               |
| `viewports`     | string[] | no       | Viewport variants (e.g., `["desktop", "mobile"]`)         |
| `textOverrides` | object   | no       | Replace text content in elements before capture           |
| `actions`       | array    | no       | Pre-screenshot actions ([reference](./actions-reference)) |

::: info Full Reference
See the [Screenshot Definition Reference](./screenshot-reference) for all options with detailed descriptions.
:::

::: tip Filename Generation
Filenames are automatically derived from the screenshot `name`. Heroshot slugifies the name and appends suffixes for variants:

- Name "Dashboard" → `dashboard-light.png`, `dashboard-dark.png` (color schemes)
- With viewports → `dashboard-desktop.png`, `dashboard-mobile.png`
- Combined: `dashboard-desktop-light.png`, `dashboard-mobile-dark.png`

Renaming a screenshot will rename its output files on the next sync.
:::

### Selector

The `selector` property supports standard CSS selectors and shadow DOM piercing:

```json
// Standard CSS selector
"selector": ".my-component"

// Shadow DOM piercing (>>> syntax)
"selector": "my-element >>> .inner-content"

// Omit for full-page screenshot
"selector": null
```

::: tip Full-Page Screenshots
Omit the `selector` property (or set it to `null`) to capture the entire scrollable page.
:::

### Padding

Expand the capture area beyond the element's bounds:

```json
"padding": {
  "top": 20,
  "right": 20,
  "bottom": 20,
  "left": 20
}
```

### Scroll Position

Restore scroll position before capturing (useful for elements below the fold):

```json
"scroll": {
  "x": 0,
  "y": 500
}
```

### Background Fill

Control how padding and element backgrounds are rendered:

**Padding fill modes** (`paddingFill`):

- `"inherit"` (default) - Shows actual page content in padding area
- `"solid"` - Fills padding with detected background color

**Element fill modes** (`elementFill`):

- `"original"` (default) - Keeps element's actual background
- `"solid"` - Replaces element background with detected color

```json
{
  "selector": ".card",
  "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 },
  "paddingFill": "solid",
  "elementFill": "original"
}
```

::: tip Visual Editor
In the visual editor, click the padding area or element to cycle through fill modes.
:::

### Viewports

Generate screenshots at multiple viewport sizes. Supports preset names and custom dimensions:

```json
{
  "name": "Dashboard",
  "url": "https://myapp.com/dashboard",
  "viewports": ["desktop", "tablet", "mobile"]
}
```

**Presets:**

| Name      | Dimensions |
| --------- | ---------- |
| `desktop` | 1280×800   |
| `tablet`  | 768×1024   |
| `mobile`  | 375×667    |

**Custom dimensions:** Use `"WIDTHxHEIGHT"` format (e.g., `"1920x1080"`)

```json
"viewports": ["desktop", "mobile", "1920x1080"]
```

Combined with default color scheme (both), this generates 6 files:

- `dashboard-desktop-light.png`
- `dashboard-desktop-dark.png`
- `dashboard-mobile-light.png`
- `dashboard-mobile-dark.png`
- `dashboard-1920x1080-light.png`
- `dashboard-1920x1080-dark.png`

### Text Overrides

Replace text content in specific elements before capturing. Useful for:

- Hiding sensitive data (emails, names, account numbers)
- Showing placeholder content for documentation
- Ensuring consistent screenshots across environments

```json
{
  "name": "User Profile",
  "url": "https://myapp.com/profile",
  "selector": ".profile-card",
  "textOverrides": {
    ".user-name": "Jane Smith",
    ".email": "jane@example.com",
    ".account-id": "****1234"
  }
}
```

The keys are CSS selectors, and values are the replacement text. All matching elements will have their `textContent` replaced before the screenshot is taken.

::: tip Shadow DOM Support
Text overrides support shadow DOM piercing with the `>>>` syntax:

```json
"textOverrides": {
  "my-component >>> .inner-text": "Replaced"
}
```

:::

### Actions

Actions are commands that run **before** each screenshot capture. They let you set up the exact page state you need — open a menu, fill a form, dismiss a banner, wait for content to load.

```json
{
  "name": "Settings with dark mode",
  "url": "https://myapp.com/settings",
  "actions": [
    { "type": "click", "selector": ".dark-mode-toggle" },
    { "type": "wait", "time": 0.3 }
  ]
}
```

Common patterns:

```json
// Dismiss a cookie banner
{ "type": "click", "selector": ".cookie-accept" }

// Fill an input field
{ "type": "type", "selector": "#search", "text": "demo query" }

// Wait for async content
{ "type": "wait", "text": "Dashboard loaded" }

// Remove an element via JS
{ "type": "evaluate", "function": "() => { document.querySelector('.chat-widget').remove() }" }

// Hover to show a tooltip
{ "type": "hover", "selector": ".info-icon" }
```

See the [Actions API Reference](./actions-reference) for the full list of action types and their properties.

## Minimal Config

The simplest valid config:

```json
{
  "screenshots": [
    {
      "name": "Homepage",
      "url": "https://example.com"
    }
  ]
}
```

This captures a full-page screenshot of example.com in both light and dark modes, generating `homepage-light.png` and `homepage-dark.png`.
