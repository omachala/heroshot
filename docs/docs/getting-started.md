---
description: Get started with Heroshot in 5 minutes. Install, pick elements visually, and generate your first automated screenshots.
---

# Getting Started

Let's get you from zero to automated screenshots in about five minutes.

## Run It

No installation required. Just:

```bash
npx heroshot
```

A browser opens. That's the visual picker - your tool for defining what to capture.

## Pick Your First Screenshot

Navigate to any URL in that browser. For this walkthrough, let's say you're documenting your app at `http://localhost:3000`.

See that toolbar on the right? Click the crosshair icon to enter **picker mode**. Now hover over elements on the page - you'll see them highlight. Click one.

A new screenshot entry appears in the sidebar. Give it a name like "Dashboard Header" and hit Enter.

That's it. You just defined your first screenshot.

## Add a Few More

Keep going. Navigate around your app, pick elements, name them. Maybe:

- Your hero section on the landing page
- A feature card
- The navigation menu
- A settings panel

Each click adds another entry to your config. The sidebar shows everything you've defined so far.

## Close and Capture

When you're done picking, just close the browser (or click Done). Heroshot immediately captures all your screenshots and saves them to `heroshots/`.

Check your project folder:

```
your-project/
├── .heroshot/
│   └── config.json      # Your screenshot definitions
└── heroshots/
    ├── dashboard-header-light.png
    ├── dashboard-header-dark.png
    ├── hero-section-light.png
    ├── hero-section-dark.png
    └── ...
```

Wait - light AND dark? Yes. By default, heroshot captures both color scheme variants. If your site supports `prefers-color-scheme`, you get both versions automatically.

## Update Anytime

Your app changed. Styles are different. New features. Time to update those screenshots.

```bash
npx heroshot
```

Same command. But now that you have a config, heroshot skips the browser and runs headlessly - regenerating every screenshot in seconds. No clicking, no manual work.

## Want to Change Your Definitions?

Need to add new screenshots? Remove old ones? Tweak the selectors?

```bash
npx heroshot config
```

This reopens the visual picker. Your existing screenshots are listed in the sidebar. Add new ones, delete what you don't need, adjust settings. Close when done, and heroshot captures everything fresh.

## Sites That Need Login

Here's where it gets interesting. Say your app requires authentication - you need to log in to see the dashboard.

First time you run heroshot, log in manually in the browser. Click around, pick your elements, close when done.

Heroshot encrypts and saves your browser session. Next time you run `npx heroshot`, it restores that session automatically. Your headless captures are already authenticated - no flaky login scripts, no environment variables with credentials.

The session is stored in `.heroshot/session.enc`. It's encrypted with a key derived from your machine, so it only works locally. For CI, you'll export a session key (covered in [Automated Updates](/docs/guide/automated-updates)).

## What's in the Config?

Here's what `.heroshot/config.json` looks like after picking a few elements:

```json
{
  "outputDirectory": "heroshots",
  "screenshots": [
    {
      "id": "a1b2c3d4",
      "name": "Dashboard Header",
      "url": "http://localhost:3000/dashboard",
      "selector": "header.main-header"
    },
    {
      "id": "e5f6g7h8",
      "name": "Hero Section",
      "url": "http://localhost:3000",
      "selector": ".hero"
    }
  ]
}
```

The visual picker generates this for you. But it's just JSON - you can edit it by hand if you prefer. Add padding, change selectors, set viewport sizes. See [Configuration](/docs/config) for all the options.

## Light Mode, Dark Mode, or Both

By default, heroshot captures both `-light.png` and `-dark.png` variants. This is great if your site has themes.

Want only one? Open Settings in the toolbar (gear icon) and set Color Scheme to "Light" or "Dark".

Or edit the config directly:

```json
{
  "browser": {
    "colorScheme": "light"
  }
}
```

## Different Viewport Sizes

Need desktop, tablet, and mobile versions? Add a `viewports` array to any screenshot:

```json
{
  "name": "Hero Section",
  "url": "http://localhost:3000",
  "selector": ".hero",
  "viewports": ["desktop", "tablet", "mobile"]
}
```

This generates:

- `hero-section-desktop-light.png`
- `hero-section-desktop-dark.png`
- `hero-section-tablet-light.png`
- `hero-section-tablet-dark.png`
- `hero-section-mobile-light.png`
- `hero-section-mobile-dark.png`

Six screenshots from one config entry.

## Full Page Screenshots

Don't specify a selector, and heroshot captures the entire scrollable page:

```json
{
  "name": "Full Landing Page",
  "url": "http://localhost:3000"
}
```

Useful for long-form pages where you want the whole thing.

## Quick One-Off Captures

Sometimes you just want a quick screenshot without setting up config. Use the URL directly:

```bash
npx heroshot https://example.com
npx heroshot https://example.com --selector ".hero"
npx heroshot https://example.com --selector "nav" --mobile --dark
```

These don't touch your config - just quick captures to stdout or a file. See [CLI Reference](/docs/cli) for all the flags.

## What's Next

You've got the basics. From here:

- **[Automated Updates](/docs/guide/automated-updates)** - Set up CI to keep screenshots fresh automatically
- **[Configuration](/docs/config)** - All the options: padding, masking, scroll position, text overrides
- **[CLI Reference](/docs/cli)** - Every command and flag
- **[Integrations](/docs/integrations/vitepress)** - VitePress, Docusaurus, MkDocs, and more
