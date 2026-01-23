---
description: All properties available in a screenshot definition object.
---

# Screenshot Definition Reference

Back to [Configuration overview](./config#screenshot-definition).

| Property           | Type                                         | Default      | Description                                                                                                                           |
| ------------------ | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | string                                       | `"3a81b08c"` | Unique identifier (auto-generated if omitted)                                                                                         |
| `name`             | string                                       | -            | Display name, also used to derive the output filename                                                                                 |
| `url`              | string                                       | -            | Full URL of the page to capture                                                                                                       |
| `selector`         | string                                       | -            | CSS selector for element capture (omit for full-page)                                                                                 |
| `padding`          | object                                       | -            | Expand capture area beyond element bounds                                                                                             |
| ↳ `padding.top`    | number                                       | `0`          | Top padding in pixels                                                                                                                 |
| ↳ `padding.right`  | number                                       | `0`          | Right padding in pixels                                                                                                               |
| ↳ `padding.bottom` | number                                       | `0`          | Bottom padding in pixels                                                                                                              |
| ↳ `padding.left`   | number                                       | `0`          | Left padding in pixels                                                                                                                |
| `scroll`           | object                                       | -            | Scroll position to restore before capturing                                                                                           |
| ↳ `scroll.x`       | number                                       | `0`          | Horizontal scroll offset in pixels                                                                                                    |
| ↳ `scroll.y`       | number                                       | `0`          | Vertical scroll offset in pixels                                                                                                      |
| `paddingFill`      | `"inherit"` \| `"solid"` \| `"transparent"`  | -            | Background fill for padding area: "inherit" (default) shows page content, "solid" fills with detected background color                |
| `elementFill`      | `"original"` \| `"solid"` \| `"transparent"` | -            | Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color                  |
| `viewports`        | string[]                                     | -            | Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"                                 |
| `textOverrides`    | Record                                       | -            | Replace text content before capture. Keys are CSS selectors, values are replacement text                                              |
| `actions`          | any[]                                        | -            | Ordered list of actions to execute before capturing the screenshot. Actions run sequentially — each completes before the next starts. |

## Example

```json
{
  "id": "3a81b08c",
  "name": "My Screenshot",
  "url": "/dashboard",
  "selector": ".my-element",
  "padding": {},
  "scroll": {},
  "paddingFill": "inherit",
  "elementFill": "original",
  "viewports": [],
  "textOverrides": {},
  "actions": []
}
```
