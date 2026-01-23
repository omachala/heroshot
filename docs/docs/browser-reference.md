---
description: All browser configuration options for viewport, color scheme, and device scale.
---

# Browser Settings Reference

Back to [Configuration overview](./config#browser-settings).

| Property            | Type                  | Default | Description                                                            |
| ------------------- | --------------------- | ------- | ---------------------------------------------------------------------- |
| `viewport`          | object                | -       | Browser viewport dimensions                                            |
| ↳ `viewport.width`  | number                | `1280`  | Browser viewport width in pixels                                       |
| ↳ `viewport.height` | number                | `800`   | Browser viewport height in pixels                                      |
| `colorScheme`       | `"light"` \| `"dark"` | -       | Color scheme for capture. Omit to capture both light and dark variants |
| `deviceScaleFactor` | number                | -       | Device pixel ratio (1 = standard, 2 = retina, 3 = ultra-high DPI)      |

## Example

```json
{
  "viewport": {},
  "colorScheme": "light",
  "deviceScaleFactor": 2
}
```
