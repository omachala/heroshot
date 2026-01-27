---
title: React Screenshot Component
description: Use Heroshot with React. The Heroshot component for automatic light/dark mode and responsive screenshots.
---

title: React Screenshot Component

# React

React apps using Vite or webpack can use the `<Heroshot>` component to render screenshots with automatic light/dark mode and viewport switching.

## Component Setup

Install heroshot:

```bash
npm install heroshot
```

### Vite Plugin Setup

If you're using Vite, add the plugin to your config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  plugins: [react(), heroshot()],
});
```

Then import the virtual manifest in your app entry:

```tsx
// main.tsx or App.tsx
import 'virtual:heroshot-manifest'; // Auto-registers manifest
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

### Manual Setup (No Plugin)

If you're not using Vite, wrap your app with `HeroshotProvider`:

```tsx
import { HeroshotProvider } from 'heroshot/react';
import manifest from './.heroshot/config.json';

function App() {
  return <HeroshotProvider manifest={manifest}>{/* Your app */}</HeroshotProvider>;
}
```

::: tip Docusaurus
Docusaurus uses webpack, not Vite. See the [Docusaurus integration](/docs/integrations/docusaurus) for webpack-based setup.
:::

## Using the Component

Import and use the component anywhere:

```tsx
import { Heroshot } from 'heroshot/react';

function DocsPage() {
  return (
    <article>
      <h1>Dashboard Overview</h1>
      <Heroshot name="dashboard" alt="Dashboard showing key metrics" />
    </article>
  );
}
```

The component handles everything:

- **Light/dark mode** - Automatically switches based on your app's theme (detects `data-theme="dark"`, `.dark` class, or `prefers-color-scheme`)
- **Responsive viewports** - Uses `<picture>` with media queries when you have multiple viewport variants
- **Lazy loading** - Images load lazily by default

### Props

| Prop        | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `name`      | `string` | Screenshot name (as defined in heroshot config) |
| `alt`       | `string` | Alt text for accessibility                      |
| `className` | `string` | CSS class to apply to the image                 |

## Where to Put Screenshots

For Vite projects, put screenshots in `public/`:

```
my-app/
├── public/
│   └── heroshots/    # heroshot outputs here
├── src/
│   └── App.tsx
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

## Dark Mode Detection

The component detects dark mode in this order:

1. **`data-theme` attribute** - Used by Docusaurus (`<html data-theme="dark">`)
2. **`.dark` class** - Used by Tailwind and many UI libraries (`<html class="dark">`)
3. **`prefers-color-scheme`** - Browser/OS preference

It also watches for changes, so theme toggles work instantly without page reload.

## Example: Image Gallery

```tsx
import { Heroshot } from 'heroshot/react';

const screenshots = ['dashboard', 'settings', 'profile', 'analytics'];

function ScreenshotGallery() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {screenshots.map(name => (
        <Heroshot
          key={name}
          name={name}
          alt={`${name} screenshot`}
          className="rounded-lg shadow-md"
        />
      ))}
    </div>
  );
}
```
