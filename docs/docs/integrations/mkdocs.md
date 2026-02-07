---
title: MkDocs Screenshot Integration
description: Use Heroshot with MkDocs and Material theme. Generate theme-aware screenshots for Python documentation.
---

# MkDocs

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/mkdocs) - a minimal setup you can clone and run.

[MkDocs](https://www.mkdocs.org/) is huge in the Python world. If you're using the [Material theme](https://squidfunk.github.io/mkdocs-material/), the heroshot macro generates Material's theme-aware syntax automatically.

## Getting Started

First, install heroshot:

```bash
pip install heroshot
```

Then run it (requires Node.js):

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your MkDocs dev server (`mkdocs serve`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

MkDocs serves everything from `docs/`. Put screenshots in `docs/heroshots/`:

```
my-project/
├── docs/
│   ├── index.md
│   └── heroshots/    # heroshot outputs here
├── mkdocs.yml
└── requirements.txt
```

Set the output directory in heroshot's toolbar (Settings), or edit `.heroshot/config.json`:

```json
{
  "outputDirectory": "docs/heroshots"
}
```

## Setting Up the Macro

Add the macro module to your `mkdocs.yml`:

```yaml
plugins:
  - macros:
      modules: [heroshot]
```

::: v-pre
Then use the macro in your markdown:

```jinja
{{ heroshot("dashboard", "Dashboard overview") }}
```

The macro expands to Material's `#only-light` / `#only-dark` syntax - theme switching works automatically.

For screenshots without theme variants, use `heroshot_single`:

```jinja
{{ heroshot_single("architecture", "System architecture") }}
```

:::
