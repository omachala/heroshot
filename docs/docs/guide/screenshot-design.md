---
description: Create documentation screenshots that actually help users. Element selection, sizing, padding, and consistency tips.
---

# Screenshot Design Best Practices

Screenshots are how users understand your product before (or instead of) reading documentation. A good screenshot communicates instantly. A bad one confuses or misleads.

This guide covers how to capture screenshots that genuinely help your users.

## What to Screenshot

### Focus on Actions, Not Pages

Users don't need a screenshot of your entire settings page. They need to see the specific toggle they're looking for.

```json
// Too much - where do I look?
{
  "name": "Settings Page",
  "url": "https://app.example.com/settings"
}

// Just right - shows exactly what to click
{
  "name": "Enable Dark Mode",
  "url": "https://app.example.com/settings",
  "selector": ".appearance-settings"
}
```

**Ask yourself:** What is the user trying to do? Show them that thing, not the entire page around it.

### Capture the Result, Not Just the Button

If you're documenting how to export data, don't just show the Export button - show the export dialog that appears, or the success message.

```json
{
  "name": "Export Dialog",
  "url": "https://app.example.com/data",
  "selector": ".export-modal",
  "actions": [
    { "type": "click", "selector": "button.export" },
    { "type": "wait", "text": "Export Options" }
  ]
}
```

Show cause and effect. Users need to know what happens next.

### Include Context

A button floating in isolation doesn't help. Include enough surrounding UI so users can orient themselves.

```json
{
  "name": "Save Button",
  "url": "https://app.example.com/editor",
  "selector": ".toolbar",
  "padding": { "bottom": 20 }
}
```

The toolbar gives context. Users can find this button because they see what's around it.

### Skip the Obvious

Not everything needs a screenshot. Login pages, basic forms, standard UI patterns - users know what these look like. Save screenshots for:

- Unique features
- Complex workflows
- Non-obvious UI elements
- Anything users ask about repeatedly

## Sizing and Viewports

### Match the Context

Where will this screenshot appear?

**README or docs homepage:** Desktop width, horizontal aspect ratio

```json
{
  "viewports": ["desktop"],
  "selector": ".hero-section"
}
```

**Mobile app documentation:** Mobile viewport

```json
{
  "viewports": ["mobile"]
}
```

**Side-by-side comparison:** Same viewport for both

```json
{
  "name": "Before",
  "viewports": ["1200x800"]
},
{
  "name": "After",
  "viewports": ["1200x800"]
}
```

### Generate Multiple Viewports

If your docs serve both desktop and mobile users, capture both:

```json
{
  "name": "Dashboard",
  "url": "https://app.example.com/dashboard",
  "selector": ".main-content",
  "viewports": ["desktop", "mobile"]
}
```

This generates:

- `dashboard-desktop-light.png`
- `dashboard-desktop-dark.png`
- `dashboard-mobile-light.png`
- `dashboard-mobile-dark.png`

Your docs can then show the appropriate version.

### Avoid Extremes

Very wide screenshots (2560px+) get shrunk and lose detail. Very narrow ones look stretched.

**Recommended widths:**

- Desktop: 1280px (default)
- Tablet: 768px
- Mobile: 375px

Custom sizes work too - just keep them reasonable:

```json
{
  "viewports": ["1400x900"]
}
```

## Padding and Breathing Room

### Add Padding Around Elements

Elements captured edge-to-edge look cramped. Add padding for visual breathing room:

```json
{
  "selector": ".feature-card",
  "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
}
```

Or use shorthand for uniform padding:

```json
{
  "selector": ".feature-card",
  "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
}
```

**How much padding?** Start with 16-24px. Increase for elements that need more context, decrease for inline screenshots.

### Control the Background

By default, padding shows whatever is behind the element. Sometimes that's noise.

**Solid background fill:**

```json
{
  "selector": ".modal",
  "padding": { "top": 40, "right": 40, "bottom": 40, "left": 40 },
  "paddingFill": "solid"
}
```

This fills the padding area with the element's detected background color. Clean and focused.

**Transparent background:**

```json
{
  "paddingFill": "transparent"
}
```

Useful when you'll composite the screenshot onto a custom background later.

## Light and Dark Mode

### Capture Both by Default

Heroshot captures light and dark variants automatically (when `browser.colorScheme` isn't set). This is usually what you want.

```json
{
  "name": "Dashboard"
}
```

Generates:

- `dashboard-light.png`
- `dashboard-dark.png`

Docs sites can then serve the right version based on the reader's preference.

### When to Capture Only One

Sometimes one variant is enough:

- Your app doesn't have dark mode
- You're showing code/terminal output (typically dark)
- The feature looks identical in both modes

```json
{
  "browser": {
    "colorScheme": "light"
  }
}
```

### Check Both Variants

What looks good in light mode might be invisible in dark mode (or vice versa). Always verify both:

```bash
heroshot -v
```

Then check both output files. Light text on light backgrounds, missing borders, broken contrast - these are common issues.

## Text and Data

### Use Realistic Data

Screenshots with "Test User" and "Lorem ipsum" look unprofessional. Use realistic (but fictional) data:

```json
{
  "textOverrides": {
    ".user-name": "Sarah Chen",
    ".project-name": "Q4 Marketing Campaign",
    ".date": "December 15, 2024"
  }
}
```

**Good example data:**

- Real-looking names
- Plausible numbers
- Actual dates (not "XX/XX/XXXX")
- Sensible text content

### Sanitize Sensitive Information

Real data might leak in:

```json
{
  "textOverrides": {
    ".email": "team@example.com",
    ".api-key": "sk-••••••••••••xxxx",
    ".revenue": "$XX,XXX"
  }
}
```

Or hide sections entirely:

```json
{
  "actions": [{ "type": "hide", "selectors": [".billing-details", ".user-email"] }]
}
```

### Avoid Time-Sensitive Content

"5 minutes ago" or "Today at 3:42 PM" dates your screenshots. Override with stable text:

```json
{
  "textOverrides": {
    ".timestamp": "2 hours ago",
    ".notification-count": "3"
  }
}
```

## Consistency Across Screenshots

### Use a Standard Viewport

Pick one size and stick with it:

```json
{
  "browser": {
    "viewport": { "width": 1280, "height": 800 }
  }
}
```

All screenshots at the same width feel cohesive.

### Consistent Padding

Define padding once in your defaults, override only when needed:

```json
{
  "outputDirectory": "screenshots",
  "screenshots": [
    {
      "name": "Feature A",
      "selector": ".feature",
      "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 }
    },
    {
      "name": "Feature B",
      "selector": ".feature",
      "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 }
    }
  ]
}
```

### Same Scale Factor

Retina screenshots (2x) look crisp on high-DPI displays. Standard (1x) screenshots look crisp on standard displays. Pick one:

```json
{
  "browser": {
    "deviceScaleFactor": 2
  }
}
```

Mixing scales makes some screenshots look blurry relative to others.

## Removing Distractions

### Hide Cookie Banners and Chat Widgets

They're in every screenshot otherwise:

```json
{
  "actions": [
    {
      "type": "hide",
      "selectors": [".cookie-banner", ".chat-widget", ".announcement-bar", "[data-intercom-widget]"]
    }
  ]
}
```

### Dismiss Tooltips and Popovers

Unless you're documenting them, they're noise:

```json
{
  "actions": [{ "type": "press_key", "key": "Escape" }]
}
```

### Remove Development UI

Dev tools, debug panels, feature flags - hide them:

```json
{
  "actions": [{ "type": "hide", "selectors": [".dev-toolbar", ".debug-panel"] }]
}
```

Or capture against a production-like environment.

## Highlighting with Annotations

Sometimes a screenshot needs more than just showing the UI - you need to draw attention to a specific button, field, or area. That's what annotations are for.

### Draw Attention to What Matters

Add arrows, rectangles, and ellipses directly in the visual editor. These get baked into the screenshot, so they're always there when you regenerate.

Use annotations when:

- Pointing out a specific button or menu item in a busy UI
- Circling a setting that's easy to miss
- Drawing an arrow from a label to the thing it describes
- Highlighting the result of an action (e.g., "this notification appears")

### Keep It Minimal

One or two annotations per screenshot. If you need more, the screenshot is probably showing too much - split it into multiple focused captures instead.

### Use Consistent Styling

Pick a color and stroke width and stick with them across your docs. The visual editor remembers your last annotation style, which helps with consistency.

## State and Interaction

### Show Meaningful States

Empty states, loading states, error states - these often matter more than the happy path:

**Empty state:**

```json
{
  "name": "No Projects Yet",
  "url": "https://app.example.com/projects",
  "selector": ".empty-state"
}
```

**Error state:**

```json
{
  "name": "Form Validation",
  "actions": [
    { "type": "click", "selector": "button[type='submit']" },
    { "type": "wait", "text": "This field is required" }
  ]
}
```

### Capture Interactions

Hover states, open dropdowns, expanded accordions:

```json
{
  "name": "User Menu Open",
  "selector": ".user-dropdown",
  "actions": [
    { "type": "click", "selector": ".user-avatar" },
    { "type": "wait", "time": 0.3 }
  ]
}
```

### Fill Forms Meaningfully

Empty forms are boring. Show them filled:

```json
{
  "name": "Signup Form",
  "selector": "form.signup",
  "actions": [
    {
      "type": "fill_form",
      "fields": [
        { "selector": "#name", "value": "Sarah Chen", "fieldType": "textbox" },
        { "selector": "#email", "value": "sarah@example.com", "fieldType": "textbox" },
        { "selector": "#plan", "value": "pro", "fieldType": "combobox" }
      ]
    }
  ]
}
```

## Organizing Your Screenshots

### Naming Convention

Names become filenames. Keep them:

- Lowercase with hyphens
- Descriptive but concise
- Grouped by feature

```json
{
  "screenshots": [
    { "name": "dashboard-overview" },
    { "name": "dashboard-filters" },
    { "name": "dashboard-export" },
    { "name": "settings-profile" },
    { "name": "settings-billing" }
  ]
}
```

Results in:

```
heroshots/
├── dashboard-overview-light.png
├── dashboard-overview-dark.png
├── dashboard-filters-light.png
└── ...
```

### One Config, One Purpose

If you have wildly different screenshot needs (marketing site vs docs vs blog), consider separate configs:

```
.heroshot/
├── config.json        # Main docs screenshots
├── marketing.json     # Landing page shots
└── blog.json          # Blog post images
```

Run them independently:

```bash
heroshot -c .heroshot/marketing.json
```

## What's Next

- [Configuration Reference](/docs/config) - All available options
- [Actions Reference](/docs/actions-reference) - Page interactions before capture
- [Troubleshooting Selectors](/docs/guide/troubleshooting-selectors) - When elements won't capture
