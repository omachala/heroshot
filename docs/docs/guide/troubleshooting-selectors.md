---
description: Fix common selector issues in Heroshot. Shadow DOM, dynamic content, iframes, and elements that won't capture.
---

# Troubleshooting Selectors

You picked an element in the visual picker. It looked perfect. But when you run `heroshot`, the screenshot is wrong - or missing entirely.

This guide covers the common reasons selectors fail and how to fix them.

## "Element Not Found"

The most common error. Heroshot navigates to the URL, waits for the page to load, then looks for your selector. If it's not there, you get this error.

### The Element Loads Later

Modern apps load content dynamically. Your element might not exist when Heroshot first checks.

**The symptom:**

```bash
$ heroshot
✗ Dashboard Chart - element not found: .chart-container
```

**The fix:** Add a wait action to give the element time to appear:

```json
{
  "name": "Dashboard Chart",
  "url": "https://app.example.com/dashboard",
  "selector": ".chart-container",
  "actions": [{ "type": "wait", "text": "Revenue" }]
}
```

The `wait` action pauses until "Revenue" appears on the page - a sign the chart has loaded. You can also wait for specific text to disappear:

```json
{
  "actions": [{ "type": "wait", "textGone": "Loading..." }]
}
```

Or just wait a fixed time (less reliable, but sometimes necessary):

```json
{
  "actions": [{ "type": "wait", "time": 2 }]
}
```

### The Selector Changed

Your app got updated. The class name changed from `.chart-container` to `.chart-wrapper`. The selector no longer matches.

**The fix:** Re-pick the element. Run `heroshot config`, navigate to the page, and click the element again. Heroshot generates a fresh selector.

**Better long-term:** Use more stable selectors. Data attributes like `[data-testid="chart"]` survive refactors better than class names.

### The URL Changed

Maybe the dashboard moved from `/dashboard` to `/app/dashboard`. The page loads, but it's the wrong page.

**The fix:** Update the URL in your config, or re-pick the element with the correct URL.

### Authentication Required

The page redirects to a login screen. Heroshot looks for `.chart-container` but finds a login form instead.

**The fix:** See [Capturing Behind Authentication](/docs/guide/authentication).

## Shadow DOM Elements

Web components encapsulate their internals in shadow DOM. Regular CSS selectors can't reach inside.

**The symptom:** You inspect the page and see the element, but your selector `.inner-content` returns nothing.

**Check if it's shadow DOM:**

1. Open DevTools
2. Right-click your element → Inspect
3. Look for `#shadow-root` in the DOM tree above your element

**The fix:** Use the `>>` syntax to pierce shadow boundaries:

```json
{
  "selector": "my-component >> .inner-content"
}
```

For deeply nested components:

```json
{
  "selector": "outer-component >> inner-component >> .target"
}
```

**Example with a common pattern:**

```json
{
  "name": "Dropdown Menu",
  "url": "https://example.com",
  "selector": "custom-dropdown >> .menu-items"
}
```

## Iframes

Elements inside iframes live in a separate document. Heroshot can't select across iframe boundaries directly.

**The symptom:** The element is visible on the page, but no selector works. In DevTools, you see the element is inside an `<iframe>`.

**The workaround:** Use the `evaluate` action to interact with iframe content:

```json
{
  "name": "Embedded Widget",
  "url": "https://example.com/page-with-iframe",
  "actions": [
    {
      "type": "evaluate",
      "function": "() => { const iframe = document.querySelector('iframe'); iframe.style.border = '2px solid red'; }"
    }
  ]
}
```

For capturing iframe content specifically, you might need to navigate directly to the iframe's source URL instead.

## Dynamic Classes and IDs

Some frameworks generate random class names like `.css-1a2b3c4` or IDs like `#radix-123`. These change on every build.

**The symptom:** Selector works today, breaks tomorrow after a deploy.

**Better selectors to use:**

1. **Data attributes:**

   ```json
   { "selector": "[data-testid='submit-button']" }
   ```

2. **Role selectors:**

   ```json
   { "selector": "role=button[name='Submit']" }
   ```

3. **Text selectors:**

   ```json
   { "selector": "text=Submit Order" }
   ```

4. **Structural selectors:**
   ```json
   { "selector": "form >> button:last-child" }
   ```

**Example migration:**

```json
// Fragile - generated class name
{ "selector": ".css-1a2b3c4" }

// Better - semantic role
{ "selector": "role=button[name='Add to Cart']" }

// Better - data attribute (if available)
{ "selector": "[data-testid='add-to-cart']" }

// Better - text content
{ "selector": "text=Add to Cart" }
```

## Element Exists But Screenshot Is Wrong

The selector matches, but the captured image isn't what you expected.

### Wrong Element Selected

Multiple elements match your selector. Heroshot captures the first one.

**The symptom:** You wanted the second "Add to Cart" button, but got the first.

**The fix:** Make your selector more specific:

```json
// Matches multiple buttons
{ "selector": ".add-to-cart" }

// Matches the one in the featured products section
{ "selector": ".featured-products >> .add-to-cart" }

// Matches by text content
{ "selector": "text=Add to Cart >> nth=1" }
```

The `nth=1` syntax selects the second match (0-indexed).

### Element Is Partially Visible

The element extends beyond the viewport, or is partially hidden by a sticky header.

**The fix:** Add scroll position or padding:

```json
{
  "name": "Long Form",
  "url": "https://example.com/form",
  "selector": ".registration-form",
  "scroll": { "y": 100 },
  "padding": { "top": 80 }
}
```

### Element Is Behind an Overlay

A modal, cookie banner, or chat widget covers your element.

**The fix:** Hide the overlay before capturing:

```json
{
  "name": "Hero Section",
  "url": "https://example.com",
  "selector": ".hero",
  "actions": [{ "type": "hide", "selectors": [".cookie-banner", ".chat-widget"] }]
}
```

Or click to dismiss it:

```json
{
  "actions": [{ "type": "click", "selector": ".cookie-banner button.accept" }]
}
```

## Elements That Need Interaction

Some elements only appear after user interaction - hover menus, click-to-reveal content, expanded accordions.

### Hover States

Capture a dropdown menu that appears on hover:

```json
{
  "name": "Navigation Menu",
  "url": "https://example.com",
  "selector": ".nav-dropdown",
  "actions": [{ "type": "hover", "selector": ".nav-trigger" }]
}
```

### Click to Expand

Capture an accordion panel after expanding it:

```json
{
  "name": "FAQ Answer",
  "url": "https://example.com/faq",
  "selector": ".faq-answer",
  "actions": [
    { "type": "click", "selector": ".faq-question:first-child" },
    { "type": "wait", "time": 0.3 }
  ]
}
```

### Form States

Capture a form with validation errors showing:

```json
{
  "name": "Form Validation",
  "url": "https://example.com/signup",
  "selector": "form",
  "actions": [
    { "type": "click", "selector": "button[type='submit']" },
    { "type": "wait", "text": "This field is required" }
  ]
}
```

## Debugging Selectors

When nothing seems to work, debug step by step.

### Run in Headed Mode

See what Heroshot sees:

```bash
DISPLAY=:0 heroshot --headed
```

The browser window stays open so you can inspect the page state.

### Check with Verbose Output

```bash
heroshot -v
```

This shows:

- Which URL is being loaded
- Whether the selector was found
- Any actions being executed
- Error details

### Test Selectors in DevTools

Before adding to config, test your selector in the browser console:

```javascript
// CSS selector
document.querySelector('.my-selector');

// Shadow DOM
document.querySelector('my-component').shadowRoot.querySelector('.inner');

// Check if multiple elements match
document.querySelectorAll('.my-selector').length;
```

### Simplify and Isolate

If a complex selector fails, break it down:

1. Does the page load? Check the URL.
2. Does the parent element exist? Try selecting that.
3. Does the child element exist? Check with DevTools.
4. Is it timing? Add a wait action.
5. Is it shadow DOM? Look for `#shadow-root`.

## Common Patterns That Work

Here are reliable selector patterns for common UI elements:

**Buttons:**

```json
{ "selector": "role=button[name='Submit']" }
{ "selector": "button[type='submit']" }
{ "selector": "text=Submit" }
```

**Forms:**

```json
{ "selector": "form[name='signup']" }
{ "selector": "role=form" }
```

**Navigation:**

```json
{ "selector": "nav" }
{ "selector": "role=navigation" }
{ "selector": "[aria-label='Main navigation']" }
```

**Modals:**

```json
{ "selector": "role=dialog" }
{ "selector": "[aria-modal='true']" }
```

**Cards/Tiles:**

```json
{ "selector": "article:first-child" }
{ "selector": ".card-grid >> article >> nth=0" }
```

## What's Next

- [Actions Reference](/docs/actions-reference) - All available actions for page interaction
- [Screenshot Reference](/docs/screenshot-reference) - Full selector syntax documentation
- [Capturing Behind Authentication](/docs/guide/authentication) - When login is required
