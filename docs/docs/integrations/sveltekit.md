---
title: SvelteKit Screenshot Integration
description: Use Heroshot with SvelteKit. Auto-refresh screenshots in dev mode with the Vite plugin integration.
---

# SvelteKit

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/sveltekit) - a minimal setup you can clone and run.

[SvelteKit](https://kit.svelte.dev/) is the full-stack framework for Svelte. Heroshot provides a native Svelte component and works with SvelteKit's Vite-based build system out of the box.

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
│       └── +page.svelte
├── static/
│   └── heroshots/    # heroshot outputs here
├── svelte.config.js
└── package.json
```

Set the output directory in heroshot config:

```json
{
  "outputDirectory": "static/heroshots"
}
```

## Using Screenshots

Standard HTML works fine:

```svelte
<img src="/heroshots/dashboard-light.png" alt="Dashboard overview" />
```

For light/dark mode and responsive variants, heroshot provides a `<Heroshot>` component that handles everything automatically:

```svelte
<Heroshot name="Dashboard" alt="Dashboard overview" />
```

### Setting Up the Plugin

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

Import the virtual manifest in your layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import 'virtual:heroshot-manifest';

  let { children } = $props();
</script>

{@render children()}
```

Now use the component anywhere:

```svelte
<script>
  import { Heroshot } from 'heroshot/sveltekit';
</script>

<Heroshot name="Dashboard" alt="Dashboard overview" />
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

## Dark Mode Detection

The component detects dark mode by checking:

1. **`.dark` class** - Used by Tailwind, mode-watcher, and many Svelte UI libraries (`<html class="dark">`)
2. **`prefers-color-scheme`** - Browser/OS preference

It watches for changes via MutationObserver and media query listeners, so theme toggles work instantly.

## Manual Setup (No Plugin)

If you prefer not to use the plugin, pass the manifest directly:

```svelte
<script>
  import { Heroshot, setManifest } from 'heroshot/sveltekit';
  import config from '../../.heroshot/config.json';

  // You'd need to transform config to manifest format
  // or use the plugin which does this automatically
</script>

<Heroshot name="dashboard" alt="Dashboard" />
```

## Svelte Component

For plain Svelte apps (not SvelteKit), see the same component under `heroshot/svelte`. The setup is identical but uses a standard Vite config instead of SvelteKit's.
