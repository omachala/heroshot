---
title: Docusaurus Screenshot Integration
description: Use Heroshot with Docusaurus. Auto-refresh screenshots with the Docusaurus plugin integration.
---

# Docusaurus

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/docusaurus) - a minimal setup you can clone and run.

[Docusaurus](https://docusaurus.io/) is Meta's documentation framework. It's React-based and uses MDX.

## Getting Started

First, install heroshot:

```bash
npm install heroshot
```

Then run it:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Docusaurus dev server (`npm start`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

Docusaurus serves static files from `static/`. Put screenshots in `static/heroshots/`:

```
my-website/
├── docs/
│   └── intro.md
├── static/
│   └── heroshots/    # heroshot outputs here
├── docusaurus.config.js
└── package.json
```

Set the output directory in heroshot's toolbar (Settings), or edit `.heroshot/config.json`:

```json
{
  "outputDirectory": "static/heroshots"
}
```

## Setting Up the Plugin

Add the plugin to your Docusaurus config:

```js
// docusaurus.config.js
const { heroshot } = require('heroshot/plugins/docusaurus');

module.exports = {
  plugins: [heroshot()],
  // ... rest of your config
};
```

Then use the component in your MDX:

```mdx
import { Heroshot } from 'heroshot/docusaurus';

<Heroshot name="Dashboard" alt="Dashboard overview" />
```

The plugin auto-registers the manifest - no manual setup needed.
