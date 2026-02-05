---
description: All properties available in a screenshot definition object.
---

# Screenshot Definition Reference

Back to [Configuration overview](./config#screenshot-definition).

| Property           | Type                                         | Default | Description                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | string                                       | auto    | Unique identifier (auto-generated if omitted)                                                                                                                                                                                           |
| `name`             | string                                       | -       | Display name, also used to derive the output filename                                                                                                                                                                                   |
| `url`              | string                                       | -       | Full URL of the page to capture                                                                                                                                                                                                         |
| `selector`         | string                                       | -       | Element selector for capture (omit for full-page). Supports Playwright selector formats: CSS (.class, #id), shadow DOM (host &gt;&gt; child), XPath (xpath=...), text (text=...), role (role=button[name="OK"]), and chained selectors. |
| `padding`          | object                                       | -       | Expand capture area beyond element bounds                                                                                                                                                                                               |
| ↳ `padding.top`    | number                                       | `0`     | Top padding in pixels                                                                                                                                                                                                                   |
| ↳ `padding.right`  | number                                       | `0`     | Right padding in pixels                                                                                                                                                                                                                 |
| ↳ `padding.bottom` | number                                       | `0`     | Bottom padding in pixels                                                                                                                                                                                                                |
| ↳ `padding.left`   | number                                       | `0`     | Left padding in pixels                                                                                                                                                                                                                  |
| `scroll`           | object                                       | -       | Saved scroll position (not used during capture - scrollIntoView is used instead)                                                                                                                                                        |
| ↳ `scroll.x`       | number                                       | `0`     | Horizontal scroll offset in pixels                                                                                                                                                                                                      |
| ↳ `scroll.y`       | number                                       | `0`     | Vertical scroll offset in pixels                                                                                                                                                                                                        |
| `paddingFill`      | `"inherit"` \| `"solid"` \| `"transparent"`  | -       | Background fill for padding area: "inherit" (default) shows page content, "solid" fills with detected background color                                                                                                                  |
| `elementFill`      | `"original"` \| `"solid"` \| `"transparent"` | -       | Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color                                                                                                                    |
| `viewports`        | string[]                                     | -       | Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"                                                                                                                                   |
| `textOverrides`    | Record                                       | -       | Replace text content before capture. Keys are CSS selectors, values are replacement text                                                                                                                                                |
| `actions`          | any[]                                        | -       | Ordered list of actions to execute before capturing. Actions run sequentially.                                                                                                                                                          |

## Example

```json
{
  "id": "abc12345",
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

## Selector Formats

Heroshot uses Playwright's locator API under the hood, giving you access to powerful selector options beyond basic CSS.

| Format     | Syntax          | Example                                   | Use Case               |
| ---------- | --------------- | ----------------------------------------- | ---------------------- |
| CSS        | `.class`, `#id` | `".submit-button"`                        | Default, most common   |
| Shadow DOM | `host >> child` | `"my-component >> .inner"`                | Web components         |
| XPath      | `xpath=...`     | `"xpath=//button[@data-testid='submit']"` | Complex DOM traversal  |
| Text       | `text=...`      | `"text=Submit"`                           | Select by visible text |
| Role       | `role=...`      | `"role=button[name='OK']"`                | ARIA-based selection   |
| Chained    | `a >> b`        | `".modal >> role=button[name='Close']"`   | Combine selectors      |

### Shadow DOM

Use `>>` to pierce shadow DOM boundaries:

```json
"selector": "my-custom-element >> .inner-content"
```

For deeply nested shadow DOM:

```json
"selector": "outer-host >> inner-host >> .target"
```

::: tip Legacy Syntax
The `>>>` syntax still works and is auto-converted to `>>`.
:::

### XPath

For complex DOM traversal where CSS selectors fall short:

```json
"selector": "xpath=//div[@class='container']//button[contains(text(), 'Save')]"
```

### Text Selectors

Select elements by their visible text content:

```json
"selector": "text=Sign In"
```

### Role Selectors

Select by ARIA role for accessibility-focused selection:

```json
"selector": "role=button[name='Submit']"
```

::: info Playwright Documentation
For the complete selector syntax reference, see the [Playwright Locators documentation](https://playwright.dev/docs/locators).
:::
