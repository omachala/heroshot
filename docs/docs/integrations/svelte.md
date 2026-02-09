---
title: Svelte Screenshot Integration
description: Use Heroshot with Svelte. Auto-refresh screenshots in dev mode with the Vite plugin integration.
---

# Svelte

[Svelte](https://svelte.dev/) apps typically use Vite as their build tool. Heroshot provides a native Svelte component and Vite plugin that work together.

::: tip Using SvelteKit?
See the [SvelteKit integration](/docs/integrations/sveltekit) instead - it's the same component with SSR support.
:::

## Getting Started

Install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your dev server (`npm run dev`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

Vite serves anything in `public/` at the root URL. Set your heroshot output directory to `public/heroshots` so screenshots are served as `/heroshots/whatever.png`:

```json
// .heroshot/config.json
{
  "outputDirectory": "public/heroshots"
}
```

## Setting Up the Plugin

Add the Vite plugin to your config:

```ts
// vite.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { heroshot } from 'heroshot/plugins/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte(), heroshot()],
});
```

That's it. The plugin auto-registers the manifest when you import the `<Heroshot>` component.

## Using Screenshots

Use the `<Heroshot>` component in any Svelte file:

```svelte
<script>
  import { Heroshot } from 'heroshot/svelte';
</script>

<Heroshot name="Dashboard" alt="Dashboard overview" />
```

The component handles:

- **Light/dark mode** - Automatically switches based on your app's theme
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default

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
