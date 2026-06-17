# Next.js + Heroshot Example

Minimal Next.js setup with heroshot integration.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## What's Included

- `heroshot/plugins/next` - Auto-loads manifest via webpack
- `heroshot/next` - `<Heroshot>` React component with `'use client'` directive
- Theme-aware screenshots (toggle dark mode to see it switch)

## Turbopack Mode

This example uses the `withHeroshot()` webpack config wrapper. For Turbopack mode (`next dev --turbopack`), see the [Next.js integration docs](https://heroshot.dev/docs/integrations/nextjs) for manual setup.

## Capture Screenshots

```bash
npx heroshot
```
