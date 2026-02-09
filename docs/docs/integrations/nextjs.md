---
title: Next.js Screenshot Integration
description: Use Heroshot with Next.js. Display theme-aware screenshots with the Heroshot React component.
---

# Next.js

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/nextjs) - a minimal setup you can clone and run.

[Next.js](https://nextjs.org/) is the most popular React meta-framework. Heroshot provides a `<Heroshot>` component with `'use client'` built in, plus a config wrapper that handles everything behind the scenes.

## Getting Started

Install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Next.js dev server (`npm run dev`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

Next.js serves anything in `public/` at the root URL. Set your heroshot output directory to `public/heroshots` so screenshots are served as `/heroshots/whatever.png`:

```json
// .heroshot/config.json
{
  "outputDirectory": "public/heroshots"
}
```

## Setting Up

Add the `withHeroshot()` wrapper to your Next.js config:

```tsx
// next.config.mjs
import { withHeroshot } from 'heroshot/plugins/next';

export default withHeroshot({});
```

That's it. The wrapper reads your `.heroshot/config.json` and makes the manifest available to the component automatically.

## Using Screenshots

Use the component in any page or component:

```tsx
import { Heroshot } from 'heroshot/next';

export default function Page() {
  return <Heroshot name="Dashboard" alt="Dashboard overview" />;
}
```

The `heroshot/next` entry point includes the `'use client'` directive automatically, so it works in both App Router and Pages Router.

The component handles:

- **Light/dark mode** - Automatically switches based on your app's theme
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default

### Props

| Prop        | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `name`      | `string` | Screenshot name (as defined in heroshot config) |
| `alt`       | `string` | Alt text for accessibility                      |
| `className` | `string` | CSS class to apply to the image                 |

## Turbopack

Next.js 15+ uses Turbopack by default for development. The `withHeroshot()` webpack callback doesn't run with Turbopack, so you'll need to register the manifest manually. Add this to any file that runs before your pages (e.g. your layout):

```tsx
// app/layout.tsx
import { setManifest } from 'heroshot/next';
import { configToManifest } from 'heroshot';
import config from '../.heroshot/config.json';

setManifest(configToManifest(config));
```

Then use `<Heroshot>` as normal. Everything else stays the same.

::: tip
If you're using `next dev --webpack` (opting back into webpack), the automatic setup works fine — no manual registration needed.
:::

## Dark Mode Detection

The component detects dark mode in this order:

1. **`data-theme` attribute** - Used by some Next.js themes
2. **`.dark` class** - Used by Tailwind, next-themes, and many UI libraries
3. **`prefers-color-scheme`** - Browser/OS preference

It watches for changes via MutationObserver, so theme toggles with [next-themes](https://github.com/pacocoursey/next-themes) work instantly.

## React Component

For plain React apps (not Next.js), see the [React integration](/docs/integrations/react) - it uses the same component but without the `'use client'` directive.
