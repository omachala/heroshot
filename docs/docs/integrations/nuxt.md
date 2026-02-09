---
title: Nuxt Screenshot Integration
description: Use Heroshot with Nuxt. Auto-refresh screenshots in dev mode with the Vite plugin integration.
---

# Nuxt

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/nuxt) - a minimal setup you can clone and run.

[Nuxt](https://nuxt.com/) is the full-stack framework for Vue. Since Nuxt uses Vite under the hood, the existing Vue component and Vite plugin work with a bit of wiring.

## Getting Started

Install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Nuxt dev server (`npm run dev`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

Nuxt serves anything in `public/` at the root URL. Put screenshots in `public/heroshots/` and reference them as `/heroshots/whatever.png`.

```
my-app/
├── pages/
│   └── index.vue
├── plugins/
│   └── heroshot.ts
├── public/
│   └── heroshots/    # heroshot outputs here
├── nuxt.config.ts
└── package.json
```

Set the output directory in heroshot config:

```json
{
  "outputDirectory": "public/heroshots"
}
```

## Setting Up the Plugin

Two things: the Vite plugin in your Nuxt config, and a Nuxt plugin to register the manifest.

Add the Vite plugin to your Nuxt config:

```ts
// nuxt.config.ts
import { heroshot } from 'heroshot/plugins/vite';

export default defineNuxtConfig({
  vite: {
    plugins: [heroshot()],
    optimizeDeps: {
      exclude: ['heroshot'],
    },
  },
});
```

::: tip Why `optimizeDeps.exclude`?
Vite pre-bundles dependencies for faster dev startup. This can split heroshot's manifest store into separate copies, breaking the connection between the plugin and component. Excluding heroshot keeps everything in one module.
:::

Then create a Nuxt plugin to import the manifest. This runs on both server and client, so SSR works correctly:

```ts
// plugins/heroshot.ts
import 'virtual:heroshot-manifest';

export default defineNuxtPlugin(() => {});
```

That's it. The manifest gets registered before any page component renders.

## Using Screenshots

Import and use the component in any page or component:

```vue
<script setup>
import { Heroshot } from 'heroshot/nuxt';
</script>

<template>
  <Heroshot name="Dashboard" alt="Dashboard overview" />
</template>
```

The component handles everything:

- **Light/dark mode** - Automatically switches based on your app's theme
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default
- **SSR** - Renders the correct image on the server, no hydration mismatches

### Props

| Prop    | Type     | Description                                     |
| ------- | -------- | ----------------------------------------------- |
| `name`  | `string` | Screenshot name (as defined in heroshot config) |
| `alt`   | `string` | Alt text for accessibility                      |
| `class` | `string` | CSS class to apply to the image                 |

## Dark Mode Detection

The component detects dark mode by checking:

1. **`.dark` class** - Used by Nuxt Color Mode (`@nuxtjs/color-mode`), Tailwind, and many Vue UI libraries
2. **`prefers-color-scheme`** - Browser/OS preference

Nuxt's [`@nuxtjs/color-mode`](https://color-mode.nuxtjs.org/) module sets `class="dark"` on `<html>` by default, which works out of the box.

## Vue Component

For plain Vue apps (not Nuxt), see the [Vue integration](/docs/integrations/vue) - it uses the same component with the same Vite plugin.
