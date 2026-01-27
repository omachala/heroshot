---
title: Vue Screenshot Component
description: Use Heroshot with Vue. The Heroshot component for automatic light/dark mode and responsive screenshots.
---

title: Vue Screenshot Component

# Vue

Vue apps using Vite can use the `<Heroshot>` component to render screenshots with automatic light/dark mode and viewport switching.

## Component Setup

Install heroshot:

```bash
npm install heroshot
```

### Vite Plugin Setup

Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  plugins: [vue(), heroshot()],
});
```

Import the virtual manifest in your app entry:

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import 'virtual:heroshot-manifest'; // Auto-registers manifest

createApp(App).mount('#app');
```

::: tip TypeScript support
Add `"heroshot/virtual"` to your `tsconfig.json` types:

```json
{
  "compilerOptions": {
    "types": ["heroshot/virtual"]
  }
}
```

:::

### Manual Setup (No Plugin)

If you prefer not to use the plugin, pass the manifest directly:

```vue
<script setup lang="ts">
import { Heroshot } from 'heroshot/vue';
import manifest from './.heroshot/config.json';
</script>

<template>
  <Heroshot name="dashboard" alt="Dashboard" :manifest="manifest" />
</template>
```

## Using the Component

Import and use the component anywhere:

```vue
<script setup lang="ts">
import { Heroshot } from 'heroshot/vue';
</script>

<template>
  <article>
    <h1>Dashboard Overview</h1>
    <Heroshot name="dashboard" alt="Dashboard showing key metrics" />
  </article>
</template>
```

The component handles everything:

- **Light/dark mode** - Automatically switches based on your app's theme (detects `.dark` class or `prefers-color-scheme`)
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default

### Props

| Prop    | Type     | Description                                     |
| ------- | -------- | ----------------------------------------------- |
| `name`  | `string` | Screenshot name (as defined in heroshot config) |
| `alt`   | `string` | Alt text for accessibility                      |
| `class` | `string` | CSS class to apply to the image                 |

## Where to Put Screenshots

For Vite projects, put screenshots in `public/`:

```
my-app/
├── public/
│   └── heroshots/    # heroshot outputs here
├── src/
│   ├── App.vue
│   └── main.ts
├── vite.config.ts
└── package.json
```

Set the output directory in heroshot config:

```json
{
  "outputDirectory": "public/heroshots"
}
```

Reference them as `/heroshots/dashboard.png` in your app.

## VitePress

For VitePress docs sites, see the [VitePress integration](/docs/integrations/vitepress) - it uses the same Vue component but with VitePress-specific setup.

## Dark Mode Detection

The component detects dark mode by checking:

1. **`.dark` class** - Used by Tailwind, VitePress, and many Vue UI libraries (`<html class="dark">`)
2. **`prefers-color-scheme`** - Browser/OS preference

It watches for changes via MutationObserver and media query listeners, so theme toggles work instantly.

## Example: Feature Showcase

```vue
<script setup lang="ts">
import { Heroshot } from 'heroshot/vue';

const features = [
  { name: 'visual-picker', title: 'Visual Picker', desc: 'Point and click to select elements' },
  { name: 'dark-mode', title: 'Dark Mode', desc: 'Captures both themes automatically' },
  { name: 'viewports', title: 'Viewports', desc: 'Desktop, tablet, mobile variants' },
];
</script>

<template>
  <div class="grid grid-cols-3 gap-6">
    <div v-for="feature in features" :key="feature.name" class="text-center">
      <Heroshot :name="feature.name" :alt="feature.title" class="rounded-lg shadow" />
      <h3>{{ feature.title }}</h3>
      <p>{{ feature.desc }}</p>
    </div>
  </div>
</template>
```

## Nuxt

For Nuxt apps, the setup is similar. Add the Vite plugin to your `nuxt.config.ts`:

```ts
// nuxt.config.ts
import { heroshot } from 'heroshot/plugins/vite';

export default defineNuxtConfig({
  vite: {
    plugins: [heroshot()],
  },
});
```

Then import the manifest in a plugin:

```ts
// plugins/heroshot.client.ts
import 'virtual:heroshot-manifest';

export default defineNuxtPlugin(() => {});
```

The component works the same way in your Nuxt pages and components.
