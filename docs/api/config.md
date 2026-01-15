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
      "filename": "dashboard.png",
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
      "maskPadding": true
    },
    {
      "id": "def456",
      "name": "Homepage",
      "url": "https://myapp.com",
      "filename": "homepage.png"
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
| `screenshots`     | array               | `[]`          | Screenshot definitions                               |

## Browser Settings

| Property            | Type                              | Default | Description                          |
| ------------------- | --------------------------------- | ------- | ------------------------------------ |
| `viewport.width`    | number                            | `1280`  | Browser viewport width in pixels     |
| `viewport.height`   | number                            | `800`   | Browser viewport height in pixels    |
| `colorScheme`       | `"auto"` \| `"light"` \| `"dark"` | -       | Color scheme for capture (see below) |
| `deviceScaleFactor` | number (1-3)                      | `1`     | Retina scale (2 = 2x resolution)     |

### Color Scheme Values

| Value       | Behavior                                                              |
| ----------- | --------------------------------------------------------------------- |
| _(not set)_ | Captures **both** light and dark variants (`-light.png`, `-dark.png`) |
| `"auto"`    | Uses browser's default color scheme preference                        |
| `"light"`   | Forces light mode only                                                |
| `"dark"`    | Forces dark mode only                                                 |

## Screenshot Definition

| Property      | Type    | Required | Description                                   |
| ------------- | ------- | -------- | --------------------------------------------- |
| `id`          | string  | auto     | Unique identifier (auto-generated if omitted) |
| `name`        | string  | yes      | Display name for the screenshot               |
| `url`         | string  | yes      | Full URL to capture                           |
| `filename`    | string  | yes      | Output filename (e.g., `"hero.png"`)          |
| `selector`    | string  | no       | CSS selector for element capture              |
| `padding`     | object  | no       | Expand capture area beyond element            |
| `scroll`      | object  | no       | Scroll position before capture                |
| `maskPadding` | boolean | no       | Fill padding with detected background color   |

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

### Mask Padding

When `maskPadding: true`, heroshot detects the element's background color and fills the padding area with it, creating seamless screenshots:

```json
{
  "selector": ".card",
  "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 },
  "maskPadding": true
}
```

## Minimal Config

The simplest valid config:

```json
{
  "screenshots": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "filename": "homepage.png"
    }
  ]
}
```

This captures a full-page screenshot of example.com in both light and dark modes.
