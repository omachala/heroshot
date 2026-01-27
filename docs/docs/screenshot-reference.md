---
description: All properties available in a screenshot definition object.
---

# Screenshot Definition Reference

Back to [Configuration overview](./config#screenshot-definition).

| Property           | Type                                         | Default | Description                                                                                                            |
| ------------------ | -------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`               | string                                       | auto    | Unique identifier (auto-generated if omitted)                                                                          |
| `name`             | string                                       | -       | Display name, also used to derive the output filename                                                                  |
| `url`              | string                                       | -       | Full URL of the page to capture                                                                                        |
| `selector`         | string                                       | -       | Element selector for capture (omit for full-page). Supports [Playwright selector formats](#selector-formats)           |
| `padding`          | object                                       | -       | Expand capture area beyond element bounds                                                                              |
| ↳ `padding.top`    | number                                       | `0`     | Top padding in pixels                                                                                                  |
| ↳ `padding.right`  | number                                       | `0`     | Right padding in pixels                                                                                                |
| ↳ `padding.bottom` | number                                       | `0`     | Bottom padding in pixels                                                                                               |
| ↳ `padding.left`   | number                                       | `0`     | Left padding in pixels                                                                                                 |
| `scroll`           | object                                       | -       | Scroll position to restore before capturing                                                                            |
| ↳ `scroll.x`       | number                                       | `0`     | Horizontal scroll offset in pixels                                                                                     |
| ↳ `scroll.y`       | number                                       | `0`     | Vertical scroll offset in pixels                                                                                       |
| `paddingFill`      | `"inherit"` \| `"solid"` \| `"transparent"`  | -       | Background fill for padding area: "inherit" (default) shows page content, "solid" fills with detected background color |
| `elementFill`      | `"original"` \| `"solid"` \| `"transparent"` | -       | Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color   |
| `viewports`        | string[]                                     | -       | Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"                  |
| `textOverrides`    | Record                                       | -       | Replace text content before capture. Keys are CSS selectors, values are replacement text                               |
| `actions`          | any[]                                        | -       | Ordered list of actions to execute before capturing. Actions run sequentially.                                         |

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

Heroshot supports all [Playwright selector formats](https://playwright.dev/docs/locators), giving you multiple ways to target elements:

### CSS Selectors (Default)

Standard CSS selectors work out of the box:

```json
{ "selector": ".submit-button" }
{ "selector": "#main-header" }
{ "selector": "div.card > h2.title" }
```

### Shadow DOM Piercing

For elements inside Shadow DOM, use `>>` to chain through shadow boundaries:

```json
{ "selector": "my-component >> .inner-element" }
{ "selector": "host-element >> nested-component >> button" }
```

::: tip Legacy Syntax
The `>>>` syntax from earlier versions still works and is automatically converted to `>>`.
:::

### XPath Selectors

For complex DOM traversal, use XPath with the `xpath=` prefix:

```json
{ "selector": "xpath=//button[@data-testid='submit']" }
{ "selector": "xpath=//div[contains(@class, 'card')]//h2" }
```

### Text Selectors

Find elements by their text content:

```json
{ "selector": "text=Submit" }
{ "selector": "text=Learn more" }
```

### Role Selectors

Select by ARIA role for accessibility-friendly targeting:

```json
{ "selector": "role=button[name='Submit']" }
{ "selector": "role=heading[name='Welcome']" }
```

### Chained Selectors

Combine multiple selectors with `>>` to narrow down matches:

```json
{ "selector": ".modal >> role=button[name='Close']" }
{ "selector": "form >> text=Submit" }
```

### When to Use Each

| Format   | Best For                                       |
| -------- | ---------------------------------------------- |
| CSS      | Most cases — simple, familiar, fast            |
| `>>`     | Shadow DOM components (web components)         |
| `xpath=` | Complex DOM traversal, selecting by position   |
| `text=`  | Buttons, links, labels by visible text         |
| `role=`  | Accessible elements, when classes are unstable |
