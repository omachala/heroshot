---
description: Use Heroshot with VitePress. Auto-refresh screenshots in dev mode with the Vite plugin integration.
---

# VitePress

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/vitepress) - a minimal setup you can clone and run.

[VitePress](https://vitepress.dev/) is what I use for this very documentation site, so it's the integration I know best. If you're using VitePress, you're in good company.

## Getting Started

First, install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your VitePress dev server (`npm run docs:dev`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done. Heroshot saves a config and outputs screenshots.

## Where to Put Screenshots

VitePress serves anything in `public/` at the root URL. Put screenshots in `public/heroshots/` and reference them as `/heroshots/whatever.png`.

```
my-docs/
├── .vitepress/
│   └── config.ts
├── public/
│   └── heroshots/    # heroshot outputs here
├── guide/
│   └── getting-started.md
└── package.json
```

Set the output directory in heroshot's toolbar (Settings), or edit `.heroshot/config.json`:

```json
{
  "outputDirectory": "public/heroshots"
}
```

::: tip
If your VitePress site lives in a subdirectory (like `docs/`), use the full path: `docs/public/heroshots/`
:::

## Using Screenshots

Standard markdown works fine:

```md
![Dashboard overview](/screenshots/dashboard.png)
```

For light/dark mode and responsive variants, heroshot provides a `<Heroshot>` component that handles everything automatically:

```md
<Heroshot name="Dashboard" alt="Dashboard overview" />
```

### Setting Up the Plugin

Add the plugin to your VitePress config:

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress';
import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  vite: {
    plugins: [heroshot()],
  },
});
```

Register the component in your theme:

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { Heroshot } from 'heroshot/vitepress';
import 'virtual:heroshot-manifest'; // Auto-registers manifest

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Heroshot', Heroshot);
  },
} satisfies Theme;
```

Now use it anywhere:

```md
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

## Real-World Example

This documentation site uses heroshot. Check out the [actual config](https://github.com/omachala/heroshot/blob/main/docs/.heroshot/config.json) to see how it's set up.
