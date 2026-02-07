---
title: Sphinx Documentation Screenshots
description: Use Heroshot with Sphinx documentation. Theme-aware screenshots that switch with Furo, PyData, and other dark mode themes.
---

# Sphinx

> Want to see it working? Check out the [full example on GitHub](https://github.com/omachala/heroshot/tree/main/integrations/examples/sphinx) - a minimal Furo setup you can clone and run.

[Sphinx](https://www.sphinx-doc.org/) is what Python itself uses for documentation. If you're documenting a serious Python library, chances are you're using Sphinx. The heroshot extension gives you a `.. heroshot::` directive that handles theme switching automatically - just drop it in and it works with Furo, PyData, and anything that uses `prefers-color-scheme`.

## Getting Started

Install heroshot with Sphinx support:

```bash
pip install heroshot[sphinx]
```

Then run it (requires Node.js):

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Sphinx dev server (I'd recommend `sphinx-autobuild`), navigate to it in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

Sphinx serves static assets from `_static/`. Put screenshots in `_static/heroshots/`:

```
my-project/
├── docs/
│   ├── conf.py
│   ├── index.rst
│   └── _static/
│       └── heroshots/    # heroshot outputs here
├── Makefile
└── requirements.txt
```

Set the output directory in heroshot's toolbar (Settings), or edit `.heroshot/config.json`:

```json
{
  "outputDirectory": "docs/_static/heroshots"
}
```

## Setting Up the Extension

Add `heroshot.sphinx` to your extensions in `conf.py`:

```python
extensions = ['heroshot.sphinx']
```

That's it. The extension registers the directive and injects the CSS for theme switching.

## Using the Directive

Basic theme-aware screenshot in RST:

```rst
.. heroshot:: dashboard
   :alt: Dashboard overview
```

This renders both light and dark variants. When the user switches themes (Furo's toggle, PyData's switcher, or OS preference), the screenshot switches too.

With sizing and alignment:

```rst
.. heroshot:: sidebar
   :alt: Sidebar navigation
   :width: 400px
   :align: center
```

For screenshots without theme variants, use `heroshot-single`:

```rst
.. heroshot-single:: architecture
   :alt: System architecture diagram
   :width: 600px
```

## MyST Markdown

If you're using [MyST Parser](https://myst-parser.readthedocs.io/) for Markdown in Sphinx, the directive works the same way:

````md
```{heroshot} dashboard
:alt: Dashboard overview
```
````

Or without theme variants:

````md
```{heroshot-single} architecture
:alt: System architecture
:width: 600px
```
````

## Responsive Viewports

If you've captured multiple viewport sizes, pass them as a comma-separated list:

```rst
.. heroshot:: hero
   :alt: Hero section
   :viewports: mobile, tablet, desktop
```

This generates a `<picture>` element with media queries - the browser picks the right size automatically. Each viewport also gets light/dark variants, so you get full theme + responsive coverage.

## Theme Support

The extension works with any Sphinx theme that supports dark mode:

**Furo** - Uses `data-theme` attribute. The most popular modern Sphinx theme with built-in dark mode toggle. Works out of the box.

**PyData Sphinx Theme** - Used by NumPy, Pandas, and the scientific Python ecosystem. Also uses `data-theme`. Works out of the box.

**Read the Docs Theme** - The classic. Doesn't have a dark mode toggle, so only light screenshots are shown. You can still use `heroshot-single` for these projects.

**Any theme with `prefers-color-scheme`** - If the theme respects the OS dark mode preference, heroshot picks up on that automatically.

## Configuration

You can customize paths and naming in `conf.py`:

```python
extensions = ['heroshot.sphinx']

# All optional - these are the defaults:
heroshot_path = '_static/heroshots'    # where screenshots live
heroshot_light_suffix = '-light'       # suffix for light variants
heroshot_dark_suffix = '-dark'         # suffix for dark variants
heroshot_format = 'png'                # image format
```

## Development Workflow

For local development, I'd recommend two terminals:

```bash
# Terminal 1 - live-reloading Sphinx
pip install sphinx-autobuild
sphinx-autobuild docs docs/_build/html
```

```bash
# Terminal 2 - capture screenshots
npx heroshot
```

Navigate to `http://localhost:8000` in the heroshot browser, capture what you need. The screenshots land in `_static/heroshots/` and `sphinx-autobuild` picks them up.

## Makefile Target

Most Sphinx projects already have a Makefile. Add a target for screenshots:

```makefile
screenshots:
	npx heroshot sync

.PHONY: screenshots
```

Then just:

```bash
make screenshots
```
