---
title: Next.js Screenshot Integration
description: Use Heroshot with Next.js. Display theme-aware screenshots with the Heroshot React component.
---

# Next.js

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/nextjs) - a minimal setup you can clone and run.

[Next.js](https://nextjs.org/) is the most popular React meta-framework. Heroshot provides a `<Heroshot>` component with `'use client'` directive built-in, plus a config wrapper for webpack-based builds.

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

Next.js serves anything in `public/` at the root URL. Put screenshots in `public/heroshots/` and reference them as `/heroshots/whatever.png`.

```
my-app/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── heroshots/    # heroshot outputs here
├── next.config.js
└── package.json
```

Set the output directory in heroshot config:

```json
{
  "outputDirectory": "public/heroshots"
}
```

## Using Screenshots

### webpack Mode

For Next.js projects using webpack (the default before Next.js 15, or with `--webpack` flag), use the `withHeroshot()` config wrapper:

```js
// next.config.js
const { withHeroshot } = require('heroshot/plugins/next');

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withHeroshot(nextConfig);
```

Then use the component in any page:

```tsx
import { Heroshot } from 'heroshot/next';

export default function Page() {
  return <Heroshot name="Dashboard" alt="Dashboard overview" />;
}
```

The `heroshot/next` entry point includes the `'use client'` directive automatically, so it works in both App Router (Server Components) and Pages Router.

### Turbopack Mode

Next.js 15+ uses Turbopack by default for development. The `withHeroshot()` webpack callback doesn't run with Turbopack. Instead, use manual manifest setup:

```tsx
// app/providers.tsx
'use client';

import { setManifest } from 'heroshot/next';
import { configToManifest } from 'heroshot';
import config from '../.heroshot/config.json';

setManifest(configToManifest(config));

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Then use `<Heroshot>` as normal in any page.

## Dark Mode Detection

The component detects dark mode in this order:

1. **`data-theme` attribute** - Used by some Next.js themes
2. **`.dark` class** - Used by Tailwind, next-themes, and many UI libraries
3. **`prefers-color-scheme`** - Browser/OS preference

It watches for changes via MutationObserver, so theme toggles with [next-themes](https://github.com/pacocoursey/next-themes) work instantly.

## Props

| Prop        | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `name`      | `string` | Screenshot name (as defined in heroshot config) |
| `alt`       | `string` | Alt text for accessibility                      |
| `className` | `string` | CSS class to apply to the image                 |

## React Component

For plain React apps (not Next.js), see the [React integration](/docs/integrations/react) - it uses the same component but without the `'use client'` directive.
