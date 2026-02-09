---
title: SvelteKit Screenshot Integration
description: Use Heroshot with SvelteKit. Auto-refresh screenshots in dev mode with the Vite plugin integration.
---

# SvelteKit

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/sveltekit) - a minimal setup you can clone and run.

[SvelteKit](https://kit.svelte.dev/) is the full-stack framework for Svelte. Heroshot provides a native Svelte component that works with SvelteKit's Vite-based build system - including SSR, which is nice.

## Getting Started

Install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your SvelteKit dev server (`npm run dev`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

SvelteKit serves anything in `static/` at the root URL. Put screenshots in `static/heroshots/` and reference them as `/heroshots/whatever.png`.

```
my-app/
├── src/
│   └── routes/
│       ├── +layout.svelte
│       └── +page.svelte
├── static/
│   └── heroshots/    # heroshot outputs here
├── svelte.config.js
├── vite.config.ts
└── package.json
```

Set the output directory in heroshot config:

```json
{
  "outputDirectory": "static/heroshots"
}
```

## Setting Up the Plugin

Two things to wire up: the Vite plugin and the manifest import.

Add the Vite plugin to your config:

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { heroshot } from 'heroshot/plugins/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), heroshot()],
});
```

Then import the virtual manifest in your root layout - this registers your screenshots globally so the component can find them:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import 'virtual:heroshot-manifest';

  let { children } = $props();
</script>

{@render children()}
```

::: tip TypeScript support
Add `"heroshot/virtual"` to your `tsconfig.json` types for autocomplete:

```json
{
  "compilerOptions": {
    "types": ["heroshot/virtual"]
  }
}
```

:::

## Using Screenshots

Standard HTML works fine for simple cases:

```svelte
<img src="/heroshots/dashboard-light.png" alt="Dashboard overview" />
```

For light/dark mode and responsive variants, use the `<Heroshot>` component - it handles everything automatically:

```svelte
<script>
  import { Heroshot } from 'heroshot/sveltekit';
</script>

<Heroshot name="Dashboard" alt="Dashboard overview" />
```

The component handles:

- **Light/dark mode** - Automatically switches based on your app's theme
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default
- **SSR** - Renders the correct image on the server, no flash of wrong content

### Props

| Prop    | Type     | Description                                     |
| ------- | -------- | ----------------------------------------------- |
| `name`  | `string` | Screenshot name (as defined in heroshot config) |
| `alt`   | `string` | Alt text for accessibility                      |
| `class` | `string` | CSS class to apply to the image                 |

## Dark Mode Detection

The component detects dark mode by checking:

1. **`.dark` class** - Used by Tailwind, mode-watcher, and many Svelte UI libraries (`<html class="dark">`)
2. **`prefers-color-scheme`** - Browser/OS preference

It watches for changes via MutationObserver and media query listeners, so theme toggles work instantly.

## Manual Setup (No Plugin)

If you prefer not to use the Vite plugin, you can call `setManifest` directly. You'll need to transform the config into the manifest format yourself:

```svelte
<script>
  import { Heroshot, setManifest } from 'heroshot/sveltekit';

  setManifest({
    version: 1,
    outputDirectory: '/heroshots',
    screenshots: {
      Dashboard: { slug: 'dashboard', viewports: [], colorSchemes: ['light', 'dark'], format: 'png' },
    },
  });
</script>

<Heroshot name="Dashboard" alt="Dashboard" />
```

The plugin approach is easier - it reads your `.heroshot/config.json` and handles the transformation automatically.

## Svelte Component

For plain Svelte apps (not SvelteKit), import from `heroshot/svelte` instead. The component is the same, just the import path differs:

```svelte
<script>
  import { Heroshot } from 'heroshot/svelte';
</script>

<Heroshot name="Dashboard" alt="Dashboard" />
```
